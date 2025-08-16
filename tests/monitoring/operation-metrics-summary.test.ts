import { UnifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';
import { createUnifiedTimestamp } from '../../coreagent/utils/UnifiedBackboneService';

/**
 * Canonical Operation Metrics Summary Test
 * Verifies that trackOperation() events are aggregated correctly by summarizeOperationMetrics()
 * without introducing any parallel counter state.
 */
(async () => {
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

  if (!summary.components['TestComponentA']) {
    console.error('❌ Missing component A in summary');
    process.exit(1);
  }
  if (!summary.components['TestComponentB']) {
    console.error('❌ Missing component B in summary');
    process.exit(1);
  }

  const aOps = summary.components['TestComponentA'].operations;
  if (!aOps['discoverAgents'] || aOps['discoverAgents'].total !== 2) {
    console.error(
      '❌ discoverAgents aggregation incorrect for component A',
      aOps['discoverAgents'],
    );
    process.exit(1);
  }
  if (!aOps['leaveSession'] || aOps['leaveSession'].error !== 1) {
    console.error('❌ leaveSession aggregation incorrect for component A', aOps['leaveSession']);
    process.exit(1);
  }

  const bOps = summary.components['TestComponentB'].operations;
  if (!bOps['synchronize'] || bOps['synchronize'].success !== 2) {
    console.error('❌ synchronize aggregation incorrect for component B', bOps['synchronize']);
    process.exit(1);
  }

  // Basic error rate sanity check (component A should have >0 errorRate)
  if (summary.components['TestComponentA'].totals.errorRate <= 0) {
    console.error('❌ Expected non-zero errorRate for component A');
    process.exit(1);
  }

  console.log('✅ Operation metrics summary test passed');
})();
