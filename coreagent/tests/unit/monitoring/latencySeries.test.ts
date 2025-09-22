import { buildLatencySeriesFromEvents, buildLatencySeriesFromRecent } from '../../../monitoring/LatencySeries';
import { createUnifiedTimestamp } from '../../../utils/UnifiedBackboneService';

// Helper to fabricate events
function makeEvent(offsetMs: number, duration: number, op = 'alpha') {
  const ts = new Date(Date.now() - offsetMs).toISOString();
  return {
    type: 'operation_metric',
    timestamp: ts,
    data: { operation: op, durationMs: duration },
  } as const;
}

describe('LatencySeries', () => {
  const WINDOW = 60_000; // 1 minute
  const BUCKET = 10_000; // 10s buckets

  test('empty events yields zeroed buckets', () => {
    const series = buildLatencySeriesFromEvents([], WINDOW, BUCKET);
    const expectedBuckets = Math.ceil(WINDOW / BUCKET);
    expect(series.points).toHaveLength(expectedBuckets);
    expect(series.points.every(p => p.count === 0 && p.avg === 0)).toBe(true);
  });

  test('single event falls into correct bucket', () => {
    const ev = makeEvent(5_000, 123);
    const series = buildLatencySeriesFromEvents([ev], WINDOW, BUCKET);
    const nonEmpty = series.points.filter(p => p.count > 0);
    expect(nonEmpty).toHaveLength(1);
    expect(nonEmpty[0].avg).toBe(123);
    expect(nonEmpty[0].p95).toBe(123);
    expect(nonEmpty[0].p99).toBe(123);
  });

  test('multiple events compute percentiles', () => {
    const events = [50, 60, 70, 80, 90].map((d, i) => makeEvent(5_000 + i * 100, d));
    const series = buildLatencySeriesFromEvents(events, WINDOW, BUCKET);
    const bucket = series.points.find(p => p.count === 5)!;
    expect(bucket.avg).toBeGreaterThan(69);
    expect(bucket.p95).toBeGreaterThanOrEqual(90);
    expect(bucket.p99).toBeGreaterThanOrEqual(90);
  });

  test('operation filter isolates only matching events', () => {
    const events = [makeEvent(1_000, 40, 'alpha'), makeEvent(2_000, 60, 'beta')];
    const seriesAlpha = buildLatencySeriesFromEvents(events, WINDOW, BUCKET, 'alpha');
    const bucketAlpha = seriesAlpha.points.find(p => p.count > 0)!;
    expect(bucketAlpha.count).toBe(1);
    expect(bucketAlpha.avg).toBe(40);
    const seriesBeta = buildLatencySeriesFromEvents(events, WINDOW, BUCKET, 'beta');
    const bucketBeta = seriesBeta.points.find(p => p.count > 0)!;
    expect(bucketBeta.count).toBe(1);
    expect(bucketBeta.avg).toBe(60);
  });

  test('ignores malformed / out-of-range events gracefully', () => {
    const good = makeEvent(1_000, 50);
    const badTs = { type: 'operation_metric', timestamp: 'not-a-date', data: { operation: 'alpha', durationMs: 10 } };
    const negativeDur = { type: 'operation_metric', timestamp: createUnifiedTimestamp().iso, data: { operation: 'alpha', durationMs: -5 } };
    const farOld = makeEvent(999_999, 30);
    const series = buildLatencySeriesFromEvents([
      good,
      badTs as unknown as { type: string; timestamp: string; data: { operation: string; durationMs: number } },
      negativeDur as unknown as { type: string; timestamp: string; data: { operation: string; durationMs: number } },
      farOld,
    ], WINDOW, BUCKET);
    const bucket = series.points.find(p => p.count > 0)!;
    expect(bucket.count).toBe(1);
    expect(bucket.avg).toBe(50);
  });

  test('buildLatencySeriesFromRecent executes without throwing (smoke)', () => {
    const s = buildLatencySeriesFromRecent(30_000, 5_000);
    expect(s.windowMs).toBe(30_000);
    expect(s.bucketMs).toBe(5_000);
  });
});
