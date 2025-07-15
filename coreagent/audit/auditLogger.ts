/**
 * SimpleAuditLogger - Asynchronous logging system for OneAgent
 * Part of Level 2.5 Security Foundation (Phase 1a)
 * 
 * Provides audit trail functionality with minimal performance impact.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

export interface AuditLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
  category: string;
  message: string;
  userId?: string;
  sessionId?: string;
  agentType?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface AuditLoggerConfig {
  logDirectory: string;
  maxFileSize: number;
  maxFiles: number;
  enableConsoleOutput: boolean;
  bufferSize: number;
  flushInterval: number;
}

export class SimpleAuditLogger {
  private config: AuditLoggerConfig;
  private logBuffer: AuditLogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor(config?: Partial<AuditLoggerConfig>) {
    this.config = {
      logDirectory: path.join(process.cwd(), 'logs', 'audit'),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      enableConsoleOutput: false,
      bufferSize: 100,
      flushInterval: 5000, // 5 seconds
      ...config
    };

    this.initializeLogger();
  }

  private async initializeLogger(): Promise<void> {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.config.logDirectory, { recursive: true });
      
      // Start flush timer
      this.startFlushTimer();
    } catch (error) {
      console.error('Failed to initialize audit logger:', error);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer().catch(console.error);
    }, this.config.flushInterval);
  }

  /**
   * Logs a general information event
   */
  async logInfo(category: string, message: string, metadata?: Record<string, any>): Promise<void> {
    return this.log('INFO', category, message, metadata);
  }

  /**
   * Logs a warning event
   */
  async logWarning(category: string, message: string, metadata?: Record<string, any>): Promise<void> {
    return this.log('WARN', category, message, metadata);
  }

  /**
   * Logs an error event
   */
  async logError(category: string, message: string, metadata?: Record<string, any>): Promise<void> {
    return this.log('ERROR', category, message, metadata);
  }

  /**
   * Logs a security-related event
   */
  async logSecurity(category: string, message: string, metadata?: Record<string, any>): Promise<void> {
    return this.log('SECURITY', category, message, metadata);
  }

  /**
   * Core logging method - adds to buffer for async processing
   */
  private async log(
    level: AuditLogEntry['level'],
    category: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (this.isShuttingDown) return;

    const entry: AuditLogEntry = {
      timestamp: createUnifiedTimestamp().iso,
      level,
      category,
      message,
      ...metadata
    };

    // Add to buffer (non-blocking)
    this.logBuffer.push(entry);

    // Optional console output for development
    if (this.config.enableConsoleOutput) {
      console.log(`[${entry.timestamp}] ${level}:${category} - ${message}`);
    }

    // Flush if buffer is full
    if (this.logBuffer.length >= this.config.bufferSize) {
      setImmediate(() => this.flushBuffer().catch(console.error));
    }
  }

  /**
   * Logs a request event with common metadata
   */
  async logRequest(
    userId: string,
    sessionId: string,
    agentType: string,
    requestId: string,
    message: string,
    level: AuditLogEntry['level'] = 'INFO'
  ): Promise<void> {
    return this.log(level, 'REQUEST', message, {
      userId,
      sessionId,
      agentType,
      requestId
    });
  }

  /**
   * Logs a validation event
   */
  async logValidation(
    requestId: string,
    isValid: boolean,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    return this.log(
      isValid ? 'INFO' : 'WARN',
      'VALIDATION',
      `Request validation ${isValid ? 'passed' : 'failed'}`,
      {
        requestId,
        isValid,
        errors,
        warnings
      }
    );
  }

  /**
   * Flushes the buffer to disk
   */
  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const entriesToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const logFile = this.getCurrentLogFile();
      const logLines = entriesToFlush.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      
      await fs.appendFile(logFile, logLines, 'utf8');
      
      // Check file size and rotate if necessary
      await this.rotateLogsIfNeeded(logFile);
    } catch (error) {
      console.error('Failed to flush audit log buffer:', error);
      // Put entries back in buffer for retry
      this.logBuffer.unshift(...entriesToFlush);
    }
  }

  /**
   * Gets the current log file path
   */
  private getCurrentLogFile(): string {
    const today = createUnifiedTimestamp().iso.split('T')[0];
    return path.join(this.config.logDirectory, `audit-${today}.log`);
  }

  /**
   * Rotates logs if the current file exceeds max size
   */
  private async rotateLogsIfNeeded(logFile: string): Promise<void> {
    try {
      const stats = await fs.stat(logFile);
      if (stats.size > this.config.maxFileSize) {
        const timestamp = createUnifiedTimestamp().iso.replace(/[:.]/g, '-');
        const rotatedFile = logFile.replace('.log', `-${timestamp}.log`);
        await fs.rename(logFile, rotatedFile);
        
        // Clean up old files
        await this.cleanupOldLogs();
      }
    } catch (error) {
      // File might not exist yet, which is fine
    }
  }

  /**
   * Removes old log files beyond the retention limit
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.logDirectory);
      const logFiles = files
        .filter(f => f.startsWith('audit-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.config.logDirectory, f),
          stats: null as any
        }));

      // Get file stats
      for (const file of logFiles) {
        try {
          file.stats = await fs.stat(file.path);
        } catch (error) {
          continue;
        }
      }

      // Sort by modification time (newest first)
      logFiles
        .filter(f => f.stats)
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())
        .slice(this.config.maxFiles) // Keep only the newest N files
        .forEach(async (file) => {
          try {
            await fs.unlink(file.path);
          } catch (error) {
            console.error(`Failed to delete old log file ${file.name}:`, error);
          }
        });
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * Gracefully shuts down the logger
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    await this.flushBuffer();
  }

  /**
   * Gets current logger statistics
   */
  getStats(): { bufferSize: number; config: AuditLoggerConfig } {
    return {
      bufferSize: this.logBuffer.length,
      config: { ...this.config }
    };
  }
}

// Default singleton instance
export const defaultAuditLogger = new SimpleAuditLogger();
