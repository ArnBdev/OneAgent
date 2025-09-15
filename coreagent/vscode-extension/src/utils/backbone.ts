// Note: Do NOT statically import from core files outside the extension root to avoid TS rootDir errors.
// Unified backbone utilities for the VS Code extension (canonical-compatible, local-only)

export interface UnifiedTimestamp {
  unix: number;
  utc: string;
  iso: string;
  human: string;
}

// Create unified timestamp matching core OneAgent system
export function createUnifiedTimestamp(): UnifiedTimestamp {
  const now = new Date();
  const unix = Math.floor(now.getTime() / 1000);

  return {
    unix,
    utc: now.toISOString(),
    iso: now.toISOString(),
    human: now.toLocaleString(),
  };
}

// Generate unified ID matching core OneAgent system
export function generateUnifiedId(type: string, context?: string): string {
  const ts = createUnifiedTimestamp().unix;
  const anyCrypto = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
  const suffix = anyCrypto?.randomUUID ? anyCrypto.randomUUID().split('-')[0] : ts.toString(36);
  const prefix = context ? `${type}_${context}` : type;
  return `${prefix}_${ts}_${suffix}`;
}
