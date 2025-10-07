/**
 * MCP Session Management Types (Canonical)
 * ============================================
 * Type definitions for MCP Streamable HTTP transport session management,
 * following the MCP 2025-06-18 specification.
 *
 * Constitutional AI Compliance:
 * - Accuracy: Strict adherence to MCP specification
 * - Transparency: Clear type definitions with documentation
 * - Helpfulness: Comprehensive session lifecycle management
 * - Safety: Security-first design with origin validation
 *
 * See: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
 */

import type { UnifiedTimestamp } from './oneagent-backbone-types';

/**
 * MCP Session State
 * Tracks the lifecycle state of an MCP session
 */
export enum MCPSessionState {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
}

/**
 * MCP Session
 * Represents a stateful session between client and server
 * Per MCP spec 2025-06-18 Section 2.5 (Session Management)
 */
export interface MCPSession {
  /** Unique session identifier (UUID v4) */
  id: string;

  /** Client identifier (e.g., "Visual Studio Code v1.104.3") */
  clientId: string;

  /** Client origin (for CORS validation) */
  origin: string;

  /** Session state */
  state: MCPSessionState;

  /** Session creation timestamp */
  createdAt: Date;

  /** Last activity timestamp (updated on each request) */
  lastActivity: Date;

  /** Session expiration timestamp */
  expiresAt: Date;

  /** Protocol version negotiated during initialization */
  protocolVersion: string;

  /** Client capabilities from initialize request */
  clientCapabilities: Record<string, unknown>;

  /** Event counter for resumability (incremented per event) */
  eventCounter: number;

  /** Metadata for debugging and analytics */
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    initializeParams?: Record<string, unknown>;
    createdTimestamp?: UnifiedTimestamp; // UnifiedBackboneService timestamp
    [key: string]: unknown; // Allow additional metadata
  };
}

/**
 * MCP Event
 * Represents a single event in an SSE stream for resumability
 * Per MCP spec 2025-06-18 Section 2.4 (Resumability and Redelivery)
 */
export interface MCPEvent {
  /** Unique event ID (globally unique within session) */
  id: string;

  /** Session ID this event belongs to */
  sessionId: string;

  /** Stream ID (for multiple concurrent streams) */
  streamId: string;

  /** Event sequence number (for ordering) */
  sequenceNumber: number;

  /** Event timestamp */
  timestamp: Date;

  /** JSON-RPC message data */
  data: unknown;

  /** Event type for filtering */
  type: 'request' | 'response' | 'notification' | 'message' | string;
}

/**
 * Session Storage Interface
 * Canonical storage for MCP sessions (pluggable backend)
 */
export interface ISessionStorage {
  /**
   * Create a new session
   */
  createSession(session: MCPSession): Promise<void>;

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Promise<MCPSession | null>;

  /**
   * Update session (touch last activity)
   */
  updateSession(sessionId: string, updates: Partial<MCPSession>): Promise<void>;

  /**
   * Delete session (explicit termination)
   */
  deleteSession(sessionId: string): Promise<void>;

  /**
   * Get all active sessions (for monitoring)
   */
  getActiveSessions(): Promise<MCPSession[]>;

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): Promise<number>;

  /**
   * Get metrics for monitoring
   */
  getMetrics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    terminatedSessions: number;
  }>;
}

/**
 * Event Log Interface
 * Storage for SSE events (for resumability)
 */
export interface IEventLog {
  /**
   * Add event to log
   */
  addEvent(event: MCPEvent): Promise<void>;

  /**
   * Get events after a specific event ID (for resumption)
   */
  getEventsAfter(sessionId: string, streamId: string, lastEventId?: string): Promise<MCPEvent[]>;

  /**
   * Get all events for a session (for debugging)
   */
  getSessionEvents(sessionId: string): Promise<MCPEvent[]>;

  /**
   * Clean up old events (TTL-based)
   */
  cleanupOldEvents(maxAgeMs: number): Promise<number>;

  /**
   * Clear all events for a session (on termination)
   */
  clearSessionEvents(sessionId: string): Promise<void>;

  /**
   * Get metrics for monitoring
   */
  getMetrics(): Promise<{
    totalSessions: number;
    totalEvents: number;
    averageEventsPerSession: number;
  }>;
}

/**
 * Origin Validation Config
 * Configuration for CORS and origin validation
 */
export interface OriginValidationConfig {
  /** Allowed origins (exact match or pattern) */
  allowedOrigins: string[];

  /** Allow localhost origins (any port) */
  allowLocalhost: boolean;

  /** Allow file:// protocol (for desktop apps) */
  allowFileProtocol: boolean;

  /** Allow vscode-webview:// protocol (for VS Code) */
  allowVSCodeWebview: boolean;

  /** Log unauthorized origin attempts */
  logUnauthorizedAttempts: boolean;

  /** Block requests with no Origin header */
  requireOriginHeader: boolean;
}

/**
 * Session Configuration
 * Configuration for MCP session management
 */
export interface SessionConfig {
  /** Session timeout in milliseconds (default: 30 minutes) */
  sessionTimeoutMs: number;

  /** Enable session management (Mcp-Session-Id header) */
  enabled: boolean;

  /** Cleanup interval for expired sessions (default: 5 minutes) */
  cleanupIntervalMs: number;

  /** Event log TTL in milliseconds (default: 1 hour) */
  eventLogTTLMs: number;

  /** Maximum events per session (circular buffer) */
  maxEventsPerSession: number;
}

/**
 * Security Metrics
 * Metrics for monitoring security events
 */
export interface SecurityMetrics {
  /** Total requests received */
  totalRequests: number;

  /** Requests with valid origin */
  validOriginRequests: number;

  /** Requests with invalid origin */
  invalidOriginRequests: number;

  /** Blocked origins (unique) */
  blockedOrigins: Set<string>;

  /** Active sessions count */
  activeSessions: number;

  /** Expired sessions cleaned up */
  expiredSessionsCleanedUp: number;

  /** Sessions terminated by client */
  sessionsTerminatedByClient: number;

  /** Last cleanup timestamp */
  lastCleanup: Date;
}

/**
 * MCP Request Context
 * Extended Express request with MCP-specific fields
 */
export interface MCPRequestContext {
  /** Session ID from Mcp-Session-Id header */
  sessionId?: string;

  /** Session object (if found) */
  session?: MCPSession;

  /** Protocol version from MCP-Protocol-Version header */
  protocolVersion?: string;

  /** Origin from Origin header */
  origin?: string;

  /** Last event ID from Last-Event-ID header (for resumption) */
  lastEventId?: string;

  /** Stream ID (for multiple concurrent streams) */
  streamId?: string;
}

/**
 * Session Creation Result
 * Result of session creation during initialization
 */
export interface SessionCreationResult {
  sessionId: string;
  expiresAt: Date;
}

/**
 * Origin Validation Result
 * Result of origin validation check
 */
export interface OriginValidationResult {
  allowed: boolean;
  origin: string;
  reason?: string;
  matchedPattern?: string;
}

/**
 * Session Cleanup Result
 * Result of session cleanup operation
 */
export interface SessionCleanupResult {
  expiredSessions: number;
  deletedSessions: string[];
  timestamp: Date;
}

/**
 * Event Replay Result
 * Result of event replay for resumption
 */
export interface EventReplayResult {
  events: MCPEvent[];
  totalEvents?: number;
  sessionState?: MCPSessionState;
  error?: string;
}
