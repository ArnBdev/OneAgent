import { UnifiedBackboneService, OneAgentUnifiedBackbone } from '../utils/UnifiedBackboneService';
import * as MemgraphAdapter from './MemgraphDriverAdapter';
import type { GraphDriver } from './MemgraphDriverAdapter';

/**
 * Canonical MemgraphService (Phase 1 scaffold)
 * - Singleton
 * - Reads config from UnifiedBackboneService.config.memgraph
 * - Provides connect(), readQuery(), writeQuery(), close()
 * - Defers actual driver import to future phase to avoid adding deps now
 */
export class MemgraphService {
  private static instance: MemgraphService;
  private connected = false;
  private driver: GraphDriver | null = null;

  private constructor() {}

  public static getInstance(): MemgraphService {
    if (!MemgraphService.instance) {
      MemgraphService.instance = new MemgraphService();
    }
    return MemgraphService.instance;
  }

  /** Return whether memgraph is configured and enabled */
  public isEnabled(): boolean {
    const cfg = UnifiedBackboneService.getResolvedConfig();
    return Boolean(cfg.memgraph?.enabled && cfg.memgraph?.url);
  }

  /** Establish a connection (no-op if disabled). Throws on failure when enabled. */
  public async connect(): Promise<void> {
    const cfg = UnifiedBackboneService.getResolvedConfig();
    if (!cfg.memgraph?.enabled) {
      this.connected = false;
      return; // Graceful no-op when disabled
    }

    try {
      // Attempt to initialize a real driver (optional dependency). If unavailable, remain in no-op mode.
      const driverType = cfg.memgraph.driver ?? 'neo4j';
      if (driverType === 'neo4j') {
        this.driver = await MemgraphAdapter.tryCreateNeo4jDriver(
          cfg.memgraph.url,
          cfg.memgraph.username,
          cfg.memgraph.password,
        );
      }
      // Treat connect as successful even if driver isn't available to preserve Phase 1 behavior
      this.connected = true;
    } catch (err) {
      this.connected = false;
      // Canonical error handling
      OneAgentUnifiedBackbone.getInstance().errorHandler.handleError(
        err instanceof Error ? err : new Error(String(err)),
        {
          component: 'MemgraphService',
          operation: 'connect',
          external: true,
          config: cfg.memgraph,
        },
      );
      throw err;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Optionally create helpful indexes. Duplicate creation errors are ignored.
   * Safe to call multiple times after connect().
   */
  public async ensureIndexes(
    indexes: Array<{ label: string; property: string }> = [{ label: 'Entity', property: 'id' }],
  ): Promise<void> {
    const cfg = UnifiedBackboneService.getResolvedConfig();
    if (!cfg.memgraph?.enabled) return;
    if (!this.connected) await this.connect();
    if (!this.driver) return; // no-op in Phase 1
    const session = this.driver.session();
    try {
      for (const idx of indexes) {
        const cypher = `CREATE INDEX ON :${idx.label}(${idx.property})`;
        try {
          await session.run(cypher, {});
        } catch (e) {
          const msg = (e as Error).message || '';
          // Ignore duplicate/exists errors (behavior inspired by upstream mem0 change #3203)
          if (!/already exists|exists/i.test(msg)) {
            throw e;
          }
        }
      }
    } finally {
      await session.close();
    }
  }

  /** Run a read (MATCH/RETURN) style query. Returns rows as plain objects. */
  public async readQuery<T = Record<string, unknown>>(
    query: string,
    params: Record<string, unknown> = {},
  ): Promise<T[]> {
    const cfg = UnifiedBackboneService.getResolvedConfig();
    if (!cfg.memgraph?.enabled) return [];
    if (!this.connected) await this.connect();

    try {
      if (!this.driver) {
        // Phase 1 default behavior
        void query;
        void params;
        return [] as T[];
      }
      const session = this.driver.session();
      try {
        const res = await session.run(query, params);
        return (Array.isArray(res.records) ? (res.records as T[]) : []) as T[];
      } finally {
        await session.close();
      }
    } catch (err) {
      OneAgentUnifiedBackbone.getInstance().errorHandler.handleError(
        err instanceof Error ? err : new Error(String(err)),
        {
          component: 'MemgraphService',
          operation: 'readQuery',
          external: true,
          query,
        },
      );
      throw err;
    }
  }

  /** Run a write (CREATE/MERGE) style query. Returns summary stats (future). */
  public async writeQuery(
    query: string,
    params: Record<string, unknown> = {},
  ): Promise<{ success: boolean }> {
    const cfg = UnifiedBackboneService.getResolvedConfig();
    if (!cfg.memgraph?.enabled) return { success: false };
    if (!this.connected) await this.connect();

    try {
      if (!this.driver) {
        // Phase 1 default behavior
        void query;
        void params;
        return { success: true };
      }
      const session = this.driver.session();
      try {
        await session.run(query, params);
        return { success: true };
      } finally {
        await session.close();
      }
    } catch (err) {
      OneAgentUnifiedBackbone.getInstance().errorHandler.handleError(
        err instanceof Error ? err : new Error(String(err)),
        {
          component: 'MemgraphService',
          operation: 'writeQuery',
          external: true,
          query,
        },
      );
      throw err;
    }
  }

  /** Close any open connections */
  public async close(): Promise<void> {
    try {
      if (this.driver) {
        await this.driver.close();
        this.driver = null;
      }
      this.connected = false;
    } catch (err) {
      OneAgentUnifiedBackbone.getInstance().errorHandler.handleError(
        err instanceof Error ? err : new Error(String(err)),
        {
          component: 'MemgraphService',
          operation: 'close',
          external: true,
        },
      );
      // Don't rethrow on close
    }
  }
}

export const memgraphService = MemgraphService.getInstance();
