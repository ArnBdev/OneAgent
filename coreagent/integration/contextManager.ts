/**
 * ContextManager - Unified request and user context management
 * Part of Level 2.5 Integration Bridges (Phase 1b)
 * 
 * Provides centralized context management across OneAgent components.
 */

import { User, UserProfile } from '../types/user';
import { IRequest } from '../types/conversation';
import { SimpleAuditLogger, defaultAuditLogger } from '../audit/auditLogger';
import { SecureErrorHandler, defaultSecureErrorHandler } from '../utils/secureErrorHandler';

export interface RequestContext {
  requestId: string;
  sessionId: string;
  userId: string;
  timestamp: string;
  agentType: string;
  operation: string;
  metadata: Record<string, any>;
}

export interface EnrichedContext {
  request: RequestContext;
  user: User;
  userProfile?: UserProfile;
  session: SessionContext;
  performance: PerformanceContext;
  security: SecurityContext;
}

export interface SessionContext {
  sessionId: string;
  startTime: string;
  lastActivity: string;
  requestCount: number;
  agentHistory: string[];
  conversationSummary?: string;
}

export interface PerformanceContext {
  requestStartTime: number;
  estimatedComplexity: 'low' | 'medium' | 'high';
  priorityLevel: number;
  resourceLimits: {
    maxExecutionTime: number;
    maxMemoryUsage: number;
  };
}

export interface SecurityContext {
  riskLevel: 'low' | 'medium' | 'high';
  permissions: string[];
  rateLimitInfo: {
    requestsInWindow: number;
    windowStartTime: number;
    maxRequests: number;
  };
  ipAddress?: string;
  userAgent?: string;
}

export interface ContextManagerConfig {
  sessionTimeout: number;
  maxSessionHistory: number;
  enablePerformanceOptimization: boolean;
  enableSecurityChecks: boolean;
  defaultResourceLimits: {
    maxExecutionTime: number;
    maxMemoryUsage: number;
  };
  rateLimiting: {
    maxRequestsPerMinute: number;
    windowSizeMs: number;
  };
}

export class ContextManager {
  private auditLogger: SimpleAuditLogger;
  private errorHandler: SecureErrorHandler;
  private config: ContextManagerConfig;
  private activeSessions = new Map<string, SessionContext>();
  private userContextCache = new Map<string, { user: User; profile?: UserProfile; cacheTime: number }>();
  private rateLimitTracking = new Map<string, { requests: number[]; windowStart: number }>();

  constructor(
    config?: Partial<ContextManagerConfig>,
    auditLogger?: SimpleAuditLogger,
    errorHandler?: SecureErrorHandler
  ) {
    this.auditLogger = auditLogger || defaultAuditLogger;
    this.errorHandler = errorHandler || defaultSecureErrorHandler;
    
    this.config = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxSessionHistory: 50,
      enablePerformanceOptimization: true,
      enableSecurityChecks: true,
      defaultResourceLimits: {
        maxExecutionTime: 30000, // 30 seconds
        maxMemoryUsage: 100 * 1024 * 1024 // 100MB
      },
      rateLimiting: {
        maxRequestsPerMinute: 60,
        windowSizeMs: 60000 // 1 minute
      },
      ...config
    };

    this.initializeCleanupTasks();
  }

  /**
   * Creates enriched context from a request
   */
  async createEnrichedContext(
    request: IRequest,
    user: User,
    userProfile?: UserProfile,
    additionalMetadata?: Record<string, any>
  ): Promise<EnrichedContext> {
    try {
      const requestId = request.requestId || this.generateRequestId();
      const sessionId = request.sessionId || this.generateSessionId();
      const timestamp = new Date().toISOString();

      // Build request context
      const requestContext: RequestContext = {
        requestId,
        sessionId,
        userId: user.id,
        timestamp,
        agentType: request.agentType || 'unknown',
        operation: request.operation || 'process',
        metadata: {
          ...request.metadata,
          ...additionalMetadata
        }
      };

      // Get or create session context
      const sessionContext = await this.getOrCreateSession(sessionId, user.id);

      // Build performance context
      const performanceContext = this.createPerformanceContext(request, sessionContext);

      // Build security context
      const securityContext = await this.createSecurityContext(user, request, sessionContext);

      // Update session activity
      await this.updateSessionActivity(sessionId, request.agentType || 'unknown');      const enrichedContext: EnrichedContext = {
        request: requestContext,
        user,
        session: sessionContext,
        performance: performanceContext,
        security: securityContext
      };

      if (userProfile !== undefined) {
        enrichedContext.userProfile = userProfile;
      }

      // Log context creation
      await this.auditLogger.logInfo(
        'CONTEXT_MANAGER',
        'Enriched context created',
        {
          requestId,
          sessionId,
          userId: user.id,
          agentType: request.agentType
        }
      );

      return enrichedContext;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown context creation error';
      await this.auditLogger.logError(
        'CONTEXT_MANAGER',
        'Failed to create enriched context',
        { error: errorMessage, userId: user?.id }
      );
      throw error;
    }
  }

  /**
   * Updates context during request processing
   */
  async updateContext(
    context: EnrichedContext,
    updates: {
      performance?: Partial<PerformanceContext>;
      security?: Partial<SecurityContext>;
      metadata?: Record<string, any>;
    }
  ): Promise<EnrichedContext> {
    if (updates.performance) {
      context.performance = { ...context.performance, ...updates.performance };
    }

    if (updates.security) {
      context.security = { ...context.security, ...updates.security };
    }

    if (updates.metadata) {
      context.request.metadata = { ...context.request.metadata, ...updates.metadata };
    }

    return context;
  }

  /**
   * Gets session context by session ID
   */
  async getSession(sessionId: string): Promise<SessionContext | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    // Check if session is expired
    if (this.isSessionExpired(session)) {
      this.activeSessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Validates rate limits for a user
   */
  async checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    if (!this.config.enableSecurityChecks) {
      return { allowed: true, remaining: Infinity, resetTime: 0 };
    }

    const now = Date.now();
    const windowSize = this.config.rateLimiting.windowSizeMs;
    const maxRequests = this.config.rateLimiting.maxRequestsPerMinute;

    let tracking = this.rateLimitTracking.get(userId);
    if (!tracking) {
      tracking = { requests: [], windowStart: now };
      this.rateLimitTracking.set(userId, tracking);
    }

    // Clean old requests outside window
    tracking.requests = tracking.requests.filter(time => now - time < windowSize);

    // Check limit
    const currentCount = tracking.requests.length;
    const allowed = currentCount < maxRequests;

    if (allowed) {
      tracking.requests.push(now);
    }

    const resetTime = tracking.windowStart + windowSize;
    const remaining = Math.max(0, maxRequests - currentCount - (allowed ? 1 : 0));

    if (!allowed) {
      await this.auditLogger.logWarning(
        'RATE_LIMIT',
        `Rate limit exceeded for user ${userId}`,
        { userId, currentCount, maxRequests, windowSize }
      );
    }

    return { allowed, remaining, resetTime };
  }
  /**
   * Gets user context with caching
   */
  async getUserContext(userId: string): Promise<{ user: User; profile?: UserProfile } | null> {
    const cached = this.userContextCache.get(userId);
    if (cached && Date.now() - cached.cacheTime < 5 * 60 * 1000) { // 5 minute cache
      const result: { user: User; profile?: UserProfile } = { user: cached.user };
      if (cached.profile !== undefined) {
        result.profile = cached.profile;
      }
      return result;
    }

    // Note: In a real implementation, this would fetch from a UserService
    // For now, returning null to indicate no cached context
    return null;
  }
  /**
   * Caches user context
   */
  async cacheUserContext(user: User, profile?: UserProfile): Promise<void> {
    const cacheEntry: { user: User; profile?: UserProfile; cacheTime: number } = {
      user,
      cacheTime: Date.now()
    };
    
    if (profile !== undefined) {
      cacheEntry.profile = profile;
    }
    
    this.userContextCache.set(user.id, cacheEntry);
  }

  /**
   * Gets context analytics and insights
   */
  async getContextAnalytics(): Promise<{
    activeSessions: number;
    totalRequests: number;
    averageSessionDuration: number;
    topAgentTypes: Array<{ agentType: string; count: number }>;
    rateLimitViolations: number;
  }> {
    const activeSessions = this.activeSessions.size;
    const totalRequests = Array.from(this.activeSessions.values())
      .reduce((sum, session) => sum + session.requestCount, 0);

    const sessionDurations = Array.from(this.activeSessions.values())
      .map(session => Date.now() - new Date(session.startTime).getTime());
    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0;

    // Count agent types
    const agentTypeCounts = new Map<string, number>();
    this.activeSessions.forEach(session => {
      session.agentHistory.forEach(agentType => {
        agentTypeCounts.set(agentType, (agentTypeCounts.get(agentType) || 0) + 1);
      });
    });

    const topAgentTypes = Array.from(agentTypeCounts.entries())
      .map(([agentType, count]) => ({ agentType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      activeSessions,
      totalRequests,
      averageSessionDuration,
      topAgentTypes,
      rateLimitViolations: 0 // Would be tracked in a real implementation
    };
  }

  /**
   * Gets or creates a session context
   */
  private async getOrCreateSession(sessionId: string, userId: string): Promise<SessionContext> {
    let session = this.activeSessions.get(sessionId);
    
    if (!session || this.isSessionExpired(session)) {
      session = {
        sessionId,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        requestCount: 0,
        agentHistory: []
      };
      this.activeSessions.set(sessionId, session);
      
      await this.auditLogger.logInfo(
        'SESSION_MANAGER',
        'New session created',
        { sessionId, userId }
      );
    }

    return session;
  }

  /**
   * Creates performance context based on request characteristics
   */
  private createPerformanceContext(request: IRequest, session: SessionContext): PerformanceContext {
    // Estimate complexity based on request characteristics
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    
    if (request.prompt && request.prompt.length > 1000) {
      complexity = 'high';
    } else if (session.requestCount > 20) {
      complexity = 'high';
    } else if (request.agentType === 'research' || request.agentType === 'dev') {
      complexity = 'high';
    } else if (request.agentType === 'fitness' || request.agentType === 'generic-gemini') {
      complexity = 'low';
    }

    // Set priority based on user context and complexity
    let priorityLevel = 50; // Default priority
    if (complexity === 'low') priorityLevel = 30;
    if (complexity === 'high') priorityLevel = 70;

    const resourceLimits = { ...this.config.defaultResourceLimits };
    if (complexity === 'high') {
      resourceLimits.maxExecutionTime *= 2;
      resourceLimits.maxMemoryUsage *= 1.5;
    } else if (complexity === 'low') {
      resourceLimits.maxExecutionTime /= 2;
      resourceLimits.maxMemoryUsage /= 2;
    }

    return {
      requestStartTime: Date.now(),
      estimatedComplexity: complexity,
      priorityLevel,
      resourceLimits
    };
  }

  /**
   * Creates security context for the request
   */
  private async createSecurityContext(
    user: User,
    request: IRequest,
    session: SessionContext
  ): Promise<SecurityContext> {
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    // Calculate risk level based on various factors
    if (session.requestCount > 100) riskLevel = 'medium';
    if (request.agentType === 'dev' || request.agentType === 'office') riskLevel = 'medium';
    if (session.requestCount > 500) riskLevel = 'high';

    // Get rate limit info
    const rateLimitInfo = await this.checkRateLimit(user.id);

    return {
      riskLevel,
      permissions: user.permissions || ['basic'],
      rateLimitInfo: {
        requestsInWindow: this.config.rateLimiting.maxRequestsPerMinute - rateLimitInfo.remaining,
        windowStartTime: Date.now(),
        maxRequests: this.config.rateLimiting.maxRequestsPerMinute
      },
      ipAddress: request.metadata?.ipAddress,
      userAgent: request.metadata?.userAgent
    };
  }

  /**
   * Updates session activity
   */
  private async updateSessionActivity(sessionId: string, agentType: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.lastActivity = new Date().toISOString();
    session.requestCount++;
    
    // Track agent history
    session.agentHistory.push(agentType);
    if (session.agentHistory.length > this.config.maxSessionHistory) {
      session.agentHistory = session.agentHistory.slice(-this.config.maxSessionHistory);
    }
  }

  /**
   * Checks if a session is expired
   */
  private isSessionExpired(session: SessionContext): boolean {
    const lastActivity = new Date(session.lastActivity).getTime();
    return Date.now() - lastActivity > this.config.sessionTimeout;
  }

  /**
   * Generates unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initializes cleanup tasks
   */
  private initializeCleanupTasks(): void {
    // Clean expired sessions every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);

    // Clean old user context cache every 10 minutes
    setInterval(() => {
      this.cleanupUserContextCache();
    }, 10 * 60 * 1000);
  }

  /**
   * Cleans up expired sessions
   */
  private cleanupExpiredSessions(): void {
    for (const [sessionId, session] of this.activeSessions) {
      if (this.isSessionExpired(session)) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Cleans up old user context cache entries
   */
  private cleanupUserContextCache(): void {
    const cutoffTime = Date.now() - 30 * 60 * 1000; // 30 minutes
    
    for (const [userId, cached] of this.userContextCache) {
      if (cached.cacheTime < cutoffTime) {
        this.userContextCache.delete(userId);
      }
    }
  }

  /**
   * Gets current manager configuration
   */
  getConfig(): ContextManagerConfig {
    return { ...this.config };
  }

  /**
   * Updates manager configuration
   */
  updateConfig(newConfig: Partial<ContextManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gracefully shuts down the context manager
   */
  async shutdown(): Promise<void> {
    // Clear all caches and sessions
    this.activeSessions.clear();
    this.userContextCache.clear();
    this.rateLimitTracking.clear();
  }
}

export default ContextManager;
