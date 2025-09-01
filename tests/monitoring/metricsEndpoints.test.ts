import request from 'supertest';
import express from 'express';
import { COMM_OPERATION } from '../../coreagent/types/communication-constants';

// Lazy import to avoid early side-effects before monitoring singleton constructed
let createMetricsRouter: typeof import('../../coreagent/api/metricsAPI').createMetricsRouter;
let unifiedMonitoringService: typeof import('../../coreagent/monitoring/UnifiedMonitoringService').unifiedMonitoringService;

async function init() {
  if (!createMetricsRouter) {
    ({ createMetricsRouter } = await import('../../coreagent/api/metricsAPI'));
  }
  if (!unifiedMonitoringService) {
    ({ unifiedMonitoringService } = await import(
      '../../coreagent/monitoring/UnifiedMonitoringService'
    ));
  }
}

function buildApp() {
  const app = express();
  app.use(createMetricsRouter());
  return app;
}

describe('metrics endpoints', () => {
  let app: express.Express;

  beforeAll(async () => {
    await init();
    // Emit synthetic error event
    unifiedMonitoringService.trackOperation('test-component', 'sendMessage', 'error', {
      error: 'Rate limit exceeded while sending message',
      durationMs: 120,
    });
    app = buildApp();
  });

  it('returns structured JSON metrics with errors array', async () => {
    const res = await request(app).get('/api/v1/metrics/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('stats');
    expect(res.body.data).toHaveProperty('operations');
    expect(Array.isArray(res.body.data.errors)).toBe(true);
  });

  it('exposes taxonomy-mapped error code in Prometheus export', async () => {
    const res = await request(app).get('/api/v1/metrics/prometheus');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/oneagent_operation_errors_total\{[^}]*errorCode="rate_limited"/);
  });

  it('includes SLO target gauges when configuration present', async () => {
    const res = await request(app).get('/api/v1/metrics/prometheus');
    expect(res.status).toBe(200);
    // Allow either latency or error rate presence (config dependent)
    expect(
      /oneagent_slo_target_latency_ms\{operation="[^"]+"\}/.test(res.text) ||
        /oneagent_slo_target_error_rate\{operation="[^"]+"\}/.test(res.text),
    ).toBe(true);
  });

  it('exposes histogram buckets for at least one communication operation', async () => {
    const op = COMM_OPERATION.sendAgentMessage; // canonical key value
    unifiedMonitoringService.trackOperation('test-component', op, 'success', { durationMs: 15 });
    unifiedMonitoringService.trackOperation('test-component', op, 'success', { durationMs: 75 });
    const res = await request(app).get('/api/v1/metrics/prometheus');
    expect(res.status).toBe(200);
    const bucketRegex = new RegExp(
      `oneagent_operation_latency_histogram_bucket\\{operation="${op}",le="50"}\\s+\\d+`,
    );
    expect(res.text).toMatch(bucketRegex);
    const countRegex = new RegExp(
      `oneagent_operation_latency_histogram_count\\{operation="${op}"}\\s+\\d+`,
    );
    expect(res.text).toMatch(countRegex);
  });

  it('exposes error budget burn gauges when SLO config defines error rate targets', async () => {
    const res = await request(app).get('/api/v1/metrics/prometheus');
    expect(res.status).toBe(200);
    // Presence of at least one burn or remaining gauge (depends on observed data availability)
    expect(
      /oneagent_slo_error_budget_burn\{operation="[^"]+"}/.test(res.text) ||
        /oneagent_slo_error_budget_remaining\{operation="[^"]+"}/.test(res.text),
    ).toBe(true);
  });

  it('includes errorBudgets array in JSON metrics output (may be empty if no SLO config)', async () => {
    const res = await request(app).get('/api/v1/metrics/json');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('errorBudgets');
    expect(Array.isArray(res.body.data.errorBudgets)).toBe(true);
    if (res.body.data.errorBudgets.length > 0) {
      const sample = res.body.data.errorBudgets[0];
      expect(sample).toHaveProperty('operation');
      expect(sample).toHaveProperty('targetErrorRate');
      expect(sample).toHaveProperty('observedErrorRate');
      expect(sample).toHaveProperty('burnRate');
      expect(sample).toHaveProperty('remainingBudget');
      expect(sample).toHaveProperty('windowMs');
    }
  });
});
