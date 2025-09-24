import { taskDelegationService } from '../services/TaskDelegationService';

// Mission progress invariant: completed + failed + dispatched == total
// We simulate by injecting a few tasks, force transitions, then ask orchestrator to broadcast and check counts.

describe('Mission progress invariant', () => {
  it('completed + failed + dispatched equals total', async () => {
    process.env.ONEAGENT_FAST_TEST_MODE = '1';
    // Seed synthetic tasks
    const tasks = [
      { action: 'doc write', status: 'queued' as const },
      { action: 'code optimize', status: 'queued' as const },
      { action: 'fitness check', status: 'queued' as const },
    ];
    // Push directly via harvestAndQueue pattern: emulate provider
    (
      taskDelegationService as unknown as {
        deepAnalysisProvider: () => { summary: string; recommendedActions: string[] } | null;
      }
    ).deepAnalysisProvider = () => ({
      summary: 'synthetic',
      recommendedActions: tasks.map((t) => t.action),
    });
    await taskDelegationService.harvestAndQueue();

    const all = taskDelegationService.getAllTasks();
    expect(all.length).toBeGreaterThanOrEqual(3);

    // Move one to dispatched, one to completed, one to failed
    taskDelegationService.markDispatched(all[0].id)!;
    const t2 = taskDelegationService.markDispatched(all[1].id)!;
    taskDelegationService.markExecutionResult(t2.id, true, undefined, undefined, 10);
    const t3 = taskDelegationService.markDispatched(all[2].id)!;
    taskDelegationService.markExecutionResult(t3.id, false, 'x', 'y', 5);

    const snapshot = taskDelegationService.getAllTasks();
    const dispatched = snapshot.filter((t) => t.status === 'dispatched').length;
    const completed = snapshot.filter((t) => t.status === 'completed').length;
    const failed = snapshot.filter((t) => t.status === 'failed').length;
    const total = snapshot.length;

    expect(dispatched + completed + failed).toBe(total);
  });
});
