/**
 * Smoke test: verifies that operation error metrics counters are exposed with errorCode label.
 */
import http from 'http';
import express from 'express';
import { createMetricsRouter } from '../../coreagent/api/metricsAPI';
import { unifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';

// Helper to extract specific metric lines
function grepMetrics(text: string, metric: string): string[] {
  return text.split('\n').filter((l) => l.startsWith(metric));
}

async function run() {
  const app = express();
  app.use(createMetricsRouter());
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  unifiedMonitoringService.trackOperation('communication', 'sendAgentMessage', 'success', {
    durationMs: 5,
  });
  unifiedMonitoringService.trackOperation('communication', 'sendAgentMessage', 'error', {
    durationMs: 7,
    errorCode: 'VALIDATION',
  });
  const res = await fetch(`${baseUrl}/api/v1/metrics/prometheus`);
  if (res.status !== 200) throw new Error('Metrics endpoint status ' + res.status);
  const body = await res.text();
  const lines = grepMetrics(body, 'oneagent_operation_errors_total');
  const target = lines.find(
    (l) => l.includes('component="communication"') && l.includes('operation="sendAgentMessage"'),
  );
  if (!target) throw new Error('Missing error metric line for communication sendAgentMessage');
  if (!/errorCode="/.test(target)) throw new Error('Missing errorCode label');
  console.log('[SMOKE] operation-error-metrics: PASS');
  server.close();
}

run().catch((err) => {
  console.error('[SMOKE] operation-error-metrics: FAIL', err);
  process.exit(1);
});
