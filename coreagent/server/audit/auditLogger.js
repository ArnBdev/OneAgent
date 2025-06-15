"use strict";
/**
 * SimpleAuditLogger - Asynchronous logging system for OneAgent
 * Part of Level 2.5 Security Foundation (Phase 1a)
 *
 * Provides audit trail functionality with minimal performance impact.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultAuditLogger = exports.SimpleAuditLogger = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class SimpleAuditLogger {
    constructor(config) {
        this.logBuffer = [];
        this.flushTimer = null;
        this.isShuttingDown = false;
        this.config = {
            logDirectory: path_1.default.join(process.cwd(), 'logs', 'audit'),
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 10,
            enableConsoleOutput: false,
            bufferSize: 100,
            flushInterval: 5000, // 5 seconds
            ...config
        };
        this.initializeLogger();
    }
    async initializeLogger() {
        try {
            // Ensure log directory exists
            await fs_1.promises.mkdir(this.config.logDirectory, { recursive: true });
            // Start flush timer
            this.startFlushTimer();
        }
        catch (error) {
            console.error('Failed to initialize audit logger:', error);
        }
    }
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flushBuffer().catch(console.error);
        }, this.config.flushInterval);
    }
    /**
     * Logs a general information event
     */
    async logInfo(category, message, metadata) {
        return this.log('INFO', category, message, metadata);
    }
    /**
     * Logs a warning event
     */
    async logWarning(category, message, metadata) {
        return this.log('WARN', category, message, metadata);
    }
    /**
     * Logs an error event
     */
    async logError(category, message, metadata) {
        return this.log('ERROR', category, message, metadata);
    }
    /**
     * Logs a security-related event
     */
    async logSecurity(category, message, metadata) {
        return this.log('SECURITY', category, message, metadata);
    }
    /**
     * Core logging method - adds to buffer for async processing
     */
    async log(level, category, message, metadata) {
        if (this.isShuttingDown)
            return;
        const entry = {
            timestamp: new Date().toISOString(),
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
    async logRequest(userId, sessionId, agentType, requestId, message, level = 'INFO') {
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
    async logValidation(requestId, isValid, errors, warnings) {
        return this.log(isValid ? 'INFO' : 'WARN', 'VALIDATION', `Request validation ${isValid ? 'passed' : 'failed'}`, {
            requestId,
            isValid,
            errors,
            warnings
        });
    }
    /**
     * Flushes the buffer to disk
     */
    async flushBuffer() {
        if (this.logBuffer.length === 0)
            return;
        const entriesToFlush = [...this.logBuffer];
        this.logBuffer = [];
        try {
            const logFile = this.getCurrentLogFile();
            const logLines = entriesToFlush.map(entry => JSON.stringify(entry)).join('\n') + '\n';
            await fs_1.promises.appendFile(logFile, logLines, 'utf8');
            // Check file size and rotate if necessary
            await this.rotateLogsIfNeeded(logFile);
        }
        catch (error) {
            console.error('Failed to flush audit log buffer:', error);
            // Put entries back in buffer for retry
            this.logBuffer.unshift(...entriesToFlush);
        }
    }
    /**
     * Gets the current log file path
     */
    getCurrentLogFile() {
        const today = new Date().toISOString().split('T')[0];
        return path_1.default.join(this.config.logDirectory, `audit-${today}.log`);
    }
    /**
     * Rotates logs if the current file exceeds max size
     */
    async rotateLogsIfNeeded(logFile) {
        try {
            const stats = await fs_1.promises.stat(logFile);
            if (stats.size > this.config.maxFileSize) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const rotatedFile = logFile.replace('.log', `-${timestamp}.log`);
                await fs_1.promises.rename(logFile, rotatedFile);
                // Clean up old files
                await this.cleanupOldLogs();
            }
        }
        catch (error) {
            // File might not exist yet, which is fine
        }
    }
    /**
     * Removes old log files beyond the retention limit
     */
    async cleanupOldLogs() {
        try {
            const files = await fs_1.promises.readdir(this.config.logDirectory);
            const logFiles = files
                .filter(f => f.startsWith('audit-') && f.endsWith('.log'))
                .map(f => ({
                name: f,
                path: path_1.default.join(this.config.logDirectory, f),
                stats: null
            }));
            // Get file stats
            for (const file of logFiles) {
                try {
                    file.stats = await fs_1.promises.stat(file.path);
                }
                catch (error) {
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
                    await fs_1.promises.unlink(file.path);
                }
                catch (error) {
                    console.error(`Failed to delete old log file ${file.name}:`, error);
                }
            });
        }
        catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }
    /**
     * Gracefully shuts down the logger
     */
    async shutdown() {
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
    getStats() {
        return {
            bufferSize: this.logBuffer.length,
            config: { ...this.config }
        };
    }
}
exports.SimpleAuditLogger = SimpleAuditLogger;
// Default singleton instance
exports.defaultAuditLogger = new SimpleAuditLogger();
