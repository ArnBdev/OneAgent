# Canonical Operation Metrics & Performance Monitoring

This document defines the unified, canonical pattern for ingesting and analyzing operation latency and reliability metrics inside OneAgent.

## Objectives

- Single source of truth for performance data (no parallel profilers)
- Automatic ingestion of latency (`durationMs`) from operation events
- Percentile visibility (p95 / p99) and actionable recommendations
- Deprecation of legacy `PerformanceProfiler` implementation
- Diagnostic instrumentation without fragmenting storage

## Canonical Components

| Component                                    | Responsibility                                                            | Notes                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| `UnifiedMonitoringService.trackOperation`    | Emit operation events (start / end / metric)                              | Accepts metadata including `durationMs` for ingestion    |
| `PerformanceMonitor`                         | Stores rolling latency + error metrics; computes aggregates & percentiles | Only authoritative store for latency & error rates       |
| `PerformanceMonitor.recordDurationFromEvent` | Ingests duration from event metadata                                      | Called during `trackOperation` when `durationMs` present |
| `PerformanceMonitor.getDetailedMetrics`      | Per-operation deep dive (avg, p95, p99, errors, guidance)                 | Used by profiler shim & APIs                             |
| `PerformanceMonitor.getGlobalReport`         | System-level performance & recommendations                                | Consumed by APIs / dashboards                            |
| `profiler.ts` (shim)                         | Backwards compatibility only                                              | Delegates to canonical services; stores no metrics       |
| Prometheus Exposition (metrics API)          | Read-only text exposition of derived metrics                              | Builds lines from canonical stores & event history       |

## Event Flow

1. Caller executes work and measures (or frameworks auto-measure) operation latency.
2. Caller invokes `unifiedMonitoringService.trackOperation(component, operationType, status, { durationMs, ... })`.
3. `UnifiedMonitoringService` validates metadata; if `durationMs` is a valid number it calls `performanceMonitor.recordDurationFromEvent(operationType, durationMs)`.
4. `PerformanceMonitor` updates rolling latency & counts; exceeds max sample size by evicting oldest.
5. Aggregations (avg, p95, p99, error rate) available through detailed or global report methods.
6. Prometheus endpoint ( `/api/v1/metrics/prometheus` ) derives counters/gauges directly from:
   - `PerformanceMonitor` detailed metrics (latency percentiles, averages)
   - `unifiedMonitoringService.eventHistory` for operation counts & error codes

No additional mutable state or caches are introduced (ensures single source of truth).

## Percentile Computation

`PerformanceMonitor` maintains sorted copies per request when computing:

- p95 / p99 via index = ceil(p/100 \* N) - 1
- Guarded for empty arrays (returns 0)

## Recommendations Logic (Examples)

Operation-level:

- High p95 > 3000ms: investigate batching / external dependency latency
- High p99 > 5000ms: add timeouts / circuit breakers
- Average latency > 2000ms: evaluate caching or algorithmic optimization
- Error rate > 10%: improve retries / validation

Global-level:

- System-wide high p95 > 3000ms: profile hotspots
- Overall error rate > 10%: audit failing operations

## Diagnostic Logging

A new `diagnostic_log` event type (non-critical) can be emitted on ingestion failures or deprecation notices, enabling visibility without polluting performance metrics.

## Deprecated: Legacy PerformanceProfiler

The old profiler kept its own arrays of metrics – now removed.
`profiler.ts` provides:

- `startOperation` / `endOperation` wrappers (stateless)
- `checkPerformance` / `generateReport` delegating to `PerformanceMonitor`
- Emits one-time deprecation notice via `trackOperation`

Never reintroduce local arrays or timers inside the profiler shim.

## Migration Guidance

| Legacy Pattern                                                     | Replacement                                                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `new PerformanceProfiler()`                                        | Inject / use `performanceMonitor` + `unifiedMonitoringService`                                                    |
| `profiler.startOperation()` + `profiler.endOperation()` for timing | Measure duration externally, then single `trackOperation(... { durationMs })` call (or keep wrappers temporarily) |
| `profiler.generateReport()`                                        | `performanceMonitor.getGlobalReport()`                                                                            |
| Manual percentile calculations                                     | Use canonical report methods                                                                                      |

## Adding New Metrics

1. Extend event metadata contract (avoid new parallel stores)
2. Ingest through `UnifiedMonitoringService` (single path)
3. Store only minimal required arrays/counters in `PerformanceMonitor`
4. Expose via typed accessor methods (avoid leaking internals)
5. For Prometheus exposition, only derive new metrics from existing canonical data structures (`PerformanceMonitor` state or monitoring `eventHistory`). Never create a side-car accumulator.

## Quality & Integrity Guardrails

- No other module may maintain a separate performance metrics cache.
- All time must use `createUnifiedTimestamp` or `now()` (no raw `Date.now()`).
- Any new performance feature must extend `PerformanceMonitor` rather than cloning logic.
- Prometheus exposition must remain pure/derivational: no mutation of underlying stores during render.
- Error classification must be label-stable; avoid introducing high-cardinality labels (e.g. raw messages).

## Future Enhancements (Backlog)

Implemented in v4.0.7 (removed from backlog):

- Per-operation latency gauges (avg / p95 / p99) exported as `oneagent_operation_latency_*_ms`
- Parallelized retrieval of detailed latency metrics to keep exposition latency low
- Error counter metric `oneagent_operation_errors_total` with `component`, `operation`, `errorCode` labels (sliding window)

Planned / Open:

- Histogram binning (true HDR-style or configurable buckets) for high-fidelity percentile estimation
- Adaptive sampling (down-sample extremely frequent operations while preserving tail accuracy)
- Structured error taxonomy normalization (map free-form error messages → stable codes)
- Error budget & SLO tracking (burn rate alerts emitted as monitoring events)
- Correlation IDs linking operations to memory records / agent sessions for root-cause tracing
- Metric cardinality guardrails (automatic suppression / aggregation if label explosion detected)
- Optional cached snapshot layer with TTL to protect against heavy scrape fan-out (must NOT become a second source of truth)
- Latency trend differentials (delta vs previous window for proactive regression detection)
- Unified anomaly detection events (statistical detection of latency or error spikes)
- Partition-aware performance (segmented metrics by session or tenant within strict cardinality limits)

Deferred / Under Consideration:

- Export of p50 (already derivable) — omitted to minimize metric count until needed
- Synthetic operation groups (aggregate across related low-volume operations) — needs taxonomy spec first

Rejected (violates single-source or cardinality constraints):

- Storing a separate long-term error counter map outside eventHistory (would duplicate state)
- Embedding raw stack traces or full error messages in labels (explodes cardinality & leaks sensitive info)

All future enhancements must continue zero-parallel-store principle.

---

## Prometheus Metrics (Current v4.0.8)

| Metric Name                                | Type      | Labels                          | Description                                                                        | Source                                    |
| ------------------------------------------ | --------- | ------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- |
| `oneagent_operation_total`                 | counter   | (none)                          | Total operations observed in window (configurable windowMs query param)            | Derived from eventHistory filtered window |
| `oneagent_operation_component_total`       | counter   | component, operation, status    | Success/error counts per operation                                                 | eventHistory aggregation                  |
| `oneagent_operation_error_rate`            | gauge     | component, operation            | Error rate (error/total) per operation                                             | eventHistory aggregation                  |
| `oneagent_operation_latency_avg_ms`        | gauge     | operation                       | Rolling average latency (ms)                                                       | PerformanceMonitor detailed metrics       |
| `oneagent_operation_latency_p95_ms`        | gauge     | operation                       | 95th percentile latency (ms)                                                       | PerformanceMonitor detailed metrics       |
| `oneagent_operation_latency_p99_ms`        | gauge     | operation                       | 99th percentile latency (ms)                                                       | PerformanceMonitor detailed metrics       |
| `oneagent_operation_errors_total`          | counter   | component, operation, errorCode | Error event occurrences (sliding window, coded)                                    | eventHistory recent (last 500 events)     |
| `oneagent_metrics_latency_average_ms`      | gauge     | (none)                          | Average latency across recent generic metric logs                                  | metricsService stats                      |
| `oneagent_metrics_latency_max_ms`          | gauge     | (none)                          | Max latency across recent logs                                                     | metricsService stats                      |
| `oneagent_metrics_latency_p50_ms`          | gauge     | (none)                          | Median latency across recent logs                                                  | metricsService stats                      |
| `oneagent_metrics_latency_p95_ms`          | gauge     | (none)                          | 95th percentile across recent logs                                                 | metricsService stats                      |
| `oneagent_metrics_latency_p99_ms`          | gauge     | (none)                          | 99th percentile across recent logs                                                 | metricsService stats                      |
| `oneagent_memory_search_latency_ms`        | histogram | le                              | Histogram (recent memory search latencies)                                         | Derived from recent logs sample           |
| `oneagent_build_info`                      | gauge     | version                         | Build/version marker (always 1)                                                    | package.json                              |
| `oneagent_metrics_recent_total`            | gauge     | (none)                          | Number of recent metric logs retained                                              | metricsService stats                      |
| `oneagent_task_delegation_status_total`    | gauge     | status                          | Current number of delegation tasks per status (queued/dispatched/failed/completed) | Derived from in-memory queue              |
| `oneagent_task_delegation_backoff_pending` | gauge     | (none)                          | Number of queued tasks currently waiting for backoff eligibility                   | Derived from in-memory queue              |

### Error Counter Semantics

- Window: Derived from the last N monitoring events (currently N=500). This is a sliding in-memory view, not a monotonic lifetime counter.
- Source Fields: `errorCode` label populated from `event.data.errorCode` if present; fallback to sanitized `event.data.error` value; fallback to `generic`.
- Sanitization: Lowercased, non-alphanumeric characters replaced with `_` to control cardinality.
- Cardinality Control: Upstream code should normalize recurrent errors into stable `errorCode` values. Free-form messages are discouraged.
- Reset Behavior: Process restart or eventHistory truncation (FIFO eviction) naturally drops older errors; external scrapers must treat counter as _reset-prone_ due to sliding derivation.

### Latency Gauge Semantics

- Values sourced per operation via `PerformanceMonitor.getDetailedMetrics(op)` (avgLatency, p95, p99) in parallel to minimize exposition latency.
- Gauges reflect the current rolling window in `PerformanceMonitor` (implementation-specific sample size + eviction policy).
- If no data yet recorded for an operation, that operation simply omits gauges (no zero line emitted to avoid false signal).

### Design Principles (Prometheus Layer)

1. Derivational Only: No mutation or incremental counters maintained solely for Prometheus.
2. Parallelized Fetch: Detailed metrics collected with `Promise.all` to ensure O(n) concurrency instead of sequential latency stacking.
3. Bounded Cardinality: Label sets fixed (component, operation, status, errorCode). New labels require architecture review.
4. Ephemeral Error Window: Chosen intentionally to avoid duplicate canonical store; long-term retention belongs in an external TSDB.
5. Fail-Open Rendering: Missing metrics for an operation do not fail the whole exposition.

### Adding a New Operation Metric (Example Workflow)

1. Begin emitting `trackOperation(component, operation, status, { durationMs, customMeta })`.
2. Validate that `operation` is added to the canonical `COMM_OPERATION` enumeration (prevents typos & parallel naming).
3. Confirm latency gauges appear once operations occur with `durationMs`.
4. (Optional) Introduce structured `errorCode` values where errors can occur.
5. Update documentation (this file) if a new semantic metric type is introduced.

---

## Known Limitations

- Sliding window error counters cannot provide true rate over long durations; external Prometheus `rate()` functions must be used with understanding of resets.
- Lack of native histograms for every operation may reduce tail latency fidelity; planned histogram binning will address this.
- Missing persistent metric store by design; long-term analytics expected to be handled by external observability stack.

---

## Operational Playbook Snippets

Common alert queries (illustrative):

```
# High error rate (instantaneous >10%)
oneagent_operation_error_rate{operation="sendAgentMessage"} > 0.10

# Latency SLO breach (p95 > 3s)
oneagent_operation_latency_p95_ms{operation="generateCrossAgentInsights"} > 3000

# Specific error code spike (validated input errors)
increase(oneagent_operation_errors_total{errorCode="validation"}[5m]) > 25
```

All alerting rules must account for sliding window resets and potential cold starts.

---

Canonical architecture enforced: zero parallel performance systems permitted.

---

## Validation & Test Coverage

The canonical performance pipeline is now exercised by automated Jest tests to prevent silent regressions and re‑introduction of parallel stores:

| Test File                                                      | Purpose                                                                                            | Key Assertions                                                                                        |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `tests/monitoring/operation-metrics-summary.test.ts`           | Verifies aggregation path from `trackOperation` → `PerformanceMonitor.summarizeOperationMetrics()` | Component presence, per‑operation totals, success/error counts, non‑zero errorRate for mixed outcomes |
| (Planned) `tests/monitoring/performance-global-report.test.ts` | Global report integrity & recommendation thresholds                                                | p95 / p99 calculations, recommendation triggers                                                       |
| (Planned) `tests/monitoring/prometheus-exposition.test.ts`     | Prometheus render derivational purity                                                              | No mutation during exposition, gauges align with detailed metrics                                     |

Test Design Principles:

1. No direct time measurement side-channels (all durations injected via `durationMs`).
2. No usage of `Date.now()` in tests for latency logic — synthetic durations provided explicitly.
3. No process termination (`process.exit`) inside tests (guarded in `jest.setup.ts`).
4. Assertions focus on structural correctness and invariants, not absolute latency values.
5. Failure messages must point to a specific stage (ingestion, aggregation, exposition) for rapid triage.

Gap Analysis (Open Backlog):

- Prometheus exposition fixture snapshot tests (ensure metric naming stability).
- Error code cardinality guard test (inject many distinct codes, verify sanitization & bounded label set).
- Stress test injecting > max sample size to confirm rolling eviction behavior does not skew percentiles catastrophically (statistical drift < acceptable threshold to be defined).

## Recent Changes (v4.0.8+ Test Harness Hardening)

| Change                                                                                                | Rationale                                                                        | Impact                                                  |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Removed legacy script-style tests using `process.exit`                                                | Jest could not attribute failures; caused post-run logging noise                 | Deterministic CI, clearer failure surfaces              |
| Added exit & late-log guards in `coreagent/tests/jest.setup.ts`                                       | Prevent premature termination & noisy "Cannot log after tests are done" warnings | Higher signal-to-noise in monitoring test output        |
| Introduced canonical operation metrics summary test                                                   | Ensures aggregation correctness after duration ingestion refactor                | Early detection of regression in ingestion path         |
| Eliminated deprecated `execute_latency` operation metric (duration now via `durationMs` on `execute`) | Single ingestion path, avoids metric drift                                       | Simplified Prometheus surface; smaller metric footprint |

Planned Hardening Enhancements:

1. Add snapshot test ensuring stable ordering & formatting for Prometheus exposition (non-semantic whitespace ignored).
2. Add fuzz test injecting randomized `durationMs` distributions to validate percentile stability (monotonic increase with added high-tail samples).
3. Introduce mutation test: intentionally skip a call to `recordDurationFromEvent` to verify test detects missing latency ingestion.

## Operational Quality Gates

Before merging any change affecting performance metrics:

1. Run `npm run verify` (type + lint) — must pass.
2. Run monitoring Jest subset (tagged / filename pattern) — must pass all aggregation invariants.
3. If Prometheus layer modified, manually curl `/api/v1/metrics/prometheus` locally and confirm no duplicate lines / unexpected empty gauges.
4. Confirm `PerformanceMonitor` public API surface unchanged unless version bump documented.
5. Update this document for any new semantic metric category (keep derivational principle explicit).

## Anti-Regression Watch List

| Risk                                                    | Detection Strategy                                                         | Mitigation                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| Silent reintroduction of parallel latency store         | Lint / code search for `new PerformanceMonitor()` outside canonical module | Review PR; enforce factory / singleton pattern    |
| Overgrowth of errorCode label cardinality               | Exposition test counting distinct `errorCode` in window                    | Add mapping / collapse to generic codes           |
| Blocking percentile computation under high sample churn | Performance test with synthetic high-frequency ingestion                   | Introduce reservoir sampling or adaptive thinning |
| Exposition latency spike (sequential metric fetching)   | Timing test around metrics render path                                     | Maintain `Promise.all` parallel retrieval         |

---

## Task Delegation & Proactive Orchestration Metrics (Epic 7)

The proactive anomaly → triage → deep analysis → task delegation pipeline introduces a bounded set of new `operation` names under the `TaskDelegation` component. These reuse `unifiedMonitoringService.trackOperation` and DO NOT add new metric stores.

### Operations

| Component        | Operation            | Status Values          | Description                                                                   | Notes                                              |
| ---------------- | -------------------- | ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| `TaskDelegation` | `queue`              | success / error        | Task inserted after harvest                                                   | Dedup signature prevents flooding                  |
| `TaskDelegation` | `queue_trim`         | success                | Oldest task evicted (queue > MAX)                                             | MAX = 100                                          |
| `TaskDelegation` | `dispatch_loop`      | success / error        | Loop scheduling tick (engine start or reschedule)                             | Includes `intervalMs` metadata                     |
| `TaskDelegation` | `dispatch_cycle`     | success / error        | Single cycle wrapper (unexpected exceptions)                                  | Future: may carry `durationMs`                     |
| `TaskDelegation` | `dispatch_mark`      | success / error (rare) | State transition queued → dispatched                                          | Idempotent                                         |
| `TaskDelegation` | `dispatch`           | success / error        | Logical dispatch attempt (pre‑execution)                                      | Will expand with remediation results               |
| `TaskDelegation` | `dispatch_latency`   | success                | Measured latency for a dispatch attempt                                       | Delta of canonical timestamps                      |
| `TaskDelegation` | `execute`            | success / error        | Remediation execution result (placeholder phase)                              | Success => task completed                          |
| `TaskDelegation` | `execute`            | success / error        | Remediation execution result and latency (use `durationMs` on execute events) | Latency now exported via PerformanceMonitor gauges |
| `TaskDelegation` | `restore`            | success / error        | Queue state restored from canonical memory                                    | Audit-based; no parallel store                     |
| `TaskDelegation` | `retry`              | success                | Failed task re-queued for another attempt                                     | attempts / max metadata                            |
| `TaskDelegation` | `retry_exhausted`    | error                  | Task reached maxAttempts without success                                      | Emits final errorCode                              |
| `TaskDelegation` | `retry_backoff`      | success                | Backoff delay scheduled for next attempt                                      | delayMs, attempt metadata                          |
| `TaskDelegation` | `retry_backoff_skip` | success                | Dispatch cycle skipped tasks still in backoff                                 | skipped count                                      |

### Configuration Environment Variables

| Variable                             | Default | Purpose                                                 |
| ------------------------------------ | ------- | ------------------------------------------------------- |
| `ONEAGENT_PROACTIVE_OBSERVER`        | `0`     | Enable snapshot → triage → deep orchestrator            |
| `ONEAGENT_PROACTIVE_AUTO_DELEGATE`   | `0`     | Auto-harvest deep analysis recommendedActions to queue  |
| `ONEAGENT_PROACTIVE_INTERVAL_MS`     | `45000` | Base interval between observation cycles                |
| `ONEAGENT_TASK_DISPATCH_INTERVAL_MS` | `10000` | Base interval for task dispatch loop (jitter +0–2000ms) |
| `ONEAGENT_TASK_RETRY_BASE_DELAY_MS`  | `2000`  | Base delay (ms) for first retry backoff                 |
| `ONEAGENT_TASK_RETRY_MAX_DELAY_MS`   | `60000` | Maximum capped backoff delay (ms)                       |

### Principles

1. Bounded memory (queue cap) & dedup keep footprint deterministic.
2. Single source of truth: Only in-memory queue; persistence uses canonical memory writes for auditing (no alternate store).
3. Extensible: Remediation execution layer (Epic 8) will extend `dispatch` semantics without altering existing metrics contract.
4. Observability-first: Each transition surfaces a semantic event for downstream analysis and alerting.

### Future Extensions (Planned)

- Add structured error codes for dispatch failures (`no_target_agent`, `execution_error`). (Foundational support added: `markDispatchFailure` with errorCode emission; taxonomy doc update pending.)
- Introduce remediation latency percentile gauges once execution layer adds meaningful durations.
- Correlate tasks to deep analysis snapshot via `snapshotHash` in metrics dashboards.
- Snapshot persistence: Lightweight snapshots (`TaskDelegationSnapshot`) emitted opportunistically after status transitions (throttled 15s min interval; no separate metric; derives from memory audit trail).

All additions comply with zero parallel system constraints.

### Remediation Error Taxonomy (v4.0.8 Incremental)

Groundwork error codes introduced for the remediation / execution simulation layer:

| Code                         | Meaning                                                   | Emission Path                                     | Notes                              |
| ---------------------------- | --------------------------------------------------------- | ------------------------------------------------- | ---------------------------------- |
| `remediation_failed`         | Execution ran but reported business failure               | Pattern match on monitoring event message         | Will become structured field later |
| `remediation_task_not_found` | Task disappeared (not in queue) when execution attempted  | Pattern match (`task_not_found` / `task missing`) | Indicates race or external removal |
| `remediation_timeout`        | (Reserved) Execution exceeded future max execution window | Pattern match (`remediation timeout`)             | Adapter does not emit yet          |

Implementation detail: Currently classified through regex mapping in `errorTaxonomy.ts`. When remediation layer formalizes structured error emissions, direct `errorCode` assignment will supersede pattern inference without changing public metric labels.

Removal: The standalone `execute_latency` operation has been removed in favor of `durationMs` on `execute` events; latency is exported via `PerformanceMonitor` gauges (see CHANGELOG v4.0.8).
