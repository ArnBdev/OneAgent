# Canonical Operation Metrics

The unified monitoring system records operation-level events via `UnifiedMonitoringService.trackOperation()`.
Aggregation is performed on-demand with `UnifiedMonitoringService.summarizeOperationMetrics()` – no counters or gauges are stored, preventing parallel metric systems.

## Emission

```ts
unifiedMonitoringService.trackOperation(
  'communication-service', // component
  'discoverAgents', // operation
  'success', // 'success' | 'error'
  { durationMs: 12 },
);
```

## Aggregation

```ts
const summary = unifiedMonitoringService.summarizeOperationMetrics({
  window: 5 * 60 * 1000, // optional ms time window
  componentFilter: 'communication-service', // optional component filter
});
```

## Summary Shape

```ts
interface OperationMetricsSummary {
  generatedAt: string; // ISO timestamp
  totalOperations: number; // total filtered events
  components: Record<string, ComponentMetrics>;
}
interface ComponentMetrics {
  operations: Record<string, OperationBreakdown>;
  totals: OperationBreakdown; // aggregate across all operations in component
}
interface OperationBreakdown {
  success: number;
  error: number;
  total: number; // success + error
  errorRate: number; // error / total (0 when total = 0)
}
```

## Design Principles

- Single Source of Truth: derives from `eventHistory` entries of type `operation_metric`.
- No Parallel Stores: no counters, gauges, or external caches created.
- Lazy Aggregation: computed only when requested.
- Extensible Metadata: `trackOperation` accepts an arbitrary metadata object merged into the monitoring event.

## Filtering Logic

1. Pull all `eventHistory` entries where `type === 'operation_metric'`.
2. If `window` provided, include only events with `timestamp.unix >= now - window`.
3. If `componentFilter` provided, only include matching component.
4. Aggregate counts by component + operation + status.
5. Compute `errorRate` for each operation and component totals.

## Error Handling & Safety

- `errorRate` guarded against divide-by-zero.
- Status limited to `'success' | 'error'` ensuring predictable aggregation.
- Uses canonical timestamp via `createUnifiedTimestamp()` when generating summary.

## Example Output

```json
{
  "generatedAt": "2025-08-09T12:34:56.789Z",
  "totalOperations": 7,
  "components": {
    "communication-service": {
      "operations": {
        "discoverAgents": { "success": 3, "error": 0, "total": 3, "errorRate": 0 },
        "leaveSession": { "success": 1, "error": 1, "total": 2, "errorRate": 0.5 },
        "sendMessage": { "success": 1, "error": 1, "total": 2, "errorRate": 0.5 }
      },
      "totals": { "success": 5, "error": 2, "total": 7, "errorRate": 0.2857142857 }
    }
  }
}
```

## Migration Notes

The former temporary augmentation shim `monitoring-augmentation.d.ts` (increment/gauge placeholders) has been removed. Future metric types should extend `trackOperation` semantics or introduce new event `type` values, never parallel counter APIs.

## Next Enhancements (Non-Blocking)

- Optional percentile latency aggregation (requires adding latency to metadata consistently).
- Component health scoring derived from errorRate thresholds.
- Streaming summaries via MCP resource endpoint (on-demand only to avoid persistent counters).

---

Canonical monitoring preserved: aggregation without fragmentation.
