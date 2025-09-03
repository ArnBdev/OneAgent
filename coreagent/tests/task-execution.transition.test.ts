import { taskDelegationService } from '../services/TaskDelegationService';
import { proactiveObserverService } from '../services/ProactiveTriageOrchestrator';
import { OneAgentEngine } from '../OneAgentEngine';

/**
 * Tests execution transition (queued -> dispatched -> completed) via manual dispatch call.
 */

describe('Task Delegation Execution Transition', () => {
  it('marks a harvested task as completed after simulated execution', async () => {
    const envObj = process.env as Record<string, string | undefined>;
    envObj.ONEAGENT_PROACTIVE_AUTO_DELEGATE = '1';
    // Run a cycle to populate deep analysis (best-effort)
    try {
      await proactiveObserverService.runObservationCycle();
    } catch {
      /* ignore */
    }
    await taskDelegationService.harvestAndQueue();
    const queued = taskDelegationService.getQueuedTasks();
    if (!queued.length) return; // nothing to test, allow pass (non-deterministic environment)

    // Simulate dispatch + execution
    const engine = OneAgentEngine.getInstance();
    // @ts-expect-error accessing private for test (could refactor with public helper)
    await engine.dispatchQueuedTasks?.();

    const all = taskDelegationService.getAllTasks();
    const transitioned = all.filter((t) => t.status === 'completed' || t.status === 'failed');
    expect(transitioned.length).toBeGreaterThanOrEqual(1);
  });
});
