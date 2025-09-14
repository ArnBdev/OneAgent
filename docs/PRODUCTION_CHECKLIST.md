# Production Checklist for OneAgent

This lightweight checklist captures the minimum steps, env matrix, and required secrets for deploying OneAgent to production.

## Deploy checklist (minimum)

- Build TypeScript: npm run build
- Start canonical MCP server: npm run server:unified
- Ensure memory backend is healthy and reachable (MEM0 API)
- Run smoke checks: npm run smoke and npm run smoke:runtime
- Verify monitoring endpoints and metrics export
- Run end-to-end A2A smoke tests (optional): npm run test:a2a
- Verify orchestration startup and proactive loop (logs show observation cycle start)
- Confirm MCP endpoints:
  - JSON-RPC (HTTP): POST /mcp
  - Streaming (NDJSON): POST /mcp/stream (newline-delimited JSON events: meta→message→end)

## Environment variables (matrix)

- NODE_ENV=production
- MEM0_API_KEY (required)
- MEM0_API_URL (required)
- ONEAGENT_MCP_PORT (default: 8083)
- ONEAGENT_HOST (default: 127.0.0.1)
- ONEAGENT_PROACTIVE_AUTO_DELEGATE (true|false)
- ONEAGENT_PROACTIVE_INTERVAL_MS (int, default 45000)
- ONEAGENT_PROACTIVE_DEEP_ANALYSIS (0|1)
- ONEAGENT_PROACTIVE_MEMORY (0|1)
- ONEAGENT_TASK_MAX_ATTEMPTS (int)
- ONEAGENT_PREMIUM_MAX_CALLS (int)

## Required secrets

- MEM0_API_KEY: memory backend API key
- OPENAI_API_KEY or other model provider keys (if using LLMs in production)
- SENTRY_DSN (optional monitoring)

## Operations & runbooks

- Alerting: Configure alerts for high error rate and elevated operation latency (p95/p99)
- Backup: Ensure profile backups exist under data/agent-profiles/archive
- Rollback: Use ProfileManager.rollbackProfile to restore previous configurations
- Tool count control: Keep active tools under ~128/request. Monitor header `X-OneAgent-Tool-Count` on /mcp responses and split tool sets if needed.
  - Use tool-set toggling to reduce exposed tools when necessary: list sets via `tools/sets`, activate via `tools/sets/activate` with `{ setIds: string[] }`.

## Quick verification

- curl http://localhost:8083/health
- Inspect metrics endpoint (if enabled) and verify cardinality limits
- Orchestration quick check: confirm ProactiveObserver events in monitoring JSON and recent logs
- Orchestrator metrics:
  - JSON: GET http://localhost:8083/api/v1/metrics/json and confirm `data.orchestrator` contains `{ totalOperations, successRate, agentUtilization }`
  - Prometheus: GET http://localhost:8083/api/v1/metrics/prometheus and confirm presence of `oneagent_orchestrator_operations_total`, `oneagent_orchestrator_success_rate_percent`, and `oneagent_orchestrator_agent_utilization_total{agent="..."}`
- MCP protocol quick checks:
  - HTTP JSON-RPC: POST http://localhost:8083/mcp with `{ "jsonrpc":"2.0", "id":1, "method":"initialize", "params":{ "clientInfo": {"name":"ops","version":"1.0"} } }` and confirm `protocolVersion` and headers `X-MCP-Protocol-Version` and `X-OneAgent-Tool-Count`.
  - Streaming: POST http://localhost:8083/mcp/stream with the same JSON-RPC body and expect NDJSON events: `{type:"meta",event:"start"}` → `{type:"message"}` → `{type:"meta",event:"end"}`.
  - Tool sets: POST http://localhost:8083/mcp with `{ "jsonrpc":"2.0", "id":2, "method":"tools/sets" }` to list; activate with `{ "jsonrpc":"2.0", "id":3, "method":"tools/sets/activate", "params": { "setIds": ["system-management","research-analysis"] } }` and confirm `result.active` and reduced `X-OneAgent-Tool-Count`.

## Notes

- This is a minimal checklist. Expand with infra-specific tasks (k8s manifests, secrets manager policies, CI/CD steps) before production rollout.
- Stdio MCP transport is for local IDE integration; production deployments should expose the HTTP endpoints (`/mcp` and `/mcp/stream`).
  - For VS Code MCP (stdio), OneAgent now hard-blocks any non-framed writes to stdout. Only JSON-RPC frames are emitted; all other logs go to stderr.
  - Env toggles:
    - `ONEAGENT_STDIO_MODE=1` (default) ensures quiet stdio mode.
    - Optional diagnostics: `ONEAGENT_STDIO_LOG_TO_FILE=1` to write suppressed stdout to a file; `ONEAGENT_STDIO_LOG_FILE=<path>` (default `./logs/mcp-server/stdio.log`).
  - Avoid any direct stdout writes in custom extensions; use stderr or structured server logging.
