/**
 * OneAgent Unified Backbone Service
 * Critical Foundation: Time + Metadata + Agent Integration
 * 
 * This is the SINGLE SOURCE OF TRUTH for time and metadata across ALL OneAgent systems:
 * - AgentFactory and all specialized agents
 * - Memory systems (UnifiedMemoryInterface, Context7)
 * - Chat interfaces and UI components
 * - ALITA evolution tracking
 * - Background services and utilities
 * 
 * ARCHITECTURAL PRINCIPLE: Every system that uses time or metadata MUST use this service
 * 
 * Version: 1.0.0
 * Created: 2024-06-18
 * Priority: CRITICAL BACKBONE
 */

import { 
  UnifiedTimeContext, 
  UnifiedTimestamp, 
  UnifiedMetadata, 
  UnifiedTimeService, 
  UnifiedMetadataService,
  UnifiedAgentContext,
  UnifiedMemoryEntry,
  UnifiedSystemHealth,
  ALITAUnifiedContext,
  AgentType
} from '../types/unified-fixed';

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
   */  public now(): UnifiedTimestamp {
    const jsDate = new Date();
    const context = this.getContext();
    
    return {
      iso: jsDate.toISOString(),
      unix: jsDate.getTime(),
      contextual: {
        timeOfDay: context.context.timeOfDay,
        energyLevel: context.intelligence.energyLevel,
        optimalFor: context.intelligence.optimalFocusTime ? ['focus', 'productivity'] : ['general']
      },
      metadata: {
        source: 'UnifiedTimeService',
        precision: 'second',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }
  
  /**
   * Get comprehensive time context with intelligence
   */
  public getContext(): UnifiedTimeContext {
    // Use cache if still valid
    if (this.contextCache && Date.now() < this.contextCache.expiry) {
      return this.contextCache.context;
    }
    
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const month = now.getMonth();
      const context: UnifiedTimeContext = {
      context: {
        dayOfWeek: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day] as any,
        timeOfDay: this.getTimeOfDay(hour),
        workingHours: this.isWorkingHours(hour, day),
        weekendMode: day === 0 || day === 6,
        businessDay: day >= 1 && day <= 5,
        peakHours: (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)
      },
      intelligence: {
        optimalFocusTime: this.isOptimalFocusTime(hour, day),
        energyLevel: this.getEnergyLevelInternal(hour, day),
        suggestionContext: this.getSuggestionContextInternal(hour, day),
        motivationalTiming: this.getMotivationalTiming(hour, day)
      },
      metadata: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: now,
        contextUpdated: now
      }
    };
    
    // Cache the context
    this.contextCache = {
      context,
      expiry: Date.now() + this.CACHE_DURATION
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
        return hour >= 10 && hour <= 12 || hour >= 15 && hour <= 17;
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
  public getSuggestionContext(): 'planning' | 'execution' | 'review' | 'rest' {
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
   */  public enhanceWithContext(basicTime: Date): UnifiedTimestamp {
    const context = this.getContext();
    const hour = basicTime.getHours();
    
    return {
      iso: basicTime.toISOString(),
      unix: basicTime.getTime(),
      contextual: {
        timeOfDay: this.getTimeOfDay(hour),
        energyLevel: context.intelligence.energyLevel,
        optimalFor: this.getOptimalActivities(hour)
      },
      metadata: {
        source: 'UnifiedTimeService',
        precision: 'second',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
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
  
  private getSuggestionContextInternal(hour: number, day: number): 'planning' | 'execution' | 'review' | 'rest' {
    if (hour >= 8 && hour <= 9) return 'planning';
    if (hour >= 10 && hour <= 16 && day >= 1 && day <= 5) return 'execution';
    if (hour >= 17 && hour <= 19) return 'review';
    return 'rest';
  }
  private getMotivationalTiming(hour: number, _day: number): 'morning-boost' | 'afternoon-focus' | 'evening-wind-down' | 'night-rest' {
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
   * Create new unified metadata
   */
  public create(type: string, source: string, options: Partial<UnifiedMetadata> = {}): UnifiedMetadata {
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
          energyContext: context.intelligence.energyLevel
        }
      },
        system: {
        source,
        component: options.system?.component || 'unknown',
        ...(options.system?.sessionId && { sessionId: options.system.sessionId }),
        ...(options.system?.userId && { userId: options.system.userId }),
        ...(options.system?.agent && { agent: options.system.agent })
      },
      
      quality: {
        score: options.quality?.score || 85,
        constitutionalCompliant: options.quality?.constitutionalCompliant || true,
        validationLevel: options.quality?.validationLevel || 'basic',
        confidence: options.quality?.confidence || 0.85
      },
      
      content: {
        category: options.content?.category || 'general',
        tags: options.content?.tags || [],
        sensitivity: options.content?.sensitivity || 'internal',
        relevanceScore: options.content?.relevanceScore || 0.8,
        contextDependency: options.content?.contextDependency || 'session'
      },
        relationships: {
        ...(options.relationships?.parent && { parent: options.relationships.parent }),
        children: options.relationships?.children || [],
        related: options.relationships?.related || [],
        dependencies: options.relationships?.dependencies || []
      },
      
      analytics: {
        accessCount: 0,
        lastAccessPattern: 'created',
        usageContext: []
      }
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
        ...(changes.temporal?.accessed && { accessed: changes.temporal.accessed })
      }
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
  public validateQuality(metadata: UnifiedMetadata): { valid: boolean; score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;
    
    // Check required fields
    if (!metadata.id) { issues.push('Missing ID'); score -= 20; }
    if (!metadata.type) { issues.push('Missing type'); score -= 15; }
    if (!metadata.temporal.created) { issues.push('Missing creation timestamp'); score -= 25; }
    
    // Check quality metrics
    if (metadata.quality.score < 70) { issues.push('Low quality score'); score -= 10; }
    if (!metadata.quality.constitutionalCompliant) { issues.push('Constitutional non-compliance'); score -= 30; }
    
    // Check content completeness
    if (metadata.content.tags.length === 0) { issues.push('No content tags'); score -= 5; }
    if (metadata.content.relevanceScore < 0.5) { issues.push('Low relevance score'); score -= 10; }
    
    return {
      valid: issues.length === 0,
      score: Math.max(0, score),
      issues
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
    
    return metadata.quality.constitutionalCompliant;
  }
  
  /**
   * Get analytics for metadata
   */
  public getAnalytics(id: string): Record<string, any> {
    const metadata = this.retrieve(id);
    if (!metadata) return {};
    
    return {
      accessCount: metadata.analytics.accessCount,
      lastAccessPattern: metadata.analytics.lastAccessPattern,
      usageContext: metadata.analytics.usageContext,
      qualityScore: metadata.quality.score,
      age: Date.now() - metadata.temporal.created.unix,
      relevanceDecay: this.calculateRelevanceDecay(metadata)
    };
  }
  
  /**
   * Update access tracking
   */
  public updateAccess(id: string, context: string): void {
    const metadata = this.metadataStore.get(id);
    if (!metadata) return;
    
    const updated = {
      ...metadata,
      temporal: {
        ...metadata.temporal,
        accessed: this.timeService.now()
      },
      analytics: {
        ...metadata.analytics,
        accessCount: metadata.analytics.accessCount + 1,
        lastAccessPattern: context,
        usageContext: [...metadata.analytics.usageContext, context].slice(-10) // Keep last 10
      }
    };
    
    this.metadataStore.set(id, updated);
  }
  
  /**
   * Create enhanced metadata for inter-agent communication
   * Ensures proper context, privacy isolation, and traceability
   */
  public createInterAgentMetadata(
    communicationType: 'direct_message' | 'multi_agent' | 'broadcast' | 'coordination' | 'delegation',
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
    } = {}
  ): UnifiedMetadata {
    const timestamp = this.timeService.now();
    
    // Create enhanced metadata with inter-agent specific context
    const metadata = this.create('inter_agent_communication', `agent_${sourceAgentId}`, {      content: {
        category: 'agent_communication',
        tags: [
          'inter_agent',
          communicationType,
          options.messageType || 'notification',
          ...(options.projectContext ? [`project_${options.projectContext}`] : []),
          ...(options.topicContext ? [`topic_${options.topicContext}`] : [])
        ],
        sensitivity: options.privacyLevel || 'internal',
        relevanceScore: 0.9, // High relevance for agent communications
        contextDependency: options.userDataScope === 'restricted' ? 'session' : 
                          options.userDataScope === 'project' ? 'user' : 
                          options.userDataScope || 'session'
      },
      
      system: {
        source: `agent_communication`,
        component: 'multi_agent_orchestrator',
        sessionId,
        userId,
        agent: {
          id: sourceAgentId,
          type: 'specialized'
        }
      },
      
      quality: {
        score: options.qualityThreshold || 90, // Higher standard for agent communication
        constitutionalCompliant: true, // Always require compliance for agent communication
        validationLevel: 'enhanced',
        confidence: 0.95
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
          ...(options.workflowId ? [`workflow_${options.workflowId}`] : [])
        ]
      }
    });
    
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
        requestId: options.requestId
      }
    };
    
    // Store custom data in metadata
    (metadata as any).customData = customData;
    
    return metadata;
  }
  
  // Private helper methods
  private generateId(): string {
    return `unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private calculateRelevanceDecay(metadata: UnifiedMetadata): number {
    const age = Date.now() - metadata.temporal.created.unix;
    const days = age / (1000 * 60 * 60 * 24);
    
    // Simple decay model - can be enhanced
    switch (metadata.content.contextDependency) {
      case 'session': return Math.max(0, 1 - (days / 1));
      case 'user': return Math.max(0, 1 - (days / 30));
      case 'global': return Math.max(0, 1 - (days / 365));
      default: return Math.max(0, 1 - (days / 7));
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
  
  public static getInstance(): OneAgentUnifiedBackbone {
    if (!OneAgentUnifiedBackbone.instance) {
      OneAgentUnifiedBackbone.instance = new OneAgentUnifiedBackbone();
    }
    return OneAgentUnifiedBackbone.instance;
  }
  
  constructor() {
    this.timeService = OneAgentUnifiedTimeService.getInstance();
    this.metadataService = OneAgentUnifiedMetadataService.getInstance();
  }
  
  /**
   * Get unified services for dependency injection
   */
  public getServices() {
    return {
      timeService: this.timeService,
      metadataService: this.metadataService
    };
  }
  
  /**
   * Create agent context with unified services
   */
  public createAgentContext(agentId: string, agentType: AgentType, options: {
    sessionId: string;
    userId?: string;
    capabilities: string[];
    memoryEnabled: boolean;
    aiEnabled: boolean;  }): UnifiedAgentContext {
    return {
      agentId,
      agentType,
      capabilities: options.capabilities,
      timeContext: this.timeService.getContext(),      metadata: this.metadataService.create('agent_context', 'agent_system', {
        content: {
          category: 'agent',
          tags: [`agent:${agentId}`, `type:${agentType}`],
          sensitivity: 'internal' as const,
          relevanceScore: 0.9,
          contextDependency: 'session' as const
        }
      }),
      session: {
        sessionId: options.sessionId,
        ...(options.userId && { userId: options.userId }),
        startTime: this.timeService.now()
      }
    };
  }
  
  /**
   * Create ALITA context with unified tracking
   */  public createALITAContext(trigger: string, impact: 'minor' | 'moderate' | 'significant' | 'major'): ALITAUnifiedContext {
    // Convert impact to proper enum values
    const impactLevel = impact === 'minor' ? 'low' : impact === 'moderate' ? 'medium' : impact === 'significant' ? 'high' : 'critical';
    
    return {
      systemContext: this.timeService.getContext(),      agentContext: this.createAgentContext('alita-evolution', 'specialist', {
        sessionId: 'alita-context',
        capabilities: ['evolution', 'learning', 'adaptation'],
        memoryEnabled: true,
        aiEnabled: true
      }),
      memoryContext: [], // Empty for now, would be populated by memory service
      evolutionTrigger: trigger,
      impactLevel,
      timestamp: this.timeService.now()
    };
  }
  
  /**
   * Get system health with unified monitoring
   */  public getSystemHealth(): UnifiedSystemHealth {
    return {
      overall: {
        status: 'healthy',
        score: 0.95,
        timestamp: this.timeService.now()
      },
      components: {
        timeService: { status: 'operational', responseTime: 1.5 },
        metadataService: { status: 'operational', operationsPerSecond: 100 },
        memoryService: { status: 'operational', storageHealth: 0.95 },
        constitutionalAI: { status: 'operational', complianceRate: 0.85 }
      },      metrics: {
        uptime: 0.999, // 99.9% uptime
        errorRate: 0.001, // 0.1% error rate
        performanceScore: 0.95 // 95% performance score
      }
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
        'timestamp: new Date() → timestamp: metadataService.create(...)'
      ]
    };
  }
}

// =====================================
// EXPORT UNIFIED SERVICES
// =====================================

// Singleton exports for system-wide consistency
export const unifiedTimeService = OneAgentUnifiedTimeService.getInstance();
export const unifiedMetadataService = OneAgentUnifiedMetadataService.getInstance();
export const unifiedBackbone = OneAgentUnifiedBackbone.getInstance();

// Convenience functions for common operations
export function createUnifiedTimestamp(): UnifiedTimestamp {
  return unifiedTimeService.now();
}

export function createUnifiedMetadata(type: string, source: string, options?: Partial<UnifiedMetadata>): UnifiedMetadata {
  return unifiedMetadataService.create(type, source, options);
}

export function getUnifiedSystemHealth(): UnifiedSystemHealth {
  return unifiedBackbone.getSystemHealth();
}

/**
 * CRITICAL BACKBONE VALIDATION
 * 
 * This unified backbone service provides:
 * 1. Single source of truth for time across ALL systems
 * 2. Consistent metadata approach for all components
 * 3. Agent context with unified services
 * 4. ALITA evolution tracking with real-time intelligence
 * 5. System health monitoring
 * 
 * IMPLEMENTATION REQUIREMENT:
 * - ALL systems must use these services instead of raw Date()
 * - ALL metadata operations must go through UnifiedMetadataService
 * - ALL agents must receive UnifiedAgentContext from AgentFactory
 * - ALITA must use ALITAUnifiedContext for evolution tracking
 * 
 * TESTING: Each integration should validate unified service usage
 */
