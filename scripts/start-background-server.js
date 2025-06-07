#!/usr/bin/env node
/**
 * Background Server Starter for OneAgent
 * Starts MCP server in detached mode to avoid blocking terminal tools
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function startBackgroundServer() {
  log('🚀 Starting OneAgent MCP Server in background mode...', 'cyan');
  
  const serverScript = 'coreagent/server/index-simple-mcp.ts';
  const logFile = path.join('temp', 'mcp-server.log');
  const pidFile = path.join('temp', 'mcp-server.pid');
  
  // Ensure temp directory exists
  if (!fs.existsSync('temp')) {
    fs.mkdirSync('temp', { recursive: true });
  }
  
  // Start server in detached mode
  const server = spawn('npx', ['ts-node', serverScript], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Create log streams
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  server.stdout.pipe(logStream);
  server.stderr.pipe(logStream);
    // Save PID for later termination
  if (server.pid) {
    fs.writeFileSync(pidFile, server.pid.toString());
    log(`✅ MCP Server started in background (PID: ${server.pid})`, 'green');
  } else {
    log('⚠️  Server started but PID not available', 'yellow');
  }  
  // Detach the process
  server.unref();
  
  log(`📝 Logs: ${logFile}`, 'blue');
  log(`🔧 Stop with: npm run server:stop`, 'yellow');
  
  // Check if server is running after 2 seconds
  setTimeout(() => {
    if (server.pid) {
      try {
        process.kill(server.pid, 0); // Check if process exists
        log('🎯 Server is running and accessible on port 8081', 'green');
        log('🔗 Test with: curl http://localhost:8081/api/health', 'cyan');
      } catch (error) {
        log('❌ Server failed to start - check logs', 'red');
      }
    }
  }, 2000);
}

function stopBackgroundServer() {
  log('🛑 Stopping OneAgent MCP Server...', 'yellow');
  
  const pidFile = path.join('temp', 'mcp-server.pid');
  
  if (!fs.existsSync(pidFile)) {
    log('❌ No server PID file found', 'red');
    return;
  }
  
  const pid = parseInt(fs.readFileSync(pidFile, 'utf-8'));
  
  try {
    process.kill(pid, 'SIGTERM');
    fs.unlinkSync(pidFile);
    log('✅ Server stopped successfully', 'green');
  } catch (error) {
    log('⚠️  Server may have already stopped', 'yellow');
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
  }
}

function checkServerStatus() {
  const pidFile = path.join('temp', 'mcp-server.pid');
  
  if (!fs.existsSync(pidFile)) {
    log('❌ Server is not running', 'red');
    return;
  }
  
  const pid = parseInt(fs.readFileSync(pidFile, 'utf-8'));
  
  try {
    process.kill(pid, 0); // Check if process exists
    log(`✅ Server is running (PID: ${pid})`, 'green');
    log('🔗 Available at: http://localhost:8081', 'cyan');
  } catch (error) {
    log('❌ Server PID exists but process is not running', 'red');
    fs.unlinkSync(pidFile);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'start':
    startBackgroundServer();
    break;
  case 'stop':
    stopBackgroundServer();
    break;
  case 'status':
    checkServerStatus();
    break;
  case 'restart':
    stopBackgroundServer();
    setTimeout(startBackgroundServer, 1000);
    break;
  default:
    log('🔧 OneAgent Background Server Manager', 'cyan');
    log('Usage: node scripts/start-background-server.js <command>', 'blue');
    log('Commands:', 'yellow');
    log('  start   - Start server in background', 'green');
    log('  stop    - Stop background server', 'red');
    log('  status  - Check server status', 'blue');
    log('  restart - Restart server', 'cyan');
}
