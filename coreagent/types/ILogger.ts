/**
 * ILogger - minimal interface abstraction for the canonical UnifiedLogger.
 * Facilitates future dependency injection without creating a parallel logging system.
 */
export interface ILogger {
  error(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  debug(message: string, meta?: unknown): void;
  child(options: { correlationId?: string; operationId?: string; context?: string }): ILogger;
  startOperation(options?: { operationName?: string; context?: string }): ILogger;
}

export type { ILogger as UnifiedLoggerInterface }; // backward-compatible alias
