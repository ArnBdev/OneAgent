/**
 * OneAgent Server with MCP HTTP Transport Implementation
 * Implements the MCP specification for Streamable HTTP transport
 */

import express = require('express');
import http = require('http');
import WebSocket = require('ws');
import cors = require('cors');
import { randomUUID } from 'crypto';

// Import OneAgent tools
import { BraveSearchClient } from '../tools/braveSearchClient';
import { WebSearchTool } from '../tools/webSearch';
import { WebFetchTool } from '../tools/webFetch';
import { GeminiClient } from '../tools/geminiClient';
import { AIAssistantTool } from '../tools/aiAssistant';
import { GeminiEmbeddingsTool } from '../tools/geminiEmbeddings';
import { Mem0Client } from '../tools/mem0Client';
import { listWorkflows } from '../tools/listWorkflows';
import { AgentFactory } from '../agents/base/AgentFactory';
import { WebFindingsManager } from '../intelligence/webFindingsManager';
import { EnhancedWebTools } from '../integration/webToolsIntegration';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'User-Agent', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Mock configuration
let systemConfig: any = {
  GEMINI_API_KEY: process.env.GOOGLE_API_KEY,
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
  PERFORMANCE_ALERTS: true,  NOTIFICATION_LEVEL: 'normal' as const
};

// Initialize OneAgent tools
const mem0Client = new Mem0Client();

const braveConfig = {
  apiKey: process.env.BRAVE_API_KEY || 'your_brave_search_api_key_here',
  ...(process.env.BRAVE_API_URL && { baseUrl: process.env.BRAVE_API_URL })
};
const braveSearchClient = new BraveSearchClient(braveConfig);
const webSearchTool = new WebSearchTool(braveSearchClient);
const webFetchTool = new WebFetchTool({
  defaultUserAgent: 'OneAgent-WebFetchTool/1.0 (https://github.com/oneagent)',
  maxContentSize: 5 * 1024 * 1024, // 5MB limit for MCP usage
  rateLimit: {
    requestsPerSecond: 1,
    requestsPerMinute: 30
  }
});

const geminiConfig = {
  apiKey: process.env.GOOGLE_API_KEY || 'your_gemini_api_key_here',
  ...(process.env.GEMINI_API_URL && { baseUrl: process.env.GEMINI_API_URL })
};
const geminiClient = new GeminiClient(geminiConfig);
const aiAssistantTool = new AIAssistantTool(geminiClient);
const embeddingsTool = new GeminiEmbeddingsTool(geminiClient, mem0Client);

// Initialize WebFindingsManager and EnhancedWebTools
const webFindingsManager = new WebFindingsManager({
  storage: {
    enableCaching: true,
    enablePersistence: true,
    maxCacheSize: 100, // MB
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    compressionThreshold: 50 * 1024, // 50KB
    autoCleanupInterval: 60 * 60 * 1000 // 1 hour
  },
  classification: {
    autoClassify: true,
    importanceThreshold: 0.6,
    devAgentRelevanceBoost: 1.5
  },
  privacy: {
    obfuscateUrls: false,
    excludePatterns: [
      '**/login/**',
      '**/auth/**',
      '**/admin/**',
      '**/private/**'
    ],
    maxPersonalDataRetention: 30 // days
  }
});

const enhancedWebTools = new EnhancedWebTools(
  webSearchTool,
  webFetchTool
);

// MCP Session Management
const mcpSessions = new Map<string, {
  id: string;
  createdAt: Date;
  lastActivity: Date;
}>();

// MCP Message ID tracking for SSE streams
let mcpMessageIdCounter = 0;

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

wss.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket connection established');
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error: Error) => {
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
app.post('/mcp', async (req: express.Request, res: express.Response) => {
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
    }    const body = req.body;
    console.log('MCP POST request body:', JSON.stringify(body, null, 2));
    
    // Handle single message or batch
    const messages = Array.isArray(body) ? body : [body];
    console.log('Processing messages:', messages.length);
    
    // Validate all messages are valid JSON-RPC
    for (const message of messages) {
      console.log('Validating message:', JSON.stringify(message, null, 2));
      if (!isValidJsonRpcMessage(message)) {
        console.log('Invalid JSON-RPC message:', message);
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
          const response = await processMcpMethod(message, session);
          
          // Handle initialization specially
          if (message.method === 'initialize' && response?.result) {
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
          
          if (response) {
            responses.push(response);
          }
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
app.get('/mcp', async (req: express.Request, res: express.Response) => {
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
    }, 30000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
    });

    return;

  } catch (error) {
    console.error('MCP SSE endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE endpoint for session termination
app.delete('/mcp', async (req: express.Request, res: express.Response) => {
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
    }
  } catch (error) {
    console.error('MCP session termination error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Process MCP method calls
 */
async function processMcpMethod(message: any, _session: any) {
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
        return null;      case 'tools/list':
        return createJsonRpcResponse(id, {
          tools: [
            // Memory Tools
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
                },
                required: ['content']
              }            },            // Enhanced Web Search Tools (with intelligent storage)
            {
              name: 'web_search',
              description: 'Search the web using Brave Search API with intelligent findings storage',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Search query'
                  },
                  count: {
                    type: 'number',
                    description: 'Number of results to return (default: 5)'
                  },
                  country: {
                    type: 'string',
                    description: 'Country code for localized results (default: US)'
                  },
                  includeRecent: {
                    type: 'boolean',
                    description: 'Include recent results from last week'
                  },
                  userContext: {
                    type: 'string',
                    description: 'Context about the user or session for relevance scoring'
                  }
                },
                required: ['query']
              }
            },
            {
              name: 'web_fetch',
              description: 'Fetch and extract content from web pages with intelligent storage',
              inputSchema: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description: 'URL to fetch content from'
                  },
                  extractContent: {
                    type: 'boolean',
                    description: 'Extract and clean HTML content (default: true)'
                  },
                  extractMetadata: {
                    type: 'boolean',
                    description: 'Extract page metadata including Open Graph and Twitter Cards (default: true)'
                  },
                  timeout: {
                    type: 'number',
                    description: 'Request timeout in milliseconds (default: 10000)'
                  },
                  followRedirects: {
                    type: 'boolean',
                    description: 'Follow HTTP redirects (default: true)'
                  },
                  userContext: {
                    type: 'string',
                    description: 'Context about the user or session for relevance scoring'
                  }
                },
                required: ['url']
              }
            },
            // Web Findings Management Tools
            {
              name: 'web_findings_search',
              description: 'Search through previously collected web findings with filtering',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Search query to find relevant findings'
                  },
                  type: {
                    type: 'string',
                    enum: ['search', 'fetch'],
                    description: 'Type of findings to search (search or fetch)'
                  },
                  minRelevance: {
                    type: 'number',
                    description: 'Minimum relevance score (0-1, default: 0.1)'
                  },
                  maxAge: {
                    type: 'number',
                    description: 'Maximum age in hours (default: 168 for 1 week)'
                  },
                  limit: {
                    type: 'number',
                    description: 'Maximum number of results (default: 10)'
                  }
                },
                required: ['query']
              }
            },
            {
              name: 'web_findings_stats',
              description: 'Get statistics about stored web findings',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            },
            // AI Assistant Tools
            {
              name: 'ai_chat',
              description: 'Chat with Gemini AI for intelligent responses',
              inputSchema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: 'Message to send to AI'
                  },
                  context: {
                    type: 'string',
                    description: 'Optional context for the conversation'
                  },
                  temperature: {
                    type: 'number',
                    description: 'Response creativity (0-1, default: 0.7)'
                  },
                  maxTokens: {
                    type: 'number',
                    description: 'Maximum tokens in response (default: 1000)'
                  }
                },
                required: ['message']
              }
            },
            {
              name: 'ai_summarize',
              description: 'Summarize text using Gemini AI',
              inputSchema: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description: 'Text to summarize'
                  },
                  maxLength: {
                    type: 'number',
                    description: 'Maximum summary length in characters'
                  },
                  style: {
                    type: 'string',
                    enum: ['brief', 'detailed', 'bullet-points'],
                    description: 'Summary style (default: brief)'
                  }
                },
                required: ['text']
              }
            },
            {
              name: 'ai_analyze',
              description: 'Analyze text with specific instructions using Gemini AI',
              inputSchema: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description: 'Text to analyze'
                  },
                  instruction: {
                    type: 'string',
                    description: 'Analysis instruction or question'
                  },
                  context: {
                    type: 'string',
                    description: 'Optional additional context'
                  }
                },
                required: ['text', 'instruction']
              }
            },
            // Semantic Tools
            {
              name: 'embedding_generate',
              description: 'Generate semantic embeddings for text',
              inputSchema: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description: 'Text to generate embeddings for'
                  },
                  taskType: {
                    type: 'string',
                    enum: ['SEMANTIC_SIMILARITY', 'CLASSIFICATION', 'CLUSTERING'],
                    description: 'Task type for embedding optimization'
                  }
                },
                required: ['text']
              }
            },
            {
              name: 'similarity_search',
              description: 'Find similar texts using semantic embeddings',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Query text to find similarities for'
                  },
                  candidates: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of candidate texts to compare against'
                  },
                  threshold: {
                    type: 'number',
                    description: 'Similarity threshold (0-1, default: 0.7)'
                  },
                  maxResults: {
                    type: 'number',
                    description: 'Maximum number of results to return (default: 5)'
                  }
                },
                required: ['query', 'candidates']
              }
            },
            // Workflow Tools
            {
              name: 'workflow_help',
              description: 'Get AI assistance with workflow tasks',
              inputSchema: {
                type: 'object',
                properties: {
                  workflowName: {
                    type: 'string',
                    description: 'Name of the workflow'
                  },
                  currentStep: {
                    type: 'string',
                    description: 'Current step in the workflow'
                  },
                  context: {
                    type: 'string',
                    description: 'Workflow context and current situation'
                  }
                },
                required: ['workflowName', 'currentStep', 'context']
              }
            },
            // System Tools
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
        const searchResults = await handleMemorySearch(args.query, args.filter);
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
        });      case 'web_search':
        const searchOptions: any = {
          query: args.query,
          count: args.count || 5,
          country: args.country || 'US',
          includeRecent: args.includeRecent || false,
          sessionId: `session-${Date.now()}`,
          storeFindings: true
        };
        
        if (args.userContext) {
          searchOptions.userId = `user-${args.userContext}`;
        }
        
        const webSearchResults = await enhancedWebTools.search(searchOptions);
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify(webSearchResults, null, 2)
          }],
          isError: false
        });      case 'web_fetch':
        const fetchOptions: any = {
          extractContent: args.extractContent !== false,
          extractMetadata: args.extractMetadata !== false,
          timeout: args.timeout || 10000,
          followRedirects: args.followRedirects !== false,
          sessionId: `session-${Date.now()}`,
          storeFindings: true
        };
        
        if (args.userContext) {
          fetchOptions.userId = `user-${args.userContext}`;
        }
        
        const webFetchResult = await enhancedWebTools.fetch(args.url, fetchOptions);
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify(webFetchResult, null, 2)
          }],
          isError: false
        });      case 'web_findings_search':
        const findingsOptions: any = {
          query: args.query,
          category: args.type === 'search' ? 'research' : 'documentation',
          limit: args.limit || 10,
          sortBy: 'relevance',
          sortOrder: 'desc'
        };
        
        if (args.userContext) {
          findingsOptions.userId = `user-${args.userContext}`;
        }
        
        const findingsResults = await webFindingsManager.searchFindings(findingsOptions);
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify(findingsResults, null, 2)
          }],
          isError: false
        });

      case 'web_findings_stats':
        const stats = await webFindingsManager.getStorageStats();
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify(stats, null, 2)
          }],
          isError: false
        });

      case 'ai_chat':
        const chatResult = await aiAssistantTool.ask(args.message, {
          temperature: args.temperature,
          maxTokens: args.maxTokens,
          context: args.context,
          format: args.format
        });
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify(chatResult, null, 2)
          }],
          isError: false
        });      case 'ai_summarize':
        const summarizeResult = await aiAssistantTool.summarize(args.text, {
          maxLength: args.maxLength,
          style: args.style
        });
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify(summarizeResult, null, 2)
          }],
          isError: false
        });

      case 'ai_analyze':
        const analyzeResult = await aiAssistantTool.analyze(args.text, args.instruction, {
          temperature: args.temperature,
          maxTokens: args.maxTokens,
          context: args.context,
          format: args.format
        });
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify(analyzeResult, null, 2)
          }],
          isError: false
        });

      case 'embedding_generate':
        const embeddingResult = await geminiClient.generateEmbedding(args.text, {
          taskType: args.taskType || 'RETRIEVAL_DOCUMENT',
          model: args.model
        });
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify(embeddingResult, null, 2)
          }],
          isError: false
        });

      case 'similarity_search':
        const similarityResults = await embeddingsTool.semanticSearch(
          args.query,
          args.filter,
          {
            taskType: args.taskType,
            topK: args.topK || 5,
            similarityThreshold: args.similarityThreshold || 0.7,
            model: args.model
          }
        );
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify(similarityResults, null, 2)
          }],
          isError: false
        });

      case 'workflow_help':
        const workflows = await listWorkflows();
        return createJsonRpcResponse(id, {
          content: [{
            type: 'text',
            text: JSON.stringify({
              availableWorkflows: workflows,
              description: 'Available OneAgent workflows and their capabilities',
              timestamp: new Date().toISOString()
            }, null, 2)
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
async function handleMemorySearch(query: string, _filter?: any) {
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

// API Routes (basic endpoints)
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'healthy',
    mcp: {
      endpoint: '/mcp',
      protocol: '2025-03-26',
      capabilities: ['tools', 'resources', 'prompts']
    },
    timestamp: new Date().toISOString()
  });
});

// Chat API endpoints
app.post('/api/chat', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { message, userId, agentType = 'general', memoryContext } = req.body;
    if (!message || !userId) {
      res.status(400).json({
        error: 'Missing required fields: message and userId'
      });
      return;
    }

    let response: string;
    let responseAgentType = agentType;
    let actualMemoryContext: any = undefined;

    try {
      // Try to use the AgentFactory to determine the best agent for this message
      const agent = AgentFactory.createAgent(agentType);
      
      // Check if we can use AI Assistant for a more intelligent response
      if (geminiClient && aiAssistantTool) {
        console.log(`🤖 Processing chat message with AI Assistant: "${message}"`);
        const aiResponse = await aiAssistantTool.ask(message);
        response = aiResponse.result;
        
        // Try to search memory for context
        if (mem0Client) {
          try {
            const memoriesResponse = await mem0Client.searchMemories({
              userId: userId,
              query: message,
              limit: 3
            });
            
            if (memoriesResponse.success && memoriesResponse.data && memoriesResponse.data.length > 0) {              actualMemoryContext = {
                relevantMemories: memoriesResponse.data.length,
                searchTerms: [message],
                memories: memoriesResponse.data.slice(0, 3).map(m => ({
                  content: m.content,
                  relevance: 0.5 // Default relevance score since Mem0Memory doesn't include score
                }))
              };
            }
          } catch (memoryError) {
            console.log('💭 Memory search unavailable, using AI response only');
          }
        }
        
      } else {
        // Fallback to simple responses if AI is not available
        const responses = [
          "I understand you're asking about that. Let me help you with that.",
          "That's an interesting question. Here's what I think...",
          "Based on what you've told me, I would suggest...",
          "I can help you with that. Here's my recommendation...",
          "Let me think about that for a moment. I believe..."
        ];
        response = responses[Math.floor(Math.random() * responses.length)] + ` (You asked: "${message}")`;
      }
    } catch (agentError) {
      console.error('Agent processing error:', agentError);
      response = "I apologize, but I encountered an issue processing your request. Let me try to help you anyway.";
    }
    
    res.json({
      response,
      agentType: responseAgentType,
      memoryContext: actualMemoryContext,
      timestamp: new Date().toISOString(),
      processed: true
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      response: 'I apologize, but I encountered an error processing your message. Please try again.',
      agentType: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      processed: false
    });
  }
});

app.get('/api/chat/history/:userId', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    // Mock chat history for now
    const mockHistory = [
      {
        id: 'msg_1',
        content: 'Hello, how can you help me today?',
        role: 'user',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        agentType: 'general'
      },
      {
        id: 'msg_2',
        content: 'Hello! I\'m OneAgent, and I can help you with various tasks including answering questions, searching the web, and managing your memories.',
        role: 'assistant',
        timestamp: new Date(Date.now() - 295000).toISOString(),
        agentType: 'general'
      }
    ];

    res.json({
      messages: mockHistory,
      total: mockHistory.length,
      userId
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve chat history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/chat/history/:userId', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    res.json({
      message: 'Chat history cleared successfully',
      userId
    });

  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({
      error: 'Failed to clear chat history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Catch-all for non-API routes
app.get('*', (req: express.Request, res: express.Response) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.status(200).json({ 
      message: 'OneAgent MCP Server',
      mcp_endpoint: '/mcp',
      health_check: '/api/health'
    });
  }
});

const PORT = process.env.PORT || 8082;
server.listen(PORT, () => {
  console.log(`🚀 OneAgent MCP Server running on port ${PORT}`);
  console.log(`🔗 MCP endpoint available at http://localhost:${PORT}/mcp`);
  console.log(`💊 Health check at http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat API available at http://localhost:${PORT}/api/chat`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
