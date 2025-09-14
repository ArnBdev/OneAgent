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

- Recommended (stable): HTTP transport
  - URL is generated from `.env` via `npm run mcp:config`
    - Preferred: `ONEAGENT_MCP_URL` (e.g., `http://127.0.0.1:8083`)
    - Otherwise composed from `ONEAGENT_HOST` + `ONEAGENT_MCP_PORT`
  - Expected endpoint path: `/mcp`
  - Start server: `npm run server:unified`
  - Generate VS Code config: `npm run mcp:config` (writes `.vscode/mcp.json`)
  - See `.vscode/mcp.json.sample` for a ready-to-copy HTTP configuration.
- Alternative (advanced): stdio transport
  - Command: `node -r ts-node/register coreagent/server/unified-mcp-stdio.ts`
  - Type: `stdio` (set in `.vscode/mcp.json`)
  - Use only if you need pure stdio and understand the quiet-mode toggles.
- Stdio quiet behavior (when using stdio):
  - Only framed JSON-RPC is written to stdout.
  - All other logs go to stderr by default.
  - Optional:
    - `ONEAGENT_STDERR_TO_FILE=1` to capture stderr in `./logs/mcp-server/stdio.err.log`.
    - `ONEAGENT_STDERR_TEE=1` to both file and VS Code output pane.
    - `ONEAGENT_STDIO_LOG_TO_FILE=1` to log suppressed stdout text to `./logs/mcp-server/stdio.log`.
  - `ONEAGENT_STARTUP_DELAY_MS=250` to defer stdio processing a bit to avoid race conditions on initialize.
  - `ONEAGENT_QUIET_MODE=1` master switch to suppress all logs on stdio (both stdout and stderr).
- Ports are not hardcoded. Configure via env and the URLs auto-derive from the host/ports:
  - `ONEAGENT_HOST` (default `127.0.0.1`)
  - `ONEAGENT_MCP_PORT` (default `8083`)
  - `ONEAGENT_MEMORY_PORT` (default `8001`)
  - `ONEAGENT_UI_PORT` (default `8080`)
  - Optional explicit URLs still respected: `ONEAGENT_MCP_URL`, `ONEAGENT_MEMORY_URL`, `ONEAGENT_UI_URL`
  - Tip: After changing `.env`, re-run `npm run mcp:config` to sync `.vscode/mcp.json`.
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

## Troubleshooting

- VS Code waits for initialize:
  - Set `ONEAGENT_STARTUP_DELAY_MS=250` (or 150–500) in `.vscode/mcp.json` env.
  - Ensure stderr noise is captured: set `ONEAGENT_STDERR_TO_FILE=1` to inspect `./logs/mcp-server/stdio.err.log`.
  - Use “Developer: Toggle Developer Tools” to check MCP traces.
- VS Code auto-starts a LocalProcess (stdio) unexpectedly:
  - Open Settings and turn off “Chat › MCP: Autostart”.
  - Open “Preferences: Open Settings (JSON)” and remove/disable any stdio MCP entries under user-level config (search for `mcpServers`, `mcp.servers`, or `copilot.chat.mcp`).
  - Ensure workspace `.vscode/mcp.json` only contains the HTTP entry for `oneagent`.
- Tools look stale or missing:
  - Run “MCP: Reset Cached Tools” in the Command Palette.
- Port conflicts (EADDRINUSE):
  - Stop previous servers or change `ONEAGENT_MCP_PORT`.
- Clear logs for a clean run:
  - Delete files under `./logs/mcp-server/` (safe to remove), then retry.

## Commands

- Stdio MCP server (local Copilot):
  - `npm run server:stdio`
- HTTP MCP server (URL mode):
  - `npm run server:unified`
