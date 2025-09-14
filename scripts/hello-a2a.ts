/**
 * Hello A2A Demo (non-invasive)
 * - Loads .env for ports/keys
 * - Checks MCP /health and /info
 * - Performs JSON-RPC initialize and tools/list
 * - Probes NDJSON streaming via POST /mcp/stream and checks meta/message/end
 *
 * This does not write to memory; it’s safe to run repeatedly.
 */
import path from 'node:path';
import dotenv from 'dotenv';
import { spawn, ChildProcess } from 'node:child_process';
dotenv.config({ path: path.join(process.cwd(), '.env') });
import http from 'node:http';

function envInt(name: string, def: number): number {
  const v = process.env[name];
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : def;
}

const mcpPort = envInt('ONEAGENT_MCP_PORT', 8083);
const mcpHealth = `http://127.0.0.1:${mcpPort}/health`;
const mcpInfo = `http://127.0.0.1:${mcpPort}/info`;
const mcpUrl = `http://127.0.0.1:${mcpPort}/mcp`;
const mcpStream = `http://127.0.0.1:${mcpPort}/mcp/stream`;

function httpGet(
  url: string,
  timeoutMs = 4000,
): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      { hostname: u.hostname, port: u.port, path: u.pathname, method: 'GET', timeout: timeoutMs },
      (res) => {
        res.setEncoding('utf8');
        let raw = '';
        res.on('data', (d: string) => {
          raw += d;
        });
        res.on('end', () =>
          resolve({ status: res.statusCode || 0, body: raw, headers: res.headers }),
        );
      },
    );
    req.on('error', reject);
    req.end();
  });
}

interface JsonRpcResponse {
  jsonrpc?: string;
  id?: number | string | null;
  result?: Record<string, unknown> | undefined;
  error?: Record<string, unknown> | undefined;
}
function httpPostJson(url: string, body: unknown, timeoutMs = 5000): Promise<JsonRpcResponse> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = Buffer.from(JSON.stringify(body));
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        timeout: timeoutMs,
        headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length },
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

type MCPRequest = {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
};

function streamProbe(url: string, request: MCPRequest, timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = Buffer.from(JSON.stringify(request));
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length },
      },
      (res) => {
        const ct = String(res.headers['content-type'] || '');
        if (!ct.includes('application/json')) {
          res.resume();
          return reject(new Error(`Stream probe failed: content-type=${ct}`));
        }
        let sawStart = false;
        let sawMessage = false;
        let sawEnd = false;
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          for (const line of chunk.split('\n')) {
            const s = line.trim();
            if (!s) continue;
            try {
              const obj = JSON.parse(s);
              if (obj.type === 'meta' && obj.event === 'start') sawStart = true;
              if (obj.type === 'message') sawMessage = true;
              if (obj.type === 'meta' && obj.event === 'end') sawEnd = true;
            } catch {
              // ignore partial lines
            }
          }
        });
        res.on('end', () => {
          if (sawStart && sawMessage && sawEnd) resolve(true);
          else reject(new Error('Stream probe incomplete'));
        });
        const timer = setTimeout(() => {
          try {
            req.destroy();
          } catch {
            /* noop */
          }
          reject(new Error('Stream probe timeout'));
        }, timeoutMs);
        (timer as unknown as NodeJS.Timer).unref?.();
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`Hello A2A Demo → MCP: ${mcpUrl}`);
  // If MCP not up, auto-start using local tsx or ts-node fallback
  let mcp: ChildProcess | null = null;
  const startIfNeeded = async () => {
    try {
      const h = await httpGet(mcpHealth);
      if (h.status === 200) return; // already up
    } catch {
      /* not up */
    }
    const cwd = process.cwd();
    const run = (cmd: string, args: string[]) =>
      spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    let tsNodeRegister: string;
    try {
      tsNodeRegister = require.resolve('ts-node/register');
    } catch {
      throw new Error('Cannot auto-start MCP: ts-node/register not found');
    }
    mcp = run(process.execPath, ['-r', tsNodeRegister, 'coreagent/server/unified-mcp-server.ts']);
    // small wait for server to bind
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      try {
        const h = await httpGet(mcpHealth, 500);
        if (h.status === 200) break;
      } catch {
        // not ready yet
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  };
  await startIfNeeded();
  const health = await httpGet(mcpHealth);
  if (health.status !== 200) throw new Error(`/health status ${health.status}`);
  console.log('MCP /health:', health.body);

  const info = await httpGet(mcpInfo);
  console.log('MCP /info:', info.body);

  const init = await httpPostJson(mcpUrl, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'hello-a2a', version: '0.0.1' },
    },
  });
  if (!init || init.error) throw new Error('initialize failed');
  console.log('MCP initialize: OK');

  const tools = await httpPostJson(mcpUrl, { jsonrpc: '2.0', id: 2, method: 'tools/list' });
  console.log('MCP tools/list:', JSON.stringify(tools?.result ?? {}, null, 2));

  await streamProbe(mcpStream, { jsonrpc: '2.0', id: 99, method: 'tools/list' }, 8000);
  console.log('Stream: NDJSON meta/message/end observed');

  console.log('✅ Hello A2A demo completed');
  // best-effort cleanup if we started it
  if (mcp) {
    try {
      (mcp as ChildProcess).kill();
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  console.error('Hello A2A demo failed:', err);
  process.exit(1);
});
