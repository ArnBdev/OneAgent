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

## Memory System

- Persistent, high-performance memory via RESTful API
- Canonical memory tools: add, search, edit, delete
- Memory-driven agent communication for context and learning (no legacy helpers)
- Proactive delegation + audit entries for queue operations

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

## Environment Flags (selected)

- `ONEAGENT_FAST_TEST_MODE=1` — speed up initialization for tests
- `ONEAGENT_DISABLE_AUTO_MONITORING=1` — disable auto health monitoring for focused runs
- `ONEAGENT_SIMULATE_AGENT_EXECUTION` — simulate agent execution when non-zero
- `ONEAGENT_TASK_EXECUTION_TIMEOUT_MS` — per-task wait timeout for orchestrator
- `ONEAGENT_REQUEUE_SCHEDULER_INTERVAL_MS` — enable background requeue scheduler at given interval (ms)

## Graceful Shutdown

- Canonical shutdown manager stops monitoring and any orchestrator background schedulers (e.g., requeue) before exit
- Ensures timers are cleared and resources released; supports timeout and forced exit options

---

This is the canonical architecture document for OneAgent. All other architecture docs are archived or referenced here.
