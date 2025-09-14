/**
 * Runtime Smoke Harness
 * - Starts memory (FastAPI/uvicorn) and MCP (ts-node/register) if not already up
 * - Waits for readiness using canonical ports from env
 * - Runs MCP startup smoke (health/info + initialize/tools/list)
 * - Gracefully shuts down any processes it started
 */
import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
// Load environment from project root so MEM0_API_KEY, ports, etc. are consistent across Node and Python
dotenv.config({ path: path.join(process.cwd(), '.env') });
import http from 'node:http';

function envInt(name: string, def: number): number {
  const v = process.env[name];
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : def;
}

const memPort = envInt('ONEAGENT_MEMORY_PORT', 8010);
const mcpPort = envInt('ONEAGENT_MCP_PORT', 8083);
const memHealth = `http://127.0.0.1:${memPort}/health`;
const memStats = (userId = 'smoke-user') =>
  `http://127.0.0.1:${memPort}/v1/memories/stats?userId=${encodeURIComponent(userId)}`;
const mcpHealth = `http://127.0.0.1:${mcpPort}/health`;
const mcpUrl = `http://127.0.0.1:${mcpPort}/mcp`;
const mcpInfo = `http://127.0.0.1:${mcpPort}/info`;
const mcpStream = `http://127.0.0.1:${mcpPort}/mcp/stream`;
const MCP_PROTOCOL_VERSION = '2025-06-18';

function httpGet(url: string, timeoutMs = 3000): Promise<{ status: number; body: string }> {
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
        res.on('end', () => resolve({ status: res.statusCode || 0, body: raw }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function httpGetWithHeaders(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 5000,
): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: `${u.pathname}${u.search}`,
        method: 'GET',
        timeout: timeoutMs,
        headers,
      },
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
  result?: unknown;
  error?: unknown;
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

async function waitReady(url: string, totalMs = 30000, stepMs = 500): Promise<boolean> {
  const deadline = Date.now() + totalMs;
  while (Date.now() < deadline) {
    try {
      const res = await httpGet(url, stepMs);
      if (res.status >= 200 && res.status < 500) return true; // accept 404 as socket-open
    } catch {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return false;
}

function run(cmd: string, args: string[], cwd: string): ChildProcess {
  const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));
  return child;
}

function startMcpServer(cwd: string): ChildProcess {
  // Start via ts-node/register (robust across shells/Windows)
  let tsNodeRegister: string;
  try {
    // Resolve from current Node resolution (devDependency)
    tsNodeRegister = require.resolve('ts-node/register');
  } catch {
    throw new Error('ts-node/register not found to start MCP server');
  }
  return run(
    process.execPath,
    ['-r', tsNodeRegister, 'coreagent/server/unified-mcp-server.ts'],
    cwd,
  );
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
  let mem: ChildProcess | null = null;
  let mcp: ChildProcess | null = null;
  const cwd = process.cwd();

  // Pre-check: are they already up?
  const memUp = await waitReady(memHealth, 1000, 250);
  const mcpUp = await waitReady(mcpHealth, 1000, 250);

  try {
    if (!memUp) {
      // Ensure GEMINI_API_KEY exists for memory server boot (health route doesn't use it)
      if (!process.env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = 'dummy-smoke-key';
      }
      // Propagate unified OneAgent version to memory server logs
      try {
        const pkgPath = path.join(cwd, 'package.json');
        const text = fs.readFileSync(pkgPath, 'utf8');
        const pkg = JSON.parse(text) as { version?: string };
        if (pkg && typeof pkg.version === 'string' && pkg.version) {
          process.env.ONEAGENT_VERSION = pkg.version;
        }
      } catch {
        // Fallback to existing env or leave unset; non-fatal
        if (!process.env.ONEAGENT_VERSION) {
          process.env.ONEAGENT_VERSION = '4.1.0';
        }
      }
      // Ensure MEM0_API_KEY exists for authenticated memory routes
      if (!process.env.MEM0_API_KEY) {
        process.env.MEM0_API_KEY = 'smoke-test-key';
      }
      // Start memory via uvicorn pointing app-dir to servers for robust module resolution
      mem = run(
        'python',
        [
          '-m',
          'uvicorn',
          'oneagent_memory_server:app',
          '--app-dir',
          'servers',
          '--host',
          '127.0.0.1',
          '--port',
          String(memPort),
        ],
        cwd,
      );
    }
    if (!mcpUp) {
      // Start MCP via local tsx binary or ts-node/register fallback (no reliance on npx)
      mcp = startMcpServer(cwd);
    }

    // Wait readiness
    const memReady = await waitReady(memHealth, 30000, 500);
    const mcpReady = await waitReady(mcpHealth, 45000, 500);
    if (!memReady) throw new Error('Memory server not ready');
    if (!mcpReady) throw new Error('MCP server not ready');

    // Memory health
    const memHealthRes = await httpGet(memHealth);
    const memHealthJson = JSON.parse(memHealthRes.body || '{}');
    if (!memHealthJson.success) throw new Error('Memory /health not healthy');

    // Minimal authenticated memory op: stats for a smoke user (optional)
    // If memory server was already running, we may not know its MEM0_API_KEY → treat 401/426 as non-fatal and skip.
    const memKey = process.env.MEM0_API_KEY;
    if (memKey) {
      try {
        const authHeaders = {
          Authorization: `Bearer ${memKey}`,
          'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        } as const;
        const statsRes = await httpGetWithHeaders(
          memStats('smoke-user'),
          authHeaders as unknown as Record<string, string>,
        );
        if (statsRes.status === 200) {
          const statsJson = JSON.parse(statsRes.body || '{}');
          if (!statsJson.success) {
            console.warn('Memory stats responded 200 but not success; continuing.');
          }
        } else if (statsRes.status === 401 || statsRes.status === 426) {
          console.warn(
            'Memory stats unauthorized or protocol mismatch; skipping optional memory op.',
          );
        } else {
          console.warn(`Memory stats unexpected status ${statsRes.status}; continuing.`);
        }
      } catch (e) {
        console.warn('Memory stats optional check failed; continuing.', e);
      }
    } else {
      console.log('Skipping memory stats optional check: MEM0_API_KEY not set.');
    }

    // Health
    const healthJson = JSON.parse((await httpGet(mcpHealth)).body);
    if (healthJson.status !== 'healthy') throw new Error('MCP /health not healthy');
    // Info
    const infoJson = JSON.parse((await httpGet(mcpInfo)).body);
    if (!infoJson.server || !infoJson.server.version)
      throw new Error('MCP /info missing server metadata');

    // MCP initialize
    const initRes = await httpPostJson(mcpUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'runtime-smoke', version: '0.0.0' },
      },
    });
    const initOk = Boolean(
      initRes &&
        typeof initRes === 'object' &&
        initRes.result &&
        typeof initRes.result === 'object' &&
        (initRes.result as { serverInfo?: unknown }).serverInfo,
    );
    if (!initOk) throw new Error('MCP initialize failed');

    // tools/list
    const tools = await httpPostJson(mcpUrl, { jsonrpc: '2.0', id: 2, method: 'tools/list' });
    const toolsOk = Boolean(
      tools &&
        typeof tools === 'object' &&
        tools.result &&
        Array.isArray((tools.result as { tools?: unknown[] }).tools),
    );
    if (!toolsOk) throw new Error('MCP tools/list failed');

    // MCP streaming probe: verify NDJSON meta/message/end on /mcp/stream
    const streamOk = await streamProbe(
      mcpStream,
      { jsonrpc: '2.0', id: 99, method: 'tools/list' },
      8000,
    ).catch(() => false);
    if (!streamOk) throw new Error('MCP stream probe failed');

    // Success only after streaming probe to guarantee streaming readiness
    console.log('✓ Runtime smoke passed (stream ready)');
  } finally {
    // Gracefully shutdown processes we started
    const kill = (p: ChildProcess | null) => {
      if (!p) return;
      try {
        p.kill();
      } catch {
        /* ignore */
      }
    };
    kill(mem);
    kill(mcp);
  }
}

main().catch((err) => {
  console.error('Runtime smoke failed:', err);
  process.exit(1);
});
