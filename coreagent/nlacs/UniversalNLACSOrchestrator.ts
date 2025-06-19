/**
 * OneAgent Universal NLACS Orchestrator
 * Integrated with UnifiedBackboneService for Metadata Handling
 * 
 * PURPOSE: NLACS using existing UnifiedBackboneService for universal metadata
 * FEATURES: Privacy-preserving, project-aware, leverages backbone metadata system
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
// NLACS-SPECIFIC INTERFACES (using backbone metadata)
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
  backboneMetadataId: string; // Links to UnifiedBackboneService metadata
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
  emergentInsights: string[];
  createdAt: Date;
  lastActivity: Date;
  backboneMetadataId: string; // Links to UnifiedBackboneService metadata
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
// UNIVERSAL NLACS ORCHESTRATOR WITH BACKBONE INTEGRATION
// =============================================================================

export class UniversalNLACSOrchestrator extends EventEmitter implements NLACSOrchestrator {
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
    
    // Load configuration from environment
    this.config = {
      memoryEndpoint: process.env.ONEAGENT_MEMORY_ENDPOINT || 'http://localhost:8083',
      mcpEndpoint: process.env.ONEAGENT_MCP_ENDPOINT || 'http://localhost:8083',
      maxConcurrentConversations: parseInt(process.env.NLACS_MAX_CONVERSATIONS || '10'),
      defaultRetentionDays: parseInt(process.env.NLACS_RETENTION_DAYS || '90'),
      constitutionalAIEnabled: process.env.NLACS_CONSTITUTIONAL_AI === 'true'
    };
    
    console.log('[UniversalNLACS] Initialized with universal metadata system');
  }

  // =============================================================================
  // CORE CONVERSATION MANAGEMENT
  // =============================================================================

  async startConversation(
    userId: string,
    topic: string,
    contextCategory: ContextCategory,
    projectContext?: ProjectContext,
    initialAgents?: string[]
  ): Promise<string> {
    const conversationId = `nlacs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Validate privacy controls
    if (!await this.validatePrivacyPermissions(userId, contextCategory, projectContext)) {
      throw new Error(`Privacy violation: User ${userId} not permitted for context ${contextCategory}`);
    }
    
    // Determine privacy level based on context and project
    const privacyLevel = this.determinePrivacyLevel(contextCategory, projectContext);
    
    // Create conversation metadata
    const metadata: ConversationMetadata = {
      messageAnalysis: {
        communicationStyle: 'technical',
        expertiseLevel: 'advanced',
        intentCategory: 'exploration',
        contextTags: [topic, contextCategory],
        contextCategory,
        privacyLevel,
        sentimentScore: 0,
        complexityScore: 0.5,
        urgencyLevel: 0.3
      },
      projectContext,
      userId,
      sessionId: conversationId,
      conversationId,
      timestamp: new Date()
    };

    const conversation: NLACSConversation = {
      conversationId,
      userId,
      topic,
      contextCategory,
      privacyLevel,
      projectContext,
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
      metadata
    };

    this.conversations.set(conversationId, conversation);
    
    // Store in memory with universal context categorization
    await this.storeConversationInMemory(conversation);
    
    this.emit('conversationStarted', { conversationId, userId, topic, contextCategory, projectContext });
    
    console.log(`[UniversalNLACS] Started conversation ${conversationId} for user ${userId}`);
    console.log(`  Context: ${contextCategory}, Privacy: ${privacyLevel}`);
    if (projectContext) {
      console.log(`  Project: ${projectContext.projectName} (${projectContext.projectScope})`);
    }
    
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

    // Privacy check: Ensure agent is authorized for this context
    if (!await this.validateAgentPermissions(agentId, conversation)) {
      throw new Error(`Agent ${agentId} not authorized for conversation ${conversationId}`);
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create message metadata using universal system
    const messageMetadata: ConversationMetadata = {
      ...conversation.metadata,
      timestamp: new Date()
    };

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
      contextCategory: conversation.contextCategory,
      privacyLevel: conversation.privacyLevel,
      projectContext: conversation.projectContext,
      metadata: messageMetadata
    };

    conversation.messages.push(message);
    conversation.lastActivity = new Date();
    
    // Constitutional AI validation if enabled
    if (this.config.constitutionalAIEnabled) {
      await this.validateMessageConstitutionally(message);
    }
    
    // Store message with universal metadata
    await this.storeMessageInMemory(message);
    
    // Extract emergent insights
    await this.extractAndStoreInsights(conversation);
    
    this.emit('messageAdded', { conversationId, messageId, agentId, contextCategory: conversation.contextCategory });
    
    console.log(`[UniversalNLACS] Added message ${messageId} from ${agentId} in context ${conversation.contextCategory}`);
    
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
    contextCategory: ContextCategory,
    projectContext?: ProjectContext
  ): Promise<NLACSConversation[]> {
    return Array.from(this.conversations.values()).filter(conv => 
      conv.userId === userId && 
      conv.contextCategory === contextCategory &&
      (!projectContext || conv.projectContext?.projectId === projectContext.projectId)
    );
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
    
    // Store final state with universal metadata
    await this.storeConversationInMemory(conversation);
    
    this.emit('conversationConcluded', { 
      conversationId, 
      reason, 
      insights: finalInsights,
      contextCategory: conversation.contextCategory,
      projectContext: conversation.projectContext
    });
    
    console.log(`[UniversalNLACS] Concluded conversation ${conversationId}: ${reason || 'Manual conclusion'}`);
  }

  async extractInsights(conversationId: string): Promise<string[]> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    // Analyze message patterns for emergent insights
    const insights: string[] = [];
    
    // Simple pattern recognition for insights
    const messageContents = conversation.messages.map(m => m.content).join(' ');
    
    // Look for solution patterns
    if (messageContents.includes('solution') || messageContents.includes('approach')) {
      insights.push(`Solution methodology identified in ${conversation.contextCategory} context`);
    }
    
    // Look for learning patterns
    if (messageContents.includes('learned') || messageContents.includes('discovered')) {
      insights.push(`Learning insight discovered in ${conversation.topic} discussion`);
    }
    
    // Look for workflow patterns
    if (messageContents.includes('workflow') || messageContents.includes('process')) {
      insights.push(`Workflow pattern emerged in ${conversation.contextCategory} domain`);
    }
    
    return insights;
  }

  // =============================================================================
  // PRIVACY AND COMPLIANCE
  // =============================================================================

  enforcePrivacy(userId: string, conversation: NLACSConversation): boolean {
    const controls = this.userPrivacyControls.get(userId);
    if (!controls) return true; // Default allow
    
    // Check context category permissions
    if (!controls.contextCategoryPermissions[conversation.contextCategory]) {
      return false;
    }
    
    // Check project access permissions
    if (conversation.projectContext) {
      const allowedScopes = controls.projectAccessPermissions[conversation.projectContext.projectId];
      if (!allowedScopes?.includes(conversation.projectContext.projectScope)) {
        return false;
      }
    }
    
    return true;
  }

  async auditCompliance(conversationId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;
    
    // Check privacy compliance
    if (!this.enforcePrivacy(conversation.userId, conversation)) {
      return false;
    }
    
    // Check constitutional compliance for all messages
    if (this.config.constitutionalAIEnabled) {
      for (const message of conversation.messages) {
        if (!await this.validateMessageConstitutionally(message)) {
          return false;
        }
      }
    }
    
    return true;
  }

  // =============================================================================
  // PRIVACY HELPER METHODS
  // =============================================================================

  private async validatePrivacyPermissions(
    userId: string, 
    contextCategory: ContextCategory,
    projectContext?: ProjectContext
  ): Promise<boolean> {
    const controls = this.userPrivacyControls.get(userId);
    if (!controls) return true; // Default allow
    
    return this.enforcePrivacy(userId, {
      contextCategory,
      projectContext,
      userId
    } as NLACSConversation);
  }

  private async validateAgentPermissions(agentId: string, conversation: NLACSConversation): Promise<boolean> {
    const controls = this.userPrivacyControls.get(conversation.userId);
    if (!controls) return true;
    
    // Check if agent type is blocked
    const agentType = this.getAgentType(agentId);
    if (controls.blockedAgentTypes.includes(agentType)) {
      return false;
    }
    
    // Check if agent type is explicitly allowed (if allowlist exists)
    if (controls.allowedAgentTypes.length > 0 && !controls.allowedAgentTypes.includes(agentType)) {
      return false;
    }
    
    return true;
  }

  private determinePrivacyLevel(contextCategory: ContextCategory, projectContext?: ProjectContext): PrivacyLevel {
    // Default privacy levels by context category
    const defaultLevels: Record<ContextCategory, PrivacyLevel> = {
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
    
    let baseLevel = defaultLevels[contextCategory];
    
    // Adjust based on project scope
    if (projectContext) {
      if (projectContext.projectScope === 'PERSONAL') {
        baseLevel = 'confidential';
      } else if (projectContext.projectScope === 'PUBLIC') {
        baseLevel = 'public';
      } else if (projectContext.projectScope === 'ORGANIZATION') {
        baseLevel = 'internal';
      }
    }
    
    return baseLevel;
  }

  // =============================================================================
  // MEMORY AND STORAGE
  // =============================================================================

  private async storeConversationInMemory(conversation: NLACSConversation): Promise<void> {
    try {
      // Store conversation with universal metadata tags
      const content = `NLACS Conversation: ${conversation.topic}
Context: ${conversation.contextCategory}
Privacy: ${conversation.privacyLevel}
Project: ${conversation.projectContext?.projectName || 'None'}
Messages: ${conversation.messages.length}
Insights: ${conversation.emergentInsights.join(', ')}`;

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
            contextCategory: conversation.contextCategory,
            privacyLevel: conversation.privacyLevel,
            projectId: conversation.projectContext?.projectId,
            projectScope: conversation.projectContext?.projectScope,
            tags: [`NLACS-${conversation.contextCategory}`, `PRIVACY-${conversation.privacyLevel}`]
          }
        })
      });
      
      if (!response.ok) {
        console.error('[UniversalNLACS] Failed to store conversation in memory');
      }
    } catch (error) {
      console.error('[UniversalNLACS] Memory storage error:', error);
    }
  }

  private async storeMessageInMemory(message: NLACSMessage): Promise<void> {
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
            contextCategory: message.contextCategory,
            privacyLevel: message.privacyLevel,
            projectId: message.projectContext?.projectId,
            tags: [`NLACS-MESSAGE`, `AGENT-${message.agentId}`, `CONTEXT-${message.contextCategory}`]
          }
        })
      });
      
      if (!response.ok) {
        console.error('[UniversalNLACS] Failed to store message in memory');
      }
    } catch (error) {
      console.error('[UniversalNLACS] Message storage error:', error);
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private getAgentType(agentId: string): string {
    // Simple agent type detection
    if (agentId.includes('coding')) return 'coding';
    if (agentId.includes('research')) return 'research';
    if (agentId.includes('analysis')) return 'analysis';
    return 'general';
  }

  private extractReferences(content: string, existingMessages: NLACSMessage[]): string[] {
    // Simple reference extraction
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

  private async extractAndStoreInsights(conversation: NLACSConversation): Promise<void> {
    const newInsights = await this.extractInsights(conversation.conversationId);
    
    // Only add truly new insights
    for (const insight of newInsights) {
      if (!conversation.emergentInsights.includes(insight)) {
        conversation.emergentInsights.push(insight);
        
        // Store insight separately with universal metadata
        await this.storeInsightInMemory(insight, conversation);
      }
    }
  }

  private async storeInsightInMemory(insight: string, conversation: NLACSConversation): Promise<void> {
    try {
      const content = `NLACS Emergent Insight: ${insight}
From conversation: ${conversation.topic}
Context: ${conversation.contextCategory}
Project: ${conversation.projectContext?.projectName || 'None'}`;

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
            contextCategory: conversation.contextCategory,
            privacyLevel: conversation.privacyLevel,
            projectId: conversation.projectContext?.projectId,
            tags: [`NLACS-INSIGHT`, `CONTEXT-${conversation.contextCategory}`, 'EMERGENT-KNOWLEDGE']
          }
        })
      });
      
      if (!response.ok) {
        console.error('[UniversalNLACS] Failed to store insight in memory');
      }
    } catch (error) {
      console.error('[UniversalNLACS] Insight storage error:', error);
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
          userMessage: `Agent communication in ${message.contextCategory} context`,
          context: {
            agentId: message.agentId,
            contextCategory: message.contextCategory,
            privacyLevel: message.privacyLevel
          }
        })
      });
      
      if (response.ok) {
        const validation = await response.json();
        return validation.passed || false;
      }
    } catch (error) {
      console.error('[UniversalNLACS] Constitutional validation error:', error);
    }
    
    return true; // Default to allow if validation fails
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export default UniversalNLACSOrchestrator;
