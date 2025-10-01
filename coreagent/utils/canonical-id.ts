/**
 * Canonical ID generation utility (dependency-light)
 * Shared across core and VS Code extension to avoid parallel implementations.
 *
 * Format: `${prefix}_${unix}_${suffix}` where prefix = type or `${type}_${context}`
 */
import { createUnifiedTimestamp } from './UnifiedBackboneService';

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
  // Canonical time: Use createUnifiedTimestamp() instead of Date.now()
  const ts = typeof unixFallback === 'number' ? unixFallback : createUnifiedTimestamp().unix;
  return ts.toString(36);
}

export function createCanonicalId(type: string, context?: string, unix?: number): string {
  // Canonical time: Use createUnifiedTimestamp() instead of Date.now()
  const ts = typeof unix === 'number' ? unix : createUnifiedTimestamp().unix;
  const prefix = context ? `${type}_${context}` : type;
  const suffix = secureRandomSuffix(ts);
  return `${prefix}_${ts}_${suffix}`;
}
