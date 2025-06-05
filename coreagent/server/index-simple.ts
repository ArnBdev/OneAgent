/**
 * Simplified OneAgent Server for testing UI integration
 * Provides mock data and basic functionality for Milestone 1.4 testing
 */

import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import cors from 'cors';
import path from 'path';

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
