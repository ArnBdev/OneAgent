/* eslint-disable */
/**
 * optionalNeo4jShim
 * Safe optional loader for 'neo4j-driver'. Returns null when dependency absent.
 */
export interface OptionalNeo4jModuleLike {
  auth: { basic: (u: string, p: string) => unknown };
  driver: (
    url: string,
    authToken?: unknown,
  ) => {
    session: () => {
      run: (q: string, params?: Record<string, unknown>) => Promise<{ records?: unknown[] }>;
      close: () => Promise<void>;
    };
    close: () => Promise<void>;
  };
}

let cached: OptionalNeo4jModuleLike | null | undefined; // undefined => not attempted yet

let loadPromise: Promise<void> | null = null;

export function getOptionalNeo4j(): OptionalNeo4jModuleLike | null {
  if (cached !== undefined) return cached;
  if (!loadPromise) {
    loadPromise = import('neo4j-driver')
      .then((mod) => {
        cached =
          mod && typeof (mod as unknown as OptionalNeo4jModuleLike).driver === 'function'
            ? (mod as unknown as OptionalNeo4jModuleLike)
            : null;
      })
      .catch(() => {
        cached = null;
      });
  }
  return cached ?? null;
}

export function resetOptionalNeo4jCache(): void {
  cached = undefined;
}
