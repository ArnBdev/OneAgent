import { unifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';

/**
 * Global performance report integrity test
 * Validates: aggregation math, percentile ordering, recommendations triggering thresholds.
 */
describe('PerformanceMonitor global report', () => {
  beforeAll(() => {
    // Seed multiple operations with controlled distributions
    const fastOp = 'sendAgentMessage';
    const slowOp = 'generateCrossAgentInsights';

    [5, 7, 9, 6, 8].forEach((ms) =>
      unifiedMonitoringService.trackOperation('comp-fast', fastOp, 'success', { durationMs: ms }),
    );
    // Slow op includes some high latency values crossing recommendation thresholds
    [120, 95, 3100, 5200, 4800, 3050].forEach((ms, idx) => {
      const status = idx === 1 ? 'error' : 'success'; // introduce one error for errorRate >0
      unifiedMonitoringService.trackOperation('comp-slow', slowOp, status, { durationMs: ms });
    });
  });

  it('produces a coherent global report with monotonic percentile ordering', async () => {
    const report = await unifiedMonitoringService.getGlobalPerformanceReport();
    expect(report.totalOperations).toBeGreaterThanOrEqual(11);
    expect(report.p95Latency).toBeGreaterThanOrEqual(report.averageLatency);
    expect(report.p99Latency).toBeGreaterThanOrEqual(report.p95Latency);
    expect(report.operationBreakdown['sendAgentMessage']).toBeDefined();
    expect(report.operationBreakdown['generateCrossAgentInsights']).toBeDefined();
    // Ensure high latency recommendations appear
    const recText = report.recommendations.join(' ');
    expect(
      recText.includes('p95') || recText.toLowerCase().includes('system-wide high p95 latency'),
    ).toBe(true);
  });
});
