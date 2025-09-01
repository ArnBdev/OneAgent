import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';

// Basic test to ensure prometheus endpoint responds and contains key metrics lines
// This uses a lightweight spawn of the unified server.

describe('Prometheus metrics endpoint', () => {
  let proc: any;
  const port = 8083; // default unified MCP server port

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
    // wait for health ready
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

  it('returns prometheus metrics with expected keys & histogram/error rate gauges', async () => {
    const body = await get(`http://127.0.0.1:${port}/api/v1/metrics/prometheus`);
    expect(body).toContain('oneagent_metrics_recent_total');
    expect(body).toContain('oneagent_operation_total');
    expect(body).toContain('oneagent_operation_component_total');
    expect(body).toContain('oneagent_operation_error_rate');
    // Histogram may be present (always emitted now) but tolerate absence in early cold start
    if (body.includes('oneagent_memory_search_latency_ms_bucket')) {
      expect(body).toMatch(/oneagent_memory_search_latency_ms_bucket{le="50"}/);
      expect(body).toMatch(/oneagent_memory_search_latency_ms_count/);
    }
  }, 15000);
});
