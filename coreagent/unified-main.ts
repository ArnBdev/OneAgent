/**
 * OneAgent Unified Entry Point
 * 
 * Single entry point for the unified OneAgent platform.
 * Uses the OneAgentEngine and unified MCP server.
 */

import { startServer } from './server/unified-mcp-server';

console.log('🌟 Starting OneAgent Unified Platform...');
console.log('📋 Architecture: OneAgentEngine + HTTP MCP Server');
console.log('🎯 Target: VS Code Copilot Chat Integration');
console.log('');

// Start the unified server
startServer();
