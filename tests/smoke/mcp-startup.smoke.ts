/**
 * Jest Conversion: MCP Startup Smoke
 * Validates health/info endpoints and minimal MCP initialize + tools/list.
 */
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

describe('smoke: MCP startup', () => {
  it('responds healthy and serves MCP tools', async () => {
    const base = environmentConfig.endpoints.mcp.url.replace(/\/$/, '');
    const mcpUrl = base + environmentConfig.endpoints.mcp.path; // canonical MCP endpoint
    const serviceRoot = base; // service root hosts /health and /info
    const healthUrl = serviceRoot + '/health';
    const infoUrl = serviceRoot + '/info';
    const health = await httpGetJson(healthUrl);
    expect(health).toHaveProperty('status', 'healthy');

    const info = await httpGetJson(infoUrl);
    expect(info.server).toBeTruthy();
    expect(info.server).toHaveProperty('protocol');
    expect(info.server).toHaveProperty('version');

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
    expect(initRes.result).toBeTruthy();
    expect(initRes.result).toHaveProperty('serverInfo');

    // MCP tools/list
    const toolsList = await httpPostJson(mcpUrl, { jsonrpc: '2.0', id: 2, method: 'tools/list' });
    expect(Array.isArray(toolsList.result?.tools)).toBe(true);
  });
});
