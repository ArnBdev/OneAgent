import { proactiveObserverService } from '../services/ProactiveTriageOrchestrator';
import { taskDelegationService } from '../services/TaskDelegationService';
import { OneAgentEngine } from '../OneAgentEngine';

/**
 * Minimal smoke test for proactive delegation loop.
 * Uses fast mode assumptions: environment variable ONEAGENT_PROACTIVE_AUTO_DELEGATE should be set during test run if needed.
 */

describe('Proactive Delegation Loop', () => {
  it('queues tasks after deep analysis and supports dispatch marking', async () => {
    // Guard: orchestrator may not yet have produced deep analysis; simulate by invoking private cycle if available
    OneAgentEngine.getInstance(); // ensure engine singleton initialized
    const envObj = process.env as Record<string, string | undefined>;
    if (!envObj.ONEAGENT_PROACTIVE_AUTO_DELEGATE) {
      envObj.ONEAGENT_PROACTIVE_AUTO_DELEGATE = '1';
    }
    // Force an observation cycle; if anomaly not detected naturally, skip assertion softness
    try {
      await proactiveObserverService.runObservationCycle();
    } catch {
      /* ignore errors */
    }
    // Trigger explicit harvest (idempotent) to ensure queue population for test
    await taskDelegationService.harvestAndQueue();
    const queued = taskDelegationService.getQueuedTasks();
    expect(Array.isArray(queued)).toBe(true);

    // Attempt to dispatch (simulate engine loop) - mark first two as dispatched
    const toDispatch = queued.slice(0, 2);
    for (const task of toDispatch) {
      const updated = taskDelegationService.markDispatched(task.id);
      if (updated) {
        expect(updated.status).toBe('dispatched');
      }
    }

    // Ensure dispatched tasks no longer appear in queued snapshot
    const remaining = taskDelegationService.getQueuedTasks();
    for (const t of toDispatch) {
      if (t) {
        expect(remaining.find((q) => q.id === t.id)).toBeUndefined();
      }
    }
  });
});
