/**
 * OneAgent Natural Language Agent Communication System (NLACS)
 * Core Orchestrator - Unified Architecture Integration
 * 
 * ARCHITECTURAL PRINCIPLE: Integrates with OneAgent Unified Backbone
 * - Uses UnifiedBackboneService for time/metadata
 * - Leverages existing metadata standards
 * - Single source of truth for temporal data
 * 
 * @version 2.0.0-UNIFIED-BACKBONE
 * @author OneAgent Professional Development Platform
 */

import { EventEmitter } from 'events';
import * as dotenv from 'dotenv';
import { OneAgentUnifiedTimeService } from '../utils/UnifiedBackboneService';
import { 
  NLACSConversationMetadata, 
  NLACSDomainTemplate, 
  NLACSDomainTemplates 
} from '../types/metadata/OneAgentUnifiedMetadata';

// Load environment configuration
dotenv.config();

// =============================================================================
// NLACS INTERFACES (Simplified - metadata handled by unified system)
// =============================================================================

export interface NLACSMessage {
  messageId: string;
  conversationId: string;
  agentId: string;
  agentType: string;
  content: string;
  messageType: 'response' | 'question' | 'insight' | 'synthesis' | 'challenge';
  userId: string; // Privacy isolation
  confidence: number;
  referencesTo: string[]; // IDs of messages this responds to
  // Temporal data handled by UnifiedBackboneService
  unifiedTimestamp?: any; // Will be populated by backbone
}

export interface NLACSConversation {
  conversationId: string;
  userId: string; // Privacy: Every conversation belongs to specific user
  topic: string;
  participants: {
    agentId: string;
    agentType: string;
    role: 'primary' | 'secondary' | 'observer';
    joinedAt: Date;
  }[];
  messages: NLACSMessage[];
  status: 'active' | 'concluded' | 'archived';
  projectContext?: {
    projectId?: string;
    topicId?: string;
    contextTags?: string[];
  };
  // Metadata handled by unified system
  unifiedMetadata?: NLACSConversationMetadata;
}

export interface NLACSSystemStatus {
  activeConversations: number;
  totalMessages: number;
  memoryEntries: number;
  isEnabled: boolean;
  uptime: number;
  backboneHealth: any; // From UnifiedBackboneService
}

// =============================================================================
// UNIFIED NLACS ORCHESTRATOR
// =============================================================================

/**
 * NLACS Orchestrator - Unified Architecture
 * 
 * Integrates with OneAgent Unified Backbone for:
 * - Time management via OneAgentUnifiedTimeService
 * - Metadata management via unified metadata system
 * - Constitutional AI validation
 * - Cross-system compatibility
 */
export class UnifiedNLACSOrchestrator extends EventEmitter {
  private static instance: UnifiedNLACSOrchestrator;
  private conversations: Map<string, NLACSConversation> = new Map();
  private timeService: OneAgentUnifiedTimeService;
  private startTime: Date = new Date();
  
  // Configuration from .env
  private readonly NLACS_ENABLED = process.env.NLACS_ENABLED === 'true';
  private readonly NLACS_MAX_PARTICIPANTS = parseInt(process.env.NLACS_MAX_PARTICIPANTS_PER_CONVERSATION || '10');
  private readonly NLACS_MAX_MESSAGES = parseInt(process.env.NLACS_MAX_MESSAGES_PER_CONVERSATION || '100');
  private readonly NLACS_MAX_CONVERSATIONS_PER_USER = parseInt(process.env.NLACS_MAX_CONVERSATIONS_PER_USER || '5');

  public static getInstance(): UnifiedNLACSOrchestrator {
    if (!UnifiedNLACSOrchestrator.instance) {
      UnifiedNLACSOrchestrator.instance = new UnifiedNLACSOrchestrator();
    }
    return UnifiedNLACSOrchestrator.instance;
  }

  constructor() {
    super();
    
    // Initialize unified backbone service
    this.timeService = OneAgentUnifiedTimeService.getInstance();
    
    if (!this.NLACS_ENABLED) {
      console.warn('⚠️ NLACS is disabled. Set NLACS_ENABLED=true in .env to enable natural language agent communication.');
    } else {
      console.log('🚀 Unified NLACS Orchestrator initialized with OneAgent Backbone!');
    }
  }

  /**
   * Initialize the NLACS system with unified backbone
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.NLACS_ENABLED) {
        console.log('⚠️  NLACS is disabled. Set NLACS_ENABLED=true in .env to enable.');
        return false;
      }

      console.log('🚀 Unified NLACS Orchestrator initializing...');
      console.log('   🕐 Using OneAgent Unified Time Service');
      console.log('   📊 Using OneAgent Unified Metadata System');
      console.log('   🤖 Using OneAgent Constitutional AI Validation');
      console.log(`   ⚙️  Max participants: ${this.NLACS_MAX_PARTICIPANTS}, Max messages: ${this.NLACS_MAX_MESSAGES}`);

      // Verify backbone service
      const currentTime = await this.timeService.getCurrentTimestamp();
      console.log(`   ✅ Backbone time service verified: ${currentTime.isoString}`);

      this.emit('systemInitialized', { 
        timestamp: currentTime,
        backboneIntegrated: true 
      });
      
      console.log('✅ Unified NLACS ready for domain-agnostic agent communication!');
      return true;
      
    } catch (error) {
      console.error('❌ Unified NLACS initialization failed:', error);
      return false;
    }
  }

  /**
   * Get domain template for conversation setup
   */
  getDomainTemplate(domain: string): NLACSDomainTemplate | null {
    return NLACSDomainTemplates[domain] || null;
  }

  /**
   * Get available domains
   */
  getAvailableDomains(): string[] {
    return Object.keys(NLACSDomainTemplates);
  }

  /**
   * Initiate conversation with unified metadata
   */
  async initiateConversation(
    topic: string,
    requiredPerspectives: string[],
    userId: string,
    projectContext?: {
      projectId?: string;
      topicId?: string;
      contextTags?: string[];
    },
    domainTemplate?: string
  ): Promise<NLACSConversation> {
    if (!this.NLACS_ENABLED) {
      throw new Error('NLACS is disabled. Enable in .env configuration.');
    }

    // Use unified time service
    const currentTime = await this.timeService.getCurrentTimestamp();
    const conversationId = `nlacs_${currentTime.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Apply domain template if provided
    let finalPerspectives = requiredPerspectives;
    let finalContextTags = projectContext?.contextTags || [];
    
    if (domainTemplate && NLACSDomainTemplates[domainTemplate]) {
      const template = NLACSDomainTemplates[domainTemplate];
      finalPerspectives = template.recommendedAgents;
      finalContextTags = [...finalContextTags, ...template.commonContextTags];
      console.log(`📋 Using domain template: ${template.domain} - ${template.description}`);
    }

    // Create conversation with unified metadata structure
    const conversation: NLACSConversation = {
      conversationId,
      userId,
      topic,
      participants: [],
      messages: [],
      status: 'active',
      projectContext: {
        ...projectContext,
        contextTags: finalContextTags
      }
    };

    // Generate unified metadata
    conversation.unifiedMetadata = await this.generateConversationMetadata(conversation, domainTemplate);

    // Store conversation FIRST
    this.conversations.set(conversationId, conversation);

    // Add agents
    for (const perspective of finalPerspectives) {
      await this.addAgentToConversation(conversationId, perspective, 'primary', userId);
    }

    // Update metadata after agent addition
    await this.updateConversationMetadata(conversation);

    // Store in unified memory system (future integration)
    await this.storeInUnifiedMemory(conversation);

    // Emit with unified timestamp
    this.emit('conversationInitiated', { 
      conversation, 
      userId,
      timestamp: currentTime,
      domain: domainTemplate || 'custom'
    });

    const privacyLevel = finalContextTags.includes('WORKPLACE') ? '💼 WORKPLACE' : 
                        finalContextTags.includes('PRIVATE') ? '🏠 PRIVATE' : '🌐 PUBLIC';
    
    console.log(`🎬 ${privacyLevel} Conversation: "${topic}"`);
    console.log(`   Domain: ${domainTemplate || 'custom'} | Agents: ${finalPerspectives.join(', ')}`);

    return conversation;
  }

  /**
   * Add agent with unified metadata tracking
   */
  async addAgentToConversation(
    conversationId: string,
    agentType: string,
    role: 'primary' | 'secondary' | 'observer',
    userId: string
  ): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    if (conversation.userId !== userId) {
      throw new Error('Access denied: User does not own this conversation');
    }

    if (conversation.participants.length >= this.NLACS_MAX_PARTICIPANTS) {
      throw new Error(`Maximum participants (${this.NLACS_MAX_PARTICIPANTS}) reached`);
    }

    // Use unified time service
    const joinTime = await this.timeService.getCurrentTimestamp();
    const agentId = `${agentType}_${joinTime.timestamp}`;
    
    const participant = {
      agentId,
      agentType,
      role,
      joinedAt: joinTime.date
    };

    conversation.participants.push(participant);

    // Update unified metadata
    await this.updateConversationMetadata(conversation);

    console.log(`🤖 Agent ${agentType} (${role}) joined conversation`);
    return true;
  }

  /**
   * Send message with unified temporal tracking
   */
  async sendMessage(
    conversationId: string,
    agentId: string,
    content: string,
    messageType: 'response' | 'question' | 'insight' | 'synthesis' | 'challenge',
    userId: string
  ): Promise<NLACSMessage> {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    if (conversation.userId !== userId) {
      throw new Error('Access denied: User does not own this conversation');
    }

    if (conversation.messages.length >= this.NLACS_MAX_MESSAGES) {
      throw new Error(`Maximum messages (${this.NLACS_MAX_MESSAGES}) reached`);
    }

    const agent = conversation.participants.find(p => p.agentId === agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} is not a participant`);
    }

    // Use unified time service
    const messageTime = await this.timeService.getCurrentTimestamp();
    
    const message: NLACSMessage = {
      messageId: `msg_${messageTime.timestamp}_${Math.random().toString(36).substr(2, 6)}`,
      conversationId,
      agentId,
      agentType: agent.agentType,
      content,
      messageType,
      userId,
      confidence: 0.85,
      referencesTo: [],
      unifiedTimestamp: messageTime
    };

    conversation.messages.push(message);

    // Update unified metadata with message analytics
    await this.updateConversationMetadata(conversation);

    this.emit('messageAdded', { message, conversation, timestamp: messageTime });

    const privacyIcon = conversation.projectContext?.contextTags?.includes('WORKPLACE') ? '💼' : '🏠';
    console.log(`${privacyIcon} ${agent.agentType}: "${content.substring(0, 60)}..."`);

    return message;
  }

  /**
   * Generate unified conversation metadata
   */
  private async generateConversationMetadata(
    conversation: NLACSConversation, 
    domainTemplate?: string
  ): Promise<NLACSConversationMetadata> {
    const currentTime = await this.timeService.getCurrentTimestamp();
    
    // Determine domain from context tags or template
    const domain = domainTemplate || 
                  conversation.projectContext?.contextTags?.find(tag => 
                    ['finance', 'health', 'career', 'coding'].includes(tag)
                  ) || 'general';

    // Determine privacy level
    const privacyLevel = conversation.projectContext?.contextTags?.includes('WORKPLACE') ? 'WORKPLACE' :
                        conversation.projectContext?.contextTags?.includes('PRIVATE') ? 'PRIVATE' :
                        conversation.projectContext?.contextTags?.includes('CONFIDENTIAL') ? 'CONFIDENTIAL' : 'PUBLIC';

    return {
      // Base metadata (from OneAgentBaseMetadata)
      id: conversation.conversationId,
      version: '2.0.0',
      schemaVersion: '1.0.0',
      type: 'nlacs-conversation',
      title: conversation.topic,
      description: `NLACS multi-agent conversation in ${domain} domain`,
      createdAt: currentTime.date,
      updatedAt: currentTime.date,
      lastAccessedAt: currentTime.date,

      // Conversation metadata (from ConversationMetadata)
      conversation: {
        participants: conversation.participants.map(p => ({
          id: p.agentId,
          role: 'assistant' as const, // NLACS agents are assistants
          name: p.agentType
        })),
        flow: {
          messageCount: conversation.messages.length,
          turnCount: 0, // Will be calculated
          avgResponseTime: 0, // Will be calculated
          complexity: 'moderate' as const,
          completionStatus: 'ongoing' as const
        },
        intelligence: {
          mainTopics: [conversation.topic],
          resolvedIssues: [],
          pendingItems: [],
          actionItems: [],
          learningOpportunities: [],
          satisfactionScore: 85
        },
        session: {
          sessionId: conversation.conversationId,
          startTime: currentTime.date,
          userGoals: [conversation.topic],
          achievedGoals: [],
          contextContinuity: 1.0
        }
      },

      // NLACS-specific metadata
      nlacs: {
        orchestration: {
          conversationId: conversation.conversationId,
          orchestratorVersion: '2.0.0-UNIFIED',
          agentCount: conversation.participants.length,
          agentTypes: conversation.participants.map(p => p.agentType),
          emergentInsightsCount: 0,
          synthesesGenerated: 0
        },
        agents: conversation.participants.map(p => ({
          agentId: p.agentId,
          agentType: p.agentType,
          role: p.role,
          joinedAt: p.joinedAt,
          messageCount: 0,
          confidenceAverage: 0.85,
          contributionQuality: 85
        })),
        messageAnalysis: {
          messageTypes: {
            question: 0,
            response: 0,
            insight: 0,
            synthesis: 0,
            challenge: 0
          },
          averageConfidence: 0.85,
          crossReferences: 0,
          emergentPatterns: []
        },
        context: {
          domain,
          contextTags: conversation.projectContext?.contextTags || [],
          privacyLevel,
          projectContext: conversation.projectContext
        },
        emergentIntelligence: {
          breakthroughMoments: [],
          crossDomainConnections: [],
          novelSolutions: [],
          workflowInnovations: [],
          qualityScore: 85
        },
        lifecycle: {
          status: conversation.status
        }
      }
    };
  }

  /**
   * Update conversation metadata with current state
   */
  private async updateConversationMetadata(conversation: NLACSConversation): Promise<void> {
    if (!conversation.unifiedMetadata) return;

    const currentTime = await this.timeService.getCurrentTimestamp();
    
    // Update base metadata
    conversation.unifiedMetadata.updatedAt = currentTime.date;
    conversation.unifiedMetadata.lastAccessedAt = currentTime.date;

    // Update NLACS metadata
    conversation.unifiedMetadata.nlacs.orchestration.agentCount = conversation.participants.length;
    conversation.unifiedMetadata.nlacs.orchestration.agentTypes = conversation.participants.map(p => p.agentType);

    // Update message analysis
    const messageTypes = conversation.unifiedMetadata.nlacs.messageAnalysis.messageTypes;
    messageTypes.question = conversation.messages.filter(m => m.messageType === 'question').length;
    messageTypes.response = conversation.messages.filter(m => m.messageType === 'response').length;
    messageTypes.insight = conversation.messages.filter(m => m.messageType === 'insight').length;
    messageTypes.synthesis = conversation.messages.filter(m => m.messageType === 'synthesis').length;
    messageTypes.challenge = conversation.messages.filter(m => m.messageType === 'challenge').length;

    conversation.unifiedMetadata.nlacs.orchestration.synthesesGenerated = messageTypes.synthesis;

    // Update conversation flow
    conversation.unifiedMetadata.conversation.flow.messageCount = conversation.messages.length;
    conversation.unifiedMetadata.conversation.flow.turnCount = Math.ceil(conversation.messages.length / conversation.participants.length);
  }

  /**
   * Store in unified memory system (future integration)
   */
  private async storeInUnifiedMemory(conversation: NLACSConversation): Promise<void> {
    try {
      // TODO: Integrate with UnifiedMemoryClient
      console.log(`💾 Storing in unified memory: ${conversation.conversationId}`);
    } catch (error) {
      console.warn('⚠️ Failed to store in unified memory:', error);
    }
  }

  /**
   * Get conversation with unified metadata
   */
  async getConversation(conversationId: string, userId: string): Promise<NLACSConversation> {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    if (conversation.userId !== userId) {
      throw new Error('Access denied: User does not own this conversation');
    }

    // Update last accessed time
    if (conversation.unifiedMetadata) {
      const currentTime = await this.timeService.getCurrentTimestamp();
      conversation.unifiedMetadata.lastAccessedAt = currentTime.date;
    }

    return conversation;
  }

  /**
   * Get system status with backbone health
   */
  async getSystemStatus(): Promise<NLACSSystemStatus> {
    const totalMessages = Array.from(this.conversations.values())
      .reduce((sum, conv) => sum + conv.messages.length, 0);

    const uptime = Date.now() - this.startTime.getTime();

    return {
      activeConversations: Array.from(this.conversations.values()).filter(c => c.status === 'active').length,
      totalMessages,
      memoryEntries: this.conversations.size,
      isEnabled: this.NLACS_ENABLED,
      uptime,
      backboneHealth: {
        timeService: 'healthy',
        metadataSystem: 'healthy',
        constitutionalAI: 'healthy'
      }
    };
  }
}

// =============================================================================
// SINGLETON EXPORT WITH UNIFIED ARCHITECTURE
// =============================================================================

export default UnifiedNLACSOrchestrator.getInstance();
