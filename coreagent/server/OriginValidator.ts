/**
 * Origin Validator
 *
 * Validates request origins for CORS and security purposes.
 * Implements pattern matching for allowed origins to prevent DNS rebinding attacks.
 *
 * Constitutional AI Compliance:
 * - Accuracy: Precise origin validation following security best practices
 * - Transparency: Clear logging of validation decisions
 * - Helpfulness: Detailed error messages for blocked origins
 * - Safety: Default-deny policy, DNS rebinding protection
 *
 * @see https://owasp.org/www-community/attacks/DNS_Rebinding
 * @see docs/architecture/MCP_TRANSPORT_STRATEGY.md
 */

import type { OriginValidationConfig, OriginValidationResult } from '../types/MCPSessionTypes';

/**
 * Origin Validator Service
 *
 * Validates request origins against a configurable whitelist with pattern matching.
 * Supports exact matching, wildcard patterns, and protocol-based matching.
 *
 * Pattern Examples:
 * - Exact: "http://localhost:3000"
 * - Wildcard port: "http://localhost:*"
 * - Protocol: "vscode-webview://*"
 * - Domain: "https://*.oneagent.io"
 */
export class OriginValidator {
  private readonly config: OriginValidationConfig;
  private readonly unauthorizedAttempts: Map<string, number>;

  /**
   * Create a new origin validator
   *
   * @param config - Origin validation configuration
   */
  constructor(config: OriginValidationConfig) {
    this.config = config;
    this.unauthorizedAttempts = new Map();

    console.log('[OriginValidator] Initialized', {
      allowedOrigins: config.allowedOrigins,
      allowLocalhost: config.allowLocalhost,
      allowFileProtocol: config.allowFileProtocol,
      allowVSCodeWebview: config.allowVSCodeWebview,
      requireOriginHeader: config.requireOriginHeader,
    });
  }

  /**
   * Validate an origin against the configured rules
   *
   * @param origin - Origin header value (e.g., "http://localhost:3000")
   * @returns Validation result with allowed flag and reason
   */
  validate(origin: string | undefined): OriginValidationResult {
    // Handle missing origin header
    if (!origin) {
      if (this.config.requireOriginHeader) {
        return {
          allowed: false,
          origin: '<missing>',
          reason: 'Origin header is required',
        };
      }
      // Allow requests without origin (curl, server-to-server, etc.)
      return {
        allowed: true,
        origin: '<missing>',
        reason: 'Origin header not required',
      };
    }

    // Check if origin is allowed
    const result = this.isAllowed(origin);

    // Log unauthorized attempts if configured
    if (!result.allowed && this.config.logUnauthorizedAttempts) {
      this.logUnauthorized(origin, result.reason || 'Not in whitelist');
    }

    return result;
  }

  /**
   * Check if an origin is allowed
   *
   * @param origin - Origin to check
   * @returns Validation result
   */
  isAllowed(origin: string): OriginValidationResult {
    // localhost special handling
    if (this.config.allowLocalhost && this.isLocalhost(origin)) {
      return {
        allowed: true,
        origin,
        matchedPattern: 'localhost',
        reason: 'Localhost origin allowed',
      };
    }

    // file:// protocol
    if (this.config.allowFileProtocol && origin.startsWith('file://')) {
      return {
        allowed: true,
        origin,
        matchedPattern: 'file://*',
        reason: 'File protocol allowed',
      };
    }

    // vscode-webview:// protocol
    if (this.config.allowVSCodeWebview && origin.startsWith('vscode-webview://')) {
      return {
        allowed: true,
        origin,
        matchedPattern: 'vscode-webview://*',
        reason: 'VS Code webview protocol allowed',
      };
    }

    // Check against configured patterns
    for (const pattern of this.config.allowedOrigins) {
      if (this.matchPattern(origin, pattern)) {
        return {
          allowed: true,
          origin,
          matchedPattern: pattern,
          reason: `Matched pattern: ${pattern}`,
        };
      }
    }

    // Default deny
    return {
      allowed: false,
      origin,
      reason: 'Origin not in whitelist',
    };
  }

  /**
   * Check if origin is localhost
   *
   * Matches:
   * - http://localhost:*
   * - http://127.0.0.1:*
   * - http://[::1]:*
   *
   * @param origin - Origin to check
   * @returns True if localhost
   */
  private isLocalhost(origin: string): boolean {
    try {
      const url = new URL(origin);
      const hostname = url.hostname.toLowerCase();

      return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '[::1]' ||
        hostname === '::1'
      );
    } catch {
      return false;
    }
  }

  /**
   * Match origin against pattern
   *
   * Supports:
   * - Exact match: "http://localhost:3000"
   * - Wildcard port: "http://localhost:*"
   * - Wildcard subdomain: "https://*.example.com"
   * - Protocol wildcard: "vscode-webview://*"
   *
   * @param origin - Origin to match
   * @param pattern - Pattern to match against
   * @returns True if origin matches pattern
   */
  private matchPattern(origin: string, pattern: string): boolean {
    // Exact match
    if (origin === pattern) {
      return true;
    }

    try {
      // Convert pattern to regex
      const regex = this.patternToRegex(pattern);
      return regex.test(origin);
    } catch (error) {
      console.warn('[OriginValidator] Invalid pattern', { pattern, error });
      return false;
    }
  }

  /**
   * Convert pattern to regex
   *
   * @param pattern - Pattern with wildcards
   * @returns Regular expression
   */
  private patternToRegex(pattern: string): RegExp {
    // Escape special regex characters except *
    let regexStr = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');

    // Anchor to start and end
    regexStr = `^${regexStr}$`;

    return new RegExp(regexStr);
  }

  /**
   * Log unauthorized origin attempt
   *
   * Tracks repeated attempts from same origin for security monitoring.
   *
   * @param origin - Unauthorized origin
   * @param reason - Reason for denial
   */
  private logUnauthorized(origin: string, reason: string): void {
    // Increment attempt counter
    const attempts = (this.unauthorizedAttempts.get(origin) || 0) + 1;
    this.unauthorizedAttempts.set(origin, attempts);

    console.warn('[OriginValidator] Unauthorized origin attempt', {
      origin,
      reason,
      attempts,
      timestamp: new Date().toISOString(),
    });

    // Log warning for repeated attempts
    if (attempts >= 5) {
      console.error('[OriginValidator] SECURITY ALERT: Repeated unauthorized attempts', {
        origin,
        totalAttempts: attempts,
        recommendation: 'Consider IP-based rate limiting',
      });
    }
  }

  /**
   * Get unauthorized attempt statistics
   *
   * @returns Map of origin to attempt count
   */
  getUnauthorizedAttempts(): Map<string, number> {
    return new Map(this.unauthorizedAttempts);
  }

  /**
   * Clear unauthorized attempt statistics
   */
  clearUnauthorizedAttempts(): void {
    this.unauthorizedAttempts.clear();
    console.log('[OriginValidator] Cleared unauthorized attempt statistics');
  }

  /**
   * Get configuration
   *
   * @returns Current configuration
   */
  getConfig(): OriginValidationConfig {
    return { ...this.config };
  }
}
