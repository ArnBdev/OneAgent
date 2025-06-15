"use strict";
/**
 * SecureErrorHandler - Sanitized error responses for OneAgent
 * Part of Level 2.5 Security Foundation (Phase 1a)
 *
 * Provides secure error handling that prevents information leakage while maintaining debugging capabilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSecureErrorHandler = exports.SecureErrorHandler = void 0;
const auditLogger_1 = require("../audit/auditLogger");
class SecureErrorHandler {
    constructor(config, auditLogger) {
        this.config = {
            includeDebugInfo: process.env.NODE_ENV === 'development',
            sanitizeStackTraces: true,
            maxErrorMessageLength: 500,
            enableDetailedLogging: true,
            ...config
        };
        this.auditLogger = auditLogger || auditLogger_1.defaultAuditLogger;
    }
    /**
     * Handles and formats errors securely
     */
    async handleError(error, context = {}) {
        const timestamp = new Date().toISOString();
        const requestId = context.requestId || this.generateRequestId();
        // Determine error category and code
        const { category, code } = this.categorizeError(error);
        // Sanitize error message
        const sanitizedMessage = this.sanitizeErrorMessage(error.message || 'An unexpected error occurred');
        // Log the error for internal tracking
        if (this.config.enableDetailedLogging) {
            await this.auditLogger.logError('ERROR_HANDLER', `${category}:${code} - ${sanitizedMessage}`, {
                ...context,
                requestId,
                originalError: error.message,
                stack: this.config.sanitizeStackTraces ? this.sanitizeStackTrace(error.stack) : error.stack,
                errorName: error.name,
                errorCode: error.code
            });
        }
        // Build secure response
        const response = {
            success: false,
            error: {
                code,
                message: sanitizedMessage,
                category,
                requestId,
                timestamp
            }
        };
        // Add debug info in development mode
        if (this.config.includeDebugInfo) {
            response.debug = {
                stack: this.config.sanitizeStackTraces
                    ? this.sanitizeStackTrace(error.stack)
                    : error.stack,
                details: {
                    name: error.name,
                    code: error.code,
                    ...context
                }
            };
        }
        return response;
    }
    /**
     * Handles validation errors specifically
     */
    async handleValidationError(errors, warnings, context = {}) {
        const validationError = new Error(`Validation failed: ${errors.join(', ')}`);
        validationError.name = 'ValidationError';
        validationError.code = 'VALIDATION_FAILED';
        validationError.errors = errors;
        validationError.warnings = warnings;
        return this.handleError(validationError, context);
    }
    /**
     * Handles authentication errors
     */
    async handleAuthError(message = 'Authentication required', context = {}) {
        const authError = new Error(message);
        authError.name = 'AuthenticationError';
        authError.code = 'AUTH_REQUIRED';
        return this.handleError(authError, context);
    }
    /**
     * Handles network/external service errors
     */
    async handleNetworkError(serviceName, originalError, context = {}) {
        const networkError = new Error(`Service ${serviceName} is temporarily unavailable`);
        networkError.name = 'NetworkError';
        networkError.code = 'SERVICE_UNAVAILABLE';
        networkError.serviceName = serviceName;
        networkError.originalError = originalError.message;
        return this.handleError(networkError, context);
    }
    /**
     * Categorizes errors for appropriate handling
     */
    categorizeError(error) {
        if (error.name === 'ValidationError' || error.code === 'VALIDATION_FAILED') {
            return { category: 'VALIDATION', code: 'VALIDATION_FAILED' };
        }
        if (error.name === 'AuthenticationError' || error.code === 'AUTH_REQUIRED') {
            return { category: 'AUTHENTICATION', code: 'AUTH_REQUIRED' };
        }
        if (error.name === 'AuthorizationError' || error.code === 'ACCESS_DENIED') {
            return { category: 'AUTHORIZATION', code: 'ACCESS_DENIED' };
        }
        if (error.name === 'NetworkError' || error.code === 'SERVICE_UNAVAILABLE') {
            return { category: 'NETWORK', code: 'SERVICE_UNAVAILABLE' };
        }
        if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
            return { category: 'TIMEOUT', code: 'REQUEST_TIMEOUT' };
        }
        // Default to internal error
        return { category: 'INTERNAL', code: 'INTERNAL_ERROR' };
    }
    /**
     * Sanitizes error messages to prevent information leakage
     */
    sanitizeErrorMessage(message) {
        if (!message || typeof message !== 'string') {
            return 'An unexpected error occurred';
        }
        // Truncate long messages
        let sanitized = message.length > this.config.maxErrorMessageLength
            ? message.substring(0, this.config.maxErrorMessageLength) + '...'
            : message;
        // Remove potentially sensitive information
        sanitized = sanitized
            .replace(/password[s]?[\s]*[:=][\s]*[^\s]+/gi, 'password: [REDACTED]')
            .replace(/token[s]?[\s]*[:=][\s]*[^\s]+/gi, 'token: [REDACTED]')
            .replace(/key[s]?[\s]*[:=][\s]*[^\s]+/gi, 'key: [REDACTED]')
            .replace(/secret[s]?[\s]*[:=][\s]*[^\s]+/gi, 'secret: [REDACTED]')
            .replace(/api[_\-]?key[s]?[\s]*[:=][\s]*[^\s]+/gi, 'api_key: [REDACTED]')
            .replace(/\/[a-zA-Z]:[\\\/].*/g, '[PATH_REDACTED]') // Windows paths
            .replace(/\/home\/[^\s]*/g, '[PATH_REDACTED]') // Unix paths
            .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]'); // IP addresses
        return sanitized;
    }
    /**
     * Sanitizes stack traces to remove sensitive path information
     */
    sanitizeStackTrace(stack) {
        if (!stack)
            return undefined;
        return stack
            .split('\n')
            .map(line => {
            // Remove full file paths, keep only filename and line number
            return line.replace(/\s+at\s+.*[\\\/]([^\\\/]+:\d+:\d+)/g, '    at [SANITIZED]/$1');
        })
            .slice(0, 10) // Limit stack trace depth
            .join('\n');
    }
    /**
     * Generates a unique request ID for error tracking
     */
    generateRequestId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } /**
     * Creates a simple success response
     */
    createSuccessResponse(data, requestId) {
        const response = {
            success: true,
            data,
            timestamp: new Date().toISOString()
        };
        if (requestId !== undefined) {
            response.requestId = requestId;
        }
        return response;
    }
    /**
     * Updates error handler configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Gets current error handler statistics
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.SecureErrorHandler = SecureErrorHandler;
// Default singleton instance
exports.defaultSecureErrorHandler = new SecureErrorHandler();
