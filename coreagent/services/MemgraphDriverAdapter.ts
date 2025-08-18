/**
 * Pluggable Memgraph driver adapter (dynamic load)
 * - Tries to load 'neo4j-driver' at runtime when available
 * - Avoids hard dependency to keep base build light
 */
export interface GraphDriverSession {
  run(query: string, params?: Record<string, unknown>): Promise<{ records: unknown[] }>;
  close(): Promise<void>;
}

export interface GraphDriver {
  session(): GraphDriverSession;
  close(): Promise<void>;
}

type Neo4jLike = {
  auth: { basic: (u: string, p: string) => unknown };
  driver: (
    url: string,
    auth?: unknown,
  ) => {
    session: () => {
      run: (q: string, params?: Record<string, unknown>) => Promise<{ records?: unknown[] }>;
      close: () => Promise<void>;
    };
    close: () => Promise<void>;
  };
};

export async function tryCreateNeo4jDriver(
  url: string,
  username?: string,
  password?: string,
): Promise<GraphDriver | null> {
  try {
    const neo4jModule = (await import('neo4j-driver')) as unknown as Neo4jLike;
    const auth = username ? neo4jModule.auth.basic(username, password ?? '') : undefined;
    const driver = neo4jModule.driver(url, auth);
    return {
      session() {
        const s = driver.session();
        return {
          async run(query: string, params: Record<string, unknown> = {}) {
            const res = await s.run(query, params);
            return { records: Array.isArray(res?.records) ? res.records : [] };
          },
          async close() {
            await s.close();
          },
        };
      },
      async close() {
        await driver.close();
      },
    };
  } catch {
    return null;
  }
}
