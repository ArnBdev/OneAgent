import { unifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';
import { ErrorCode } from '../../coreagent/monitoring/errorTaxonomy';

describe('UnifiedMonitoringService taxonomy integration', () => {
  it('emits operation_metric with taxonomyCode for error', () => {
    unifiedMonitoringService.trackOperation('TestComponent', 'test_op_tax', 'error', {
      error: 'Rate limit exceeded',
    });
    const events = unifiedMonitoringService
      .getRecentEvents(5)
      .filter((e) => e.type === 'operation_metric');
    const last = events[events.length - 1];
    expect(last.data.taxonomyCode).toBe(ErrorCode.RATE_LIMITED);
  });
});
