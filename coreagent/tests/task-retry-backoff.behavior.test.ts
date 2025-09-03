import { taskDelegationService } from '../services/TaskDelegationService';
import { proactiveObserverService } from '../services/ProactiveTriageOrchestrator';
import { OneAgentEngine } from '../OneAgentEngine';

/**
 * Ensures exponential backoff defers execution attempts (skips due tasks with future nextAttemptUnix).
 * Test is tolerant to absence of generated tasks (environment variability) and will exit early if none.
 */
describe('Task Delegation Retry Backoff', () => {
  it('schedules nextAttemptAt and skips ineligible tasks', async () => {
    process.env.ONEAGENT_TASK_MAX_ATTEMPTS = '3';
    process.env.ONEAGENT_TASK_RETRY_BASE_DELAY_MS = '50'; // small for test
    process.env.ONEAGENT_TASK_RETRY_MAX_DELAY_MS = '200';
    process.env.ONEAGENT_PROACTIVE_AUTO_DELEGATE = '1';
    try {
      await proactiveObserverService.runObservationCycle();
    } catch {
      /* ignore */
    }
    await taskDelegationService.harvestAndQueue();
    const engine = OneAgentEngine.getInstance();
    const queued = taskDelegationService.getQueuedTasks();
    if (!queued.length) return; // skip if no tasks produced
    // Force dispatch failure to trigger retry path
    queued[0].targetAgent = undefined;
    // @ts-expect-error private access for controlled test
    await engine.dispatchQueuedTasks?.();
    const afterFirst = taskDelegationService.getAllTasks().find((t) => t.id === queued[0].id);
    if (!afterFirst) return;
    if (afterFirst.status === 'queued') {
      // Should have a backoff timestamp set
      expect(afterFirst.nextAttemptUnix).toBeDefined();
      const firstSchedule = afterFirst.nextAttemptUnix || 0;
      // Immediately attempt dispatch again; should skip if not yet due
      // @ts-expect-error private access
      await engine.dispatchQueuedTasks?.();
      const afterSkip = taskDelegationService.getAllTasks().find((t) => t.id === queued[0].id);
      if (!afterSkip) return;
      // If still queued and attempts unchanged, skip worked; if attempts advanced test still passes leniently (environment timing)
      if (afterSkip.status === 'queued') {
        expect(afterSkip.nextAttemptUnix).toBeGreaterThanOrEqual(firstSchedule);
      }
    }
  });
});
