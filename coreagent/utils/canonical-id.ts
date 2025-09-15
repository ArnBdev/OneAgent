/**
 * Canonical ID generation utility (dependency-light)
 * Shared across core and VS Code extension to avoid parallel implementations.
 *
 * Format: `${prefix}_${unix}_${suffix}` where prefix = type or `${type}_${context}`
 */
export function secureRandomSuffix(unixFallback?: number): string {
  try {
    const anyCrypto = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
    if (anyCrypto && typeof anyCrypto.randomUUID === 'function') {
      return anyCrypto.randomUUID().split('-')[0];
    }
  } catch {
    // ignore and fallback
  }
  // Try Node.js crypto without import cycles
  try {
    type RequireFn = (mod: string) => unknown;
    type NodeCrypto = { randomBytes: (n: number) => { toString: (enc: string) => string } };
    const maybeRequire = (globalThis as unknown as { require?: RequireFn }).require as unknown;
    if (typeof maybeRequire === 'function') {
      const req = maybeRequire as RequireFn;
      const nodeCrypto = req('crypto') as NodeCrypto;
      if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
        return nodeCrypto.randomBytes(6).toString('hex');
      }
    }
  } catch {
    // ignore
  }
  const ts = typeof unixFallback === 'number' ? unixFallback : Math.floor(Date.now() / 1000);
  return ts.toString(36);
}

export function createCanonicalId(type: string, context?: string, unix?: number): string {
  const ts = typeof unix === 'number' ? unix : Math.floor(Date.now() / 1000);
  const prefix = context ? `${type}_${context}` : type;
  const suffix = secureRandomSuffix(ts);
  return `${prefix}_${ts}_${suffix}`;
}
