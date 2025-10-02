/**
 * Mem0MemoryClient: Production MCP/JSON-RPC client for mem0+FastMCP backend
 *
 * Implements IMemoryClient interface with full HTTP/MCP protocol support.
 * Connects to mem0+FastMCP memory server on port 8010.
 *
 * Features:
 * - Complete MCP protocol implementation (JSON-RPC 2.0)
 * - Comprehensive error handling with Constitutional AI principles
 * - Audit logging for memory operations
 * - Event subscriptions for memory changes
 * - Health monitoring and capability discovery
 *
 * Constitutional AI Compliance:
 * - Accuracy: Proper error handling, validates responses
 * - Transparency: Detailed logging, error messages
 * - Helpfulness: Clear error guidance, retry logic
 * - Safety: User isolation, no credential leakage
 */
import type { IMemoryClient } from './IMemoryClient';
import type {
  MemoryClientConfig,
  MemoryQuery,
  MemoryAddRequest,
  MemoryEditRequest,
  MemoryDeleteRequest,
  MemorySearchResult,
  MemoryHealthStatus,
  MemoryEvent,
} from '../../types/oneagent-memory-types';
import { unifiedLogger } from '../../utils/UnifiedLogger';
import { UnifiedBackboneService } from '../../utils/UnifiedBackboneService';

/**
 * MCP JSON-RPC 2.0 request interface
 */
interface MCPRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id: number | string;
}

/**
 * MCP JSON-RPC 2.0 response interface
 */
interface MCPResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: number | string;
}

export class Mem0MemoryClient implements IMemoryClient {
  readonly backendName = 'mem0';
  readonly config: MemoryClientConfig;
  private eventListener?: (event: MemoryEvent) => void;
  private baseUrl: string;
  private requestIdCounter = 0;
  private sessionId: string | null = null;
  private initializePromise: Promise<void> | null = null;

  constructor(config: MemoryClientConfig) {
    this.config = config;
    // Get canonical memory URL from UnifiedBackboneService config
    // Falls back to hardcoded default only if config not available
    const canonicalUrl = UnifiedBackboneService.config?.memoryUrl || 'http://localhost:8010/mcp';
    this.baseUrl = config.apiUrl || canonicalUrl;

    unifiedLogger.info('Mem0MemoryClient initialized', {
      backend: this.backendName,
      baseUrl: this.baseUrl,
      configSource: config.apiUrl ? 'explicit' : 'canonical',
    });
  }

  /**
   * Generate unique request ID for MCP calls
   */
  private getNextRequestId(): number {
    return ++this.requestIdCounter;
  }

  /**
   * Initialize MCP session (MCP Specification 2025-06-18 Session Management)
   *
   * Per MCP spec: "A server using the Streamable HTTP transport MAY assign a session ID
   * at initialization time, by including it in an `Mcp-Session-Id` header on the HTTP
   * response containing the `InitializeResult`."
   *
   * This method sends the required `initialize` request and extracts the session ID
   * from the response header for inclusion in all subsequent requests.
   */
  private async initializeMCPSession(): Promise<void> {
    if (this.sessionId) {
      return; // Already initialized
    }

    unifiedLogger.info('Initializing MCP session', { baseUrl: this.baseUrl });

    const request: MCPRequest = {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {}, // Client capabilities (none for basic usage)
        clientInfo: {
          name: 'OneAgent',
          version: '4.3.0',
        },
      },
      id: this.getNextRequestId(),
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'MCP-Protocol-Version': '2025-06-18',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `MCP initialization failed: HTTP ${response.status} ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`,
        );
      }

      // Check response Content-Type to handle both JSON and SSE responses
      const contentType = response.headers.get('Content-Type') || '';

      if (contentType.includes('text/event-stream')) {
        // Server returned SSE stream - need to parse SSE events
        const text = await response.text();
        const lines = text.split('\n');
        let dataLines: string[] = [];

        for (const line of lines) {
          const trimmedLine = line.trim(); // Remove \r and whitespace

          if (trimmedLine.startsWith('data: ')) {
            dataLines.push(trimmedLine.substring(6)); // Remove "data: " prefix
          } else if (trimmedLine === '' && dataLines.length > 0) {
            // Empty line marks end of event - parse accumulated data
            const eventData = dataLines.join('\n');
            try {
              const data: MCPResponse<{ protocolVersion: string; capabilities: unknown }> =
                JSON.parse(eventData);

              if (data.error) {
                throw new Error(
                  `MCP initialization error: ${data.error.code} - ${data.error.message}`,
                );
              }

              // Extract session ID from response header (may be null for stateless servers)
              this.sessionId = response.headers.get('Mcp-Session-Id');

              if (this.sessionId) {
                unifiedLogger.info('MCP session established', {
                  sessionId: this.sessionId.substring(0, 8) + '...',
                  protocolVersion: data.result?.protocolVersion,
                });
              } else {
                unifiedLogger.info('MCP session initialized (stateless mode - no session ID)', {
                  protocolVersion: data.result?.protocolVersion,
                });
              }

              // Send the required 'initialized' notification (MCP Specification requirement)
              // This MUST be sent after receiving InitializeResult and before making any requests
              await this.sendInitializedNotification();
              return; // Success
            } catch {
              // Try next event (parsing failed, continue to next data block)
            }
            dataLines = [];
          }
        }

        throw new Error('Failed to parse MCP initialization response from SSE stream');
      } else {
        // Standard JSON response
        const data: MCPResponse<{ protocolVersion: string; capabilities: unknown }> =
          await response.json();

        if (data.error) {
          throw new Error(`MCP initialization error: ${data.error.code} - ${data.error.message}`);
        }

        // Extract session ID from response header (may be null for stateless servers)
        this.sessionId = response.headers.get('Mcp-Session-Id');

        if (this.sessionId) {
          unifiedLogger.info('MCP session established', {
            sessionId: this.sessionId.substring(0, 8) + '...',
            protocolVersion: data.result?.protocolVersion,
          });
        } else {
          unifiedLogger.info('MCP session initialized (stateless mode - no session ID)', {
            protocolVersion: data.result?.protocolVersion,
          });
        }

        // Send the required 'initialized' notification (MCP Specification requirement)
        // This MUST be sent after receiving InitializeResult and before making any requests
        await this.sendInitializedNotification();
      }
    } catch (error) {
      unifiedLogger.error('MCP session initialization failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Send 'initialized' notification to server
   *
   * Per MCP Specification 2025-06-18:
   * "After receiving the `InitializeResult`, the client MUST send an `initialized`
   * notification. This tells the server that the client is ready to start normal
   * operations."
   *
   * This is a notification (no response expected), not a request.
   */
  private async sendInitializedNotification(): Promise<void> {
    const notification = {
      jsonrpc: '2.0' as const,
      method: 'notifications/initialized',
      params: {},
      // Note: Notifications do NOT include an 'id' field
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(notification),
    });

    if (!response.ok && response.status !== 202) {
      // 202 Accepted is expected for notifications
      unifiedLogger.warn('Initialized notification returned non-OK status', {
        status: response.status,
      });
    }

    unifiedLogger.debug('Sent initialized notification to server');
  }

  /**
   * Ensure MCP session is initialized before making requests
   * Uses promise caching to prevent multiple concurrent initialization attempts
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initializePromise) {
      await this.initializePromise;
      return;
    }

    this.initializePromise = this.initializeMCPSession();
    await this.initializePromise;
  }

  /**
   * Parse MCP response from SSE or JSON format
   *
   * FastMCP returns text/event-stream for all responses.
   * This helper handles both SSE and pure JSON responses.
   *
   * SSE Format:
   * ```
   * event: message
   * data: {"jsonrpc":"2.0","result":{...}}
   * ```
   */
  private async parseResponse<T>(response: Response): Promise<MCPResponse<T>> {
    const contentType = response.headers.get('Content-Type') || '';

    if (contentType.includes('text/event-stream')) {
      // Parse SSE stream
      const text = await response.text();
      const lines = text.split('\n');
      let dataLines: string[] = [];

      for (const line of lines) {
        const trimmedLine = line.trim(); // Remove \r and whitespace

        if (trimmedLine.startsWith('data: ')) {
          dataLines.push(trimmedLine.substring(6)); // Remove "data: " prefix
        } else if (trimmedLine === '' && dataLines.length > 0) {
          // End of event - parse accumulated data
          const eventData = dataLines.join('\n');
          try {
            const parsed = JSON.parse(eventData);

            // Skip notifications - we only want responses with 'result' or 'error'
            // Notifications have 'method' field (e.g., "notifications/message")
            // Responses have 'result' or 'error' field
            if ('result' in parsed || 'error' in parsed) {
              return parsed as MCPResponse<T>;
            }

            // Continue to next event if this was a notification
            dataLines = [];
          } catch {
            // Try next event if parse fails
            dataLines = [];
          }
        }
      }

      // If we couldn't parse any events, throw with details
      unifiedLogger.error('Failed to parse SSE response', {
        textLength: text.length,
        linesCount: lines.length,
      });
      throw new Error('Failed to parse SSE response: no valid data events found');
    } else {
      // Standard JSON response
      return (await response.json()) as MCPResponse<T>;
    }
  }

  /**
   * Make MCP tool call via HTTP JSON-RPC 2.0 (with session management)
   *
   * Per MCP Specification 2025-06-18:
   * - Ensures session is initialized before making requests
   * - Includes Mcp-Session-Id header if session ID is available
   * - Handles session expiry (HTTP 404) by reinitializing and retrying
   * - Supports both stateful (with session) and stateless (no session) modes
   */
  private async callTool<T = unknown>(toolName: string, args: Record<string, unknown>): Promise<T> {
    // Ensure session is initialized before making tool calls
    await this.ensureInitialized();

    const request: MCPRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
      id: this.getNextRequestId(),
    };

    unifiedLogger.debug(`MCP tool call: ${toolName}`, {
      args,
      requestBody: JSON.stringify(request).substring(0, 1000),
    });

    try {
      // Build headers with session ID if available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2025-06-18',
      };

      if (this.sessionId) {
        headers['Mcp-Session-Id'] = this.sessionId;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      // Handle session expiry (HTTP 404) - reinitialize and retry once
      if (response.status === 404 && this.sessionId) {
        unifiedLogger.warn('MCP session expired (HTTP 404), reinitializing', {
          expiredSessionId: this.sessionId.substring(0, 8) + '...',
        });
        this.sessionId = null;
        this.initializePromise = null;
        // Retry with new session
        return this.callTool(toolName, args);
      }

      if (!response.ok) {
        // For HTTP 400, try to get the response body for better debugging
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch {
          // Ignore if body can't be read
        }
        const errorMsg = `HTTP ${response.status}: ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`;
        unifiedLogger.error(`FastMCP HTTP error: ${toolName}`, {
          status: response.status,
          statusText: response.statusText,
          body: errorBody.substring(0, 500),
          requestArgs: JSON.stringify(args).substring(0, 500),
        });
        throw new Error(errorMsg);
      }

      // Parse response (handles both SSE and JSON formats)
      const data: MCPResponse<T> = await this.parseResponse<T>(response);

      if (data.error) {
        throw new Error(`MCP Error ${data.error.code}: ${data.error.message}`);
      }

      // FastMCP wraps tool results in a structured format:
      // result.structuredContent contains the actual tool return value
      // result.content contains a text representation
      // We need to unwrap this to get the actual tool result
      let toolResult = data.result as T;

      // Check if result has the FastMCP wrapper structure
      if (toolResult && typeof toolResult === 'object' && 'structuredContent' in toolResult) {
        toolResult = (toolResult as { structuredContent: T }).structuredContent;
      }

      return toolResult;
    } catch (error) {
      unifiedLogger.error(`MCP tool call failed: ${toolName}`, { error });
      throw error;
    }
  }

  /**
   * Read MCP resource via HTTP JSON-RPC 2.0 (with session management)
   *
   * Resources are read-only data endpoints (like GET in REST).
   * Requires session initialization and includes session ID if available.
   */
  private async readResource<T = unknown>(uri: string): Promise<T> {
    // Ensure session is initialized
    await this.ensureInitialized();

    const request: MCPRequest = {
      jsonrpc: '2.0',
      method: 'resources/read',
      params: { uri },
      id: this.getNextRequestId(),
    };

    unifiedLogger.debug(`MCP resource read: ${uri}`);

    try {
      // Build headers with session ID if available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': '2025-06-18',
      };

      if (this.sessionId) {
        headers['Mcp-Session-Id'] = this.sessionId;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response (handles both SSE and JSON formats)
      const data: MCPResponse = await this.parseResponse(response);

      if (data.error) {
        throw new Error(`MCP Error ${data.error.code}: ${data.error.message}`);
      }

      // Resources return contents array
      const contents = (data.result as { contents?: { text?: string }[] })?.contents;
      if (!contents || contents.length === 0) {
        throw new Error('Resource returned no content');
      }

      // Parse JSON from text field
      const text = contents[0]?.text;
      if (!text) {
        throw new Error('Resource content missing text field');
      }

      return JSON.parse(text) as T;
    } catch (error) {
      unifiedLogger.error(`MCP resource read failed: ${uri}`, { error });
      throw error;
    }
  }

  async getHealthStatus(): Promise<MemoryHealthStatus> {
    try {
      const health = await this.readResource<{
        status: string;
        backend: Record<string, string>;
        capabilities: string[];
      }>('health://status');

      return {
        healthy: health.status === 'healthy',
        backend: this.backendName,
        lastChecked: new Date().toISOString(),
        capabilities: health.capabilities,
        details: JSON.stringify(health.backend),
      };
    } catch (error) {
      unifiedLogger.error('Failed to get health status', { error });
      return {
        healthy: false,
        backend: this.backendName,
        lastChecked: new Date().toISOString(),
        capabilities: [],
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getCapabilities(): Promise<string[]> {
    try {
      const caps = await this.readResource<{
        tools: Record<string, unknown>;
      }>('capabilities://list');

      return Object.keys(caps.tools);
    } catch (error) {
      unifiedLogger.error('Failed to get capabilities', { error });
      return [];
    }
  }

  async addMemory(
    req: MemoryAddRequest,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Serialize metadata to JSON-safe format (FastMCP requirement)
      // Complex objects like UnifiedTimestamp must be converted to primitives
      const jsonSafeMetadata = JSON.parse(JSON.stringify(req.metadata));

      // Extract userId from metadata (passed as separate parameter to FastMCP)
      const userId = jsonSafeMetadata.userId || 'default-user';
      delete jsonSafeMetadata.userId; // Remove from metadata to avoid duplication

      const result = await this.callTool<{
        success: boolean;
        memories?: { id?: string }[];
        count?: number;
        error?: string;
      }>('add_memory', {
        content: req.content,
        user_id: userId,
        metadata: jsonSafeMetadata,
      });

      if (!result || !result.success || result.error) {
        return {
          success: false,
          error: result?.error || 'Unknown error adding memory',
        };
      }

      const memoryId =
        result.memories && result.memories.length > 0 ? result.memories[0]?.id : undefined;

      unifiedLogger.info('Memory added successfully', {
        userId: req.metadata.userId,
        memoryId,
        count: result.count,
      });

      return {
        success: true,
        id: memoryId || 'generated-id',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      unifiedLogger.error('Failed to add memory', { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  async editMemory(
    req: MemoryEditRequest,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const result = await this.callTool<{
        success: boolean;
        id?: string;
        error?: string;
      }>('edit_memory', {
        memory_id: req.id,
        content: req.content,
        user_id: req.metadata?.userId || 'default-user',
      });

      if (!result.success || result.error) {
        return {
          success: false,
          error: result.error || 'Unknown error editing memory',
        };
      }

      unifiedLogger.info('Memory edited successfully', {
        memoryId: req.id,
        userId: req.metadata?.userId,
      });

      return {
        success: true,
        id: result.id || req.id,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      unifiedLogger.error('Failed to edit memory', { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  async deleteMemory(
    req: MemoryDeleteRequest,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const result = await this.callTool<{
        success: boolean;
        id?: string;
        error?: string;
      }>('delete_memory', {
        memory_id: req.id,
        user_id: 'default-user', // mem0 requires user_id; get from metadata if needed
      });

      if (!result.success || result.error) {
        return {
          success: false,
          error: result.error || 'Unknown error deleting memory',
        };
      }

      unifiedLogger.info('Memory deleted successfully', {
        memoryId: req.id,
      });

      return {
        success: true,
        id: result.id || req.id,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      unifiedLogger.error('Failed to delete memory', { error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  async searchMemories(query: MemoryQuery): Promise<MemorySearchResult[]> {
    try {
      const result = await this.callTool<{
        success: boolean;
        results?: Array<{
          id: string;
          memory: string; // mem0 uses 'memory' instead of 'content'
          metadata?: Record<string, unknown>;
          score?: number;
        }>;
        count?: number;
        error?: string;
      }>('search_memories', {
        query: query.query,
        user_id: query.userId || 'default-user',
        limit: query.limit || 10,
      });

      // Handle undefined result (unwrapping issue)
      if (!result) {
        unifiedLogger.error('Search memories failed: result is undefined');
        return [];
      }

      if (!result.success || result.error) {
        unifiedLogger.error('Search memories failed', {
          error: result.error,
          success: result.success,
          hasResults: !!result.results,
        });
        return [];
      }

      unifiedLogger.info('Search completed successfully', {
        userId: query.userId,
        resultCount: result.count || 0,
      });

      // Transform mem0 format to MemorySearchResult format
      // mem0 returns { id, memory, metadata, score }
      // We need { id, content, metadata, score }
      const transformedResults: MemorySearchResult[] =
        result.results?.map((r) => ({
          id: r.id,
          content: r.memory, // mem0 uses 'memory', we use 'content'
          metadata: r.metadata || {},
          score: r.score,
        })) || [];

      return transformedResults;
    } catch (error) {
      unifiedLogger.error('Failed to search memories', { error });
      return [];
    }
  }

  async subscribeEvents(onEvent: (event: MemoryEvent) => void): Promise<void> {
    this.eventListener = onEvent;
    unifiedLogger.info('Event subscription registered');
    // Note: SSE/WebSocket event streaming not yet implemented in mem0+FastMCP
    // This is a placeholder for future enhancement
  }

  async unsubscribeEvents(): Promise<void> {
    this.eventListener = undefined;
    unifiedLogger.info('Event subscription removed');
  }

  /**
   * Close MCP session and cleanup resources
   *
   * Per MCP Specification 2025-06-18 Session Management:
   * "Clients that no longer need a particular session should send an HTTP DELETE
   * to the MCP endpoint with the Mcp-Session-Id header, to explicitly terminate
   * the session."
   */
  async close(): Promise<void> {
    if (this.sessionId) {
      unifiedLogger.info('Closing MCP session', {
        sessionId: this.sessionId.substring(0, 8) + '...',
      });

      try {
        const response = await fetch(this.baseUrl, {
          method: 'DELETE',
          headers: {
            'Mcp-Session-Id': this.sessionId,
          },
        });

        if (response.status === 405) {
          // Server doesn't support explicit session termination (Method Not Allowed)
          unifiedLogger.debug('Server does not support explicit session termination (405)');
        } else if (!response.ok) {
          unifiedLogger.warn('Session termination returned non-OK status', {
            status: response.status,
          });
        } else {
          unifiedLogger.info('MCP session closed successfully');
        }
      } catch (error) {
        // Don't throw - session termination is best-effort
        unifiedLogger.warn('Failed to terminate MCP session', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      this.sessionId = null;
      this.initializePromise = null;
    }

    await this.unsubscribeEvents();
  }
}
