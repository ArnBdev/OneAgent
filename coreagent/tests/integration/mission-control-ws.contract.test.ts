import http from 'http';
import WebSocket from 'ws';
import { app } from '../../server/unified-mcp-server';
import { createMissionControlWSS } from '../../server/mission-control-ws';
import { unifiedMonitoringService } from '../../monitoring/UnifiedMonitoringService';

/** Utility wait helper */
function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function waitFor<T>(fn: () => T | undefined, timeoutMs = 3000, interval = 50): Promise<T> {
  const start = Date.now();
  while (true) {
    const v = fn();
    if (v !== undefined) return v;
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timeout');
    await wait(interval);
  }
}

describe('Mission Control WebSocket contract', () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    process.env.ONEAGENT_HEALTH_DELTA_INTERVAL_MS = '120';
    process.env.ONEAGENT_METRICS_TICK_MIN_INTERVAL_MS = '40';
    server = http.createServer(app);
    // Provide simple mutable health provider
    const status: string = 'healthy';
    const healthProvider = async () => ({ overall: { status } });
    createMissionControlWSS(server as unknown as http.Server, healthProvider, () => {
      /* noop */
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to acquire test port');
    port = address.port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('subscribes to metrics_tick & receives metrics_tick after operation_metric event', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/mission-control`);
    const messages: unknown[] = [];
    ws.on('message', (d) => {
      try {
        messages.push(JSON.parse(d.toString()));
      } catch {
        /* ignore */
      }
    });
    await new Promise((res) => ws.once('open', res));
    ws.send(JSON.stringify({ type: 'subscribe', channels: ['metrics_tick'] }));

    // Trigger a monitoring event to cause metrics_tick emission
    unifiedMonitoringService.emit('monitoring_event', {
      type: 'operation_metric',
      component: 'test',
      data: {},
      timestamp: new Date().toISOString(),
    });

    const tick = await waitFor(
      () =>
        messages.find((m: unknown) => (m as { type?: string }).type === 'metrics_tick') as
          | { payload?: { p95?: unknown; p99?: unknown } }
          | undefined,
      4000,
    );
    expect(tick).toBeTruthy();
    expect(tick?.payload).toBeTruthy();
    expect(typeof tick?.payload?.p95).toBe('number');
    expect(typeof tick?.payload?.p99).toBe('number');
    ws.close();
  });

  test('subscription_ack and subscription_error behavior', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/mission-control`);
    const messages: unknown[] = [];
    ws.on('message', (d) => {
      try {
        messages.push(JSON.parse(d.toString()));
      } catch {
        /* ignore */
      }
    });
    await new Promise((res) => ws.once('open', res));
    ws.send(JSON.stringify({ type: 'subscribe', channels: ['unknown_channel_xyz'] }));
    const errMsg = await waitFor(
      () =>
        messages.find((m: unknown) => (m as { type?: string }).type === 'subscription_error') as
          | { error?: { code?: string } }
          | undefined,
      2000,
    );
    expect(errMsg?.error).toBeTruthy();
    expect(errMsg?.error?.code).toBe('unknown_channel');
    ws.close();
  });
});
