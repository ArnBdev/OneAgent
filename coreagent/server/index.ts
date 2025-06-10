/**
 * OneAgent Backend Server
 * 
 * Express server that provides API endpoints for the UI layer,
 * integrating performance monitoring, memory intelligence, and system status.
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { PerformanceAPI } from '../api/performanceAPI';
import { MemoryIntelligence } from '../intelligence/memoryIntelligence';
import { GeminiClient } from '../tools/geminiClient';
import { Mem0Client } from '../tools/mem0Client';
import { GeminiEmbeddingsTool } from '../tools/geminiEmbeddings';
import { globalProfiler } from '../performance/profiler';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../ui/dist')));

// Initialize services
const geminiClient = new GeminiClient({
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-2.5-pro-preview-05-06'
});
const mem0Client = new Mem0Client();
const embeddingsTool = new GeminiEmbeddingsTool(geminiClient, mem0Client);
const memoryIntelligence = new MemoryIntelligence(mem0Client, embeddingsTool);

const performanceAPI = new PerformanceAPI(
  memoryIntelligence,
  geminiClient,
  mem0Client,
  embeddingsTool
);

// Configuration management
interface SystemConfig {
  GEMINI_API_KEY?: string;
  BRAVE_API_KEY?: string;
  MEM0_API_KEY?: string;
  MEMORY_RETENTION_DAYS: number;
  AUTO_CATEGORIZATION: boolean;
  SIMILARITY_THRESHOLD: number;
  MAX_MEMORIES_PER_CATEGORY: number;
  EMBEDDING_CACHE_TTL: number;
  EMBEDDING_CACHE_SIZE: number;
  REQUEST_TIMEOUT: number;
  CONCURRENT_REQUESTS: number;
  ENABLE_AUDIT_LOG: boolean;
  DATA_ENCRYPTION: boolean;
  SESSION_TIMEOUT: number;
  ENABLE_NOTIFICATIONS: boolean;
  ERROR_NOTIFICATIONS: boolean;
  PERFORMANCE_ALERTS: boolean;
  NOTIFICATION_LEVEL: 'minimal' | 'normal' | 'verbose';
}

// Default configuration
let systemConfig: SystemConfig = {
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
  NOTIFICATION_LEVEL: 'normal'
};

// Add API keys if available
if (process.env.GEMINI_API_KEY) {
  systemConfig.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
}
if (process.env.BRAVE_API_KEY) {
  systemConfig.BRAVE_API_KEY = process.env.BRAVE_API_KEY;
}
if (process.env.MEM0_API_KEY) {
  systemConfig.MEM0_API_KEY = process.env.MEM0_API_KEY;
}

// WebSocket connections
const wsConnections = new Set<any>();

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('UI client connected via WebSocket');
  wsConnections.add(ws);

  ws.on('close', () => {
    wsConnections.delete(ws);
    console.log('UI client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsConnections.delete(ws);
  });

  // Send initial status
  performanceAPI.getSystemStatus().then(status => {
    ws.send(JSON.stringify({
      type: 'system-status',
      data: status
    }));
  });
});

// Broadcast updates to all connected clients
function broadcastUpdate(type: string, data: any) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  
  wsConnections.forEach((ws) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        wsConnections.delete(ws);
      }
    }
  });
}

// Performance monitoring with real-time updates
setInterval(async () => {
  try {
    const status = await performanceAPI.getSystemStatus();
    broadcastUpdate('system-status', status);
  } catch (error) {
    console.error('Error getting system status:', error);
  }
}, 5000); // Update every 5 seconds

// API Routes

/**
 * System Status Endpoints
 */
app.get('/api/system/status', async (_req, res) => {
  try {
    const status = await performanceAPI.getSystemStatus();
    res.json(status);
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
      connections: wsConnections.size,
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
    const metrics = await performanceAPI.getPerformanceMetrics();
    res.json(metrics);
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
    const result = await performanceAPI.clearPerformanceData();
    broadcastUpdate('performance-cleared', result);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Memory Intelligence Endpoints
 */
app.get('/api/memories/search', async (req, res) => {
  try {
    const { query, filter } = req.query;
    const result = await performanceAPI.searchMemories(
      query as string,
      filter ? JSON.parse(filter as string) : undefined
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/memories/analytics', async (req, res) => {
  try {
    const { filter } = req.query;
    const result = await performanceAPI.getMemoryAnalytics(
      filter ? JSON.parse(filter as string) : undefined
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    const { content, metadata, userId, agentId, workflowId } = req.body;
    const result = await performanceAPI.createMemory(
      content,
      metadata,
      userId,
      agentId,
      workflowId
    );
    
    // Broadcast memory creation
    broadcastUpdate('memory-created', result);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/memories/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const options = req.query;
    const result = await performanceAPI.getSimilarMemories(id, options);
    res.json(result);
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
  // Don't send sensitive data like API keys
  const safeConfig = { ...systemConfig };
  if (safeConfig.GEMINI_API_KEY) safeConfig.GEMINI_API_KEY = '***';
  if (safeConfig.BRAVE_API_KEY) safeConfig.BRAVE_API_KEY = '***';
  if (safeConfig.MEM0_API_KEY) safeConfig.MEM0_API_KEY = '***';
  
  res.json({
    success: true,
    data: safeConfig,
    timestamp: new Date().toISOString()
  });
});

app.put('/api/config', (req, res) => {
  try {
    const updates = req.body;
    
    // Validate and update configuration
    systemConfig = { ...systemConfig, ...updates };
    
    // Update environment variables for API keys
    if (updates.GEMINI_API_KEY && updates.GEMINI_API_KEY !== '***') {
      process.env.GEMINI_API_KEY = updates.GEMINI_API_KEY;
    }
    if (updates.BRAVE_API_KEY && updates.BRAVE_API_KEY !== '***') {
      process.env.BRAVE_API_KEY = updates.BRAVE_API_KEY;
    }
    if (updates.MEM0_API_KEY && updates.MEM0_API_KEY !== '***') {
      process.env.MEM0_API_KEY = updates.MEM0_API_KEY;
    }
    
    broadcastUpdate('config-updated', { message: 'Configuration updated successfully' });
    
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

// Serve React app for any non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../ui/dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`OneAgent server running on port ${PORT}`);
  console.log(`UI available at http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

export { app, server, performanceAPI, systemConfig };
