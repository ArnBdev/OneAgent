import { unifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';

/**
 * Stress test to ensure percentile calculations remain stable under eviction (rolling window behavior).
 * Inserts > maxSampleSize synthetic latencies with controlled tail and verifies p95/p99 monotonicity
 * as more high-latency samples are appended and oldest are evicted.
 */
describe('PerformanceMonitor percentile drift under eviction', () => {
  const op = 'sendAgentMessage';

  it('maintains non-decreasing p95/p99 when adding strictly higher tail samples (until window saturation)', async () => {
    // Phase 1: Seed base distribution (low latencies)
    for (let i = 0; i < 600; i++) {
      unifiedMonitoringService.trackOperation('drift-comp', op, 'success', {
        durationMs: 10 + (i % 5),
      });
    }
    const base = await unifiedMonitoringService.getDetailedOperationMetrics(op);
    // Phase 2: Add moderate latencies
    for (let i = 0; i < 300; i++) {
      unifiedMonitoringService.trackOperation('drift-comp', op, 'success', {
        durationMs: 100 + (i % 20),
      });
    }
    const mid = await unifiedMonitoringService.getDetailedOperationMetrics(op);
    // Phase 3: Add high tail latencies causing older low samples to evict
    for (let i = 0; i < 400; i++) {
      unifiedMonitoringService.trackOperation('drift-comp', op, 'success', {
        durationMs: 800 + (i % 100),
      });
    }
    const tail = await unifiedMonitoringService.getDetailedOperationMetrics(op);

    expect(mid.p95).toBeGreaterThanOrEqual(base.p95);
    expect(tail.p95).toBeGreaterThanOrEqual(mid.p95);
    expect(mid.p99).toBeGreaterThanOrEqual(base.p99);
    expect(tail.p99).toBeGreaterThanOrEqual(mid.p99);
    // Error rate should remain 0 throughout
    expect(base.errorRate).toBe(0);
    expect(mid.errorRate).toBe(0);
    expect(tail.errorRate).toBe(0);
  });
});
