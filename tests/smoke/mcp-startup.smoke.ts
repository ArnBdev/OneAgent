/**
 * MCP Startup Smoke Test (non-interactive)
 * - Reads canonical endpoints from backbone/config
 * - Probes /health and /info
 * - Performs minimal MCP initialize + tools/list
 * Run via: npm run smoke:mcp
 */
import assert from 'node:assert';
import http from 'node:http';
import { environmentConfig } from '../../coreagent/config/EnvironmentConfig';

function httpPostJson(url: string, body: unknown): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = Buffer.from(JSON.stringify(body));
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length,
        },
      },
      (res) => {
        res.setEncoding('utf8');
        let raw = '';
        res.on('data', (d: string) => {
          raw += d;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function httpGetJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname,
        method: 'GET',
      },
      (res) => {
        res.setEncoding('utf8');
        let raw = '';
        res.on('data', (d: string) => {
          raw += d;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const base = environmentConfig.endpoints.mcp.url.replace(/\/$/, '');
  const mcpUrl = base + environmentConfig.endpoints.mcp.path; // canonical MCP endpoint
  const serviceRoot = base; // service root hosts /health and /info
  const healthUrl = serviceRoot + '/health';
  const infoUrl = serviceRoot + '/info';

  const health = await httpGetJson(healthUrl);
  assert.ok(health.status === 'healthy', 'health endpoint should be healthy');

  const info = await httpGetJson(infoUrl);
  assert.ok(
    info.server && info.server.protocol && info.server.version,
    'info should contain server metadata',
  );

  // MCP initialize
  const initReq = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'smoke-client', version: '0.0.0' },
    },
  };
  const initRes = await httpPostJson(mcpUrl, initReq);
  assert.ok(initRes.result && initRes.result.serverInfo, 'initialize should return serverInfo');

  // MCP tools/list
  const toolsList = await httpPostJson(mcpUrl, { jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.ok(
    toolsList.result && Array.isArray(toolsList.result.tools),
    'tools/list should return tools',
  );

  // Done
  console.log('✓ MCP startup smoke passed');
}

run().catch((err) => {
  console.error('MCP smoke failed:', err);
  process.exit(1);
});
