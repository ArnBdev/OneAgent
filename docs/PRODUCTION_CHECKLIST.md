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
  - Streamable HTTP: POST /mcp/stream (newline-delimited JSON)
  - SSE fallback: GET /mcp and GET /mcp/sse

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

## Quick verification

- curl http://localhost:8083/health
- Inspect metrics endpoint (if enabled) and verify cardinality limits
- Orchestration quick check: confirm ProactiveObserver events in monitoring JSON and recent logs
- Orchestrator metrics:
  - JSON: GET http://localhost:8083/api/v1/metrics/json and confirm `data.orchestrator` contains `{ totalOperations, successRate, agentUtilization }`
  - Prometheus: GET http://localhost:8083/api/v1/metrics/prometheus and confirm presence of `oneagent_orchestrator_operations_total`, `oneagent_orchestrator_success_rate_percent`, and `oneagent_orchestrator_agent_utilization_total{agent="..."}`
- MCP protocol quick checks:
  - HTTP JSON-RPC: POST http://localhost:8083/mcp with `{ "jsonrpc":"2.0", "id":1, "method":"initialize", "params":{ "clientInfo": {"name":"ops","version":"1.0"} } }` and confirm `protocolVersion` and headers `X-MCP-Protocol-Version` and `X-OneAgent-Tool-Count`.
  - Streamable HTTP: POST http://localhost:8083/mcp/stream with same payload and expect newline-delimited JSON events: `meta(start)`, `message`, `meta(end)`.
  - SSE: GET http://localhost:8083/mcp/sse and observe initial `notifications/initialized` event; keep connection alive (15s heartbeat).

## Notes

- This is a minimal checklist. Expand with infra-specific tasks (k8s manifests, secrets manager policies, CI/CD steps) before production rollout.
- Stdio MCP transport is for local IDE integration; production deployments should expose the HTTP endpoints (`/mcp`, `/mcp/stream`, and SSE fallback).
