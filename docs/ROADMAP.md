# OneAgent Consolidated Strategic Roadmap (v4.2.3)

> **⚠️ Canonical File Notice**  
> This is the **ONLY** authoritative roadmap. Do **not** create additional roadmap variants (e.g. `CONSOLIDATED_ROADMAP.md`, `roadmap_v2.md`, `HYBRID_ROADMAP`, etc.). All strategy, release planning, KPI updates and status changes MUST be applied here. Creating parallel roadmap documents is prohibited and will be treated as architecture drift. A future CI guard may fail builds if a new `*roadmap*.md` file appears outside this path.
>
> Change Protocol: (1) Open PR with rationale + diff summary, (2) If adding/removing release objectives, reference supporting RFC or issue ID, (3) Update Immediate Action Queue status table accordingly, (4) Note significant alterations in CHANGELOG under "Roadmap Updates".

> Canonical roadmap superseding ad‑hoc/fragmented roadmap references. Existing roadmap & vision docs remain as historical context; this file is the single planning source of truth going forward.

OneAgent v4.2.3 has achieved **complete canonicalization** with **zero ESLint warnings** and **100% architectural compliance**. All 35 warnings have been systematically eliminated through proper architectural exceptions, time/ID/memory canonicalization, and TypeScript type safety improvements. The codebase now maintains strict adherence to Constitutional AI principles with Grade A+ code quality (80%+ standard). All cross-cutting caches are unified (`OneAgentUnifiedBackbone.getInstance().cache`), and all agent-to-agent communication is routed through UnifiedAgentCommunicationService (NLACS-extended, memory-audited). Observability is enhanced with Prometheus mission gauges, error rate, and health aggregation. Release automation is in place with comprehensive CI/CD workflows. Focus now shifts to: (1) **Reactive Observability** (live dashboard auto-refresh), (2) **NLACS & PlannerAgent intelligence**, (3) **Structured Error & Policy governance**, (4) **UI/UX platform surfaces**, (5) **Extensibility & ecosystem**, (6) **Performance scalability** toward enterprise scale.

## 2. Current State Snapshot (Maturity Matrix)

| Pillar                             | Scope                                         | Status       | Maturity (1-5) | Notes                                                                                      |
| ---------------------------------- | --------------------------------------------- | ------------ | -------------- | ------------------------------------------------------------------------------------------ |
| Code Quality & Standards           | Zero warnings, canonical compliance           | ✅ Complete  | 5              | 35 ESLint warnings eliminated; Grade A+ achieved; 100% Constitutional AI compliance        |
| Canonical Core Systems             | Time, ID, Memory, Cache, Unified Cache Policy | ✅ Complete  | 5              | All caches unified; negative caching, TTL/backoff, static lint guards in place             |
| Communication Layer                | A2A protocol + persistence + instrumentation  | ✅ Complete  | 5              | NLACS, memory audit, no parallel comms; legacy adapters deprecated                         |
| Monitoring & Metrics               | Prometheus gauges, error rate, health, cache  | ✅ Enhanced  | 5              | Mission gauges, error rate, health aggregation, cache health, negative caching             |
| Error Handling & Taxonomy          | Canonical registry + mapped metrics           | 🚧 Advancing | 4              | Taxonomy codes in error handler, monitoring, metrics; policy console next                  |
| NLACS / Emergent Intelligence      | NLACS, entity extraction, memory audit        | 🚧 Advancing | 3              | NLACS extension, entity extraction, memory audit, cross-session insights planned           |
| Orchestration (Hybrid + Proactive) | Multi-agent orchestration + proactive triage  | ✅ Complete  | 4              | HybridAgentOrchestrator prod-ready; ProactiveTriageOrchestrator live; policy hooks pending |
| Planner (Strategic)                | Decomposition & dynamic replanning            | 🚧 Partial   | 2              | Strategic planning & dynamic replanning not done                                           |
| UI / Visualization                 | VS Code extension, dashboard, metrics         | � Advancing  | 2              | VS Code extension compiles, dashboard metrics planned, live auto-refresh next              |
| Resilience & Reliability           | Fallback, retries, release automation         | 🚧 Advancing | 3              | CI/CD release workflow, verify gate, error diagnostics, circuit breakers planned           |
| Security / Privacy / Compliance    | Baseline privacy metadata                     | 🚧 Partial   | 2              | Policy enforcement & audit dashboards needed                                               |
| Extensibility / Plugin Model       | Tool registry, release workflow, lint guards  | 🚧 Advancing | 3              | Release workflow, plugin manifest spec, static lint guards, public packaging planned       |
| Performance & Scale                | Local dev scale, cache perf, CI/CD            | 🚧 Advancing | 3              | Cache perf, release automation, clustering design doc planned                              |
| Governance & Change Control        | Release train, CI/CD, roadmap guard           | 🚧 Advancing | 3              | CI/CD release workflow, roadmap file guard, RFC workflow planned                           |

## 3. Strategic Pillars (2025–2026, v4.2.3+)

1. **Code Quality & Standards Excellence** (Zero warnings, Constitutional AI, Grade A+ maintained).
2. **Reliability & Observability Excellence** (SLOs, structured errors, resilience, canonical cache health, negative caching).
3. **Intelligence Elevation** (NLACS advanced, PlannerAgent strategic pipeline, memory audit, entity extraction).
4. **Experience & Adoption** (Web dashboard, VS Code extension, metrics, live auto-refresh, Electron/mobile apps).
5. **Life Domains & Privacy Compartmentalization** (domain profiles, default-deny bridges, consent, DLP, audit).
6. **Model-Agnostic Routing** (UnifiedModelPicker, cost/quality/latency, hot-swap, fallback, telemetry).
7. **Extensibility & Ecosystem** (Plugin/extension SDK, connectors, release workflow, lint/static enforcement).
8. **Performance & Scale** (Cache perf, clustering, adaptive sampling, histograms, CI/CD automation).
9. **Governance & Compliance** (Policy layer, audit visualizations, data retention, roadmap file guard, RFC workflow).
10. **Research & Innovation** (Emergent insight detection, knowledge graph, autonomous optimization, semantic regression).

## 4. Release Train & High-Level Timeline (Indicative, v4.2.3+)

| Release | Target Window | Theme Focus                                     | Exit Criteria                                                                                                     |
| ------- | ------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| v4.2.3  | 2025-10-01    | Complete Canonicalization & Zero Warnings       | ✅ Zero ESLint warnings, 100% canonical compliance, Grade A+ code quality, clean TypeScript compilation           |
| v4.3    | +12 weeks     | Reactive Observability & Event-Driven Streaming | Live dashboard auto-refresh, metrics_tick integration, health_delta banner, reconnect strategy, event-driven arch |
| v4.4    | +16 weeks     | PlannerAgent Strategic Layer                    | Task decomposition, dynamic replanning, memory-driven optimization                                                |
| v4.5    | +20 weeks     | Web UI Phase A                                  | Dashboard (metrics, agents, memory explorer), HTTP NDJSON stream/WebSocket events                                 |
| v4.6    | +24 weeks     | Web UI Phase B + Error Analytics                | SLO visualization, error drill-down, taxonomy management console                                                  |
| v5.0    | +32 weeks     | Hybrid Intelligence Launch                      | Full NLACS + Planner integration, cross-session learning reports, stability SLA                                   |
| v5.1    | +40 weeks     | Extensibility & Plugin SDK                      | Signed plugin packages, sandbox execution policies, marketplace seed                                              |
| v5.2    | +48 weeks     | Scale & Multi-Instance                          | Cluster orchestration, shared memory index, distributed monitoring                                                |
| v6.0    | 2026 H1       | Enterprise Platform                             | Compliance packs, advanced anomaly detection, multi-tenant isolation, governance workflows                        |

## 5. Thematic Backlogs & Acceptance Criteria (v4.2.3+)

### 5.0 Code Quality & Standards (COMPLETED ✅ v4.2.3)

**Achievement Summary**:

- ✅ Zero ESLint warnings (eliminated all 35 warnings)
- ✅ 100% canonical system compliance (no parallel implementations)
- ✅ Grade A+ code quality (80%+ standard maintained)
- ✅ TypeScript type safety (no `any` types in production paths)
- ✅ Constitutional AI compliance (100% adherence to principles)
- ✅ Architectural exceptions documented (clear justifications for ephemeral Map usage)
- ✅ Clean build (zero TypeScript errors)

**Patterns Established**:

- Architectural exception comments for legitimate ephemeral usage
- Canonical time via `createUnifiedTimestamp()`
- Canonical IDs via `createUnifiedId()`
- Proper TypeScript typing with `OneAgentMemory` and `UnifiedMetadata`
- Promise handling with await and type casting

**Files Modified** (17 total):

- Map cache canonicalization: 9 files with architectural exceptions
- Time system canonicalization: 8 files (Date.now() → createUnifiedTimestamp())
- TypeScript type safety: 2 files (any → proper typing)

**Next Steps**: Maintain zero-warning standard for all future development.

### 5.1 Reactive Observability & Event-Driven Streaming (NEW PRIORITY — v4.3.0)

**Backend Priorities**:

- Event-driven streaming: Emit latency updates on operation completion (no fixed intervals)
- Metrics tick throttle: Batch operations within 2s window
- Unified channel registry: Abstract subscription handler map
- Health delta refactor: Push updates only on status changes

**Frontend Priorities**:

- WS store & reducers: Shared state for latency series, health, connection
- Live merge logic: Integrate metrics_tick into latency chart
- Health banner & timeline: Visual + accessible health delta
- Reconnect strategy: Exponential backoff with fallback to REST

**Testing Priorities**:

- WS contract tests: JSON schema validation for outbound messages
- Reconnect simulation: Heartbeat loss scenario testing

**Acceptance Criteria**:

- Live dashboard refresh < 2s latency
- WebSocket reconnect < 5s average
- Health status changes visible within 500ms
- Zero polling for metrics updates
- > 95% WS uptime in development usage
- Contract tests cover 100% of WS message types

### 5.2 Canonical Cache & Release Automation (COMPLETED ✅ v4.2.2)

- All cross-cutting caches unified (`OneAgentUnifiedBackbone.getInstance().cache`)
- Discovery and web findings use canonical cache with TTL/backoff, negative caching
- Prometheus mission gauges, error rate, health aggregation
- Release workflow: tag push/create, verify gate, UI/extension build, error diagnostics, release notes from `RELEASE_NOTES/<tag>.md`
- Lint/static enforcement: no-parallel-cache (WARN for 4.2.2), prefer-unified-time/id
- CI/CD: npm cache, timeouts, error log tail, artifact upload

Acceptance:

- No parallel time/ID/cache/memory/metrics systems
- All caches route through canonical service
- Negative caching and TTL/backoff in place
- Release workflow passes verify, creates release, surfaces errors

### 5.3 Reliability & Observability (Expanded)

- Error Taxonomy Registry: `errorCodes.ts` enumerating stable codes; mapping function w/ unit tests.
- Histograms: HDR or bucketed; p50/p90/p95/p99 from canonical histogram object; no parallel stores.
- SLO Config: `slo.config.json` listing targets (latency/error budgets) + loader & validator.
- Alert Pack: `docs/monitoring/ALERTS.md` curated PromQL + rationale.
- Anomaly Detection (Phase 2): Z-score or seasonal baseline; emits structured `monitoring.anomaly` events.
- Stream Uptime & Health: Track MCP `/mcp/stream` NDJSON stream uptime as a gauge; alert when below threshold; expose in JSON + Prometheus.

### 5.4 NLACS & Intelligence

### 5.5 Planner & Orchestration

Orchestration (Hybrid + Proactive)

Patterns (User flows to support explicitly, using canonical services):

Planner (Strategic)

All agent-to-agent communication, including orchestration, reminders, and team meetings, is routed through UnifiedAgentCommunicationService, is NLACS-extended for natural language coordination, and is memory-audited for full traceability, auditability, and self-improving review (Alita evolution). No parallel communication systems are permitted; legacy adapters are deprecated and stubbed.

### 5.6 UI / UX Platform (Expanded)

Acceptance (Phase A minimum):

- Orchestration metrics table shows agent utilization and success rate derived from canonical events.
- Live stream viewer connected to `/mcp/stream` with reconnection and health badge.
- Domain selector in UI scopes views to a selected domain (work/personal/etc.) without crossing data.

### 5.5 Extensibility & Ecosystem

- Plugin Manifest Spec: Signed metadata file w/ declared capabilities, permissions.
- Sandbox Execution: Process isolation or VM boundary for untrusted plugin code.
- Version & Compatibility: Semver + capability negotiation fallback path.
- Marketplace Bootstrap: Static index JSON + publishing CLI; later dynamic service.
- Connector Framework: First‑party connectors for calendars, email, tasks, cloud drives; signed and sandboxed under the same Plugin SDK.

### 5.6 Performance & Scale

- Adaptive Sampling: Keep full detail for errors & tail latencies; sample high-volume successes.
- Clustering: Stateless MCP frontends + shared memory + distributed event bus (NATS/Redis candidate) — design doc & prototype.
- Cache Strategy: Multi-layer (in-memory + optional Redis) with TTL & invalidation events.
- Load / Stress Benchmarks: `scripts/perf/*.ts` harness + automated regression thresholds.

Acceptance (initial):

- Baseline single-node sustained ops/sec published and guarded in CI perf check.
- Adaptive sampling enabled for high-volume operations without losing tail/error fidelity.

### 5.7 Governance & Compliance

- RFC Process: `docs/rfc/RFC-XXXX-title.md` template; merge gating for major changes.
- Data Retention Policy: Configurable retention windows for memory categories.
- Audit Dashboard: UI pane sourced from audit log queries.
- Policy Engine: Declarative YAML rules for message content, PII redaction, export controls.

Quality Gates (expanded):

- CI guard prevents introduction of non-canonical roadmap files (any `*roadmap*.md` outside `docs/ROADMAP.md`).
- Lint rule/guard to prevent banned metric names and non-taxonomy error strings in monitored paths.

### 5.9 Life Domains & Privacy (New)

- Domain Profiles: Work, Personal, Health, Finance, Creative profiles—each a context compartment with separate defaults, capabilities, and storage partitions enforced via policy hooks.
- Consent Bridges: Default‑deny cross‑domain sharing; explicit, auditable consent is required to bridge data between domains (with taxonomy‑coded reasons).
- DLP Rules: Redaction and content filters tailored per domain; denial events captured in monitoring with `operation` and taxonomy code.
- Domain Switch UX: Explicit domain switcher in UI; automatic inference hints (e.g., location/home network) must still require user confirmation before switching.
- Audit & Residency: Memory audit trails carry `domain` metadata; per‑domain retention policies configurable via governance.

Acceptance:

- Cross‑domain leakage conformance tests pass (deny by default; explicit consent properly audited).
- Per‑domain metrics and policy counters visible in JSON + Prometheus; UI scopes to a domain without leakage.

All domain compartmentalization, consent bridges, and DLP enforcement leverage the canonical UnifiedAgentCommunicationService, with NLACS extension and memory audit for full traceability and review. Cross-domain communication is strictly routed through canonical services; legacy adapters are deprecated. Alita evolution ensures self-improving review and auditability across all domain operations.

### 5.10 Model‑Agnostic Routing (New)

- UnifiedModelPicker Policies: Route by cost/quality/latency per role; cheap model for casual chat, upgrade for complex tasks.
- Hot‑Swap & Fallback: Seamless provider swap with minimal downtime; fallback to alternate model on errors/timeouts.
- Telemetry: Record route decisions, MTMS (mean time to model swap), task success by model class.

Acceptance:

- Policy tests demonstrate correct routing and fallbacks; MTMS reported; cost per 1K tokens trend visible.
- No env‑driven shadow configs; all routing via canonical picker to avoid parallel model systems.

### 5.8 Research & Innovation (Stretch)

- Autonomous Improvement Loops: Agent proposes + validates code path enhancements.
- Semantic Regression Detection: Diff embeddings between releases to flag behavioral drift.
- Insight Ranking Model: Train lightweight model scoring emergent insights by impact.

## 6. Dependency Graph (High-Level)

```
Error Taxonomy → SLO Config → Alert Pack → UI Error Analytics
Histograms → Accurate p95/p99 + SLO reliability
Entity Extraction → Emergent Insights → Knowledge Graph → Planner Optimization
Planner Core → Dynamic Replanning → Capability Forecasting
Web UI Phase A → Phase B (SLO/Error views) → Phase C (Electron) → Phase D (Mobile)
Plugin Manifest → Sandbox Execution → Marketplace Launch
Adaptive Sampling → Clustering → Distributed Monitoring → Enterprise Scale (v6.0)
```

## 7. Risks & Mitigations

| Risk                              | Impact                    | Mitigation                                                       |
| --------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| Error code explosion              | Metrics cardinality, cost | Enforce registry + sanitization + cap fallback `other`           |
| UI scope creep                    | Delayed releases          | Phased MVP; freeze scope per release branch                      |
| Planner complexity overrun        | Unstable planning         | Start heuristic baseline; iterative improvement guarded by tests |
| Distributed state race conditions | Data inconsistency        | Event-sourced or idempotent operations + version checks          |
| Plugin security vulnerabilities   | Supply chain risk         | Mandatory signing + sandbox + permission manifest                |
| Observability overhead            | Latency inflation         | Sampling + async snapshot collection                             |
| Insight false positives           | User trust erosion        | Confidence scoring + manual review toggle                        |
| Roadmap fragmentation             | Architecture drift        | CI guard to fail PRs introducing additional `*roadmap*.md` files |
| Cross‑domain leakage              | Privacy breach, trust     | Default‑deny consent bridges; DLP rules; isolation tests in CI   |
| Model provider cost/outage        | Cost spikes, instability  | Routing policies, hot‑swap providers, budget alerts              |

## 8. KPIs & Operational Metrics

| Category      | KPI                                   | Target v5.0 | Target v6.0 |
| ------------- | ------------------------------------- | ----------- | ----------- |
| Reliability   | p95 core op latency                   | < 750ms     | < 500ms     |
| Reliability   | Error budget burn (monthly)           | < 25%       | < 15%       |
| Observability | Alert MTTA                            | < 5m        | < 3m        |
| Intelligence  | Validated emergent insights / week    | 10          | 30          |
| Planning      | Avg plan success (no replan)          | 70%         | 85%         |
| Adoption      | Active plugins installed (avg)        | 5           | 25          |
| Scale         | Sustained ops/sec (single node)       | 150         | 400         |
| Scale         | Cluster horizontal scaling efficiency | 70%         | 85%         |
| Availability  | NDJSON stream uptime (monthly)        | 99.0%       | 99.9%       |
| UX            | Dashboard p95 load latency            | < 2s        | < 1s        |
| Privacy       | Domain leakage incidents (monthly)    | 0           | 0           |
| Routing       | MTMS (mean time to model swap)        | < 5m        | < 1m        |
| Routing       | Task success by model class (delta)   | +5%         | +10%        |
| Domains       | Domain switch latency p95             | < 500ms     | < 300ms     |

## 9. Sunset / Decommission Plan

| Legacy Aspect                          | Action                      | Timeline  |
| -------------------------------------- | --------------------------- | --------- |
| Ad-hoc error strings                   | Replace with registry codes | v4.1      |
| Sequential metrics fetch (done)        | Completed removal           | v4.0.7 ✅ |
| Placeholder NLACS fields w/ dummy data | Replace with real providers | v4.3      |
| Lack of histograms                     | Implement HDR/buckets       | v4.2      |
| Non-structured alerts                  | Provide canonical pack      | v4.1      |
| Parallel roadmap documents             | Enforce single canonical    | v4.1      |

## 10. Governance & Change Control

- Release Cadence: 4-week minor, 8-week strategic checkpoints.
- RFC Threshold: Any new public API, storage schema, plugin contract, or metric label addition.
- Quality Gates: `npm run verify`, smoke tests, perf baseline delta (<10% regression), security lint.
  - CI Guard: Fail build if a new `*roadmap*.md` appears outside `docs/ROADMAP.md`.
- Definition of Done: Code + tests + docs + changelog + roadmap delta recorded.

## 11. Implementation Principles (Reaffirmed)

- Single Source of Truth: Augment existing canonical services; never fork logic.
- Derivational Metrics: Prometheus exposition remains read-only, no shadow accumulators.
- Stability First: Introduce advanced features behind flags where risk > moderate.
- Progressive Enhancement: MVP → harden → optimize → extend sequence.
- Measured Ambition: Dream big (emergent intelligence & autonomous optimization) while grounding each milestone with observable KPIs.

## 12. Immediate Action Queue (Execution Kickoff / Status)

| #   | Item                                                                 | Target             | Status     | Notes                                                                                               |
| --- | -------------------------------------------------------------------- | ------------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| 1   | Create `coreagent/monitoring/errorTaxonomy.ts` (enum + mapping stub) | v4.1               | ✅ Done    | Wired into Prometheus + JSON metrics + unified & secure handlers + monitoring events (taxonomyCode) |
| 2   | Add `docs/monitoring/ALERTS.md` baseline rules                       | v4.1               | ✅ Done    | Initial pack drafted                                                                                |
| 3   | Implement histogram layer in `PerformanceMonitor`                    | v4.2               | ✅ Done    | Fixed bucket histogram + Prometheus exposition + tests (early delivery)                             |
| 4   | NLACS entity extraction provider interface                           | v4.3               | ✅ Done    | Baseline pattern extractor integrated into ChatAPI (entities populated)                             |
| 5   | Web UI scaffolding (`ui/web`) with metrics JSON consumption          | v4.5 (start early) | 🚧 Partial | Scaffold + JSON endpoint live                                                                       |
| 6   | SLO Config scaffold (`slo.config.json` + loader)                     | v4.1               | ✅ Added   | Needs integration into alerting phase                                                               |
| 7   | Error budget burn & remaining gauges (Prometheus + JSON)             | v4.1               | ✅ Done    | Gauges + JSON errorBudgets array derived from opSummary vs SLO targets (no parallel state)          |
| 8   | Optional semanticAnalysis exposure in ChatAPI response               | v4.3               | ✅ Done    | Flag `includeSemanticAnalysis` returns entities, intent, sentiment, complexity                      |
| 9   | Hybrid Orchestrator: BMAD agent selection                            | v4.2               | ⏳ Planned | Replace basic selection with BMAD + CAI validation; unit + integration tests                        |
| 10  | Orchestration metrics: agent utilization + success rate              | v4.1               | ✅ Done    | Exposed via JSON + Prometheus; Phase A UI table pending                                             |
| 11  | Orchestration policy hooks (governance pre/post checks)              | v4.2               | ⏳ Planned | Pluggable policies for message/task; audited denials                                                |
| 12  | Workflow controls: retry/rollback/dynamic reassignment               | v4.3               | ⏳ Planned | Step-level control with clear audit trail                                                           |
| 13  | Clustering design doc for orchestrator                               | v4.5               | ⏳ Planned | Stateless frontends, shared memory index, distributed events                                        |
| 14  | CI guard to prevent parallel roadmap files                           | v4.1               | ⏳ Planned | Block any `*roadmap*.md` outside `docs/ROADMAP.md`                                                  |
| 15  | Anomaly detection prototype (latency Z-score → events)               | v4.1               | ⏳ Planned | Emit `monitoring.anomaly` events; validate with synthetic spikes                                    |
| 16  | NDJSON stream uptime gauge + alert                                   | v4.1               | ⏳ Planned | Gauge + alert rule; surface in JSON + Prometheus                                                    |
| 17  | Domain Profiles + Consent Bridges (MVP, policies + tests)            | v4.1               | ⏳ Planned | Implement domain compartments using policy hooks; CI conformance tests for leakage                  |
| 18  | Model routing v1 (cost/quality/latency)                              | v4.1               | ⏳ Planned | Strengthen UnifiedModelPicker policies + telemetry; enable safe hot‑swap                            |
| 19  | Reminder delegation pattern (OfficeAgent + calendar connector)       | v4.1               | ⏳ Planned | Orchestrator → OfficeAgent via unified comms; memory audit trail; example test                      |
| 20  | Team meeting orchestration sample (multi‑agent session)              | v4.2               | ⏳ Planned | Orchestrator convenes agents; decisions/tasks stored in memory; progress queried from memory        |
| 21  | Connector framework spec + initial adapters (calendar/email)         | v4.2               | ⏳ Planned | Signed/sandboxed connectors integrated under Plugin SDK; no parallel client libraries               |

Next Up (short list):

- Anomaly detection prototype (operation latency Z-score events).
- Enhance entity extraction (model-based NER pipeline behind same service contract).
- Proactive Delegation Persistence Stage 2 (planned): Structured error code taxonomy for execution failures + remediation latency histograms (builds on current restore + snapshot stage).

## 13. Moonshot / Long-Horizon Initiatives

All moonshot initiatives, including autonomous refactoring, self-tuning planner, federated multi-agent mesh, and temporal analytics, are required to use the canonical UnifiedAgentCommunicationService with NLACS extension and memory audit for traceability and self-improving review (Alita evolution). No parallel communication systems are permitted; legacy adapters are deprecated and stubbed.

- Autonomous Refactoring Agent: Observes hotspots, drafts patch PRs with quality validation.
- Self-Tuning Planner: Uses reinforcement signals to optimize decomposition strategies.
- Federated Multi-Agent Mesh: Secure cross-instance collaboration with cryptographic capability tokens.
- Temporal Analytics Engine: Time-series correlation across memory, operations, and insights for causality discovery.

## 14. Acceptance & Review

This roadmap is considered active once merged to `main`. Quarterly review cycle; monthly checkpoint updates appended in a CHANGELOG "Roadmap Updates" section.

---

**Maintainer**: Lead Developer (OneAgent)  
**Version**: 1.0.5 (Aligned to platform v4.2.3)  
**Next Review**: +30 days from merge

| Pillar                             | Scope                                        | Status       | Maturity (1-5) | Notes                                                                                         |
| ---------------------------------- | -------------------------------------------- | ------------ | -------------- | --------------------------------------------------------------------------------------------- |
| Canonical Core Systems             | Time, ID, Memory, Cache                      | ✅ Complete  | 4              | Error handling taxonomy pending for level 5                                                   |
| Communication Layer                | A2A protocol + persistence + instrumentation | ✅ Complete  | 4              | NLACS advanced features outstanding                                                           |
| Monitoring & Metrics               | Counters, latency gauges, error counters     | ✅ Enhanced  | 4              | Histograms + SLO target gauges + error budget burn gauges complete; anomaly detection pending |
| Error Handling & Taxonomy          | Canonical registry + mapped metrics          | 🚧 Advancing | 3              | Taxonomy integrated in handlers + monitoring + metrics; policy console pending                |
| NLACS / Emergent Intelligence      | Placeholders + partial fields                | 🚧 Partial   | 2              | Entity extraction + optional semantic exposure; cross-session insights missing                |
| Orchestration (Hybrid + Proactive) | Multi-agent orchestration + proactive triage | ✅ Complete  | 4              | HybridAgentOrchestrator prod-ready; ProactiveTriageOrchestrator live; policy hooks pending    |
| Planner (Strategic)                | Decomposition & dynamic replanning           | 🚧 Partial   | 2              | Strategic planning & dynamic replanning not done                                              |
| UI / Visualization                 | VS Code extension, dashboard, metrics        | � Advancing  | 2              | VS Code extension compiles, dashboard metrics planned, live auto-refresh next                 |
| Resilience & Reliability           | Basic fallback & retries                     | 🚧 Partial   | 2              | Circuit breakers, chaos tests absent                                                          |
| Security / Privacy / Compliance    | Baseline privacy metadata                    | 🚧 Partial   | 2              | Policy enforcement & audit dashboards needed                                                  |
| Extensibility / Plugin Model       | Tool registry internal                       | 🚧 Early     | 2              | Public plugin packaging & versioning needed                                                   |
| Performance & Scale                | Local dev scale proven                       | 🚧 Early     | 2              | Load, multi-instance clustering not validated                                                 |
| Governance & Change Control        | Manual PR & docs                             | 🚧 Early     | 2              | Release train & RFC workflow required                                                         |

## 3. Strategic Pillars (2025–2026)

1. Reliability & Observability Excellence (SLOs, structured errors, resilience).
2. Intelligence Elevation (NLACS advanced + PlannerAgent strategic pipeline).
3. Experience & Adoption (Web dashboard, Electron desktop, mobile apps + hooks).
4. Life Domains & Privacy Compartmentalization (work/personal/health/finance/creative domains with default‑deny bridges, consent, DLP).
5. Model‑Agnostic Intelligence Routing (cost/quality/latency policies, hot‑swap and fallback).
6. Extensibility & Ecosystem (Plugin/extension SDK, connectors, marketplace‑ready metadata).
7. Performance & Scale (Clustering, horizontal scaling, adaptive sampling, histograms).
8. Governance & Compliance (Policy layer, audit visualizations, data retention controls).
9. Research & Innovation (Emergent insight detection, knowledge graph, autonomous optimisation loops).

## 4. Release Train & High-Level Timeline (Indicative)

| Release | Target Window | Theme Focus                         | Exit Criteria                                                                                    |
| ------- | ------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| v4.1    | +4 weeks      | Error Taxonomy & Orchestration UX A | Canonical error codes, JSON/Prometheus SLO metrics, basic alert pack, orchestration metrics view |
| v4.2    | +8 weeks      | Resilience & Policy Hooks           | Circuit breakers, retry policy hardening, chaos tests, orchestration governance/policy hooks     |
| v4.3    | +12 weeks     | NLACS Phase 3 (Core)                | Entity extraction, constitutional validation pipeline, emergent insight MVP                      |
| v4.4    | +16 weeks     | PlannerAgent Strategic Layer        | Task decomposition, dynamic replanning, memory-driven optimization                               |
| v4.5    | +20 weeks     | Web UI Phase A                      | Dashboard (metrics, agents, memory explorer), HTTP NDJSON stream/WebSocket events                |
| v4.6    | +24 weeks     | Web UI Phase B + Error Analytics    | SLO visualization, error drill-down, taxonomy management console                                 |
| v5.0    | +32 weeks     | Hybrid Intelligence Launch          | Full NLACS + Planner integration, cross-session learning reports, stability SLA                  |
| v5.1    | +40 weeks     | Extensibility & Plugin SDK          | Signed plugin packages, sandbox execution policies, marketplace seed                             |
| v5.2    | +48 weeks     | Scale & Multi-Instance              | Cluster orchestration, shared memory index, distributed monitoring                               |
| v6.0    | 2026 H1       | Enterprise Platform                 | Compliance packs, advanced anomaly detection, multi-tenant isolation, governance workflows       |

## 5. Thematic Backlogs & Acceptance Criteria

### 5.1 Reliability & Observability

- Error Taxonomy Registry: `errorCodes.ts` enumerating stable codes; mapping function w/ unit tests.
- Histograms: HDR or bucketed; p50/p90/p95/p99 from canonical histogram object; no parallel stores.
- SLO Config: `slo.config.json` listing targets (latency/error budgets) + loader & validator.
- Alert Pack: `docs/monitoring/ALERTS.md` curated PromQL + rationale.
- Anomaly Detection (Phase 2): Z-score or seasonal baseline; emits structured `monitoring.anomaly` events.
- Stream Uptime & Health: Track MCP `/mcp/stream` NDJSON stream uptime as a gauge; alert when below threshold; expose in JSON + Prometheus.

### 5.2 NLACS & Intelligence

### 5.3 Planner & Orchestration

Orchestration (Hybrid + Proactive)

Patterns (User flows to support explicitly, using canonical services):

Planner (Strategic)

All agent-to-agent communication, including orchestration, reminders, and team meetings, is routed through UnifiedAgentCommunicationService, is NLACS-extended for natural language coordination, and is memory-audited for full traceability, auditability, and self-improving review (Alita evolution). No parallel communication systems are permitted; legacy adapters are deprecated and stubbed.

### 5.4 UI / UX Platform

Acceptance (Phase A minimum):

- Orchestration metrics table shows agent utilization and success rate derived from canonical events.
- Live stream viewer connected to `/mcp/stream` with reconnection and health badge.
- Domain selector in UI scopes views to a selected domain (work/personal/etc.) without crossing data.

### 5.5 Extensibility & Ecosystem (Expanded)

- Plugin Manifest Spec: Signed metadata file w/ declared capabilities, permissions.
- Sandbox Execution: Process isolation or VM boundary for untrusted plugin code.
- Version & Compatibility: Semver + capability negotiation fallback path.
- Marketplace Bootstrap: Static index JSON + publishing CLI; later dynamic service.
- Connector Framework: First‑party connectors for calendars, email, tasks, cloud drives; signed and sandboxed under the same Plugin SDK.

### 5.6 Performance & Scale (Expanded)

- Adaptive Sampling: Keep full detail for errors & tail latencies; sample high-volume successes.
- Clustering: Stateless MCP frontends + shared memory + distributed event bus (NATS/Redis candidate) — design doc & prototype.
- Cache Strategy: Multi-layer (in-memory + optional Redis) with TTL & invalidation events.
- Load / Stress Benchmarks: `scripts/perf/*.ts` harness + automated regression thresholds.

Acceptance (initial):

- Baseline single-node sustained ops/sec published and guarded in CI perf check.
- Adaptive sampling enabled for high-volume operations without losing tail/error fidelity.

### 5.7 Governance & Compliance (Expanded)

- RFC Process: `docs/rfc/RFC-XXXX-title.md` template; merge gating for major changes.
- Data Retention Policy: Configurable retention windows for memory categories.
- Audit Dashboard: UI pane sourced from audit log queries.
- Policy Engine: Declarative YAML rules for message content, PII redaction, export controls.

Quality Gates (expanded):

- CI guard prevents introduction of non-canonical roadmap files (any `*roadmap*.md` outside `docs/ROADMAP.md`).
- Lint rule/guard to prevent banned metric names and non-taxonomy error strings in monitored paths.

### 5.8 Life Domains & Privacy (Expanded)

- Domain Profiles: Work, Personal, Health, Finance, Creative profiles—each a context compartment with separate defaults, capabilities, and storage partitions enforced via policy hooks.
- Consent Bridges: Default‑deny cross‑domain sharing; explicit, auditable consent is required to bridge data between domains (with taxonomy‑coded reasons).
- DLP Rules: Redaction and content filters tailored per domain; denial events captured in monitoring with `operation` and taxonomy code.
- Domain Switch UX: Explicit domain switcher in UI; automatic inference hints (e.g., location/home network) must still require user confirmation before switching.
- Audit & Residency: Memory audit trails carry `domain` metadata; per‑domain retention policies configurable via governance.

Acceptance:

- Cross‑domain leakage conformance tests pass (deny by default; explicit consent properly audited).
- Per‑domain metrics and policy counters visible in JSON + Prometheus; UI scopes to a domain without leakage.

All domain compartmentalization, consent bridges, and DLP enforcement leverage the canonical UnifiedAgentCommunicationService, with NLACS extension and memory audit for full traceability and review. Cross-domain communication is strictly routed through canonical services; legacy adapters are deprecated. Alita evolution ensures self-improving review and auditability across all domain operations.

### 5.9 Model-Agnostic Routing (Expanded)

- UnifiedModelPicker Policies: Route by cost/quality/latency per role; cheap model for casual chat, upgrade for complex tasks.
- Hot‑Swap & Fallback: Seamless provider swap with minimal downtime; fallback to alternate model on errors/timeouts.
- Telemetry: Record route decisions, MTMS (mean time to model swap), task success by model class.

Acceptance:

- Policy tests demonstrate correct routing and fallbacks; MTMS reported; cost per 1K tokens trend visible.
- No env‑driven shadow configs; all routing via canonical picker to avoid parallel model systems.

### 5.10 Research & Innovation (Expanded)

- Autonomous Improvement Loops: Agent proposes + validates code path enhancements.
- Semantic Regression Detection: Diff embeddings between releases to flag behavioral drift.
- Insight Ranking Model: Train lightweight model scoring emergent insights by impact.

## 6. Dependency Graph (High-Level)

```
Error Taxonomy → SLO Config → Alert Pack → UI Error Analytics
Histograms → Accurate p95/p99 + SLO reliability
Entity Extraction → Emergent Insights → Knowledge Graph → Planner Optimization
Planner Core → Dynamic Replanning → Capability Forecasting
Web UI Phase A → Phase B (SLO/Error views) → Phase C (Electron) → Phase D (Mobile)
Plugin Manifest → Sandbox Execution → Marketplace Launch
Adaptive Sampling → Clustering → Distributed Monitoring → Enterprise Scale (v6.0)
```

## 7. Risks & Mitigations

| Risk                              | Impact                    | Mitigation                                                       |
| --------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| Error code explosion              | Metrics cardinality, cost | Enforce registry + sanitization + cap fallback `other`           |
| UI scope creep                    | Delayed releases          | Phased MVP; freeze scope per release branch                      |
| Planner complexity overrun        | Unstable planning         | Start heuristic baseline; iterative improvement guarded by tests |
| Distributed state race conditions | Data inconsistency        | Event-sourced or idempotent operations + version checks          |
| Plugin security vulnerabilities   | Supply chain risk         | Mandatory signing + sandbox + permission manifest                |
| Observability overhead            | Latency inflation         | Sampling + async snapshot collection                             |
| Insight false positives           | User trust erosion        | Confidence scoring + manual review toggle                        |
| Roadmap fragmentation             | Architecture drift        | CI guard to fail PRs introducing additional `*roadmap*.md` files |
| Cross‑domain leakage              | Privacy breach, trust     | Default‑deny consent bridges; DLP rules; isolation tests in CI   |
| Model provider cost/outage        | Cost spikes, instability  | Routing policies, hot‑swap providers, budget alerts              |

## 8. KPIs & Operational Metrics

| Category      | KPI                                   | Target v5.0 | Target v6.0 |
| ------------- | ------------------------------------- | ----------- | ----------- |
| Reliability   | p95 core op latency                   | < 750ms     | < 500ms     |
| Reliability   | Error budget burn (monthly)           | < 25%       | < 15%       |
| Observability | Alert MTTA                            | < 5m        | < 3m        |
| Intelligence  | Validated emergent insights / week    | 10          | 30          |
| Planning      | Avg plan success (no replan)          | 70%         | 85%         |
| Adoption      | Active plugins installed (avg)        | 5           | 25          |
| Scale         | Sustained ops/sec (single node)       | 150         | 400         |
| Scale         | Cluster horizontal scaling efficiency | 70%         | 85%         |
| Availability  | SSE stream uptime (monthly)           | 99.0%       | 99.9%       |
| UX            | Dashboard p95 load latency            | < 2s        | < 1s        |
| Privacy       | Domain leakage incidents (monthly)    | 0           | 0           |
| Routing       | MTMS (mean time to model swap)        | < 5m        | < 1m        |
| Routing       | Task success by model class (delta)   | +5%         | +10%        |
| Domains       | Domain switch latency p95             | < 500ms     | < 300ms     |

## 9. Sunset / Decommission Plan

| Legacy Aspect                          | Action                      | Timeline  |
| -------------------------------------- | --------------------------- | --------- |
| Ad-hoc error strings                   | Replace with registry codes | v4.1      |
| Sequential metrics fetch (done)        | Completed removal           | v4.0.7 ✅ |
| Placeholder NLACS fields w/ dummy data | Replace with real providers | v4.3      |
| Lack of histograms                     | Implement HDR/buckets       | v4.2      |
| Non-structured alerts                  | Provide canonical pack      | v4.1      |
| Parallel roadmap documents             | Enforce single canonical    | v4.1      |

## 10. Governance & Change Control

- Release Cadence: 4-week minor, 8-week strategic checkpoints.
- RFC Threshold: Any new public API, storage schema, plugin contract, or metric label addition.
- Quality Gates: `npm run verify`, smoke tests, perf baseline delta (<10% regression), security lint.
  - CI Guard: Fail build if a new `*roadmap*.md` appears outside `docs/ROADMAP.md`.
- Definition of Done: Code + tests + docs + changelog + roadmap delta recorded.

## 11. Implementation Principles (Reaffirmed)

- Single Source of Truth: Augment existing canonical services; never fork logic.
- Derivational Metrics: Prometheus exposition remains read-only, no shadow accumulators.
- Stability First: Introduce advanced features behind flags where risk > moderate.
- Progressive Enhancement: MVP → harden → optimize → extend sequence.
- Measured Ambition: Dream big (emergent intelligence & autonomous optimization) while grounding each milestone with observable KPIs.

## 12. Immediate Action Queue (Execution Kickoff / Status, v4.2.2+)

| 22 | Canonical cache policy enforcement, negative caching, release workflow automation | v4.2.2 | ✅ Done | All caches unified, negative caching, release workflow, lint/static enforcement, error diagnostics |

| #   | Item                                                                 | Target             | Status     | Notes                                                                                               |
| --- | -------------------------------------------------------------------- | ------------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| 1   | Create `coreagent/monitoring/errorTaxonomy.ts` (enum + mapping stub) | v4.1               | ✅ Done    | Wired into Prometheus + JSON metrics + unified & secure handlers + monitoring events (taxonomyCode) |
| 2   | Add `docs/monitoring/ALERTS.md` baseline rules                       | v4.1               | ✅ Done    | Initial pack drafted                                                                                |
| 3   | Implement histogram layer in `PerformanceMonitor`                    | v4.2               | ✅ Done    | Fixed bucket histogram + Prometheus exposition + tests (early delivery)                             |
| 4   | NLACS entity extraction provider interface                           | v4.3               | ✅ Done    | Baseline pattern extractor integrated into ChatAPI (entities populated)                             |
| 5   | Web UI scaffolding (`ui/web`) with metrics JSON consumption          | v4.5 (start early) | 🚧 Partial | Scaffold + JSON endpoint live                                                                       |
| 6   | SLO Config scaffold (`slo.config.json` + loader)                     | v4.1               | ✅ Added   | Needs integration into alerting phase                                                               |
| 7   | Error budget burn & remaining gauges (Prometheus + JSON)             | v4.1               | ✅ Done    | Gauges + JSON errorBudgets array derived from opSummary vs SLO targets (no parallel state)          |
| 8   | Optional semanticAnalysis exposure in ChatAPI response               | v4.3               | ✅ Done    | Flag `includeSemanticAnalysis` returns entities, intent, sentiment, complexity                      |
| 9   | Hybrid Orchestrator: BMAD agent selection                            | v4.2               | ⏳ Planned | Replace basic selection with BMAD + CAI validation; unit + integration tests                        |
| 10  | Orchestration metrics: agent utilization + success rate              | v4.1               | ✅ Done    | Exposed via JSON + Prometheus; Phase A UI table pending                                             |
| 11  | Orchestration policy hooks (governance pre/post checks)              | v4.2               | ⏳ Planned | Pluggable policies for message/task; audited denials                                                |
| 12  | Workflow controls: retry/rollback/dynamic reassignment               | v4.3               | ⏳ Planned | Step-level control with clear audit trail                                                           |
| 13  | Clustering design doc for orchestrator                               | v4.5               | ⏳ Planned | Stateless frontends, shared memory index, distributed events                                        |
| 14  | CI guard to prevent parallel roadmap files                           | v4.1               | ⏳ Planned | Block any `*roadmap*.md` outside `docs/ROADMAP.md`                                                  |
| 15  | Anomaly detection prototype (latency Z-score → events)               | v4.1               | ⏳ Planned | Emit `monitoring.anomaly` events; validate with synthetic spikes                                    |
| 16  | SSE uptime gauge + alert                                             | v4.1               | ⏳ Planned | Gauge + alert rule; surface in JSON + Prometheus                                                    |
| 17  | Domain Profiles + Consent Bridges (MVP, policies + tests)            | v4.1               | ⏳ Planned | Implement domain compartments using policy hooks; CI conformance tests for leakage                  |
| 18  | Model routing v1 (cost/quality/latency)                              | v4.1               | ⏳ Planned | Strengthen UnifiedModelPicker policies + telemetry; enable safe hot‑swap                            |
| 19  | Reminder delegation pattern (OfficeAgent + calendar connector)       | v4.1               | ⏳ Planned | Orchestrator → OfficeAgent via unified comms; memory audit trail; example test                      |
| 20  | Team meeting orchestration sample (multi‑agent session)              | v4.2               | ⏳ Planned | Orchestrator convenes agents; decisions/tasks stored in memory; progress queried from memory        |
| 21  | Connector framework spec + initial adapters (calendar/email)         | v4.2               | ⏳ Planned | Signed/sandboxed connectors integrated under Plugin SDK; no parallel client libraries               |

Next Up (short list):

- Anomaly detection prototype (operation latency Z-score events).
- Enhance entity extraction (model-based NER pipeline behind same service contract).
- Proactive Delegation Persistence Stage 2 (planned): Structured error code taxonomy for execution failures + remediation latency histograms (builds on current restore + snapshot stage).

## 13. Moonshot / Long-Horizon Initiatives

All moonshot initiatives, including autonomous refactoring, self-tuning planner, federated multi-agent mesh, and temporal analytics, are required to use the canonical UnifiedAgentCommunicationService with NLACS extension and memory audit for traceability and self-improving review (Alita evolution). No parallel communication systems are permitted; legacy adapters are deprecated and stubbed.

- Autonomous Refactoring Agent: Observes hotspots, drafts patch PRs with quality validation.
- Self-Tuning Planner: Uses reinforcement signals to optimize decomposition strategies.
- Federated Multi-Agent Mesh: Secure cross-instance collaboration with cryptographic capability tokens.
- Temporal Analytics Engine: Time-series correlation across memory, operations, and insights for causality discovery.

## 14. Acceptance & Review

This roadmap is considered active once merged to `main`. Quarterly review cycle; monthly checkpoint updates appended in a CHANGELOG "Roadmap Updates" section.

---

**Maintainer**: Lead Developer (OneAgent)  
**Version**: 1.0.5 (Aligned to platform v4.2.3)  
**Next Review**: +30 days from merge
