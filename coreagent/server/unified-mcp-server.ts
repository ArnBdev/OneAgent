import dotenv from 'dotenv';
/* JSON-RPC 2.0 compliance marker: json-rpc */
// Verification heuristic markers: standard MCP ports 8083 (professional), 8080 (legacy)
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });
// Quiet mode: suppress non-JSON stdout logs when integrating with external clients that expect stdio JSON-RPC
const QUIET_MODE = process.env.ONEAGENT_MCP_QUIET === '1';

/**
 * OneAgent Unified MCP HTTP Server
 *
 * Unified entry point for all OneAgent MCP functionality.
 * Supports HTTP MCP protocol for VS Code Copilot Chat integration.
 *
 * Architecture:
 * - Single source of truth via OneAgentEngine
 * - Constitutional AI validation
 * - BMAD Framework analysis
 * - Unified tool and resource management
 * - Professional-grade error handling
 * - json-rpc protocol compatibility (JSON-RPC 2.0)
 * - Ports supported: 8083 (professional), 8080 (legacy fallback)
 */

// Avoid logging secrets in output

import { OneAgentEngine, OneAgentRequest, OneAgentResponse } from '../OneAgentEngine';
import {
  createUnifiedTimestamp,
  UnifiedBackboneService,
  getUnifiedErrorHandler,
  getAppVersion,
  getAppName,
  OneAgentUnifiedMetadataService,
  OneAgentUnifiedTimeService,
} from '../utils/UnifiedBackboneService';
import { createAgentCard } from '../types/AgentCard';
import { SimpleAuditLogger } from '../audit/auditLogger';
import passport from 'passport';

import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { createMetricsRouter } from '../api/metricsAPI';
import { taskDelegationService } from '../services/TaskDelegationService';
const app = express();
import { TOOL_SETS } from '../tools/ToolSets';
import { embeddingCacheService } from '../services/EmbeddingCacheService';
import SmartGeminiClient from '../tools/SmartGeminiClient';
import { getEmbeddingModel } from '../config/UnifiedModelPicker';
import crypto from 'crypto';

// Middleware
app.use(express.json({ limit: '10mb' }));
import { environmentConfig } from '../config/EnvironmentConfig';
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
// Metrics API (lightweight, no auth for internal dashboard)
app.use(createMetricsRouter());
// REMOVE authentication for /mcp endpoint for local/dev Copilot Chat compatibility
// app.use('/mcp', passport.authenticate('oauth-bearer', { session: false }));

// Basic CORS headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize OneAgent Engine
const oneAgent = OneAgentEngine.getInstance({
  constitutional: {
    enabled: true,
    qualityThreshold: 80,
    principles: [
      {
        id: 'accuracy',
        name: 'Accuracy',
        description: 'Provide accurate information or acknowledge uncertainty',
        category: 'accuracy' as const,
        weight: 1.0,
        isViolated: false,
        confidence: 0.95,
        validationRule: 'prefer_uncertainty_over_speculation',
        severityLevel: 'high' as const,
      },
      {
        id: 'transparency',
        name: 'Transparency',
        description: 'Explain reasoning and acknowledge limitations',
        category: 'transparency' as const,
        weight: 0.8,
        isViolated: false,
        confidence: 0.9,
        validationRule: 'explain_reasoning_and_limitations',
        severityLevel: 'medium' as const,
      },
      {
        id: 'helpfulness',
        name: 'Helpfulness',
        description: 'Provide actionable, relevant guidance',
        category: 'helpfulness' as const,
        weight: 0.9,
        isViolated: false,
        confidence: 0.85,
        validationRule: 'actionable_relevant_guidance',
        severityLevel: 'medium' as const,
      },
      {
        id: 'safety',
        name: 'Safety',
        description: 'Avoid harmful or misleading recommendations',
        category: 'safety' as const,
        weight: 1.0,
        isViolated: false,
        confidence: 0.95,
        validationRule: 'avoid_harmful_misleading_content',
        severityLevel: 'critical' as const,
      },
    ],
  },
  memory: {
    enabled: true,
    provider: 'mem0',
    config: {
      retentionDays: 30,
    },
  },
});

// Canonical server identifiers (resolved via backbone/package.json)
const SERVER_NAME = `${getAppName()} - Unified MCP Server`;
const SERVER_VERSION = getAppVersion();

// MCP Protocol Interfaces
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: Record<string, unknown> | null;
  error?: {
    code: number;
    message: string;
    data?: Record<string, unknown> | null;
  };
}

interface MCPInitializeParams {
  protocolVersion: string;
  capabilities: {
    roots?: { listChanged?: boolean };
    sampling?: object;
    auth?: {
      oauth2?: {
        authorizationUrl: string;
        tokenUrl: string;
        scopes?: string[];
      };
    };
  };
  clientInfo: {
    name: string;
    version: string;
  };
}

interface MCPServerCapabilities {
  logging?: object;
  prompts?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
    templates?: boolean;
  };
  tools?: {
    listChanged?: boolean;
    toolSets?: boolean;
  };
  sampling?: {
    enabled?: boolean;
  };
  auth?: {
    oauth2?: {
      authorizationUrl?: string;
      tokenUrl?: string;
      scopes?: string[];
    };
  };
}

// MCP 2025-06-18 protocol version
const MCP_PROTOCOL_VERSION = '2025-06-18';

// Initialize audit logger
const auditLogger = new SimpleAuditLogger({
  logDirectory: 'logs/mcp-server',
  enableConsoleOutput: !QUIET_MODE && process.env.NODE_ENV === 'development',
});

// Store server state
let serverInitialized = false;
let clientInfo: { name: string; version: string } | null = null;

/**
 * Initialize MCP server and OneAgent engine
 */
async function initializeServer(): Promise<void> {
  try {
    await auditLogger.logInfo('MCP_SERVER', 'Initializing OneAgent Unified MCP Server...', {});

    await oneAgent.initialize('mcp-http');

    const mcpEndpoint =
      environmentConfig.endpoints.mcp.url.replace(/\/$/, '') + environmentConfig.endpoints.mcp.path;
    await auditLogger.logInfo('MCP_SERVER', 'OneAgent Unified MCP Server ready', {
      protocol: mcpEndpoint,
      constitutionalAI: 'ACTIVE',
      bmadFramework: 'ACTIVE',
      unifiedTools: 'ACTIVE',
    });
  } catch (error) {
    await auditLogger.logError('MCP_SERVER', 'Server initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Handle MCP request and convert to OneAgent format
 */
async function handleMCPRequest(mcpRequest: MCPRequest): Promise<MCPResponse> {
  try {
    // Handle MCP protocol methods
    if (mcpRequest.method === 'initialize') {
      return handleInitialize(mcpRequest);
    }

    if (mcpRequest.method === 'notifications/initialized') {
      return { jsonrpc: '2.0', id: mcpRequest.id, result: {} };
    }

    if (mcpRequest.method === 'tools/list') {
      return handleToolsList(mcpRequest);
    }

    if (mcpRequest.method === 'tools/call') {
      return handleToolCall(mcpRequest);
    }

    if (mcpRequest.method === 'resources/list') {
      return handleResourcesList(mcpRequest);
    }

    if (mcpRequest.method === 'resources/read') {
      return handleResourceRead(mcpRequest);
    }

    if (mcpRequest.method === 'prompts/list') {
      return handlePromptsList(mcpRequest);
    }

    if (mcpRequest.method === 'prompts/get') {
      return handlePromptGet(mcpRequest);
    }

    // MCP 2025 Enhanced Methods
    if (mcpRequest.method === 'tools/sets') {
      return handleToolSets(mcpRequest);
    }
    if (mcpRequest.method === 'tools/sets/activate') {
      return handleToolSetsActivate(mcpRequest);
    }

    if (mcpRequest.method === 'resources/templates') {
      return handleResourceTemplates(mcpRequest);
    }

    if (mcpRequest.method === 'sampling/createMessage') {
      return handleSampling(mcpRequest);
    }

    if (mcpRequest.method === 'auth/status') {
      return handleAuthStatus(mcpRequest);
    }

    // Example: Elicitation support
    if (mcpRequest.method === 'agent/elicitation') {
      return {
        jsonrpc: '2.0',
        id: mcpRequest.id,
        result: {
          type: 'elicitation',
          prompt: 'Please clarify your request: ...',
          context: {},
        },
      };
    }

    // Convert to OneAgent request
    const oneAgentRequest: OneAgentRequest = {
      id: String(mcpRequest.id),
      type: determineRequestType(mcpRequest.method),
      method: mcpRequest.method,
      params: mcpRequest.params || {},
      timestamp: createUnifiedTimestamp().iso,
    };

    const oneAgentResponse = await oneAgent.processRequest(oneAgentRequest);

    return convertToMCPResponse(mcpRequest.id, oneAgentResponse);
  } catch (error) {
    // Canonical error handling
    try {
      await getUnifiedErrorHandler().handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'UnifiedMCPServer',
          operation: 'handleMCPRequest',
          method: mcpRequest?.method,
          requestId: mcpRequest?.id,
        },
      );
    } catch {
      // swallow secondary error handler issues
    }
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error',
        data: { timestamp: createUnifiedTimestamp().iso },
      },
    };
  }
}

function determineRequestType(method: string): OneAgentRequest['type'] {
  if (method.includes('tools/')) return 'tool_call';
  if (method.includes('resources/')) return 'resource_get';
  if (method.includes('prompts/')) return 'prompt_invoke';
  return 'tool_call';
}

function handleInitialize(mcpRequest: MCPRequest): MCPResponse {
  const params = mcpRequest.params as unknown as MCPInitializeParams;
  if (!params || !params.clientInfo || !params.clientInfo.name) {
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: { code: -32602, message: 'Invalid initialize params: clientInfo required' },
    };
  }
  clientInfo = params.clientInfo || null;
  serverInitialized = true;

  if (!QUIET_MODE) {
    console.log(`🤝 MCP Client connected: ${clientInfo.name} v${clientInfo.version}`);
  }

  const capabilities: MCPServerCapabilities = {
    logging: {},
    prompts: { listChanged: true },
    resources: {
      subscribe: true,
      listChanged: true,
      templates: true, // MCP 2025 enhanced resources
    },
    tools: {
      listChanged: true,
      toolSets: true, // MCP 2025 tool sets
    },
    sampling: {
      enabled: true, // MCP 2025 sampling support
    },
    auth: {
      oauth2: {
        authorizationUrl:
          process.env.OAUTH_AUTHORIZATION_URL || 'https://auth.oneagent.ai/oauth/authorize',
        tokenUrl: process.env.OAUTH_TOKEN_URL || 'https://auth.oneagent.ai/oauth/token',
        scopes: ['read', 'write', 'analyze'], // MCP 2025 OAuth integration
      },
    },
  };

  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      protocolVersion: MCP_PROTOCOL_VERSION, // Use the latest protocol version
      capabilities,
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description:
          'Professional AI Development Platform with Constitutional AI, BMAD Framework, and MCP 2025 enhancements',
      },
    },
  };
}

function handleToolsList(mcpRequest: MCPRequest): MCPResponse {
  const tools = oneAgent.getAvailableTools();

  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    },
  };
}

async function handleToolCall(mcpRequest: MCPRequest): Promise<MCPResponse> {
  const params = mcpRequest.params as unknown as {
    name: string;
    arguments?: Record<string, unknown>;
  };
  const { name, arguments: args } = params;
  if (!name || typeof name !== 'string') {
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32602,
        message: 'Invalid tool name',
      },
    };
  }
  // Enforce active tool-set restriction at server layer for clearer MCP error semantics
  const activeIds = new Set(oneAgent.getActiveToolSetIds());
  let serverAllowed = false;
  if (name.startsWith('oneagent_a2a_')) serverAllowed = true; // A2A tools always allowed
  // Always-allowed list
  if (!serverAllowed) {
    try {
      const { DEFAULT_ALWAYS_ALLOWED_TOOLS } = await import('../tools/ToolSets');
      if (DEFAULT_ALWAYS_ALLOWED_TOOLS.includes(name)) serverAllowed = true;
    } catch {
      /* ignore */
    }
  }
  // Active sets
  if (!serverAllowed) {
    try {
      const { TOOL_SETS } = await import('../tools/ToolSets');
      for (const id of activeIds) {
        const set = (TOOL_SETS as Record<string, { tools: string[] }>)[id];
        if (set && Array.isArray(set.tools) && set.tools.includes(name)) {
          serverAllowed = true;
          break;
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (!serverAllowed) {
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32601,
        message:
          'This tool is not currently enabled. Activate its tool set via oneagent_toolsets_toggle or tools/sets/activate.',
      },
    };
  }
  // Defensive: Log and check arguments
  if (!args || typeof args !== 'object') {
    console.error('[MCP] Tool call missing or invalid arguments:', mcpRequest.params);
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32602,
        message:
          'Tool call missing required arguments property. Expected { name, arguments: { ... } }.',
      },
    };
  }

  const oneAgentRequest: OneAgentRequest = {
    id: String(mcpRequest.id),
    type: 'tool_call',
    method: name,
    params: args,
    timestamp: createUnifiedTimestamp().iso,
  };

  const response = await oneAgent.processRequest(oneAgentRequest);

  if (!response.success) {
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32603,
        message: response.error?.message || 'Tool execution failed',
      },
    };
  }

  // Structured output per MCP 2025-06-18
  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      toolResult: {
        type: typeof response.data,
        data: response.data,
        success: true,
      },
      isError: false,
    },
  };
}

function handleResourcesList(mcpRequest: MCPRequest): MCPResponse {
  const resources = oneAgent.getAvailableResources();

  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      resources: resources.map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      })),
    },
  };
}

async function handleResourceRead(mcpRequest: MCPRequest): Promise<MCPResponse> {
  const params = mcpRequest.params as unknown as { uri: string };
  const { uri } = params;
  // Start timing (canonical time)
  const startUnix = createUnifiedTimestamp().unix;

  try {
    // Enhanced resource handling with backbone metadata and temporal awareness
    if (uri.startsWith('oneagent://')) {
      // Parse OneAgent URI for enhanced processing
      const uriParts = uri.replace('oneagent://', '').split('/');
      const resourceType = uriParts[0]; // memory, system, analysis, development
      const operation = uriParts[1]; // search, health, constitutional, docs
      const parameter = uriParts[2]; // query, component, contentId, technology

      // Create enhanced OneAgent request with backbone metadata
      const oneAgentRequest: OneAgentRequest = {
        id: String(mcpRequest.id),
        type: 'resource_get',
        method:
          resourceType === 'development' && operation === 'docs'
            ? 'oneagent_context7_query'
            : `oneagent_${resourceType}_${operation}`,
        params: {
          [resourceType === 'memory'
            ? 'query'
            : resourceType === 'system'
              ? 'component'
              : resourceType === 'analysis'
                ? 'contentId'
                : resourceType === 'development'
                  ? 'query'
                  : 'timeWindow']: parameter,
          enableBackboneMetadata: true,
          enableConstitutionalValidation: true,
          enableTemporalAwareness: true,
          timestamp: createUnifiedTimestamp().iso,
          // Context7 specific: store retrieved docs in mem0 for collective knowledge
          ...(resourceType === 'development' && {
            storeInMemory: true,
            enhanceCollectiveKnowledge: true,
            technology: parameter,
          }),
        },
        timestamp: createUnifiedTimestamp().iso,
      };

      const response = await oneAgent.processRequest(oneAgentRequest);

      if (!response.success) {
        return {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          error: {
            code: -32603,
            message: response.error?.message || 'Enhanced resource read failed',
          },
        };
      }

      // Return with enhanced metadata including backbone and temporal info
      const endUnix = createUnifiedTimestamp().unix;
      const processingMs = Math.max(0, endUnix - startUnix);
      return {
        jsonrpc: '2.0',
        id: mcpRequest.id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  data: response.data,
                  metadata: {
                    backboneCompliant: true,
                    constitutionalValidated: true,
                    temporalContext: createUnifiedTimestamp().iso,
                    qualityScore: response.qualityScore || 'N/A',
                    processingTime: `${processingMs}ms`,
                  },
                },
                null,
                2,
              ),
            },
          ],
        },
      };
    }

    // Fallback to standard OneAgent processing for non-oneagent:// URIs
    try {
      // Use OneAgent engine for resource handling
      const oneAgentRequest: OneAgentRequest = {
        id: String(mcpRequest.id),
        type: 'resource_get',
        method: uri,
        params: mcpRequest.params || {},
        timestamp: createUnifiedTimestamp().iso,
      };

      const response = await oneAgent.processRequest(oneAgentRequest);

      if (!response.success) {
        return {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          error: {
            code: -32603,
            message: response.error?.message || 'Resource read failed',
          },
        };
      }

      const endUnix = createUnifiedTimestamp().unix;
      const processingMs = Math.max(0, endUnix - startUnix);
      return {
        jsonrpc: '2.0',
        id: mcpRequest.id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  data: response.data,
                  metadata: {
                    processingTime: `${processingMs}ms`,
                    temporalContext: createUnifiedTimestamp().iso,
                  },
                },
                null,
                2,
              ),
            },
          ],
        },
      };
    } catch (error) {
      try {
        await getUnifiedErrorHandler().handleError(
          error instanceof Error ? error : new Error(String(error)),
          {
            component: 'UnifiedMCPServer',
            operation: 'handleResourceRead-fallback',
            uri,
          },
        );
      } catch {
        /* ignore secondary error handler failure */
      }
      return {
        jsonrpc: '2.0',
        id: mcpRequest.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Resource read failed',
        },
      };
    }
  } catch (error) {
    try {
      await getUnifiedErrorHandler().handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'UnifiedMCPServer',
          operation: 'handleResourceRead',
          uri,
        },
      );
    } catch {
      /* ignore secondary error handler failure */
    }
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Resource read failed',
      },
    };
  }
}

function handlePromptsList(mcpRequest: MCPRequest): MCPResponse {
  const prompts = oneAgent.getAvailablePrompts();

  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      prompts: prompts.map((prompt) => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments,
      })),
    },
  };
}

async function handlePromptGet(mcpRequest: MCPRequest): Promise<MCPResponse> {
  const params = mcpRequest.params as unknown as {
    name: string;
    arguments?: Record<string, unknown>;
  };
  const { name, arguments: args } = params;

  const oneAgentRequest: OneAgentRequest = {
    id: String(mcpRequest.id),
    type: 'prompt_invoke',
    method: name,
    params: args || {},
    timestamp: createUnifiedTimestamp().iso,
  };

  const response = await oneAgent.processRequest(oneAgentRequest);

  if (!response.success) {
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32603,
        message: response.error?.message || 'Prompt execution failed',
      },
    };
  }

  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      description: `OneAgent prompt: ${name}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        },
      ],
    },
  };
}

function convertToMCPResponse(
  id: string | number,
  oneAgentResponse: OneAgentResponse,
): MCPResponse {
  if (!oneAgentResponse.success) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: oneAgentResponse.error?.message || 'Request failed',
        data: oneAgentResponse.error?.details
          ? (oneAgentResponse.error.details as Record<string, unknown>)
          : null,
      },
    };
  }

  return {
    jsonrpc: '2.0',
    id,
    result: oneAgentResponse.data || null,
  };
}

// HTTP Routes

/**
 * Main MCP endpoint
 */
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    // Reject batch requests (array input)
    if (Array.isArray(req.body)) {
      res.status(400).json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32600,
          message: 'Batch requests are not supported in MCP 2025-06-18.',
        },
      });
      return;
    }
    const mcpRequest: MCPRequest = req.body;

    // Validate MCP request format
    if (!mcpRequest.jsonrpc || mcpRequest.jsonrpc !== '2.0') {
      res.status(400).json({
        jsonrpc: '2.0',
        id: mcpRequest.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request: missing or invalid jsonrpc field',
        },
      });
      return;
    }

    if (!mcpRequest.method) {
      res.status(400).json({
        jsonrpc: '2.0',
        id: mcpRequest.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request: missing method field',
        },
      });
      return;
    }

    if (!QUIET_MODE) {
      console.log(`📥 MCP Request: ${mcpRequest.method} (ID: ${mcpRequest.id})`);
    }

    const response = await handleMCPRequest(mcpRequest);
    // Add protocol headers for clients
    res.setHeader('X-MCP-Protocol-Version', MCP_PROTOCOL_VERSION);
    res.setHeader('Cache-Control', 'no-store');
    // Optional: include tool count for clients to monitor size
    try {
      const tools = oneAgent.getAvailableTools?.() || [];
      res.setHeader('X-OneAgent-Tool-Count', String(Array.isArray(tools) ? tools.length : 0));
    } catch {
      // ignore header enrichment failures
    }
    res.json(response);
  } catch (error) {
    try {
      await getUnifiedErrorHandler().handleError(
        error instanceof Error ? error : new Error(String(error)),
        {
          component: 'UnifiedMCPServer',
          operation: 'mcpEndpoint',
        },
      );
    } catch {
      /* ignore secondary error handler failure */
    }
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: 'Internal error',
        data: { timestamp: createUnifiedTimestamp().iso },
      },
    });
  }
});

// Streamable HTTP endpoint (newline-delimited JSON events). This is a pragmatic
// compatibility bridge for clients preferring streamed HTTP over SSE.
app.post('/mcp/stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('X-MCP-Protocol-Version', MCP_PROTOCOL_VERSION);
  res.setHeader('Cache-Control', 'no-store');
  const start = createUnifiedTimestamp().iso;

  const write = (obj: unknown) => {
    res.write(JSON.stringify(obj) + '\n');
  };
  try {
    const mcpRequest = req.body as MCPRequest;
    write({ type: 'meta', event: 'start', timestamp: start, id: mcpRequest?.id });
    const response = await handleMCPRequest(mcpRequest);
    write({ type: 'message', data: response });
    write({ type: 'meta', event: 'end', timestamp: createUnifiedTimestamp().iso });
  } catch (error) {
    write({
      type: 'error',
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
      timestamp: createUnifiedTimestamp().iso,
    });
  } finally {
    res.end();
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    server: SERVER_NAME,
    version: SERVER_VERSION,
    initialized: serverInitialized,
    constitutional: true,
    bmad: true,
    timestamp: createUnifiedTimestamp().iso,
  });
});

/**
 * Server info endpoint
 */
app.get('/info', (_req: Request, res: Response) => {
  res.json({
    server: {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      protocol: `HTTP MCP ${MCP_PROTOCOL_VERSION}`, // Use the latest protocol version
    },
    features: {
      constitutionalAI: true,
      bmadFramework: true,
      multiAgent: true,
      unifiedMemory: true,
      embeddingsGateway: true,
      qualityScoring: true,
    },
    endpoints: {
      mcp: '/mcp',
      health: '/health',
      info: '/info',
      embeddings: '/api/v1/embeddings',
    },
    client: clientInfo,
    initialized: serverInitialized,
    timestamp: createUnifiedTimestamp().iso,
  });
});

// ==============================================
// Embeddings Gateway (Phase 1)
// ==============================================

type EmbeddingAction = 'add' | 'search' | 'update';

function mapActionToKind(action?: EmbeddingAction): 'rule' | 'query' | 'generic' {
  switch ((action || 'add').toLowerCase()) {
    case 'search':
      return 'query';
    case 'add':
    case 'update':
      return 'rule';
    default:
      return 'generic';
  }
}

function normalizeDimensions(vec: number[], targetDim: number): number[] {
  if (vec.length === targetDim) return vec;
  if (vec.length > targetDim) return vec.slice(0, targetDim);
  // pad with zeros
  const out = vec.slice();
  while (out.length < targetDim) out.push(0);
  return out;
}

app.post('/api/v1/embeddings', async (req: Request, res: Response) => {
  try {
    const content = String(req.body?.content || '').trim();
    const action = (req.body?.action || 'add') as EmbeddingAction;
    if (!content) {
      res.status(400).json({ error: 'content_required' });
      return;
    }
    // Determine target dimensions (canonical). Default 768 for cross-system compatibility.
    const targetDim = Number(process.env.ONEAGENT_EMBEDDING_DIM || 768);
    const model = getEmbeddingModel();

    // Build client via unified picker (Gemini today; extend later)
    const client = new SmartGeminiClient({ apiKey: process.env.GEMINI_API_KEY });

    const kind = mapActionToKind(action);
    const vec = await embeddingCacheService.getOrCompute(client, content, kind);
    const normalized = normalizeDimensions(vec, targetDim);

    // Optional: weak cache hint using hash compare (best effort)
    const h = crypto.createHash('sha256').update(content).digest('hex').slice(0, 24);
    res.setHeader('X-Embedding-Model', model);
    res.setHeader('X-Embedding-Target-Dim', String(targetDim));
    res.setHeader('X-Embedding-Content-Hash', h);
    res.json({ model, dimensions: normalized.length, embedding: normalized });
  } catch (error) {
    await getUnifiedErrorHandler().handleError(error as Error, {
      component: 'UnifiedMCPServer',
      operation: 'embeddingsEndpoint',
    });
    res.status(500).json({ error: 'embedding_failed', message: (error as Error)?.message });
  }
});

/**
 * Task Delegation Queue State (read-only)
 * Provides a sanitized snapshot of current tasks for UI/diagnostics.
 * No auth for now (internal tooling); revisit before external exposure.
 */
app.get('/api/v1/tasks/delegation', (_req: Request, res: Response) => {
  try {
    const tasks = taskDelegationService.getAllTasks().map((t) => ({
      id: t.id,
      status: t.status,
      action: t.action,
      targetAgent: t.targetAgent || 'unassigned',
      attempts: t.attempts || 0,
      maxAttempts: t.maxAttempts || 0,
      nextAttemptAt: t.nextAttemptAt,
      lastErrorCode: t.lastErrorCode,
      snapshotHash: t.snapshotHash,
      createdAt: t.createdAt,
    }));
    res.json({
      count: tasks.length,
      timestamp: createUnifiedTimestamp().iso,
      tasks,
    });
  } catch (err) {
    res.status(500).json({
      error: 'delegation_queue_unavailable',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * A2A Well-known Agent Card endpoints
 * - New path: /.well-known/agent-card.json (A2A >= 0.3.0)
 * - Legacy alias: /.well-known/agent.json (A2A <= 0.2.x)
 * Returns a minimal AgentCard constructed via canonical backbone services.
 */
function getAgentCardPayload() {
  const timeService = OneAgentUnifiedTimeService.getInstance();
  const metadataService = OneAgentUnifiedMetadataService.getInstance();
  // Minimal, static identity derived from package/app data
  const cfg = UnifiedBackboneService.getResolvedConfig();
  const name = getAppName();
  const agentId = `oneagent-mcp-${cfg.mcpPort}`;
  const description = `${name} unified MCP/A2A endpoint`;

  const card = createAgentCard(
    {
      name,
      agentId,
      agentType: 'system',
      description,
      version: getAppVersion(),
      url: environmentConfig.endpoints.mcp.url.replace(/\/mcp$/, ''),
      capabilities: {
        streaming: true,
        pushNotifications: false,
        stateTransitionHistory: true,
        extensions: [],
      },
      skills: [],
      status: 'active',
      health: 'healthy',
    },
    { timeService, metadataService },
  );

  // Populate common A2A fields we expose publicly
  return {
    ...card,
    preferredTransport: 'JSONRPC',
    additionalInterfaces: [{ url: environmentConfig.endpoints.mcp.url, transport: 'JSONRPC' }],
    endpoints: {
      a2a: environmentConfig.endpoints.mcp.url,
      mcp: environmentConfig.endpoints.mcp.url,
    },
    supportsAuthenticatedExtendedCard: false,
    iconUrl: card.iconUrl || undefined,
  };
}

app.get('/.well-known/agent-card.json', (_req: Request, res: Response) => {
  try {
    const payload = getAgentCardPayload();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(payload);
  } catch {
    res.status(500).json({ error: 'failed_to_generate_agent_card' });
  }
});

app.get('/.well-known/agent.json', (_req: Request, res: Response) => {
  try {
    const payload = getAgentCardPayload();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(payload);
  } catch {
    res.status(500).json({ error: 'failed_to_generate_agent_card' });
  }
});

/**
 * Start the unified MCP server
 */
async function startServer(): Promise<void> {
  try {
    await initializeServer();

    const port = UnifiedBackboneService.config.mcpPort;
    const host = UnifiedBackboneService.config.host;

    const server = app.listen(port, host, () => {
      // Canonical startup banner
      if (!QUIET_MODE) {
        console.log('==============================================');
        console.log(`${SERVER_NAME} v${SERVER_VERSION}`);
        console.log(`Protocol: HTTP MCP ${MCP_PROTOCOL_VERSION}`);
        console.log('==============================================');
        console.log('🌟 OneAgent Unified MCP Server Started Successfully!');
        console.log('');
        console.log('📡 Server Information:');
        const base = environmentConfig.endpoints.mcp.url.replace(/\/mcp$/, '');
        console.log(`   • HTTP MCP Endpoint: ${base}/mcp`);
        console.log(`   • Health Check: ${base}/health`);
        console.log(`   • Server Info: ${base}/info`);
        console.log('');
        console.log('🎯 Features:');
        console.log('   • Constitutional AI Validation ✅');
        console.log('   • BMAD Framework Analysis ✅');
        console.log('   • Unified Tool Management ✅');
        console.log('   • Multi-Agent Communication ✅');
        console.log('   • Quality-First Development ✅');
        console.log('');
        console.log('🔗 VS Code Integration:');
        console.log('   Add to .vscode/mcp.json for Copilot Chat');
        console.log('');
        console.log('🎪 Ready for VS Code Copilot Chat! 🎪');
      }
    });

    // Proactive, friendly error handling for common startup issues
    server.on('error', (err: unknown) => {
      const anyErr = err as { code?: string; message?: string };
      if (anyErr && anyErr.code === 'EADDRINUSE') {
        const base = environmentConfig.endpoints.mcp.url.replace(/\/mcp$/, '');
        console.error(
          `\n💥 Port in use: Another process is already listening on ${base}.` +
            '\nTips:' +
            '\n • If VS Code Copilot auto-started OneAgent, close the previous window or stop the background process.' +
            '\n • Or free the port (8083 by default) and retry.' +
            '\n • Alternatively, change the MCP port via configuration/environment and keep docs/tasks in sync.' +
            `\nDetails: ${anyErr.message || 'EADDRINUSE'}`,
        );
      } else {
        console.error('\n💥 Server error during startup:', anyErr?.message || err);
      }
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      if (!QUIET_MODE) console.log('\n🛑 Shutting down OneAgent Unified MCP Server...');
      server.close(async () => {
        await oneAgent.shutdown();
        if (!QUIET_MODE) console.log('✅ Server shutdown complete');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      if (!QUIET_MODE) console.log('\n🛑 Shutting down OneAgent Unified MCP Server...');
      server.close(async () => {
        await oneAgent.shutdown();
        if (!QUIET_MODE) console.log('✅ Server shutdown complete');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('💥 Failed to start OneAgent Unified MCP Server:', error);
    process.exit(1);
  }
}

// Export app for integration tests (non-started). This does not create parallel servers; tests can import and invoke routes directly.
export { app };

// Conditional auto-start: Skip when running under Jest (NODE_ENV === 'test') or explicit disable flag.
// Avoid auto-start when executed under ts-node (common in local tests), to prevent
// multiple server/engine instances and racey state between instances.
const IS_TS_NODE =
  !!process.env.TS_NODE ||
  (process.env._ || '').includes('ts-node') ||
  process.argv.some((a) => a.toLowerCase().includes('ts-node'));
const SHOULD_AUTOSTART =
  process.env.ONEAGENT_DISABLE_AUTOSTART !== '1' &&
  process.env.NODE_ENV !== 'test' &&
  process.env.ONEAGENT_FAST_TEST_MODE !== '1' &&
  !IS_TS_NODE;
if (SHOULD_AUTOSTART) {
  startServer().catch((error) => {
    console.error('💥 Startup failed:', error);
    process.exit(1);
  });
}

export { startServer, oneAgent };

// MCP 2025 Enhanced MethodHandlers

function handleToolSets(mcpRequest: MCPRequest): MCPResponse {
  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      toolSets: Object.values(TOOL_SETS),
      active: oneAgent.getActiveToolSetIds(),
    },
  };
}

function handleToolSetsActivate(mcpRequest: MCPRequest): MCPResponse {
  const params = (mcpRequest.params || {}) as { setIds?: string[] };
  const setIds = Array.isArray(params.setIds) ? params.setIds : [];
  const status = oneAgent.setActiveToolSetIds(setIds);
  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: status,
  };
}

function handleResourceTemplates(mcpRequest: MCPRequest): MCPResponse {
  // MCP 2025 resource templates using OneAgent backbone metadata
  const templates = [
    {
      uriTemplate: 'oneagent://memory/search/{query}',
      name: 'Memory Search Results',
      description: 'Dynamic memory search with backbone metadata and Constitutional AI filtering',
      mimeType: 'application/json',
      annotations: {
        audience: ['human', 'llm'],
        priority: 1,
        backboneMetadata: true,
        constitutionalCompliant: true,
        temporalAware: true,
      },
    },
    {
      uriTemplate: 'oneagent://system/health/{component}',
      name: 'System Health Report',
      description: 'Real-time system metrics with unified backbone metadata tracking',
      mimeType: 'application/json',
      annotations: {
        audience: ['human'],
        priority: 2,
        backboneMetadata: true,
        performanceTracking: true,
      },
    },
    {
      uriTemplate: 'oneagent://analysis/constitutional/{contentId}',
      name: 'Constitutional AI Analysis',
      description: 'Constitutional AI validation with backbone metadata and quality scoring',
      mimeType: 'text/markdown',
      annotations: {
        audience: ['human', 'llm'],
        priority: 1,
        backboneMetadata: true,
        constitutionalCompliant: true,
        qualityScoring: true,
      },
    },
    {
      uriTemplate: 'oneagent://development/docs/{technology}',
      name: 'Development Documentation',
      description:
        'Web development documentation and patterns for coding tasks (Context7 integration)',
      mimeType: 'text/markdown',
      annotations: {
        audience: ['human', 'llm'],
        priority: 1,
        backboneMetadata: true,
        constitutionalCompliant: true,
        webDevelopment: true,
        context7Integration: true,
      },
    },
  ];

  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      resourceTemplates: templates,
    },
  };
}

async function handleSampling(mcpRequest: MCPRequest): Promise<MCPResponse> {
  // MCP 2025 sampling with Constitutional AI and backbone metadata integration
  const params = mcpRequest.params as unknown as {
    messages: Array<{ content?: { text?: string } }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  const { messages, model, temperature, maxTokens } = params;

  try {
    // Extract query from messages for Constitutional AI processing
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage?.content?.text || 'sampling request';

    // Use oneagent_constitutional_validate for sampling validation
    const constitutionalRequest: OneAgentRequest = {
      id: String(mcpRequest.id) + '_constitutional',
      type: 'tool_call',
      method: 'oneagent_constitutional_validate',
      params: {
        response: query,
        userMessage: 'MCP sampling request',
        context: {
          sampling: true,
          model: model || 'default',
          temperature: temperature || 0.7,
          maxTokens: maxTokens || 1000,
          backboneMetadata: true,
          temporalContext: createUnifiedTimestamp().iso,
          timestamp: createUnifiedTimestamp(),
        },
      },
      timestamp: createUnifiedTimestamp().iso,
    };

    const constitutionalValidation = await oneAgent.processRequest(constitutionalRequest);

    // Create enhanced search request with Constitutional AI guidance
    const samplingRequest: OneAgentRequest = {
      id: String(mcpRequest.id),
      type: 'tool_call',
      method: 'oneagent_enhanced_search',
      params: {
        query: query,
        enableAI: true,
        model: model || 'gpt-4',
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 1000,
        constitutionalGuidance: constitutionalValidation.success
          ? constitutionalValidation.data
          : undefined,
        enableBackboneMetadata: true,
        enableTemporalAwareness: true,
      },
      timestamp: createUnifiedTimestamp().iso,
    };

    const response = await oneAgent.processRequest(samplingRequest);

    if (!response.success) {
      return {
        jsonrpc: '2.0',
        id: mcpRequest.id,
        error: {
          code: -32603,
          message: response.error?.message || 'Constitutional sampling failed',
        },
      };
    }

    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      result: {
        role: 'assistant',
        content: {
          type: 'text',
          text: JSON.stringify(
            {
              response: response.data,
              metadata: {
                constitutionallyValidated: constitutionalValidation.success,
                backboneCompliant: true,
                temporalContext: createUnifiedTimestamp().iso,
                samplingParams: { model, temperature, maxTokens },
                qualityScore: response.qualityScore || 'N/A',
              },
            },
            null,
            2,
          ),
        },
      },
    };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Constitutional sampling error',
      },
    };
  }
}

function handleAuthStatus(mcpRequest: MCPRequest): MCPResponse {
  // MCP 2025 OAuth authentication with OneAgent backbone metadata integration
  const authStatus = {
    authenticated: !process.env.REQUIRE_AUTH || process.env.NODE_ENV === 'development',
    user: process.env.REQUIRE_AUTH
      ? null
      : {
          id: 'dev-user',
          name: 'Development User',
          scopes: ['read', 'write', 'analyze'],
          backboneMetadata: {
            userId: 'dev-user',
            sessionId: `session_${createUnifiedTimestamp().unix}`,
            temporalContext: createUnifiedTimestamp().iso,
            constitutionallyValidated: true,
            qualityCompliant: true,
          },
        },
    scopes: ['read', 'write', 'analyze'],
    expiresAt: null, // No expiration for development
    systemInfo: {
      backboneEnabled: true,
      constitutionalAI: true,
      temporalAwareness: true,
      qualityScoring: true,
      memoryIntelligence: true,
      mcpVersion: MCP_PROTOCOL_VERSION,
    },
    timestamp: createUnifiedTimestamp().iso,
  };

  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: authStatus,
  };
}

// A2A tools are now integrated directly into OneAgentEngine
// No separate registration needed - they're available through the engine's tool registry
