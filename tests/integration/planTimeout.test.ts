process.env.ONEAGENT_FAST_TEST_MODE = '1';
process.env.ONEAGENT_SIMULATE_AGENT_EXECUTION = '0';
process.env.ONEAGENT_TASK_EXECUTION_TIMEOUT_MS = '50';

import { taskDelegationService } from '../../coreagent/services/TaskDelegationService';
import { HybridAgentOrchestrator } from '../../coreagent/agents/orchestration/HybridAgentOrchestrator';
import { proactiveObserverService } from '../../coreagent/services/ProactiveTriageOrchestrator';
import { unifiedAgentCommunicationService } from '../../coreagent/utils/UnifiedAgentCommunicationService';

describe('Plan execution timeout path', () => {
  beforeAll(() => {
    process.env.ONEAGENT_PROACTIVE_DEEP_ANALYSIS = '1';
    process.env.ONEAGENT_PROACTIVE_AUTO_DELEGATE = '1';
  });

  it('marks tasks failed when no completion message arrives within timeout', async () => {
    // Force deep analysis with deterministic actions
    // @ts-expect-error test injection
    proactiveObserverService.generateText = async () =>
      JSON.stringify({
        summary: 'Timeout path analysis',
        actions: ['Perform unreachable action for timeout test'],
        findings: ['Synthetic trigger'],
      });
    await proactiveObserverService.runObservationCycle();
    const queued = taskDelegationService.getQueuedTasks();
    expect(queued.length).toBeGreaterThan(0);

    const orchestrator = HybridAgentOrchestrator.getInstance();
    const agentId = await unifiedAgentCommunicationService.registerAgent({
      name: 'TimeoutTestAgent',
      capabilities: ['general'],
      metadata: { test: true },
    });
    const sessionId = await unifiedAgentCommunicationService.createSession({
      name: 'timeout-test',
      participants: ['orchestrator', agentId],
      mode: 'collaborative',
      topic: 'Timeout Test',
      nlacs: false,
    });
    const result = await orchestrator.executePlan({ sessionId, limit: 1 });
    expect(result.dispatched.length).toBe(1);
    // Since no simulation and no agent reply, it should show as failed
    expect(result.failed.length).toBe(1);
    expect(result.completed.length).toBe(0);
  }, 8000);
});
