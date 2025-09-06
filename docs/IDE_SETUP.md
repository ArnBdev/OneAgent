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

- VS Code reads `.vscode/mcp.json`. It's configured to launch the unified MCP server via local command:
  - `node -r ts-node/register coreagent/server/unified-mcp-server.ts`
- Note: Copilot Chat expects command-based MCP in VS Code. The HTTP endpoint printed by runtime smoke
  (`http://localhost:8083/mcp`) is for tooling/debug and is not used directly by Copilot.
- We enable quiet mode when launched from VS Code to avoid JSON parse warnings in Copilot:
  - Env: `ONEAGENT_MCP_QUIET=1` (set in `.vscode/mcp.json`)
- Ports are no longer hardcoded. Configure via env and the URLs auto-derive from the host/ports:
  - `ONEAGENT_HOST` (default `127.0.0.1`)
  - `ONEAGENT_MCP_PORT` (default `8083`)
  - `ONEAGENT_MEMORY_PORT` (default `8001`)
  - `ONEAGENT_UI_PORT` (default `8080`)
  - Optional explicit URLs still respected: `ONEAGENT_MCP_URL`, `ONEAGENT_MEMORY_URL`, `ONEAGENT_UI_URL`
- Tip: If you see EADDRINUSE, either stop the previous server, change ports, or open a new VS Code window.

## Quality gates

- Verify: npm run verify (type + lint + guards)
- Runtime smoke: npm run verify:runtime

## Tips

- Use the tasks in `.vscode/tasks.json` for quick runs.
- See `AGENTS.md` for canonical patterns and governance.
- Create a story from the BMAD template:
  - Task: "Create Story (BMAD template)" or
  - NPM: `npm run story:new -- "Your Story Title"`
