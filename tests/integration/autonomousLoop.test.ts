// Enable fast test mode (ephemeral in-memory registries, skips heavy init)
process.env.ONEAGENT_FAST_TEST_MODE = '1';

import { proactiveObserverService } from '../../coreagent/services/ProactiveTriageOrchestrator';
import { taskDelegationService } from '../../coreagent/services/TaskDelegationService';
import { HybridAgentOrchestrator } from '../../coreagent/agents/orchestration/HybridAgentOrchestrator';
import { unifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';
import { unifiedAgentCommunicationService } from '../../coreagent/utils/UnifiedAgentCommunicationService';

/**
 * End-to-end autonomous loop smoke test (US 12.1/12.2 bridge):
 * 1. Force deep analysis with recommended actions (mock monitoring events to trigger anomaly)
 * 2. Observer harvests actions into delegated tasks
 * 3. Orchestrator executes plan and marks tasks completed
 */

describe('Autonomous Loop (Proactive -> Delegation -> Plan Execution)', () => {
  beforeAll(() => {
    process.env.ONEAGENT_PROACTIVE_DEEP_ANALYSIS = '1';
    process.env.ONEAGENT_PROACTIVE_AUTO_DELEGATE = '1';
  });

  beforeAll(async () => {
    // Dynamic import to avoid static require lint violations
    const memoryModule = await import('../../coreagent/memory/OneAgentMemory');
    const mem = memoryModule.OneAgentMemory.getInstance();
    // Monkeypatch memory persistence to avoid fetch to external backend in this isolated integration test
    const original = mem.addMemoryCanonical.bind(mem);
    (mem as any).addMemoryCanonical = async (
      content: string,
      metadata?: Record<string, unknown>,
      userId?: string,
    ) => {
      try {
        return await original(content, metadata, userId);
      } catch {
        return 'stub-memory-id';
      }
    };
  });

  it('produces tasks and executes them via orchestrator executePlan()', async () => {
    // Simulate error-heavy operations to bias anomaly
    for (let i = 0; i < 5; i++) {
      unifiedMonitoringService.trackOperation('SyntheticOp', 'test_cycle', 'error', {
        component: 'Synthetic',
      });
    }

    // Monkeypatch internal generateText to guarantee actionable deep analysis
    // @ts-expect-error accessing private for controlled test injection
    proactiveObserverService.generateText = async () =>
      JSON.stringify({
        summary: 'Synthetic deep analysis summary',
        actions: [
          'Refactor latency hot path in metrics pipeline',
          'Add documentation for proactive loop',
        ],
        findings: ['Elevated synthetic error rate'],
      });
    const { deep } = await proactiveObserverService.runObservationCycle();
    if (!deep || deep.recommendedActions.length === 0) {
      throw new Error('Expected deep analysis with recommended actions');
    }

    // Harvest already auto-triggered; ensure tasks present
    const queued = taskDelegationService.getQueuedTasks();
    expect(queued.length).toBeGreaterThan(0);

    const orchestrator = HybridAgentOrchestrator.getInstance();
    // Register a generic multi-skill test agent (fast test mode keeps it in-memory)
    const agentId = await unifiedAgentCommunicationService.registerAgent({
      name: 'AutoLoopTestAgent',
      capabilities: ['development', 'documentation', 'analysis', 'general'],
      metadata: { test: true },
    });
    const sessionId = await unifiedAgentCommunicationService.createSession({
      name: 'auto-loop-test',
      participants: ['orchestrator', agentId],
      mode: 'collaborative',
      topic: 'Autonomous Loop Test Session',
      nlacs: false,
    });
    const result = await orchestrator.executePlan({ sessionId, limit: 5 });
    expect(result.dispatched.length).toBeGreaterThan(0);
    expect(result.completed.length).toBe(result.dispatched.length);
  }, 15000);
});
