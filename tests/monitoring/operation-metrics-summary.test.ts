import { UnifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';
import { createUnifiedTimestamp } from '../../coreagent/utils/UnifiedBackboneService';

/**
 * Canonical Operation Metrics Summary Test
 * Verifies that trackOperation() events are aggregated correctly by summarizeOperationMetrics()
 * without introducing any parallel counter state.
 */
describe('Operation metrics summary', () => {
  it('aggregates operations correctly across components', () => {
    const monitoring = new UnifiedMonitoringService();

    // Emit mixed success/error events across two components
    monitoring.trackOperation('TestComponentA', 'discoverAgents', 'success', {
      ts: createUnifiedTimestamp().iso,
    });
    monitoring.trackOperation('TestComponentA', 'discoverAgents', 'error', {
      ts: createUnifiedTimestamp().iso,
    });
    monitoring.trackOperation('TestComponentA', 'leaveSession', 'error', { forced: true });
    monitoring.trackOperation('TestComponentB', 'synchronize', 'success', {});
    monitoring.trackOperation('TestComponentB', 'synchronize', 'success', {});

    // Aggregate (no window filter)
    const summary = monitoring.summarizeOperationMetrics();
    expect(summary.components['TestComponentA']).toBeTruthy();
    expect(summary.components['TestComponentB']).toBeTruthy();
    const aOps = summary.components['TestComponentA'].operations;
    expect(aOps['discoverAgents'].total).toBe(2);
    expect(aOps['leaveSession'].error).toBe(1);
    const bOps = summary.components['TestComponentB'].operations;
    expect(bOps['synchronize'].success).toBe(2);
    expect(summary.components['TestComponentA'].totals.errorRate).toBeGreaterThan(0);
  });
});
