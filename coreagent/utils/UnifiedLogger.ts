/**
 * UnifiedLogger
 * Canonical structured logger with level filtering, secret masking, counters & event stream.
 * Integrates with health monitoring (emit 'log' events) – single source of logging truth.
 */
import { EventEmitter } from 'events';
import type { ILogger } from '../types/ILogger';
// IMPORTANT (Anti-Parallel / Anti-Cycle):
// We deliberately avoid a static import of UnifiedBackboneService here because that file
// pulls in monitoring -> health monitoring -> embedding cache -> logger, forming a cycle.
// Instead we resolve timestamp + id generation lazily. This preserves the canonical
// systems while preventing a parallel lightweight time system from being created.

type UnifiedTimestampLike = { iso: string };

let backboneCache: {
  createUnifiedTimestamp?: () => UnifiedTimestampLike;
  createUnifiedId?: (t: string, c?: string) => string;
} | null = null;
// Opportunistic async preload (non-blocking). Failure is harmless; fallback paths handle it.
import('./UnifiedBackboneService')
  .then((mod: unknown) => {
    backboneCache = mod as typeof backboneCache;
  })
  .catch(() => {
    backboneCache = {};
  });

function safeNowIso(): string {
  const loaded = backboneCache;
  try {
    if (loaded?.createUnifiedTimestamp) return loaded.createUnifiedTimestamp().iso;
  } catch {
    /* ignore */
  }
  return new Date().toISOString();
}

function safeGenerateId(prefix: string, context?: string): string {
  const loaded = backboneCache;
  try {
    if (loaded?.createUnifiedId) return loaded.createUnifiedId(prefix, context);
  } catch {
    /* ignore */
  }
  // Prefer UUID v4 when available to avoid ad-hoc time-based ID generation
  try {
    const anyCrypto = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
    if (anyCrypto && typeof anyCrypto.randomUUID === 'function') {
      const short = anyCrypto.randomUUID().split('-')[0];
      return context ? `${prefix}_${context}_${short}` : `${prefix}_${short}`;
    }
  } catch {
    /* ignore */
  }
  // Fallback: retain a low-collision suffix using time only if crypto is unavailable
  const ts = Date.now().toString(36);
  return context ? `${prefix}_${context}_${ts}` : `${prefix}_${ts}`;
}
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LoggerOptions {
  level?: LogLevel;
  json?: boolean; // future structured output toggle
  maskKeys?: string[]; // keys in objects whose values should be masked
}

const DEFAULT_MASK_KEYS = ['authorization', 'apiKey', 'apikey', 'token', 'accessToken'];

function maskSecret(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length <= 12) return '[REDACTED]';
    return `${value.slice(0, 6)}…${value.slice(-4)}`;
  }
  return '[REDACTED]';
}

function redact(obj: unknown, maskKeys: string[]): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => redact(v, maskKeys));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (maskKeys.includes(k.toLowerCase())) {
      out[k] = maskSecret(v);
    } else if (typeof v === 'object' && v !== null) {
      out[k] = redact(v, maskKeys);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export interface UnifiedLogEvent {
  ts: string;
  level: LogLevel;
  message: string;
  meta?: unknown;
  correlationId?: string;
  operationId?: string;
  context?: string;
}

export class UnifiedLogger extends EventEmitter implements ILogger {
  private static instance: UnifiedLogger;
  private level: LogLevel;
  private json: boolean;
  private maskKeys: string[];
  private levelRank: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };
  private counters: Record<LogLevel, number> = { error: 0, warn: 0, info: 0, debug: 0 };
  private correlationId?: string;
  private operationId?: string;
  private contextLabel?: string;

  private constructor(options?: LoggerOptions) {
    super();
    this.level = options?.level || (process.env.ONEAGENT_LOG_LEVEL as LogLevel) || 'info';
    this.json = options?.json ?? process.env.ONEAGENT_LOG_JSON === '1';
    this.maskKeys = (options?.maskKeys || DEFAULT_MASK_KEYS).map((k) => k.toLowerCase());
  }

  static getInstance(options?: LoggerOptions): UnifiedLogger {
    if (!UnifiedLogger.instance) UnifiedLogger.instance = new UnifiedLogger(options);
    return UnifiedLogger.instance;
  }

  /** Create a child logger inheriting config with correlation + operation IDs */
  child(options: {
    correlationId?: string;
    operationId?: string;
    context?: string;
  }): UnifiedLogger {
    const child = new UnifiedLogger({
      level: this.level,
      json: this.json,
      maskKeys: this.maskKeys,
    });
    child.correlationId = options.correlationId || this.correlationId;
    child.operationId = options.operationId || this.operationId;
    child.contextLabel = options.context || this.contextLabel;
    return child;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelRank[level] <= this.levelRank[this.level];
  }

  private write(level: LogLevel, message: string, meta?: unknown) {
    if (!this.shouldLog(level)) return;
    const ts = safeNowIso();
    this.counters[level]++;
    const redacted = meta && redact(meta, this.maskKeys);
    const event: UnifiedLogEvent = {
      ts,
      level,
      message,
      meta: redacted,
      ...(this.correlationId && { correlationId: this.correlationId }),
      ...(this.operationId && { operationId: this.operationId }),
      ...(this.contextLabel && { context: this.contextLabel }),
    };
    this.emit('log', event);
    if (this.json) {
      console.log(JSON.stringify(event));
      return;
    }
    const prefixParts = [`[${level.toUpperCase()}]`, ts];
    if (this.correlationId) prefixParts.push(`corr=${this.correlationId}`);
    if (this.operationId) prefixParts.push(`op=${this.operationId}`);
    if (this.contextLabel) prefixParts.push(`ctx=${this.contextLabel}`);
    const prefix = prefixParts.join(' ');
    if (redacted !== undefined) console.log(`${prefix} ${message}`, redacted);
    else console.log(`${prefix} ${message}`);
  }

  error(message: string, meta?: unknown) {
    this.write('error', message, meta);
  }
  warn(message: string, meta?: unknown) {
    this.write('warn', message, meta);
  }
  info(message: string, meta?: unknown) {
    this.write('info', message, meta);
  }
  debug(message: string, meta?: unknown) {
    this.write('debug', message, meta);
  }

  getCounters() {
    return { ...this.counters };
  }

  setCorrelation(correlationId: string) {
    this.correlationId = correlationId;
  }
  setOperation(operationId: string) {
    this.operationId = operationId;
  }
  setContext(context: string) {
    this.contextLabel = context;
  }

  /** Begin a new logical operation with generated correlation & operation IDs */
  startOperation(options?: { operationName?: string; context?: string }): UnifiedLogger {
    const opId = safeGenerateId('operation', options?.operationName || 'generic');
    const corrId = safeGenerateId('operation', 'corr');
    const child = this.child({
      correlationId: corrId,
      operationId: opId,
      context: options?.context,
    });
    const started = Date.now();
    child.debug('🔄 Operation started', { operationName: options?.operationName || 'generic' });
    // Attach lightweight end helper
    (child as unknown as { endOperation?: () => void }).endOperation = () => {
      const duration = Date.now() - started;
      child.info('✅ Operation completed', {
        operationName: options?.operationName || 'generic',
        durationMs: duration,
      });
    };
    return child;
  }
}

export const unifiedLogger = UnifiedLogger.getInstance();
