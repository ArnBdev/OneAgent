// Deterministic MCP server launcher for runtime smoke and local scripts
// Ensures we explicitly call startServer(), avoiding auto-start heuristics
// that can disable startup under ts-node/register.

// Use ts-node/register to load TypeScript entrypoint
require('ts-node/register');

// Explicitly disable auto-start to avoid double-start if heuristics would also start it
process.env.ONEAGENT_DISABLE_AUTOSTART = '1';

// Now import the TypeScript server and start it
const { startServer } = require('../coreagent/server/unified-mcp-server.ts');

startServer().catch((err) => {
  console.error('💥 MCP start failed (launcher):', err);
  process.exit(1);
});
