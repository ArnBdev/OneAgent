import request from 'supertest';
import { app } from '../server/unified-mcp-server';

// Minimal raw parser with relaxed typing for test convenience
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawParser = (res: any, callback: any) => {
  res.setEncoding('utf8');
  let data = '';
  res.on('data', (chunk: string) => {
    data += chunk;
  });
  res.on('end', () => {
    callback(null, data);
  });
};

describe('MCP HTTP stream /mcp/stream', () => {
  it('returns newline-delimited JSON for initialize', async () => {
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { clientInfo: { name: 'jest', version: '1.0.0' } },
    };

    const res = await request(app)
      .post('/mcp/stream')
      .buffer(true)
      .parse(rawParser)
      .send(payload)
      .expect(200);

    const text = (res.text || '').trim();
    // Should contain multiple newline-delimited JSON objects
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(text).toContain('"type":"meta"');
    expect(text).toContain('"event":"start"');
    expect(text).toContain('"jsonrpc":"2.0"');
    expect(text).toContain('"result"');
  });
});
