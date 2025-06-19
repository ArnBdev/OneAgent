/**
 * OneAgent NLACS Orchestrator - Backbone Integrated
 * Uses UnifiedBackboneService for all metadata operations
 * 
 * PURPOSE: NLACS leveraging existing backbone for universal metadata handling
 * ARCHITECTURE: Agent communication + Backbone metadata service
 * 
 * @version 2.0.0-BACKBONE-INTEGRATED
 * @author OneAgent Professional Development Platform
 */

import { EventEmitter } from 'events';
import * as dotenv from 'dotenv';
import { 
  unifiedTimeService, 
  unifiedMetadataService, 
  createUnifiedMetadata 
} from '../utils/UnifiedBackboneService.js';

// Load environment configuration
dotenv.config();

// =============================================================================
// NLACS INTERFACES - BACKBONE INTEGRATED
// =============================================================================

export interface NLACSMessage {
  messageId: string;
  conversationId: string;
  agentId: string;
  agentType: string;
  content: string;
  messageType: 'response' | 'question' | 'insight' | 'synthesis' | 'challenge';
  timestamp: Date;
  userId: string;
  confidence: number;
  referencesTo: string[];
  metadataId: string; // Links to backbone metadata
}

export interface NLACSConversation {
  conversationId: string;
  userId: string;
  topic: string;
  participants: {
    agentId: string;
    agentType: string;
    role: 'primary' | 'secondary' | 'observer';
    joinedAt: Date;
  }[];
  messages: NLACSMessage[];
  status: 'active' | 'concluded' | 'archived';
  emergentInsights: string[];
  createdAt: Date;
  lastActivity: Date;
  metadataId: string; // Links to backbone metadata
}

export interface NLACSPrivacyControls {
  userId: string;
  allowedAgentTypes: string[];
  blockedAgentTypes: string[];
  maxConversationLength: number;
  dataRetentionDays: number;
  allowCrossUserInsights: boolean;
  auditLogging: boolean;
}

// =============================================================================
// BACKBONE-INTEGRATED NLACS ORCHESTRATOR
// =============================================================================

export class BackboneNLACSOrchestrator extends EventEmitter {
  private conversations: Map<string, NLACSConversation> = new Map();
  private userPrivacyControls: Map<string, NLACSPrivacyControls> = new Map();
  private config: {
    memoryEndpoint: string;
    mcpEndpoint: string;
    maxConcurrentConversations: number;
    defaultRetentionDays: number;
    constitutionalAIEnabled: boolean;
  };

  constructor() {
    super();
      this.config = {
      memoryEndpoint: process.env.ONEAGENT_MEMORY_URL || 'http://localhost:8001',
      mcpEndpoint: process.env.ONEAGENT_MCP_URL || 'http://localhost:8083',
      maxConcurrentConversations: parseInt(process.env.NLACS_MAX_CONVERSATIONS || '10'),
      defaultRetentionDays: parseInt(process.env.NLACS_RETENTION_DAYS || '90'),
      constitutionalAIEnabled: process.env.NLACS_CONSTITUTIONAL_AI === 'true'
    };
    
    console.log('[BackboneNLACS] Initialized with UnifiedBackboneService integration');
  }

  // =============================================================================
  // CONVERSATION MANAGEMENT WITH BACKBONE METADATA
  // =============================================================================

  async startConversation(
    userId: string,
    topic: string,
    contextCategory: string = 'WORKPLACE',
    projectContext?: { projectId?: string; projectName?: string },
    initialAgents?: string[]
  ): Promise<string> {
    const conversationId = `nlacs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Create conversation metadata using backbone service
    const conversationMetadata = createUnifiedMetadata('nlacs_conversation', 'nlacs-orchestrator', {
      system: {
        source: 'nlacs-orchestrator',
        component: 'nlacs',
        sessionId: conversationId,
        userId: userId
      },
      content: {
        category: 'agent_communication',
        tags: ['nlacs', 'conversation', topic, contextCategory],
        sensitivity: this.determineSensitivity(contextCategory),
        relevanceScore: 85,
        contextDependency: 'session'
      },
      quality: {
        score: 85,
        constitutionalCompliant: true,
        validationLevel: 'enhanced',
        confidence: 90
      }
    });

    const conversation: NLACSConversation = {
      conversationId,
      userId,
      topic,
      participants: (initialAgents || ['general-assistant']).map(agentId => ({
        agentId,
        agentType: 'specialized',
        role: 'primary',
        joinedAt: new Date()
      })),
      messages: [],
      status: 'active',
      emergentInsights: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      metadataId: conversationMetadata.id
    };

    this.conversations.set(conversationId, conversation);
    
    // Store in memory using backbone service
    await this.storeConversationMemory(conversation, conversationMetadata);
    
    this.emit('conversationStarted', { 
      conversationId, 
      userId, 
      topic, 
      contextCategory, 
      projectContext,
      metadataId: conversationMetadata.id
    });
    
    console.log(`[BackboneNLACS] Started conversation ${conversationId}`);
    console.log(`  Topic: ${topic}, Context: ${contextCategory}`);
    console.log(`  Metadata ID: ${conversationMetadata.id}`);
    
    return conversationId;
  }

  async addMessage(
    conversationId: string,
    agentId: string,
    content: string,
    messageType: string = 'response'
  ): Promise<string> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Validate agent permissions
    if (!this.validateAgentPermissions(agentId, conversation)) {
      throw new Error(`Agent ${agentId} not authorized for conversation`);
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Create message metadata using backbone service
    const messageMetadata = createUnifiedMetadata('nlacs_message', 'nlacs-orchestrator', {
      system: {
        source: 'nlacs-orchestrator',
        component: 'nlacs',
        sessionId: conversationId,
        userId: conversation.userId,
        agent: { id: agentId, type: this.getAgentType(agentId) }
      },
      content: {
        category: 'agent_message',
        tags: ['nlacs', 'message', agentId, messageType],
        sensitivity: 'internal',
        relevanceScore: 80,
        contextDependency: 'session'
      },
      relationships: {
        parent: conversation.metadataId,
        children: [],
        dependencies: [],
        related: this.extractReferences(content, conversation.messages).map(m => 
          conversation.messages.find(msg => msg.messageId === m)?.metadataId
        ).filter(Boolean) as string[]
      }
    });

    const message: NLACSMessage = {
      messageId,
      conversationId,
      agentId,
      agentType: this.getAgentType(agentId),
      content,
      messageType: messageType as any,
      timestamp: new Date(),
      userId: conversation.userId,
      confidence: 0.8,
      referencesTo: this.extractReferences(content, conversation.messages),
      metadataId: messageMetadata.id
    };

    conversation.messages.push(message);
    conversation.lastActivity = new Date();
    
    // Constitutional AI validation if enabled
    if (this.config.constitutionalAIEnabled) {
      await this.validateMessageConstitutionally(message);
    }
    
    // Store message using backbone service
    await this.storeMessageMemory(message, messageMetadata);
    
    // Extract emergent insights
    await this.extractAndStoreInsights(conversation);
    
    this.emit('messageAdded', { 
      conversationId, 
      messageId, 
      agentId, 
      metadataId: messageMetadata.id 
    });
    
    console.log(`[BackboneNLACS] Added message ${messageId} from ${agentId}`);
    
    return messageId;
  }

  // =============================================================================
  // CONVERSATION RETRIEVAL
  // =============================================================================

  async getConversation(conversationId: string): Promise<NLACSConversation | null> {
    return this.conversations.get(conversationId) || null;
  }

  async getConversationsForUser(userId: string): Promise<NLACSConversation[]> {
    return Array.from(this.conversations.values()).filter(conv => conv.userId === userId);
  }

  async getConversationsByContext(
    userId: string, 
    contextCategory: string,
    projectId?: string
  ): Promise<NLACSConversation[]> {
    // Use backbone metadata service to query by tags
    const conversations = Array.from(this.conversations.values()).filter(conv => 
      conv.userId === userId
    );
      // Filter by metadata tags using backbone service
    const filtered: NLACSConversation[] = [];
    for (const conv of conversations) {
      const metadata = unifiedMetadataService.retrieve(conv.metadataId);
      if (metadata && metadata.content.tags.includes(contextCategory)) {
        if (!projectId || metadata.content.tags.includes(projectId)) {
          filtered.push(conv);
        }
      }
    }
    
    return filtered;
  }

  // =============================================================================
  // CONVERSATION LIFECYCLE
  // =============================================================================

  async concludeConversation(conversationId: string, reason?: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.status = 'concluded';
    
    // Extract final insights
    const finalInsights = await this.extractInsights(conversationId);
    conversation.emergentInsights.push(...finalInsights);
      // Update metadata using backbone service
    const metadata = unifiedMetadataService.retrieve(conversation.metadataId);
    if (metadata) {
      unifiedMetadataService.update(conversation.metadataId, {
        content: {
          ...metadata.content,
          tags: [...metadata.content.tags, 'concluded', ...(reason ? [reason] : [])]
        }
      });
    }
    
    this.emit('conversationConcluded', { 
      conversationId, 
      reason, 
      insights: finalInsights,
      metadataId: conversation.metadataId
    });
    
    console.log(`[BackboneNLACS] Concluded conversation ${conversationId}: ${reason || 'Manual'}`);
  }

  async extractInsights(conversationId: string): Promise<string[]> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    const insights: string[] = [];
    const messageContents = conversation.messages.map(m => m.content).join(' ');
    
    // Simple pattern recognition for insights
    if (messageContents.includes('solution') || messageContents.includes('approach')) {
      insights.push(`Solution methodology identified in ${conversation.topic} discussion`);
    }
    
    if (messageContents.includes('learned') || messageContents.includes('discovered')) {
      insights.push(`Learning insight discovered in ${conversation.topic} domain`);
    }
    
    if (messageContents.includes('workflow') || messageContents.includes('process')) {
      insights.push(`Workflow pattern emerged in agent collaboration`);
    }
    
    return insights;
  }

  // =============================================================================
  // PRIVACY AND COMPLIANCE
  // =============================================================================

  enforcePrivacy(userId: string, conversation: NLACSConversation): boolean {
    const controls = this.userPrivacyControls.get(userId);
    if (!controls) return true;
      // Use backbone metadata to check permissions
    const metadata = unifiedMetadataService.retrieve(conversation.metadataId);
    if (!metadata) return false;
    
    // Check sensitivity level
    if (metadata.content.sensitivity === 'restricted' && !controls.allowCrossUserInsights) {
      return false;
    }
    
    return true;
  }

  async auditCompliance(conversationId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;
      // Check backbone metadata compliance
    const metadata = unifiedMetadataService.retrieve(conversation.metadataId);
    if (!metadata || !metadata.quality.constitutionalCompliant) {
      return false;
    }
    
    // Check message compliance
    for (const message of conversation.messages) {
      const msgMetadata = unifiedMetadataService.retrieve(message.metadataId);
      if (!msgMetadata || !msgMetadata.quality.constitutionalCompliant) {
        return false;
      }
    }
    
    return true;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private determineSensitivity(contextCategory: string): 'public' | 'internal' | 'confidential' | 'restricted' {
    const sensitivities: Record<string, 'public' | 'internal' | 'confidential' | 'restricted'> = {
      'WORKPLACE': 'internal',
      'PRIVATE': 'confidential',
      'PROJECT': 'internal',
      'TECHNICAL': 'public',
      'FINANCIAL': 'confidential',
      'HEALTH': 'restricted',
      'EDUCATIONAL': 'public',
      'CREATIVE': 'internal',
      'ADMINISTRATIVE': 'internal',
      'GENERAL': 'public'
    };
    
    return sensitivities[contextCategory] || 'internal';
  }

  private validateAgentPermissions(agentId: string, conversation: NLACSConversation): boolean {
    const controls = this.userPrivacyControls.get(conversation.userId);
    if (!controls) return true;
    
    const agentType = this.getAgentType(agentId);
    return !controls.blockedAgentTypes.includes(agentType) &&
           (controls.allowedAgentTypes.length === 0 || controls.allowedAgentTypes.includes(agentType));
  }

  private getAgentType(agentId: string): string {
    if (agentId.includes('coding')) return 'coding';
    if (agentId.includes('research')) return 'research';
    if (agentId.includes('analysis')) return 'analysis';
    return 'general';
  }

  private extractReferences(content: string, existingMessages: NLACSMessage[]): string[] {
    const references: string[] = [];
    
    for (const message of existingMessages) {
      if (content.toLowerCase().includes(message.agentId.toLowerCase()) ||
          content.toLowerCase().includes('previous') ||
          content.toLowerCase().includes('earlier')) {
        references.push(message.messageId);
      }
    }
    
    return references;
  }

  // =============================================================================
  // BACKBONE INTEGRATION - MEMORY STORAGE
  // =============================================================================

  private async storeConversationMemory(conversation: NLACSConversation, metadata: any): Promise<void> {
    try {
      const content = `NLACS Conversation: ${conversation.topic}
Users: ${conversation.userId}
Participants: ${conversation.participants.map(p => p.agentId).join(', ')}
Status: ${conversation.status}
Created: ${conversation.createdAt.toISOString()}
Metadata ID: ${metadata.id}`;

      const response = await fetch(`${this.config.memoryEndpoint}/memory/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId: conversation.userId,
          memoryType: 'long_term',
          metadata: {
            type: 'nlacs_conversation',
            conversationId: conversation.conversationId,
            backboneMetadataId: metadata.id,
            tags: ['NLACS-CONVERSATION', `USER-${conversation.userId}`, `TOPIC-${conversation.topic}`]
          }
        })
      });
      
      if (!response.ok) {
        console.error('[BackboneNLACS] Failed to store conversation in memory');
      }
    } catch (error) {
      console.error('[BackboneNLACS] Conversation memory storage error:', error);
    }
  }

  private async storeMessageMemory(message: NLACSMessage, metadata: any): Promise<void> {
    try {
      const content = `NLACS Message from ${message.agentId}: ${message.content}`;

      const response = await fetch(`${this.config.memoryEndpoint}/memory/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId: message.userId,
          memoryType: 'session',
          metadata: {
            type: 'nlacs_message',
            messageId: message.messageId,
            conversationId: message.conversationId,
            agentId: message.agentId,
            backboneMetadataId: metadata.id,
            tags: ['NLACS-MESSAGE', `AGENT-${message.agentId}`, `TYPE-${message.messageType}`]
          }
        })
      });
      
      if (!response.ok) {
        console.error('[BackboneNLACS] Failed to store message in memory');
      }
    } catch (error) {
      console.error('[BackboneNLACS] Message memory storage error:', error);
    }
  }

  private async extractAndStoreInsights(conversation: NLACSConversation): Promise<void> {
    const newInsights = await this.extractInsights(conversation.conversationId);
    
    for (const insight of newInsights) {
      if (!conversation.emergentInsights.includes(insight)) {
        conversation.emergentInsights.push(insight);
          // Create insight metadata using backbone service
        const insightMetadata = createUnifiedMetadata('nlacs_insight', 'nlacs-orchestrator', {
          system: {
            source: 'nlacs-orchestrator',
            component: 'nlacs',
            sessionId: conversation.conversationId,
            userId: conversation.userId
          },
          content: {
            category: 'emergent_insight',
            tags: ['nlacs', 'insight', 'emergent', conversation.topic],
            sensitivity: 'internal',
            relevanceScore: 90,
            contextDependency: 'session'
          },
          relationships: {
            parent: conversation.metadataId,
            children: [],
            related: [],
            dependencies: []
          }
        });
        
        await this.storeInsightMemory(insight, conversation, insightMetadata);
      }
    }
  }

  private async storeInsightMemory(insight: string, conversation: NLACSConversation, metadata: any): Promise<void> {
    try {
      const content = `NLACS Emergent Insight: ${insight}
From conversation: ${conversation.topic}
Participants: ${conversation.participants.map(p => p.agentId).join(', ')}
Metadata ID: ${metadata.id}`;

      const response = await fetch(`${this.config.memoryEndpoint}/memory/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId: conversation.userId,
          memoryType: 'long_term',
          metadata: {
            type: 'nlacs_insight',
            conversationId: conversation.conversationId,
            backboneMetadataId: metadata.id,
            tags: ['NLACS-INSIGHT', 'EMERGENT-KNOWLEDGE', `TOPIC-${conversation.topic}`]
          }
        })
      });
      
      if (!response.ok) {
        console.error('[BackboneNLACS] Failed to store insight in memory');
      }
    } catch (error) {
      console.error('[BackboneNLACS] Insight memory storage error:', error);
    }
  }

  private async validateMessageConstitutionally(message: NLACSMessage): Promise<boolean> {
    if (!this.config.constitutionalAIEnabled) return true;
    
    try {
      const response = await fetch(`${this.config.mcpEndpoint}/constitutional/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: message.content,
          userMessage: `Agent communication from ${message.agentId}`,
          context: {
            agentId: message.agentId,
            messageType: message.messageType
          }
        })
      });
      
      if (response.ok) {
        const validation = await response.json();
          // Update message metadata with constitutional validation
        const metadata = unifiedMetadataService.retrieve(message.metadataId);
        if (metadata) {
          unifiedMetadataService.update(message.metadataId, {
            quality: {
              ...metadata.quality,
              constitutionalCompliant: validation.passed || false
            }
          });
        }
        
        return validation.passed || false;
      }
    } catch (error) {
      console.error('[BackboneNLACS] Constitutional validation error:', error);
    }
    
    return true;
  }
}

export default BackboneNLACSOrchestrator;
