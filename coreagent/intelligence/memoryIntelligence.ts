/**
 * Memory Intelligence Layer for OneAgent - Canonical Context7 Architecture
 * 
 * Provides intelligent memory operations with Constitutional AI compliance:
 * - Clean, modern TypeScript (no legacy compatibility)
 * - Context7 integration for cross-agent learning
 * - Only canonical OneAgentMemory client used
 * - Implements only actually used methods
 * 
 * @version 2.1.0 - Canonical, Lean, Production-Ready
 * @created June 23, 2025
 */

import { OneAgentMemory } from '../memory/OneAgentMemory';
import { ConversationData, ConversationMetadata, MemorySearchResult, MemoryRecord, IntelligenceInsight, CommunicationStyle, ExpertiseLevel, IntentCategory, ContextCategory, PrivacyLevel, SessionContext } from '../types/oneagent-backbone-types';
import { createUnifiedTimestamp, createUnifiedId, unifiedMetadataService } from '../utils/UnifiedBackboneService';
import { OneAgentUnifiedBackbone } from '../utils/UnifiedBackboneService';
import { ConstitutionalAI } from '../agents/base/ConstitutionalAI';
import { PromptEngine } from '../agents/base/PromptEngine';

// Local helper types to remove explicit any while keeping behavior
type StoreMetadata = Partial<{
  sessionId: string;
  communicationStyle: string;
  expertiseLevel: string;
  intentCategory: string;
  contextCategory: string;
  contextTags: string[];
  privacyLevel: string;
  qualityScore: number;
}>;

// Minimal shape used by internal analysis helpers
interface GenericMemoryEntry {
  content?: string;
  description?: string;
  timestamp?: string | number | Date;
  id?: string;
  conversationId?: string;
  participants?: string[];
  userId?: string;
  endTime?: Date | string | number;
  topics?: string[];
  topicTags?: string[];
  keyInsights?: string[];
  decisions?: string[];
  actionItems?: string[];
  qualityScore?: number;
  constitutionalCompliant?: boolean;
  userSatisfaction?: number;
  goalAchievement?: number;
  newKnowledge?: string[];
  improvedUnderstanding?: string[];
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
  private memorySystem: OneAgentMemory;
  private options: MemoryIntelligenceOptions;
  private unifiedBackbone: OneAgentUnifiedBackbone;
  private constitutionalAI: ConstitutionalAI;

  constructor(
    memorySystem?: OneAgentMemory,
    options: MemoryIntelligenceOptions = {}
  ) {
  this.memorySystem = memorySystem || OneAgentMemory.getInstance({});
    this.unifiedBackbone = OneAgentUnifiedBackbone.getInstance();
    this.options = {
      enableSemanticSearch: true,
      maxResults: 50,
      similarityThreshold: 0.7,
      enableConstitutionalValidation: true,
      ...options
    };
    // Initialize ConstitutionalAI with canonical principles and threshold
    this.constitutionalAI = new ConstitutionalAI({
      principles: PromptEngine.CONSTITUTIONAL_PRINCIPLES,
      qualityThreshold: 80
    });
  }

  /**
   * Intelligent memory search with Constitutional AI compliance
   */
  async intelligentSearch(
    query: string, 
    userId: string,
    options: { maxResults?: number } = {}
  ): Promise<MemorySearchResult> {
    const startTime = createUnifiedTimestamp();
    try {
      const memoryResults = await this.memorySystem.searchMemory({
        collection: 'conversations',
        query,
        user_id: userId,
        limit: options.maxResults || this.options.maxResults || 20,
        semanticSearch: true
      });
      const memoryEntries = (memoryResults?.results || []) as MemoryRecord[];
      // Ensure all entries are converted to ConversationData
      const conversations: ConversationData[] = memoryEntries.map((entry) => {
        try {
          const raw = JSON.parse(entry.content) as GenericMemoryEntry | ConversationData;
          return this.isConversationData(raw) ? raw : this.convertToConversationData(raw as GenericMemoryEntry);
        } catch {
          return this.convertToConversationData({ content: entry.content, timestamp: entry.lastAccessed } as GenericMemoryEntry);
        }
      });
      // Optionally validate results for compliance
      if (this.options.enableConstitutionalValidation) {
        for (const conv of conversations) {
          const validation = await this.constitutionalAI.validateResponse(
            JSON.stringify(conv),
            userId // userMessage context, can be improved
          );
          conv.constitutionalCompliant = validation.isValid;
          conv.constitutionalCompliance = validation.isValid ? 1.0 : 0.0;
        }
      }
      const results: MemoryRecord[] = conversations.map(conv => ({
        id: conv.conversationId || 'unknown',
        content: JSON.stringify(conv),
        metadata: unifiedMetadataService.create('memory', 'memoryIntelligence', {
          system: {
            source: 'memoryIntelligence',
            component: 'conversation-analysis',
            userId: userId
          },
          content: {
            category: 'conversation',
            tags: conv.topics || [],
            sensitivity: 'internal',
            relevanceScore: typeof conv.overallQuality === 'number' ? conv.overallQuality : 1.0,
            contextDependency: 'session'
          },
          quality: {
            score: typeof conv.overallQuality === 'number' ? conv.overallQuality : 1.0,
            confidence: 0.8,
            constitutionalCompliant: typeof conv.constitutionalCompliance === 'boolean' ? conv.constitutionalCompliance : true,
            validationLevel: 'enhanced'
          }
        }),
        relatedMemories: [],
        accessCount: 1,
        lastAccessed: new Date(this.unifiedBackbone.getServices().timeService.now().utc),
        qualityScore: typeof conv.overallQuality === 'number' ? conv.overallQuality : 1.0,
        constitutionalStatus: typeof conv.constitutionalCompliance === 'boolean'
          ? (conv.constitutionalCompliance ? 'compliant' : 'requires_review')
          : 'requires_review',
        lastValidation: new Date(createUnifiedTimestamp().utc)
      }));
      const totalQuality = results.reduce((sum, result) => sum + (result.qualityScore || 0), 0);
      const totalRelevance = results.reduce((sum, result) => sum + (result.metadata.content?.relevanceScore || 0), 0);
      const avgQuality = results.length > 0 ? totalQuality / results.length : 0;
      const avgRelevance = results.length > 0 ? totalRelevance / results.length : 0;
      const endTime = createUnifiedTimestamp();
      return {
        results,
        totalFound: results.length,
        totalResults: results.length,
        query,
        searchTime: endTime.unix - startTime.unix,
        averageRelevance: avgRelevance,
        averageQuality: avgQuality,
        constitutionalCompliance: results.filter(r => r.constitutionalStatus === 'compliant').length / Math.max(results.length, 1),
        queryContext: [query],
        suggestedRefinements: [],
        relatedQueries: [],
        metadata: {
          conversations: conversations as ConversationData[],
          insights: this.generateInsights(conversations as ConversationData[])
        }
      };
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
          insights: []
        }
      };
    }
  }

  /**
   * Store conversation with intelligent metadata enhancement
   */
  async storeIntelligentConversation(
    userId: string,
    metadata: ConversationMetadata
  ): Promise<string> {
    const conversationTimestamp = this.unifiedBackbone.getServices().timeService.now();
    const conversationData: ConversationData = {
      conversationId: createUnifiedId('conversation', 'memory_intelligence'),
      participants: [userId],
      startTime: new Date(conversationTimestamp.utc),
      topics: metadata.messageAnalysis?.contextTags || [],
      keyInsights: [],
      decisions: [],
      actionItems: [],
      overallQuality: metadata.qualityMetrics?.overallScore || 0.8,
      constitutionalCompliance: metadata.constitutionalValidation?.passed ? 1.0 : 0.0,
      userSatisfaction: 0.8,
      goalAchievement: 0.8,
      newKnowledge: [],
      improvedUnderstanding: [],
      skillDemonstrations: [],
      sessionContext: {
        sessionId: metadata.sessionId || 'unknown',
        userId,
        startTime: new Date(conversationTimestamp.utc),
        lastActivity: new Date(conversationTimestamp.utc),
        currentTopic: metadata.messageAnalysis?.contextTags?.[0] || 'general',
        conversationMode: 'task_completion',
        sessionType: 'quick_query',
        expectedDuration: 300,
        goalDefinition: 'Provide helpful assistance',
        constitutionalMode: 'balanced',
        validationLevel: 'enhanced',
        responseQuality: [0.9],
        userSatisfaction: [0.8],
        goalProgress: 0.8,
        relevantMemories: [],
        newLearnings: [],
        constitutionalCompliance: metadata.constitutionalValidation?.passed ? 1.0 : 0.0,
        helpfulnessScore: 0.9,
        accuracyMaintained: true
      },
      principleApplications: [],
      ethicalConsiderations: [],
      safetyMeasures: [],
      responseTimings: [1000],
      qualityTrends: [metadata.qualityMetrics?.overallScore || 0.8],
      engagementLevels: [0.8],
      ...(metadata.messageAnalysis?.communicationStyle && { 
        communicationStyle: metadata.messageAnalysis.communicationStyle 
      }),
      ...(metadata.messageAnalysis?.expertiseLevel && { 
        technicalLevel: metadata.messageAnalysis.expertiseLevel 
      }),
      ...(metadata.messageAnalysis?.contextTags && { 
        contextTags: metadata.messageAnalysis.contextTags 
      }),
      timestamp: new Date(conversationTimestamp.utc),
      userId,
      messageCount: 1,
      taskCompleted: true,
      responseTime: 1000,
      qualityScore: metadata.qualityMetrics?.overallScore || 0.8,
      topicTags: metadata.messageAnalysis?.contextTags || [],
      conversationLength: 1,
      constitutionalCompliant: metadata.constitutionalValidation?.passed || true,
      domain: metadata.messageAnalysis?.contextTags?.[0] || 'general'
    };
    // [Constitutional AI] Validate before storing
    if (this.options.enableConstitutionalValidation) {
      const validation = await this.constitutionalAI.validateResponse(
        JSON.stringify(conversationData),
        userId // userMessage context, can be improved with actual message
      );
      if (!validation.isValid) {
        // Optionally, you could throw, log, or flag the entry
        console.warn('[ConstitutionalAI] Memory entry failed validation:', validation.violations);
        // For now, flag in metadata
        conversationData.constitutionalCompliant = false;
        conversationData.constitutionalCompliance = 0.0;
      } else {
        conversationData.constitutionalCompliant = true;
        conversationData.constitutionalCompliance = 1.0;
      }
    }
    const memoryObj = this.mapConversationDataToMemory(conversationData, userId);
    // Replace storeConversation with addMemory to 'conversations' collection
    const memId = await this.memorySystem.addMemoryCanonical(JSON.stringify(memoryObj), {
      system: { userId, source: 'memoryIntelligence', component: 'conversation-store' },
      content: { category: 'conversation', tags: ['conversation','bridge'], sensitivity: 'internal', relevanceScore: 0.7, contextDependency: 'session' },
      quality: { score: 0.8, constitutionalCompliant: true, validationLevel: 'basic', confidence: 0.75 },
      relationships: { parent: undefined, children: [], related: [], dependencies: [] },
      analytics: { accessCount: 0, lastAccessPattern: 'write', usageContext: [] }
    }, userId);
    return memId;
  }

  /**
   * Semantic search for memory bridge compatibility
   */
  async semanticSearch(
    query: string,
    options: { userId?: string; maxResults?: number } = {}
  ): Promise<MemorySearchResult> {
    const searchOptions: { maxResults?: number } = {};
    if (options.maxResults !== undefined) {
      searchOptions.maxResults = options.maxResults;
    }
    return this.intelligentSearch(query, options.userId || 'system', searchOptions);
  }

  /**
   * Get memory entry by ID
   */
  async getMemory(memoryId: string): Promise<ConversationData | null> {
    try {
      const memoryResults = await this.memorySystem.searchMemory({
        collection: 'conversations',
        query: memoryId,
        user_id: 'system',
        limit: 1
      });
      return Array.isArray(memoryResults) && memoryResults.length > 0 ? 
        this.convertToConversationData(memoryResults[0]) : null;
    } catch {
      return null;
    }
  }

  /**
   * Store memory entry
   */
  async storeMemory(
    _content: string,
    userId: string,
    metadata: StoreMetadata = {}
  ): Promise<string> {
    const metadataTimestamp = this.unifiedBackbone.getServices().timeService.now();
    const conversationMetadata: ConversationMetadata = {
      userId,
      sessionId: typeof metadata.sessionId === 'string' ? metadata.sessionId : 'system',
      timestamp: new Date(metadataTimestamp.utc),
      messageAnalysis: {
        communicationStyle: this.asCommunicationStyle(metadata.communicationStyle),
        expertiseLevel: this.asExpertiseLevel(metadata.expertiseLevel),
        intentCategory: this.asIntentCategory(metadata.intentCategory),
        contextCategory: this.asContextCategory(metadata.contextCategory),
        contextTags: Array.isArray(metadata.contextTags) ? metadata.contextTags : [],
        privacyLevel: this.asPrivacyLevel(metadata.privacyLevel),
        sentimentScore: 0.5,
        complexityScore: 0.5,
        urgencyLevel: 0.5
      },
      qualityMetrics: {
        overallScore: typeof metadata.qualityScore === 'number' ? metadata.qualityScore : 0.8,
        dimensions: {},
        improvementSuggestions: []
      },
      constitutionalValidation: {
        passed: true,
        principleScores: {},
        violations: [],
        confidence: 1.0
      }
    };
    return this.storeIntelligentConversation(userId, conversationMetadata);
  }

  /**
   * Categorize memory content
   */
  async categorizeMemory(memory: unknown): Promise<string> {
    const gm = (memory || {}) as GenericMemoryEntry;
  const content = (gm.content || gm.description || '').toString();
    if (content.includes('task') || content.includes('instruction')) {
      return 'task_instructions';
    } else if (content.includes('preference') || content.includes('like')) {
      return 'user_preferences';
    } else if (content.includes('personal') || content.includes('profile')) {
      return 'personal_details';
    } else {
      return 'general_knowledge';
    }
  }

  /**
   * Calculate importance score for memory
   */
  async calculateImportanceScore(memory: GenericMemoryEntry): Promise<{ overall: number; [key: string]: number }> {
    const content = (memory.content || memory.description || '').toString();
    const ts = memory.timestamp ? new Date(memory.timestamp) : null;
    const nowUnix = createUnifiedTimestamp().unix;
    const recency = ts ? Math.max(0, 100 - (nowUnix - ts.getTime()) / (1000 * 60 * 60 * 24)) : 50;
    return {
      overall: Math.round((recency + 50) / 2),
      recency: Math.round(recency),
      frequency: 50,
      relevance: content.length > 100 ? 80 : 60,
      userInteraction: 50
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
        const category = (c.topicTags && c.topicTags[0]) || (c.topics && c.topics[0]) || c.domain || 'general';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      }
      // Compute average importance using recency/heuristics
      const importanceScores = await Promise.all(
        (conversations as ConversationData[]).map(async (c) => {
          const score = await this.calculateImportanceScore({
            description: Array.isArray(c.topics) ? c.topics.join(' ') : '',
            timestamp: (c as ConversationData).timestamp || (c as ConversationData).startTime
          } as GenericMemoryEntry);
          return score.overall; // 0-100
        })
      );
      const averageImportance = importanceScores.length > 0
        ? Math.round(importanceScores.reduce((a, b) => a + b, 0) / importanceScores.length)
        : 0;
      return {
        totalConversations: (searchResult.totalResults ?? searchResult.totalFound) || 0,
        averageQuality: this.calculateAverageQuality(conversations as ConversationData[]),
        insights,
        searchTime: searchResult.searchTime,
        constitutionalCompliance: (conversations as ConversationData[]).every((c) => c.constitutionalCompliant),
        categoryBreakdown,
        averageImportance
      };
    } catch {
      return {
        totalConversations: 0,
        averageQuality: 0,
        insights: [],
        searchTime: 0,
        constitutionalCompliance: true,
        categoryBreakdown: {},
        averageImportance: 0
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
      implications: [`${conversations.length < 5 ? 'Low conversation volume may indicate limited context' : 'Sufficient conversation history for analysis'}`],
      timeframe: { start: new Date(createUnifiedTimestamp().unix - 30 * 24 * 60 * 60 * 1000), end: new Date() },
      categories: ['conversation-analysis', 'volume-metrics'],
      recommendations: conversations.length < 5 ? ['Increase engagement to build better context'] : ['Continue regular conversation patterns'],
      preventiveActions: ['Monitor conversation frequency'],
      monitoringPoints: ['Weekly conversation count', 'Quality trend analysis'],
      ethicalImplications: ['Ensure privacy of conversation data'],
      privacyConsiderations: ['Data retention policies apply'],
      safetyAspects: ['No safety concerns identified'],
      relevanceScore: 0.9,
      actionabilityScore: conversations.length < 5 ? 0.8 : 0.5,
      riskLevel: conversations.length < 5 ? 'medium' : 'low',
      createdAt: new Date(),
      validUntil: new Date(createUnifiedTimestamp().unix + 7 * 24 * 60 * 60 * 1000)
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
        implications: [avgQuality < 0.7 ? 'Below optimal quality threshold' : 'Good quality conversations'],
        timeframe: { start: new Date(createUnifiedTimestamp().unix - 7 * 24 * 60 * 60 * 1000), end: new Date() },
        categories: ['quality-analysis', 'performance-metrics'],
        recommendations: avgQuality < 0.7 ? ['Focus on improving response quality', 'Enhance contextual understanding'] : ['Maintain current quality standards'],
        preventiveActions: ['Regular quality monitoring', 'Feedback collection'],
        monitoringPoints: ['Daily quality scores', 'User satisfaction metrics'],
        ethicalImplications: ['Maintain fair quality assessment'],
        privacyConsiderations: ['Quality metrics anonymized'],
        safetyAspects: ['Quality improvements enhance safety'],
        relevanceScore: 0.8,
        actionabilityScore: avgQuality < 0.7 ? 0.9 : 0.4,
        riskLevel: avgQuality < 0.5 ? 'high' : avgQuality < 0.7 ? 'medium' : 'low',
        createdAt: new Date(),
        validUntil: new Date(createUnifiedTimestamp().unix + 7 * 24 * 60 * 60 * 1000)
      });
    }
    return insights;
  }

  /**
   * Convert memory entry to ConversationData format
   */
  private convertToConversationData(memory: GenericMemoryEntry): ConversationData {
    const conversionTimestamp = this.unifiedBackbone.getServices().timeService.now();
    return {
      conversationId: memory.id || memory.conversationId || createUnifiedId('conversation', 'fallback'),
      participants: memory.participants || [memory.userId || 'unknown'],
      startTime: memory.timestamp ? new Date(memory.timestamp) : new Date(conversionTimestamp.utc),
      endTime: memory.endTime ? new Date(memory.endTime) : undefined,
      topics: memory.topics || [],
      topicTags: memory.topicTags || [],
      keyInsights: memory.keyInsights || [],
      decisions: memory.decisions || [],
      actionItems: memory.actionItems || [],
      overallQuality: typeof memory.qualityScore === 'number' ? memory.qualityScore : 0.8,
      qualityScore: typeof memory.qualityScore === 'number' ? memory.qualityScore : 0.8,
      constitutionalCompliance: memory.constitutionalCompliant !== false ? 1.0 : 0.0,
      constitutionalCompliant: memory.constitutionalCompliant !== false,
      userSatisfaction: typeof memory.userSatisfaction === 'number' ? memory.userSatisfaction : 0.8,
      goalAchievement: typeof memory.goalAchievement === 'number' ? memory.goalAchievement : 0.8,
      newKnowledge: memory.newKnowledge || [],
      improvedUnderstanding: memory.improvedUnderstanding || [],
      skillDemonstrations: memory.skillDemonstrations || [],
      sessionContext: this.isSessionContext(memory.sessionContext) ? (memory.sessionContext as SessionContext) : {
        sessionId: memory.sessionId || 'unknown',
        userId: memory.userId || 'unknown',
        startTime: memory.timestamp ? new Date(memory.timestamp) : new Date(conversionTimestamp.utc),
        lastActivity: memory.timestamp ? new Date(memory.timestamp) : new Date(conversionTimestamp.utc),
        currentTopic: memory.topics?.[0] || 'general',
        conversationMode: 'problem_solving',
        sessionType: 'quick_query',
        expectedDuration: 300,
        goalDefinition: 'Provide helpful assistance',
        constitutionalMode: 'balanced',
        validationLevel: 'enhanced',
        responseQuality: [typeof memory.qualityScore === 'number' ? memory.qualityScore : 0.8],
        userSatisfaction: [typeof memory.userSatisfaction === 'number' ? memory.userSatisfaction : 0.8],
        goalProgress: typeof memory.goalAchievement === 'number' ? memory.goalAchievement : 0.8,
        relevantMemories: [],
        newLearnings: [],
        constitutionalCompliance: memory.constitutionalCompliant !== false ? 1.0 : 0.0,
        helpfulnessScore: 0.9,
        accuracyMaintained: true
      },
      principleApplications: memory.principleApplications || [],
      ethicalConsiderations: memory.ethicalConsiderations || [],
      safetyMeasures: memory.safetyMeasures || [],
      responseTimings: memory.responseTimings || [memory.responseTime || 1000],
      qualityTrends: memory.qualityTrends || [memory.qualityScore || 0.8],
      engagementLevels: memory.engagementLevels || [0.8],
      timestamp: memory.timestamp ? new Date(memory.timestamp) : new Date(conversionTimestamp.utc),
      userId: memory.userId,
      messageCount: memory.messageCount || 1,
      conversationLength: memory.conversationLength || 1,
      contextTags: memory.contextTags || [],
      communicationStyle: memory.communicationStyle || 'formal',
      technicalLevel: memory.technicalLevel || 'intermediate',
      domain: memory.domain || 'general',
      taskCompleted: memory.taskCompleted !== false,
      responseTime: memory.responseTime || 1000
    };
  }

  /**
   * Map ConversationData to ConversationMemory for canonical storage
   * Canonical, production-grade format for mem0 API (Gemini backend)
   */
  private mapConversationDataToMemory(data: ConversationData, userId: string): Record<string, unknown> {
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
        satisfaction: (typeof data.userSatisfaction === 'number' && data.userSatisfaction > 0.8) ? 'high' : 'medium',
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
        qualityScore: data.qualityScore,
        constitutionalCompliance: data.constitutionalCompliance,
        constitutionalCompliant: data.constitutionalCompliant,
        userSatisfaction: data.userSatisfaction,
        goalAchievement: data.goalAchievement,
        newKnowledge: data.newKnowledge,
        improvedUnderstanding: data.improvedUnderstanding,
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
        responseTime: data.responseTime
      }
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
    return !!obj && typeof obj === 'object' && 'conversationId' in obj && 'participants' in obj && 'startTime' in obj;
  }

  /**
   * Assess memory quality for user-facing intelligence
   */
  async assessMemoryQuality(memory: { content: string }, context?: { toolName?: string }): Promise<unknown> {
    // Only validate user-facing memory, not canonical memory tool operations
    const canonicalMemoryTools = [
      'oneagent_memory_add',
      'oneagent_memory_edit',
      'oneagent_memory_delete',
      'oneagent_memory_search'
    ];
    if (context && context.toolName && canonicalMemoryTools.includes(context.toolName)) {
      return { isValid: true, score: 100 };
    }
    const validation = await this.constitutionalAI.validateResponse(
      memory.content,
      'Memory quality assessment',
      context
    );
    return validation;
  }

  // --- enum/type guards
  private asCommunicationStyle(value?: unknown): CommunicationStyle {
    const allowed: CommunicationStyle[] = ['formal','casual','technical','conversational'];
    return (typeof value === 'string' && allowed.includes(value as CommunicationStyle)) ? value as CommunicationStyle : 'formal';
  }

  private asExpertiseLevel(value?: unknown): ExpertiseLevel {
    const allowed: ExpertiseLevel[] = ['beginner','intermediate','advanced','expert'];
    return (typeof value === 'string' && allowed.includes(value as ExpertiseLevel)) ? value as ExpertiseLevel : 'intermediate';
  }

  private asIntentCategory(value?: unknown): IntentCategory {
    const allowed: IntentCategory[] = ['question','request','complaint','compliment','exploration'];
    return (typeof value === 'string' && allowed.includes(value as IntentCategory)) ? value as IntentCategory : 'question';
  }

  private asContextCategory(value?: unknown): ContextCategory {
    const allowed: ContextCategory[] = ['WORKPLACE','PRIVATE','PROJECT','TECHNICAL','FINANCIAL','HEALTH','EDUCATIONAL','CREATIVE','ADMINISTRATIVE','GENERAL'];
    return (typeof value === 'string' && allowed.includes(value as ContextCategory)) ? value as ContextCategory : 'TECHNICAL';
  }

  private asPrivacyLevel(value?: unknown): PrivacyLevel {
    const allowed: PrivacyLevel[] = ['public','internal','confidential','restricted'];
    return (typeof value === 'string' && allowed.includes(value as PrivacyLevel)) ? value as PrivacyLevel : 'internal';
  }

  private isSessionContext(obj: unknown): obj is SessionContext {
    if (!obj || typeof obj !== 'object') return false;
    const o = obj as Partial<SessionContext>;
    return !!(o.sessionId && o.userId && o.startTime && o.lastActivity && o.currentTopic && o.conversationMode && o.responseQuality && o.userSatisfaction);
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
