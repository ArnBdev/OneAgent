# OneAgent Canonical Architecture (v4.2.2)

## Core Principles

- Modular, type-safe TypeScript agents
- Canonical memory system (`OneAgentMemory`)
- Unified agent communication (`UnifiedAgentCommunicationService` + A2A adapter) – no parallel paths
- Mission Control WebSocket (schema-driven, codegen backed) with mission registry aggregation
- Unified monitoring (`UnifiedMonitoringService` + `PerformanceMonitor`) with JSON + Prometheus exposure
- Canonical error taxonomy via `UnifiedBackboneService.errorHandler`
- Constitutional AI validation and BMAD analysis
- MCP server for VS Code Copilot and standalone operation

## Agent Design

- All agents extend `BaseAgent` and implement `ISpecializedAgent`
- Canonical backbone types: `MemoryRecord`, `MemoryMetadata`, `AgentResponse`, `AgentHealthStatus`
- Unified agent actions and endpoints via consolidated communication service
- Structured task completion emissions: `BaseAgent` detects `TASK_ID` tokens in inbound instructions and emits a canonical `AgentExecutionResult` on completion/failure (idempotent). Specialized agents should call `finalizeResponseWithTaskDetection()` before returning to ensure emissions.

## Memory System (v4.2.3)

- Canonical, pluggable, MCP/JSON-RPC-compliant memory system
- All memory operations route through `OneAgentMemory` singleton, which delegates to a backend-specific `IMemoryClient` implementation (`Mem0MemoryClient`, `MemgraphMemoryClient`)
- Strict interface contract enforced via `coreagent/memory/clients/IMemoryClient.ts`
- Provider selection via config/env (`provider` or `ONEAGENT_MEMORY_PROVIDER`)
- Canonical memory tools: add, search, edit, delete, health, capabilities, event subscription
- No parallel/legacy code remains; all logic is routed through the canonical interface
- See [docs/memory-system-architecture.md](./memory-system-architecture.md) for details

## Mission Control (v4.2.x)

- WebSocket endpoint with modular channel registry (`metrics_tick`, `health_delta`, `mission_update`, `mission_stats`).
- JSON Schemas (inbound/outbound) generate discriminated TypeScript unions (codegen script).
- Mission registry provides O(1) lifecycle tracking & aggregate snapshots without ad-hoc caches.
- Cancellation messages (`mission_cancel`) terminate execution engines gracefully.
- New in 4.2.2:
  - `anomaly_alert` channel derived from existing monitoring + mission stats (no shadow stores)
  - Prometheus export includes mission gauges (active/completed/cancelled/errors/total/avgDuration/error_rate)
  - Codegen hardened to emit named variant interfaces and narrow type guards

## MCP Server

- Unified entry point for VS Code Copilot integration
- Production-ready, zero TypeScript errors
- Health endpoint `/health` returns a canonical roll-up from `UnifiedMonitoringService.getSystemHealth()`
  - `status`: healthy | degraded | unhealthy | critical (derived from component matrix + constitutional thresholds)
  - `?details=true` includes component breakdown (registry, agents, orchestrator, api) and lightweight performance/compliance snapshots
  - No shadow metrics stores; values are computed from canonical sources at request time

## Quality & Validation

- Constitutional AI: accuracy, transparency, helpfulness, safety
- BMAD framework for systematic analysis
- Continuous quality scoring and validation (80%+ Grade A target)
- Schema-codegen drift guard for Mission Control messages

## Orchestration & Delegation (v4.2.2)

- Task Delegation (`TaskDelegationService`)
  - Tracks `dispatchedAt`, `completedAt`, and derives `durationMs`
  - Emits operation metrics for `TaskDelegation.execute` (success/error) and records durations via the canonical `PerformanceMonitor` (no parallel metrics)
  - Deterministic requeue processing with `processDueRequeues(now)`; aggregated `requeue_wave` metric

- Orchestrator (`HybridAgentOrchestrator`)
  - Listens for structured `AgentExecutionResult` messages on the unified communication bus
  - Marks task outcomes, measures per-task latency, and broadcasts `mission_progress` updates
  - Background requeue scheduler (env-gated via `ONEAGENT_REQUEUE_SCHEDULER_INTERVAL_MS`); disabled if unset or < 1000ms
  - Emits `operation_metrics_snapshot` frames (best-effort) for `TaskDelegation.execute` percentiles
  - Backward-compat flag migration: if `ONEAGENT_DISABLE_REAL_AGENT_EXECUTION` is set, it auto-enables `ONEAGENT_SIMULATE_AGENT_EXECUTION=1` and records a deprecation memory entry

## Observability & Metrics

- Unified Monitoring Service exposes a `PerformanceMonitor` accessor for read-only metrics access
- Allowlist includes `TaskDelegation.execute` for percentile summaries (exported in JSON/WS snapshot)
- Prometheus endpoint derives mission metrics from the in-memory registry (no counters stored):
  - `oneagent_mission_active`, `oneagent_mission_completed`, `oneagent_mission_cancelled`, `oneagent_mission_errors`, `oneagent_mission_total`, `oneagent_mission_avg_duration_ms`, `oneagent_mission_error_rate`
- Mission Control `anomaly_alert` channel provides lightweight streaming signals based on thresholds

### Health Monitoring (v4.2.2)

- Canonical component health is computed by `HealthMonitoringService` using only unified sources:
  - Registry health: derived from `UnifiedAgentCommunicationService.discoverAgents()`
    - details include `totalAgents`, `online`, `offline`, `busy`, and `recentActive` (5-min window)
  - Agents health: aggregated status over discovered agents with a stale-activity heuristic
  - Orchestrator health: sourced from canonical monitoring and delegation signals (no shadow accumulators)
    - Uses `PerformanceMonitor.getDetailedMetrics('TaskDelegation.execute'|'TaskDelegation.dispatch')` for avg/p95/p99/errorRate
    - Uses `TaskDelegationService.getQueuedTasks()/getAllTasks()` for live `queueDepth` and total tracked tasks
    - Thresholds: unhealthy if `errorRate ≥ 10%` or `p95 ≥ 5000ms`; degraded if `errorRate ≥ 5%` or `p95 ≥ 3000ms` or `queueDepth > 50`
  - API health: derived from the canonical `PerformanceMonitor.getPerformanceSummary()` (overall)
    - Degraded when `averageLatency ≥ 200ms` or `errorRate ≥ 5%`; unhealthy at 5× latency or 2× error rate
    - Details include `averageLatency`, `errorRate`, `healthStatus`, `totalOperations`, and `operationsTracked`
- Overall status is a function of component statuses plus constitutional thresholds; exposed via `/health` and forwarded into Mission Control streams.
- Implementation detail (circularity guard): health service lazily resolves the communication service to avoid module init cycles while preserving canonical routing (no parallel systems created).

Note: Agent discovery log noise has been reduced. The unified communication service now logs discovery count changes using the canonical UnifiedLogger at debug level only when the agent count changes, preventing repetitive “found 0 agents” spam while retaining observability. Set `ONEAGENT_SILENCE_COMM_LOGS=1` to silence these logs entirely.

Additionally, a typed accessor `getUnifiedAgentCommunicationService()` is available for advanced composition and testing scenarios, while the default `unifiedAgentCommunicationService` export remains the canonical singleton.

Discovery caching and backoff:

- Agent discovery now uses the canonical unified cache (`OneAgentUnifiedBackbone.getInstance().cache`) with a short TTL to avoid redundant memory queries while preserving freshness.
- Defaults: `ONEAGENT_DISCOVERY_TTL_MS` (default 3000ms) when agents are found, and `ONEAGENT_DISCOVERY_TTL_EMPTY_MS` (default 10000ms) when no agents are found to provide gentle backoff and reduce noise/overhead in empty environments.
- Cache keys are deterministic over filter inputs and results are cached per-filter. All reads/writes are best-effort; failures do not impact correctness.

Health threshold configuration:

- Orchestrator thresholds are configurable via env: `ONEAGENT_HEALTH_ORCH_P95_WARN_MS`, `ONEAGENT_HEALTH_ORCH_P95_UNHEALTHY_MS`, `ONEAGENT_HEALTH_ORCH_ERROR_RATE_WARN`, `ONEAGENT_HEALTH_ORCH_ERROR_RATE_UNHEALTHY`, `ONEAGENT_HEALTH_ORCH_QUEUE_WARN`.
- API thresholds are configurable via env: `ONEAGENT_HEALTH_API_LATENCY_WARN_MS`, `ONEAGENT_HEALTH_API_ERROR_RATE_WARN`, and multipliers for unhealthy: `ONEAGENT_HEALTH_API_LATENCY_UNHEALTHY_MULTIPLIER`, `ONEAGENT_HEALTH_API_ERROR_RATE_UNHEALTHY_MULTIPLIER`.

Discovery signals and logging:

- A `discovery_delta` event is emitted by the communication service when the discovered agent count changes; consumers like Mission Control may subscribe without adding log noise.
- Log level is configurable via `ONEAGENT_COMM_LOG_LEVEL` (debug|info|warn|error) in addition to `ONEAGENT_SILENCE_COMM_LOGS=1`.

Canonical caching policy:

- OneAgent has a single system-level cache: `OneAgentUnifiedBackbone.getInstance().cache`. All cross-cutting caching must route through this canonical cache (no parallel cache subsystems).
- Module-local, algorithmic maps (short-lived structures) are permitted for transient computation, not as general-purpose caches. If a map persists beyond a local operation or is used to avoid repeat I/O, migrate it to the unified cache with an appropriate TTL.
- Embedding-related caching is implemented via `EmbeddingCacheService`, which internally uses the canonical unified cache. No separate embedding cache stores exist.
- Web findings caching (search + fetch) now writes through the unified cache with per-item TTL, with optional local in-memory maps used only as ephemeral indices. Set `ONEAGENT_WEBFINDINGS_DISABLE_LOCAL_CACHE=1` to disable the local map layer entirely and rely solely on the unified cache.
- Web findings also employ a short negative cache for “no-result” queries to reduce repeated empty scans; tune via `ONEAGENT_WEBFINDINGS_NEG_TTL_MS`.

Static enforcement (lint rules):

- ESLint custom rules enforce our canonical systems in production TS code:
  - `oneagent/no-parallel-cache` (transitional: warn in 4.2.2; will return to error post-migration) — disallows long‑lived `new Map()` caches; use `OneAgentUnifiedBackbone.getInstance().cache` with TTL.
  - `oneagent/prefer-unified-time` (warn) — prefer `createUnifiedTimestamp()` over `Date.now()`.
  - `oneagent/prefer-unified-id` (warn) — prefer `createUnifiedId()` over `Math.random()` for identifiers.
- These rules are relaxed for tests, scripts, and UI to avoid noise and allow local measurements/examples.

## Environment Flags (selected)

- `ONEAGENT_FAST_TEST_MODE=1` — speed up initialization for tests
- `ONEAGENT_DISABLE_AUTO_MONITORING=1` — disable auto health monitoring for focused runs
- `ONEAGENT_SIMULATE_AGENT_EXECUTION` — simulate agent execution when non-zero
- `ONEAGENT_TASK_EXECUTION_TIMEOUT_MS` — per-task wait timeout for orchestrator
- `ONEAGENT_REQUEUE_SCHEDULER_INTERVAL_MS` — enable background requeue scheduler at given interval (ms)
- `ONEAGENT_DISCOVERY_TTL_MS` — cache TTL for non-empty agent discovery results (ms)
- `ONEAGENT_DISCOVERY_TTL_EMPTY_MS` — cache TTL for empty agent discovery results (ms)
- `ONEAGENT_COMM_LOG_LEVEL` — log level for discovery logs (debug|info|warn|error)
- `ONEAGENT_HEALTH_ORCH_P95_WARN_MS` / `ONEAGENT_HEALTH_ORCH_P95_UNHEALTHY_MS` — orchestrator p95 thresholds (ms)
- `ONEAGENT_HEALTH_ORCH_ERROR_RATE_WARN` / `ONEAGENT_HEALTH_ORCH_ERROR_RATE_UNHEALTHY` — orchestrator error-rate thresholds
- `ONEAGENT_HEALTH_ORCH_QUEUE_WARN` — orchestrator queue depth warn threshold
- `ONEAGENT_HEALTH_API_LATENCY_WARN_MS` / `ONEAGENT_HEALTH_API_ERROR_RATE_WARN` — API degraded thresholds
- `ONEAGENT_HEALTH_API_LATENCY_UNHEALTHY_MULTIPLIER` / `ONEAGENT_HEALTH_API_ERROR_RATE_UNHEALTHY_MULTIPLIER` — multipliers for API unhealthy
- `ONEAGENT_WEBFINDINGS_DISABLE_LOCAL_CACHE=1` — disable WebFindingsManager local Map caches and use only the canonical unified cache
- `ONEAGENT_WEBFINDINGS_NEG_TTL_MS` — TTL for negative cache entries (no-result queries) in WebFindingsManager

Notes:

- In FAST_TEST_MODE the communication service uses an ephemeral in-memory agent registry fallback to keep A2A tests fast while still routing through the canonical API.
- When auto monitoring is disabled, `/health` and Mission Control health frames still compute on-demand from unified sources—no placeholders.

## Graceful Shutdown

- Canonical shutdown manager stops monitoring and any orchestrator background schedulers (e.g., requeue) before exit
- Ensures timers are cleared and resources released; supports timeout and forced exit options

---

This is the canonical architecture document for OneAgent. All other architecture docs are archived or referenced here.
