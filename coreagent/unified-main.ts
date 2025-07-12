/**
 * OneAgent Unified Entry Point
 * 
 * Single entry point for the unified OneAgent platform.
 * Uses the OneAgentEngine and unified MCP server.
 */

import { startServer } from './server/unified-mcp-server';
import { OneAgentEngine, OneAgentMode } from './OneAgentEngine';
import { oneAgentConfig } from './config/index';

const mode: OneAgentMode = (process.env.ONEAGENT_MODE as OneAgentMode) || 'mcp-http';
const protocolVersion = process.env.MCP_PROTOCOL_VERSION || '2025-06-18';

console.log('🌟 Starting OneAgent Unified Platform...');
console.log('📋 Architecture: OneAgentEngine + HTTP MCP Server');
console.log('🎯 Target: VS Code Copilot Chat Integration');
console.log('');

const oneAgent = OneAgentEngine.getInstance({ mode });
oneAgent.initialize(mode).then(() => {
  startServer();
});
