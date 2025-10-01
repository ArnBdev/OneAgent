// Canonical imports for OneAgent memory intelligence
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { getOneAgentMemory } from '../utils/UnifiedBackboneService';
import { OneAgentUnifiedBackbone } from '../utils/UnifiedBackboneService';
import { createUnifiedTimestamp, createUnifiedId } from '../utils/UnifiedBackboneService';
import { ConstitutionalAI } from '../agents/base/ConstitutionalAI';
import { PromptEngine } from '../agents/base/PromptEngine';
import type { MemorySearchResult } from '../types/oneagent-memory-types';
import type {
  ConversationData,
  SessionContext,
  IntelligenceInsight,
  ContextCategory,
  ExpertiseLevel,
  IntentCategory,
  PrivacyLevel,
  CommunicationStyle,
} from '../types/oneagent-backbone-types';

// Canonical MemoryAnalyticsResult type (if not defined elsewhere)
export type MemoryAnalyticsResult = {
  results: MemorySearchResult[];
  totalFound: number;
  totalResults?: number;
  query: string;
  searchTime: number;
  averageRelevance: number;
  averageQuality: number;
  constitutionalCompliance: number;
  queryContext: string[];
  suggestedRefinements: string[];
  relatedQueries: string[];
  metadata?: {
    conversations?: ConversationData[];
    insights?: IntelligenceInsight[];
  };
};

// Canonical metadata for analytics
export interface MemoryAnalyticsMetadata {
  skillDemonstrations?: string[];
  sessionContext?: unknown;
  sessionId?: string;
  contextTags?: string[];
  privacyLevel?: string;
  communicationStyle?: string;
  expertiseLevel?: string;
  technicalLevel?: string;
  domain?: string;
  principleApplications?: string[];
  ethicalConsiderations?: string[];
  safetyMeasures?: string[];
  responseTimings?: number[];
  qualityTrends?: number[];
  engagementLevels?: number[];
  messageCount?: number;
  conversationLength?: number;
  taskCompleted?: boolean;
  responseTime?: number;
  metadata?: { confidence?: number; quality?: number };
}

export interface MemoryAnalyticsSummary {
  totalConversations: number;
  averageQuality: number;
  insights: IntelligenceInsight[];
  searchTime: number;
  constitutionalCompliance: boolean;
  categoryBreakdown: Record<string, number>;
  averageImportance: number; // 0-100 scale
}

export interface MemoryIntelligenceOptions {
  enableSemanticSearch?: boolean;
  maxResults?: number;
  similarityThreshold?: number;
  enableConstitutionalValidation?: boolean;
}

export class MemoryIntelligence {
  /**
   * Canonical getter for OneAgentMemory instance (for use by managers)
   */
  public getMemorySystem(): OneAgentMemory {
    return this.memorySystem;
  }
  private memorySystem: OneAgentMemory;
  private options: MemoryIntelligenceOptions;
  private unifiedBackbone: OneAgentUnifiedBackbone;
  private constitutionalAI: ConstitutionalAI;

  constructor(memorySystem?: OneAgentMemory, options: MemoryIntelligenceOptions = {}) {
    this.memorySystem = memorySystem || getOneAgentMemory();
    this.unifiedBackbone = OneAgentUnifiedBackbone.getInstance();
    this.options = {
      enableSemanticSearch: true,
      maxResults: 50,
      similarityThreshold: 0.7,
      enableConstitutionalValidation: true,
      ...options,
    };
    // Initialize ConstitutionalAI with canonical principles and threshold
    this.constitutionalAI = new ConstitutionalAI({
      principles: PromptEngine.CONSTITUTIONAL_PRINCIPLES,
      qualityThreshold: 80,
    });
  }

  /**
   * Intelligent memory search with Constitutional AI compliance
   */
  async intelligentSearch(
    query: string,
    userId: string,
    options: { maxResults?: number } = {},
  ): Promise<MemoryAnalyticsResult> {
    const startTime = createUnifiedTimestamp();
    try {
      const memoryRecords: MemorySearchResult[] = await this.memorySystem.searchMemory({
        query,
        userId,
        limit: options.maxResults || this.options.maxResults || 20,
        filters: { semanticSearch: true },
      });
      // Ensure all metadata fields exist for analytics
      memoryRecords.forEach((entry) => {
        if (!entry.metadata || typeof entry.metadata !== 'object') entry.metadata = {};
        const meta = entry.metadata as Record<string, unknown>;
        if (typeof meta.lastAccessed === 'undefined')
          meta.lastAccessed = createUnifiedTimestamp().iso;
        if (typeof meta.qualityScore !== 'number') meta.qualityScore = 1.0;
        if (typeof meta.constitutionalStatus !== 'string') meta.constitutionalStatus = 'unknown';
        if (typeof meta.constitutionalCompliance !== 'number') meta.constitutionalCompliance = 1.0;
      });
      // Analytics and scoring logic uses metadata extensions
      const totalQuality = memoryRecords.reduce((sum, result) => {
        const meta = result.metadata as Record<string, unknown>;
        return (
          sum + (meta && typeof meta.qualityScore === 'number' ? (meta.qualityScore as number) : 0)
        );
      }, 0);
      const avgQuality = memoryRecords.length > 0 ? totalQuality / memoryRecords.length : 0;
      const endTime = createUnifiedTimestamp();
      // Filter nulls from ConversationData arrays
      const conversations: ConversationData[] = memoryRecords
        .map((r) => {
          try {
            return r.content ? (JSON.parse(r.content) as ConversationData) : undefined;
          } catch {
            return undefined;
          }
        })
        .filter((c): c is ConversationData => !!c);
      // Compute constitutional compliance ratio
      const complianceCount = memoryRecords.filter((r) => {
        const meta = r.metadata as Record<string, unknown>;
        return meta && meta.constitutionalStatus === 'compliant';
      }).length;
      // Return canonical analytics result
      const analyticsResult: MemoryAnalyticsResult = {
        results: memoryRecords,
        totalFound: memoryRecords.length,
        totalResults: memoryRecords.length,
        query,
        searchTime: endTime.unix - startTime.unix,
        averageRelevance: avgQuality, // For now, use avgQuality as a proxy
        averageQuality: avgQuality,
        constitutionalCompliance:
          memoryRecords.length > 0 ? complianceCount / memoryRecords.length : 1.0,
        queryContext: [query],
        suggestedRefinements: [],
        relatedQueries: [],
        metadata: {
          conversations,
          insights: [], // Implement as needed
        },
      };
      return analyticsResult;
    } catch (error) {
      console.error('Intelligent search failed:', error);
      const endTime = createUnifiedTimestamp();
      return {
        results: [],
        totalFound: 0,
        totalResults: 0,
        query,
        searchTime: endTime.unix - startTime.unix,
        averageRelevance: 0,
        averageQuality: 0,
        constitutionalCompliance: 0,
        queryContext: [query],
        suggestedRefinements: [],
        relatedQueries: [],
        metadata: {
          conversations: [],
          insights: [],
        },
      };
    }
  }

  /**
   * Categorize memory content
   */

  /**
   * Calculate importance score for memory
   */
  async calculateImportanceScore(
    memory: MemorySearchResult,
  ): Promise<{ overall: number; [key: string]: number }> {
    let conversation: ConversationData | undefined;
    try {
      conversation = memory.content ? (JSON.parse(memory.content) as ConversationData) : undefined;
    } catch {
      conversation = undefined;
    }
    const content = conversation
      ? Array.isArray(conversation.topics)
        ? conversation.topics.join(' ')
        : ''
      : '';
    const ts = conversation && conversation.timestamp ? new Date(conversation.timestamp) : null;
    const nowUnix = createUnifiedTimestamp().unix;
    const recency = ts ? Math.max(0, 100 - (nowUnix - ts.getTime()) / (1000 * 60 * 60 * 24)) : 50;
    return {
      overall: Math.round((recency + 50) / 2),
      recency: Math.round(recency),
      frequency: 50,
      relevance: content.length > 100 ? 80 : 60,
      userInteraction: 50,
    };
  }

  /**
   * Generate memory analytics
   */
  async generateMemoryAnalytics(userId: string): Promise<MemoryAnalyticsSummary> {
    try {
      const searchResult = await this.intelligentSearch('', userId, { maxResults: 100 });
      const conversations = searchResult.metadata?.conversations || [];
      const insights = searchResult.metadata?.insights || [];
      // Build category breakdown using available topical signals
      const categoryBreakdown: Record<string, number> = {};
      for (const c of conversations as ConversationData[]) {
        const category =
          (c.topicTags && c.topicTags[0]) || (c.topics && c.topics[0]) || c.domain || 'general';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      }
      // Compute average importance using recency/heuristics
      const importanceScores = await Promise.all(
        (conversations as ConversationData[]).map(async (c) => {
          const score = await this.calculateImportanceScore({
            id: c.conversationId || '',
            content: Array.isArray(c.topics) ? c.topics.join(' ') : '',
            metadata: {},
            // Use timestamp from ConversationData
            score: undefined,
          });
          return score.overall; // 0-100
        }),
      );
      const averageImportance =
        importanceScores.length > 0
          ? Math.round(importanceScores.reduce((a, b) => a + b, 0) / importanceScores.length)
          : 0;
      return {
        totalConversations: (searchResult.totalResults ?? searchResult.totalFound) || 0,
        averageQuality: this.calculateAverageQuality(conversations as ConversationData[]),
        insights,
        searchTime: searchResult.searchTime,
        constitutionalCompliance: (conversations as ConversationData[]).every(
          (c) => c.constitutionalCompliant,
        ),
        categoryBreakdown,
        averageImportance,
      };
    } catch {
      return {
        totalConversations: 0,
        averageQuality: 0,
        insights: [],
        searchTime: 0,
        constitutionalCompliance: true,
        categoryBreakdown: {},
        averageImportance: 0,
      };
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(userId: string): Promise<MemoryAnalyticsSummary> {
    return this.generateMemoryAnalytics(userId);
  }

  /**
   * Generate actionable insights from conversation data
   */
  private generateInsights(conversations: ConversationData[]): IntelligenceInsight[] {
    const insights: IntelligenceInsight[] = [];
    if (conversations.length === 0) return insights;
    insights.push({
      id: createUnifiedId('analysis', 'trend'),
      type: 'trend',
      title: 'Conversation Volume Analysis',
      description: `Found ${conversations.length} relevant conversations`,
      content: `Found ${conversations.length} relevant conversations`,
      confidence: 0.9,
      evidence: [`Conversation count: ${conversations.length}`],
      implications: [
        `${conversations.length < 5 ? 'Low conversation volume may indicate limited context' : 'Sufficient conversation history for analysis'}`,
      ],
      timeframe: {
        start: new Date(createUnifiedTimestamp().unix - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      categories: ['conversation-analysis', 'volume-metrics'],
      recommendations:
        conversations.length < 5
          ? ['Increase engagement to build better context']
          : ['Continue regular conversation patterns'],
      preventiveActions: ['Monitor conversation frequency'],
      monitoringPoints: ['Weekly conversation count', 'Quality trend analysis'],
      ethicalImplications: ['Ensure privacy of conversation data'],
      privacyConsiderations: ['Data retention policies apply'],
      safetyAspects: ['No safety concerns identified'],
      relevanceScore: 0.9,
      actionabilityScore: conversations.length < 5 ? 0.8 : 0.5,
      riskLevel: conversations.length < 5 ? 'medium' : 'low',
      createdAt: new Date(),
      validUntil: new Date(createUnifiedTimestamp().unix + 7 * 24 * 60 * 60 * 1000),
    });
    const avgQuality = this.calculateAverageQuality(conversations);
    if (avgQuality > 0) {
      insights.push({
        id: createUnifiedId('analysis', 'quality'),
        type: 'suggestion',
        title: 'Conversation Quality Assessment',
        description: `Average conversation quality: ${(avgQuality * 100).toFixed(1)}%`,
        content: `Average conversation quality: ${(avgQuality * 100).toFixed(1)}%`,
        confidence: 0.8,
        evidence: [`Quality score: ${(avgQuality * 100).toFixed(1)}%`],
        implications: [
          avgQuality < 0.7 ? 'Below optimal quality threshold' : 'Good quality conversations',
        ],
        timeframe: {
          start: new Date(createUnifiedTimestamp().unix - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        categories: ['quality-analysis', 'performance-metrics'],
        recommendations:
          avgQuality < 0.7
            ? ['Focus on improving response quality', 'Enhance contextual understanding']
            : ['Maintain current quality standards'],
        preventiveActions: ['Regular quality monitoring', 'Feedback collection'],
        monitoringPoints: ['Daily quality scores', 'User satisfaction metrics'],
        ethicalImplications: ['Maintain fair quality assessment'],
        privacyConsiderations: ['Quality metrics anonymized'],
        safetyAspects: ['Quality improvements enhance safety'],
        relevanceScore: 0.8,
        actionabilityScore: avgQuality < 0.7 ? 0.9 : 0.4,
        riskLevel: avgQuality < 0.5 ? 'high' : avgQuality < 0.7 ? 'medium' : 'low',
        createdAt: new Date(),
        validUntil: new Date(createUnifiedTimestamp().unix + 7 * 24 * 60 * 60 * 1000),
      });
    }
    return insights;
  }

  /**
   * Convert memory entry to ConversationData format
   */
  private convertToConversationData(memory: MemorySearchResult): ConversationData {
    const conversionTimestamp = this.unifiedBackbone.getServices().timeService.now();
    let conversation: ConversationData | undefined;
    try {
      conversation = memory.content ? (JSON.parse(memory.content) as ConversationData) : undefined;
    } catch {
      conversation = undefined;
    }
    if (conversation) {
      return conversation;
    }
    // Fallback: minimal ConversationData
    return {
      conversationId: memory.id || createUnifiedId('conversation', 'fallback'),
      participants: ['unknown'],
      startTime: new Date(conversionTimestamp.utc),
      topics: [],
      keyInsights: [],
      decisions: [],
      actionItems: [],
      overallQuality: 0.8,
      qualityScore: 0.8,
      constitutionalCompliance: 1.0,
      constitutionalCompliant: true,
      userSatisfaction: 0.8,
      goalAchievement: 0.8,
      newKnowledge: [],
      improvedUnderstanding: [],
      skillDemonstrations: [],
      sessionContext: {
        sessionId: 'unknown',
        userId: 'unknown',
        startTime: new Date(conversionTimestamp.utc),
        lastActivity: new Date(conversionTimestamp.utc),
        currentTopic: 'general',
        conversationMode: 'problem_solving',
        sessionType: 'quick_query',
        expectedDuration: 300,
        goalDefinition: 'Provide helpful assistance',
        constitutionalMode: 'balanced',
        validationLevel: 'enhanced',
        responseQuality: [0.8],
        userSatisfaction: [0.8],
        goalProgress: 0.8,
        relevantMemories: [],
        newLearnings: [],
        constitutionalCompliance: 1.0,
        helpfulnessScore: 0.9,
        accuracyMaintained: true,
      },
      principleApplications: [],
      ethicalConsiderations: [],
      safetyMeasures: [],
      responseTimings: [1000],
      qualityTrends: [0.8],
      engagementLevels: [0.8],
      timestamp: new Date(conversionTimestamp.utc),
      userId: 'unknown',
      messageCount: 1,
      conversationLength: 1,
      contextTags: [],
      communicationStyle: 'formal',
      technicalLevel: 'intermediate',
      domain: 'general',
      taskCompleted: true,
      responseTime: 1000,
    };
  }

  /**
   * Map ConversationData to ConversationMemory for canonical storage
   * Canonical, production-grade format for mem0 API (Gemini backend)
   */
  private mapConversationDataToMemory(
    data: ConversationData,
    userId: string,
  ): Record<string, unknown> {
    return {
      id: data.conversationId || createUnifiedId('memory', 'conversation_fallback'),
      agentId: data.participants?.[0] || 'unknown',
      userId: userId,
      timestamp: data.timestamp || new Date(),
      content: JSON.stringify(data),
      context: {
        sessionId: data.sessionContext?.sessionId || '',
        environment: data.domain || '',
        topics: data.topics || [],
        contextTags: data.contextTags || [],
        communicationStyle: data.communicationStyle || 'formal',
        technicalLevel: data.technicalLevel || 'intermediate',
        domain: data.domain || 'general',
      },
      outcome: {
        success: data.taskCompleted ?? true,
        satisfaction:
          typeof data.userSatisfaction === 'number' && data.userSatisfaction > 0.8
            ? 'high'
            : 'medium',
        qualityScore: data.qualityScore ?? 1.0,
        learningsExtracted: Array.isArray(data.newKnowledge) ? data.newKnowledge.length : 0,
        goalAchievement: data.goalAchievement ?? 0.8,
        userSatisfaction: data.userSatisfaction ?? 0.8,
        constitutionalCompliant: data.constitutionalCompliant !== false,
      },
      metadata: {
        conversationId: data.conversationId,
        participants: data.participants,
        startTime: data.startTime,
        endTime: data.endTime,
        topics: data.topics,
        topicTags: data.topicTags,
        keyInsights: data.keyInsights,
        decisions: data.decisions,
        actionItems: data.actionItems,
        overallQuality: data.overallQuality,
        skillDemonstrations: data.skillDemonstrations,
        sessionContext: data.sessionContext,
        principleApplications: data.principleApplications,
        ethicalConsiderations: data.ethicalConsiderations,
        safetyMeasures: data.safetyMeasures,
        responseTimings: data.responseTimings,
        qualityTrends: data.qualityTrends,
        engagementLevels: data.engagementLevels,
        timestamp: data.timestamp,
        userId: data.userId,
        messageCount: data.messageCount,
        conversationLength: data.conversationLength,
        contextTags: data.contextTags,
        communicationStyle: data.communicationStyle,
        technicalLevel: data.technicalLevel,
        domain: data.domain,
        taskCompleted: data.taskCompleted,
        responseTime: data.responseTime,
      },
    };
  }

  /**
   * Calculate average quality score from conversations
   */
  private calculateAverageQuality(conversations: ConversationData[]): number {
    if (conversations.length === 0) return 0;
    const totalQuality = conversations.reduce((sum, conv) => sum + (conv.qualityScore || 0), 0);
    return totalQuality / conversations.length;
  }

  /**
   * Type guard to check if an object is ConversationData
   */
  private isConversationData(obj: unknown): obj is ConversationData {
    return (
      !!obj &&
      typeof obj === 'object' &&
      'conversationId' in obj &&
      'participants' in obj &&
      'startTime' in obj
    );
  }

  /**
   * Assess memory quality for user-facing intelligence
   */
  async assessMemoryQuality(
    memory: { content: string },
    context?: { toolName?: string },
  ): Promise<unknown> {
    // Only validate user-facing memory, not canonical memory tool operations
    const canonicalMemoryTools = [
      'oneagent_memory_add',
      'oneagent_memory_edit',
      'oneagent_memory_delete',
      'oneagent_memory_search',
    ];
    if (context && context.toolName && canonicalMemoryTools.includes(context.toolName)) {
      return { isValid: true, score: 100 };
    }
    const validation = await this.constitutionalAI.validateResponse(
      memory.content,
      'Memory quality assessment',
      context,
    );
    return validation;
  }

  // --- enum/type guards
  private asCommunicationStyle(value?: unknown): CommunicationStyle {
    const allowed: CommunicationStyle[] = ['formal', 'casual', 'technical', 'conversational'];
    return typeof value === 'string' && allowed.includes(value as CommunicationStyle)
      ? (value as CommunicationStyle)
      : 'formal';
  }

  private asExpertiseLevel(value?: unknown): ExpertiseLevel {
    const allowed: ExpertiseLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    return typeof value === 'string' && allowed.includes(value as ExpertiseLevel)
      ? (value as ExpertiseLevel)
      : 'intermediate';
  }

  private asIntentCategory(value?: unknown): IntentCategory {
    const allowed: IntentCategory[] = [
      'question',
      'request',
      'complaint',
      'compliment',
      'exploration',
    ];
    return typeof value === 'string' && allowed.includes(value as IntentCategory)
      ? (value as IntentCategory)
      : 'question';
  }

  private asContextCategory(value?: unknown): ContextCategory {
    const allowed: ContextCategory[] = [
      'WORKPLACE',
      'PRIVATE',
      'PROJECT',
      'TECHNICAL',
      'FINANCIAL',
      'HEALTH',
      'EDUCATIONAL',
      'CREATIVE',
      'ADMINISTRATIVE',
      'GENERAL',
    ];
    return typeof value === 'string' && allowed.includes(value as ContextCategory)
      ? (value as ContextCategory)
      : 'TECHNICAL';
  }

  private asPrivacyLevel(value?: unknown): PrivacyLevel {
    const allowed: PrivacyLevel[] = ['public', 'internal', 'confidential', 'restricted'];
    return typeof value === 'string' && allowed.includes(value as PrivacyLevel)
      ? (value as PrivacyLevel)
      : 'internal';
  }

  private isSessionContext(obj: unknown): obj is SessionContext {
    if (!obj || typeof obj !== 'object') return false;
    const o = obj as Partial<SessionContext>;
    return !!(
      o.sessionId &&
      o.userId &&
      o.startTime &&
      o.lastActivity &&
      o.currentTopic &&
      o.conversationMode &&
      o.responseQuality &&
      o.userSatisfaction
    );
  }

  /**
   * Generate unified ID following canonical architecture
   */
  private generateUnifiedId(type: string, context?: string): string {
    const timestamp = createUnifiedTimestamp().unix;
    const randomSuffix = this.generateSecureRandomSuffix();
    const prefix = context ? `${type}_${context}` : type;
    return `${prefix}_${timestamp}_${randomSuffix}`;
  }

  private generateSecureRandomSuffix(): string {
    // Use canonical ID generation for consistent randomness
    return createUnifiedId('operation', 'secure_random').split('_').pop() || 'fallback';
  }
}

export default MemoryIntelligence;
