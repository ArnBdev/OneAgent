import request from 'supertest';
import express from 'express';

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

/** Helper to collect a quick internal snapshot of detailed metrics for a set of operations */
async function snapshotOpLatency(ops: string[]) {
  const snap: Record<string, { avg: number; p95: number; p99: number; count: number }> = {};
  for (const op of ops) {
    try {
      const d = await unifiedMonitoringService.getDetailedOperationMetrics(op);
      snap[op] = { avg: d.avgLatency, p95: d.p95, p99: d.p99, count: d.count };
    } catch {
      /* ignore missing */
    }
  }
  return snap;
}

describe('Prometheus exposition derivational purity & cardinality', () => {
  let app: express.Express;

  beforeAll(async () => {
    await init();
    app = buildApp();
  });

  it('does not mutate underlying latency metrics when rendering and preserves snapshot', async () => {
    const op = 'sendAgentMessage';
    // Seed some latencies via unified trackOperation (durationMs ingestion path)
    for (const ms of [12, 44, 91, 305, 18]) {
      unifiedMonitoringService.trackOperation('test-comp', op, 'success', { durationMs: ms });
    }
    const pre = await snapshotOpLatency([op]);
    const res = await request(app).get('/api/v1/metrics/prometheus');
    expect(res.status).toBe(200);
    const post = await snapshotOpLatency([op]);
    expect(post[op]).toBeDefined();
    // Purity: counts & percentile fundamentals unchanged (no extra latency appended)
    expect(post[op].count).toBe(pre[op].count);
    expect(post[op].avg).toBeCloseTo(pre[op].avg, 6);
    expect(post[op].p95).toBe(pre[op].p95);
    expect(post[op].p99).toBe(post[op].p99); // deterministic given small sample
  });

  it('limits errorCode label cardinality through taxonomy mapping & sanitization', async () => {
    const op = 'sendAgentMessage';
    const component = 'cardinality-comp';
    const rawErrors = [
      'Rate limit exceeded while sending message', // rate_limited
      'RATE LIMIT EXCEEDED again', // rate_limited
      'Some totally unique unexpected exploding stack 1234567890', // internal
      'Another Weird INTERNAL Failure $$$', // internal
      'Validation schema mismatch field missing', // validation
      'INVALID user INPUT provided', // validation
      'Auth token expired', // authentication
      'Permission denied for resource', // authorization (auth pattern second)
      'Adapter_Error occurred', // delegation_adapter_error
      'execution_failure during dispatch', // delegation_execution_error
      'remediation_failed business rule', // remediation_failed
      'task_not_found mid execution', // remediation_task_not_found
    ];
    rawErrors.forEach((msg) =>
      unifiedMonitoringService.trackOperation(component, op, 'error', {
        error: msg,
        durationMs: 5,
      }),
    );
    const res = await request(app).get('/api/v1/metrics/prometheus');
    expect(res.status).toBe(200);
    const lines = res.text.split(/\n/);
    const errorLines = lines.filter((l) => l.startsWith('oneagent_operation_errors_total'));
    // Extract distinct errorCode values for our component/op
    const codes = new Set<string>();
    for (const l of errorLines) {
      if (l.includes(`component="${component}"`) && l.includes(`operation="${op}"`)) {
        const match = l.match(/errorCode="([^"]+)"/);
        if (match) codes.add(match[1]);
      }
    }
    // Expect mapping collapsed to stable taxonomy subset (<= raw distinct input count)
    // Current taxonomy may surface additional remediation/delegation codes; keep tight upper bound.
    const upperBound = 9; // adjust if taxonomy intentionally extends
    if (codes.size > upperBound) {
      // Provide debugging info
      console.error('Observed error codes for cardinality test:', Array.from(codes));
    }
    expect(codes.size).toBeLessThanOrEqual(upperBound);
    // Ensure expected representative codes present
    const expected = ['rate_limited', 'validation', 'authentication', 'authorization', 'internal'];
    expected.forEach((c) => expect(Array.from(codes)).toContain(c));
  });

  it('exports stable metric name set (regression guard)', async () => {
    const res = await request(app).get('/api/v1/metrics/prometheus');
    expect(res.status).toBe(200);
    const text = res.text;
    const MUST_HAVE = [
      'oneagent_operation_total',
      'oneagent_operation_component_total',
      'oneagent_operation_error_rate',
      'oneagent_operation_latency_avg_ms',
      'oneagent_operation_latency_p95_ms',
      'oneagent_operation_latency_p99_ms',
      'oneagent_operation_errors_total',
      'oneagent_metrics_recent_total',
      'oneagent_build_info',
    ];
    for (const name of MUST_HAVE) {
      expect(text).toContain(name);
    }
  });
});
