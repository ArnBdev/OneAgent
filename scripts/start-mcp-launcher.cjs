// Deterministic MCP server launcher for runtime smoke and local scripts
// Ensures we explicitly call startServer(), avoiding auto-start heuristics
// that can disable startup under ts-node/register.

// Use ts-node/register to load TypeScript entrypoint
require('ts-node/register');

// Explicitly disable auto-start to avoid double-start if heuristics would also start it
process.env.ONEAGENT_DISABLE_AUTOSTART = '1';
// Also clear FORCE flag that may be set via .env to ensure the module does not autostart itself
// This prevents two concurrent startServer() calls in the same process which can cause EADDRINUSE
// and terminate the server before readiness probes.
try {
  if (process.env.ONEAGENT_FORCE_AUTOSTART === '1') {
    // Prefer removing the variable entirely to avoid downstream truthy checks
    delete process.env.ONEAGENT_FORCE_AUTOSTART;
  }
} catch {
  // non-fatal; best-effort
}

// Now import the TypeScript server and start it
const { startServer } = require('../coreagent/server/unified-mcp-server.ts');

startServer().catch((err) => {
  console.error('💥 MCP start failed (launcher):', err);
  process.exit(1);
});
