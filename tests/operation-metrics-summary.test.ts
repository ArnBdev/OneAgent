/*
 * operation-metrics-summary.test.ts
 * Validates operation_metric emission + summarizeOperationMetrics aggregation without parallel state.
 */
import { unifiedAgentCommunicationService } from '../coreagent/utils/UnifiedAgentCommunicationService';
import { unifiedMonitoringService } from '../coreagent/monitoring/UnifiedMonitoringService';

describe('operation metrics summary (canonical)', () => {
  it('captures success & error operations and aggregates summary', async () => {
    const userContext = {
      user: { id: 'test-user', name: 'Test User' },
      sessionId: 'op-metrics-test',
      conversationHistory: [],
    };
    try {
      await unifiedAgentCommunicationService.discoverAgents({ capabilities: [] });
    } catch {
      /* ignore */
    }

    try {
      await unifiedAgentCommunicationService.leaveSession('non-existent', userContext.sessionId);
    } catch {
      /* expected */
    }

    const summary = unifiedMonitoringService.summarizeOperationMetrics();
    expect(summary.totalOperations).toBeGreaterThan(0);
    const comms = summary.components['communication-service'];
    expect(comms).toBeTruthy();
    expect(comms.totals.error).toBeGreaterThan(0);
    expect(comms.totals.success).toBeGreaterThan(0);
  });
});
