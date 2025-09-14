# Orchestration Overview (Canonical)

This document summarizes OneAgent orchestration: current architecture, maturity, and actionable next steps.

## Components (Production)

- HybridAgentOrchestrator (`coreagent/agents/orchestration/HybridAgentOrchestrator.ts`)
  - Agent discovery and optimal selection (BMAD-ready)
  - Task assignment with audit trail (canonical memory)
  - Workflow sessions with NLACS and dependency-aware execution
  - Canonical communication: send, broadcast, history, session info
  - Orchestration metrics (programmatic): `getOrchestrationMetrics()` returns `{ totalOperations, successRate, agentUtilization, recentActivity }`
  - System metrics endpoints (live):
    - `GET /api/v1/metrics/latest` recent metric logs
    - `GET /api/v1/metrics/summary` quick stats + derived operation metrics
    - `GET /api/v1/metrics/json` stable JSON for dashboards (ops summary, SLOs, errors)
    - `GET /api/v1/metrics/prometheus` Prometheus exposition format

- ProactiveTriageOrchestrator (`coreagent/services/ProactiveTriageOrchestrator.ts`)
  - Periodic observation cycles (triage + deep analysis)
  - SLO-aware anomaly detection, error budget burn watch
  - Task delegation harvesting (integration with TaskDelegationService)
  - Canonical monitoring events and optional memory persistence

## Maturity

- Orchestration (Hybrid + Proactive): Grade A, production-ready
- Planner (Strategic): Partial, next-phase focus
- Governance/Policy Hooks: Planned for v4.2
- Agent Utilization Metrics: Implemented programmatically in Hybrid; endpoint/UI surfacing planned for v4.1

## Actionable Next Steps

1. BMAD Agent Selection (Hybrid) [v4.2]
   - Replace heuristic with BMAD + Constitutional AI validation
   - Deterministic reasons and audit entries for selection outcomes
2. Orchestration Metrics [v4.1]
   - DONE (JSON/Prometheus exposure): Orchestrator metrics added to `/api/v1/metrics/json` (field: `data.orchestrator`) and `/api/v1/metrics/prometheus` (gauges/counters with `oneagent_orchestrator_*`).
   - NEXT: Add Phase A dashboard table backed by `/api/v1/metrics/json`.
3. Governance Hooks [v4.2]
   - Policy checks pre/post send; PII redaction, capability gates
   - Audit denials with taxonomy code
4. Workflow Controls [v4.3]
   - Step retry, rollback, dynamic reassignment on failure
   - Clear audit trail with status transitions
5. Clustering Design [v4.5]
   - Stateless MCP frontends, shared memory index, distributed event bus
6. Documentation & DX
   - Contributor guide for orchestration patterns and extension points

## How to query orchestration metrics

- Programmatic (available now): call `HybridAgentOrchestrator.getOrchestrationMetrics()` to retrieve
  `{ totalOperations, successRate, agentUtilization, recentActivity }`.
- System metrics endpoints (available now via unified MCP server):
  - `GET http://localhost:8083/api/v1/metrics/latest` recent metric logs
  - `GET http://localhost:8083/api/v1/metrics/summary` stats + derived op metrics
  - `GET http://localhost:8083/api/v1/metrics/json` JSON for dashboards (operations, SLOs, errors, error budgets)
  - `GET http://localhost:8083/api/v1/metrics/prometheus` Prometheus exposition
- Orchestrator-specific metrics (UI): endpoints are live; UI integration scheduled for v4.1. Extensions will reuse the same aggregation path (no parallel systems).

See also: `docs/CONTRIBUTING-ORCHESTRATION.md` for extension patterns and audit practices.

## Quality & Compliance

- Canonical systems only (UnifiedBackboneService, OneAgentMemory, UnifiedAgentCommunicationService)
- No process.exit in tests/scripts; rely on test runner for exit status
- Structured error taxonomy surfaced through monitoring + metrics

---

Maintainer: Orchestration Lead
Version: 1.1.0 (endpoints wired with orchestrator metrics; aligned to v4.1.0)
