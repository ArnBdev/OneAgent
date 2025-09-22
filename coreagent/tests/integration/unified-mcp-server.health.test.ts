import request from 'supertest';
import { app } from '../../server/unified-mcp-server';

describe('/health endpoint', () => {
  it('returns basic health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('server');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('initialized');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('constitutionalAI', true);
    expect(res.body).toHaveProperty('bmadFramework', true);
    expect(res.body).toHaveProperty('protocolVersion');
  });

  it('returns detailed health with ?details=true', async () => {
    const res = await request(app).get('/health?details=true');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('health');
    expect(res.body).toHaveProperty('metrics');
    expect(res.body.metrics).toHaveProperty('activeConnections');
    expect(res.body).toHaveProperty('server');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('timestamp');
  });
});
