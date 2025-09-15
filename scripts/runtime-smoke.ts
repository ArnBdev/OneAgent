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
// Use Node 22+ native fetch for HTTP calls
import type { IncomingHttpHeaders } from 'node:http';
// no net usage; HTTP-based probes only
import { environmentConfig } from '../coreagent/config/EnvironmentConfig';

// no envInt; we derive ports from canonical environmentConfig

// Derive canonical endpoints from environmentConfig to avoid host/IPv6 mismatches
const memEndpoint = environmentConfig.endpoints.memory.url.replace(/\/$/, '');
const mcpEndpoint = environmentConfig.endpoints.mcp.url.replace(/\/$/, '');
const memUrl = new URL(memEndpoint);
const memHost = memUrl.hostname;
const memPort = Number(memUrl.port || environmentConfig.endpoints.memory.port || 8010);
// derive but only use URLs for HTTP readiness
const mcpBase = mcpEndpoint.replace(/\/mcp$/, '');
const memBase = memEndpoint;
const memHealth = `${memBase}/health`;
const memReadyz = `${memBase}/readyz`;
const memStats = (userId = 'smoke-user') =>
  `${memBase}/v1/memories/stats?userId=${encodeURIComponent(userId)}`;
// Candidate bases to tolerate IPv4/IPv6/localhost differences on Windows
function buildMcpCandidates(base: string): string[] {
  const u = new URL(base);
  const host = u.hostname.toLowerCase();
  const port = u.port;
  const candidates = new Set<string>();
  candidates.add(`http://${host}:${port}`);
  if (host !== '127.0.0.1') candidates.add(`http://127.0.0.1:${port}`);
  if (host !== 'localhost') candidates.add(`http://localhost:${port}`);
  // IPv6 loopback form
  candidates.add(`http://[::1]:${port}`);
  return Array.from(candidates);
}
let mcpBaseCurrent = mcpBase;
const mcpHealthUrl = () => `${mcpBaseCurrent}/health`;
const mcpInfoUrl = () => `${mcpBaseCurrent}/info`;
const mcpRpcUrl = () => `${mcpBaseCurrent}/mcp`;
const mcpStreamUrl = () => `${mcpBaseCurrent}/mcp/stream`;

async function selectReachableMcpBase(
  candidates: string[],
  totalMs = 20000,
): Promise<string | null> {
  const start = Date.now();
  const urls = candidates.flatMap((b) => [`${b}/health`, `${b}/info`]);
  while (Date.now() - start < totalMs) {
    for (const url of urls) {
      try {
        const res = await httpGet(url, 1500);
        if (res.status >= 200 && res.status < 500) {
          // Pick the base of this url
          return url.replace(/\/(health|info)$/i, '');
        }
      } catch {
        // ignore, rotate
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}
const MCP_PROTOCOL_VERSION = '2025-06-18';

async function httpGet(
  url: string,
  timeoutMs = 3000,
): Promise<{ status: number; body: string; headers: IncomingHttpHeaders }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const body = await res.text();
    // Map Headers to Node-like IncomingHttpHeaders shape minimally
    const headers: IncomingHttpHeaders = {};
    res.headers.forEach((v, k) => {
      (headers as Record<string, string>)[k.toLowerCase()] = v;
    });
    return { status: res.status, body, headers };
  } finally {
    clearTimeout(t);
  }
}

async function httpGetWithHeaders(
  url: string,
  headers: Record<string, string>,
  timeoutMs = 5000,
): Promise<{ status: number; body: string; headers: IncomingHttpHeaders }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    const body = await res.text();
    const outHeaders: IncomingHttpHeaders = {};
    res.headers.forEach((v, k) => {
      (outHeaders as Record<string, string>)[k.toLowerCase()] = v;
    });
    return { status: res.status, body, headers: outHeaders };
  } finally {
    clearTimeout(t);
  }
}

interface JsonRpcResponse {
  jsonrpc?: string;
  id?: number | string | null;
  result?: unknown;
  error?: unknown;
}
async function httpPostJson(
  url: string,
  body: unknown,
  timeoutMs = 8000,
): Promise<JsonRpcResponse> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    return JSON.parse(text || '{}');
  } finally {
    clearTimeout(t);
  }
}

async function waitReady(url: string, totalMs = 30000, stepMs = 500): Promise<boolean> {
  const deadline = Date.now() + totalMs;
  while (Date.now() < deadline) {
    try {
      const res = await httpGet(url, Math.max(750, stepMs));
      if (res.status >= 200 && res.status < 500) return true; // accept 404 as socket-open
    } catch {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return false;
}

async function waitAnyReady(urls: string[], totalMs = 30000, stepMs = 500): Promise<boolean> {
  const deadline = Date.now() + totalMs;
  let idx = 0;
  while (Date.now() < deadline) {
    const url = urls[idx % urls.length];
    try {
      const res = await httpGet(url, Math.max(750, stepMs));
      if (res.status >= 200 && res.status < 500) return true;
    } catch {
      // ignore and rotate
    }
    idx++;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return false;
}

// TCP port probe removed (HTTP readiness checks are sufficient and more portable)

function run(cmd: string, args: string[], cwd: string): ChildProcess {
  const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));
  return child;
}

function startMcpServer(cwd: string): ChildProcess {
  // Start via dedicated launcher to force explicit startServer() and avoid auto-start heuristics
  const launcher = path.join(cwd, 'scripts', 'start-mcp-launcher.cjs');
  if (!fs.existsSync(launcher)) {
    throw new Error('MCP launcher not found');
  }
  return run(process.execPath, [launcher], cwd);
}

async function waitForChildOutput(
  child: ChildProcess,
  pattern: RegExp,
  timeoutMs = 20000,
): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const onData = (d: Buffer) => {
      if (done) return;
      const s = d.toString();
      if (pattern.test(s)) {
        done = true;
        cleanup();
        resolve(true);
      }
    };
    const onExit = () => {
      if (done) return;
      done = true;
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      child.stdout?.off('data', onData);
      child.stderr?.off('data', onData);
      child.off('exit', onExit);
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.on('exit', onExit);
    setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      resolve(false);
    }, timeoutMs);
  });
}

type MCPRequest = {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
};

async function tryMcpInitializeProbe(url: string, attempts = 3): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await httpPostJson(
        url,
        {
          jsonrpc: '2.0',
          id: `probe-${Date.now()}-${i}`,
          method: 'initialize',
          params: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: {},
            clientInfo: { name: 'runtime-smoke-probe', version: '0.0.0' },
          },
        },
        6000,
      );
      const ok = Boolean(
        res &&
          typeof res === 'object' &&
          res.result &&
          typeof (res.result as { serverInfo?: unknown }).serverInfo !== 'undefined',
      );
      if (ok) return true;
    } catch {
      // ignore and backoff
    }
    await new Promise((r) => setTimeout(r, 500 + i * 500));
  }
  return false;
}

async function streamProbe(url: string, request: MCPRequest, timeoutMs = 8000): Promise<boolean> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    const ct = String(res.headers.get('content-type') || '');
    if (!ct.includes('application/json')) {
      return Promise.reject(new Error(`Stream probe failed: content-type=${ct}`));
    }
    const reader = res.body?.getReader();
    if (!reader) return Promise.reject(new Error('No stream reader available'));
    let sawStart = false;
    let sawMessage = false;
    let sawEnd = false;
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += new TextDecoder().decode(value);
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
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
      if (sawStart && sawMessage && sawEnd) break;
    }
    return sawStart && sawMessage && sawEnd;
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  let mem: ChildProcess | null = null;
  let mcp: ChildProcess | null = null;
  const cwd = process.cwd();

  // Startup banner to verify the HTTP-only readiness harness is running
  console.log(
    `→ Runtime Smoke (HTTP-only readiness) starting...\n  mem: ${memHealth} | readyz: ${memReadyz}\n  mcp: ${mcpHealthUrl()} | info: ${mcpInfoUrl()} | url: ${mcpRpcUrl()}\n  stream: ${mcpStreamUrl()}`,
  );

  // Pre-check: are they already up?
  const memUp = await waitReady(memHealth, 1000, 250);
  const mcpUp = await waitAnyReady(
    buildMcpCandidates(mcpBase).map((b) => `${b}/health`),
    1500,
    300,
  );

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
          memHost,
          '--port',
          String(memPort),
        ],
        cwd,
      );
      // Wait for memory full readiness before starting MCP to avoid seeding races
      const readyzOk = await waitReady(memReadyz, 45000, 500);
      if (!readyzOk) throw new Error('Memory server not ready (/readyz)');
    }
    // If memory was already up, still ensure readyz before bringing up MCP
    if (memUp) {
      await waitReady(memReadyz, 20000, 500);
    }

    if (!mcpUp) {
      // Start MCP via local tsx binary or ts-node/register fallback (no reliance on npx)
      mcp = startMcpServer(cwd);
      // Wait for startup banner or endpoint lines to appear before probing
      await waitForChildOutput(
        mcp,
        /(Unified MCP Server Started Successfully!|HTTP MCP Endpoint:|Ready for VS Code Copilot Chat)/,
        25000,
      );
    }

    // Small settle delay to allow bind to complete on Windows
    if (!mcpUp) await new Promise((r) => setTimeout(r, 1000));

    // Wait readiness (memory)
    const memReady = await waitReady(memHealth, 30000, 500);
    if (!memReady) throw new Error('Memory server not ready');

    // Select a reachable MCP base across IPv4/IPv6/localhost variants
    const candidates = buildMcpCandidates(mcpBase);
    const picked = await selectReachableMcpBase(candidates, 25000);
    if (picked) {
      mcpBaseCurrent = picked;
    }
    // MCP readiness (HTTP-only). First quick probe, then robust retries on health/info.
    let mcpReady = await waitAnyReady([mcpHealthUrl(), mcpInfoUrl()], 15000, 800);
    if (!mcpReady) {
      // Attempt direct initialize probe as an alternative readiness signal
      mcpReady = await tryMcpInitializeProbe(mcpRpcUrl(), 3);
    }
    // Final health/info verification with retry loop (Windows binding lag resilience)
    let healthOk = false;
    let infoOk = false;
    // Track last few observations for debugging on failure
    const lastHealth: { status: number; body: string }[] = [];
    const lastInfo: { status: number; body: string }[] = [];
    const healthErrors: string[] = [];
    const infoErrors: string[] = [];
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline && !(healthOk && infoOk)) {
      try {
        const res = await httpGet(mcpHealthUrl(), 2000);
        // Capture a small snippet for visibility when failing
        lastHealth.push({ status: res.status, body: (res.body || '').slice(0, 200) });
        if (lastHealth.length > 5) lastHealth.shift();
        const json = JSON.parse(res.body || '{}');
        healthOk = json && json.status === 'healthy';
      } catch (e) {
        healthErrors.push((e as Error)?.message || String(e));
        if (healthErrors.length > 5) healthErrors.shift();
      }
      try {
        const res = await httpGet(mcpInfoUrl(), 2000);
        lastInfo.push({ status: res.status, body: (res.body || '').slice(0, 200) });
        if (lastInfo.length > 5) lastInfo.shift();
        const json = JSON.parse(res.body || '{}');
        infoOk = Boolean(json && json.server && json.server.version);
      } catch (e) {
        infoErrors.push((e as Error)?.message || String(e));
        if (infoErrors.length > 5) infoErrors.shift();
      }
      if (!(healthOk && infoOk)) await new Promise((r) => setTimeout(r, 800));
    }
    mcpReady = mcpReady || (healthOk && infoOk);
    if (!mcpReady) {
      console.error('⚠️ MCP readiness diagnostics:');
      if (lastHealth.length) {
        const h = lastHealth[lastHealth.length - 1];
        console.error(`  /health last -> status=${h.status}, body=${JSON.stringify(h.body)}`);
      } else {
        console.error('  /health: no responses captured');
      }
      if (lastInfo.length) {
        const i = lastInfo[lastInfo.length - 1];
        console.error(`  /info last -> status=${i.status}, body=${JSON.stringify(i.body)}`);
      } else {
        console.error('  /info: no responses captured');
      }
      if (healthErrors.length) console.error(`  /health errors: ${healthErrors.join(' | ')}`);
      if (infoErrors.length) console.error(`  /info errors: ${infoErrors.join(' | ')}`);
      throw new Error('MCP server not ready');
    }

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
    const healthJson = JSON.parse((await httpGet(mcpHealthUrl(), 5000)).body || '{}');
    if (healthJson.status !== 'healthy') throw new Error('MCP /health not healthy');
    // Info
    const infoJson = JSON.parse((await httpGet(mcpInfoUrl(), 5000)).body || '{}');
    if (!infoJson.server || !infoJson.server.version)
      throw new Error('MCP /info missing server metadata');

    // MCP initialize
    const initRes = await httpPostJson(mcpRpcUrl(), {
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
    const tools = await httpPostJson(mcpRpcUrl(), { jsonrpc: '2.0', id: 2, method: 'tools/list' });
    const toolsOk = Boolean(
      tools &&
        typeof tools === 'object' &&
        tools.result &&
        Array.isArray((tools.result as { tools?: unknown[] }).tools),
    );
    if (!toolsOk) throw new Error('MCP tools/list failed');

    // MCP streaming probe: verify NDJSON meta/message/end on /mcp/stream
    const streamOk = await streamProbe(
      mcpStreamUrl(),
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
