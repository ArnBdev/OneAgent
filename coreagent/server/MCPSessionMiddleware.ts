/**
 * MCP Session Middleware
 *
 * Express middleware for MCP session validation and management.
 * Validates Mcp-Session-Id header and attaches session to request.
 *
 * Constitutional AI Compliance:
 * - Accuracy: Follows MCP 2025-06-18 session management specification
 * - Transparency: Clear logging of session operations
 * - Helpfulness: Detailed error messages for session issues
 * - Safety: Validates all sessions, handles expiration gracefully
 *
 * @see https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
 */

import type { Request, Response, NextFunction } from 'express';
import type { MCPSessionManager } from './MCPSessionManager';
import type { MCPSession } from '../types/MCPSessionTypes';

/**
 * Extended Express Request with MCP session
 */
export interface MCPRequest extends Request {
  mcpSession?: MCPSession;
  mcpSessionId?: string;
}

/**
 * Session Middleware Options
 */
export interface SessionMiddlewareOptions {
  /** Session manager instance */
  sessionManager: MCPSessionManager;

  /** Paths that don't require a session (e.g., /health, /initialize) */
  skipPaths?: string[];

  /** Whether to require session for all requests (default: false) */
  requireSession?: boolean;
}

/**
 * Create MCP session middleware
 *
 * This middleware:
 * 1. Extracts Mcp-Session-Id header from request
 * 2. Validates session exists and is active
 * 3. Attaches session to request object
 * 4. Updates session last activity (touch)
 * 5. Returns 404 for invalid/expired sessions
 *
 * @param options - Middleware options
 * @returns Express middleware function
 */
export function createMCPSessionMiddleware(options: SessionMiddlewareOptions) {
  const {
    sessionManager,
    skipPaths = ['/health', '/health/sessions'],
    requireSession = false,
  } = options;

  return async (req: MCPRequest, res: Response, next: NextFunction): Promise<void> => {
    // Skip session validation for certain paths
    if (skipPaths.some((path) => req.path.startsWith(path))) {
      next();
      return;
    }

    // Extract session ID from header (case-insensitive per RFC 7230)
    const sessionId =
      (req.headers['mcp-session-id'] as string | undefined) ||
      (req.headers['Mcp-Session-Id'] as string | undefined);

    // DEBUG: Log what we received
    console.log('[MCPSessionMiddleware] DEBUG: Session header check', {
      hasMcpSessionId: !!req.headers['mcp-session-id'],
      hasMcpSessionIdCased: !!req.headers['Mcp-Session-Id'],
      sessionId: sessionId ? sessionId.substring(0, 8) + '...' : 'none',
      allHeaders: Object.keys(req.headers).filter((h) => h.toLowerCase().includes('session')),
    });

    if (sessionId) {
      console.log('[MCPSessionMiddleware] DEBUG: Received session ID header:', {
        value: sessionId,
        length: sessionId.length,
        first8: sessionId.substring(0, 8),
        type: typeof sessionId,
      });
    }

    // No session ID provided
    if (!sessionId) {
      if (requireSession) {
        res.status(401).json({
          jsonrpc: '2.0',
          error: {
            code: -32002,
            message: 'Session required',
            data: {
              reason: 'Mcp-Session-Id header is required for this endpoint',
            },
          },
        });
        return;
      }

      // Session optional - continue without session
      next();
      return;
    }

    try {
      // Validate session exists and is active
      const session = await sessionManager.getSession(sessionId);

      if (!session) {
        console.warn('[MCPSessionMiddleware] Session not found or expired', {
          sessionId: sessionId.substring(0, 8) + '...',
          path: req.path,
          method: req.method,
        });

        res.status(404).json({
          jsonrpc: '2.0',
          error: {
            code: -32003,
            message: 'Session not found',
            data: {
              sessionId: sessionId.substring(0, 8) + '...',
              reason: 'Session does not exist or has expired',
            },
          },
        });
        return;
      }

      // Attach session to request
      req.mcpSession = session;
      req.mcpSessionId = sessionId;

      // Touch session (update last activity, extend expiration)
      await sessionManager.touchSession(sessionId).catch((err) => {
        console.warn('[MCPSessionMiddleware] Failed to touch session', {
          sessionId: sessionId.substring(0, 8) + '...',
          error: err instanceof Error ? err.message : String(err),
        });
        // Continue anyway - touching is best-effort
      });

      // Log session usage (debug level)
      if (process.env.DEBUG_SESSIONS) {
        console.log('[MCPSessionMiddleware] Session validated', {
          sessionId: sessionId.substring(0, 8) + '...',
          clientId: session.clientId,
          path: req.path,
          method: req.method,
        });
      }

      next();
    } catch (error) {
      console.error('[MCPSessionMiddleware] Session validation error', {
        sessionId: sessionId.substring(0, 8) + '...',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error validating session',
          data: {
            reason: 'Failed to validate session',
          },
        },
      });
    }
  };
}

/**
 * Create strict session middleware
 *
 * Requires session for all requests (no skipped paths).
 *
 * @param sessionManager - Session manager instance
 * @returns Express middleware
 */
export function createStrictSessionMiddleware(sessionManager: MCPSessionManager) {
  return createMCPSessionMiddleware({
    sessionManager,
    skipPaths: [],
    requireSession: true,
  });
}

/**
 * Create permissive session middleware
 *
 * Allows requests without session, but validates if present.
 *
 * @param sessionManager - Session manager instance
 * @param skipPaths - Paths that skip session validation entirely
 * @returns Express middleware
 */
export function createPermissiveSessionMiddleware(
  sessionManager: MCPSessionManager,
  skipPaths: string[] = ['/health', '/health/sessions', '/initialize'],
) {
  return createMCPSessionMiddleware({
    sessionManager,
    skipPaths,
    requireSession: false,
  });
}
