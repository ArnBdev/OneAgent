// Set test flags before importing server to prevent auto-start and heavy initialization logs
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
 * Integration test: Prometheus metrics should include task delegation gauges when tasks exist.
 */

describe('Task Delegation Prometheus Metrics', () => {
  beforeAll(async () => {
    // Dynamic import after env flags set
    ({ app } = await import('../server/unified-mcp-server'));
    // Seed a fake deep analysis so harvest produces tasks
    (proactiveObserverService as unknown as { lastDeep: DeepAnalysisResult | null }).lastDeep = {
      id: 'seed',
      timestamp: new Date().toISOString(),
      summary: 'Seed deep analysis',
      recommendedActions: [
        'Refactor latency thresholds',
        'Improve documentation for delegation system',
      ],
      supportingFindings: [],
      snapshotHash: 'hsnapshot',
    };
    await taskDelegationService.harvestAndQueue();
  });

  test('prometheus exposition contains delegation status gauges', async () => {
    const res = await request(app).get('/api/v1/metrics/prometheus');
    expect(res.status).toBe(200);
    const body = res.text;
    expect(body).toMatch(/oneagent_task_delegation_status_total{status="queued"} [0-9]+/);
    expect(body).toMatch(/oneagent_task_delegation_backoff_pending/);
  });
});
