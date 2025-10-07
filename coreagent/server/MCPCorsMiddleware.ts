/**
 * MCP CORS Middleware
 *
 * Express middleware for Cross-Origin Resource Sharing (CORS) with security validation.
 * Implements origin validation to prevent DNS rebinding attacks.
 *
 * Constitutional AI Compliance:
 * - Accuracy: Follows CORS specification and security best practices
 * - Transparency: Clear logging of CORS decisions
 * - Helpfulness: Detailed error responses for blocked origins
 * - Safety: Default-deny policy, comprehensive security headers
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 * @see https://owasp.org/www-community/attacks/DNS_Rebinding
 */

import type { Request, Response, NextFunction } from 'express';
import { OriginValidator } from './OriginValidator';

/**
 * CORS Middleware Options
 */
export interface CorsMiddlewareOptions {
  /** Origin validator instance */
  validator: OriginValidator;

  /** Additional allowed headers (beyond defaults) */
  additionalHeaders?: string[];

  /** Additional allowed methods (beyond defaults) */
  additionalMethods?: string[];

  /** Max age for preflight cache (default: 24 hours) */
  maxAge?: number;

  /** Allow credentials (default: true) */
  credentials?: boolean;
}

/**
 * Default CORS headers for MCP protocol
 */
const DEFAULT_ALLOWED_HEADERS = [
  'Authorization',
  'Content-Type',
  'Mcp-Session-Id',
  'MCP-Protocol-Version',
  'Last-Event-ID',
];

/**
 * Default allowed methods for MCP protocol
 */
const DEFAULT_ALLOWED_METHODS = ['GET', 'POST', 'DELETE', 'OPTIONS'];

/**
 * Create MCP CORS middleware
 *
 * This middleware:
 * 1. Validates the Origin header against configured whitelist
 * 2. Sets appropriate CORS headers for allowed origins
 * 3. Handles OPTIONS preflight requests
 * 4. Blocks requests from unauthorized origins
 *
 * @param options - Middleware options
 * @returns Express middleware function
 */
export function createMCPCorsMiddleware(options: CorsMiddlewareOptions) {
  const {
    validator,
    additionalHeaders = [],
    additionalMethods = [],
    maxAge = 86400, // 24 hours
    credentials = true,
  } = options;

  // Combine default and additional headers/methods
  const allowedHeaders = [...DEFAULT_ALLOWED_HEADERS, ...additionalHeaders].join(', ');
  const allowedMethods = [...DEFAULT_ALLOWED_METHODS, ...additionalMethods].join(', ');

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    // Validate origin
    const validationResult = validator.validate(origin);

    if (!validationResult.allowed) {
      // Origin not allowed - block request
      console.warn('[MCPCorsMiddleware] Blocked request from unauthorized origin', {
        origin: validationResult.origin,
        reason: validationResult.reason,
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.socket.remoteAddress,
      });

      res.status(403).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Origin not allowed',
          data: {
            origin: validationResult.origin,
            reason: validationResult.reason,
          },
        },
      });
      return;
    }

    // Origin allowed - set CORS headers
    if (origin) {
      // Set allowed origin (specific origin, not wildcard for security)
      res.setHeader('Access-Control-Allow-Origin', origin);

      // Set credentials header if enabled
      if (credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    }

    // Set allowed headers
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders);

    // Set allowed methods
    res.setHeader('Access-Control-Allow-Methods', allowedMethods);

    // Set max age for preflight cache
    res.setHeader('Access-Control-Max-Age', maxAge.toString());

    // Expose custom headers to client
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, MCP-Protocol-Version');

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
      console.log('[MCPCorsMiddleware] Preflight request', {
        origin: validationResult.origin,
        matchedPattern: validationResult.matchedPattern,
        method: req.headers['access-control-request-method'],
        headers: req.headers['access-control-request-headers'],
      });

      res.status(204).send();
      return;
    }

    // Log successful CORS validation (debug level)
    if (process.env.DEBUG_CORS) {
      console.log('[MCPCorsMiddleware] Request allowed', {
        origin: validationResult.origin,
        matchedPattern: validationResult.matchedPattern,
        method: req.method,
        path: req.path,
      });
    }

    // Continue to next middleware
    next();
  };
}

/**
 * Create strict CORS middleware for production
 *
 * Uses strict origin validation with no localhost access.
 *
 * @param allowedOrigins - Array of allowed origin patterns
 * @returns Express middleware
 */
export function createStrictCorsMiddleware(allowedOrigins: string[]) {
  const validator = new OriginValidator({
    allowedOrigins,
    allowLocalhost: false,
    allowFileProtocol: false,
    allowVSCodeWebview: false,
    logUnauthorizedAttempts: true,
    requireOriginHeader: true,
  });

  return createMCPCorsMiddleware({ validator });
}

/**
 * Create development CORS middleware
 *
 * Uses permissive origin validation allowing localhost and file protocol.
 *
 * @param additionalOrigins - Additional allowed origins beyond localhost
 * @returns Express middleware
 */
export function createDevCorsMiddleware(additionalOrigins: string[] = []) {
  const validator = new OriginValidator({
    allowedOrigins: additionalOrigins,
    allowLocalhost: true,
    allowFileProtocol: true,
    allowVSCodeWebview: true,
    logUnauthorizedAttempts: true,
    requireOriginHeader: false,
  });

  return createMCPCorsMiddleware({ validator });
}
