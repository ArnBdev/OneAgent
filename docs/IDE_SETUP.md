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

## Quality gates

- Verify: npm run verify (type + lint + guards)
- Runtime smoke: npm run verify:runtime

## Tips

- Use the tasks in `.vscode/tasks.json` for quick runs.
- See `AGENTS.md` for canonical patterns and governance.
- Create a story from the BMAD template:
  - Task: "Create Story (BMAD template)" or
  - NPM: `npm run story:new -- "Your Story Title"`
