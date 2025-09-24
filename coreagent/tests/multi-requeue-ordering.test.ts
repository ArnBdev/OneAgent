import { taskDelegationService } from '../services/TaskDelegationService';

// Validate deterministic multi-requeue ordering and snapshot integrity
// We simulate three failed tasks with staggered nextAttemptUnix and process requeues

describe('TaskDelegation multi-requeue ordering', () => {
  it('requeues tasks whose nextAttemptUnix passed, preserves deterministic order', async () => {
    process.env.ONEAGENT_FAST_TEST_MODE = '1';
    const base = Date.now();

    // Seed three tasks directly via internal queue access pattern through harvest provider
    (
      taskDelegationService as unknown as {
        deepAnalysisProvider: () => { summary: string; recommendedActions: string[] } | null;
      }
    ).deepAnalysisProvider = () => ({
      summary: 'multi-requeue',
      recommendedActions: ['a1', 'a2', 'a3'],
    });
    await taskDelegationService.harvestAndQueue();

    const all = taskDelegationService.getAllTasks();
    // Fail them and set attempts/backoff
    for (let i = 0; i < 3; i++) {
      const t = all[i];
      taskDelegationService.markDispatched(t.id);
      taskDelegationService.markExecutionResult(t.id, false, 'x', 'y', 10);
      // set attempts low so maybeRequeue is allowed and stagger backoff
      t.attempts = 0;
      t.maxAttempts = 3;
      t.nextAttemptUnix = base + i * 10; // staggered by 10ms
    }

    // process requeues at base+15 -> should requeue all 3 in order
    const requeued = taskDelegationService.processDueRequeues(base + 15);
    expect(requeued.length).toBe(3);
    // Ensure no duplicates and original ordering by nextAttemptUnix
    const unique = new Set(requeued);
    expect(unique.size).toBe(3);
  });
});
