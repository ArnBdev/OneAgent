import http from 'http';
import WebSocket from 'ws';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { app } from '../../server/unified-mcp-server';
import { createMissionControlWSS } from '../../server/mission-control-ws';
import schema from '../schemas/mission-control-message-schemas.json';
import { unifiedMonitoringService } from '../../monitoring/UnifiedMonitoringService';

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

describe('Mission Control WS schema validation', () => {
  // Extend overall suite timeout for slower environments
  jest.setTimeout(15000);
  let server: http.Server;
  let port: number;
  let wss: ReturnType<typeof createMissionControlWSS> | undefined;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  // Register schema first, then compile references for clarity & futureproofing
  ajv.addSchema(schema, 'https://oneagent.dev/schemas/mission-control-ws-messages.json');
  const metricsValidate =
    ajv.getSchema(
      'https://oneagent.dev/schemas/mission-control-ws-messages.json#/definitions/metrics_tick',
    ) ||
    ajv.compile({
      $ref: 'https://oneagent.dev/schemas/mission-control-ws-messages.json#/definitions/metrics_tick',
    });
  const healthValidate =
    ajv.getSchema(
      'https://oneagent.dev/schemas/mission-control-ws-messages.json#/definitions/health_delta',
    ) ||
    ajv.compile({
      $ref: 'https://oneagent.dev/schemas/mission-control-ws-messages.json#/definitions/health_delta',
    });
  const subAckValidate =
    ajv.getSchema(
      'https://oneagent.dev/schemas/mission-control-ws-messages.json#/definitions/subscription_ack',
    ) ||
    ajv.compile({
      $ref: 'https://oneagent.dev/schemas/mission-control-ws-messages.json#/definitions/subscription_ack',
    });
  const whoamiValidate =
    ajv.getSchema(
      'https://oneagent.dev/schemas/mission-control-ws-messages.json#/definitions/whoami',
    ) ||
    ajv.compile({
      $ref: 'https://oneagent.dev/schemas/mission-control-ws-messages.json#/definitions/whoami',
    });

  beforeAll(async () => {
    jest.setTimeout(20000); // allow extra time for WebSocket setup/teardown on slower machines
    process.env.ONEAGENT_METRICS_TICK_MIN_INTERVAL_MS = '40';
    server = http.createServer(app);
    const healthProvider = async () => ({ overall: { status: 'healthy' } });
    wss = createMissionControlWSS(server as unknown as http.Server, healthProvider);
    await new Promise<void>((r) => server.listen(0, r));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No port');
    port = address.port;
  });

  afterAll(async () => {
    // Proactively terminate any lingering client connections to ensure fast shutdown
    if (wss) {
      for (const client of wss.clients) {
        try {
          client.terminate();
        } catch {
          /* ignore */
        }
      }
      await new Promise<void>((resolve) => wss!.close(() => resolve()));
    }
    await new Promise<void>((r) => server.close(() => r()));
  });

  type Outbound = { type: string; payload?: Record<string, unknown>; [k: string]: unknown };

  test('metrics_tick matches schema', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/mission-control`);
    const messages: Outbound[] = [];
    ws.on('message', (d) => {
      try {
        messages.push(JSON.parse(d.toString()));
      } catch {
        /* ignore */
      }
    });
    await new Promise((res) => ws.once('open', res));
    ws.send(JSON.stringify({ type: 'subscribe', channels: ['metrics_tick'] }));
    // Wait for subscription_ack to guarantee onSubscribe handler registered before emitting event
    await waitFor(() => messages.find((m) => m.type === 'subscription_ack'), 3000);
    unifiedMonitoringService.emit('monitoring_event', {
      type: 'operation_metric',
      component: 'schema-test',
      data: { operation: 'emit', status: 'success', durationMs: 12 },
      timestamp: new Date().toISOString(),
      severity: 'info',
      message: 'schema validation trigger',
    });

    unifiedMonitoringService.emit('monitoring_event', {
      type: 'operation_metric',
      component: 'test',
      data: { status: 'success', operation: 'opX' },
      timestamp: new Date().toISOString(),
      severity: 'info',
      message: 'op',
    });

    const tick = await waitFor(() => messages.find((m) => m.type === 'metrics_tick'), 6000);
    const valid = metricsValidate(tick);
    if (!valid) console.error(metricsValidate.errors);
    expect(valid).toBe(true);
    ws.close();
  });

  test('health_delta matches schema', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/mission-control`);
    const messages: Outbound[] = [];
    ws.on('message', (d) => {
      try {
        messages.push(JSON.parse(d.toString()));
      } catch {
        /* ignore */
      }
    });
    await new Promise((res) => ws.once('open', res));
    ws.send(JSON.stringify({ type: 'subscribe', channels: ['health_delta'] }));
    // Trigger degraded + recovery
    unifiedMonitoringService.emit('health_degraded', { reason: 'test' });
    unifiedMonitoringService.emit('health_critical', { reason: 'test critical' });

    const healthMsg = await waitFor(() => messages.find((m) => m.type === 'health_delta'), 4000);
    const valid = healthValidate(healthMsg);
    if (!valid) console.error(healthValidate.errors);
    expect(valid).toBe(true);
    ws.close();
  });

  test('subscription_ack and whoami match schema', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/mission-control`);
    const messages: Outbound[] = [];
    ws.on('message', (d) => {
      try {
        messages.push(JSON.parse(d.toString()));
      } catch {
        /* ignore */
      }
    });
    await new Promise((res) => ws.once('open', res));
    ws.send(JSON.stringify({ type: 'whoami' }));
    ws.send(JSON.stringify({ type: 'subscribe', channels: ['metrics_tick'] }));
    const ack = await waitFor(() => messages.find((m) => m.type === 'subscription_ack'), 3000);
    const who = await waitFor(() => messages.find((m) => m.type === 'whoami'), 3000);
    const validAck = subAckValidate(ack);
    if (!validAck) console.error(subAckValidate.errors);
    expect(validAck).toBe(true);
    const validWho = whoamiValidate(who);
    if (!validWho) console.error(whoamiValidate.errors);
    expect(validWho).toBe(true);
    ws.close();
  });
});
