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

## Event Flow

1. Caller executes work and measures (or frameworks auto-measure) operation latency.
2. Caller invokes `unifiedMonitoringService.trackOperation(component, operationType, status, { durationMs, ... })`.
3. `UnifiedMonitoringService` validates metadata; if `durationMs` is a valid number it calls `performanceMonitor.recordDurationFromEvent(operationType, durationMs)`.
4. `PerformanceMonitor` updates rolling latency & counts; exceeds max sample size by evicting oldest.
5. Aggregations (avg, p95, p99, error rate) available through detailed or global report methods.

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

## Quality & Integrity Guardrails

- No other module may maintain a separate performance metrics cache.
- All time must use `createUnifiedTimestamp` or `now()` (no raw `Date.now()`).
- Any new performance feature must extend `PerformanceMonitor` rather than cloning logic.

## Future Enhancements (Backlog)

- Histogram binning for more accurate percentile estimation under heavy load
- Adaptive sampling (reduce memory footprint for highly frequent operations)
- SLA breach alert integration (emit structured alert events)
- Correlation IDs linking operations to memory or agent sessions

---

Canonical architecture enforced: zero parallel performance systems permitted.
