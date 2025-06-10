/**
 * Simplified OneAgent Server for testing UI integration
 * Provides mock data and basic functionality for Milestone 1.4 testing
 */

import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import cors from 'cors';
import path from 'path';
import { randomUUID } from 'crypto';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Only serve API routes, not static files (UI runs on separate port with Vite)

// Mock configuration
let systemConfig: any = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  BRAVE_API_KEY: process.env.BRAVE_API_KEY,
  MEM0_API_KEY: process.env.MEM0_API_KEY,
  MEMORY_RETENTION_DAYS: 30,
  AUTO_CATEGORIZATION: true,
  SIMILARITY_THRESHOLD: 0.8,
  MAX_MEMORIES_PER_CATEGORY: 1000,
  EMBEDDING_CACHE_TTL: 1,
  EMBEDDING_CACHE_SIZE: 10000,
  REQUEST_TIMEOUT: 30,
  CONCURRENT_REQUESTS: 5,
  ENABLE_AUDIT_LOG: true,
  DATA_ENCRYPTION: true,
  SESSION_TIMEOUT: 60,
  ENABLE_NOTIFICATIONS: true,
  ERROR_NOTIFICATIONS: true,
  PERFORMANCE_ALERTS: true,
  NOTIFICATION_LEVEL: 'normal' as const
};

// Mock data generators
function generateMockSystemStatus() {
  return {
    performance: {
      totalOperations: Math.floor(Math.random() * 1000) + 500,
      averageLatency: Math.floor(Math.random() * 100) + 50,
      errorRate: Math.random() * 0.05,
      activeOperations: Math.floor(Math.random() * 10)
    },
    memory: {
      totalMemories: Math.floor(Math.random() * 200) + 100,
      categoryBreakdown: {
        'personal': Math.floor(Math.random() * 50) + 20,
        'work': Math.floor(Math.random() * 40) + 15,
        'technical': Math.floor(Math.random() * 30) + 10,
        'misc': Math.floor(Math.random() * 20) + 5
      },
      avgImportanceScore: Math.random() * 0.5 + 0.5,
      topCategories: ['personal', 'work', 'technical', 'misc']
    },
    services: {
      gemini: Math.random() > 0.2 ? 'connected' : 'error',
      mem0: Math.random() > 0.1 ? 'connected' : 'error',
      embedding: Math.random() > 0.15 ? 'connected' : 'error'
    }
  };
}

function generateMockPerformanceMetrics() {
  return {
    totalOperations: Math.floor(Math.random() * 1000) + 500,
    averageLatency: Math.floor(Math.random() * 100) + 50,
    errorRate: Math.random() * 0.05,
    operations: [
      {
        name: 'gemini_embedding_generation',
        count: Math.floor(Math.random() * 100) + 50,
        totalDuration: Math.floor(Math.random() * 5000) + 2000,
        averageDuration: Math.floor(Math.random() * 100) + 50,
        p95Duration: Math.floor(Math.random() * 150) + 100,
        p99Duration: Math.floor(Math.random() * 200) + 150,
        errorRate: Math.random() * 0.02,
        lastRun: new Date().toISOString()
      },
      {
        name: 'mem0_memory_search',
        count: Math.floor(Math.random() * 80) + 40,
        totalDuration: Math.floor(Math.random() * 3000) + 1500,
        averageDuration: Math.floor(Math.random() * 60) + 30,
        p95Duration: Math.floor(Math.random() * 100) + 70,
        p99Duration: Math.floor(Math.random() * 130) + 100,
        errorRate: Math.random() * 0.01,
        lastRun: new Date().toISOString()
      }
    ]
  };
}

function generateMockMemories() {
  return [
    {
      id: '1',
      content: 'User prefers React over Vue for frontend development',
      metadata: { category: 'technical', importance: 0.8 },
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2', 
      content: 'Meeting scheduled for project review on Friday',
      metadata: { category: 'work', importance: 0.9 },
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      content: 'Coffee preference: oat milk latte, no sugar',
      metadata: { category: 'personal', importance: 0.3 },
      created_at: new Date(Date.now() - 604800000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

// WebSocket handling
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

function broadcastToClients(data: any) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Periodic updates
setInterval(() => {
  const systemStatus = generateMockSystemStatus();
  broadcastToClients({
    type: 'system_status_update',
    data: systemStatus,
    timestamp: new Date().toISOString()
  });
}, 5000);

// API Routes

/**
 * System Status Endpoints
 */
app.get('/api/system/status', async (_req, res) => {
  try {
    const status = generateMockSystemStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/system/health', async (_req, res) => {
  try {
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Performance Endpoints
 */
app.get('/api/performance/metrics', async (_req, res) => {
  try {
    const metrics = generateMockPerformanceMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.delete('/api/performance/metrics', async (_req, res) => {
  try {
    res.json({
      success: true,
      data: { message: 'Performance metrics cleared' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Memory Endpoints
 */
app.get('/api/memory/search', async (req, res) => {
  try {
    const { query, filter } = req.query;
    let memories = generateMockMemories();
    
    if (query) {
      const searchTerm = (query as string).toLowerCase();
      memories = memories.filter(m => 
        m.content.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json({
      success: true,
      data: {
        memories,
        total: memories.length,
        searchType: query ? 'semantic' : 'basic'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/memory/create', async (req, res) => {
  try {
    const { content, metadata } = req.body;
    
    const newMemory = {
      id: Date.now().toString(),
      content,
      metadata: {
        category: 'misc',
        importance: Math.random() * 0.5 + 0.5,
        ...metadata
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: {
        memory: newMemory,
        intelligence: {
          category: 'misc',
          confidence: 0.75,
          importance: newMemory.metadata.importance
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/memory/analytics', async (_req, res) => {
  try {
    const analytics = {
      totalMemories: 150,
      categoryBreakdown: {
        'personal': 45,
        'work': 35,
        'technical': 25,
        'misc': 45
      },
      averageImportance: 0.72,
      topCategories: ['personal', 'misc', 'work', 'technical'],
      recentActivity: {
        created: 12,
        updated: 8,
        accessed: 34
      }
    };
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Configuration Endpoints
 */
app.get('/api/config', (_req, res) => {
  const maskedConfig = {
    ...systemConfig,
    GEMINI_API_KEY: systemConfig.GEMINI_API_KEY ? '***masked***' : undefined,
    BRAVE_API_KEY: systemConfig.BRAVE_API_KEY ? '***masked***' : undefined,
    MEM0_API_KEY: systemConfig.MEM0_API_KEY ? '***masked***' : undefined
  };
  
  res.json({
    success: true,
    data: maskedConfig,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/config', (req, res) => {
  try {
    const updates = req.body;
    
    // Update configuration (excluding API keys in this mock)
    Object.keys(updates).forEach(key => {
      if (key !== 'GEMINI_API_KEY' && key !== 'BRAVE_API_KEY' && key !== 'MEM0_API_KEY') {
        (systemConfig as any)[key] = updates[key];
      }
    });
    
    res.json({
      success: true,
      data: { message: 'Configuration updated successfully' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Catch-all for non-API routes - redirect to frontend
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.status(200).json({ 
      message: 'OneAgent API Server', 
      frontend: 'http://localhost:3000',
      api: 'http://localhost:8080/api'
    });
  }
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`🚀 OneAgent Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`🎯 Frontend running on http://localhost:3000`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

// MCP Session Management
const mcpSessions = new Map<string, {
  id: string;
  createdAt: Date;
  lastActivity: Date;
}>();

// MCP Message ID tracking for SSE streams
let mcpMessageIdCounter = 0;

// Helper function to validate JSON-RPC message
function isValidJsonRpcMessage(message: any): boolean {
  return message && 
         typeof message === 'object' && 
         message.jsonrpc === '2.0' &&
         (message.method || message.result !== undefined || message.error !== undefined);
}

// Helper function to create JSON-RPC response
function createJsonRpcResponse(id: any, result?: any, error?: any) {
  const response: any = {
    jsonrpc: '2.0',
    id
  };
  
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  
  return response;
}

// Helper function to create JSON-RPC error
function createJsonRpcError(code: number, message: string, data?: any) {
  return {
    code,
    message,
    ...(data && { data })
  };
}

/**
 * MCP Endpoint - Streamable HTTP Transport
 * Implements the MCP specification for HTTP transport
 */
app.post('/mcp', async (req, res) => {
  try {
    // Validate Origin header for security (localhost only)
    const origin = req.get('origin');
    if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return res.status(403).json({
        error: 'Forbidden: Invalid origin'
      });
    }

    // Check session ID if required
    const sessionId = req.get('Mcp-Session-Id');
    let session = null;
    
    if (sessionId) {
      session = mcpSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({
          error: 'Session not found'
        });
      }
      // Update last activity
      session.lastActivity = new Date();
    }

    const body = req.body;
    
    // Handle single message or batch
    const messages = Array.isArray(body) ? body : [body];
    
    // Validate all messages are valid JSON-RPC
    for (const message of messages) {
      if (!isValidJsonRpcMessage(message)) {
        return res.status(400).json(createJsonRpcError(
          -32600, 
          'Invalid Request',
          'All messages must be valid JSON-RPC 2.0 format'
        ));
      }
    }

    // Check if messages contain only responses/notifications
    const hasRequests = messages.some(msg => msg.method && msg.id !== undefined);
    const hasOnlyNotificationsOrResponses = messages.every(msg => 
      (msg.method && msg.id === undefined) || // notification
      (msg.result !== undefined || msg.error !== undefined) // response
    );

    if (hasOnlyNotificationsOrResponses) {
      // Process notifications/responses and return 202 Accepted
      return res.status(202).send();
    }

    // If we have requests, we need to process them and return responses
    if (hasRequests) {
      const responses = [];
      
      for (const message of messages) {
        if (message.method) {
          // Process MCP method
          const response = await processMcpMethod(message);
          
          // Handle initialization specially
          if (message.method === 'initialize' && response.result) {
            // Create new session for initialization
            const newSessionId = randomUUID();
            const newSession = {
              id: newSessionId,
              createdAt: new Date(),
              lastActivity: new Date()
            };
            mcpSessions.set(newSessionId, newSession);
            
            // Add session ID to response headers
            res.set('Mcp-Session-Id', newSessionId);
          }
          
          responses.push(response);
        }
      }

      // Return JSON response for now (can be enhanced to support SSE)
      res.set('Content-Type', 'application/json');
      return res.json(responses.length === 1 ? responses[0] : responses);
    }

    // Shouldn't reach here, but handle gracefully
    return res.status(400).json(createJsonRpcError(
      -32600,
      'Invalid Request',
      'No valid requests found'
    ));

  } catch (error) {
    console.error('MCP endpoint error:', error);
    return res.status(500).json(createJsonRpcError(
      -32603,
      'Internal error',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
});

// GET endpoint for SSE streams (optional)
app.get('/mcp', async (req, res) => {
  try {
    // Validate Accept header
    const acceptHeader = req.get('accept');
    if (!acceptHeader?.includes('text/event-stream')) {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Set up SSE stream
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial ping
    const eventId = ++mcpMessageIdCounter;
    res.write(`id: ${eventId}\n`);
    res.write(`event: ping\n`);
    res.write(`data: {"type": "ping", "timestamp": "${new Date().toISOString()}"}\n\n`);

    // Keep connection alive
    const keepAlive = setInterval(() => {
      const eventId = ++mcpMessageIdCounter;
      res.write(`id: ${eventId}\n`);
      res.write(`event: ping\n`);
      res.write(`data: {"type": "ping", "timestamp": "${new Date().toISOString()}"}\n\n`);
    }, 30000);    // Handle client disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
    });

    // SSE stream established - connection remains open
    return;
    
  } catch (error) {
    console.error('MCP SSE endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE endpoint for session termination
app.delete('/mcp', async (req, res) => {
  try {
    const sessionId = req.get('Mcp-Session-Id');
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    if (mcpSessions.has(sessionId)) {
      mcpSessions.delete(sessionId);
      return res.status(200).json({ message: 'Session terminated' });
    } else {
      return res.status(404).json({ error: 'Session not found' });
    }  } catch (error) {
    console.error('MCP session termination error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Process MCP method calls
 */
async function processMcpMethod(message: any) {
  const { method, params, id } = message;

  try {
    switch (method) {
      case 'initialize':
        return createJsonRpcResponse(id, {
          protocolVersion: '2025-03-26',
          serverInfo: {
            name: 'OneAgent MCP Server',
            version: '1.0.0'
          },
          capabilities: {
            tools: {
              listChanged: false
            },
            resources: {
              subscribe: false,
              listChanged: false
            },
            prompts: {
              listChanged: false
            },
            logging: {}
          }
        });

      case 'notifications/initialized':
        // No response for notifications
        return null;

      case 'tools/list':
        return createJsonRpcResponse(id, {
          tools: [
            {
              name: 'memory_search',
              description: 'Search memories in the OneAgent memory system',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Search query for memories'
                  },
                  filter: {
                    type: 'object',
                    description: 'Optional filters for the search'
                  }
                },
                required: ['query']
              }
            },
            {
              name: 'memory_create',
              description: 'Create a new memory in the OneAgent memory system',
              inputSchema: {
                type: 'object',
                properties: {
                  content: {
                    type: 'string',
                    description: 'Content of the memory to create'
                  },
                  metadata: {
                    type: 'object',
                    description: 'Optional metadata for the memory'
                  }
                },                required: ['content']
              }
            },
            {
              name: 'system_status',
              description: 'Get current system status and health metrics',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        });

      case 'tools/call':
        return await handleToolCall(params, id);

      case 'resources/list':
        return createJsonRpcResponse(id, {
          resources: [
            {
              uri: 'oneagent://memory/analytics',
              name: 'Memory Analytics',
              description: 'Current memory analytics and statistics',
              mimeType: 'application/json'
            },
            {
              uri: 'oneagent://system/performance',
              name: 'System Performance',
              description: 'Current system performance metrics',
              mimeType: 'application/json'
            }
          ]
        });

      case 'resources/read':
        return await handleResourceRead(params, id);

      case 'prompts/list':
        return createJsonRpcResponse(id, {
          prompts: [
            {
              name: 'analyze_memory',
              description: 'Analyze and categorize memory content',
              arguments: [
                {
                  name: 'content',
                  description: 'Memory content to analyze',
                  required: true
                }
              ]
            }
          ]
        });

      case 'prompts/get':
        return await handlePromptGet(params, id);

      default:
        return createJsonRpcResponse(id, null, createJsonRpcError(
          -32601,
          'Method not found',
          `Unknown method: ${method}`
        ));
    }
  } catch (error) {
    console.error(`Error processing MCP method ${method}:`, error);
    return createJsonRpcResponse(id, null, createJsonRpcError(
      -32603,
      'Internal error',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
}

/**
 * Handle tool calls
 */
async function handleToolCall(params: any, id: any) {
  const { name, arguments: args } = params;

  try {
    switch (name) {
      case 'memory_search':
        const searchResults = await handleMemorySearch(args.query);
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify(searchResults, null, 2)
          }],
          isError: false
        });

      case 'memory_create':
        const createResult = await handleMemoryCreate(args.content, args.metadata);
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text', 
            text: JSON.stringify(createResult, null, 2)
          }],
          isError: false
        });

      case 'system_status':
        const statusResult = generateMockSystemStatus();
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify(statusResult, null, 2)
          }],
          isError: false
        });

      default:
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: `Unknown tool: ${name}`
          }],
          isError: true
        });
    }
  } catch (error) {
    return createJsonRpcResponse(id, {
      content: [{
        type: 'text',
        text: `Tool execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      isError: true
    });
  }
}

/**
 * Handle resource reads
 */
async function handleResourceRead(params: any, id: any) {
  const { uri } = params;

  try {
    switch (uri) {
      case 'oneagent://memory/analytics':
        const analytics = {
          totalMemories: 150,
          categoryBreakdown: {
            'personal': 45,
            'work': 35, 
            'technical': 25,
            'misc': 45
          },
          averageImportance: 0.72,
          timestamp: new Date().toISOString()
        };
        return createJsonRpcResponse(id, {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(analytics, null, 2)
          }]
        });

      case 'oneagent://system/performance':
        const performance = generateMockPerformanceMetrics();
        return createJsonRpcResponse(id, {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(performance, null, 2)
          }]
        });

      default:
        return createJsonRpcResponse(id, null, createJsonRpcError(
          -32601,
          'Resource not found',
          `Unknown resource URI: ${uri}`
        ));
    }
  } catch (error) {
    return createJsonRpcResponse(id, null, createJsonRpcError(
      -32603,
      'Internal error',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
}

/**
 * Handle prompt gets
 */
async function handlePromptGet(params: any, id: any) {
  const { name, arguments: args } = params;

  try {
    switch (name) {
      case 'analyze_memory':
        const content = args?.content || '';
        return createJsonRpcResponse(id, {
          description: 'Analyze and categorize memory content',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please analyze the following memory content and categorize it:\n\n${content}\n\nProvide category, importance score (0-1), and key insights.`
              }
            }
          ]
        });

      default:
        return createJsonRpcResponse(id, null, createJsonRpcError(
          -32601,
          'Prompt not found',
          `Unknown prompt: ${name}`
        ));
    }
  } catch (error) {
    return createJsonRpcResponse(id, null, createJsonRpcError(
      -32603,
      'Internal error', 
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
}

/**
 * Helper functions for tool implementations
 */
async function handleMemorySearch(query: string) {
  const memories = generateMockMemories();
  const searchTerm = query.toLowerCase();
  
  const filtered = memories.filter(m => 
    m.content.toLowerCase().includes(searchTerm)
  );
  
  return {
    memories: filtered,
    total: filtered.length,
    query,
    searchType: 'semantic'
  };
}

async function handleMemoryCreate(content: string, metadata?: any) {
  const newMemory = {
    id: Date.now().toString(),
    content,
    metadata: {
      category: 'misc',
      importance: Math.random() * 0.5 + 0.5,
      ...metadata
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return {
    memory: newMemory,
    intelligence: {
      category: newMemory.metadata.category,
      confidence: 0.75,
      importance: newMemory.metadata.importance
    }
  };
}
