/**
 * OneAgent Level 2 Logger Types
 * Comprehensive logging system with structured logging, performance tracking, and audit trails
 */

/**
 * Log levels for different types of messages
 */
export type LogLevel = 
    | 'debug'
    | 'info'
    | 'warn'
    | 'error'
    | 'critical'
    | 'trace'
    | 'audit';

/**
 * Categories for organizing log messages
 */
export type LogCategory = 
    | 'agent'
    | 'orchestrator'
    | 'memory'
    | 'api'
    | 'security'
    | 'performance'
    | 'user'
    | 'system'
    | 'integration'
    | 'debug';

/**
 * Core log entry structure
 */
export interface LogEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    category: LogCategory;
    message: string;
    context?: LogContext;
    metadata?: LogMetadata;
    source: LogSource;
    sessionId?: string;
    userId?: string;
    agentId?: string;
}

/**
 * Context information for log entries
 */
export interface LogContext {
    operation?: string;
    duration?: number; // in milliseconds
    requestId?: string;
    correlationId?: string;
    parentId?: string;
    tags?: string[];
    environment?: string;
    version?: string;
}

/**
 * Additional metadata for log entries
 */
export interface LogMetadata {
    error?: ErrorDetails;
    performance?: PerformanceMetrics;
    security?: SecurityContext;
    custom?: Record<string, unknown>;
    stackTrace?: string;
    userAgent?: string;
    ipAddress?: string;
}

/**
 * Source information for log entries
 */
export interface LogSource {
    file: string;
    function: string;
    line?: number;
    component: string;
    version?: string;
}

/**
 * Error details for error logs
 */
export interface ErrorDetails {
    name: string;
    message: string;
    code?: string | number;
    stack?: string;
    innerError?: ErrorDetails;
    recoverable: boolean;
    handled: boolean;
}

/**
 * Performance metrics for performance logs
 */
export interface PerformanceMetrics {
    executionTime: number;
    memoryUsage?: number;
    cpuUsage?: number;
    apiCalls?: number;
    cacheHits?: number;
    cacheMisses?: number;
    throughput?: number;
    latency?: number;
}

/**
 * Security context for audit logs
 */
export interface SecurityContext {
    operation: string;
    resource: string;
    permissions: string[];
    outcome: 'success' | 'failure' | 'blocked';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    userRole?: string;
    authentication?: string;
}

/**
 * Configuration for logger behavior
 */
export interface LoggerConfig {
    level: LogLevel;
    categories: LogCategory[];
    outputs: LogOutputConfig[];
    format: LogFormat;
    retention: LogRetentionConfig;
    performance: LogPerformanceConfig;
    security: LogSecurityConfig;
}

/**
 * Configuration for log outputs (console, file, remote, etc.)
 */
export interface LogOutputConfig {
    type: 'console' | 'file' | 'remote' | 'database' | 'custom';
    enabled: boolean;
    level?: LogLevel;
    categories?: LogCategory[];
    options?: Record<string, unknown>;
}

/**
 * Log format configuration
 */
export interface LogFormat {
    template: string;
    dateFormat: string;
    includeMetadata: boolean;
    includeStackTrace: boolean;
    colorize: boolean;
    structured: boolean;
}

/**
 * Log retention configuration
 */
export interface LogRetentionConfig {
    maxAge: number; // in days
    maxSize: number; // in MB
    maxEntries: number;
    compression: boolean;
    archiveLocation?: string;
}

/**
 * Performance configuration for logging
 */
export interface LogPerformanceConfig {
    bufferSize: number;
    flushInterval: number; // in milliseconds
    asyncLogging: boolean;
    batchSize: number;
    maxMemoryUsage: number; // in MB
}

/**
 * Security configuration for logging
 */
export interface LogSecurityConfig {
    encryptLogs: boolean;
    maskSensitiveData: boolean;
    auditTrail: boolean;
    sensitiveFields: string[];
    accessControl: boolean;
}

/**
 * Interface for logger implementations
 */
export interface ILogger {
    debug(message: string, context?: LogContext, metadata?: LogMetadata): void;
    info(message: string, context?: LogContext, metadata?: LogMetadata): void;
    warn(message: string, context?: LogContext, metadata?: LogMetadata): void;
    error(message: string, context?: LogContext, metadata?: LogMetadata): void;
    critical(message: string, context?: LogContext, metadata?: LogMetadata): void;
    trace(message: string, context?: LogContext, metadata?: LogMetadata): void;
    audit(message: string, context?: LogContext, metadata?: LogMetadata): void;
    
    // Utility methods
    startTimer(operation: string): LogTimer;
    logPerformance(operation: string, duration: number, metadata?: PerformanceMetrics): void;
    logError(error: Error, context?: LogContext): void;
    logSecurity(event: string, context: SecurityContext): void;
    
    // Management methods
    setLevel(level: LogLevel): void;
    addCategory(category: LogCategory): void;
    removeCategory(category: LogCategory): void;
    flush(): Promise<void>;
    rotate(): Promise<void>;
}

/**
 * Timer for performance logging
 */
export interface LogTimer {
    stop(): number;
    elapsed(): number;
    mark(label: string): void;
    getMarks(): Array<{label: string, time: number}>;
}

/**
 * Log query interface for searching and filtering logs
 */
export interface LogQuery {
    levels?: LogLevel[];
    categories?: LogCategory[];
    timeRange?: {
        start: Date;
        end: Date;
    };
    sessionId?: string;
    userId?: string;
    agentId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp' | 'level' | 'category';
    sortOrder?: 'asc' | 'desc';
}

/**
 * Result of a log query
 */
export interface LogQueryResult {
    entries: LogEntry[];
    total: number;
    hasMore: boolean;
    query: LogQuery;
    executionTime: number;
}

/**
 * Statistics about log entries
 */
export interface LogStatistics {
    totalEntries: number;
    entriesByLevel: Record<LogLevel, number>;
    entriesByCategory: Record<LogCategory, number>;
    errorRate: number;
    avgResponseTime: number;
    topErrors: Array<{message: string, count: number}>;
    timeDistribution: Array<{hour: number, count: number}>;
}

/**
 * Alert configuration for log monitoring
 */
export interface LogAlert {
    id: string;
    name: string;
    condition: LogAlertCondition;
    actions: LogAlertAction[];
    enabled: boolean;
    cooldown: number; // in minutes
}

/**
 * Condition for triggering log alerts
 */
export interface LogAlertCondition {
    level?: LogLevel;
    category?: LogCategory;
    pattern?: string;
    threshold?: number;
    timeWindow?: number; // in minutes
}

/**
 * Action to take when log alert is triggered
 */
export interface LogAlertAction {
    type: 'email' | 'webhook' | 'slack' | 'sms' | 'console';
    config: Record<string, unknown>;
    enabled: boolean;
}