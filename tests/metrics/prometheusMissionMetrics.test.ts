import request from 'supertest';
import express from 'express';
import { createMetricsRouter } from '../../coreagent/api/metricsAPI';
import {
  resetMissionRegistry,
  recordMissionStart,
  recordMissionStatus,
} from '../../coreagent/server/mission-control/missionRegistry';
import { createUnifiedTimestamp } from '../../coreagent/utils/UnifiedBackboneService';

/**
 * Verifies mission registry derived gauges appear in Prometheus export.
 */
describe('Prometheus mission metrics export', () => {
  const app = express();
  app.use(createMetricsRouter());

  beforeEach(() => {
    resetMissionRegistry();
  });

  it('emits mission gauge metrics after missions recorded', async () => {
    const now = createUnifiedTimestamp().unix;
    // one active, one completed, one error
    recordMissionStart('m-active', now - 2000);
    recordMissionStatus('m-active', 'planning_started');
    recordMissionStart('m-done', now - 5000);
    recordMissionStatus('m-done', 'execution_started');
    recordMissionStatus('m-done', 'completed');
    recordMissionStart('m-err', now - 4000);
    recordMissionStatus('m-err', 'execution_started');
    recordMissionStatus('m-err', 'error', { error: 'boom' });

    const res = await request(app).get('/api/v1/metrics/prometheus');
    expect(res.status).toBe(200);
    const body = res.text;
    // Basic presence checks
    expect(body).toMatch(/oneagent_mission_active \d+/);
    expect(body).toMatch(/oneagent_mission_completed \d+/);
    expect(body).toMatch(/oneagent_mission_errors \d+/);
    expect(body).toMatch(/oneagent_mission_total \d+/);
    expect(body).toMatch(/oneagent_mission_error_rate [0-9.]+/);
  });
});
