/* eslint-disable */
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import { unifiedMonitoringService, MonitoringEvent } from './UnifiedMonitoringService';

// Minimal shape for monitoring events we care about
export interface OperationMetricEventLike {
  type: string;
  timestamp: string; // ISO
  data?: {
    operation?: string;
    op?: string;
    durationMs?: number;
    duration?: number;
  } & Record<string, unknown>;
  [k: string]: unknown;
}

export interface LatencyPoint {
  tISO: string;
  tUnix: number;
  count: number;
  avg: number;
  p95: number;
  p99: number;
}

export interface LatencySeriesResult {
  windowMs: number;
  bucketMs: number;
  operation: string | null;
  points: LatencyPoint[];
}

function percentile(sortedAsc: number[], p: number): number {
  if (!sortedAsc.length) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.ceil((p / 100) * sortedAsc.length) - 1);
  return sortedAsc[idx] ?? 0;
}

/**
 * Build a latency time series by bucketing operation_metric events over the given window/bucket size.
 * Do not call with unbounded events; prefer passing a capped slice (e.g., getRecentEvents(10_000)).
 */
export function buildLatencySeriesFromEvents(
  events: OperationMetricEventLike[],
  windowMs: number,
  bucketMs: number,
  operation?: string,
): LatencySeriesResult {
  const now = Date.now();
  const start = now - windowMs;
  const bucketCount = Math.ceil(windowMs / bucketMs);
  const buckets: Array<{ t: number; values: number[] }> = Array.from({ length: bucketCount }).map(
    (_, i) => ({ t: start + i * bucketMs, values: [] }),
  );

  for (const ev of events) {
    try {
      if (ev.type !== 'operation_metric') continue;
      const op = (ev.data?.operation as string) || (ev.data?.op as string) || 'unknown';
      if (operation && op !== operation) continue;
      const dur = (ev.data?.durationMs as number) ?? (ev.data?.duration as number);
      if (typeof dur !== 'number' || !isFinite(dur) || dur < 0) continue;
      const t = Date.parse(ev.timestamp);
      if (!isFinite(t) || t < start || t > now) continue;
      const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor((t - start) / bucketMs)));
      buckets[idx].values.push(dur);
    } catch {
      // ignore malformed events
    }
  }

  const points: LatencyPoint[] = buckets.map((b) => {
    if (!b.values.length) {
      return { tISO: new Date(b.t).toISOString(), tUnix: b.t, count: 0, avg: 0, p95: 0, p99: 0 };
    }
    const sorted = b.values.slice().sort((a, b) => a - b);
    const avg = sorted.reduce((a, v) => a + v, 0) / sorted.length;
    return {
      tISO: new Date(b.t).toISOString(),
      tUnix: b.t,
      count: sorted.length,
      avg: Math.round(avg * 100) / 100,
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
    };
  });

  return { windowMs, bucketMs, operation: operation || null, points };
}

// --- Internal helpers: safe adaptation from MonitoringEvent to OperationMetricEventLike ---

function isFiniteNonNegative(n: unknown): n is number {
  return typeof n === 'number' && isFinite(n) && n >= 0;
}

function adaptMonitoringEvent(ev: MonitoringEvent): OperationMetricEventLike | null {
  // Only consider operation_metric events within MonitoringEvent
  if (ev.type !== 'operation_metric') return null;
  const duration = (ev.data?.durationMs as unknown) ?? (ev.data?.duration as unknown);
  if (!isFiniteNonNegative(duration)) return null;
  const ts = Date.parse(ev.timestamp);
  if (!isFinite(ts)) return null;

  const opName =
    typeof ev.operation === 'string'
      ? ev.operation
      : ((ev.data?.operation as string) ?? (ev.data?.op as string) ?? 'unknown');

  // Preserve original ev.data fields while ensuring normalized keys exist
  const data = {
    ...(ev.data || {}),
    operation: opName,
    op: opName,
    durationMs: Number(duration),
  } as OperationMetricEventLike['data'];

  return {
    type: ev.type,
    timestamp: ev.timestamp,
    data,
    // carry over minimal additional fields to satisfy index signature
    component: ev.component,
    severity: ev.severity,
    message: ev.message,
    id: ev.id,
  } as OperationMetricEventLike;
}

/**
 * Convenience helper: fetch recent events from unifiedMonitoringService and build series.
 * Cap is 10k events to avoid heavy scans.
 */
export function buildLatencySeriesFromRecent(
  windowMs: number,
  bucketMs: number,
  operation?: string,
): LatencySeriesResult {
  const recentRaw = unifiedMonitoringService.getRecentEvents(10_000);
  const adapted: OperationMetricEventLike[] = recentRaw
    .map(adaptMonitoringEvent)
    .filter((e): e is OperationMetricEventLike => e !== null);
  return buildLatencySeriesFromEvents(adapted, windowMs, bucketMs, operation);
}

/**
 * Return the most recent point only (latest bucket), useful for WS streaming ticks.
 */
export function getLatestLatencyPoint(
  windowMs: number,
  bucketMs: number,
  operation?: string,
): LatencyPoint & { windowMs: number; bucketMs: number; operation: string | null; at: string } {
  const series = buildLatencySeriesFromRecent(windowMs, bucketMs, operation);
  const last = series.points[series.points.length - 1] || {
    tISO: createUnifiedTimestamp().iso,
    tUnix: Date.now(),
    count: 0,
    avg: 0,
    p95: 0,
    p99: 0,
  };
  return {
    ...last,
    windowMs: series.windowMs,
    bucketMs: series.bucketMs,
    operation: series.operation,
    at: createUnifiedTimestamp().iso,
  };
}
