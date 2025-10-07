/**
 * MCP Session Manager
 *
 * Orchestrates session lifecycle, event management, and metrics for MCP sessions.
 * Implements the MCP 2025-06-18 specification for session management and event resumability.
 *
 * Constitutional AI Compliance:
 * - Accuracy: Follows MCP 2025-06-18 specification precisely
 * - Transparency: Clear logging of session lifecycle events
 * - Helpfulness: Provides detailed error messages and metrics
 * - Safety: Validates all inputs, handles errors gracefully
 *
 * @see docs/architecture/MCP_TRANSPORT_STRATEGY.md
 * @see docs/implementation/MCP_SESSION_IMPLEMENTATION_PLAN.md
 */

import { randomUUID } from 'crypto';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import {
  MCPSession,
  MCPSessionState,
  MCPEvent,
  ISessionStorage,
  IEventLog,
  SessionConfig,
  SessionCreationResult,
  EventReplayResult,
} from '../types/MCPSessionTypes';

/**
 * Session metrics for monitoring and observability
 */
export interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  terminatedSessions: number;
  totalEvents: number;
  averageEventsPerSession: number;
  oldestSessionAge: number; // milliseconds
  averageSessionDuration: number; // milliseconds
}

/**
 * Session manager orchestrating session lifecycle and event management
 *
 * Responsibilities:
 * - Create and manage MCP sessions
 * - Handle session expiration and cleanup
 * - Manage SSE event log for resumability
 * - Provide metrics and health status
 *
 * Uses canonical storage interfaces (ISessionStorage, IEventLog) for flexibility
 * and testability.
 */
export class MCPSessionManager {
  private readonly storage: ISessionStorage;
  private readonly eventLog: IEventLog;
  private readonly config: SessionConfig;

  /**
   * Create a new session manager
   *
   * @param storage - Session storage implementation (memory, Redis, etc.)
   * @param eventLog - Event log implementation for resumability
   * @param config - Session configuration (timeouts, cleanup intervals)
   */
  constructor(storage: ISessionStorage, eventLog: IEventLog, config: SessionConfig) {
    this.storage = storage;
    this.eventLog = eventLog;
    this.config = config;

    console.log('[MCPSessionManager] Initialized', {
      sessionTimeoutMs: config.sessionTimeoutMs,
      cleanupIntervalMs: config.cleanupIntervalMs,
      eventLogTTLMs: config.eventLogTTLMs,
      maxEventsPerSession: config.maxEventsPerSession,
    });
  }

  /**
   * Create a new MCP session
   *
   * Generates a unique session ID (UUID v4) and stores session metadata.
   * Returns the session ID for the client to include in subsequent requests
   * via the Mcp-Session-Id header.
   *
   * @param clientId - Client identifier (e.g., "Visual Studio Code v1.104.3")
   * @param origin - Request origin for CORS validation
   * @param protocolVersion - MCP protocol version (e.g., "2025-06-18")
   * @param capabilities - Client capabilities from initialize request
   * @returns SessionCreationResult with session ID and metadata
   */
  async createSession(
    clientId: string,
    origin: string,
    protocolVersion: string,
    capabilities: Record<string, unknown> = {},
  ): Promise<SessionCreationResult> {
    // Generate RFC 4122 UUID v4 format per MCP 2025-06-18 specification
    // Note: Using crypto.randomUUID() instead of createUnifiedId() because
    // MCP protocol requires standard UUID format for interoperability
    const sessionId = randomUUID();

    // Calculate expiration time
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.sessionTimeoutMs);

    // Create session object
    const session: MCPSession = {
      id: sessionId,
      clientId,
      origin,
      state: MCPSessionState.ACTIVE,
      createdAt: now,
      lastActivity: now,
      expiresAt,
      protocolVersion,
      clientCapabilities: capabilities,
      eventCounter: 0,
      metadata: {
        createdTimestamp: createUnifiedTimestamp(),
      },
    };

    // Store session
    await this.storage.createSession(session);

    console.log('[MCPSessionManager] Session created', {
      sessionId: this.maskSessionId(sessionId),
      clientId,
      origin,
      protocolVersion,
      expiresAt: expiresAt.toISOString(),
    });

    return {
      sessionId,
      expiresAt,
    };
  }

  /**
   * Retrieve a session by ID
   *
   * @param sessionId - Session ID to retrieve
   * @returns Session object or null if not found
   */
  async getSession(sessionId: string): Promise<MCPSession | null> {
    const session = await this.storage.getSession(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.state === MCPSessionState.EXPIRED || session.expiresAt < new Date()) {
      console.log('[MCPSessionManager] Session expired', {
        sessionId: this.maskSessionId(sessionId),
        expiresAt: session.expiresAt.toISOString(),
      });
      return null;
    }

    return session;
  }

  /**
   * Update session last activity timestamp
   *
   * Called on each request to extend session lifetime.
   * Resets expiration time based on configured timeout.
   *
   * @param sessionId - Session ID to touch
   */
  async touchSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      console.warn('[MCPSessionManager] Cannot touch non-existent session', {
        sessionId: this.maskSessionId(sessionId),
      });
      return;
    }

    // Update last activity and expiration
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.sessionTimeoutMs);

    await this.storage.updateSession(sessionId, {
      lastActivity: now,
      expiresAt,
    });
  }

  /**
   * Terminate a session explicitly
   *
   * Called when client sends DELETE request to terminate session.
   * Clears event log for the session.
   *
   * @param sessionId - Session ID to terminate
   */
  async terminateSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      console.warn('[MCPSessionManager] Cannot terminate non-existent session', {
        sessionId: this.maskSessionId(sessionId),
      });
      return;
    }

    // Mark session as terminated
    await this.storage.updateSession(sessionId, {
      state: MCPSessionState.TERMINATED,
    });

    // Clear event log for this session
    await this.eventLog.clearSessionEvents(sessionId);

    // Calculate duration using timestamps (not Date.now())
    const createdTime = session.createdAt.getTime();
    const nowTime = new Date().getTime();
    const duration = nowTime - createdTime;

    console.log('[MCPSessionManager] Session terminated', {
      sessionId: this.maskSessionId(sessionId),
      duration,
      eventCount: session.eventCounter,
    });
  }

  /**
   * Add an event to the session's event log
   *
   * Used for SSE event tracking to support resumability via Last-Event-ID header.
   * Returns a unique event ID that clients can use to resume from a specific point.
   *
   * @param sessionId - Session ID
   * @param streamId - Stream identifier (e.g., "notifications")
   * @param data - Event data (JSON)
   * @param type - Event type (e.g., "notification", "progress")
   * @returns Unique event ID for resumability
   */
  async addEvent(
    sessionId: string,
    streamId: string,
    data: unknown,
    type: string = 'message',
  ): Promise<string> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Generate unique event ID using UUID format for MCP compatibility
    const eventId = randomUUID();

    // Create event object
    const event: MCPEvent = {
      id: eventId,
      sessionId,
      streamId,
      sequenceNumber: session.eventCounter,
      timestamp: new Date(),
      data,
      type,
    };

    // Store event in log
    await this.eventLog.addEvent(event);

    // Increment session event counter
    await this.storage.updateSession(sessionId, {
      eventCounter: session.eventCounter + 1,
    });

    return eventId;
  }

  /**
   * Replay events from a specific point
   *
   * Used to support MCP resumability via Last-Event-ID header.
   * Returns all events after the specified event ID for the session.
   *
   * @param sessionId - Session ID
   * @param streamId - Stream identifier
   * @param lastEventId - Last event ID received by client (optional)
   * @returns EventReplayResult with events and metadata
   */
  async replayEvents(
    sessionId: string,
    streamId: string,
    lastEventId?: string,
  ): Promise<EventReplayResult> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return {
        events: [],
        error: `Session not found: ${sessionId}`,
      };
    }

    // Get events after last event ID
    const events = await this.eventLog.getEventsAfter(sessionId, streamId, lastEventId);

    return {
      events,
      totalEvents: events.length,
      sessionState: session.state,
    };
  }

  /**
   * Get comprehensive metrics for monitoring
   *
   * Aggregates metrics from storage and event log for observability.
   * Used by health endpoints and monitoring systems.
   *
   * @returns SessionMetrics object with counts and averages
   */
  async getMetrics(): Promise<SessionMetrics> {
    const storageMetrics = await this.storage.getMetrics();
    const eventMetrics = await this.eventLog.getMetrics();

    // Get all active sessions to calculate age/duration metrics
    const activeSessions = await this.storage.getActiveSessions();

    let oldestSessionAge = 0;
    let totalDuration = 0;

    const now = new Date().getTime();
    for (const session of activeSessions) {
      const age = now - session.createdAt.getTime();
      const duration = session.lastActivity.getTime() - session.createdAt.getTime();

      if (age > oldestSessionAge) {
        oldestSessionAge = age;
      }

      totalDuration += duration;
    }

    const averageSessionDuration =
      activeSessions.length > 0 ? totalDuration / activeSessions.length : 0;

    return {
      totalSessions: storageMetrics.totalSessions,
      activeSessions: storageMetrics.activeSessions,
      expiredSessions: storageMetrics.expiredSessions,
      terminatedSessions: storageMetrics.terminatedSessions,
      totalEvents: eventMetrics.totalEvents,
      averageEventsPerSession: eventMetrics.averageEventsPerSession,
      oldestSessionAge,
      averageSessionDuration,
    };
  }

  /**
   * Mask session ID for logging (security)
   *
   * Shows only first 8 characters to prevent session ID exposure in logs.
   *
   * @param sessionId - Full session ID
   * @returns Masked session ID (e.g., "12345678...")
   */
  private maskSessionId(sessionId: string): string {
    return sessionId.length > 8 ? `${sessionId.substring(0, 8)}...` : sessionId;
  }
}
