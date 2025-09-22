import http from 'http';
import WebSocket from 'ws';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { app } from '../../server/unified-mcp-server';
import { createMissionControlWSS } from '../../server/mission-control-ws';
import schema from '../schemas/mission-control-message-schemas.json';

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

describe('Mission Control WS additional schema validation', () => {
  let server: http.Server;
  let port: number;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(schema, 'https://oneagent.dev/schemas/mission-control-ws-messages.json');

  const subErrValidate = ajv.compile({
    $ref: 'https://oneagent.dev/schemas/mission-control-ws-messages.json#/definitions/subscription_error',
  });
  const protoErrValidate = ajv.compile({
    $ref: 'https://oneagent.dev/schemas/mission-control-ws-messages.json#/definitions/protocol_error',
  });

  beforeAll(async () => {
    server = http.createServer(app);
    const healthProvider = async () => ({ overall: { status: 'healthy' } });
    createMissionControlWSS(server as unknown as http.Server, healthProvider);
    await new Promise<void>((r) => server.listen(0, r));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No port');
    port = address.port;
  });

  afterAll(async () => {
    await new Promise<void>((r) => server.close(() => r()));
  });

  type Outbound = { type: string; [k: string]: unknown };

  test('subscription_error matches schema for unknown channel', async () => {
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
    ws.send(JSON.stringify({ type: 'subscribe', channels: ['nope_channel_xyz'] }));
    const errMsg = await waitFor(() => messages.find((m) => m.type === 'subscription_error'));
    const valid = subErrValidate(errMsg);
    if (!valid) console.error(subErrValidate.errors);
    expect(valid).toBe(true);
    ws.close();
  });

  test('protocol_error matches schema for invalid JSON', async () => {
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
    // Send malformed JSON frame (intentionally truncated JSON)
    ws.send('{');
    const proto = await waitFor(() => messages.find((m) => m.type === 'protocol_error'));
    const valid = protoErrValidate(proto);
    if (!valid) console.error(protoErrValidate.errors);
    expect(valid).toBe(true);
    ws.close();
  });
});
