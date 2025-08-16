/*
 * operation-metrics-summary.test.ts
 * Validates operation_metric emission + summarizeOperationMetrics aggregation without parallel state.
 */
import { unifiedAgentCommunicationService } from '../coreagent/utils/UnifiedAgentCommunicationService';
import { unifiedMonitoringService } from '../coreagent/monitoring/UnifiedMonitoringService';

async function run() {
  // Trigger a couple of operations (one success, one expected error)
  interface MinimalContext {
    user: { id: string; name: string };
    sessionId: string;
    conversationHistory: unknown[];
  }
  const userContext: MinimalContext = {
    user: { id: 'test-user', name: 'Test User' },
    sessionId: 'op-metrics-test',
    conversationHistory: []
  };

  try {
    await unifiedAgentCommunicationService.discoverAgents({ capabilities: [] });
  } catch { /* ignore */ }

  try {
    // Intentionally cause error (leaving non-existent session)
    await unifiedAgentCommunicationService.leaveSession('non-existent', userContext.sessionId);
  } catch { /* expected */ }

  const recent = unifiedMonitoringService.getRecentEvents(20).filter(e => e.type === 'operation_metric');
  const summary = unifiedMonitoringService.summarizeOperationMetrics();

  console.log('--- Operation Metric Events (last 20) ---');
  for (const e of recent) {
    console.log(`${e.timestamp} ${e.component} ${e.message}`);
  }

  console.log('\n--- Aggregated Summary ---');
  console.log(JSON.stringify(summary, null, 2));

  // Basic invariants
  if (!summary.totalOperations || summary.totalOperations < 1) {
    throw new Error('No operation metrics captured');
  }
  const comms = summary.components['communication-service'];
  if (!comms) {
    throw new Error('communication-service component missing in summary');
  }
  const hasError = comms.totals.error > 0;
  const hasSuccess = comms.totals.success > 0;
  if (!hasError || !hasSuccess) {
    throw new Error('Expected both success and error operations for communication-service');
  }
  console.log('\n✅ Operation metrics summary test passed');
}

run().catch(err => {
  console.error('❌ operation-metrics-summary test failed', err);
  process.exit(1);
});
