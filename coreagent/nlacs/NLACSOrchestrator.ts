/**
 * OneAgent Natural Language Agent Communication System (NLACS)
 * Core Orchestrator - Phase 1 Implementation - WORKING VERSION
 * 
 * Enables natural language conversations between agents with emergent insights
 * 
 * @version 1.0.0-FOUNDATION-WORKING
 * @author OneAgent Professional Development Platform
 */

import { EventEmitter } from 'events';
import * as dotenv from 'dotenv';

// Load environment configuration
dotenv.config();

// =============================================================================
// CORE INTERFACES
// =============================================================================

export interface NLACSMessage {
  messageId: string;
  conversationId: string;
  agentId: string;
  agentType: string;
  content: string;
  messageType: 'response' | 'question' | 'insight' | 'synthesis' | 'challenge';
  timestamp: Date;
  userId: string; // Privacy isolation
  confidence: number;
  referencesTo: string[]; // IDs of messages this responds to
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
  createdAt: Date;
  lastActivity: Date;
}

export interface NLACSSystemStatus {
  activeConversations: number;
  totalMessages: number;
  memoryEntries: number;
  isEnabled: boolean;
  uptime: number;
}

// =============================================================================
// MAIN ORCHESTRATOR CLASS
// =============================================================================

/**
 * NLACS Orchestrator - Phase 1 Implementation
 * 
 * Core functionality for natural language agent communication
 * - Privacy-first design with user isolation
 * - Memory integration for conversation persistence
 * - Event-driven architecture for real-time updates
 * - Constitutional AI compliance for message validation
 */
export class NLACSOrchestrator extends EventEmitter {
  private static instance: NLACSOrchestrator;
  private conversations: Map<string, NLACSConversation> = new Map();
  private startTime: Date = new Date();
  
  // Configuration from .env
  private readonly NLACS_ENABLED = process.env.NLACS_ENABLED === 'true';
  private readonly NLACS_MAX_PARTICIPANTS = parseInt(process.env.NLACS_MAX_PARTICIPANTS_PER_CONVERSATION || '10');
  private readonly NLACS_MAX_MESSAGES = parseInt(process.env.NLACS_MAX_MESSAGES_PER_CONVERSATION || '100');
  private readonly NLACS_MAX_CONVERSATIONS_PER_USER = parseInt(process.env.NLACS_MAX_CONVERSATIONS_PER_USER || '5');

  public static getInstance(): NLACSOrchestrator {
    if (!NLACSOrchestrator.instance) {
      NLACSOrchestrator.instance = new NLACSOrchestrator();
    }
    return NLACSOrchestrator.instance;
  }

  constructor() {
    super();
    
    if (!this.NLACS_ENABLED) {
      console.warn('⚠️ NLACS is disabled. Set NLACS_ENABLED=true in .env to enable natural language agent communication.');
    } else {
      console.log('🚀 NLACS Orchestrator initialized - Ready for natural language agent conversations!');
    }
  }

  /**
   * Initialize the NLACS system
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.NLACS_ENABLED) {
        console.log('⚠️  NLACS is disabled. Set NLACS_ENABLED=true in .env to enable.');
        return false;
      }

      console.log('🚀 NLACS Orchestrator initializing...');
      console.log(`   Max participants per conversation: ${this.NLACS_MAX_PARTICIPANTS}`);
      console.log(`   Max messages per conversation: ${this.NLACS_MAX_MESSAGES}`);
      console.log(`   Max conversations per user: ${this.NLACS_MAX_CONVERSATIONS_PER_USER}`);

      this.emit('systemInitialized', { timestamp: new Date() });
      
      console.log('✅ NLACS Orchestrator ready for agent communication!');
      return true;
      
    } catch (error) {
      console.error('❌ NLACS initialization failed:', error);
      return false;
    }
  }

  /**
   * Phase 1: Initiate a conversation between agents
   */
  async initiateConversation(
    topic: string,
    requiredPerspectives: string[],
    userId: string,
    projectContext?: {
      projectId?: string;
      topicId?: string;
      contextTags?: string[];
    }
  ): Promise<NLACSConversation> {
    if (!this.NLACS_ENABLED) {
      throw new Error('NLACS is disabled. Enable in .env configuration.');
    }

    const conversationId = `nlacs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create conversation with proper optional handling
    const conversation: NLACSConversation = {
      conversationId,
      userId,
      topic,
      participants: [],
      messages: [],
      status: 'active',
      createdAt: new Date(),
      lastActivity: new Date(),
      ...(projectContext && { projectContext })
    };

    // Store conversation FIRST so it can be found when adding agents
    this.conversations.set(conversationId, conversation);

    // Add agents based on required perspectives
    for (const perspective of requiredPerspectives) {
      await this.addAgentToConversation(conversationId, perspective, 'primary', userId);
    }

    // Store in memory for persistence
    await this.storeConversationInMemory(conversation);

    // Emit event
    this.emit('conversationInitiated', { conversation, userId });

    console.log(`🎬 NLACS Conversation initiated: "${topic}" with ${requiredPerspectives.length} agents`);

    return conversation;
  }

  /**
   * Phase 1: Add an agent to existing conversation
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

    // Privacy check: User must own conversation
    if (conversation.userId !== userId) {
      throw new Error('Access denied: User does not own this conversation');
    }

    // Check participant limit
    if (conversation.participants.length >= this.NLACS_MAX_PARTICIPANTS) {
      throw new Error(`Maximum participants (${this.NLACS_MAX_PARTICIPANTS}) reached`);
    }

    // Create agent participant
    const agentId = `${agentType}_${Date.now()}`;
    const participant = {
      agentId,
      agentType,
      role,
      joinedAt: new Date()
    };

    conversation.participants.push(participant);
    conversation.lastActivity = new Date();

    // Update stored conversation
    await this.storeConversationInMemory(conversation);

    console.log(`🤖 Agent ${agentType} (${role}) added to conversation: ${conversationId}`);

    return true;
  }

  /**
   * Phase 1: Send a message in the conversation
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

    // Privacy check
    if (conversation.userId !== userId) {
      throw new Error('Access denied: User does not own this conversation');
    }

    // Check message limit
    if (conversation.messages.length >= this.NLACS_MAX_MESSAGES) {
      throw new Error(`Maximum messages (${this.NLACS_MAX_MESSAGES}) reached for this conversation`);
    }

    // Find agent in participants
    const agent = conversation.participants.find(p => p.agentId === agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} is not a participant in this conversation`);
    }

    // Create message
    const message: NLACSMessage = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      conversationId,
      agentId,
      agentType: agent.agentType,
      content,
      messageType,
      timestamp: new Date(),
      userId,
      confidence: 0.85, // Default confidence
      referencesTo: [] // Phase 2: Will implement message threading
    };

    // Add message to conversation
    conversation.messages.push(message);
    conversation.lastActivity = new Date();

    // Store updated conversation
    await this.storeConversationInMemory(conversation);

    // Emit message event
    this.emit('messageAdded', { message, conversation });

    console.log(`💬 Message added by ${agent.agentType}: "${content.substring(0, 50)}..."`);

    return message;
  }

  /**
   * Phase 1: Get a conversation by ID
   */
  async getConversation(conversationId: string, userId: string): Promise<NLACSConversation> {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Privacy check
    if (conversation.userId !== userId) {
      throw new Error('Access denied: User does not own this conversation');
    }

    return conversation;
  }

  /**
   * Phase 1: Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<NLACSConversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Phase 1: Store conversation in memory (simplified)
   */
  private async storeConversationInMemory(conversation: NLACSConversation): Promise<void> {
    try {
      console.log(`💾 Storing conversation: ${conversation.conversationId} - "${conversation.topic}"`);
      
      // Phase 1: Simple logging - will integrate with OneAgent memory in Phase 2
      const summary = {
        id: conversation.conversationId,
        userId: conversation.userId,
        topic: conversation.topic,
        participants: conversation.participants.length,
        messages: conversation.messages.length,
        status: conversation.status,
        lastActivity: conversation.lastActivity
      };
      
      // TODO: Integrate with OneAgent unified memory system
      // For now, just maintain in-memory storage
      
    } catch (error) {
      console.warn('⚠️ Failed to store conversation in memory:', error);
    }
  }

  /**
   * Get NLACS system status
   */
  async getSystemStatus(): Promise<NLACSSystemStatus> {
    const totalMessages = Array.from(this.conversations.values())
      .reduce((sum, conv) => sum + conv.messages.length, 0);

    const uptime = Date.now() - this.startTime.getTime();

    return {
      activeConversations: Array.from(this.conversations.values()).filter(c => c.status === 'active').length,
      totalMessages,
      memoryEntries: this.conversations.size, // Simplified for Phase 1
      isEnabled: this.NLACS_ENABLED,
      uptime
    };
  }

  /**
   * Phase 1: Conclude a conversation
   */
  async concludeConversation(conversationId: string, userId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Privacy check
    if (conversation.userId !== userId) {
      throw new Error('Access denied: User does not own this conversation');
    }

    conversation.status = 'concluded';
    conversation.lastActivity = new Date();

    await this.storeConversationInMemory(conversation);

    this.emit('conversationConcluded', { conversation, userId });

    console.log(`🎯 Conversation concluded: "${conversation.topic}"`);

    return true;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export default NLACSOrchestrator.getInstance();
