import { MemgraphService } from '../../services/MemgraphService';
import { UnifiedBackboneService } from '../../utils/UnifiedBackboneService';
import * as MemgraphAdapter from '../../services/MemgraphDriverAdapter';
import type { GraphDriver } from '../../services/MemgraphDriverAdapter';
import type { ServerConfig } from '../../config';

function setConfigProvider(config: ServerConfig) {
  (
    globalThis as unknown as { __unifiedConfigProvider?: { getConfig: () => ServerConfig } }
  ).__unifiedConfigProvider = { getConfig: () => config };
  UnifiedBackboneService.refreshConfigSnapshot();
}

describe('MemgraphService (Phase 1 scaffold)', () => {
  it('is disabled by default when no MEMGRAPH_URL is set', () => {
    const base = UnifiedBackboneService.getResolvedConfig();
    setConfigProvider({ ...base, memgraph: { enabled: false, url: '' } });
    const svc = MemgraphService.getInstance();
    expect(svc.isEnabled()).toBe(false);
  });

  it('connect is a no-op when disabled and queries return safe defaults', async () => {
    const base = UnifiedBackboneService.getResolvedConfig();
    setConfigProvider({ ...base, memgraph: { enabled: false, url: '' } });
    const svc = MemgraphService.getInstance();
    await expect(svc.connect()).resolves.toBeUndefined();
    expect(svc.isConnected()).toBe(false);
    await expect(svc.readQuery('MATCH (n) RETURN n')).resolves.toEqual([]);
    await expect(svc.writeQuery('CREATE (n:Test {id: 1})')).resolves.toEqual({ success: false });
  });

  it('enables when config.memgraph is set (simulated) and writeQuery returns success', async () => {
    // Simulate enabling via config snapshot mutation using a typed copy
    const original = UnifiedBackboneService.getResolvedConfig();
    const updated: ServerConfig = {
      ...original,
      memgraph: {
        enabled: true,
        url: 'bolt://localhost:7687',
        username: '',
        password: '',
        driver: 'memgraph',
      },
    };
    setConfigProvider(updated);

    const svc = MemgraphService.getInstance();
    expect(svc.isEnabled()).toBe(true);
    await svc.connect();
    expect(svc.isConnected()).toBe(true);
    const res = await svc.writeQuery('CREATE (n:Ping {ok: true})');
    expect(res).toEqual({ success: true });
    await svc.close();
    expect(svc.isConnected()).toBe(false);
  });

  it('readQuery returns [] when enabled but driver module is absent', async () => {
    const original = UnifiedBackboneService.getResolvedConfig();
    setConfigProvider({
      ...original,
      memgraph: { enabled: true, url: 'bolt://localhost:7687', driver: 'memgraph' },
    });
    const svc = MemgraphService.getInstance();
    await svc.close();
    await svc.connect();
    const rows = await svc.readQuery('MATCH (n) RETURN n');
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(0);
  });

  it('writeQuery executes via driver session when a compatible driver is available (mocked)', async () => {
    const original = UnifiedBackboneService.getResolvedConfig();
    setConfigProvider({
      ...original,
      memgraph: { enabled: true, url: 'bolt://localhost:7687', driver: 'neo4j' },
    });

    // Mock the adapter factory to return a fake driver
    const fakeDriver: GraphDriver = {
      session() {
        return {
          async run() {
            return { records: [] };
          },
          async close() {
            return undefined;
          },
        };
      },
      async close() {
        return undefined;
      },
    };
    jest.spyOn(MemgraphAdapter, 'tryCreateNeo4jDriver').mockResolvedValue(fakeDriver);

    const svc = MemgraphService.getInstance();
    await svc.close();
    await svc.connect();
    const res = await svc.writeQuery('CREATE (n {id: 1})', { id: 1 });
    expect(res).toEqual({ success: true });
    await svc.close();
    jest.restoreAllMocks();
  });
});
