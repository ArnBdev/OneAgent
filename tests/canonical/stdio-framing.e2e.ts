import net from 'net';
import { spawn } from 'child_process';

function frame(json: object) {
  const body = JSON.stringify(json);
  return `Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`;
}

async function run() {
  // Start stdio server via ts-node unified-main with stdio flag if needed.
  // We launch the stdio transport entry directly.
  const child = spawn(
    process.execPath,
    ['-r', 'ts-node/register', 'coreagent/server/unified-mcp-stdio.ts'],
    {
      env: {
        ...process.env,
        ONEAGENT_STDIO_MODE: '1',
        ONEAGENT_DISABLE_AUTO_MONITORING: '1',
        ONEAGENT_FAST_TEST_MODE: '1',
        NODE_NO_WARNINGS: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );

  const chunks: Buffer[] = [];
  child.stdout.on('data', (d) => chunks.push(Buffer.from(d)));
  const errChunks: Buffer[] = [];
  child.stderr.on('data', (d) => errChunks.push(Buffer.from(d)));

  // Send initialize request
  const initReq = frame({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { clientInfo: { name: 'stdio-framing-e2e', version: '1.0' } },
  });
  child.stdin.write(initReq);

  // Wait briefly and parse one framed response
  const start = Date.now();
  const timeoutMs = 20000;
  const received = await new Promise<Buffer>((resolve, reject) => {
    const timer = setInterval(() => {
      const buf = Buffer.concat(chunks);
      const headerEnd = buf.indexOf('\r\n\r\n');
      if (headerEnd !== -1) {
        const header = buf.subarray(0, headerEnd).toString('utf8');
        const m = /Content-Length:\s*(\d+)/i.exec(header);
        if (m) {
          const len = parseInt(m[1], 10);
          const body = buf.subarray(headerEnd + 4, headerEnd + 4 + len);
          clearInterval(timer);
          resolve(body);
        }
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        reject(new Error('Timed out waiting for framed response'));
      }
    }, 25);
  });

  const text = received.toString('utf8');
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Response body was not valid JSON');
  }
  if (!parsed || parsed.id !== 1 || parsed.jsonrpc !== '2.0') {
    throw new Error('Invalid JSON-RPC response');
  }
  if (!parsed.result || !parsed.result.protocolVersion) {
    throw new Error('Initialize result missing protocolVersion');
  }

  // Ensure stderr only contains diagnostic lines, not raw JSON
  const stderrText = Buffer.concat(errChunks).toString('utf8');
  if (/\{\s*"jsonrpc"\s*:\s*"2.0"/.test(stderrText)) {
    throw new Error('JSON-RPC payload leaked to stderr');
  }

  child.kill('SIGKILL');
  console.log('✅ STDIO framing e2e passed');
}

run().catch((e) => {
  console.error('STDERR (if any) will be printed by the runner terminal.');
  console.error(e?.stack || String(e));
  throw e;
});
