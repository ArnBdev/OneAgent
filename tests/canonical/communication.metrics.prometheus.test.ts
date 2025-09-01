import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { COMM_OPERATION } from '../../coreagent/types/communication-constants';

// Test ensures new communication latency gauges appear (avg/p95/p99) for at least one operation after some activity.
// We generate a minimal amount of activity by invoking operations indirectly if possible, otherwise we just poll.

describe('Prometheus communication metrics', () => {
  let proc: any;
  const port = 8083; // unified server default

  function get(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const req = http.request(
        { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET' },
        (res) => {
          let raw = '';
          res.on('data', (d) => (raw += d));
          res.on('end', () => resolve(raw));
        },
      );
      req.on('error', reject);
      req.end();
    });
  }

  beforeAll(async () => {
    const tsNodeRegister = require.resolve('ts-node/register');
    proc = spawn(
      process.execPath,
      ['-r', tsNodeRegister, 'coreagent/server/unified-mcp-server.ts'],
      {
        cwd: path.join(process.cwd()),
        stdio: 'ignore',
        env: { ...process.env, ONEAGENT_DISABLE_AUTO_MONITORING: '' },
      },
    );
    const start = Date.now();
    while (Date.now() - start < 30000) {
      try {
        const body = await get(`http://127.0.0.1:${port}/health`);
        if (body) break;
      } catch {
        /* retry */
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }, 40000);

  afterAll(() => {
    proc?.kill?.();
  });

  it('exposes communication operation latency gauges', async () => {
    const body = await get(`http://127.0.0.1:${port}/api/v1/metrics/prometheus`);
    // Core gauge sets
    expect(body).toContain('oneagent_operation_latency_avg_ms');
    expect(body).toContain('oneagent_operation_latency_p95_ms');
    expect(body).toContain('oneagent_operation_latency_p99_ms');
    // At least one known COMM_OPERATION should appear (we check string presence rather than executing operations here)
    const oneOp = Object.values(COMM_OPERATION)[0];
    expect(body).toContain(`operation="${oneOp}`); // partial match of label line
  }, 15000);
});
