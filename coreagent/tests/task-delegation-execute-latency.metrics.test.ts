// Set test flags before importing server
process.env.NODE_ENV = 'test';
process.env.ONEAGENT_FAST_TEST_MODE = '1';
process.env.ONEAGENT_DISABLE_AUTOSTART = '1';

import request from 'supertest';
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';

let app: import('express').Express;

/**
 * Integration test: After emitting execute operations with durationMs the Prometheus exposition
 * must contain latency gauges for operation "execute" (avg / p95 / p99).
 */
describe('Execute Latency Gauges (TaskDelegation)', () => {
  beforeAll(async () => {
    ({ app } = await import('../server/unified-mcp-server'));
    // Emit multiple execute operation events with varying durations to populate percentiles.
    const samples = [55, 120, 240, 510, 1030];
    for (const d of samples) {
      unifiedMonitoringService.trackOperation('TaskDelegation', 'execute', 'success', {
        durationMs: d,
        testSample: true,
      });
    }
  });

  test('prometheus exposition includes execute latency gauges', async () => {
    const res = await request(app).get('/api/v1/metrics/prometheus');
    expect(res.status).toBe(200);
    const body = res.text;
    // Expect avg, p95, p99 lines for operation=execute with a positive numeric value
    expect(body).toMatch(
      /oneagent_operation_latency_avg_ms\{operation="execute"} [0-9]+(\.[0-9]+)?/,
    );
    expect(body).toMatch(
      /oneagent_operation_latency_p95_ms\{operation="execute"} [0-9]+(\.[0-9]+)?/,
    );
    expect(body).toMatch(
      /oneagent_operation_latency_p99_ms\{operation="execute"} [0-9]+(\.[0-9]+)?/,
    );
  });
});
