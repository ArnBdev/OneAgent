/**
 * Simple Audit Logger for OneAgent
 * Provides basic logging functionality for audit trails
 */

export interface AuditEntry {
  timestamp: Date;
  event: string;
  details: any;
  severity: 'info' | 'warning' | 'error';
  source: string;
}

export class SimpleAuditLogger {
  private entries: AuditEntry[] = [];
  private maxEntries: number = 1000;

  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }

  log(event: string, details: any, severity: 'info' | 'warning' | 'error' = 'info', source: string = 'system'): void {
    const entry: AuditEntry = {
      timestamp: new Date(),
      event,
      details,
      severity,
      source
    };

    this.entries.push(entry);

    // Keep only the last maxEntries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Console output for development
    const prefix = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${source}] ${event}:`, details);
  }

  info(event: string, details: any, source?: string): void {
    this.log(event, details, 'info', source);
  }

  warning(event: string, details: any, source?: string): void {
    this.log(event, details, 'warning', source);
  }
  error(event: string, details: any, source?: string): void {
    this.log(event, details, 'error', source);
  }

  // Alias methods for compatibility
  logInfo(event: string, details: any, source?: string): void {
    this.info(event, details, source);
  }

  logWarning(event: string, details: any, source?: string): void {
    this.warning(event, details, source);
  }

  logError(event: string, details: any, source?: string): void {
    this.error(event, details, source);
  }

  getEntries(filter?: { severity?: string; source?: string; since?: Date }): AuditEntry[] {
    let filtered = this.entries;

    if (filter?.severity) {
      filtered = filtered.filter(entry => entry.severity === filter.severity);
    }

    if (filter?.source) {
      filtered = filtered.filter(entry => entry.source === filter.source);
    }

    if (filter?.since) {
      filtered = filtered.filter(entry => entry.timestamp >= filter.since!);
    }

    return filtered;
  }

  clear(): void {
    this.entries = [];
  }

  getStats(): { total: number; info: number; warning: number; error: number } {
    const stats = { total: this.entries.length, info: 0, warning: 0, error: 0 };
    
    this.entries.forEach(entry => {
      stats[entry.severity]++;
    });

    return stats;
  }
}

// Export singleton instance
export const auditLogger = new SimpleAuditLogger();

// Export default as well
export default SimpleAuditLogger;
