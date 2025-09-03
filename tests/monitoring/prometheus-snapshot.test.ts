import request from 'supertest';
import express from 'express';

let createMetricsRouter: typeof import('../../coreagent/api/metricsAPI').createMetricsRouter;
let unifiedMonitoringService: typeof import('../../coreagent/monitoring/UnifiedMonitoringService').unifiedMonitoringService;

async function init() {
  if (!createMetricsRouter)
    ({ createMetricsRouter } = await import('../../coreagent/api/metricsAPI'));
  if (!unifiedMonitoringService)
    ({ unifiedMonitoringService } = await import(
      '../../coreagent/monitoring/UnifiedMonitoringService'
    ));
}

function buildApp() {
  const app = express();
  app.use(createMetricsRouter());
  return app;
}

describe('Prometheus exposition snapshot (naming & purity)', () => {
  let app: express.Express;
  let firstSnapshot: string[] = [];

  beforeAll(async () => {
    await init();
    // Seed a few operations
    ['sendAgentMessage', 'broadcastAgentMessage'].forEach((op) => {
      for (const ms of [15, 25, 5]) {
        unifiedMonitoringService.trackOperation('snap-comp', op, 'success', { durationMs: ms });
      }
    });
    app = buildApp();
  });

  it('captures initial metric name set', async () => {
    const res = await request(app).get('/api/v1/metrics/prometheus');
    expect(res.status).toBe(200);
    const names = new Set<string>();
    res.text.split(/\n/).forEach((l) => {
      const m = l.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\b/);
      if (m && !m[1].startsWith('#')) names.add(m[1]);
    });
    firstSnapshot = Array.from(names).sort();
    expect(firstSnapshot.length).toBeGreaterThan(5);
  });

  it('produces stable name superset after additional operations (no removals)', async () => {
    // Add new latency samples (should not remove metrics)
    for (const ms of [40, 60]) {
      unifiedMonitoringService.trackOperation('snap-comp', 'sendAgentMessage', 'success', {
        durationMs: ms,
      });
    }
    const res = await request(app).get('/api/v1/metrics/prometheus');
    const names = new Set<string>();
    res.text.split(/\n/).forEach((l) => {
      const m = l.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\b/);
      if (m && !m[1].startsWith('#')) names.add(m[1]);
    });
    const second = Array.from(names).sort();
    // Ensure no previously seen metric name disappeared
    firstSnapshot.forEach((n) => expect(second).toContain(n));
  });
});
