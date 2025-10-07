/**
 * In-Memory MCP Session Storage (Canonical)
 * ===========================================
 * Session storage implementation using OneAgentUnifiedBackbone.cache.
 * Production deployments can extend this for Redis or similar distributed storage.
 *
 * Constitutional AI Compliance:
 * - Accuracy: Correct session lifecycle management
 * - Transparency: Clear logging and metrics
 * - Helpfulness: Automatic cleanup and expiration handling
 * - Safety: Thread-safe operations, memory leak prevention
 *
 * See AGENTS.md for canonical patterns.
 */

import {
  MCPSession,
  MCPEvent,
  ISessionStorage,
  IEventLog,
  MCPSessionState,
} from '../types/MCPSessionTypes';
import { OneAgentUnifiedBackbone } from '../utils/UnifiedBackboneService';

/**
 * In-Memory Session Storage
 * Thread-safe session storage with automatic cleanup using canonical unified cache
 */
export class InMemorySessionStorage implements ISessionStorage {
  private readonly cache = OneAgentUnifiedBackbone.getInstance().cache;
  private readonly sessionsKey = 'mcp.sessions';
  private cleanupIntervalHandle: NodeJS.Timeout | null = null;

  constructor(private readonly cleanupIntervalMs: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.startCleanupInterval();
  }

  async createSession(session: MCPSession): Promise<void> {
    const sessions = (await this.cache.get(this.sessionsKey)) as Record<string, MCPSession> | null;
    const sessionsMap = sessions || {};

    sessionsMap[session.id] = { ...session };
    await this.cache.set(this.sessionsKey, sessionsMap);

    console.log(
      `[SessionStorage] ✅ Created session ${session.id} (first8: ${session.id.substring(0, 8)}) for ${session.clientId} (origin: ${session.origin}), expires: ${session.expiresAt.toISOString()}`,
    );
    console.log(`[SessionStorage] DEBUG: Session stored in cache key '${this.sessionsKey}'`);
  }

  async getSession(sessionId: string): Promise<MCPSession | null> {
    const sessions = (await this.cache.get(this.sessionsKey)) as Record<string, MCPSession> | null;

    console.log(`[SessionStorage] DEBUG: getSession('${sessionId}') called`);
    console.log(
      `[SessionStorage] DEBUG: Cache has sessions:`,
      sessions ? Object.keys(sessions).length : 0,
    );

    if (!sessions) {
      console.log(`[SessionStorage] ⚠️  No sessions found in cache`);
      return null;
    }

    const session = sessions[sessionId];
    if (!session) {
      console.log(`[SessionStorage] ⚠️  Session ${sessionId} not found in cache`);
      console.log(
        `[SessionStorage] DEBUG: Available session IDs:`,
        Object.keys(sessions)
          .map((id) => id.substring(0, 8))
          .join(', '),
      );
      return null;
    }

    // CRITICAL FIX: Convert date strings back to Date objects
    // When sessions are stored in cache, Date objects are serialized to JSON strings.
    // We must convert them back to Date objects for proper comparison.
    const expiresAt =
      session.expiresAt instanceof Date ? session.expiresAt : new Date(session.expiresAt);
    const createdAt =
      session.createdAt instanceof Date ? session.createdAt : new Date(session.createdAt);
    const lastActivity =
      session.lastActivity instanceof Date ? session.lastActivity : new Date(session.lastActivity);

    // Check if expired
    const now = new Date();
    if (session.state === MCPSessionState.EXPIRED || expiresAt < now) {
      console.log(`[SessionStorage] ⚠️  Session ${sessionId} expired`, {
        expiresAt: expiresAt.toISOString(),
        now: now.toISOString(),
        state: session.state,
      });
      session.state = MCPSessionState.EXPIRED;
      return null;
    }

    console.log(
      `[SessionStorage] ✅ Retrieved session ${sessionId.substring(0, 8)}... (state: ${session.state}, expires: ${expiresAt.toISOString()})`,
    );

    // Return session with properly typed Date objects
    return {
      ...session,
      createdAt,
      lastActivity,
      expiresAt,
    };
  }

  async updateSession(sessionId: string, updates: Partial<MCPSession>): Promise<void> {
    const sessions = (await this.cache.get(this.sessionsKey)) as Record<string, MCPSession> | null;
    if (!sessions || !sessions[sessionId]) {
      console.error(`[SessionStorage] ❌ Cannot update non-existent session: ${sessionId}`);
      throw new Error(`Session not found: ${sessionId}`);
    }

    Object.assign(sessions[sessionId], updates);
    await this.cache.set(this.sessionsKey, sessions);

    console.log(`[SessionStorage] 🔄 Updated session ${sessionId.substring(0, 8)}...`, {
      updates: Object.keys(updates),
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = (await this.cache.get(this.sessionsKey)) as Record<string, MCPSession> | null;
    if (sessions && sessions[sessionId]) {
      sessions[sessionId].state = MCPSessionState.TERMINATED;
      delete sessions[sessionId];
      await this.cache.set(this.sessionsKey, sessions);
      console.log(
        `[SessionStorage] 🗑️  Deleted session ${sessionId.substring(0, 8)}... (remaining: ${Object.keys(sessions).length})`,
      );
    } else {
      console.warn(
        `[SessionStorage] ⚠️  Attempted to delete non-existent session ${sessionId.substring(0, 8)}...`,
      );
    }
  }

  async getActiveSessions(): Promise<MCPSession[]> {
    const sessions = (await this.cache.get(this.sessionsKey)) as Record<string, MCPSession> | null;
    if (!sessions) return [];

    const now = new Date();
    return Object.values(sessions).filter(
      (session) => session.state === MCPSessionState.ACTIVE && new Date(session.expiresAt) > now,
    );
  }

  async cleanupExpiredSessions(): Promise<number> {
    const sessions = (await this.cache.get(this.sessionsKey)) as Record<string, MCPSession> | null;
    if (!sessions) return 0;

    const now = new Date();
    let cleanedUp = 0;

    for (const [sessionId, session] of Object.entries(sessions)) {
      if (new Date(session.expiresAt) <= now || session.state === MCPSessionState.EXPIRED) {
        session.state = MCPSessionState.EXPIRED;
        delete sessions[sessionId];
        cleanedUp++;
      }
    }

    if (cleanedUp > 0) {
      await this.cache.set(this.sessionsKey, sessions);
      console.log(
        `[SessionStorage] 🧹 Cleaned up ${cleanedUp} expired session(s) (total active: ${Object.keys(sessions).length})`,
      );
    }

    return cleanedUp;
  }

  private startCleanupInterval(): void {
    this.cleanupIntervalHandle = setInterval(() => {
      this.cleanupExpiredSessions().catch((error) => {
        console.error('[SessionStorage] ❌ Cleanup error:', error);
      });
    }, this.cleanupIntervalMs);
  }

  public stopCleanupInterval(): void {
    if (this.cleanupIntervalHandle) {
      clearInterval(this.cleanupIntervalHandle);
      this.cleanupIntervalHandle = null;
    }
  }

  public async getMetrics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    terminatedSessions: number;
  }> {
    const sessions = (await this.cache.get(this.sessionsKey)) as Record<string, MCPSession> | null;
    if (!sessions) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
        terminatedSessions: 0,
      };
    }

    const sessionsList = Object.values(sessions);
    return {
      totalSessions: sessionsList.length,
      activeSessions: sessionsList.filter((s) => s.state === MCPSessionState.ACTIVE).length,
      expiredSessions: sessionsList.filter((s) => s.state === MCPSessionState.EXPIRED).length,
      terminatedSessions: sessionsList.filter((s) => s.state === MCPSessionState.TERMINATED).length,
    };
  }
}

/**
 * In-Memory Event Log
 * Circular buffer for SSE events with resumability support using canonical unified cache
 */
export class InMemoryEventLog implements IEventLog {
  private readonly cache = OneAgentUnifiedBackbone.getInstance().cache;
  private readonly eventsKey = 'mcp.events';
  private readonly maxEventsPerSession: number;

  constructor(maxEventsPerSession: number = 1000) {
    this.maxEventsPerSession = maxEventsPerSession;
  }

  async addEvent(event: MCPEvent): Promise<void> {
    const allEvents = ((await this.cache.get(this.eventsKey)) as Record<string, MCPEvent[]>) || {};
    const sessionEvents = allEvents[event.sessionId] || [];

    sessionEvents.push({ ...event });

    if (sessionEvents.length > this.maxEventsPerSession) {
      sessionEvents.shift();
    }

    allEvents[event.sessionId] = sessionEvents;
    await this.cache.set(this.eventsKey, allEvents);
  }

  async getEventsAfter(
    sessionId: string,
    streamId: string,
    lastEventId: string,
  ): Promise<MCPEvent[]> {
    const allEvents = ((await this.cache.get(this.eventsKey)) as Record<string, MCPEvent[]>) || {};
    const sessionEvents = allEvents[sessionId] || [];

    const lastIndex = sessionEvents.findIndex((e) => e.id === lastEventId);

    if (lastIndex === -1) {
      console.warn(
        `[EventLog] ⚠️  Last event ID ${lastEventId} not found for session ${sessionId}`,
      );
      return [];
    }

    return sessionEvents
      .slice(lastIndex + 1)
      .filter((e) => e.streamId === streamId)
      .map((e) => ({ ...e }));
  }

  async getSessionEvents(sessionId: string): Promise<MCPEvent[]> {
    const allEvents = ((await this.cache.get(this.eventsKey)) as Record<string, MCPEvent[]>) || {};
    return (allEvents[sessionId] || []).map((e) => ({ ...e }));
  }

  async cleanupOldEvents(maxAgeMs: number): Promise<number> {
    const allEvents = ((await this.cache.get(this.eventsKey)) as Record<string, MCPEvent[]>) || {};
    const now = new Date();
    const cutoff = new Date(now.getTime() - maxAgeMs);
    let cleanedUp = 0;

    for (const [sessionId, sessionEvents] of Object.entries(allEvents)) {
      const beforeCount = sessionEvents.length;
      const filteredEvents = sessionEvents.filter((event) => new Date(event.timestamp) >= cutoff);

      allEvents[sessionId] = filteredEvents;
      cleanedUp += beforeCount - filteredEvents.length;

      if (filteredEvents.length === 0) {
        delete allEvents[sessionId];
      }
    }

    if (cleanedUp > 0) {
      await this.cache.set(this.eventsKey, allEvents);
      console.log(`[EventLog] 🧹 Cleaned up ${cleanedUp} old event(s)`);
    }

    return cleanedUp;
  }

  public async getMetrics(): Promise<{
    totalSessions: number;
    totalEvents: number;
    averageEventsPerSession: number;
  }> {
    const allEvents = ((await this.cache.get(this.eventsKey)) as Record<string, MCPEvent[]>) || {};
    const sessionsList = Object.values(allEvents);
    const totalEvents = sessionsList.reduce((sum, events) => sum + events.length, 0);
    const totalSessions = sessionsList.length;

    return {
      totalSessions,
      totalEvents,
      averageEventsPerSession: totalSessions > 0 ? totalEvents / totalSessions : 0,
    };
  }

  public async clearSessionEvents(sessionId: string): Promise<void> {
    const allEvents = ((await this.cache.get(this.eventsKey)) as Record<string, MCPEvent[]>) || {};
    delete allEvents[sessionId];
    await this.cache.set(this.eventsKey, allEvents);
  }
}
