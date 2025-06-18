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
 */

// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config();

import { randomUUID } from 'crypto';
import { OneAgentEngine, OneAgentRequest, OneAgentResponse } from '../OneAgentEngine';
import { oneAgentConfig } from '../config/index';
import { SimpleAuditLogger } from '../audit/auditLogger';

const express = require('express');
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic CORS headers
app.use((req: any, res: any, next: any) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize OneAgent Engine
const oneAgent = OneAgentEngine.getInstance({
  mode: 'mcp-http',
  constitutional: {
    enabled: true,
    qualityThreshold: 80
  },
  multiAgent: {
    enabled: true,
    maxAgents: 5
  },
  memory: {
    enabled: true,
    retentionDays: 30
  },
  mcp: {
    http: { port: oneAgentConfig.mcpPort, enabled: true },
    stdio: { enabled: false },
    websocket: { port: oneAgentConfig.mcpPort + 1, enabled: false }
  }
});

// MCP Protocol Interfaces
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPInitializeParams {
  protocolVersion: string;
  capabilities: {
    roots?: { listChanged?: boolean };
    sampling?: {};
  };
  clientInfo: {
    name: string;
    version: string;
  };
}

interface MCPServerCapabilities {
  logging?: {};
  prompts?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  tools?: {
    listChanged?: boolean;
  };
}

// Initialize audit logger
const auditLogger = new SimpleAuditLogger({
  logDirectory: 'logs/mcp-server',
  enableConsoleOutput: process.env.NODE_ENV === 'development'
});

// Store server state
let serverInitialized = false;
let clientInfo: any = null;

/**
 * Initialize MCP server and OneAgent engine
 */
async function initializeServer(): Promise<void> {
  try {
    await auditLogger.logInfo('MCP_SERVER', 'Initializing OneAgent Unified MCP Server...', {});
    
    await oneAgent.initialize('mcp-http');
    
    await auditLogger.logInfo('MCP_SERVER', 'OneAgent Unified MCP Server ready', {
      protocol: `http://localhost:${oneAgentConfig.mcpPort}/mcp`,
      constitutionalAI: 'ACTIVE',
      bmadFramework: 'ACTIVE',
      unifiedTools: 'ACTIVE'
    });
    
  } catch (error) {
    await auditLogger.logError('MCP_SERVER', 'Server initialization failed', { 
      error: error instanceof Error ? error.message : String(error)
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
    
    // Convert to OneAgent request
    const oneAgentRequest: OneAgentRequest = {
      id: String(mcpRequest.id),
      type: determineRequestType(mcpRequest.method),
      method: mcpRequest.method,
      params: mcpRequest.params || {},
      timestamp: new Date().toISOString()
    };
    
    const oneAgentResponse = await oneAgent.processRequest(oneAgentRequest);
    
    return convertToMCPResponse(mcpRequest.id, oneAgentResponse);
    
  } catch (error) {
    console.error('❌ MCP request failed:', error);
    
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error',
        data: { timestamp: new Date().toISOString() }
      }
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
  const params = mcpRequest.params as MCPInitializeParams;
  clientInfo = params.clientInfo;
  serverInitialized = true;
  
  console.log(`🤝 MCP Client connected: ${clientInfo.name} v${clientInfo.version}`);
  
  const capabilities: MCPServerCapabilities = {
    logging: {},
    prompts: { listChanged: true },
    resources: { subscribe: true, listChanged: true },
    tools: { listChanged: true }
  };
  
  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      protocolVersion: '2024-11-05',
      capabilities,
      serverInfo: {
        name: 'OneAgent Unified MCP Server',
        version: '4.0.0'
      }
    }
  };
}

function handleToolsList(mcpRequest: MCPRequest): MCPResponse {
  const tools = oneAgent.getAvailableTools();
  
  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    }
  };
}

async function handleToolCall(mcpRequest: MCPRequest): Promise<MCPResponse> {
  const { name, arguments: args } = mcpRequest.params;
  
  const oneAgentRequest: OneAgentRequest = {
    id: String(mcpRequest.id),
    type: 'tool_call',
    method: name,
    params: args,
    timestamp: new Date().toISOString()
  };
  
  const response = await oneAgent.processRequest(oneAgentRequest);
  
  if (!response.success) {
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32603,
        message: response.error?.message || 'Tool execution failed'
      }
    };
  }
  
  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      content: [
        {
          type: 'text',
          text: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
        }
      ],
      isError: false
    }
  };
}

function handleResourcesList(mcpRequest: MCPRequest): MCPResponse {
  const resources = oneAgent.getAvailableResources();
  
  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      resources: resources.map(resource => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType
      }))
    }
  };
}

async function handleResourceRead(mcpRequest: MCPRequest): Promise<MCPResponse> {
  const { uri } = mcpRequest.params;
  
  const oneAgentRequest: OneAgentRequest = {
    id: String(mcpRequest.id),
    type: 'resource_get',
    method: uri,
    params: mcpRequest.params,
    timestamp: new Date().toISOString()
  };
  
  const response = await oneAgent.processRequest(oneAgentRequest);
  
  if (!response.success) {
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32603,
        message: response.error?.message || 'Resource read failed'
      }
    };
  }
  
  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(response.data, null, 2)
        }
      ]
    }
  };
}

function handlePromptsList(mcpRequest: MCPRequest): MCPResponse {
  const prompts = oneAgent.getAvailablePrompts();
  
  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      prompts: prompts.map(prompt => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments
      }))
    }
  };
}

async function handlePromptGet(mcpRequest: MCPRequest): Promise<MCPResponse> {
  const { name, arguments: args } = mcpRequest.params;
  
  const oneAgentRequest: OneAgentRequest = {
    id: String(mcpRequest.id),
    type: 'prompt_invoke',
    method: name,
    params: args,
    timestamp: new Date().toISOString()
  };
  
  const response = await oneAgent.processRequest(oneAgentRequest);
  
  if (!response.success) {
    return {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      error: {
        code: -32603,
        message: response.error?.message || 'Prompt execution failed'
      }
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
            text: JSON.stringify(response.data, null, 2)
          }
        }
      ]
    }
  };
}

function convertToMCPResponse(id: string | number, oneAgentResponse: OneAgentResponse): MCPResponse {
  if (!oneAgentResponse.success) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: oneAgentResponse.error?.message || 'Request failed',
        data: oneAgentResponse.error?.details
      }
    };
  }
  
  return {
    jsonrpc: '2.0',
    id,
    result: oneAgentResponse.data
  };
}

// HTTP Routes

/**
 * Main MCP endpoint
 */
app.post('/mcp', async (req: any, res: any) => {
  try {
    const mcpRequest: MCPRequest = req.body;
    
    // Validate MCP request format
    if (!mcpRequest.jsonrpc || mcpRequest.jsonrpc !== '2.0') {
      res.status(400).json({
        jsonrpc: '2.0',
        id: mcpRequest.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request: missing or invalid jsonrpc field'
        }
      });
      return;
    }
    
    if (!mcpRequest.method) {
      res.status(400).json({
        jsonrpc: '2.0',
        id: mcpRequest.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request: missing method field'
        }
      });
      return;
    }
    
    console.log(`📥 MCP Request: ${mcpRequest.method} (ID: ${mcpRequest.id})`);
    
    const response = await handleMCPRequest(mcpRequest);
    
    console.log(`📤 MCP Response: ${response.result ? 'SUCCESS' : 'ERROR'} (ID: ${response.id})`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ MCP endpoint error:', error);
    
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: 'Internal error',
        data: { timestamp: new Date().toISOString() }
      }
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (_req: any, res: any) => {
  res.json({
    status: 'healthy',
    server: 'OneAgent Unified MCP Server',
    version: '4.0.0',
    initialized: serverInitialized,
    constitutional: true,
    bmad: true,
    timestamp: new Date().toISOString()
  });
});

/**
 * Server info endpoint
 */
app.get('/info', (_req: any, res: any) => {
  res.json({
    server: {
      name: 'OneAgent Unified MCP Server',
      version: '4.0.0',
      protocol: 'HTTP MCP 2024-11-05'
    },
    features: {
      constitutionalAI: true,
      bmadFramework: true,
      multiAgent: true,
      unifiedMemory: true,
      qualityScoring: true
    },
    endpoints: {
      mcp: '/mcp',
      health: '/health',
      info: '/info'
    },
    client: clientInfo,
    initialized: serverInitialized,
    timestamp: new Date().toISOString()
  });
});

/**
 * Start the unified MCP server
 */
async function startServer(): Promise<void> {
  try {
    await initializeServer();
    
    const port = oneAgentConfig.mcpPort;
    
    const server = app.listen(port, () => {
      console.log('🌟 OneAgent Unified MCP Server Started Successfully!');
      console.log('');
      console.log('📡 Server Information:');
      console.log(`   • HTTP MCP Endpoint: http://localhost:${port}/mcp`);
      console.log(`   • Health Check: http://localhost:${port}/health`);
      console.log(`   • Server Info: http://localhost:${port}/info`);
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
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down OneAgent Unified MCP Server...');
      server.close(async () => {
        await oneAgent.shutdown();
        console.log('✅ Server shutdown complete');
        process.exit(0);
      });
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down OneAgent Unified MCP Server...');
      server.close(async () => {
        await oneAgent.shutdown();
        console.log('✅ Server shutdown complete');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('💥 Failed to start OneAgent Unified MCP Server:', error);
    process.exit(1);
  }
}

// Auto-start if this file is run directly
if (require.main === module) {
  startServer().catch(error => {
    console.error('💥 Startup failed:', error);
    process.exit(1);
  });
}

export { startServer, oneAgent };
