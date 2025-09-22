/**
 * Pluggable Memgraph driver adapter (dynamic load via shim)
 * - Uses optional shim to avoid direct module resolution of 'neo4j-driver'
 * - Keeps base build light; returns null driver when dependency absent
 */
import { getOptionalNeo4j } from './optionalNeo4jShim';
export interface GraphDriverSession {
  run(query: string, params?: Record<string, unknown>): Promise<{ records: unknown[] }>;
  close(): Promise<void>;
}

export interface GraphDriver {
  session(): GraphDriverSession;
  close(): Promise<void>;
}

export async function tryCreateNeo4jDriver(
  url: string,
  username?: string,
  password?: string,
): Promise<GraphDriver | null> {
  const neo4jModule = getOptionalNeo4j();
  if (!neo4jModule) return null;
  try {
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
