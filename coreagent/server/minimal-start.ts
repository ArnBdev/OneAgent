/**
 * MINIMAL SERVER STARTUP - EMERGENCY BYPASS
 *
 * This script starts a minimal Express server WITHOUT loading OneAgentEngine
 * to verify that the basic infrastructure works.
 *
 * Use this to isolate the OneAgentEngine initialization problem.
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

console.log('[MINIMAL] 🚀 Starting minimal server...');

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const app = express();
const PORT = parseInt(process.env.ONEAGENT_MCP_PORT || '8083', 10);
const HOST = process.env.ONEAGENT_HOST || 'localhost';

// Basic middleware
app.use(express.json());

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Minimal server is running',
    timestamp: new Date().toISOString(),
  });
});

// Info endpoint
app.get('/info', (_req, res) => {
  res.json({
    name: 'OneAgent Minimal Server',
    version: '1.0.0-emergency',
    mode: 'minimal-bypass',
    port: PORT,
  });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log('==============================================');
  console.log('🚨 MINIMAL EMERGENCY SERVER STARTED');
  console.log('==============================================');
  console.log(`✅ Listening on: http://${HOST}:${PORT}`);
  console.log(`✅ Health check: http://${HOST}:${PORT}/health`);
  console.log(`✅ Info: http://${HOST}:${PORT}/info`);
  console.log('');
  console.log('⚠️  OneAgentEngine is NOT loaded in this mode');
  console.log('⚠️  This is for debugging infrastructure only');
  console.log('==============================================');
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n💥 Port ${PORT} is already in use!`);
    console.error('   Try: taskkill /F /IM node.exe (Windows) or killall node (Linux/Mac)');
  } else {
    console.error('\n💥 Server error:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down minimal server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
