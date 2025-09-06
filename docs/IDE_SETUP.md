# OneAgent IDE Setup (VS Code + Copilot)

This guide wires VS Code, Copilot Chat, and the OneAgent Unified MCP Server for a smooth dev loop.

## Prereqs

- Node.js 22+
- Python 3.11+

## Install

- Run: npm ci

## Start services (local dev)

- Memory server: npm run memory:server
- Unified MCP server: npm run server:unified

## Copilot Chat integration

- VS Code reads `.vscode/mcp.json`. We recommend stdio transport for local Copilot Chat:
  - Command: `node -r ts-node/register coreagent/server/unified-mcp-stdio.ts`
  - Type: `stdio` (set in `.vscode/mcp.json`), with dev watch/debug enabled
- Alternative: HTTP/Streamable + SSE fallback
  - URL: `http://127.0.0.1:${ONEAGENT_MCP_PORT}/mcp` (SSE alias: `/mcp/sse`)
  - Start server separately: `npm run server:unified`
  - Useful for remote setups or when bundling as a VS Code extension
- Quiet mode is enabled for command-based runs to avoid JSON parse warnings in Copilot:
  - Env: `ONEAGENT_MCP_QUIET=1` (set in `.vscode/mcp.json`)
- Ports are not hardcoded. Configure via env and the URLs auto-derive from the host/ports:
  - `ONEAGENT_HOST` (default `127.0.0.1`)
  - `ONEAGENT_MCP_PORT` (default `8083`)
  - `ONEAGENT_MEMORY_PORT` (default `8001`)
  - `ONEAGENT_UI_PORT` (default `8080`)
  - Optional explicit URLs still respected: `ONEAGENT_MCP_URL`, `ONEAGENT_MEMORY_URL`, `ONEAGENT_UI_URL`
- Tips:
  - If you see EADDRINUSE, stop the previous server, change ports, or open a new VS Code window.
  - After changing tools/prompts/resources, use “MCP: Reset Cached Tools”.
  - Keep active tools under 128 per request; use tool sets in Agent mode to toggle groups.

## Quality gates

- Verify: npm run verify (type + lint + guards)
- Runtime smoke: npm run verify:runtime

## Tips

- Use the tasks in `.vscode/tasks.json` for quick runs.
- See `AGENTS.md` for canonical patterns and governance.
- Create a story from the BMAD template:
  - Task: "Create Story (BMAD template)" or
  - NPM: `npm run story:new -- "Your Story Title"`

## Commands

- Stdio MCP server (local Copilot):
  - `npm run server:stdio`
- HTTP MCP server (URL mode):
  - `npm run server:unified`
