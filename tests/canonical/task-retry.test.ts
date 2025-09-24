process.env.ONEAGENT_FAST_TEST_MODE = '1';
process.env.ONEAGENT_SIMULATE_AGENT_EXECUTION = '0';

import { taskDelegationService } from '../../coreagent/services/TaskDelegationService';
import { createUnifiedTimestamp } from '../../coreagent/utils/UnifiedBackboneService';

describe('TaskDelegationService retry logic', () => {
  test('processDueRequeues requeues eligible failed tasks', () => {
    // Seed a failed task with nextAttemptUnix in the past
    const now = createUnifiedTimestamp();
    const failed: any = {
      id: 'retry_task_1',
      createdAt: now.iso,
      source: 'proactive_analysis',
      finding: 'retry test',
      action: 'Refactor latency logic',
      status: 'failed',
      attempts: 0,
      maxAttempts: 2,
      nextAttemptUnix: now.unix - 1000,
      nextAttemptAt: new Date(now.unix - 1000).toISOString(),
    };
    // Directly push into internal queue (test-only)
    (taskDelegationService as any).queue.push(failed);
    const requeued = taskDelegationService.processDueRequeues(Date.now());
    expect(requeued).toContain('retry_task_1');
    const updated = taskDelegationService.getAllTasks().find((t) => t.id === 'retry_task_1');
    expect(updated?.status).toBe('queued');
    expect(updated?.attempts).toBe(1);
  });
});
