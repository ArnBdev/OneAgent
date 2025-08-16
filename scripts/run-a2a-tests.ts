/**
 * A2A Tests Runner
 * - Ensures memory server is running (starts if needed)
 * - Runs canonical A2A tests sequentially in child processes
 * - Cleans up any started processes
 */
import { spawn, ChildProcess } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';

const MEM_PORT = Number(process.env.ONEAGENT_MEMORY_PORT || 8010);
const memHealth = `http://127.0.0.1:${MEM_PORT}/health`;

function httpGet(url: string, timeoutMs = 3000): Promise<number> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'GET', timeout: timeoutMs }, res => {
      res.resume();
      resolve(res.statusCode || 0);
    });
    req.on('error', reject);
    req.end();
  });
}

async function waitReady(url: string, totalMs = 30000, stepMs = 500): Promise<boolean> {
  const deadline = Date.now() + totalMs;
  while (Date.now() < deadline) {
    try {
      const status = await httpGet(url, stepMs);
      if (status >= 200 && status < 500) return true; // socket open
    } catch {
      // ignore
    }
    await new Promise(r => setTimeout(r, stepMs));
  }
  return false;
}

function run(cmd: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): ChildProcess {
  const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: false, env: { ...process.env, ...(env || {}) } });
  return child;
}

async function main() {
  const cwd = process.cwd();
  let mem: ChildProcess | null = null;

  // Ensure MEM0/GEMINI keys exist for memory writes
  if (!process.env.MEM0_API_KEY) process.env.MEM0_API_KEY = 'a2a-test-key';
  if (!process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = 'dummy-a2a-key';

  const preUp = await waitReady(memHealth, 1000, 250);
  try {
    if (!preUp) {
      // Start memory via uvicorn, pointing app-dir to servers
      mem = run('python', ['-m', 'uvicorn', 'oneagent_memory_server:app', '--app-dir', 'servers', '--host', '127.0.0.1', '--port', String(MEM_PORT)], cwd);
    }
    const ready = await waitReady(memHealth, 30000, 500);
    if (!ready) throw new Error('Memory server not ready for A2A tests');

    // Resolve ts-node/register
    let tsNodeRegister: string;
    try {
      tsNodeRegister = require.resolve('ts-node/register');
    } catch {
      throw new Error('ts-node/register not found');
    }

    // Run tests sequentially in child processes (tests call process.exit)
    const tests = [
      path.join('tests', 'canonical', 'communication-conformance.test.ts'),
      path.join('tests', 'canonical', 'communication-invariants.test.ts'),
    ];

    for (const test of tests) {
      const code = await new Promise<number>((resolve) => {
        const child = run(
          process.execPath,
          ['-r', tsNodeRegister, test],
          cwd,
          {
            ONEAGENT_FAST_TEST_MODE: '1',
            ONEAGENT_DISABLE_AUTO_MONITORING: '1',
            ONEAGENT_SILENCE_COMM_LOGS: '1'
          }
        );
        child.on('exit', (c) => resolve(c === null ? 1 : c));
      });
      if (code !== 0) {
        throw new Error(`Test failed: ${test} (exit code ${code})`);
      }
    }
    console.log('✓ A2A tests passed');
  } finally {
    if (mem) {
      try { mem.kill(); } catch { /* ignore */ }
    }
  }
}

main().catch(err => {
  console.error('A2A tests runner failed:', err);
  process.exit(1);
});
