/**
 * SecureErrorHandler - Sanitized error responses for OneAgent
 * Part of Level 2.5 Security Foundation (Phase 1a)
 *
 * Provides secure error handling that prevents information leakage while maintaining debugging capabilities.
 */

import { SimpleAuditLogger, defaultAuditLogger } from '../audit/auditLogger';
import { createUnifiedTimestamp, createUnifiedId } from './UnifiedBackboneService';

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  agentType?: string;
  operation?: string;
  timestamp?: string;
}

export interface SecureErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    category:
      | 'VALIDATION'
      | 'AUTHENTICATION'
      | 'AUTHORIZATION'
      | 'INTERNAL'
      | 'NETWORK'
      | 'TIMEOUT';
    requestId?: string;
    timestamp: string;
  };
  debug?: {
    stack?: string;
    details?: Record<string, unknown>;
  };
}

export interface ErrorHandlerConfig {
  includeDebugInfo: boolean;
  sanitizeStackTraces: boolean;
  maxErrorMessageLength: number;
  enableDetailedLogging: boolean;
}

export class SecureErrorHandler {
  private config: ErrorHandlerConfig;
  private auditLogger: SimpleAuditLogger;

  constructor(config?: Partial<ErrorHandlerConfig>, auditLogger?: SimpleAuditLogger) {
    this.config = {
      includeDebugInfo: process.env.NODE_ENV === 'development',
      sanitizeStackTraces: true,
      maxErrorMessageLength: 500,
      enableDetailedLogging: true,
      ...config,
    };

    this.auditLogger = auditLogger || defaultAuditLogger;
  }

  /**
   * Handles and formats errors securely
   */
  async handleError(error: unknown, context: ErrorContext = {}): Promise<SecureErrorResponse> {
    const timestamp = createUnifiedTimestamp();
    const requestId = context.requestId || this.generateRequestId();

    // Determine error category and code
    const { category, code } = this.categorizeError(error);
    const errInfo = this.toErrorInfo(error);

    // Sanitize error message
    const sanitizedMessage = this.sanitizeErrorMessage(
      errInfo.message || 'An unexpected error occurred',
    );

    // Log the error for internal tracking
    if (this.config.enableDetailedLogging) {
      await this.auditLogger.logError(
        'ERROR_HANDLER',
        `${category}:${code} - ${sanitizedMessage}`,
        {
          ...context,
          requestId,
          originalError: errInfo.message,
          stack: this.config.sanitizeStackTraces
            ? this.sanitizeStackTrace(errInfo.stack)
            : errInfo.stack,
          errorName: errInfo.name,
          errorCode: errInfo.code,
        },
      );
    }

    // Build secure response
    const response: SecureErrorResponse = {
      success: false,
      error: {
        code,
        message: sanitizedMessage,
        category,
        requestId,
        timestamp: timestamp.iso,
      },
    };

    // Add debug info in development mode
    if (this.config.includeDebugInfo) {
      response.debug = {
        stack: this.config.sanitizeStackTraces
          ? this.sanitizeStackTrace(errInfo.stack)
          : errInfo.stack,
        details: {
          name: errInfo.name,
          code: errInfo.code,
          ...context,
        },
      };
    }

    return response;
  }

  /**
   * Handles validation errors specifically
   */
  async handleValidationError(
    errors: string[],
    warnings: string[],
    context: ErrorContext = {},
  ): Promise<SecureErrorResponse> {
    const validationError = new Error(`Validation failed: ${errors.join(', ')}`);
    validationError.name = 'ValidationError';
    this.attachProps(validationError, { code: 'VALIDATION_FAILED', errors, warnings });

    return this.handleError(validationError, context);
  }

  /**
   * Handles authentication errors
   */
  async handleAuthError(
    message: string = 'Authentication required',
    context: ErrorContext = {},
  ): Promise<SecureErrorResponse> {
    const authError = new Error(message);
    authError.name = 'AuthenticationError';
    this.attachProps(authError, { code: 'AUTH_REQUIRED' });

    return this.handleError(authError, context);
  }

  /**
   * Handles network/external service errors
   */
  async handleNetworkError(
    serviceName: string,
    originalError: Error,
    context: ErrorContext = {},
  ): Promise<SecureErrorResponse> {
    const networkError = new Error(`Service ${serviceName} is temporarily unavailable`);
    networkError.name = 'NetworkError';
    this.attachProps(networkError, {
      code: 'SERVICE_UNAVAILABLE',
      serviceName,
      originalError: originalError.message,
    });

    return this.handleError(networkError, context);
  }

  /**
   * Categorizes errors for appropriate handling
   */
  private categorizeError(error: unknown): {
    category: SecureErrorResponse['error']['category'];
    code: string;
  } {
    const { name, code } = this.toBasicErrorInfo(error);
    if (name === 'ValidationError' || code === 'VALIDATION_FAILED') {
      return { category: 'VALIDATION', code: 'VALIDATION_FAILED' };
    }

    if (name === 'AuthenticationError' || code === 'AUTH_REQUIRED') {
      return { category: 'AUTHENTICATION', code: 'AUTH_REQUIRED' };
    }

    if (name === 'AuthorizationError' || code === 'ACCESS_DENIED') {
      return { category: 'AUTHORIZATION', code: 'ACCESS_DENIED' };
    }

    if (name === 'NetworkError' || code === 'SERVICE_UNAVAILABLE') {
      return { category: 'NETWORK', code: 'SERVICE_UNAVAILABLE' };
    }

    if (name === 'TimeoutError' || code === 'TIMEOUT') {
      return { category: 'TIMEOUT', code: 'REQUEST_TIMEOUT' };
    }

    // Default to internal error
    return { category: 'INTERNAL', code: 'INTERNAL_ERROR' };
  }

  /**
   * Sanitizes error messages to prevent information leakage
   */
  private sanitizeErrorMessage(message: string): string {
    if (!message || typeof message !== 'string') {
      return 'An unexpected error occurred';
    }

    // Truncate long messages
    let sanitized =
      message.length > this.config.maxErrorMessageLength
        ? message.substring(0, this.config.maxErrorMessageLength) + '...'
        : message;

    // Remove potentially sensitive information
    sanitized = sanitized
      .replace(/passwords?[\s]*[:=][\s]*[^\s]+/gi, 'password: [REDACTED]')
      .replace(/tokens?[\s]*[:=][\s]*[^\s]+/gi, 'token: [REDACTED]')
      .replace(/keys?[\s]*[:=][\s]*[^\s]+/gi, 'key: [REDACTED]')
      .replace(/secrets?[\s]*[:=][\s]*[^\s]+/gi, 'secret: [REDACTED]')
      .replace(/api[_-]?keys?[\s]*[:=][\s]*[^\s]+/gi, 'api_key: [REDACTED]')
      .replace(/[A-Za-z]:[\\/][^\s]*/g, '[PATH_REDACTED]') // Windows paths anywhere in string
      .replace(new RegExp(String.raw`/home/\S*`, 'g'), '[PATH_REDACTED]') // Unix paths
      .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '[IP_REDACTED]'); // IP addresses

    return sanitized;
  }

  /**
   * Sanitizes stack traces to remove sensitive path information
   */
  private sanitizeStackTrace(stack?: string): string | undefined {
    if (!stack) return undefined;

    return stack
      .split('\n')
      .map((line) => {
        // Remove full file paths, keep only filename and line number
        return line.replace(/\s+at\s+.*[\\/]([^\\/]+:\d+:\d+)/g, '    at [SANITIZED]/$1');
      })
      .slice(0, 10) // Limit stack trace depth
      .join('\n');
  }

  /**
   * Generates a unique request ID for error tracking
   */
  private generateRequestId(): string {
    return createUnifiedId('error', 'request_tracking');
  }

  /**
   * Creates a simple success response
   */
  createSuccessResponse<T>(
    data: T,
    requestId?: string,
  ): { success: true; data: T; requestId?: string; timestamp: string } {
    const timestamp = createUnifiedTimestamp();
    const response: { success: true; data: T; requestId?: string; timestamp: string } = {
      success: true,
      data,
      timestamp: timestamp.iso,
    };

    if (requestId !== undefined) {
      response.requestId = requestId;
    }

    return response;
  }

  /**
   * Updates error handler configuration
   */
  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current error handler statistics
   */
  getConfig(): ErrorHandlerConfig {
    return { ...this.config };
  }

  // Helper: attach typed properties to Error without using 'any'
  private attachProps<T extends Record<string, unknown>>(
    err: Error,
    props: T,
  ): asserts err is Error & T {
    Object.assign(err, props);
  }

  // Helper: normalize unknown error into a consistent shape
  private toErrorInfo(error: unknown): {
    name?: string;
    message?: string;
    stack?: string;
    code?: unknown;
  } {
    if (error instanceof Error) {
      const code = this.hasCode(error) ? error.code : undefined;
      return { name: error.name, message: error.message, stack: error.stack, code };
    }
    if (typeof error === 'object' && error !== null) {
      const maybe = error as { name?: unknown; message?: unknown; stack?: unknown; code?: unknown };
      return {
        name: typeof maybe.name === 'string' ? maybe.name : undefined,
        message: typeof maybe.message === 'string' ? maybe.message : JSON.stringify(error),
        stack: typeof maybe.stack === 'string' ? maybe.stack : undefined,
        code: maybe.code,
      };
    }
    return { message: String(error) };
  }

  private toBasicErrorInfo(error: unknown): { name?: string; code?: unknown } {
    const info = this.toErrorInfo(error);
    return { name: info.name, code: info.code };
  }

  private hasCode(x: unknown): x is { code?: unknown } {
    return typeof x === 'object' && x !== null && 'code' in x;
  }
}

// Default singleton instance
export const defaultSecureErrorHandler = new SecureErrorHandler();
