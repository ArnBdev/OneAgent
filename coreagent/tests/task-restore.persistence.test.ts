import { taskDelegationService } from '../services/TaskDelegationService';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { createUnifiedTimestamp, createUnifiedId } from '../utils/UnifiedBackboneService';

/**
 * Verifies that previously persisted proactive tasks can be restored.
 * This is a lightweight test that injects synthetic memory records then calls restore().
 */

describe('Task Delegation Persistence Restore', () => {
  it('restores previously persisted tasks (synthetic)', async () => {
    const memory = OneAgentMemory.getInstance();
    // Inject two synthetic proactive task memories
    for (let i = 0; i < 2; i++) {
      const action = `SyntheticAction${i}`;
      const id = createUnifiedId('operation', 'proactive_task_synth');
      await memory.addMemoryCanonical(
        `ProactiveDelegation:${action}`,
        {
          type: 'proactive_task',
          taskId: id,
          targetAgent: 'DevAgent',
          status: 'queued',
          createdAt: createUnifiedTimestamp().iso,
          sourceFinding: 'synthetic-restore-test',
          snapshotHash: 'restore-hash',
        } as unknown as Record<string, unknown>,
        'system-proactive',
      );
    }

    // Force restore (idempotent)
    await taskDelegationService.restore();
    const all = taskDelegationService.getAllTasks();
    // Expect at least the two synthetic tasks now present (could be more from other tests)
    const synthetic = all.filter((t) => t.finding === 'synthetic-restore-test');
    expect(synthetic.length).toBeGreaterThanOrEqual(2);
  });
});
