# OneAgent Consolidated Strategic Roadmap (v4.0.7)

> **⚠️ Canonical File Notice**  
> This is the **ONLY** authoritative roadmap. Do **not** create additional roadmap variants (e.g. `CONSOLIDATED_ROADMAP.md`, `roadmap_v2.md`, `HYBRID_ROADMAP`, etc.). All strategy, release planning, KPI updates and status changes MUST be applied here. Creating parallel roadmap documents is prohibited and will be treated as architecture drift. A future CI guard may fail builds if a new `*roadmap*.md` file appears outside this path.
>
> Change Protocol: (1) Open PR with rationale + diff summary, (2) If adding/removing release objectives, reference supporting RFC or issue ID, (3) Update Immediate Action Queue status table accordingly, (4) Note significant alterations in CHANGELOG under "Roadmap Updates".

> Canonical roadmap superseding ad‑hoc/fragmented roadmap references. Existing roadmap & vision docs remain as historical context; this file is the single planning source of truth going forward.

## 1. Executive Summary

OneAgent has completed foundational consolidation (time, ID, memory, cache, communication persistence, baseline monitoring) and delivered professional MCP + A2A multi-agent capabilities. Focus now shifts to: (1) Reliability & Observability depth, (2) NLACS & PlannerAgent true intelligence layer, (3) Structured Error & Policy governance, (4) UI/UX platform surfaces (web, desktop), (5) Extensibility & ecosystem, (6) Performance scalability toward enterprise scale.

## 2. Current State Snapshot (Maturity Matrix)

| Pillar                          | Scope                                        | Status       | Maturity (1-5) | Notes                                                                                |
| ------------------------------- | -------------------------------------------- | ------------ | -------------- | ------------------------------------------------------------------------------------ |
| Canonical Core Systems          | Time, ID, Memory, Cache                      | ✅ Complete  | 4              | Error handling taxonomy pending for level 5                                          |
| Communication Layer             | A2A protocol + persistence + instrumentation | ✅ Complete  | 4              | NLACS advanced features outstanding                                                  |
| Monitoring & Metrics            | Counters, latency gauges, error counters     | ✅ Enhanced  | 3              | Histograms + SLO target gauges + error budget burn gauges; anomaly detection pending |
| Error Handling & Taxonomy       | Canonical registry + mapped metrics          | 🚧 Advancing | 3              | Taxonomy integrated in handlers + monitoring + metrics; policy console pending       |
| NLACS / Emergent Intelligence   | Placeholders + partial fields                | 🚧 Partial   | 2              | Entity extraction + optional semantic exposure; cross-session insights missing       |
| Planner / Orchestration         | Basic multi-agent coordination               | 🚧 Partial   | 2              | Strategic planning & dynamic replanning not done                                     |
| UI / Visualization              | VS Code extension only                       | 🚫 Minimal   | 1              | No standalone web dashboard / electron yet                                           |
| Resilience & Reliability        | Basic fallback & retries                     | 🚧 Partial   | 2              | Circuit breakers, chaos tests absent                                                 |
| Security / Privacy / Compliance | Baseline privacy metadata                    | 🚧 Partial   | 2              | Policy enforcement & audit dashboards needed                                         |
| Extensibility / Plugin Model    | Tool registry internal                       | 🚧 Early     | 2              | Public plugin packaging & versioning needed                                          |
| Performance & Scale             | Local dev scale proven                       | 🚧 Early     | 2              | Load, multi-instance clustering not validated                                        |
| Governance & Change Control     | Manual PR & docs                             | 🚧 Early     | 2              | Release train & RFC workflow required                                                |

## 3. Strategic Pillars (2025–2026)

1. Reliability & Observability Excellence (SLOs, structured errors, resilience).
2. Intelligence Elevation (NLACS advanced + PlannerAgent strategic pipeline).
3. Experience & Adoption (Web dashboard, Electron desktop, future mobile hooks).
4. Extensibility & Ecosystem (Plugin/extension SDK, marketplace-ready metadata).
5. Performance & Scale (Clustering, horizontal scaling, adaptive sampling, histograms).
6. Governance & Compliance (Policy layer, audit visualizations, data retention controls).
7. Research & Innovation (Emergent insight detection, knowledge graph, autonomous optimisation loops).

## 4. Release Train & High-Level Timeline (Indicative)

| Release | Target Window | Theme Focus                      | Exit Criteria                                                                              |
| ------- | ------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| v4.1    | +4 weeks      | Error Taxonomy & SLO Foundations | Canonical error codes, JSON & Prometheus SLO metrics, basic alert rule pack                |
| v4.2    | +8 weeks      | Resilience & Histograms          | Circuit breakers, retry policies, latency histograms, chaos test suite                     |
| v4.3    | +12 weeks     | NLACS Phase 3 (Core)             | Entity extraction, constitutional validation pipeline, emergent insight MVP                |
| v4.4    | +16 weeks     | PlannerAgent Strategic Layer     | Task decomposition, dynamic replanning, memory-driven optimization                         |
| v4.5    | +20 weeks     | Web UI Phase A                   | Dashboard (metrics, agents, memory explorer), SSE/WebSocket event stream                   |
| v4.6    | +24 weeks     | Web UI Phase B + Error Analytics | SLO visualization, error drill-down, taxonomy management console                           |
| v5.0    | +32 weeks     | Hybrid Intelligence Launch       | Full NLACS + Planner integration, cross-session learning reports, stability SLA            |
| v5.1    | +40 weeks     | Extensibility & Plugin SDK       | Signed plugin packages, sandbox execution policies, marketplace seed                       |
| v5.2    | +48 weeks     | Scale & Multi-Instance           | Cluster orchestration, shared memory index, distributed monitoring                         |
| v6.0    | 2026 H1       | Enterprise Platform              | Compliance packs, advanced anomaly detection, multi-tenant isolation, governance workflows |

## 5. Thematic Backlogs & Acceptance Criteria

### 5.1 Reliability & Observability

- Error Taxonomy Registry: `errorCodes.ts` enumerating stable codes; mapping function w/ unit tests.
- Histograms: HDR or bucketed; p50/p90/p95/p99 from canonical histogram object; no parallel stores.
- SLO Config: `slo.config.json` listing targets (latency/error budgets) + loader & validator.
- Alert Pack: `docs/monitoring/ALERTS.md` curated PromQL + rationale.
- Anomaly Detection (Phase 2): Z-score or seasonal baseline; emits structured `monitoring.anomaly` events.

### 5.2 NLACS & Intelligence

- Entity Extraction: Pluggable provider interface; baseline NER; confidence score.
- Constitutional Validation Pipeline: Pre-send & post-receive gating; structured `validationResult` metadata.
- Emergent Insight Engine: Pattern clustering across sessions; top-N insights persisted nightly.
- Cross-Session Knowledge Graph: Lightweight graph projection (agent/topic/concept edges) with TTL & compaction.

### 5.3 Planner & Orchestration

- Task Decomposition: Depth-limited tree with heuristics; quality guard rails.
- Dynamic Replanning: Detect blocked subtasks; recirculate with alternative path.
- Capability Forecasting: Use historical success metrics to bias agent selection.
- Plan Audit Trail: Serialized JSON plan lineage persisted (searchable via memory).

### 5.4 UI / UX Platform

- Phase A: Metrics dashboard, agent registry view, memory search UI, live event stream.
- Phase B: SLO & error overlays, taxonomy manager, plan visualization (graph), dark/light theme.
- Phase C (Desktop): Electron bundling; local packaging script; auto-update channel design doc.
- Phase D (Mobile Hooks): REST/GraphQL read-only endpoints for metrics & memory search.

### 5.5 Extensibility & Ecosystem

- Plugin Manifest Spec: Signed metadata file w/ declared capabilities, permissions.
- Sandbox Execution: Process isolation or VM boundary for untrusted plugin code.
- Version & Compatibility: Semver + capability negotiation fallback path.
- Marketplace Bootstrap: Static index JSON + publishing CLI; later dynamic service.

### 5.6 Performance & Scale

- Adaptive Sampling: Keep full detail for errors & tail latencies; sample high-volume successes.
- Clustering: Stateless MCP frontends + shared memory + distributed event bus (NATS/Redis candidate) — design doc & prototype.
- Cache Strategy: Multi-layer (in-memory + optional Redis) with TTL & invalidation events.
- Load / Stress Benchmarks: `scripts/perf/*.ts` harness + automated regression thresholds.

### 5.7 Governance & Compliance

- RFC Process: `docs/rfc/RFC-XXXX-title.md` template; merge gating for major changes.
- Data Retention Policy: Configurable retention windows for memory categories.
- Audit Dashboard: UI pane sourced from audit log queries.
- Policy Engine: Declarative YAML rules for message content, PII redaction, export controls.

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

## 9. Sunset / Decommission Plan

| Legacy Aspect                          | Action                      | Timeline  |
| -------------------------------------- | --------------------------- | --------- |
| Ad-hoc error strings                   | Replace with registry codes | v4.1      |
| Sequential metrics fetch (done)        | Completed removal           | v4.0.7 ✅ |
| Placeholder NLACS fields w/ dummy data | Replace with real providers | v4.3      |
| Lack of histograms                     | Implement HDR/buckets       | v4.2      |
| Non-structured alerts                  | Provide canonical pack      | v4.1      |

## 10. Governance & Change Control

- Release Cadence: 4-week minor, 8-week strategic checkpoints.
- RFC Threshold: Any new public API, storage schema, plugin contract, or metric label addition.
- Quality Gates: `npm run verify`, smoke tests, perf baseline delta (<10% regression), security lint.
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

Next Up (short list):

- Anomaly detection prototype (operation latency Z-score events).
- Enhance entity extraction (model-based NER pipeline behind same service contract).

## 13. Moonshot / Long-Horizon Initiatives

- Autonomous Refactoring Agent: Observes hotspots, drafts patch PRs with quality validation.
- Self-Tuning Planner: Uses reinforcement signals to optimize decomposition strategies.
- Federated Multi-Agent Mesh: Secure cross-instance collaboration with cryptographic capability tokens.
- Temporal Analytics Engine: Time-series correlation across memory, operations, and insights for causality discovery.

## 14. Acceptance & Review

This roadmap is considered active once merged to `main`. Quarterly review cycle; monthly checkpoint updates appended in a CHANGELOG "Roadmap Updates" section.

---

**Maintainer**: Lead Developer (OneAgent)  
**Version**: 1.0.2 (Aligned to platform v4.0.7)  
**Next Review**: +30 days from merge
