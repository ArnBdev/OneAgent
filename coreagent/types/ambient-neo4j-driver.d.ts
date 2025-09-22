// Ambient module declaration for optional 'neo4j-driver'
// This allows dynamic import without installing the package by providing minimal shape.
// If the real package is installed, its own types (if present) will override.
declare module 'neo4j-driver' {
  // Lightweight auth + driver surface we actually use
  export const auth: { basic: (u: string, p: string) => unknown };
  export function driver(
    url: string,
    authToken?: unknown,
  ): {
    session: () => {
      run: (q: string, params?: Record<string, unknown>) => Promise<{ records?: unknown[] }>;
      close: () => Promise<void>;
    };
    close: () => Promise<void>;
  };
}
