/**
 * OneAgent Unified Entry Point
 *
 * Single entry point for the unified OneAgent platform.
 * Uses the OneAgentEngine and unified MCP server.
 */

import { OneAgentEngine, OneAgentMode } from './OneAgentEngine';
import { startServer } from './server/unified-mcp-server';
// import { UnifiedBackboneService } from './utils/UnifiedBackboneService';

const mode: OneAgentMode = (process.env.ONEAGENT_MODE as OneAgentMode) || 'mcp-http';

console.log('🌟 Starting OneAgent Unified Platform...');
console.log('📋 Architecture: OneAgentEngine + HTTP MCP Server');
console.log('🎯 Target: VS Code Copilot Chat Integration');
console.log('');

const oneAgent = OneAgentEngine.getInstance();
oneAgent.initialize(mode).then(() => {
  startServer();
});
