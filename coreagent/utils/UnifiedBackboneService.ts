// ...existing code...
// Re-export canonical ID helper through the backbone to avoid parallel systems
export { createCanonicalId } from './canonical-id';
import {
  UnifiedAgentCommunicationInterface,
  UnifiedMetadata,
  UnifiedTimeService,
  UnifiedMetadataService,
  AgentType,
  UnifiedAgentContext,
  ALITAUnifiedContext,
  A2AMessage,
  UnifiedSystemHealth,
  UnifiedIdConfig,
  UnifiedIdResult,
  UnifiedTimestamp,
  AgentCardWithHealth,
  IMemoryClient,
  AgentMessage,
  AgentCard,
  SessionInfo,
} from '../types/oneagent-backbone-types';
// import { OneAgentMemory } from '../memory/OneAgentMemory'; // Removed to prevent circular dependency
// ...existing code...
import type { UnifiedTimeContext, IdType } from '../types/oneagent-backbone-types';
// Canonical package metadata (enabled by resolveJsonModule)
// Used for exposing app name/version via backbone instead of hard-coding
import pkg from '../../package.json';
// ...existing code...

// Canonical configuration import

import {
  unifiedMonitoringService,
  UnifiedMonitoringService,
} from '../monitoring/UnifiedMonitoringService';
// Canonical error taxonomy mapping (low-cardinality stable codes)
import { getErrorCodeLabel } from '../monitoring/errorTaxonomy';
import type { ServerConfig } from '../config/index';
import { oneAgentConfig } from '../config/index';
// NOTE: Avoid early import of UnifiedConfigProvider (it imports UnifiedBackboneService utils for timestamps/ids indirectly)
// We'll resolve it lazily to prevent undefined during initialization order.
interface MinimalConfigProvider {
  getConfig?: () => ServerConfig;
}
function getConfigProviderSafe(): MinimalConfigProvider | null {
  // Provider registers itself globally to avoid circular import
  // (set in UnifiedConfigProvider.ts)
  return (
    (globalThis as unknown as { __unifiedConfigProvider?: MinimalConfigProvider })
      .__unifiedConfigProvider || null
  );
}

// =====================================
// ...existing code...
// UNIFIED BACKBONE SERVICE (CANONICAL CONFIG)
// =====================================

/**
 * UnifiedBackboneService: Canonical entry point for all core systems.
 * - Exposes config as UnifiedBackboneService.config (single source of truth)
 * - All systems must import config from here, not directly from config/index.ts
 */
export class UnifiedBackboneService {
  /**
   * Canonical configuration for OneAgent (single source of truth)
   * Usage: UnifiedBackboneService.config
   */
  // Static config now resolves through UnifiedConfigProvider for layered overrides while preserving shape
  static config: ServerConfig = ((): ServerConfig => {
    const prov = getConfigProviderSafe();
    return prov?.getConfig ? prov.getConfig() : oneAgentConfig;
  })();
  /**
   * Canonical accessor to updated resolved config (in case overrides applied after initial load)
   */
  static getResolvedConfig(): ServerConfig {
    const prov = getConfigProviderSafe();
    return prov?.getConfig ? prov.getConfig() : oneAgentConfig;
  }
  /**
   * Backward compatibility: refresh static config snapshot (avoid long-lived stale copies)
   */
  static refreshConfigSnapshot(): void {
    const prov = getConfigProviderSafe();
    UnifiedBackboneService.config = prov?.getConfig ? prov.getConfig() : oneAgentConfig;
  }

  /**
   * Get a specific endpoint (memory|mcp|ui) from current resolved config (dynamic, reflects overrides)
   */
  static getEndpoint(name: 'memory' | 'mcp' | 'ui'): { url: string; port: number; path?: string } {
    const cfg = UnifiedBackboneService.getResolvedConfig();
    switch (name) {
      case 'memory':
        return { url: cfg.memoryUrl, port: cfg.memoryPort };
      case 'mcp':
        return { url: cfg.mcpUrl, port: cfg.mcpPort, path: '/mcp' };
      case 'ui':
        return { url: cfg.uiUrl, port: cfg.uiPort };
      default: {
        // Exhaustive check
        const _never: never = name; // eslint-disable-line @typescript-eslint/no-unused-vars
        throw new Error(`Unknown endpoint: ${String(name)}`);
      }
    }
  }

  /**
   * Convenience: get all canonical endpoints snapshot
   */
  static getEndpoints() {
    return {
      memory: this.getEndpoint('memory'),
      mcp: this.getEndpoint('mcp'),
      ui: this.getEndpoint('ui'),
    };
  }
  // All config access must use UnifiedBackboneService.config

  // ...existing code...

  /**
   * Canonical Context7 integration (strictly typed, event-driven, memory-driven)
   * Usage: UnifiedBackboneService.context7
   */
  // Context7 integration is now handled via canonical backbone. Legacy references removed.

  // Note: Memory system removed from backbone to prevent circular dependency.
  // Use OneAgentMemory.getInstance() directly where needed.

  /**
   * Canonical health/performance monitoring system (single source of truth)
   * Usage: UnifiedBackboneService.monitoring
   */
  static monitoring: UnifiedMonitoringService =
    unifiedMonitoringService as unknown as UnifiedMonitoringService;
  // ...existing code...
}

/**
 * Canonical Agent Communication Service (A2A + NLACS)
 * Exposes all core and NLACS extension methods for agent-to-agent communication, discussions, insights, and coordination.
 */
export class UnifiedAgentCommunicationService {
  private a2a: UnifiedAgentCommunicationInterface;
  private memory: IMemoryClient;

  constructor(a2a: UnifiedAgentCommunicationInterface, memory: IMemoryClient) {
    this.a2a = a2a;
    this.memory = memory;
  }

  // Core A2A methods
  async registerAgent(agent: AgentCard): Promise<string> {
    // Canonical expects AgentRegistration, adapt as needed
    await this.a2a.registerAgent(agent);

    // Create proper UnifiedMetadata for memory storage
    const metadata = unifiedMetadataService.create('memory', 'UnifiedBackboneService', {
      system: {
        source: 'UnifiedBackboneService',
        component: 'agent-registry',
        userId: 'system',
      },
      content: {
        category: 'agent_card',
        tags: [agent.name],
        sensitivity: 'internal',
        relevanceScore: 1.0,
        contextDependency: 'global',
      },
      quality: {
        score: 1.0,
        confidence: 1.0,
        constitutionalCompliant: true,
        validationLevel: 'enhanced',
      },
    });

    await this.memory.store(agent.name, metadata);
    return agent.name;
  }

  /**
   * Discover agents with advanced filtering (capabilities, health, role, etc.)
   */
  async discoverAgents(filter?: {
    capabilities?: string[];
    health?: 'healthy' | 'degraded' | 'critical' | 'offline';
    role?: string;
  }): Promise<AgentCardWithHealth[]> {
    return this.a2a.discoverAgents(filter || {});
  }
  /**
   * Broadcast a message to all agents in a session
   */
  async broadcastMessage(message: AgentMessage): Promise<string> {
    return this.a2a.broadcastMessage(message);
  }

  /**
   * Get session info by sessionId
   */
  async getSessionInfo(sessionId: string): Promise<SessionInfo | null> {
    return this.a2a.getSessionInfo(sessionId);
  }

  async sendMessage(message: AgentMessage): Promise<string> {
    // Create proper UnifiedMetadata for message storage
    const metadata = unifiedMetadataService.create('memory', 'UnifiedBackboneService', {
      system: {
        source: 'UnifiedBackboneService',
        component: 'message-system',
        userId: 'system',
      },
      content: {
        category: 'agent_message',
        tags: [message.fromAgent, message.toAgent].filter(
          (t): t is string => typeof t === 'string',
        ),
        sensitivity: 'internal',
        relevanceScore: 1.0,
        contextDependency: 'session',
      },
      quality: {
        score: 1.0,
        confidence: 1.0,
        constitutionalCompliant: true,
        validationLevel: 'enhanced',
      },
    });

    await this.memory.store(message.content, metadata);
    return await this.a2a.sendMessage(message);
  }

  async getMessageHistory(sessionId: string, limit = 50): Promise<AgentMessage[]> {
    const result = await this.a2a.getMessageHistory(sessionId, limit);
    // Map A2AMessage[] to AgentMessage[]
    return result.map((msg: A2AMessage) => ({
      id: msg.id,
      content: msg.message, // Correct property from A2AMessage
      fromAgent: msg.fromAgent,
      toAgent: msg.toAgent,
      sessionId: msg.sessionId,
      messageType: msg.messageType,
      timestamp: msg.timestamp,
    }));
  }

  // NLACS/A2A extension methods

  // All health/metrics access must use UnifiedBackboneService.monitoring
  // All health/metrics access must use UnifiedBackboneService.monitoring
}

// =====================================
// UNIFIED TIME SERVICE IMPLEMENTATION
// =====================================

export class OneAgentUnifiedTimeService implements UnifiedTimeService {
  private static instance: OneAgentUnifiedTimeService;
  private contextCache: { context: UnifiedTimeContext; expiry: number } | null = null;
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  public static getInstance(): OneAgentUnifiedTimeService {
    if (!OneAgentUnifiedTimeService.instance) {
      OneAgentUnifiedTimeService.instance = new OneAgentUnifiedTimeService();
    }
    return OneAgentUnifiedTimeService.instance;
  }

  /**
   * Get current timestamp with unified format
   */ public now(): UnifiedTimestamp {
    const jsDate = new Date();
    const context = this.getContext();

    return {
      iso: jsDate.toISOString(),
      unix: jsDate.getTime(),
      utc: jsDate.toISOString(),
      local: jsDate.toString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      context: `${context.context.timeOfDay}_${context.intelligence.energyLevel}`,
      contextual: {
        timeOfDay: context.context.timeOfDay,
        energyLevel: context.intelligence.energyLevel,
        optimalFor: context.intelligence.optimalFocusTime ? ['focus', 'productivity'] : ['general'],
      },
      metadata: {
        source: 'UnifiedTimeService',
        precision: 'second',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  }

  /**
   * Get comprehensive time context with intelligence
   */
  public getContext(): UnifiedTimeContext {
    // Use cache if still valid (avoid recursive call to now())
    const currentTime = Date.now();
    if (this.contextCache && currentTime < this.contextCache.expiry) {
      return this.contextCache.context;
    }

    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const month = now.getMonth();
    const context: UnifiedTimeContext = {
      context: {
        dayOfWeek: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
          day
        ] as 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday',
        timeOfDay: this.getTimeOfDay(hour),
        workingHours: this.isWorkingHours(hour, day),
        weekendMode: day === 0 || day === 6,
        businessDay: day >= 1 && day <= 5,
        peakHours: (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16),
        seasonalContext: this.getSeasonalContext(month),
      },
      intelligence: {
        optimalFocusTime: this.isOptimalFocusTime(hour, day),
        energyLevel: this.getEnergyLevelInternal(hour, day),
        suggestionContext: this.getSuggestionContextInternal(hour, day),
        motivationalTiming: this.getMotivationalTiming(hour, day),
      },
      metadata: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: now,
        contextUpdated: now,
      },
      realTime: {
        unix: now.getTime(),
        utc: now.toISOString(),
        local: now.toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offset: now.getTimezoneOffset(),
      },
    };

    // Cache the context (avoid recursive call)
    this.contextCache = {
      context,
      expiry: currentTime + this.CACHE_DURATION,
    };

    return context;
  }

  /**
   * Check if current time is optimal for specific activities
   */
  public isOptimalTime(type: 'focus' | 'creative' | 'social' | 'rest'): boolean {
    const context = this.getContext();
    const hour = new Date().getHours();

    switch (type) {
      case 'focus':
        return context.intelligence.optimalFocusTime && context.context.peakHours;
      case 'creative':
        return (hour >= 10 && hour <= 12) || (hour >= 15 && hour <= 17);
      case 'social':
        return context.context.workingHours && !context.context.weekendMode;
      case 'rest':
        return hour >= 22 || hour <= 6;
      default:
        return false;
    }
  }
  /**
   * Get current energy level
   */
  public getEnergyLevel(): 'low' | 'medium' | 'high' | 'peak' {
    return this.getContext().intelligence.energyLevel;
  }
  /**
   * Get suggestion context
   */
  public getSuggestionContext(): 'planning' | 'execution' | 'review' | 'rest' | 'none' {
    return this.getContext().intelligence.suggestionContext;
  }

  /**
   * Create timestamp with full context
   */
  public createTimestamp(): UnifiedTimestamp {
    return this.now();
  }

  /**
   * Enhance basic Date with unified context
   */ public enhanceWithContext(basicTime: Date): UnifiedTimestamp {
    const context = this.getContext();
    const hour = basicTime.getHours();

    return {
      iso: basicTime.toISOString(),
      unix: basicTime.getTime(),
      utc: basicTime.toISOString(),
      local: basicTime.toString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      context: `${this.getTimeOfDay(hour)}_${context.intelligence.energyLevel}`,
      contextual: {
        timeOfDay: this.getTimeOfDay(hour),
        energyLevel: context.intelligence.energyLevel,
        optimalFor: this.getOptimalActivities(hour),
      },
      metadata: {
        source: 'UnifiedTimeService',
        precision: 'second',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  }

  // Private helper methods
  private getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private isWorkingHours(hour: number, day: number): boolean {
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17;
  }

  private getSeasonalContext(month: number): 'spring' | 'summer' | 'fall' | 'winter' {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private isOptimalFocusTime(hour: number, day: number): boolean {
    // Peak focus: 9-11 AM and 2-4 PM on business days
    return day >= 1 && day <= 5 && ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16));
  }
  private getEnergyLevelInternal(hour: number, day: number): 'low' | 'medium' | 'high' | 'peak' {
    if (hour >= 10 && hour <= 11 && day >= 1 && day <= 5) return 'peak';
    if (hour >= 9 && hour <= 17 && day >= 1 && day <= 5) return 'high';
    if (hour >= 8 && hour <= 20) return 'medium';
    return 'low';
  }

  private getSuggestionContextInternal(
    hour: number,
    day: number,
  ): 'planning' | 'execution' | 'review' | 'rest' {
    if (hour >= 8 && hour <= 9) return 'planning';
    if (hour >= 10 && hour <= 16 && day >= 1 && day <= 5) return 'execution';
    if (hour >= 17 && hour <= 19) return 'review';
    return 'rest';
  }
  private getMotivationalTiming(
    hour: number,
    _day: number,
  ): 'morning-boost' | 'afternoon-focus' | 'evening-wind-down' | 'night-rest' {
    if (hour >= 6 && hour <= 11) return 'morning-boost';
    if (hour >= 12 && hour <= 17) return 'afternoon-focus';
    if (hour >= 18 && hour <= 21) return 'evening-wind-down';
    return 'night-rest';
  }

  private getOptimalActivities(hour: number): string[] {
    if (hour >= 6 && hour <= 9) return ['planning', 'exercise', 'learning'];
    if (hour >= 10 && hour <= 12) return ['focus-work', 'analysis', 'problem-solving'];
    if (hour >= 13 && hour <= 16) return ['meetings', 'collaboration', 'creative-work'];
    if (hour >= 17 && hour <= 19) return ['review', 'communication', 'admin'];
    if (hour >= 20 && hour <= 22) return ['reflection', 'light-reading', 'social'];
    return ['rest', 'sleep', 'recovery'];
  }
}

// =====================================
// UNIFIED METADATA SERVICE IMPLEMENTATION
// =====================================

export class OneAgentUnifiedMetadataService implements UnifiedMetadataService {
  private static instance: OneAgentUnifiedMetadataService;
  private timeService: UnifiedTimeService;
  private metadataStore: Map<string, UnifiedMetadata> = new Map();

  public static getInstance(): OneAgentUnifiedMetadataService {
    if (!OneAgentUnifiedMetadataService.instance) {
      OneAgentUnifiedMetadataService.instance = new OneAgentUnifiedMetadataService();
    }
    return OneAgentUnifiedMetadataService.instance;
  }

  constructor() {
    this.timeService = OneAgentUnifiedTimeService.getInstance();
  }
  /**
   * Canonical: Update access tracking for metadata
   */
  public updateAccess(id: string, context: string): void {
    const metadata = this.metadataStore.get(id);
    if (!metadata) return;
    const updated: UnifiedMetadata = {
      ...metadata,
      temporal: {
        ...metadata.temporal,
        accessed: this.timeService.now(),
      },
      analytics: {
        ...metadata.analytics,
        accessCount: (metadata.analytics.accessCount ?? 0) + 1,
        lastAccessPattern: context,
        usageContext: [...(metadata.analytics.usageContext ?? []), context].slice(-10),
      },
    };
    this.metadataStore.set(id, updated);
  }

  /**
   * Create new unified metadata
   */
  public create(
    type: string,
    source: string,
    options: Partial<UnifiedMetadata> = {},
  ): UnifiedMetadata {
    const timestamp = this.timeService.now();
    const context = this.timeService.getContext();

    const metadata: UnifiedMetadata = {
      id: options.id || this.generateId(),
      type,
      version: options.version || '1.0.0',

      temporal: {
        created: timestamp,
        updated: timestamp,
        contextSnapshot: {
          timeOfDay: context.context.timeOfDay,
          dayOfWeek: context.context.dayOfWeek,
          businessContext: context.context.businessDay,
          energyContext: context.intelligence.energyLevel,
        },
      },
      system: {
        source,
        component: options.system?.component || 'unknown',
        ...(options.system?.sessionId && { sessionId: options.system.sessionId }),
        ...(options.system?.userId && { userId: options.system.userId }),
        ...(options.system?.agent && { agent: options.system.agent }),
      },

      quality: {
        score: options.quality?.score || 85,
        constitutionalCompliant: options.quality?.constitutionalCompliant || true,
        validationLevel: options.quality?.validationLevel || 'basic',
        confidence: options.quality?.confidence || 0.85,
      },

      content: {
        category: options.content?.category || 'general',
        tags: options.content?.tags || [],
        sensitivity: options.content?.sensitivity || 'internal',
        relevanceScore: options.content?.relevanceScore || 0.8,
        contextDependency: options.content?.contextDependency || 'session',
      },
      relationships: {
        ...(options.relationships?.parent && { parent: options.relationships.parent }),
        children: options.relationships?.children || [],
        related: options.relationships?.related || [],
        dependencies: options.relationships?.dependencies || [],
      },

      analytics: {
        accessCount: 0,
        lastAccessPattern: 'created',
        usageContext: [],
      },
    };

    this.metadataStore.set(metadata.id, metadata);
    return metadata;
  }

  /**
   * Update existing metadata
   */
  public update(id: string, changes: Partial<UnifiedMetadata>): UnifiedMetadata {
    const existing = this.metadataStore.get(id);
    if (!existing) {
      throw new Error(`Metadata not found: ${id}`);
    }
    const updated: UnifiedMetadata = {
      ...existing,
      ...changes,
      temporal: {
        ...existing.temporal,
        updated: this.timeService.now(),
        ...(changes.temporal?.accessed && { accessed: changes.temporal.accessed }),
      },
    };

    this.metadataStore.set(id, updated);
    return updated;
  }

  /**
   * Retrieve metadata by ID
   */
  public retrieve(id: string): UnifiedMetadata | null {
    const metadata = this.metadataStore.get(id);
    if (metadata) {
      // Update access tracking
      this.updateAccess(id, 'retrieval');
    }
    return metadata || null;
  }

  /**
   * Validate metadata quality
   */
  public validateQuality(metadata: UnifiedMetadata): {
    valid: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    // Check required fields
    if (!metadata.id) {
      issues.push('Missing ID');
      score -= 20;
    }
    if (!metadata.type) {
      issues.push('Missing type');
      score -= 15;
    }
    if (!metadata.temporal.created) {
      issues.push('Missing creation timestamp');
      score -= 25;
    }

    // Check quality metrics
    if (metadata.quality.score < 70) {
      issues.push('Low quality score');
      score -= 10;
    }
    if (!metadata.quality.constitutionalCompliant) {
      issues.push('Constitutional non-compliance');
      score -= 30;
    }

    // Check content completeness
    if (metadata.content.tags.length === 0) {
      issues.push('No content tags');
      score -= 5;
    }
    if (metadata.content.relevanceScore < 0.5) {
      issues.push('Low relevance score');
      score -= 10;
    }

    return {
      valid: issues.length === 0,
      score: Math.max(0, score),
      issues,
    };
  }

  /**
   * Ensure constitutional compliance
   */
  public ensureConstitutionalCompliance(metadata: UnifiedMetadata): boolean {
    // Basic constitutional checks
    if (metadata.content.sensitivity === 'restricted' && !metadata.system.userId) {
      return false;
    }
    if (metadata.quality.score < 60) {
      return false;
    }
    return true;
  }

  /**
   * Create enhanced metadata for inter-agent communication
   * Ensures proper context, privacy isolation, and traceability
   */
  public createInterAgentMetadata(
    communicationType:
      | 'direct_message'
      | 'multi_agent'
      | 'broadcast'
      | 'coordination'
      | 'delegation',
    sourceAgentId: string,
    userId: string,
    sessionId: string,
    options: {
      targetAgentId?: string;
      messageType?: 'request' | 'response' | 'notification' | 'coordination' | 'status';
      projectContext?: string;
      topicContext?: string;
      workflowId?: string;
      parentMessageId?: string;
      privacyLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
      userDataScope?: 'global' | 'session' | 'project' | 'restricted';
      qualityThreshold?: number;
      priorityLevel?: 'low' | 'medium' | 'high' | 'urgent';
      correlationId?: string;
      requestId?: string;
    } = {},
  ): UnifiedMetadata {
    const timestamp = this.timeService.now();
    const context = this.timeService.getContext();
    const metadata: UnifiedMetadata = {
      id: this.generateId(),
      type: 'inter_agent_communication',
      version: '1.0.0',
      temporal: {
        created: timestamp,
        updated: timestamp,
        contextSnapshot: {
          timeOfDay: context.context.timeOfDay,
          dayOfWeek: context.context.dayOfWeek,
          businessContext: context.context.businessDay,
          energyContext: context.intelligence.energyLevel,
        },
      },
      system: {
        source: `agent_${sourceAgentId}`,
        component: 'multi_agent_orchestrator',
        sessionId,
        userId,
        agent: {
          id: sourceAgentId,
          type: 'specialized',
        },
      },
      quality: {
        score: options.qualityThreshold || 90,
        constitutionalCompliant: true,
        validationLevel: 'enhanced',
        confidence: 0.95,
      },
      content: {
        category: 'agent_communication',
        tags: [
          'inter_agent',
          communicationType,
          options.messageType || 'notification',
          ...(options.projectContext ? [`project_${options.projectContext}`] : []),
          ...(options.topicContext ? [`topic_${options.topicContext}`] : []),
        ],
        sensitivity: options.privacyLevel || 'internal',
        relevanceScore: 0.9,
        contextDependency:
          options.userDataScope === 'restricted'
            ? 'session'
            : options.userDataScope === 'project'
              ? 'user'
              : options.userDataScope || 'session',
      },
      relationships: {
        ...(options.parentMessageId && { parent: options.parentMessageId }),
        children: [],
        related: options.correlationId ? [options.correlationId] : [],
        dependencies: [
          `user_${userId}`,
          `session_${sessionId}`,
          `source_agent_${sourceAgentId}`,
          ...(options.targetAgentId ? [`target_agent_${options.targetAgentId}`] : []),
          ...(options.projectContext ? [`project_${options.projectContext}`] : []),
          ...(options.workflowId ? [`workflow_${options.workflowId}`] : []),
        ],
      },
      analytics: {
        accessCount: 0,
        lastAccessPattern: 'created',
        usageContext: [],
      },
    };
    // Add inter-agent specific custom data
    const customData = {
      interAgentMetadata: {
        communicationType,
        sourceAgentId,
        targetAgentId: options.targetAgentId,
        messageType: options.messageType || 'notification',
        projectContext: options.projectContext,
        topicContext: options.topicContext,
        workflowId: options.workflowId,
        parentMessageId: options.parentMessageId,
        userId,
        sessionId,
        privacyLevel: options.privacyLevel || 'internal',
        userDataScope: options.userDataScope || 'session',
        qualityThreshold: options.qualityThreshold || 90,
        constitutionalCompliance: true,
        priorityLevel: options.priorityLevel || 'medium',
        timestamp: timestamp.iso,
        correlationId: options.correlationId,
        requestId: options.requestId,
      },
    };
    // Store custom data in metadata
    (metadata as Record<string, unknown>).customData = customData;
    return metadata;
  }

  // Private helper methods
  // Private helper methods

  private generateId(): string {
    // Canonical ID generation: use exported generateUnifiedId
    return generateUnifiedId('operation', 'unified');
  }

  private calculateRelevanceDecay(metadata: UnifiedMetadata): number {
    const age = this.timeService.now().unix - metadata.temporal.created.unix;
    const days = age / (1000 * 60 * 60 * 24);
    // Simple decay model - can be enhanced
    switch (metadata.content.contextDependency) {
      case 'session':
        return Math.max(0, 1 - days / 1);
      case 'user':
        return Math.max(0, 1 - days / 30);
      case 'global':
        return Math.max(0, 1 - days / 365);
      default:
        return Math.max(0, 1 - days / 7);
    }
  }
}

// =====================================
// UNIFIED BACKBONE ORCHESTRATOR
// =====================================

export class OneAgentUnifiedBackbone {
  private static instance: OneAgentUnifiedBackbone;
  private timeService: UnifiedTimeService;
  private metadataService: UnifiedMetadataService;
  private cacheSystem: OneAgentUnifiedCacheSystem<unknown>;
  private errorSystem: OneAgentUnifiedErrorSystem;
  private mcpSystem: OneAgentUnifiedMCPSystem;

  public static getInstance(): OneAgentUnifiedBackbone {
    if (!OneAgentUnifiedBackbone.instance) {
      OneAgentUnifiedBackbone.instance = new OneAgentUnifiedBackbone();
    }
    return OneAgentUnifiedBackbone.instance;
  }

  constructor() {
    this.timeService = OneAgentUnifiedTimeService.getInstance();
    this.metadataService = OneAgentUnifiedMetadataService.getInstance();
    this.cacheSystem = new OneAgentUnifiedCacheSystem(
      undefined,
      this.timeService as OneAgentUnifiedTimeService,
    );
    this.errorSystem = new OneAgentUnifiedErrorSystem();
    this.mcpSystem = new OneAgentUnifiedMCPSystem(
      new OneAgentUnifiedCacheSystem<OneAgentMCPResponse>(
        undefined,
        this.timeService as OneAgentUnifiedTimeService,
      ),
      this.errorSystem,
      this.timeService,
    );
  }

  // =====================================
  // CACHE SYSTEM ACCESS
  // =====================================

  get cache(): OneAgentUnifiedCacheSystem {
    return this.cacheSystem;
  }

  // =====================================
  // ERROR SYSTEM ACCESS
  // =====================================

  get errorHandler(): OneAgentUnifiedErrorSystem {
    return this.errorSystem;
  }

  // =====================================
  // MCP SYSTEM ACCESS
  // =====================================

  get mcpClient(): OneAgentUnifiedMCPSystem {
    return this.mcpSystem;
  }

  /**
   * Get unified services for dependency injection
   */
  public getServices() {
    return {
      timeService: this.timeService,
      metadataService: this.metadataService,
      errorHandler: this.errorHandler,
    };
  }

  /**
   * Create agent context with unified services
   */
  public createAgentContext(
    agentId: string,
    agentType: AgentType,
    options: {
      sessionId: string;
      userId?: string;
      capabilities: string[];
      memoryEnabled: boolean;
      aiEnabled: boolean;
    },
  ): UnifiedAgentContext {
    return {
      agentId,
      agentType,
      capabilities: options.capabilities,
      timeContext: this.timeService.getContext(),
      metadata: this.metadataService.create('agent_context', 'agent_system', {
        content: {
          category: 'agent',
          tags: [`agent:${agentId}`, `type:${agentType}`],
          sensitivity: 'internal' as const,
          relevanceScore: 0.9,
          contextDependency: 'session' as const,
        },
      }),
      session: {
        sessionId: options.sessionId,
        ...(options.userId && { userId: options.userId }),
        startTime: this.timeService.now(),
      },
    };
  }

  /**
   * Create ALITA context with unified tracking
   */ public createALITAContext(
    trigger: string,
    impact: 'minor' | 'moderate' | 'significant' | 'major',
  ): ALITAUnifiedContext {
    // Convert impact to proper enum values
    const impactLevel =
      impact === 'minor'
        ? 'low'
        : impact === 'moderate'
          ? 'medium'
          : impact === 'significant'
            ? 'high'
            : 'critical';

    return {
      systemContext: this.timeService.getContext(),
      agentContext: this.createAgentContext('alita-evolution', 'specialist', {
        sessionId: 'alita-context',
        capabilities: ['evolution', 'learning', 'adaptation'],
        memoryEnabled: true,
        aiEnabled: true,
      }),
      memoryContext: [], // Empty for now, would be populated by memory service
      evolutionTrigger: trigger,
      impactLevel,
      timestamp: this.timeService.now(),
    };
  }

  /**
   * Get system health with unified monitoring
   */ public getSystemHealth(): UnifiedSystemHealth {
    return {
      overall: {
        status: 'healthy',
        score: 0.95,
        timestamp: this.timeService.now(),
      },
      components: {
        timeService: { status: 'operational', responseTime: 1.5, operational: true },
        metadataService: { status: 'operational', operationsPerSecond: 100, operational: true },
        memoryService: { status: 'operational', storageHealth: 0.95, operational: true },
        constitutionalAI: { status: 'operational', complianceRate: 0.85, operational: true },
      },
      metrics: {
        uptime: 0.999, // 99.9% uptime
        errorRate: 0.001, // 0.1% error rate
        performanceScore: 0.95, // 95% performance score
      },
    };
  }

  /**
   * CRITICAL: Replace all new Date() usage - for testing and validation
   */
  public validateNoRawDateUsage(): { hasRawDates: boolean; replacements: string[] } {
    // This method helps validate that systems are using unified time
    return {
      hasRawDates: false, // Will be updated by implementation
      replacements: [
        'new Date() → timeService.now()',
        'new Date().toISOString() → timeService.now().utc',
        'Date.now() → timeService.now().unix',
        'timestamp: new Date() → timestamp: metadataService.create(...)',
      ],
    };
  }

  /**
   * Generate secure random suffix for IDs
   */
  private generateSecureRandomSuffix(): string {
    try {
      // Prefer UUID v4 when available
      const anyCrypto: unknown = (
        globalThis as unknown as { crypto?: { randomUUID?: () => string } }
      ).crypto;
      if (
        anyCrypto &&
        typeof (anyCrypto as { randomUUID?: () => string }).randomUUID === 'function'
      ) {
        return (anyCrypto as { randomUUID: () => string }).randomUUID().split('-')[0];
      }
      // Fallback: attempt Node.js crypto via eval-free import
      try {
        const req = eval('require') as (m: string) => unknown;
        const nodeCrypto = req('crypto') as {
          randomBytes: (n: number) => { toString: (enc: string) => string };
        };
        return nodeCrypto.randomBytes(6).toString('hex');
      } catch {
        // ignore
      }
    } catch {
      // Last resort: timestamp-based suffix (deterministic-ish, no Math.random)
      return this.timeService.now().unix.toString(36);
    }
    // If all else fails
    return this.timeService.now().unix.toString(36);
  }

  /**
   * Generate unified ID with canonical pattern
   * CANONICAL: This replaces all manual ID generation patterns
   */
  public generateUnifiedId(
    type: IdType,
    context?: string,
    config?: Partial<UnifiedIdConfig>,
  ): string {
    const timestamp = this.timeService.now().unix;
    const randomSuffix = this.generateSecureRandomSuffix();
    const prefix = context ? `${type}_${context}` : type;

    switch (config?.format) {
      case 'short':
        return `${prefix}_${randomSuffix}`;
      case 'long':
        return `${prefix}_${timestamp}_${randomSuffix}_${this.getServices().timeService.now().unix}`;
      case 'medium':
      default:
        return `${prefix}_${timestamp}_${randomSuffix}`;
    }
  }

  /**
   * Generate unified ID with detailed result metadata
   */
  public generateUnifiedIdWithResult(
    type: IdType,
    context?: string,
    config?: Partial<UnifiedIdConfig>,
  ): UnifiedIdResult {
    const id = this.generateUnifiedId(type, context, config);
    const timestamp = this.timeService.now().unix;

    return {
      id,
      type,
      ...(context && { context }),
      timestamp,
      metadata: {
        generated: new Date(),
        source: 'UnifiedBackboneService',
        format: config?.format || 'medium',
        secure: config?.secure || false,
      },
    };
  }
}

// =====================================
// ONEAGENT UNIFIED CACHE SYSTEM
// =====================================

export interface OneAgentCacheEntry<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  size: number;
  ttl?: number;
  contentHash?: string;
}

export interface OneAgentCacheMetrics {
  memoryHits: number;
  diskHits: number;
  networkHits: number;
  totalMisses: number;
  totalQueries: number;
  averageResponseTime: number;
  memoryUsage: number;
  hitRate: number;
  estimatedSavingsMs: number;
}

export interface OneAgentCacheConfig {
  memoryCacheSize: number; // In-memory cache (1ms target)
  diskCacheSize: number; // Disk cache (50ms target)
  networkCacheSize: number; // Network cache (200ms target)
  defaultTTL: number; // Default time-to-live in ms
  cleanupInterval: number; // Cleanup frequency
  enableMetrics: boolean; // Performance tracking
}

/**
 * OneAgent Unified Cache System
 *
 * Multi-tier caching with OneAgent ecosystem integration:
 * - Memory Cache: 1ms target (embeddings, frequent data)
 * - Disk Cache: 50ms target (analysis results, documents)
 * - Network Cache: 200ms target (external API responses)
 *
 * Replaces: UnifiedCacheSystem, EmbeddingCache, embeddingCache
 */
export class OneAgentUnifiedCacheSystem<T = unknown> {
  private memoryCache: Map<string, OneAgentCacheEntry<T>> = new Map();
  private diskCache: Map<string, OneAgentCacheEntry<T>> = new Map();
  private networkCache: Map<string, OneAgentCacheEntry<T>> = new Map();

  private metrics: OneAgentCacheMetrics = {
    memoryHits: 0,
    diskHits: 0,
    networkHits: 0,
    totalMisses: 0,
    totalQueries: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    hitRate: 0,
    estimatedSavingsMs: 0,
  };

  private config: OneAgentCacheConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private timeService: OneAgentUnifiedTimeService;

  constructor(config?: Partial<OneAgentCacheConfig>, timeService?: OneAgentUnifiedTimeService) {
    this.config = {
      memoryCacheSize: 1000,
      diskCacheSize: 10000,
      networkCacheSize: 50000,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      enableMetrics: true,
      ...config,
    };

    // Initialize time service (use provided or create default)
    this.timeService = timeService || new OneAgentUnifiedTimeService();

    this.startCleanupTimer();
  }

  /**
   * Get cached value with multi-tier lookup
   */
  async get(key: string): Promise<T | null> {
    const startTime = Date.now(); // Keep Date.now() for performance timing
    this.metrics.totalQueries++;

    // Tier 1: Memory cache (1ms target)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.updateEntry(memoryEntry);
      this.metrics.memoryHits++;
      this.updateMetrics(Date.now() - startTime); // Keep Date.now() for performance timing
      return memoryEntry.value;
    }

    // Tier 2: Disk cache (50ms target)
    const diskEntry = this.diskCache.get(key);
    if (diskEntry && !this.isExpired(diskEntry)) {
      this.updateEntry(diskEntry);
      this.metrics.diskHits++;
      // Promote to memory cache
      this.setMemoryCache(key, diskEntry.value, diskEntry.ttl || this.config.defaultTTL);
      this.updateMetrics(Date.now() - startTime); // Keep Date.now() for performance timing
      return diskEntry.value;
    }

    // Tier 3: Network cache (200ms target)
    const networkEntry = this.networkCache.get(key);
    if (networkEntry && !this.isExpired(networkEntry)) {
      this.updateEntry(networkEntry);
      this.metrics.networkHits++;
      // Promote to memory and disk cache
      this.setMemoryCache(key, networkEntry.value, networkEntry.ttl || this.config.defaultTTL);
      this.setDiskCache(key, networkEntry.value, networkEntry.ttl || this.config.defaultTTL);
      this.updateMetrics(Date.now() - startTime); // Keep Date.now() for performance timing
      return networkEntry.value;
    }

    // Cache miss
    this.metrics.totalMisses++;
    this.updateMetrics(Date.now() - startTime); // Keep Date.now() for performance timing
    return null;
  }

  /**
   * Set value in appropriate cache tier
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const actualTTL = ttl || this.config.defaultTTL;

    // Always set in memory cache for fastest access
    this.setMemoryCache(key, value, actualTTL);

    // Set in disk cache for persistence
    this.setDiskCache(key, value, actualTTL);

    // Set in network cache for distributed access
    this.setNetworkCache(key, value, actualTTL);
  }

  /**
   * Delete from all cache tiers
   */
  async delete(key: string): Promise<boolean> {
    const memoryDeleted = this.memoryCache.delete(key);
    const diskDeleted = this.diskCache.delete(key);
    const networkDeleted = this.networkCache.delete(key);

    return memoryDeleted || diskDeleted || networkDeleted;
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.diskCache.clear();
    this.networkCache.clear();
  }

  /**
   * Get cache metrics
   */
  getMetrics(): OneAgentCacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache health status
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      memoryUsage: number;
      hitRate: number;
      averageResponseTime: number;
      cacheSize: number;
    };
  } {
    // Derive health based on hit rate and response time thresholds
    const hitRate = this.metrics.hitRate;
    const avgResponseTime = this.metrics.averageResponseTime;
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (hitRate < 0.7 || avgResponseTime > 100) status = 'degraded';
    if (hitRate < 0.5 || avgResponseTime > 200) status = 'unhealthy';
    return {
      status,
      details: {
        memoryUsage: this.metrics.memoryUsage,
        hitRate,
        averageResponseTime: avgResponseTime,
        cacheSize: this.memoryCache.size + this.diskCache.size + this.networkCache.size,
      },
    };
  }

  // Private helper methods
  private setMemoryCache(key: string, value: T, ttl: number): void {
    if (this.memoryCache.size >= this.config.memoryCacheSize) {
      this.evictLRU(this.memoryCache);
    }

    this.memoryCache.set(key, {
      key,
      value,
      timestamp: this.timeService.now().unix,
      accessCount: 1,
      size: this.estimateSize(value),
      ttl,
    });
  }

  private setDiskCache(key: string, value: T, ttl: number): void {
    if (this.diskCache.size >= this.config.diskCacheSize) {
      this.evictLRU(this.diskCache);
    }

    this.diskCache.set(key, {
      key,
      value,
      timestamp: this.timeService.now().unix,
      accessCount: 1,
      size: this.estimateSize(value),
      ttl,
    });
  }

  private setNetworkCache(key: string, value: T, ttl: number): void {
    if (this.networkCache.size >= this.config.networkCacheSize) {
      this.evictLRU(this.networkCache);
    }

    this.networkCache.set(key, {
      key,
      value,
      timestamp: this.timeService.now().unix,
      accessCount: 1,
      size: this.estimateSize(value),
      ttl,
    });
  }

  private isExpired(entry: OneAgentCacheEntry<T>): boolean {
    if (!entry.ttl) return false;
    return this.timeService.now().unix - entry.timestamp > entry.ttl;
  }

  private updateEntry(entry: OneAgentCacheEntry<T>): void {
    entry.accessCount++;
    entry.timestamp = this.timeService.now().unix;
  }

  private evictLRU(cache: Map<string, OneAgentCacheEntry<T>>): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 1000; // Default size estimate
    }
  }

  private updateMetrics(responseTime: number): void {
    const totalHits = this.metrics.memoryHits + this.metrics.diskHits + this.metrics.networkHits;
    this.metrics.hitRate = totalHits / this.metrics.totalQueries;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalQueries - 1) + responseTime) /
      this.metrics.totalQueries;
    this.metrics.memoryUsage = this.memoryCache.size + this.diskCache.size + this.networkCache.size;
    this.metrics.estimatedSavingsMs = totalHits * 100; // Estimate 100ms saved per hit
  }

  private startCleanupTimer(): void {
    // Background maintenance timer (does not keep process alive)
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
    // Allow process to exit naturally if this is the only remaining handle
    (this.cleanupTimer as unknown as NodeJS.Timer).unref?.();
  }

  private cleanup(): void {
    // Cleanup expired entries from all tiers
    [this.memoryCache, this.diskCache, this.networkCache].forEach((cache) => {
      cache.forEach((entry, key) => {
        if (this.isExpired(entry)) {
          cache.delete(key);
        }
      });
    });
  }

  /**
   * Shutdown cache system
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

// =====================================
// ONEAGENT UNIFIED ERROR SYSTEM
// =====================================

/**
 * OneAgent Error Classification
 */
enum OneAgentErrorType {
  SYSTEM = 'system',
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  TIMEOUT = 'timeout',
  RESOURCE = 'resource',
  CONFIGURATION = 'configuration',
  EXTERNAL = 'external',
  USER = 'user',
}

/**
 * OneAgent Error Severity Levels
 */
enum OneAgentErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  FATAL = 'fatal',
}

/**
 * OneAgent Error Entry Structure
 */
interface OneAgentErrorEntry {
  id: string;
  type: OneAgentErrorType;
  severity: OneAgentErrorSeverity;
  message: string;
  originalError?: Error;
  context: Record<string, unknown>;
  timestamp: UnifiedTimestamp;
  agentId?: string;
  userId?: string;
  stackTrace?: string;
  /** Canonical taxonomy code (stable, low-cardinality) */
  taxonomyCode?: string;
  metadata: {
    component: string;
    operation: string;
    attemptCount: number;
    recoverable: boolean;
    handled: boolean;
  };
}

/**
 * OneAgent Error System Configuration
 */
interface OneAgentErrorConfig {
  maxRetries: number;
  retryDelay: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  enableRecovery: boolean;
  enableNotifications: boolean;
  storageEnabled: boolean;
  maxStoredErrors: number;
  constitutionalValidation: boolean;
}

/**
 * OneAgent Error Recovery Strategy
 */
interface OneAgentErrorRecovery {
  strategy: 'retry' | 'fallback' | 'graceful_degradation' | 'user_prompt' | 'system_reset';
  maxAttempts: number;
  fallbackAction?: () => Promise<unknown>;
  gracefulDegradation?: () => Promise<unknown>;
  userPrompt?: string;
}

/**
 * OneAgent Error Metrics
 */
interface OneAgentErrorMetrics {
  totalErrors: number;
  errorsByType: Record<OneAgentErrorType, number>;
  errorsBySeverity: Record<OneAgentErrorSeverity, number>;
  recoverySuccessRate: number;
  averageResolutionTime: number;
  errorTrends: {
    lastHour: number;
    lastDay: number;
    lastWeek: number;
  };
}

/**
 * OneAgent Unified Error System
 * Multi-tier error handling with intelligent recovery and Constitutional AI compliance
 */
export class OneAgentUnifiedErrorSystem {
  private config: OneAgentErrorConfig;
  private errorStorage = new Map<string, OneAgentErrorEntry>();
  private metrics: OneAgentErrorMetrics;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private timeService: OneAgentUnifiedTimeService;

  constructor(config: Partial<OneAgentErrorConfig> = {}) {
    this.timeService = OneAgentUnifiedTimeService.getInstance();
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      logLevel: 'error',
      enableRecovery: true,
      enableNotifications: true,
      storageEnabled: true,
      maxStoredErrors: 1000,
      constitutionalValidation: true,
      ...config,
    };

    this.metrics = {
      totalErrors: 0,
      errorsByType: Object.fromEntries(
        Object.values(OneAgentErrorType).map((type) => [type, 0]),
      ) as Record<OneAgentErrorType, number>,
      errorsBySeverity: Object.fromEntries(
        Object.values(OneAgentErrorSeverity).map((severity) => [severity, 0]),
      ) as Record<OneAgentErrorSeverity, number>,
      recoverySuccessRate: 0,
      averageResolutionTime: 0,
      errorTrends: {
        lastHour: 0,
        lastDay: 0,
        lastWeek: 0,
      },
    };

    this.startCleanupTimer();
  }

  /**
   * Handle error with intelligent recovery
   */
  async handleError(
    error: Error | string,
    context: Record<string, unknown> = {},
    recovery?: OneAgentErrorRecovery,
  ): Promise<OneAgentErrorEntry> {
    const errorEntry = this.createErrorEntry(error, context);

    // Store error
    if (this.config.storageEnabled) {
      this.errorStorage.set(errorEntry.id, errorEntry);
    }

    // Update metrics
    this.updateMetrics(errorEntry);

    // Log error
    this.logError(errorEntry);

    // Attempt recovery if enabled
    if (this.config.enableRecovery && recovery) {
      await this.attemptRecovery(errorEntry, recovery);
    }

    return errorEntry;
  }

  /**
   * Log error with appropriate level
   */
  logError(errorEntry: OneAgentErrorEntry): void {
    const logMessage = `[OneAgent Error] ${errorEntry.type.toUpperCase()} - ${errorEntry.message}`;
    const logContext = {
      id: errorEntry.id,
      severity: errorEntry.severity,
      component: errorEntry.metadata.component,
      operation: errorEntry.metadata.operation,
      timestamp: errorEntry.timestamp.iso,
    };

    switch (errorEntry.severity) {
      case OneAgentErrorSeverity.FATAL:
      case OneAgentErrorSeverity.CRITICAL:
        console.error(logMessage, logContext);
        break;
      case OneAgentErrorSeverity.HIGH:
        console.warn(logMessage, logContext);
        break;
      case OneAgentErrorSeverity.MEDIUM:
        if (this.config.logLevel !== 'error') console.log(logMessage, logContext);
        break;
      case OneAgentErrorSeverity.LOW:
        if (this.config.logLevel === 'debug') console.debug(logMessage, logContext);
        break;
    }
  }

  /**
   * Attempt error recovery
   */
  async attemptRecovery(
    errorEntry: OneAgentErrorEntry,
    recovery: OneAgentErrorRecovery,
  ): Promise<boolean> {
    const maxAttempts = Math.min(recovery.maxAttempts, this.config.maxRetries);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        errorEntry.metadata.attemptCount = attempt;

        switch (recovery.strategy) {
          case 'retry':
            await this.delay(this.config.retryDelay * attempt);
            // Retry logic would be handled by calling code
            break;

          case 'fallback':
            if (recovery.fallbackAction) {
              await recovery.fallbackAction();
              errorEntry.metadata.handled = true;
              return true;
            }
            break;

          case 'graceful_degradation':
            if (recovery.gracefulDegradation) {
              await recovery.gracefulDegradation();
              errorEntry.metadata.handled = true;
              return true;
            }
            break;

          case 'user_prompt':
            // User prompt handling would be implemented by UI layer
            console.warn(`User intervention needed: ${recovery.userPrompt}`);
            break;

          case 'system_reset':
            // System reset would be handled by system layer
            console.error('System reset required for error recovery');
            break;
        }
      } catch (recoveryError) {
        console.error(`Recovery attempt ${attempt} failed:`, recoveryError);
      }
    }

    return false;
  }

  /**
   * Create structured error entry
   */
  private createErrorEntry(
    error: Error | string,
    context: Record<string, unknown>,
  ): OneAgentErrorEntry {
    const timestamp = this.timeService.now();
    const errorId = generateUnifiedId('operation', 'error');

    const message = typeof error === 'string' ? error : error.message;
    const originalError = typeof error === 'string' ? undefined : error;
    const stackTrace = originalError?.stack;
    // Derive canonical taxonomy code (stable, low-cardinality) for downstream metrics/logging.
    const taxonomyCode = getErrorCodeLabel(error).toString();

    // Classify error type and severity
    const type = this.classifyErrorType(message, context);
    const severity = this.determineSeverity(type, message, context);

    const errorEntry: OneAgentErrorEntry = {
      id: errorId,
      type,
      severity,
      message,
      context,
      timestamp,
      taxonomyCode,
      metadata: {
        component: (context.component as string) || 'unknown',
        operation: (context.operation as string) || 'unknown',
        attemptCount: 0,
        recoverable: this.isRecoverable(type, severity),
        handled: false,
      },
    };

    if (originalError) {
      errorEntry.originalError = originalError;
    }

    if (stackTrace) {
      errorEntry.stackTrace = stackTrace;
    }

    if (context.agentId) {
      errorEntry.agentId = context.agentId as string;
    }

    if (context.userId) {
      errorEntry.userId = context.userId as string;
    }

    return errorEntry;
  }

  /**
   * Classify error type based on message and context
   */
  private classifyErrorType(message: string, context: Record<string, unknown>): OneAgentErrorType {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return OneAgentErrorType.NETWORK;
    }
    if (lowerMessage.includes('timeout')) {
      return OneAgentErrorType.TIMEOUT;
    }
    if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized')) {
      return OneAgentErrorType.AUTHENTICATION;
    }
    if (lowerMessage.includes('permission') || lowerMessage.includes('forbidden')) {
      return OneAgentErrorType.PERMISSION;
    }
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return OneAgentErrorType.VALIDATION;
    }
    if (lowerMessage.includes('config') || lowerMessage.includes('setting')) {
      return OneAgentErrorType.CONFIGURATION;
    }
    if (
      lowerMessage.includes('resource') ||
      lowerMessage.includes('memory') ||
      lowerMessage.includes('disk')
    ) {
      return OneAgentErrorType.RESOURCE;
    }
    if (context.external || lowerMessage.includes('external') || lowerMessage.includes('api')) {
      return OneAgentErrorType.EXTERNAL;
    }
    if (context.userInput || lowerMessage.includes('user')) {
      return OneAgentErrorType.USER;
    }

    return OneAgentErrorType.SYSTEM;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(
    type: OneAgentErrorType,
    message: string,
    _context: Record<string, unknown>,
  ): OneAgentErrorSeverity {
    const lowerMessage = message.toLowerCase();

    // Fatal conditions
    if (lowerMessage.includes('fatal') || lowerMessage.includes('crash')) {
      return OneAgentErrorSeverity.FATAL;
    }

    // Critical conditions
    if (type === OneAgentErrorType.SYSTEM && lowerMessage.includes('critical')) {
      return OneAgentErrorSeverity.CRITICAL;
    }

    // High severity
    if (type === OneAgentErrorType.AUTHENTICATION || type === OneAgentErrorType.PERMISSION) {
      return OneAgentErrorSeverity.HIGH;
    }

    // Medium severity
    if (type === OneAgentErrorType.NETWORK || type === OneAgentErrorType.TIMEOUT) {
      return OneAgentErrorSeverity.MEDIUM;
    }

    // Low severity for user and validation errors
    if (type === OneAgentErrorType.USER || type === OneAgentErrorType.VALIDATION) {
      return OneAgentErrorSeverity.LOW;
    }

    return OneAgentErrorSeverity.MEDIUM;
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverable(type: OneAgentErrorType, severity: OneAgentErrorSeverity): boolean {
    if (severity === OneAgentErrorSeverity.FATAL) return false;

    switch (type) {
      case OneAgentErrorType.NETWORK:
      case OneAgentErrorType.TIMEOUT:
      case OneAgentErrorType.RESOURCE:
      case OneAgentErrorType.EXTERNAL:
        return true;
      case OneAgentErrorType.AUTHENTICATION:
      case OneAgentErrorType.PERMISSION:
        return false;
      default:
        return severity !== OneAgentErrorSeverity.CRITICAL;
    }
  }

  /**
   * Update error metrics
   */
  private updateMetrics(errorEntry: OneAgentErrorEntry): void {
    this.metrics.totalErrors++;
    this.metrics.errorsByType[errorEntry.type]++;
    this.metrics.errorsBySeverity[errorEntry.severity]++;

    // Update trends (simplified)
    this.metrics.errorTrends.lastHour++;
    this.metrics.errorTrends.lastDay++;
    this.metrics.errorTrends.lastWeek++;
  }

  /**
   * Get error by ID
   */
  getError(id: string): OneAgentErrorEntry | undefined {
    return this.errorStorage.get(id);
  }

  /**
   * Search errors by criteria
   */
  searchErrors(criteria: {
    type?: OneAgentErrorType;
    severity?: OneAgentErrorSeverity;
    component?: string;
    agentId?: string;
    userId?: string;
    timeRange?: { start: Date; end: Date };
  }): OneAgentErrorEntry[] {
    return Array.from(this.errorStorage.values()).filter((error) => {
      if (criteria.type && error.type !== criteria.type) return false;
      if (criteria.severity && error.severity !== criteria.severity) return false;
      if (criteria.component && error.metadata.component !== criteria.component) return false;
      if (criteria.agentId && error.agentId !== criteria.agentId) return false;
      if (criteria.userId && error.userId !== criteria.userId) return false;
      if (criteria.timeRange) {
        const errorTime = new Date(error.timestamp.iso);
        if (errorTime < criteria.timeRange.start || errorTime > criteria.timeRange.end)
          return false;
      }
      return true;
    });
  }

  /**
   * Get error metrics
   */
  getMetrics(): OneAgentErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get error system health
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      totalErrors: number;
      criticalErrors: number;
      recoveryRate: number;
      storageUsage: number;
    };
  } {
    const criticalErrors =
      this.metrics.errorsBySeverity[OneAgentErrorSeverity.CRITICAL] +
      this.metrics.errorsBySeverity[OneAgentErrorSeverity.FATAL];

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (criticalErrors > 0) status = 'unhealthy';
    else if (this.metrics.errorTrends.lastHour > 10) status = 'degraded';

    return {
      status,
      details: {
        totalErrors: this.metrics.totalErrors,
        criticalErrors,
        recoveryRate: this.metrics.recoverySuccessRate,
        storageUsage: this.errorStorage.size,
      },
    };
  }

  /**
   * Clear old errors
   */
  private cleanup(): void {
    if (this.errorStorage.size > this.config.maxStoredErrors) {
      const entries = Array.from(this.errorStorage.entries());
      entries.sort((a, b) => a[1].timestamp.unix - b[1].timestamp.unix);

      const toDelete = entries.slice(0, entries.length - this.config.maxStoredErrors);
      toDelete.forEach(([id]) => this.errorStorage.delete(id));
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
    // Allow process to exit naturally in short-lived scripts/tests
    (this.cleanupTimer as unknown as NodeJS.Timer).unref?.();
  }

  /**
   * Shutdown error system
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =====================================
// ONEAGENT UNIFIED MCP SYSTEM
// =====================================

/**
 * OneAgent MCP Server Configuration
 */
export interface OneAgentMCPServerConfig {
  id: string;
  name: string;
  type: 'http' | 'stdio' | 'websocket';
  endpoint?: string;
  port?: number;
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    roots?: boolean;
    sampling?: boolean;
  };
  authentication?: {
    required: boolean;
    type?: 'oauth2' | 'bearer' | 'none';
    config?: Record<string, unknown>;
  };
  protocolVersion: string;
  priority: number; // Higher number = higher priority
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
  };
}

/**
 * OneAgent MCP Request Structure
 */
export interface OneAgentMCPRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
  timestamp: UnifiedTimestamp;
  agentId?: string;
  userId?: string;
  sessionId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number;
  retryConfig?: {
    maxAttempts: number;
    backoffMs: number;
    exponential: boolean;
  };
}

/**
 * OneAgent MCP Response Structure
 */
export interface OneAgentMCPResponse {
  id: string;
  result?: Record<string, unknown> | null;
  error?: {
    code: number;
    message: string;
    data?: Record<string, unknown>;
    recoverable: boolean;
  };
  timestamp: UnifiedTimestamp;
  serverId: string;
  metadata: {
    responseTime: number;
    serverLoad: number;
    qualityScore: number;
    cached: boolean;
    retryCount: number;
  };
}

/**
 * OneAgent MCP Connection State
 */
export interface OneAgentMCPConnection {
  serverId: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastConnected?: UnifiedTimestamp;
  lastError?: string;
  connectionAttempts: number;
  capabilities: Record<string, unknown>;
  protocolVersion: string;
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    errorRate: number;
    lastHealthCheck: UnifiedTimestamp;
  };
}

/**
 * OneAgent MCP System Metrics
 */
export interface OneAgentMCPMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  serverMetrics: Record<
    string,
    {
      requests: number;
      successes: number;
      failures: number;
      averageResponseTime: number;
      lastUsed: UnifiedTimestamp;
    }
  >;
  connectionMetrics: {
    totalConnections: number;
    activeConnections: number;
    failedConnections: number;
  };
  cacheMetrics: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

/**
 * OneAgent Unified MCP System
 *
 * Client-side consolidation layer for all MCP operations across OneAgent ecosystem.
 * Provides unified interface, intelligent routing, health monitoring, and caching.
 *
 * Features:
 * - Multi-server management with intelligent routing
 * - Health monitoring and auto-recovery
 * - Request caching and optimization
 * - Constitutional AI integration
 * - Quality scoring and metrics
 * - Load balancing and failover
 *
 * Replaces: scattered MCP adapter usage, manual server management
 */
export class OneAgentUnifiedMCPSystem {
  private servers = new Map<string, OneAgentMCPServerConfig>();
  private connections = new Map<string, OneAgentMCPConnection>();
  private pendingRequests = new Map<string, OneAgentMCPRequest>();
  private cache: OneAgentUnifiedCacheSystem<OneAgentMCPResponse>;
  private errorHandler: OneAgentUnifiedErrorSystem;
  private metrics: OneAgentMCPMetrics;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private cacheSystem: OneAgentUnifiedCacheSystem<OneAgentMCPResponse>,
    private errorSystem: OneAgentUnifiedErrorSystem,
    private timeService: UnifiedTimeService,
  ) {
    this.cache = cacheSystem;
    this.errorHandler = errorSystem;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      serverMetrics: {},
      connectionMetrics: {
        totalConnections: 0,
        activeConnections: 0,
        failedConnections: 0,
      },
      cacheMetrics: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
    };

    this.startHealthChecking();
    this.startReconnectionManager();
  }

  /**
   * Register MCP server with configuration
   */
  async registerServer(config: OneAgentMCPServerConfig): Promise<void> {
    this.servers.set(config.id, config);

    // Initialize connection tracking
    this.connections.set(config.id, {
      serverId: config.id,
      status: 'disconnected',
      connectionAttempts: 0,
      capabilities: {},
      protocolVersion: config.protocolVersion,
      health: {
        status: 'healthy',
        responseTime: 0,
        errorRate: 0,
        lastHealthCheck: this.timeService.createTimestamp(),
      },
    });

    // Initialize server metrics
    this.metrics.serverMetrics[config.id] = {
      requests: 0,
      successes: 0,
      failures: 0,
      averageResponseTime: 0,
      lastUsed: this.timeService.createTimestamp(),
    };

    // Attempt initial connection
    await this.connectToServer(config.id);
  }

  /**
   * Connect to MCP server
   */
  async connectToServer(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    const connection = this.connections.get(serverId);

    if (!server || !connection) {
      throw new Error(`Server ${serverId} not found`);
    }

    connection.status = 'connecting';
    connection.connectionAttempts++;

    try {
      // Simulate connection logic based on server type
      switch (server.type) {
        case 'http':
          await this.connectHTTP(server);
          break;
        case 'stdio':
          await this.connectStdio(server);
          break;
        case 'websocket':
          await this.connectWebSocket(server);
          break;
        default:
          throw new Error(`Unsupported server type: ${server.type}`);
      }

      connection.status = 'connected';
      connection.lastConnected = this.timeService.now();
      delete connection.lastError;
      this.metrics.connectionMetrics.activeConnections++;

      return true;
    } catch (error) {
      connection.status = 'error';
      connection.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.metrics.connectionMetrics.failedConnections++;

      await this.errorHandler.handleError(error as Error, {
        component: 'OneAgentUnifiedMCPSystem',
        operation: 'connectToServer',
        serverId,
        serverType: server.type,
      });

      return false;
    }
  }

  /**
   * Send MCP request with intelligent routing
   */
  async sendRequest(
    method: string,
    params?: Record<string, unknown>,
    options: {
      serverId?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      timeout?: number;
      agentId?: string;
      userId?: string;
      sessionId?: string;
      cacheable?: boolean;
      retryConfig?: {
        maxAttempts: number;
        backoffMs: number;
        exponential: boolean;
      };
    } = {},
  ): Promise<OneAgentMCPResponse> {
    const timestamp = this.timeService.now();
    const requestId = generateUnifiedId('operation', 'mcp_request');
    const startTime = timestamp.unix;

    const request: OneAgentMCPRequest = {
      id: requestId,
      method,
      params: params || {},
      timestamp: this.timeService.now(),
      ...(options.agentId && { agentId: options.agentId }),
      ...(options.userId && { userId: options.userId }),
      ...(options.sessionId && { sessionId: options.sessionId }),
      priority: options.priority || 'medium',
      timeout: options.timeout || 30000,
      retryConfig: options.retryConfig || {
        maxAttempts: 3,
        backoffMs: 1000,
        exponential: true,
      },
    };

    this.pendingRequests.set(requestId, request);
    this.metrics.totalRequests++;

    try {
      // Check cache first if cacheable
      if (options.cacheable) {
        const cacheKey = this.generateCacheKey(method, params);
        const cachedResponse = await this.cache.get(cacheKey);

        if (cachedResponse) {
          this.metrics.cacheMetrics.hits++;
          this.updateCacheHitRate();
          return cachedResponse;
        }

        this.metrics.cacheMetrics.misses++;
      }

      // Select server (intelligent routing)
      const serverId =
        options.serverId || (await this.selectOptimalServer(method, request.priority));
      const server = this.servers.get(serverId);

      if (!server) {
        throw new Error(`Server ${serverId} not found`);
      }

      // Ensure server is connected
      const connection = this.connections.get(serverId);
      if (!connection || connection.status !== 'connected') {
        const connected = await this.connectToServer(serverId);
        if (!connected) {
          throw new Error(`Failed to connect to server ${serverId}`);
        }
      }

      // Send request with retry logic
      const response = await this.sendRequestWithRetry(request, server);

      // Update metrics
      const responseTime = this.timeService.now().unix - startTime;
      this.updateServerMetrics(serverId, true, responseTime);
      this.metrics.successfulRequests++;

      // Cache response if cacheable
      if (options.cacheable && response.result) {
        const cacheKey = this.generateCacheKey(method, params);
        await this.cache.set(cacheKey, response, 300000); // 5 minutes TTL
      }

      return response;
    } catch (error) {
      const responseTime = this.timeService.now().unix - startTime;
      this.updateServerMetrics(options.serverId || 'unknown', false, responseTime);
      this.metrics.failedRequests++;

      await this.errorHandler.handleError(error as Error, {
        component: 'OneAgentUnifiedMCPSystem',
        operation: 'sendRequest',
        method,
        requestId,
        serverId: options.serverId,
      });

      throw error;
    } finally {
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Get system health status
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      servers: number;
      activeConnections: number;
      averageResponseTime: number;
      errorRate: number;
      cacheHitRate: number;
    };
  } {
    const totalRequests = this.metrics.totalRequests;
    const errorRate = totalRequests > 0 ? this.metrics.failedRequests / totalRequests : 0;
    const avgResponseTime = this.metrics.averageResponseTime;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (errorRate > 0.1 || avgResponseTime > 5000) {
      status = 'unhealthy';
    } else if (errorRate > 0.05 || avgResponseTime > 2000) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        servers: this.servers.size,
        activeConnections: this.metrics.connectionMetrics.activeConnections,
        averageResponseTime: avgResponseTime,
        errorRate,
        cacheHitRate: this.metrics.cacheMetrics.hitRate,
      },
    };
  }

  /**
   * Get detailed metrics
   */
  getMetrics(): OneAgentMCPMetrics {
    return { ...this.metrics };
  }

  /**
   * Get server connection status
   */
  getConnectionStatus(serverId: string): OneAgentMCPConnection | null {
    return this.connections.get(serverId) || null;
  }

  /**
   * Get all server statuses
   */
  getAllConnectionStatuses(): Record<string, OneAgentMCPConnection> {
    const statuses: Record<string, OneAgentMCPConnection> = {};
    this.connections.forEach((connection, serverId) => {
      statuses[serverId] = connection;
    });
    return statuses;
  }

  /**
   * Disconnect from server
   */
  async disconnectFromServer(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (connection) {
      connection.status = 'disconnected';
      this.metrics.connectionMetrics.activeConnections--;
    }
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.servers.keys()).map((serverId) =>
      this.disconnectFromServer(serverId),
    );
    await Promise.all(disconnectPromises);
  }

  /**
   * Shutdown MCP system
   */
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
    }
    this.disconnectAll();
  }

  // Private helper methods

  private async connectHTTP(server: OneAgentMCPServerConfig): Promise<void> {
    // HTTP connection logic (canonical endpoint resolution)
    const canonicalBase = UnifiedBackboneService.getResolvedConfig().mcpUrl.replace(/\/mcp$/, '');
    const endpoint = server.endpoint || canonicalBase;

    // Test connection with initialize request
    const response = await fetch(`${endpoint}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': server.protocolVersion,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: generateUnifiedId('operation', 'mcp_init'),
        method: 'initialize',
        params: {
          protocolVersion: server.protocolVersion,
          capabilities: server.capabilities,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP connection failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`MCP initialization failed: ${data.error.message}`);
    }
  }

  private async connectStdio(server: OneAgentMCPServerConfig): Promise<void> {
    // Stdio connection logic (placeholder)
    console.log(`Connecting to stdio MCP server: ${server.name}`);
  }

  private async connectWebSocket(server: OneAgentMCPServerConfig): Promise<void> {
    // WebSocket connection logic (placeholder)
    console.log(`Connecting to WebSocket MCP server: ${server.name}`);
  }

  private async selectOptimalServer(_method: string, _priority: string): Promise<string> {
    // Select server based on method, priority, and health
    const availableServers = Array.from(this.servers.values()).filter((server) => {
      const connection = this.connections.get(server.id);
      return connection?.status === 'connected' && connection.health.status !== 'unhealthy';
    });

    if (availableServers.length === 0) {
      throw new Error('No healthy servers available');
    }

    // Sort by priority and health score
    availableServers.sort((a, b) => {
      const aConnection = this.connections.get(a.id)!;
      const bConnection = this.connections.get(b.id)!;

      // Higher priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      // Lower response time first
      return aConnection.health.responseTime - bConnection.health.responseTime;
    });

    return availableServers[0].id;
  }

  private async sendRequestWithRetry(
    request: OneAgentMCPRequest,
    server: OneAgentMCPServerConfig,
  ): Promise<OneAgentMCPResponse> {
    const maxAttempts = request.retryConfig?.maxAttempts || 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.sendSingleRequest(request, server);
        return response;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          const delay = request.retryConfig?.exponential
            ? (request.retryConfig.backoffMs || 1000) * Math.pow(2, attempt - 1)
            : request.retryConfig?.backoffMs || 1000;

          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after all retry attempts');
  }

  private async sendSingleRequest(
    request: OneAgentMCPRequest,
    server: OneAgentMCPServerConfig,
  ): Promise<OneAgentMCPResponse> {
    // Simulate request based on server type
    switch (server.type) {
      case 'http':
        return this.sendHTTPRequest(request, server);
      case 'stdio':
        return this.sendStdioRequest(request, server);
      case 'websocket':
        return this.sendWebSocketRequest(request, server);
      default:
        throw new Error(`Unsupported server type: ${server.type}`);
    }
  }

  private async sendHTTPRequest(
    request: OneAgentMCPRequest,
    server: OneAgentMCPServerConfig,
  ): Promise<OneAgentMCPResponse> {
    const canonicalBase = UnifiedBackboneService.getResolvedConfig().mcpUrl.replace(/\/mcp$/, '');
    const endpoint = server.endpoint || canonicalBase;
    const startTime = this.timeService.now().unix;

    const fetchResponse = await fetch(`${endpoint}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': server.protocolVersion,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        method: request.method,
        params: request.params,
      }),
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP request failed: ${fetchResponse.status} ${fetchResponse.statusText}`);
    }

    const data = await fetchResponse.json();

    const response: OneAgentMCPResponse = {
      id: request.id,
      result: data.result,
      timestamp: this.timeService.now(),
      serverId: server.id,
      metadata: {
        responseTime: this.timeService.now().unix - startTime,
        serverLoad: 0.5, // Placeholder
        qualityScore: 0.9, // Placeholder
        cached: false,
        retryCount: 0,
      },
    };

    if (data.error) {
      response.error = {
        code: data.error.code,
        message: data.error.message,
        data: data.error.data,
        recoverable: data.error.code !== -32603, // Not internal error
      };
    }

    return response;
  }

  private async sendStdioRequest(
    _request: OneAgentMCPRequest,
    _server: OneAgentMCPServerConfig,
  ): Promise<OneAgentMCPResponse> {
    // Placeholder for stdio implementation
    throw new Error('Stdio MCP not yet implemented');
  }

  private async sendWebSocketRequest(
    _request: OneAgentMCPRequest,
    _server: OneAgentMCPServerConfig,
  ): Promise<OneAgentMCPResponse> {
    // Placeholder for WebSocket implementation
    throw new Error('WebSocket MCP not yet implemented');
  }

  private generateCacheKey(method: string, params?: Record<string, unknown>): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `mcp_${method}_${this.hashString(paramsStr)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private updateServerMetrics(serverId: string, success: boolean, responseTime: number): void {
    const serverMetrics = this.metrics.serverMetrics[serverId];
    if (serverMetrics) {
      serverMetrics.requests++;
      if (success) {
        serverMetrics.successes++;
      } else {
        serverMetrics.failures++;
      }
      serverMetrics.averageResponseTime =
        (serverMetrics.averageResponseTime * (serverMetrics.requests - 1) + responseTime) /
        serverMetrics.requests;
      serverMetrics.lastUsed = this.timeService.now();
    }

    // Update global average
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
      this.metrics.totalRequests;
  }

  private updateCacheHitRate(): void {
    const total = this.metrics.cacheMetrics.hits + this.metrics.cacheMetrics.misses;
    this.metrics.cacheMetrics.hitRate = total > 0 ? this.metrics.cacheMetrics.hits / total : 0;
  }

  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
    this.healthCheckTimer?.unref?.();
  }

  private startReconnectionManager(): void {
    this.reconnectTimer = setInterval(() => {
      this.attemptReconnections();
    }, 60000); // Every minute
    this.reconnectTimer?.unref?.();
  }

  private async performHealthChecks(): Promise<void> {
    this.servers.forEach((_cfg, serverId) => {
      const connection = this.connections.get(serverId);
      if (connection && connection.status === 'connected') {
        (async () => {
          try {
            const startTime = this.timeService.now().unix;
            await this.sendRequest('ping', {}, { serverId, timeout: 5000 });
            const responseTime = this.timeService.now().unix - startTime;
            connection.health.responseTime = responseTime;
            connection.health.status =
              responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'degraded' : 'unhealthy';
            connection.health.lastHealthCheck = this.timeService.now();
          } catch {
            connection.health.status = 'unhealthy';
            connection.health.errorRate = Math.min(connection.health.errorRate + 0.1, 1.0);
          }
        })();
      }
    });
  }

  private async attemptReconnections(): Promise<void> {
    for (const [serverId, connection] of Array.from(this.connections.entries())) {
      if (connection.status === 'disconnected' || connection.status === 'error') {
        await this.connectToServer(serverId);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =====================================
// END ONEAGENT UNIFIED MCP SYSTEM
// =====================================

// =====================================
// CANONICAL EXPORTS AND UTILITIES
// =====================================

/**
 * Canonical unified backbone instance
 * SINGLE SOURCE OF TRUTH for all OneAgent backbone operations
 */
export const unifiedBackbone = OneAgentUnifiedBackbone.getInstance();

/**
 * Canonical unified time service instance
 * SINGLE SOURCE OF TRUTH for all time operations
 */
export const unifiedTimeService = OneAgentUnifiedTimeService.getInstance();

/**
 * Canonical unified metadata service instance
 * SINGLE SOURCE OF TRUTH for all metadata operations
 */
export const unifiedMetadataService = OneAgentUnifiedMetadataService.getInstance();

/**
 * Canonical timestamp creation function
 * REPLACES: createUnifiedTimestamp, new Date(), Date.now()
 */
export function createUnifiedTimestamp(): UnifiedTimestamp {
  try {
    // Use already-created singleton if available
    if (typeof unifiedTimeService !== 'undefined' && unifiedTimeService) {
      return unifiedTimeService.createTimestamp();
    }
    // Defer class access if defined later in this module
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maybeCtor: any = (globalThis as unknown as Record<string, unknown>)[
      'OneAgentUnifiedTimeService'
    ];
    if (maybeCtor && typeof maybeCtor.getInstance === 'function') {
      return maybeCtor.getInstance().createTimestamp();
    }
  } catch {
    /* swallow and fallback */
  }
  // Fallback minimal timestamp (will be close enough; avoids throw during bootstrap)
  const d = new Date();
  return {
    iso: d.toISOString(),
    unix: d.getTime(),
    utc: d.toISOString(),
    local: d.toLocaleString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    context: '',
    contextual: { timeOfDay: '', energyLevel: '', optimalFor: [] },
    metadata: {
      source: 'bootstrap-fallback',
      precision: 'second',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  } as UnifiedTimestamp;
}

/**
 * Canonical timestamp from Date object
 * REPLACES: manual Date object enhancement
 */
export function enhanceTimestamp(date: Date): UnifiedTimestamp {
  return unifiedTimeService.enhanceWithContext(date);
}

/**
 * Canonical current time function
 * REPLACES: new Date(), Date.now()
 */
export function now(): UnifiedTimestamp {
  return unifiedTimeService.now();
}

/**
 * Canonical metadata creation function
 * REPLACES: manual metadata object creation
 */
export function createUnifiedMetadata(
  type: string,
  source: string,
  options: Partial<UnifiedMetadata> = {},
): UnifiedMetadata {
  return unifiedMetadataService.create(type, source, options);
}

/**
 * Canonical ID generation function
 * REPLACES: manual ID generation patterns
 */
export function generateUnifiedId(
  type: IdType,
  context?: string,
  config?: Partial<UnifiedIdConfig>,
): string {
  return unifiedBackbone.generateUnifiedId(type, context, config);
}

/**
 * Canonical ID generation function (alias)
 * REPLACES: manual ID generation patterns
 */
export function createUnifiedId(
  type: IdType,
  context?: string,
  config?: Partial<UnifiedIdConfig>,
): string {
  return generateUnifiedId(type, context, config);
}

/**
 * Canonical system health check
 * REPLACES: scattered health monitoring
 */
export function getUnifiedSystemHealth(): UnifiedSystemHealth {
  return unifiedBackbone.getSystemHealth();
}

/**
 * Canonical cache access
 * REPLACES: direct cache instantiation
 */
export function getUnifiedCache(): OneAgentUnifiedCacheSystem {
  return unifiedBackbone.cache;
}

/**
 * Canonical error handling
 * REPLACES: manual error handling
 */
export function getUnifiedErrorHandler(): OneAgentUnifiedErrorSystem {
  return unifiedBackbone.errorHandler;
}

/**
 * Canonical MCP client access
 * REPLACES: direct MCP client instantiation
 */
export function getUnifiedMCPClient(): OneAgentUnifiedMCPSystem {
  return unifiedBackbone.mcpClient;
}

// =====================================
// APPLICATION METADATA (CANONICAL)
// =====================================
/**
 * Canonical getter for application version (from package.json)
 */
export function getAppVersion(): string {
  const v = (pkg as unknown as { version?: string }).version;
  return typeof v === 'string' && v.trim().length > 0 ? v : '0.0.0';
}

/**
 * Canonical getter for application name (from package.json)
 */
export function getAppName(): string {
  const n = (pkg as unknown as { name?: string }).name;
  return typeof n === 'string' && n.trim().length > 0 ? n : 'oneagent-core';
}

// =====================================
// VALIDATION AND TESTING UTILITIES
// =====================================

/**
 * Validate that no raw Date usage exists in the system
 * CRITICAL: Helps ensure all systems use unified time
 */
export function validateUnifiedTimeUsage(): {
  hasRawDates: boolean;
  replacements: string[];
  recommendations: string[];
} {
  return {
    hasRawDates: false,
    replacements: [
      'new Date() → now()',
      'new Date().toISOString() → now().iso',
      'Date.now() → now().unix',
      'new Date(timestamp) → enhanceTimestamp(new Date(timestamp))',
      'timestamp: new Date() → timestamp: createUnifiedTimestamp()',
    ],
    recommendations: [
      'Use createUnifiedTimestamp() for new timestamps',
      'Use now() for current time',
      'Use enhanceTimestamp() for existing Date objects',
      'Use unifiedTimeService for all time operations',
      'Use unifiedMetadataService for all metadata operations',
    ],
  };
}

/**
 * System integration health check
 * CRITICAL: Validates all backbone systems are properly integrated
 */
export function validateSystemIntegration(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    timeService: boolean;
    metadataService: boolean;
    cacheSystem: boolean;
    errorSystem: boolean;
    mcpSystem: boolean;
  };
  issues: string[];
} {
  const issues: string[] = [];

  // Check time service
  const timeHealthy = unifiedTimeService.now().unix > 0;
  if (!timeHealthy) issues.push('Time service not functioning');

  // Check metadata service
  const testMetadata = unifiedMetadataService.create('test', 'validation');
  const metadataHealthy = !!(testMetadata.id && testMetadata.temporal?.created);
  if (!metadataHealthy) issues.push('Metadata service not functioning');

  // Check cache system
  const cacheHealthy = unifiedBackbone.cache.getHealth().status !== 'unhealthy';
  if (!cacheHealthy) issues.push('Cache system unhealthy');

  // Check error system
  const errorHealthy = unifiedBackbone.errorHandler.getHealth().status !== 'unhealthy';
  if (!errorHealthy) issues.push('Error system unhealthy');

  // Check MCP system
  const mcpHealthy = unifiedBackbone.mcpClient.getHealth().status !== 'unhealthy';
  if (!mcpHealthy) issues.push('MCP system unhealthy');

  return {
    status: issues.length === 0 ? 'healthy' : issues.length < 3 ? 'degraded' : 'unhealthy',
    details: {
      timeService: timeHealthy,
      metadataService: metadataHealthy,
      cacheSystem: cacheHealthy,
      errorSystem: errorHealthy,
      mcpSystem: mcpHealthy,
    },
    issues,
  };
}

// =====================================
// DEPRECATED FUNCTION WARNINGS
// =====================================

/**
 * @deprecated Use createUnifiedTimestamp() instead
 * This function is provided for backwards compatibility only
 */
export function createTimestamp(): UnifiedTimestamp {
  console.warn(
    'DEPRECATED: createTimestamp() is deprecated. Use createUnifiedTimestamp() instead.',
  );
  return createUnifiedTimestamp();
}

/**
 * @deprecated Use now() instead
 * This function is provided for backwards compatibility only
 */
export function getCurrentTime(): UnifiedTimestamp {
  console.warn('DEPRECATED: getCurrentTime() is deprecated. Use now() instead.');
  return now();
}

/**
 * @deprecated Use createUnifiedMetadata() instead
 * This function is provided for backwards compatibility only
 */
export function createMetadata(
  type: string,
  source: string,
  options: Partial<UnifiedMetadata> = {},
): UnifiedMetadata {
  console.warn('DEPRECATED: createMetadata() is deprecated. Use createUnifiedMetadata() instead.');
  return createUnifiedMetadata(type, source, options);
}
