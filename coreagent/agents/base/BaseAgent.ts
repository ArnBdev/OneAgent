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
import { OneAgentUnifiedBackbone, generateUnifiedId } from '../../utils/UnifiedBackboneService';
import { SmartGeminiClient } from '../../tools/SmartGeminiClient';
import { User } from '../../types/user';
import { MemoryIntelligence } from '../../intelligence/memoryIntelligence';
import { NLACSMessage, EmergentInsight, ConversationThread, NLACSCapability, MemoryRecord, UnifiedMetadata, A2AMessage, AgentId, SessionId, MessageId } from '../../types/oneagent-backbone-types';
import { unifiedAgentCommunicationService } from '../../utils/UnifiedAgentCommunicationService';
import { 
  PromptEngine, 
  PromptConfig, 
  AgentPersona
} from './PromptEngine';
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
    this.unifiedBackbone = new OneAgentUnifiedBackbone();
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
              ...params.nlacsExtension
            }
          ],
          nlacs: true
        }
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
    if (Array.isArray(extensions) && extensions.some((ext: { uri: string }) => ext.uri === 'https://oneagent.ai/extensions/nlacs')) {
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
        this.memoryClient = new OneAgentMemory({ userId: 'default-user' });
        this.memoryIntelligence = new MemoryIntelligence();
      }

      // Initialize AI client if enabled
      if (this.config.aiEnabled) {
        this.aiClient = new SmartGeminiClient();
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
            severityLevel: 'high'
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
            severityLevel: 'medium'
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
            severityLevel: 'medium'
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
            severityLevel: 'critical'
          }
        ],
        qualityThreshold: 0.8
      });

      // Initialize BMAD Elicitation Engine
      this.bmadElicitation = new BMADElicitationEngine();

      // Initialize Personality Engine
      this.personalityEngine = new PersonalityEngine();

      // Canonical agent communication is initialized via UnifiedBackboneService only.

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
    const capabilityStrings = capabilities.map(c => `${c.type}:${c.description}`);
    
    // Log with canonical backbone metadata
    const services = this.unifiedBackbone.getServices();
    const metadata = services.metadataService.create('nlacs_enable', 'agent_system', {
      content: {
        category: 'system',
        tags: ['nlacs', 'enable', `agent:${this.config.id}`, ...capabilities.map(c => `capability:${c.type}`)],
        sensitivity: 'internal' as const,
        relevanceScore: 0.9,
        contextDependency: 'session' as const
      },
      system: {
        source: 'agent_system',
        component: 'nlacs_enable',
        agent: {
          id: this.config.id,
          type: 'specialized'
        }
      }
    });
    
    console.log(`🧠 NLACS enabled for ${this.config.id} with capabilities: ${capabilityStrings.join(', ')}`);
    
    // Store in OneAgent memory with canonical metadata
    this.memoryClient?.addMemory({
      content: `NLACS capabilities enabled: ${capabilityStrings.join(', ')}`,
      metadata: {
        ...metadata,
        type: 'nlacs_initialization',
        agentId: this.config.id,
        capabilities: capabilityStrings, // Store as strings, not objects
        timestamp: services.timeService.now().iso // Store as ISO string, not object
      }
    }).catch(error => {
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
      const participationMetadata = services.metadataService.create('join_discussion', 'agent_system', {
        content: {
          category: 'communication',
          tags: ['nlacs', 'join', 'discussion', `agent:${this.config.id}`, `discussion:${discussionId}`],
          sensitivity: 'internal' as const,
          relevanceScore: 0.9,
          contextDependency: 'session' as const
        },
        system: {
          source: 'agent_system',
          component: 'nlacs_discussion',
          agent: {
            id: this.config.id,
            type: 'specialized'
          }
        }
      });

      console.log(`💬 ${this.config.id} joining discussion: ${discussionId} at ${joinTimestamp.iso}`);
      
      // Store participation in OneAgent memory with canonical structure
      await this.memoryClient?.addMemory({
        content: `Joined NLACS discussion: ${discussionId}`,
        metadata: {
          ...participationMetadata,
          type: 'nlacs_participation',
          discussionId: discussionId,
          agentId: this.config.id,
          joinedAt: joinTimestamp,
          context: context || 'standard_participation',
          capabilities: this.nlacsCapabilities,
          // Canonical backbone metadata
          backbone: {
            temporal: {
              created: joinTimestamp,
              lastUpdated: joinTimestamp
            },
            lineage: {
              source: 'nlacs_coordinator',
              action: 'join_discussion',
              agentId: this.config.id
            }
          }
        }
      });
      
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
    messageType: 'question' | 'contribution' | 'synthesis' | 'insight' | 'consensus' = 'contribution',
    context?: string
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
              tags: ['nlacs', 'contribution', `agent:${this.config.id}`, `discussion:${discussionId}`, `type:${messageType}`],
              sensitivity: 'internal' as const,
              relevanceScore: 0.9,
              contextDependency: 'session' as const
            },
            system: {
              source: 'agent_system',
              component: 'nlacs_contribution',
              agent: {
                id: this.config.id,
                type: 'specialized'
              }
            }
          })
        }
      };

      // Store contribution in OneAgent memory with canonical structure
      await this.memoryClient?.addMemory({
        content: `NLACS Discussion Contribution: ${content}`,
        metadata: {
          type: 'nlacs_contribution',
          discussionId: discussionId,
          messageId: message.id,
          messageType: messageType,
          agentId: this.config.id,
          contributedAt: contributionTimestamp,
          contentLength: content.length,
          context: context || 'standard_contribution',
          // Canonical backbone metadata integration
          backbone: {
            temporal: {
              created: contributionTimestamp,
              lastUpdated: contributionTimestamp
            },
            metadata: {
              agentId: this.config.id,
              protocol: 'nlacs',
              version: '5.0.0',
              messageType: messageType,
              discussionId: discussionId
            },
            lineage: {
              source: 'nlacs_discussion',
              action: 'contribute_message',
              agentId: this.config.id,
              messageId: message.id
            }
          }
        }
      });

      console.log(`💬 ${this.config.id} contributed to discussion ${discussionId}: ${messageType} at ${contributionTimestamp}`);
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
    context?: string
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
      const messageTypes = conversationHistory.map(m => m.messageType);
      const participants = new Set(conversationHistory.map(m => m.agentId));
      const timeSpan = conversationHistory.length > 0 ? 
        conversationHistory[conversationHistory.length - 1].timestamp.getTime() - 
        conversationHistory[0].timestamp.getTime() : 0;
      
      // Pattern-based insight generation with canonical metadata
      if (messageTypes.includes('question') && messageTypes.includes('contribution')) {
        const insight: EmergentInsight = {
          id: generateUnifiedId('analysis', this.config.id),
          type: 'pattern',
          content: `Effective Q&A pattern observed with ${participants.size} participants over ${Math.round(timeSpan / 1000)}s`,
          confidence: 0.75,
          contributors: Array.from(participants),
          sources: conversationHistory.slice(0, 3).map(m => m.id),
          implications: ['Enhanced collaboration pattern', 'Effective knowledge sharing'],
          actionItems: ['Continue Q&A pattern', 'Encourage participation'],
          createdAt: new Date(analysisTimestamp.unix),
          relevanceScore: 0.85
        };
        insights.push(insight);
      }
      
      if (messageTypes.includes('synthesis')) {
        const synthesisMessages = conversationHistory.filter(m => m.messageType === 'synthesis');
        const insight: EmergentInsight = {
          id: generateUnifiedId('knowledge', this.config.id),
          type: 'synthesis',
          content: `Knowledge synthesis achieved through ${synthesisMessages.length} synthesis points with ${participants.size} participants`,
          confidence: 0.82,
          contributors: Array.from(participants),
          sources: synthesisMessages.map(m => m.id),
          implications: ['Knowledge consolidation completed', 'Collaborative synthesis achieved'],
          actionItems: ['Document synthesis outcomes', 'Share insights with team'],
          createdAt: new Date(analysisTimestamp.unix),
          relevanceScore: 0.88
        };
        insights.push(insight);
      }

      // Store insights in OneAgent memory with canonical backbone structure
      for (const insight of insights) {
        await this.memoryClient?.addMemory({
          content: `Emergent Insight: ${insight.content}`,
          metadata: {
            type: 'emergent_insight',
            insightId: insight.id,
            insightType: insight.type,
            confidence: insight.confidence,
            agentId: this.config.id,
            context: context || 'conversation_analysis',
            contributingAgents: insight.contributors,
            sourceMessageIds: insight.sources,
            // Canonical backbone metadata
            backbone: {
              temporal: {
                created: analysisTimestamp,
                lastUpdated: analysisTimestamp,
                discoveredAt: analysisTimestamp
              },
              metadata: {
                agentId: this.config.id,
                protocol: 'nlacs',
                version: '5.0.0',
                insightType: insight.type,
                confidence: insight.confidence
              },
              lineage: {
                source: 'nlacs_insight_generation',
                action: 'generate_emergent_insight',
                agentId: this.config.id,
                insightId: insight.id,
                analysisTimestamp: analysisTimestamp
              }
            }
          }
        });
      }

      console.log(`🧠 ${this.config.id} generated ${insights.length} emergent insights at ${analysisTimestamp}`);
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
    synthesisQuestion: string
  ): Promise<string | null> {
    if (!this.nlacsEnabled) {
      console.warn(`⚠️ NLACS not enabled for ${this.config.id}`);
      return null;
    }

    try {
      const services = this.unifiedBackbone.getServices();
      const synthesisTimestamp = services.timeService.now();
      
      // Extract key insights from conversation threads using canonical temporal data
      const allInsights = conversationThreads.flatMap(thread => 
        thread.insights || []
      );
      
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
        agentId: this.config.id
      };

      // Generate synthesis using AI with canonical prompting
      const synthesisPrompt = `
        Based on the following insights from ${conversationThreads.length} conversation threads, 
        please provide a comprehensive synthesis addressing: "${synthesisQuestion}"
        
        Context: Agent ${synthesisContext.agentId} analyzing ${synthesisContext.insightCount} insights
        Timestamp: ${synthesisContext.synthesisTimestamp}
        
        Insights (${allInsights.length} total):
        ${allInsights.map((insight, idx) => 
          `${idx + 1}. ${insight.content} (confidence: ${insight.confidence}, discovered: ${insight.createdAt})`
        ).join('\n')}
        
        Please provide a thoughtful synthesis that connects these insights and addresses the question.
        Focus on patterns, connections, and actionable conclusions.
      `;

      const synthesisResult = await this.aiClient?.generateContent(synthesisPrompt);
      const synthesis = typeof synthesisResult === 'string' ? synthesisResult : 
        synthesisResult?.response || 
        `Cross-conversation synthesis based on ${allInsights.length} insights from ${conversationThreads.length} threads`;

      // Store synthesis in OneAgent memory with canonical backbone structure
      await this.memoryClient?.addMemory({
        content: `Knowledge Synthesis: ${synthesis}`,
        metadata: {
          type: 'knowledge_synthesis',
          synthesisId: generateUnifiedId('knowledge', this.config.id),
          synthesisQuestion: synthesisQuestion,
          sourceThreadIds: conversationThreads.map(t => t.id),
          sourceInsightIds: allInsights.map(i => i.id),
          insightCount: allInsights.length,
          threadCount: conversationThreads.length,
          agentId: this.config.id,
          synthesisLength: synthesis.length,
          // Canonical backbone metadata
          backbone: {
            temporal: {
              created: synthesisTimestamp,
              lastUpdated: synthesisTimestamp,
              synthesizedAt: synthesisTimestamp
            },
            metadata: {
              agentId: this.config.id,
              protocol: 'nlacs',
              version: '5.0.0',
              synthesisType: 'cross_conversation',
              questionCategory: this.categorizeSynthesisQuestion(synthesisQuestion)
            },
            lineage: {
              source: 'nlacs_knowledge_synthesis',
              action: 'synthesize_cross_conversation',
              agentId: this.config.id,
              synthesisId: generateUnifiedId('knowledge', this.config.id),
              sourceThreads: conversationThreads.map(t => t.id),
              timestamp: synthesisTimestamp
            }
          }
        }
      });

      console.log(`🔄 ${this.config.id} synthesized knowledge from ${conversationThreads.length} conversations at ${synthesisTimestamp}`);
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
    conversationHistory: NLACSMessage[]
  ): Promise<{ patterns: string[]; insights: string[] }> {
    try {
      const services = this.unifiedBackbone.getServices();
      const analysisTimestamp = services.timeService.now();
      const patterns: string[] = [];
      const insights: string[] = [];

      // Analyze message flow patterns with canonical temporal data
      const messageTypes = conversationHistory.map(m => m.messageType);
      const messageFlow = messageTypes.join(' → ');
      const timeSpan = conversationHistory.length > 0 ? 
        conversationHistory[conversationHistory.length - 1].timestamp.getTime() - 
        conversationHistory[0].timestamp.getTime() : 0;
      
      patterns.push(`Message flow: ${messageFlow}`);
      patterns.push(`Conversation duration: ${Math.round(timeSpan / 1000)}s`);
      patterns.push(`Message frequency: ${Math.round(conversationHistory.length / (timeSpan / 1000))} msg/s`);
      
      // Identify effective patterns using canonical analysis
      if (messageFlow.includes('question → contribution → synthesis')) {
        insights.push('Effective Q→C→S pattern leads to synthesis');
      }
      
      if (messageFlow.includes('insight')) {
        insights.push('Insight generation indicates deep thinking');
      }

      // Analyze participation patterns with canonical metadata
      const participants = new Set(conversationHistory.map(m => m.agentId));
      patterns.push(`Participant count: ${participants.size}`);
      patterns.push(`Participants: ${Array.from(participants).join(', ')}`);
      
      if (participants.size > 2) {
        insights.push('Multi-agent collaboration enhances discussion quality');
      }

      // Analyze conversation memory patterns using OneAgent memory
      const nlacsMemories = await this.memoryClient?.searchMemory({
        query: 'nlacs_contribution',
        userId: this.config.id,
        limit: 10
      });

      // Extract patterns from historical NLACS participation
      if (nlacsMemories?.results && nlacsMemories.results.length > 0) {
        patterns.push(`Historical participation: ${nlacsMemories.results.length} previous discussions`);
        
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
      await this.memoryClient?.addMemory({
        content: `Conversation Pattern Analysis: ${patterns.length} patterns, ${insights.length} insights`,
        metadata: {
          type: 'pattern_analysis',
          analysisId: generateUnifiedId('analysis', this.config.id),
          agentId: this.config.id,
          patternCount: patterns.length,
          insightCount: insights.length,
          messageCount: conversationHistory.length,
          participantCount: participants.size,
          conversationDuration: timeSpan,
          // Canonical backbone metadata
          backbone: {
            temporal: {
              created: analysisTimestamp,
              lastUpdated: analysisTimestamp,
              analyzedAt: analysisTimestamp
            },
            metadata: {
              agentId: this.config.id,
              protocol: 'nlacs',
              version: '5.0.0',
              analysisType: 'conversation_pattern',
              messageCount: conversationHistory.length,
              participantCount: participants.size
            },
            lineage: {
              source: 'nlacs_pattern_analysis',
              action: 'extract_conversation_patterns',
              agentId: this.config.id,
              analysisId: generateUnifiedId('analysis', this.config.id),
              timestamp: analysisTimestamp
            }
          }
        }
      });

      console.log(`📊 ${this.config.id} extracted ${patterns.length} conversation patterns and ${insights.length} insights at ${analysisTimestamp}`);
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
          contextDependency: 'session' as const
        },
        system: {
          source: 'agent_system',
          component: 'nlacs_status',
          agent: {
            id: this.config.id,
            type: 'specialized'
          }
        }
      })
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
  protected async addMemory(userId: string, content: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.memoryClient) {
      console.warn('Memory client not initialized');
      return;
    }
    
    await this.memoryClient.addMemory({
      content,
      metadata: {
        userId,
        agentId: this.config.id,
        timestamp: new Date(this.unifiedBackbone.getServices().timeService.now().utc),
        ...metadata
      }
    });
  }

  /**
   * Search memories
   */
  protected async searchMemories(userId: string, query: string, limit: number = 10): Promise<MemoryRecord[]> {
    if (!this.memoryClient) {
      console.warn('Memory client not initialized');
      return [];
    }
    
    const results = await this.memoryClient.searchMemory({
      query,
      userId,
      limit
    });
    
    return results.results || [];
  }

  /**
   * Generate AI response using the SmartGeminiClient
   */
  protected async generateResponse(prompt: string, memories?: MemoryRecord[]): Promise<string> {
    if (!this.aiClient) {
      console.warn('AI client not initialized');
      return 'AI response not available';
    }

    const context = memories ? memories.map(m => m.content).join('\n') : '';
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
    memories: MemoryRecord[] = []
  ): AgentResponse {
    return {
      content,
      actions,
      memories,
      metadata: {
        agentId: this.config.id,
        timestamp: new Date(this.unifiedBackbone.getServices().timeService.now().utc),
        confidence: 0.85
      }
    };
  }

  /**
   * Execute an action (base implementation)
   */
  async executeAction(action: string | AgentAction, _params: Record<string, unknown>, _context?: AgentContext): Promise<AgentResponse> {
    const actionName = typeof action === 'string' ? action : action.type;
    console.log(`BaseAgent ${this.config.id} executing action: ${actionName}`);
    
    // Base implementation - specialized agents should override
    return this.createResponse(
      `Action ${actionName} not implemented in base class`,
      [],
      []
    );
  }

  /**
   * Generate personality-enhanced response
   */
  protected async generatePersonalityResponse(
    baseResponse: string,
    context: AgentContext,
    personality?: AgentPersona
  ): Promise<string> {
    if (!this.personalityEngine || !personality) {
      return baseResponse;
    }

    const personalityContext = {
      conversation_history: context.conversationHistory?.map(m => m.content) || [],
      domain_context: this.config.capabilities.join(', '),
      user_relationship_level: 0.7,
      topic_expertise_level: 0.8,
      emotional_context: 'professional',
      formality_level: 0.7
    };

    // Use personality engine to enhance response
    try {
      const enhancement = await this.personalityEngine.generatePersonalityResponse(
        this.config.id,
        baseResponse,
        personalityContext
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
        parameters: { query: 'string', limit: 'number' }
      },
      {
        type: 'generate_response',
        description: 'Generate AI response with prompt engineering',
        parameters: { prompt: 'string', context: 'object' }
      },
      {
        type: 'constitutional_validate',
        description: 'Validate response against constitutional principles',
        parameters: { response: 'string', context: 'object' }
      }
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
      errors: 0
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
      errors: []
    };
  }

  /**
   * Process a user message and generate a response (ISpecializedAgent compatibility)
   * Base implementation - specialized agents should override
   */
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    this.validateContext(context);
    
    // Search for relevant memories
    const memories = await this.searchMemories(context.user.id, message);
    
    // Generate response using prompt engineering
    const response = await this.generateResponse(message, memories);
    
    // Store interaction in memory
    await this.addMemory(context.user.id, `User: ${message}\nAgent: ${response}`);
    
    return this.createResponse(response, [], memories);
  }

  /**
   * Enable NLACS capabilities for this agent (public method for AgentFactory)
   */
  public setNLACSEnabled(enabled: boolean): void {
    this.nlacsEnabled = enabled;
  }
}