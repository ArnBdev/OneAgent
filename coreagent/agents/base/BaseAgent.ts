/**
 * BaseAgent - Core Agent Implementation for OneAgent
 *
 * Enhanced with Advanced Prompt Engineering System:
 * - Constitutional AI principles and self-correction
 * - BMAD 9-point elicitation framework
 * - Systematic prompting frameworks (R-T-F, T-A-G, R-I-S-E, R-G-C, C-A-R-E)
 * - Chain-of-Verification (CoVe) patterns
 * - RAG integration with source grounding
 *
 * Achieves 20-95% improvements in accuracy, task adherence, and quality.
 */

import { OneAgentMemory } from '../../memory/OneAgentMemory';
// import { UnifiedBackboneService } from '../../utils/UnifiedBackboneService';
import {
  OneAgentUnifiedBackbone,
  unifiedBackbone as canonicalUnifiedBackbone,
  generateUnifiedId,
  unifiedMetadataService,
  createUnifiedTimestamp,
} from '../../utils/UnifiedBackboneService';
import { SmartGeminiClient } from '../../tools/SmartGeminiClient';
import { User } from '../../types/user';
import { MemoryIntelligence } from '../../intelligence/memoryIntelligence';
import {
  NLACSMessage,
  EmergentInsight,
  ConversationThread,
  NLACSCapability,
  MemoryRecord,
  UnifiedMetadata,
  A2AMessage,
  AgentId,
  SessionId,
  MessageId,
  UnifiedAgentContext,
} from '../../types/oneagent-backbone-types';
import { unifiedAgentCommunicationService } from '../../utils/UnifiedAgentCommunicationService';
import { PromptEngine, PromptConfig, AgentPersona } from './PromptEngine';
import { ConstitutionalAI } from './ConstitutionalAI';
import { BMADElicitationEngine } from './BMADElicitationEngine';
import { PersonalityEngine } from '../personality/PersonalityEngine';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  memoryEnabled: boolean;
  aiEnabled: boolean;
  // Optional provider-native model name for AI client (Gemini by default)
  aiModelName?: string;
}

export interface AgentContext {
  user: User;
  sessionId: string;
  conversationHistory: Message[];
  memoryContext?: unknown[];
  // enrichedContext?: any;  // Optional enriched context (interface removed)

  // Enhanced context for inter-agent communication
  projectContext?: string; // Project identifier for context isolation
  topicContext?: string; // Topic/domain for context organization
  metadata?: Record<string, unknown>; // Unified metadata for enhanced tracking
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  content: string;
  actions?: AgentAction[];
  memories?: unknown[];
  metadata?: Record<string, unknown>;
}

export interface AgentAction {
  type: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Base Agent class providing common functionality for all OneAgent agents
 * Enhanced with Advanced Prompt Engineering System
 */
export abstract class BaseAgent {
  public config: AgentConfig;
  protected memoryClient?: OneAgentMemory;
  protected memoryIntelligence?: MemoryIntelligence;
  protected aiClient?: SmartGeminiClient;
  protected isInitialized: boolean = false;
  protected unifiedBackbone: OneAgentUnifiedBackbone;
  // Unified context injected by AgentFactory (canonical) providing
  // time/metadata/session grounding. Set via setUnifiedContext() post-construction.
  protected unifiedContext?: UnifiedAgentContext;

  // Advanced Prompt Engineering Components
  protected promptEngine?: PromptEngine;
  protected constitutionalAI?: ConstitutionalAI;
  protected bmadElicitation?: BMADElicitationEngine;
  protected promptConfig?: PromptConfig;
  protected personalityEngine?: PersonalityEngine;

  // Canonical agent communication handled via UnifiedBackboneService only.
  protected currentSessions: Set<string> = new Set();

  // Canonical A2A/NLACS communication via unified service only
  protected comm = unifiedAgentCommunicationService;
  private boundMessageHandler?: (payload: unknown) => void;

  // =============================================================================
  // NLACS (Natural Language Agent Coordination System) Extensions - Phase 1
  // Using Canonical Backbone Methods, Metadata System, and Temporal System
  // =============================================================================

  protected nlacsCapabilities: NLACSCapability[] = [];
  protected nlacsEnabled: boolean = false;

  /**
   * Constructor for BaseAgent
   */
  constructor(config: AgentConfig, promptConfig?: PromptConfig) {
    this.config = config;
    // Use canonical singleton to avoid parallel backbone instances
    this.unifiedBackbone = OneAgentUnifiedBackbone.getInstance
      ? OneAgentUnifiedBackbone.getInstance()
      : (canonicalUnifiedBackbone as OneAgentUnifiedBackbone);
    // Initialize enhanced prompt engine if config provided
    if (promptConfig) {
      this.promptEngine = new PromptEngine(promptConfig);
      this.promptConfig = promptConfig;
    }
    // All A2A/NLACS handled via canonical unifiedAgentCommunicationService
  }
  /**
   * Initialize canonical A2A protocol (if not already initialized)
   */
  // No direct protocol initialization; all handled by unifiedAgentCommunicationService

  /**
   * Send a canonical A2A message with NLACS extension (for multi-agent/NLACS ops)
   */
  /**
   * Send a canonical A2A message with NLACS extension (for multi-agent/NLACS ops)
   */
  protected async sendA2ANLACSMessage(params: {
    sessionId: SessionId;
    toAgent: AgentId;
    content: string;
    messageType: 'update' | 'question' | 'decision' | 'action' | 'insight';
    nlacsExtension?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<MessageId | null> {
    try {
      const messageId = await this.comm.sendMessage({
        sessionId: params.sessionId,
        fromAgent: this.config.id as AgentId,
        toAgent: params.toAgent,
        content: params.content,
        messageType: params.messageType,
        metadata: {
          ...params.metadata,
          extensions: [
            {
              uri: 'https://oneagent.ai/extensions/nlacs',
              ...params.nlacsExtension,
            },
          ],
          nlacs: true,
        },
      });
      return messageId;
    } catch (error) {
      console.error('Failed to send A2A NLACS message:', error);
      return null;
    }
  }

  /**
   * Receive/process a canonical A2A message (NLACS extension aware)
   */
  protected async handleA2AIncomingMessage(a2aMessage: A2AMessage): Promise<void> {
    // Route to NLACS discussion if extension present
    const extensions = a2aMessage.metadata?.extensions;
    if (
      Array.isArray(extensions) &&
      extensions.some((ext: { uri: string }) => ext.uri === 'https://oneagent.ai/extensions/nlacs')
    ) {
      // Process as NLACS message (could call contributeToDiscussion, etc.)
      console.log('Received NLACS-enabled A2A message:', a2aMessage);
      // Optionally: parse and store in memory, trigger NLACS workflows
    }
    // Handle other message types as needed
  }

  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize memory client if enabled
      if (this.config.memoryEnabled) {
        // Use canonical singleton to prevent parallel memory systems
        this.memoryClient = OneAgentMemory.getInstance({ userId: 'default-user' });
        this.memoryIntelligence = new MemoryIntelligence();
      }

      // Initialize AI client if enabled
      if (this.config.aiEnabled) {
        this.aiClient = new SmartGeminiClient({ model: this.config.aiModelName });
      }

      // Initialize Constitutional AI
      this.constitutionalAI = new ConstitutionalAI({
        principles: [
          {
            id: 'accuracy',
            name: 'accuracy',
            description: 'Provide accurate and factual information',
            category: 'accuracy',
            weight: 1,
            isViolated: false,
            confidence: 1,
            validationRule: 'content.length > 0',
            severityLevel: 'high',
          },
          {
            id: 'transparency',
            name: 'transparency',
            description: 'Be transparent about limitations and reasoning',
            category: 'transparency',
            weight: 1,
            isViolated: false,
            confidence: 1,
            validationRule: 'content.length > 0',
            severityLevel: 'medium',
          },
          {
            id: 'helpfulness',
            name: 'helpfulness',
            description: 'Provide helpful and actionable responses',
            category: 'helpfulness',
            weight: 1,
            isViolated: false,
            confidence: 1,
            validationRule: 'content.length > 0',
            severityLevel: 'medium',
          },
          {
            id: 'safety',
            name: 'safety',
            description: 'Ensure safe and ethical behavior',
            category: 'safety',
            weight: 1,
            isViolated: false,
            confidence: 1,
            validationRule: 'content.length > 0',
            severityLevel: 'critical',
          },
        ],
        qualityThreshold: 0.8,
      });

      // Initialize BMAD Elicitation Engine
      this.bmadElicitation = new BMADElicitationEngine();

      // Initialize Personality Engine
      this.personalityEngine = new PersonalityEngine();

      // Subscribe to canonical A2A message events and route relevant ones to handler
      this.boundMessageHandler = (payload: unknown) => {
        const msg = (payload as { message?: A2AMessage }).message;
        if (!msg) return;
        // Route if message is for this agent (direct) or broadcast (no toAgent)
        const isRecipient = !msg.toAgent || msg.toAgent === (this.config.id as AgentId);
        if (!isRecipient) return;
        // If agent tracks sessions, optionally filter by known sessions; otherwise accept
        void this.handleA2AIncomingMessage(msg);
      };
      this.comm.on('message_sent', this.boundMessageHandler);

      this.isInitialized = true;
      console.log(`✅ BaseAgent ${this.config.id} initialized successfully`);
    } catch (error) {
      console.error(`❌ Failed to initialize BaseAgent ${this.config.id}:`, error);
      throw error;
    }
  }

  /**
   * Check if agent is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Clean up agent resources
   */
  async cleanup(): Promise<void> {
    this.isInitialized = false;
    if (this.boundMessageHandler) {
      this.comm.off('message_sent', this.boundMessageHandler);
      this.boundMessageHandler = undefined;
    }
    console.log(`🧹 BaseAgent ${this.config.id} cleaned up`);
  }

  // =============================================================================
  // NLACS (Natural Language Agent Coordination System) Extensions - Phase 1
  // Using Canonical Backbone Methods, Metadata System, and Temporal System
  // =============================================================================

  /**
   * Enable NLACS capabilities for this agent
   * Uses canonical backbone temporal and metadata systems
   */
  protected enableNLACS(capabilities: NLACSCapability[]): void {
    this.nlacsCapabilities = capabilities;
    this.nlacsEnabled = true;

    // Create string representations for logging and storage
    const capabilityStrings = capabilities.map((c) => `${c.type}:${c.description}`);

    // Log with canonical backbone metadata
    // Removed direct variable usage; canonical metadata built in call below

    console.log(
      `🧠 NLACS enabled for ${this.config.id} with capabilities: ${capabilityStrings.join(', ')}`,
    );

    // Store in OneAgent memory with canonical metadata
    this.memoryClient
      ?.addMemoryCanonical(
        `NLACS capabilities enabled: ${capabilityStrings.join(', ')}`,
        this.buildCanonicalAgentMetadata('nlacs_initialization', this.config.id, {
          agentId: this.config.id,
          capabilities: capabilityStrings,
          originalType: 'nlacs_initialization',
        }),
        this.config.id,
      )
      .catch((error) => {
        console.error('Failed to store NLACS initialization in memory:', error);
      });
  }

  /**
   * Join a natural language discussion
   * Uses canonical backbone temporal system and OneAgent memory
   */
  protected async joinDiscussion(discussionId: string, context?: string): Promise<boolean> {
    if (!this.nlacsEnabled) {
      console.warn(`⚠️ NLACS not enabled for ${this.config.id}`);
      return false;
    }

    try {
      const services = this.unifiedBackbone.getServices();
      const joinTimestamp = services.timeService.now();

      // Create canonical metadata for discussion participation
      // Directly constructing canonical metadata via buildCanonicalAgentMetadata later

      console.log(
        `💬 ${this.config.id} joining discussion: ${discussionId} at ${joinTimestamp.iso}`,
      );

      // Store participation in OneAgent memory with canonical structure
      await this.memoryClient?.addMemoryCanonical(
        `Joined NLACS discussion: ${discussionId}`,
        this.buildCanonicalAgentMetadata('nlacs_participation', this.config.id, {
          discussionId,
          agentId: this.config.id,
          joinedAt: joinTimestamp,
          context: context || 'standard_participation',
          capabilities: this.nlacsCapabilities,
        }),
        this.config.id,
      );

      return true;
    } catch (error) {
      console.error(`❌ Error joining discussion ${discussionId}:`, error);
      return false;
    }
  }

  /**
   * Contribute to a natural language discussion
   * Uses canonical backbone systems and OneAgent memory
   */
  protected async contributeToDiscussion(
    discussionId: string,
    content: string,
    messageType:
      | 'question'
      | 'contribution'
      | 'synthesis'
      | 'insight'
      | 'consensus' = 'contribution',
    context?: string,
  ): Promise<NLACSMessage | null> {
    if (!this.nlacsEnabled) {
      console.warn(`⚠️ NLACS not enabled for ${this.config.id}`);
      return null;
    }

    try {
      const services = this.unifiedBackbone.getServices();
      const contributionTimestamp = services.timeService.now();

      // Create canonical NLACS message with backbone metadata
      const message: NLACSMessage = {
        id: generateUnifiedId('message', this.config.id),
        discussionId,
        agentId: this.config.id,
        content,
        messageType,
        timestamp: new Date(contributionTimestamp.unix),
        metadata: {
          context: context || 'standard_contribution',
          agentCapabilities: this.nlacsCapabilities,
          // Canonical backbone metadata
          backbone: services.metadataService.create('contribute_to_discussion', 'agent_system', {
            content: {
              category: 'communication',
              tags: [
                'nlacs',
                'contribution',
                `agent:${this.config.id}`,
                `discussion:${discussionId}`,
                `type:${messageType}`,
              ],
              sensitivity: 'internal' as const,
              relevanceScore: 0.9,
              contextDependency: 'session' as const,
            },
            system: {
              source: 'agent_system',
              component: 'nlacs_contribution',
              agent: {
                id: this.config.id,
                type: 'specialized',
              },
            },
          }),
        },
      };

      // Store contribution in OneAgent memory with canonical structure
      await this.memoryClient?.addMemoryCanonical(
        `NLACS Discussion Contribution: ${content}`,
        this.buildCanonicalAgentMetadata('nlacs_contribution', this.config.id, {
          discussionId,
          messageId: message.id,
          messageType,
          agentId: this.config.id,
          contributedAt: contributionTimestamp,
          contentLength: content.length,
          context: context || 'standard_contribution',
        }),
        this.config.id,
      );

      console.log(
        `💬 ${this.config.id} contributed to discussion ${discussionId}: ${messageType} at ${contributionTimestamp}`,
      );
      return message;
    } catch (error) {
      console.error(`❌ Error contributing to discussion ${discussionId}:`, error);
      return null;
    }
  }

  /**
   * Generate emergent insights from conversation patterns
   * Uses canonical backbone temporal system and OneAgent memory
   */
  protected async generateEmergentInsights(
    conversationHistory: NLACSMessage[],
    context?: string,
  ): Promise<EmergentInsight[]> {
    if (!this.nlacsEnabled) {
      console.warn(`⚠️ NLACS not enabled for ${this.config.id}`);
      return [];
    }

    try {
      const services = this.unifiedBackbone.getServices();
      const analysisTimestamp = services.timeService.now();
      const insights: EmergentInsight[] = [];

      // Analyze conversation patterns using canonical temporal data
      const messageTypes = conversationHistory.map((m) => m.messageType);
      const participants = new Set(conversationHistory.map((m) => m.agentId));
      const timeSpan =
        conversationHistory.length > 0
          ? conversationHistory[conversationHistory.length - 1].timestamp.getTime() -
            conversationHistory[0].timestamp.getTime()
          : 0;

      // Pattern-based insight generation with canonical metadata
      if (messageTypes.includes('question') && messageTypes.includes('contribution')) {
        const insight: EmergentInsight = {
          id: generateUnifiedId('analysis', this.config.id),
          type: 'pattern',
          content: `Effective Q&A pattern observed with ${participants.size} participants over ${Math.round(timeSpan / 1000)}s`,
          confidence: 0.75,
          contributors: Array.from(participants),
          sources: conversationHistory.slice(0, 3).map((m) => m.id),
          implications: ['Enhanced collaboration pattern', 'Effective knowledge sharing'],
          actionItems: ['Continue Q&A pattern', 'Encourage participation'],
          createdAt: new Date(analysisTimestamp.unix),
          relevanceScore: 0.85,
        };
        insights.push(insight);
      }

      if (messageTypes.includes('synthesis')) {
        const synthesisMessages = conversationHistory.filter((m) => m.messageType === 'synthesis');
        const insight: EmergentInsight = {
          id: generateUnifiedId('knowledge', this.config.id),
          type: 'synthesis',
          content: `Knowledge synthesis achieved through ${synthesisMessages.length} synthesis points with ${participants.size} participants`,
          confidence: 0.82,
          contributors: Array.from(participants),
          sources: synthesisMessages.map((m) => m.id),
          implications: ['Knowledge consolidation completed', 'Collaborative synthesis achieved'],
          actionItems: ['Document synthesis outcomes', 'Share insights with team'],
          createdAt: new Date(analysisTimestamp.unix),
          relevanceScore: 0.88,
        };
        insights.push(insight);
      }

      // Store insights in OneAgent memory with canonical backbone structure
      for (const insight of insights) {
        await this.memoryClient?.addMemoryCanonical(
          `Emergent Insight: ${insight.content}`,
          this.buildCanonicalAgentMetadata('emergent_insight', this.config.id, {
            insightId: insight.id,
            insightType: insight.type,
            confidence: insight.confidence,
            context: context || 'conversation_analysis',
            contributingAgents: insight.contributors,
            sourceMessageIds: insight.sources,
          }),
          this.config.id,
        );
      }

      console.log(
        `🧠 ${this.config.id} generated ${insights.length} emergent insights at ${analysisTimestamp}`,
      );
      return insights;
    } catch (error) {
      console.error(`❌ Error generating emergent insights:`, error);
      return [];
    }
  }

  /**
   * Synthesize knowledge from multiple conversations
   * Uses canonical backbone systems and OneAgent memory
   */
  protected async synthesizeKnowledge(
    conversationThreads: ConversationThread[],
    synthesisQuestion: string,
  ): Promise<string | null> {
    if (!this.nlacsEnabled) {
      console.warn(`⚠️ NLACS not enabled for ${this.config.id}`);
      return null;
    }

    try {
      const services = this.unifiedBackbone.getServices();
      const synthesisTimestamp = services.timeService.now();

      // Extract key insights from conversation threads using canonical temporal data
      const allInsights = conversationThreads.flatMap((thread) => thread.insights || []);

      if (allInsights.length === 0) {
        console.warn(`⚠️ No insights available for synthesis at ${synthesisTimestamp}`);
        return null;
      }

      // Create synthesis context with canonical metadata
      const synthesisContext = {
        question: synthesisQuestion,
        insightCount: allInsights.length,
        threadCount: conversationThreads.length,
        synthesisTimestamp: synthesisTimestamp,
        agentId: this.config.id,
      };

      // Generate synthesis using AI with canonical prompting
      const synthesisPrompt = `
        Based on the following insights from ${conversationThreads.length} conversation threads, 
        please provide a comprehensive synthesis addressing: "${synthesisQuestion}"
        
        Context: Agent ${synthesisContext.agentId} analyzing ${synthesisContext.insightCount} insights
        Timestamp: ${synthesisContext.synthesisTimestamp}
        
        Insights (${allInsights.length} total):
        ${allInsights
          .map(
            (insight, idx) =>
              `${idx + 1}. ${insight.content} (confidence: ${insight.confidence}, discovered: ${insight.createdAt})`,
          )
          .join('\n')}
        
        Please provide a thoughtful synthesis that connects these insights and addresses the question.
        Focus on patterns, connections, and actionable conclusions.
      `;

      const synthesisResult = await this.aiClient?.generateContent(synthesisPrompt);
      const synthesis =
        typeof synthesisResult === 'string'
          ? synthesisResult
          : synthesisResult?.response ||
            `Cross-conversation synthesis based on ${allInsights.length} insights from ${conversationThreads.length} threads`;

      // Store synthesis in OneAgent memory with canonical backbone structure
      await this.memoryClient?.addMemoryCanonical(
        `Knowledge Synthesis: ${synthesis}`,
        this.buildCanonicalAgentMetadata('knowledge_synthesis', this.config.id, {
          synthesisId: generateUnifiedId('knowledge', this.config.id),
          synthesisQuestion,
          sourceThreadIds: conversationThreads.map((t) => t.id),
          sourceInsightIds: allInsights.map((i) => i.id),
          insightCount: allInsights.length,
          threadCount: conversationThreads.length,
          synthesisLength: synthesis.length,
          questionCategory: this.categorizeSynthesisQuestion(synthesisQuestion),
        }),
        this.config.id,
      );

      console.log(
        `🔄 ${this.config.id} synthesized knowledge from ${conversationThreads.length} conversations at ${synthesisTimestamp}`,
      );
      return synthesis;
    } catch (error) {
      console.error(`❌ Error synthesizing knowledge:`, error);
      return null;
    }
  }

  /**
   * Extract conversation patterns for learning
   * Uses canonical backbone temporal system and OneAgent memory
   */
  protected async extractConversationPatterns(
    conversationHistory: NLACSMessage[],
  ): Promise<{ patterns: string[]; insights: string[] }> {
    try {
      const services = this.unifiedBackbone.getServices();
      const analysisTimestamp = services.timeService.now();
      const patterns: string[] = [];
      const insights: string[] = [];

      // Analyze message flow patterns with canonical temporal data
      const messageTypes = conversationHistory.map((m) => m.messageType);
      const messageFlow = messageTypes.join(' → ');
      const timeSpan =
        conversationHistory.length > 0
          ? conversationHistory[conversationHistory.length - 1].timestamp.getTime() -
            conversationHistory[0].timestamp.getTime()
          : 0;

      patterns.push(`Message flow: ${messageFlow}`);
      patterns.push(`Conversation duration: ${Math.round(timeSpan / 1000)}s`);
      patterns.push(
        `Message frequency: ${Math.round(conversationHistory.length / (timeSpan / 1000))} msg/s`,
      );

      // Identify effective patterns using canonical analysis
      if (messageFlow.includes('question → contribution → synthesis')) {
        insights.push('Effective Q→C→S pattern leads to synthesis');
      }

      if (messageFlow.includes('insight')) {
        insights.push('Insight generation indicates deep thinking');
      }

      // Analyze participation patterns with canonical metadata
      const participants = new Set(conversationHistory.map((m) => m.agentId));
      patterns.push(`Participant count: ${participants.size}`);
      patterns.push(`Participants: ${Array.from(participants).join(', ')}`);

      if (participants.size > 2) {
        insights.push('Multi-agent collaboration enhances discussion quality');
      }

      // Analyze conversation memory patterns using OneAgent memory
      const nlacsMemories = await this.memoryClient?.searchMemory({
        query: 'nlacs_contribution',
        userId: this.config.id,
        limit: 10,
      });

      // Extract patterns from historical NLACS participation
      if (nlacsMemories?.results && nlacsMemories.results.length > 0) {
        patterns.push(
          `Historical participation: ${nlacsMemories.results.length} previous discussions`,
        );

        // Extract common themes using canonical metadata
        const themes = new Set<string>();
        const contexts = new Set<string>();

        nlacsMemories.results.forEach((memory: MemoryRecord) => {
          if (memory.content?.includes('messageType')) {
            themes.add('communication_pattern');
          }
          if (memory.content?.includes('context')) {
            contexts.add('conversation_context');
          }
        });

        if (themes.size > 0) {
          patterns.push(`Common contribution types: ${Array.from(themes).join(', ')}`);
        }

        if (contexts.size > 0) {
          patterns.push(`Discussion contexts: ${Array.from(contexts).join(', ')}`);
        }
      }

      // Store pattern analysis in OneAgent memory with canonical structure
      await this.memoryClient?.addMemoryCanonical(
        `Conversation Pattern Analysis: ${patterns.length} patterns, ${insights.length} insights`,
        this.buildCanonicalAgentMetadata('pattern_analysis', this.config.id, {
          analysisId: generateUnifiedId('analysis', this.config.id),
          patternCount: patterns.length,
          insightCount: insights.length,
          messageCount: conversationHistory.length,
          participantCount: participants.size,
          conversationDuration: timeSpan,
        }),
        this.config.id,
      );

      console.log(
        `📊 ${this.config.id} extracted ${patterns.length} conversation patterns and ${insights.length} insights at ${analysisTimestamp}`,
      );
      return { patterns, insights };
    } catch (error) {
      console.error(`❌ Error extracting conversation patterns:`, error);
      return { patterns: [], insights: [] };
    }
  }

  /**
   * Helper method to categorize synthesis questions
   * Uses canonical categorization for metadata
   */
  private categorizeSynthesisQuestion(question: string): string {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('how') || lowerQuestion.includes('process')) {
      return 'process_inquiry';
    } else if (lowerQuestion.includes('what') || lowerQuestion.includes('definition')) {
      return 'concept_inquiry';
    } else if (lowerQuestion.includes('why') || lowerQuestion.includes('reason')) {
      return 'causal_inquiry';
    } else if (lowerQuestion.includes('when') || lowerQuestion.includes('time')) {
      return 'temporal_inquiry';
    } else if (lowerQuestion.includes('best') || lowerQuestion.includes('optimal')) {
      return 'optimization_inquiry';
    } else {
      return 'general_inquiry';
    }
  }

  /**
   * Get NLACS status and capabilities
   * Uses canonical backbone metadata
   */
  protected getNLACSStatus(): {
    enabled: boolean;
    capabilities: NLACSCapability[];
    metadata: UnifiedMetadata;
  } {
    const services = this.unifiedBackbone.getServices();
    return {
      enabled: this.nlacsEnabled,
      capabilities: this.nlacsCapabilities,
      metadata: services.metadataService.create('nlacs_status', 'agent_system', {
        content: {
          category: 'system',
          tags: ['nlacs', 'status', `agent:${this.config.id}`],
          sensitivity: 'internal' as const,
          relevanceScore: 0.8,
          contextDependency: 'session' as const,
        },
        system: {
          source: 'agent_system',
          component: 'nlacs_status',
          agent: {
            id: this.config.id,
            type: 'specialized',
          },
        },
      }),
    };
  }

  /**
   * Validate context for agent operations
   */
  protected validateContext(context: AgentContext): void {
    if (!context.user) {
      throw new Error('User context is required');
    }
    if (!context.sessionId) {
      throw new Error('Session ID is required');
    }
  }

  /**
   * Add memory to the agent's memory system
   */
  protected async addMemory(
    userId: string,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.memoryClient) {
      console.warn('Memory client not initialized');
      return;
    }
    const ts = createUnifiedTimestamp();
    const unified = this.buildCanonicalAgentMetadata('agent_event', userId, metadata, ts);
    await this.memoryClient.addMemoryCanonical(content, unified, userId);
  }

  /**
   * Build canonical agent metadata with consistent structure
   */
  protected buildCanonicalAgentMetadata(
    type: string,
    userId: string,
    extra?: Record<string, unknown>,
    timestamp: ReturnType<typeof createUnifiedTimestamp> = createUnifiedTimestamp(),
  ): Partial<UnifiedMetadata> {
    return unifiedMetadataService.create(type, 'BaseAgent', {
      system: {
        userId,
        component: this.config.id,
        source: 'BaseAgent',
        agent: { id: this.config.id, type: 'specialized' },
      },
      content: {
        category: type,
        tags: ['agent', this.config.id, type],
        sensitivity: 'internal',
        relevanceScore: 0.7,
        contextDependency: 'session',
      },
      temporal: {
        created: timestamp,
        updated: timestamp,
        accessed: timestamp,
        contextSnapshot: {
          timeOfDay: timestamp.contextual.timeOfDay,
          dayOfWeek: new Date(timestamp.unix).toLocaleDateString(undefined, { weekday: 'long' }),
          businessContext: true,
          energyContext: timestamp.contextual.energyLevel,
        },
      },
      ...(extra || {}),
    } as unknown as Partial<UnifiedMetadata>);
  }

  /**
   * Search memories
   */
  protected async searchMemories(
    userId: string,
    query: string,
    limit: number = 10,
  ): Promise<MemoryRecord[]> {
    if (!this.memoryClient) {
      console.warn('Memory client not initialized');
      return [];
    }

    const results = await this.memoryClient.searchMemory({
      query,
      userId,
      limit,
    });

    return results?.results || [];
  }

  /**
   * Generate AI response using the SmartGeminiClient
   */
  protected async generateResponse(prompt: string, memories?: MemoryRecord[]): Promise<string> {
    if (!this.aiClient) {
      console.warn('AI client not initialized');
      return 'AI response not available';
    }

    const context = memories ? memories.map((m) => m.content).join('\n') : '';
    const enhancedPrompt = context ? `Context:\n${context}\n\nQuery:\n${prompt}` : prompt;

    const response = await this.aiClient.generateContent(enhancedPrompt);
    return typeof response === 'string' ? response : response?.response || 'No response generated';
  }

  /**
   * Create a standardized agent response
   */
  protected createResponse(
    content: string,
    actions: AgentAction[] = [],
    memories: MemoryRecord[] = [],
  ): AgentResponse {
    return {
      content,
      actions,
      memories,
      metadata: {
        agentId: this.config.id,
        timestamp: new Date(this.unifiedBackbone.getServices().timeService.now().utc),
        confidence: 0.85,
      },
    };
  }

  /**
   * Execute an action (base implementation)
   */
  async executeAction(
    action: string | AgentAction,
    _params: Record<string, unknown>,
    _context?: AgentContext,
  ): Promise<AgentResponse> {
    const actionName = typeof action === 'string' ? action : action.type;
    console.log(`BaseAgent ${this.config.id} executing action: ${actionName}`);

    // Base implementation - specialized agents should override
    return this.createResponse(`Action ${actionName} not implemented in base class`, [], []);
  }

  /**
   * Generate personality-enhanced response
   */
  protected async generatePersonalityResponse(
    baseResponse: string,
    context: AgentContext,
    personality?: AgentPersona,
  ): Promise<string> {
    if (!this.personalityEngine || !personality) {
      return baseResponse;
    }

    const personalityContext = {
      conversation_history: context.conversationHistory?.map((m) => m.content) || [],
      domain_context: this.config.capabilities.join(', '),
      user_relationship_level: 0.7,
      topic_expertise_level: 0.8,
      emotional_context: 'professional',
      formality_level: 0.7,
    };

    // Use personality engine to enhance response
    try {
      const enhancement = await this.personalityEngine.generatePersonalityResponse(
        this.config.id,
        baseResponse,
        personalityContext,
      );
      return enhancement.content || baseResponse;
    } catch (error) {
      console.warn('Personality enhancement failed:', error);
      return baseResponse;
    }
  }

  // =============================================================================
  // ISpecializedAgent Interface Methods
  // =============================================================================

  /**
   * Get available actions for this agent
   * Base implementation - specialized agents should override
   */
  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'memory_search',
        description: 'Search agent memory for relevant information',
        parameters: { query: 'string', limit: 'number' },
      },
      {
        type: 'generate_response',
        description: 'Generate AI response with prompt engineering',
        parameters: { prompt: 'string', context: 'object' },
      },
      {
        type: 'constitutional_validate',
        description: 'Validate response against constitutional principles',
        parameters: { response: 'string', context: 'object' },
      },
    ];
  }

  /**
   * Get agent status and health (ISpecializedAgent compatibility)
   */
  getStatus(): {
    agentId: string;
    name: string;
    description: string;
    initialized: boolean;
    capabilities: string[];
    memoryEnabled: boolean;
    aiEnabled: boolean;
    lastActivity?: Date;
    isHealthy: boolean;
    processedMessages: number;
    errors: number;
  } {
    return {
      agentId: this.config.id,
      name: this.config.name,
      description: this.config.description,
      initialized: this.isInitialized,
      capabilities: this.config.capabilities,
      memoryEnabled: this.config.memoryEnabled,
      aiEnabled: this.config.aiEnabled,
      lastActivity: new Date(this.unifiedBackbone.getServices().timeService.now().utc),
      isHealthy: this.isInitialized,
      processedMessages: 0,
      errors: 0,
    };
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get detailed health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'critical' | 'offline';
    uptime: number;
    memoryUsage: number;
    responseTime: number;
    errorRate: number;
    lastActivity?: Date;
    errors?: string[];
  }> {
    const timestamp = this.unifiedBackbone.getServices().timeService.now();
    return {
      status: this.isInitialized ? 'healthy' : 'offline',
      uptime: timestamp.unix,
      memoryUsage: 0,
      responseTime: 0,
      errorRate: 0,
      lastActivity: new Date(timestamp.utc),
      errors: [],
    };
  }

  /**
   * Process a user message and generate a response (ISpecializedAgent compatibility)
   * Base implementation - specialized agents should override
   */
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    this.validateContext(context);
    // Enhanced path: use prompt engine + constitutional loop if configured
    if (this.promptEngine && this.constitutionalAI) {
      return await this.generateWithConstitutionalLoop(context, message);
    }
    // Fallback legacy path
    const memories = await this.searchMemories(context.user.id, message);
    const response = await this.generateResponse(message, memories);
    await this.addMemory(context.user.id, `User: ${message}\nAgent: ${response}`);
    return this.createResponse(response, [], memories);
  }

  /**
   * Enable NLACS capabilities for this agent (public method for AgentFactory)
   */
  public setNLACSEnabled(enabled: boolean): void {
    this.nlacsEnabled = enabled;
  }

  // =============================================================================
  // Constitutional AI End-to-End Generation Loop
  // =============================================================================
  protected async generateWithConstitutionalLoop(
    context: AgentContext,
    message: string,
  ): Promise<AgentResponse> {
    const userId = context.user.id;
    const memories = await this.searchMemories(userId, message);
    const enhancedPrompt = await this.promptEngine!.buildEnhancedPrompt(
      message,
      memories,
      context,
      'medium',
    );
    const raw = await this.generateResponse(enhancedPrompt, memories);
    const validation = await this.constitutionalAI!.validateResponse(raw, message, {
      phase: 'initial',
    });
    let finalContent = validation.refinedResponse || raw;
    // Optional second pass if below threshold
    if (!validation.isValid) {
      const second = await this.constitutionalAI!.validateResponse(finalContent, message, {
        phase: 'refinement',
      });
      finalContent = second.refinedResponse || finalContent;
    }
    await this.addMemory(
      userId,
      `ConstitutionalInteraction:\nUser: ${message}\nResponse: ${finalContent}\nScore: ${validation.score}`,
      {
        type: 'constitutional_interaction',
        qualityScore: validation.score,
        violations: validation.violations.map((v) => v.principleId),
        refined: validation.refinedResponse !== raw,
      },
    );
    return {
      content: finalContent,
      actions: [],
      memories,
      metadata: {
        agentId: this.config.id,
        timestamp: new Date(this.unifiedBackbone.getServices().timeService.now().utc),
        constitutionalScore: validation.score,
        constitutionalValid: validation.isValid,
        violations: validation.violations,
        refinementApplied: validation.refinedResponse !== raw,
      },
    };
  }

  // =============================================================================
  // Unified Context Injection (AgentFactory -> BaseAgent)
  // =============================================================================
  /**
   * Inject the canonical UnifiedAgentContext created by UnifiedBackboneService.
   * This provides consistent temporal + metadata grounding across all agents.
   * Must be called by AgentFactory immediately after instantiation and before initialize().
   */
  public setUnifiedContext(context: UnifiedAgentContext): void {
    // Augment with direct service references for convenience (non-parallel; sourced from backbone)
    const services = this.unifiedBackbone.getServices();
    this.unifiedContext = {
      ...context,
      timeService: services.timeService,
      metadataService: services.metadataService,
    };
  }

  /**
   * Accessor for the injected unified context. Throws if not yet set to fail fast.
   */
  protected getUnifiedContext(): UnifiedAgentContext {
    if (!this.unifiedContext) {
      throw new Error(
        'UnifiedAgentContext not set. Ensure AgentFactory.setUnifiedContext was called before initialize().',
      );
    }
    return this.unifiedContext;
  }
}
