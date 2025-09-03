// Set test flags before importing server
process.env.NODE_ENV = 'test';
process.env.ONEAGENT_FAST_TEST_MODE = '1';
process.env.ONEAGENT_DISABLE_AUTOSTART = '1';

import request from 'supertest';
import {
  proactiveObserverService,
  DeepAnalysisResult,
} from '../services/ProactiveTriageOrchestrator';
import { taskDelegationService } from '../services/TaskDelegationService';

let app: import('express').Express;

/**
 * Integration test: JSON delegation queue endpoint should expose tasks with required fields
 * and counts should align with in-memory service state.
 */
describe('Task Delegation JSON Endpoint', () => {
  beforeAll(async () => {
    ({ app } = await import('../server/unified-mcp-server'));
    // Seed deep analysis so harvest produces tasks
    (proactiveObserverService as unknown as { lastDeep: DeepAnalysisResult | null }).lastDeep = {
      id: 'seed2',
      timestamp: new Date().toISOString(),
      summary: 'Seed deep analysis for JSON endpoint test',
      recommendedActions: [
        'Refactor latency collector',
        'Write documentation for remediation executor',
      ],
      supportingFindings: [],
      snapshotHash: 'hsnapshotjson',
    };
    await taskDelegationService.harvestAndQueue();
  });

  test('returns queue snapshot with required fields', async () => {
    const res = await request(app).get('/api/v1/tasks/delegation');
    expect(res.status).toBe(200);
    const body = res.body as {
      count: number;
      tasks: Array<Record<string, unknown>>;
      timestamp: string;
    };
    expect(body.count).toBeGreaterThan(0);
    expect(Array.isArray(body.tasks)).toBe(true);
    // Validate required shape for first task
    const t = body.tasks[0];
    for (const key of [
      'id',
      'status',
      'action',
      'targetAgent',
      'attempts',
      'maxAttempts',
      'createdAt',
    ]) {
      expect(t).toHaveProperty(key);
    }
    // Cross-check count matches service
    expect(body.count).toEqual(taskDelegationService.getAllTasks().length);
  });
});
