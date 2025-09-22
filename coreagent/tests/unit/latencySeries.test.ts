import {
  buildLatencySeriesFromEvents,
  OperationMetricEventLike,
} from '../../monitoring/LatencySeries';

function mkEvent(
  tISO: string,
  durationMs: number,
  operation = 'execute',
): OperationMetricEventLike {
  return {
    type: 'operation_metric',
    timestamp: tISO,
    data: { operation, durationMs },
  } as OperationMetricEventLike;
}

describe('LatencySeries bucketing', () => {
  it('buckets events into fixed intervals and computes stats', () => {
    const now = Date.now();
    const start = now - 60_000; // 1m window
    const bucketMs = 10_000; // 10s
    const windowMs = 60_000;

    const events: OperationMetricEventLike[] = [];
    // put 3 events around 15s, 1 event at 25s, 2 events at 55s
    const t1 = new Date(start + 15_000).toISOString();
    const t2 = new Date(start + 16_000).toISOString();
    const t3 = new Date(start + 17_000).toISOString();
    events.push(mkEvent(t1, 100));
    events.push(mkEvent(t2, 200));
    events.push(mkEvent(t3, 300));
    const t4 = new Date(start + 25_000).toISOString();
    events.push(mkEvent(t4, 400));
    const t5 = new Date(start + 55_000).toISOString();
    const t6 = new Date(start + 56_000).toISOString();
    events.push(mkEvent(t5, 500));
    events.push(mkEvent(t6, 600));

    // Also include some irrelevant events
    events.push({
      type: 'other',
      timestamp: new Date(start + 30_000).toISOString(),
    } as unknown as OperationMetricEventLike);
    events.push({
      type: 'operation_metric',
      timestamp: 'invalid',
      data: { durationMs: 50 },
    } as unknown as OperationMetricEventLike);

    const series = buildLatencySeriesFromEvents(events, windowMs, bucketMs);
    expect(series.points.length).toBe(Math.ceil(windowMs / bucketMs));
    // Find buckets with counts
    const counts = series.points.map((p) => p.count);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(6);

    // Check a specific bucket (15-20s) has 3 events and avg 200
    const idx15s = Math.floor(15_000 / bucketMs);
    const p15 = series.points[idx15s];
    expect(p15.count).toBe(3);
    expect(p15.avg).toBe(200);
    expect(p15.p95).toBeGreaterThanOrEqual(200);
    expect(p15.p99).toBeGreaterThanOrEqual(300);

    // Last bucket (~50-60s) should include 2 events
    const idx55 = Math.floor(55_000 / bucketMs);
    const p55 = series.points[idx55];
    expect(p55.count).toBe(2);
    expect(p55.avg).toBe(550);
  });

  it('filters by operation', () => {
    const now = Date.now();
    const start = now - 30_000;
    const events: OperationMetricEventLike[] = [
      mkEvent(new Date(start + 5_000).toISOString(), 100, 'a'),
      mkEvent(new Date(start + 6_000).toISOString(), 200, 'b'),
    ];
    const sA = buildLatencySeriesFromEvents(events, 30_000, 10_000, 'a');
    const totalA = sA.points.reduce((a, p) => a + p.count, 0);
    expect(totalA).toBe(1);
    const sB = buildLatencySeriesFromEvents(events, 30_000, 10_000, 'b');
    const totalB = sB.points.reduce((a, p) => a + p.count, 0);
    expect(totalB).toBe(1);
  });
});
