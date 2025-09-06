import { spawn } from 'child_process';
import path from 'path';

function send(msg: unknown): string {
  const json = JSON.stringify(msg);
  return `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`;
}

describe('MCP STDIO e2e', () => {
  jest.setTimeout(15000);

  it('initialize -> tools/list -> prompts/list works', async () => {
    const serverPath = path.join(process.cwd(), 'coreagent', 'server', 'unified-mcp-stdio.ts');

    const child = spawn(process.execPath, ['-r', 'ts-node/register', serverPath], {
      env: { ...process.env, ONEAGENT_MCP_QUIET: '1', NODE_ENV: 'test' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const chunks: Buffer[] = [];
    child.stdout.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));

    // 1) initialize
    child.stdin.write(
      send({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { clientInfo: { name: 'jest', version: '1.0.0' } },
      }),
    );
    // 2) tools/list
    child.stdin.write(send({ jsonrpc: '2.0', id: 2, method: 'tools/list' }));
    // 3) prompts/list
    child.stdin.write(send({ jsonrpc: '2.0', id: 3, method: 'prompts/list' }));

    await new Promise((r) => setTimeout(r, 2000));

    child.kill();

    const list = chunks as unknown as readonly Uint8Array<ArrayBufferLike>[];
    const output = Buffer.concat(list).toString('utf8');
    expect(output).toContain('Content-Length:');
    expect(output).toContain('"protocolVersion"');
    expect(output).toContain('"tools"');
    expect(output).toContain('"prompts"');
  });
});
