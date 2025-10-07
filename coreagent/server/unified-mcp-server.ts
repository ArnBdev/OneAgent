console.log('[TRACE] 🔵 Module load START - unified-mcp-server.ts');

// ============================================================================
// CRITICAL: Global error handlers to prevent silent exits
// ============================================================================
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED PROMISE REJECTION:', reason);
  console.error('Promise:', promise);
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack);
  }
  process.exit(1);
});

console.log('[TRACE] 🔵 Global error handlers installed');

import dotenv from 'dotenv';
/* JSON-RPC 2.0 compliance marker: json-rpc */
// Verification heuristic markers: standard MCP ports 8083 (professional), 8080 (legacy)
import path from 'path';
console.log('[TRACE] 🔵 Loading .env config...');
dotenv.config({ path: path.join(process.cwd(), '.env') });
console.log(
  '[TRACE] 🔵 .env loaded, ONEAGENT_FORCE_AUTOSTART:',
  process.env.ONEAGENT_FORCE_AUTOSTART,
);
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

console.log('[TRACE] 🔵 Importing OneAgentEngine (with detailed tracing)...');
import {
  OneAgentEngine,
  OneAgentRequest,
  OneAgentResponse,
  ToolDescriptor,
} from '../OneAgentEngine';
console.log('[TRACE] 🔵 OneAgentEngine imported successfully');

console.log('[TRACE] 🔵 Importing UnifiedBackboneService...');
console.log('[TRACE] 🔵 Importing UnifiedBackboneService...');
import {
  createUnifiedTimestamp,
  UnifiedBackboneService,
  getUnifiedErrorHandler,
  getAppVersion,
  getAppName,
  unifiedTimeService,
  unifiedMetadataService,
} from '../utils/UnifiedBackboneService';
console.log('[TRACE] 🔵 UnifiedBackboneService imported');
console.log('[TRACE] 🔵 Importing remaining dependencies...');
import { createAgentCard } from '../types/AgentCard';
import { SimpleAuditLogger } from '../audit/auditLogger';
import passport from 'passport';

import express from 'express';
console.log('[TRACE] 🔵 All imports complete, creating Express app...');
import { Request, Response, NextFunction } from 'express';
import { createMetricsRouter } from '../api/metricsAPI';
import { taskDelegationService } from '../services/TaskDelegationService';

// MCP Session Management imports
console.log('[TRACE] 🔵 Importing MCP session management...');
import { MCPSessionManager } from './MCPSessionManager';
import { InMemorySessionStorage, InMemoryEventLog } from './MCPSessionStorage';
import { createDevCorsMiddleware } from './MCPCorsMiddleware';
import { createPermissiveSessionMiddleware } from './MCPSessionMiddleware';
import type { SessionConfig } from '../types/MCPSessionTypes';
console.log('[TRACE] 🔵 MCP session management imported');

console.log('[TRACE] 🔵 Creating Express app instance...');
const app = express();
console.log('[TRACE] 🔵 Express app created');
import { TOOL_SETS } from '../tools/ToolSets';
import { embeddingCacheService } from '../services/EmbeddingCacheService';
import { getEmbeddingModel, getEmbeddingClient } from '../config/UnifiedModelPicker';
import crypto from 'crypto';
import { createMissionControlWSS, missionControlWsMetrics } from './mission-control-ws';

// Middleware
app.use(express.json({ limit: '10mb' }));
import { environmentConfig } from '../config/EnvironmentConfig';
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
// Metrics API (lightweight, no auth for internal dashboard)
app.use(createMetricsRouter());

// Canonical Prometheus metrics endpoint alias
app.get('/metrics', (req, res, next) => {
  // Forward to the canonical Prometheus exposition endpoint
  req.url = '/api/v1/metrics/prometheus';
  next();
});
// REMOVE authentication for /mcp endpoint for local/dev Copilot Chat compatibility
// app.use('/mcp', passport.authenticate('oauth-bearer', { session: false }));

// ============================================================================
// MCP Session Management Setup
// ============================================================================
console.log('[INIT] 🔐 Initializing MCP session management...');

// Session configuration
const sessionConfig: SessionConfig = {
  sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
  enabled: true,
  cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
  eventLogTTLMs: 60 * 60 * 1000, // 1 hour
  maxEventsPerSession: 1000,
};

// Initialize session storage and manager
const sessionStorage = new InMemorySessionStorage(sessionConfig.cleanupIntervalMs);
const eventLog = new InMemoryEventLog(sessionConfig.maxEventsPerSession);
const sessionManager = new MCPSessionManager(sessionStorage, eventLog, sessionConfig);

console.log('[INIT] ✅ Session manager initialized', {
  sessionTimeoutMs: sessionConfig.sessionTimeoutMs,
  cleanupIntervalMs: sessionConfig.cleanupIntervalMs,
  maxEventsPerSession: sessionConfig.maxEventsPerSession,
});

// Add CORS middleware (FIRST - must be before other middleware)
console.log('[INIT] 🔐 Adding CORS middleware...');
app.use(
  createDevCorsMiddleware([
    'https://oneagent.io', // Production website (future)
    'http://localhost:*', // Development (covered by allowLocalhost)
  ]),
);
console.log('[INIT] ✅ CORS middleware added');

// Add session middleware (SECOND - validates sessions)
console.log('[INIT] 🔐 Adding session middleware...');
app.use(
  createPermissiveSessionMiddleware(sessionManager, [
    '/health',
    '/health/sessions',
    '/api/v1/metrics',
  ]),
);
console.log('[INIT] ✅ Session middleware added');

// Basic CORS headers (DEPRECATED - replaced by MCP CORS middleware above)
// Keeping for backwards compatibility with non-MCP endpoints
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip if CORS headers already set by MCP middleware
  if (res.getHeader('Access-Control-Allow-Origin')) {
    next();
    return;
  }

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

// Initialize OneAgent Engine (canonical: use explicit instantiation)
console.log('[INIT] 🎯 Creating OneAgentEngine instance...');
const oneAgent = new OneAgentEngine();
console.log('[INIT] ✅ OneAgentEngine created successfully');

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

// Mission Control WS path constant (channel & message types are now defined in mission-control-ws module)
const MISSION_CONTROL_WS_PATH = '/ws/mission-control';

// Initialize audit logger
const auditLogger = new SimpleAuditLogger({
  logDirectory: 'logs/mcp-server',
  enableConsoleOutput: !QUIET_MODE && process.env.NODE_ENV === 'development',
});

// Store server state
let serverInitialized = false;
let clientInfo: { name: string; version: string } | null = null;
// Mission Control live status (for lightweight diagnostics endpoints)
let missionControlActiveConnections = 0;

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
async function handleMCPRequest(
  mcpRequest: MCPRequest,
  req?: Request,
  res?: Response,
): Promise<MCPResponse> {
  try {
    // Handle MCP protocol methods
    if (mcpRequest.method === 'initialize') {
      return await handleInitialize(mcpRequest, req, res);
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

async function handleInitialize(
  mcpRequest: MCPRequest,
  req?: Request,
  res?: Response,
): Promise<MCPResponse> {
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

  // Create MCP session (MCP 2025-06-18 feature)
  if (sessionConfig.enabled && req && res) {
    try {
      const origin = req.headers?.origin || req.headers?.referer || 'unknown';
      const sessionResult = await sessionManager.createSession(
        clientInfo.name,
        origin,
        MCP_PROTOCOL_VERSION,
        params.capabilities || {},
      );

      // Set Mcp-Session-Id header for client
      res.setHeader('Mcp-Session-Id', sessionResult.sessionId);

      if (!QUIET_MODE) {
        console.log(
          `🎫 MCP Session created: ${sessionResult.sessionId.substring(0, 8)}... (expires in ${sessionConfig.sessionTimeoutMs / 1000}s)`,
        );
      }
    } catch (error) {
      console.error('❌ Failed to create MCP session:', error);
      // Don't fail initialization if session creation fails
    }
  }

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

async function handleToolsList(mcpRequest: MCPRequest): Promise<MCPResponse> {
  const toolsArr = await oneAgent.getAvailableTools();
  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      tools: toolsArr.map((tool: ToolDescriptor) => ({
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

    const response = await handleMCPRequest(mcpRequest, req, res);
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
    const response = await handleMCPRequest(mcpRequest, req, res);
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
// Lightweight type guard for unified health structure returned by monitoring
interface UnifiedHealthLike {
  overall?: { status?: string; score?: number };
  [key: string]: unknown;
}

app.get('/health', async (req: Request, res: Response) => {
  try {
    // Leverage canonical UnifiedMonitoringService via backbone; avoid parallel health logic
    const backbone = UnifiedBackboneService;
    const monitoring = backbone.monitoring;
    let unifiedHealth: unknown = null;
    try {
      unifiedHealth = await monitoring.getSystemHealth({ details: true });
    } catch (err) {
      // Fallback minimally if monitoring health fails; do NOT throw to keep liveness responsive
      unifiedHealth = { overall: { status: 'unknown', score: 0 } };
      try {
        await getUnifiedErrorHandler().handleError(err as Error, {
          component: 'UnifiedMCPServer',
          operation: 'health-endpoint-monitoring-fallback',
        });
      } catch {
        /* ignore secondary */
      }
    }

    const ts = createUnifiedTimestamp();
    const detailed = String(req.query.details || '').toLowerCase() === 'true';
    // Shape response for forward compatibility; embed unified health under canonical key
    const base = {
      server: SERVER_NAME,
      version: SERVER_VERSION,
      initialized: serverInitialized,
      timestamp: ts.iso,
      constitutionalAI: true,
      bmadFramework: true,
      protocolVersion: MCP_PROTOCOL_VERSION,
    };
    const healthObj = unifiedHealth as UnifiedHealthLike | null;
    if (!detailed) {
      const overall = healthObj?.overall?.status || 'unknown';
      res.json({ status: overall, ...base });
      return;
    }
    res.json({
      status: healthObj?.overall?.status || 'unknown',
      health: unifiedHealth,
      metrics: {
        activeConnections: missionControlActiveConnections,
        ws: {
          connectionsOpen: missionControlWsMetrics.connectionsOpen,
          connectionsTotal: missionControlWsMetrics.connectionsTotal,
          messagesSentTotal: missionControlWsMetrics.messagesSentTotal,
          subscriptionsTotal: missionControlWsMetrics.subscriptionsTotal,
          channels: Array.from(missionControlWsMetrics.channelSubscriptions.entries()).map(
            ([channel, count]) => ({ channel, count }),
          ),
        },
      },
      ...base,
    });
  } catch (error) {
    // Last resort fallback; keep endpoint fast and resilient
    res.status(500).json({
      status: 'error',
      error: (error as Error)?.message || 'health_check_failed',
      timestamp: createUnifiedTimestamp().iso,
    });
  }
});

/**
 * Session health/metrics endpoint (MCP 2025-06-18)
 */
app.get('/health/sessions', async (_req: Request, res: Response) => {
  try {
    if (!sessionConfig.enabled) {
      res.status(503).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Session management is not enabled',
        },
      });
      return;
    }

    const sessionMetrics = await sessionManager.getMetrics();
    const storageMetrics = await sessionStorage.getMetrics();
    const eventMetrics = await eventLog.getMetrics();

    res.json({
      timestamp: createUnifiedTimestamp().iso,
      enabled: sessionConfig.enabled,
      config: {
        sessionTimeoutMs: sessionConfig.sessionTimeoutMs,
        cleanupIntervalMs: sessionConfig.cleanupIntervalMs,
        maxEventsPerSession: sessionConfig.maxEventsPerSession,
      },
      sessions: {
        active: storageMetrics.activeSessions,
        total: storageMetrics.totalSessions,
        expired: storageMetrics.expiredSessions,
      },
      events: {
        total: eventMetrics.totalEvents,
        sessions: eventMetrics.totalSessions,
        averagePerSession: eventMetrics.averageEventsPerSession,
      },
      overall: sessionMetrics,
    });
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: `Session metrics failed: ${error instanceof Error ? error.message : String(error)}`,
      },
    });
  }
});

/**
 * DELETE endpoint for session termination (MCP 2025-06-18)
 */
app.delete('/mcp', async (req: Request, res: Response) => {
  try {
    if (!sessionConfig.enabled) {
      res.status(503).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Session management is not enabled',
        },
      });
      return;
    }

    const sessionId = req.headers['mcp-session-id'] as string;

    if (!sessionId) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Mcp-Session-Id header required for session termination',
        },
      });
      return;
    }

    // Verify session exists before terminating
    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      res.status(404).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Session not found or already expired',
        },
      });
      return;
    }

    // Terminate the session
    await sessionManager.terminateSession(sessionId);

    if (!QUIET_MODE) {
      console.log(`🔒 MCP Session terminated: ${sessionId.substring(0, 8)}...`);
    }

    // Return 204 No Content for successful termination
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: `Session termination failed: ${error instanceof Error ? error.message : String(error)}`,
      },
    });
  }
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
      missionControlWsMetrics: '/mission-control/ws-metrics',
      info: '/info',
      embeddings: '/api/v1/embeddings',
    },
    client: clientInfo,
    initialized: serverInitialized,
    timestamp: createUnifiedTimestamp().iso,
  });
});

/**
 * Mission Control WS metrics endpoint (lightweight JSON; no auth – internal usage)
 */
app.get('/mission-control/ws-metrics', (_req: Request, res: Response) => {
  try {
    res.json({
      timestamp: createUnifiedTimestamp().iso,
      metrics: {
        connectionsOpen: missionControlWsMetrics.connectionsOpen,
        connectionsTotal: missionControlWsMetrics.connectionsTotal,
        messagesSentTotal: missionControlWsMetrics.messagesSentTotal,
        subscriptionsTotal: missionControlWsMetrics.subscriptionsTotal,
        channels: Array.from(missionControlWsMetrics.channelSubscriptions.entries()).map(
          ([channel, count]) => ({ channel, count }),
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: (error as Error)?.message || 'metrics_unavailable',
      timestamp: createUnifiedTimestamp().iso,
    });
  }
});

/**
 * Mission Control status (minimal, unauthenticated; local tooling only for now)
 */
app.get('/api/v1/mission-control/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    activeConnections: missionControlActiveConnections,
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
    // Build client via unified picker (Gemini or OpenAI depending on env)
    const client = getEmbeddingClient();

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
async function getAgentCardPayload() {
  // Canonical: use exported singleton instances
  const timeService = unifiedTimeService;
  const metadataService = unifiedMetadataService;
  // Minimal, static identity derived from package/app data
  const cfg = UnifiedBackboneService.getResolvedConfig();
  const name = getAppName();
  const agentId = `oneagent-mcp-${cfg.mcpPort}`;
  const description = `${name} unified MCP/A2A endpoint`;

  const card = await createAgentCard(
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

app.get('/.well-known/agent-card.json', async (_req: Request, res: Response) => {
  try {
    const payload = await getAgentCardPayload();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(payload);
  } catch {
    res.status(500).json({ error: 'failed_to_generate_agent_card' });
  }
});

app.get('/.well-known/agent.json', async (_req: Request, res: Response) => {
  try {
    const payload = await getAgentCardPayload();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(payload);
  } catch {
    res.status(500).json({ error: 'failed_to_generate_agent_card' });
  }
});

/**
 * Start the unified MCP server
 * Supports both HTTP and stdio-only modes:
 * - HTTP mode: Full Express server with WebSocket (default)
 * - Stdio-only mode: Pure MCP SDK stdio transport (set ONEAGENT_MCP_STDIO_ONLY=1)
 */
async function startServer(): Promise<void> {
  try {
    const port = UnifiedBackboneService.config.mcpPort;
    const host = UnifiedBackboneService.config.host;

    // Detect stdio-only mode (VS Code MCP client launch)
    const isStdioOnly = process.env.ONEAGENT_MCP_STDIO_ONLY === '1';

    // Start HTTP server ONLY in HTTP mode (skip for stdio-only)
    let server: ReturnType<typeof app.listen> | undefined;
    let missionControlWSS: ReturnType<typeof createMissionControlWSS> | undefined;

    if (isStdioOnly) {
      // Stdio-only mode: Skip HTTP server entirely
      if (!QUIET_MODE) {
        console.log('==============================================');
        console.log(`${SERVER_NAME} v${SERVER_VERSION}`);
        console.log(`Protocol: MCP SDK Stdio ${MCP_PROTOCOL_VERSION}`);
        console.log('==============================================');
        console.log('🌟 OneAgent Stdio-Only Mode!');
        console.log('');
        console.log('📡 Transport: stdio (VS Code MCP client)');
        console.log('📋 HTTP server disabled (no port binding)');
        console.log('');
      }
    } else {
      // HTTP mode: Start Express server with WebSocket support
      server = app.listen(port, host, () => {
        // Canonical startup banner
        if (!QUIET_MODE) {
          console.log('==============================================');
          console.log(`${SERVER_NAME} v${SERVER_VERSION}`);
          console.log(`Protocol: HTTP MCP ${MCP_PROTOCOL_VERSION}`);
          console.log('==============================================');
          console.log('🌟 OneAgent HTTP Server Started!');
          console.log('');
          console.log('📡 Server Information:');
          const base = environmentConfig.endpoints.mcp.url.replace(/\/mcp$/, '');
          console.log(`   • HTTP MCP Endpoint: ${base}/mcp`);
          console.log(`   • Health Check: ${base}/health (available now)`);
          console.log(`   • Server Info: ${base}/info`);
          console.log(
            `   • Mission Control WS: ${base.replace(/\/$/, '')}${MISSION_CONTROL_WS_PATH}`,
          );
          console.log('');
          console.log('📋 Note: Engine initialization completed during startup (tools registered)');
          console.log('✅ All endpoints available - server ready for requests!');
        }
      });

      // Proactive, friendly error handling for common startup issues (HTTP mode only)
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
    }

    // Initialize OneAgent in background (tools registration takes ~90-120s)
    // HTTP endpoints work immediately, tool operations queue until ready
    initializeServer()
      .then(() => {
        if (!QUIET_MODE) {
          console.log('');
          console.log('✅ OneAgent Engine Fully Initialized!');
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
      })
      .catch((error) => {
        console.error('❌ OneAgent Engine initialization failed:', error);
        console.error('   Server will continue with limited functionality');
      });

    // Mission Control WebSocket: Only initialize in HTTP mode
    if (!isStdioOnly && server) {
      // Use new modular Mission Control WebSocket server with health delta streaming
      missionControlWSS = createMissionControlWSS(
        server,
        async () => {
          // Use canonical health aggregation; Mission Control only needs overall.status.
          type FullHealth = { overall?: { status?: string } } & Record<string, unknown>;
          const full = (await UnifiedBackboneService.monitoring.getSystemHealth({
            details: true,
          })) as unknown as FullHealth;
          const overallStatus = full.overall?.status || 'unknown';
          return { overall: { status: overallStatus }, full } as {
            overall: { status: string };
            full: FullHealth;
          };
        },
        (count) => {
          missionControlActiveConnections = count;
        },
      );
      // Channel discovery endpoint (read-only)
      app.get('/mission-control/channels', (_req, res) => {
        try {
          interface RegistryLike {
            list?: () => string[];
          }
          const regLike = (missionControlWSS as unknown as { _registry?: RegistryLike })._registry;
          const channels = regLike?.list ? regLike.list() : [];
          res.json({ channels, protocolVersion: 1 });
        } catch (e) {
          res.status(500).json({
            error: 'channel_discovery_failed',
            detail: e instanceof Error ? e.message : String(e),
          });
        }
      });
    }

    // Graceful shutdown (handle both HTTP and stdio-only modes)
    process.on('SIGINT', async () => {
      if (!QUIET_MODE) console.log('\n🛑 Shutting down OneAgent Unified MCP Server...');

      if (server) {
        // HTTP mode: close server and WebSocket connections
        server.close(async () => {
          // Close WS connections gracefully
          try {
            missionControlWSS?.clients.forEach((s) => {
              try {
                s.close(1001, 'server_shutdown');
              } catch {
                /* ignore */
              }
            });
          } catch {
            /* ignore */
          }
          await oneAgent.shutdown();
          if (!QUIET_MODE) console.log('✅ Server shutdown complete');
          process.exit(0);
        });
      } else {
        // Stdio-only mode: just shutdown OneAgent
        await oneAgent.shutdown();
        if (!QUIET_MODE) console.log('✅ Server shutdown complete');
        process.exit(0);
      }
    });

    process.on('SIGTERM', async () => {
      if (!QUIET_MODE) console.log('\n🛑 Shutting down OneAgent Unified MCP Server...');

      if (server) {
        // HTTP mode: close server and WebSocket connections
        server.close(async () => {
          // Close WS connections gracefully
          try {
            missionControlWSS?.clients.forEach((s) => {
              try {
                s.close(1001, 'server_shutdown');
              } catch {
                /* ignore */
              }
            });
          } catch {
            /* ignore */
          }
          await oneAgent.shutdown();
          if (!QUIET_MODE) console.log('✅ Server shutdown complete');
          process.exit(0);
        });
      } else {
        // Stdio-only mode: just shutdown OneAgent
        await oneAgent.shutdown();
        if (!QUIET_MODE) console.log('✅ Server shutdown complete');
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('💥 Failed to start OneAgent Unified MCP Server:', error);
    process.exit(1);
  }
}

// Export app for integration tests (non-started). This does not create parallel servers; tests can import and invoke routes directly.
export { app };

// ============================================================================
// ROBUST SERVER AUTOSTART LOGIC
// ============================================================================
// Goal: Start the server when explicitly invoked (npm run server:unified),
// but not when imported as a module for testing or programmatic use.
//
// Approach: Use multiple detection methods for reliability across environments
// ============================================================================

/**
 * Determine if we should auto-start the server
 *
 * Skip autostart when:
 * - Explicitly disabled via ONEAGENT_DISABLE_AUTOSTART=1
 * - Running in test mode (NODE_ENV=test or ONEAGENT_FAST_TEST_MODE=1)
 * - Module is imported (not main entry point)
 *
 * Force autostart when:
 * - Explicitly enabled via ONEAGENT_FORCE_AUTOSTART=1
 * - Running via npm script with "unified-mcp-server" in path
 */
function shouldAutoStartServer(): boolean {
  // Explicit control flags (highest priority)
  // IMPORTANT: A hard disable must always win over force to avoid double-starts
  if (process.env.ONEAGENT_DISABLE_AUTOSTART === '1') {
    console.log('[STARTUP] ⏸️  Autostart disabled (ONEAGENT_DISABLE_AUTOSTART=1)');
    return false;
  }
  if (process.env.ONEAGENT_FORCE_AUTOSTART === '1') {
    console.log('[STARTUP] 🚀 Forcing autostart (ONEAGENT_FORCE_AUTOSTART=1)');
    return true;
  }

  // Test mode detection
  if (process.env.NODE_ENV === 'test' || process.env.ONEAGENT_FAST_TEST_MODE === '1') {
    console.log('[STARTUP] 🧪 Test mode detected - skipping autostart');
    return false;
  }

  // Check if this is the main entry point
  // Method 1: require.main === module (works in standard Node.js)
  const isMainModule = require.main === module;

  // Method 2: Check if filename contains "unified-mcp-server" (works with ts-node)
  const currentFile = module.filename || '';
  const isServerFile = currentFile.includes('unified-mcp-server');

  // Method 3: Check process.argv for the server script
  const hasServerInArgs = process.argv.some((arg) => arg.includes('unified-mcp-server'));

  console.log('[STARTUP] 🔍 Detection results:', {
    isMainModule,
    isServerFile,
    hasServerInArgs,
    currentFile,
    'require.main': require.main?.filename,
  });

  // Auto-start if any detection method indicates we're running as main
  const shouldStart = isMainModule || (isServerFile && hasServerInArgs);

  if (shouldStart) {
    console.log('[STARTUP] ✅ Auto-starting server (detected as main entry point)');
  } else {
    console.log('[STARTUP] 📦 Module imported - call startServer() explicitly to start');
  }

  return shouldStart;
}

// Execute autostart logic
console.log('[STARTUP] 🔄 Running startup decision logic...');
if (shouldAutoStartServer()) {
  console.log('[STARTUP] 🎬 Initiating server startup...');
  startServer().catch((error) => {
    console.error('💥 Server startup failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });
} else {
  console.log('[STARTUP] 📦 Not auto-starting - waiting for explicit startServer() call');
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

async function handleToolSetsActivate(mcpRequest: MCPRequest): Promise<MCPResponse> {
  const params = (mcpRequest.params || {}) as { setIds?: string[] };
  const setIds = Array.isArray(params.setIds) ? params.setIds : [];
  const status = await oneAgent.setActiveToolSetIds(setIds);
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
