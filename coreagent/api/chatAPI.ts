import { Request, Response } from 'express';
import { CoreAgent } from '../main';
import { 
  ConversationMetadata, 
  ContextCategory, 
  PrivacyLevel,
  ProjectContext 
} from '../types/oneagent-backbone-types';
import { AgentFactory } from '../agents/base/AgentFactory';
import { OneAgentUnifiedTimeService, OneAgentUnifiedMetadataService } from '../utils/UnifiedBackboneService';
import { OneAgentMemory } from '../memory/OneAgentMemory';

interface ChatRequest {
  message: string;
  userId: string;
  agentType?: string;
  memoryContext?: any;
  // New: Support for agent-to-agent communication
  fromAgent?: string;
  toAgent?: string;
  conversationId?: string;
}

interface ChatResponse {
  response: string;
  agentType: string;
  conversationId?: string;
  memoryContext?: {
    relevantMemories: number;
    searchTerms?: string[];
  } | undefined;
  error?: string;
}

/**
 * Enhanced ChatAPI - Universal Conversation System with Backbone Metadata
 * 
 * Supports both user-to-agent AND agent-to-agent communication with proper
 * conversationId tracking, context categorization, and temporal awareness.
 */
export class ChatAPI {
  private coreAgent: CoreAgent;
  private memoryClient: OneAgentMemory;
  private timeService: OneAgentUnifiedTimeService;
  private metadataService: OneAgentUnifiedMetadataService;
  constructor(coreAgent: CoreAgent) {
    this.coreAgent = coreAgent;
    this.memoryClient = new OneAgentMemory({});
    this.timeService = OneAgentUnifiedTimeService.getInstance();
    this.metadataService = OneAgentUnifiedMetadataService.getInstance();
  }

  /**
   * Universal message processing - handles ALL conversation types
   * This method now processes user-to-agent AND agent-to-agent messages
   */
  async processMessage(
    content: string,
    userId: string,
    options: {
      agentType?: string;
      fromAgent?: string;
      toAgent?: string;
      conversationId?: string;
      memoryContext?: any;
    } = {}
  ): Promise<ChatResponse> {
    try {
      const conversationId = options.conversationId || this.generateConversationId();
      
      // Determine target agent
      const targetAgentType = options.toAgent || options.agentType || 'core';
      const targetAgent = await this.selectAgent(targetAgentType, userId);
      
      // Process message through the agent's processMessage method
      const agentResponse = await targetAgent.processMessage(content, {
        userId,
        requestId: this.generateMessageId(),
        metadata: {
          conversationId,
          fromAgent: options.fromAgent,
          toAgent: options.toAgent,
          isAgentToAgent: !!options.fromAgent
        }
      });      // Store conversation in memory
      await this.storeConversation(content, agentResponse, userId, {
        conversationId,
        ...(options.fromAgent && { fromAgent: options.fromAgent }),
        ...(options.toAgent && { toAgent: options.toAgent }),
        agentType: targetAgentType
      });

      // Get memory context if requested
      const memoryContext = options.memoryContext ?
        await this.getMemoryContext(content, userId) : undefined;

      return {
        response: agentResponse.content,
        agentType: targetAgentType,
        conversationId,
        memoryContext
      };

    } catch (error) {
      console.error('Chat processing error:', error);
      
      return {
        response: 'I apologize, but I encountered an error processing your message.',
        agentType: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Agent-to-Agent communication using the same infrastructure
   */
  async sendAgentMessage(
    fromAgentType: string,
    toAgentType: string,
    content: string,
    userId: string,
    conversationId?: string
  ): Promise<ChatResponse> {
      return this.processMessage(content, userId, {
      fromAgent: fromAgentType,
      toAgent: toAgentType,
      conversationId: conversationId || `${fromAgentType}_to_${toAgentType}_${Date.now()}`,
      agentType: toAgentType
    });
  }

  /**
   * Team meeting orchestration using the same conversation system
   */
  async conductTeamMeeting(
    topic: string,
    participantAgentTypes: string[],
    userId: string,
    facilitator: string = 'core'
  ): Promise<ChatResponse[]> {
    
    const conversationId = this.generateConversationId();
    const responses: ChatResponse[] = [];

    // Facilitator introduces the meeting
    const introResponse = await this.sendAgentMessage(
      facilitator,
      'team',
      `Let's begin our team meeting about: ${topic}. I'd like to hear perspectives from each team member.`,
      userId,
      conversationId
    );
    responses.push(introResponse);

    // Each agent contributes their perspective
    for (const agentType of participantAgentTypes) {
      if (agentType !== facilitator) {
        const agentResponse = await this.sendAgentMessage(
          agentType,
          'team',
          `As the ${agentType} specialist, here's my perspective on ${topic}...`,
          userId,
          conversationId
        );
        responses.push(agentResponse);
      }
    }

    // Facilitator provides synthesis
    const synthesisResponse = await this.sendAgentMessage(
      facilitator,
      'team',
      `Based on our discussion, here's my synthesis of the team's perspectives on ${topic}...`,
      userId,
      conversationId
    );
    responses.push(synthesisResponse);    return responses;
  }

  /**
   * Existing HTTP endpoint - now enhanced to use universal message processing
   */
  async handleChatMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, userId, agentType = 'general', memoryContext }: ChatRequest = req.body;
      if (!message || !userId) {
        res.status(400).json({
          error: 'Missing required fields: message and userId'
        });
        return;
      }
      // Store user message in memory using canonical memory client
      await this.memoryClient.addMemory('chat-messages', {
        id: `user_message_${userId}_${Date.now()}`,
        userId,
        content: message,
        role: 'user',
        timestamp: Date.now(),
        agentType
      });
      // Process the message through CoreAgent
      const agentResponse = await this.coreAgent.processMessage(message, userId);
      // Store agent response in memory
      await this.memoryClient.addMemory('chat-messages', {
        id: `agent_response_${userId}_${Date.now()}`,
        userId,
        content: agentResponse.content,
        role: 'assistant',
        timestamp: Date.now(),
        agentType,
        confidence: agentResponse.metadata?.confidence || 0.8
      });
      // Get relevant memory context for response
      const memoryResponse = memoryContext ? 
        await this.memoryClient.searchMemory('chat-messages', {
          query: message,
          user_id: userId,
          limit: 3,
          semanticSearch: true
        }) : null;
      const relevantMemories = (memoryResponse as any)?.results || (memoryResponse as any)?.memories || (memoryResponse as any)?.entries || [];
      const response: ChatResponse = {
        response: agentResponse.content,
        agentType: agentResponse.metadata?.agentType || agentType,
        memoryContext: relevantMemories.length > 0 ? {
          relevantMemories: relevantMemories.length,
          searchTerms: [message]
        } : undefined
      };
      res.json(response);
    } catch (error) {
      console.error('Chat API error:', error);
      const errorResponse: ChatResponse = {
        response: 'I apologize, but I encountered an error processing your message. Please try again.',
        agentType: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get chat history for a user
   */
  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      if (!userId) {
        res.status(400).json({ error: 'Missing userId parameter' });
        return;
      }
      // Search for chat messages in memory
      const memoryResult = await this.memoryClient.searchMemory('chat-messages', {
        query: 'chat message',
        user_id: userId,
        limit: parseInt(limit as string)
      });
      const memories = (memoryResult as any).results || (memoryResult as any).memories || (memoryResult as any).entries || [];
      // Filter and format chat messages
      const chatHistory = memories.length > 0 ? 
        memories
          .filter((memory: any) => memory.role === 'user' || memory.role === 'assistant')
          .map((memory: any) => ({
            id: memory.id,
            content: memory.content,
            role: memory.role,
            timestamp: memory.timestamp,
            agentType: memory.agentType
          }))
          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        : [];

      res.json({
        messages: chatHistory,
        total: chatHistory.length,
        userId
      });

    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({
        error: 'Failed to retrieve chat history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Clear chat history for a user
   */
  async clearChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: 'Missing userId parameter' });
        return;
      }

      // Note: Mem0Client doesn't have a direct delete by metadata method
      // This would need to be implemented based on the specific memory system
      // For now, we'll just return success
      console.log(`Chat history clear requested for user: ${userId}`);

      res.json({
        message: 'Chat history clear requested',
        userId,
        note: 'Individual message deletion not yet implemented in memory system'
      });

    } catch (error) {
      console.error('Clear chat history error:', error);
      res.status(500).json({
        error: 'Failed to clear chat history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate unique conversation ID with temporal context
   */
  private generateConversationId(): string {
    const timestamp = this.timeService.now();
    return `conv_${timestamp.unix}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    const timestamp = this.timeService.now();
    return `msg_${timestamp.unix}_${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Select appropriate agent for conversation
   */
  private async selectAgent(agentType: string, userId: string): Promise<any> {
    try {
      // Use AgentFactory static method to create agent instance
      const agent = await AgentFactory.createAgent({
        type: agentType as any,
        id: `${agentType}_${userId}`,
        name: `${agentType} Agent for ${userId}`,
        memoryEnabled: true,
        aiEnabled: true
      });
      
      return agent;
    } catch (error) {
      // Fallback to CoreAgent
      console.warn(`Failed to create ${agentType} agent, falling back to CoreAgent:`, error);
      return this.coreAgent;
    }
  }

  /**
   * Store conversation with full backbone metadata and context categorization
   */
  private async storeConversation(
    userMessage: string, 
    agentResponse: any, 
    userId: string, 
    options: {
      conversationId: string;
      fromAgent?: string;
      toAgent?: string;
      agentType: string;
      contextCategory?: ContextCategory;
      privacyLevel?: PrivacyLevel;
      projectContext?: ProjectContext;
    }
  ): Promise<void> {
    
    const timestamp = this.timeService.now();
    const context = this.timeService.getContext();
    
    // Determine context category based on conversation content
    const contextCategory = options.contextCategory || this.determineContextCategory(userMessage);
    const privacyLevel = options.privacyLevel || this.determinePrivacyLevel(userMessage, contextCategory);
      // Create comprehensive conversation metadata
    const conversationMetadata: ConversationMetadata = {
      messageAnalysis: {
        communicationStyle: this.analyzeCommunicationStyle(userMessage),
        expertiseLevel: this.analyzeExpertiseLevel(userMessage),
        intentCategory: this.analyzeIntentCategory(userMessage),
        contextTags: this.extractContextTags(userMessage),
        contextCategory,
        privacyLevel,
        sentimentScore: this.analyzeSentiment(userMessage),
        complexityScore: this.analyzeComplexity(userMessage),
        urgencyLevel: this.analyzeUrgency(userMessage)
      },
      responseAnalysis: {
        qualityScore: agentResponse.metadata?.qualityScore || 85,
        helpfulnessScore: agentResponse.metadata?.helpfulnessScore || 80,
        accuracyScore: agentResponse.metadata?.accuracyScore || 85,
        constitutionalCompliance: agentResponse.metadata?.constitutionalCompliance || 95,
        responseTimeMs: agentResponse.metadata?.responseTime || 0,
        tokensUsed: agentResponse.metadata?.tokensUsed || 0
      },
      userId,
      sessionId: options.conversationId, // Use conversationId as sessionId for continuity
      conversationId: options.conversationId,
      timestamp: new Date(timestamp.unix),
      ...(options.projectContext && { projectContext: options.projectContext })
    };// Create unified metadata for both user message and agent response
    const userMessageMetadata = this.metadataService.create('conversation_message', 'chat_api', {
      system: {
        source: 'chat_api',
        component: 'chat_api',
        sessionId: options.conversationId,
        userId,
        agent: options.fromAgent || 'user'
      },
      content: {
        category: contextCategory.toLowerCase(),        tags: [
          'user_message',
          'conversation',
          options.agentType,
          ...(options.fromAgent ? ['agent_to_agent'] : ['user_to_agent']),
          ...(conversationMetadata.messageAnalysis?.contextTags || [])
        ],        sensitivity: privacyLevel === 'public' ? 'public' : 
                    privacyLevel === 'internal' ? 'internal' : 'restricted',
        relevanceScore: 0.8,
        contextDependency: 'session'
      }
    });    const agentResponseMetadata = this.metadataService.create('conversation_response', 'chat_api', {
      system: {
        source: 'chat_api',
        component: 'chat_api',
        sessionId: options.conversationId,
        userId,
        agent: options.toAgent || options.agentType
      },
      content: {
        category: contextCategory.toLowerCase(),        tags: [
          'agent_response',
          'conversation',
          options.agentType,
          ...(options.fromAgent ? ['agent_to_agent'] : ['agent_to_user']),
          ...(conversationMetadata.messageAnalysis?.contextTags || [])
        ],
        sensitivity: privacyLevel === 'public' ? 'public' : 
                    privacyLevel === 'internal' ? 'internal' : 'restricted',
        relevanceScore: 0.85,
        contextDependency: 'session'
      }
    });

    try {
      // Store user message with full metadata
      await this.memoryClient.addMemory('chat-messages', {
        id: `user_message_${userId}_${Date.now()}`,
        userId,
        content: userMessage,
        role: 'user',
        timestamp: timestamp.unix,
        agentType: options.agentType,
        conversationId: options.conversationId,
        fromAgent: options.fromAgent,
        toAgent: options.toAgent,
        contextCategory,
        privacyLevel,
        unifiedMetadata: userMessageMetadata,
        conversationMetadata,
        backboneContext: {
          timeContext: context,
          timestamp: timestamp
        }
      });

      // Store agent response with full metadata
      await this.memoryClient.addMemory('chat-messages', {
        id: `agent_response_${userId}_${Date.now()}`,
        userId,
        content: agentResponse.content,
        role: 'assistant',
        timestamp: timestamp.unix,
        agentType: options.agentType,
        conversationId: options.conversationId,
        fromAgent: options.toAgent || options.agentType,
        toAgent: options.fromAgent || 'user',
        contextCategory,
        privacyLevel,
        unifiedMetadata: agentResponseMetadata,
        conversationMetadata,
        backboneContext: {
          timeContext: context,
          timestamp: timestamp
        },
        confidence: agentResponse.metadata?.confidence || 0.85,
        quality: conversationMetadata.responseAnalysis
      });

    } catch (error) {
      console.error('Failed to store conversation with backbone metadata:', error);
      
      // Fallback to basic storage
      await this.memoryClient.addMemory('chat-messages', {
        id: `fallback_user_message_${userId}_${Date.now()}`,
        userId,
        content: userMessage,
        role: 'user',
        timestamp: timestamp.unix,
        conversationId: options.conversationId
      });

      await this.memoryClient.addMemory('chat-messages', {
        id: `fallback_agent_response_${userId}_${Date.now()}`,
        userId,
        content: agentResponse.content,
        role: 'assistant',
        timestamp: timestamp.unix,
        conversationId: options.conversationId
      });
    }
  }

  /**
   * Get enriched memory context for conversations
   */
  private async getMemoryContext(query: string, userId: string, limit: number = 5): Promise<any> {
    try {
      const memoryResult = await this.memoryClient.searchMemory('chat-messages', {
        query,
        user_id: userId,
        limit
      });
      return {
        relevantMemories: memoryResult.results?.length || 0,
        searchTerms: [query],
        memories: memoryResult.results || []
      };
    } catch (error) {
      console.error('Failed to get memory context:', error);
      return {
        relevantMemories: 0,
        searchTerms: [query],
        memories: []
      };
    }
  }

  // =====================================
  // CONTEXT ANALYSIS METHODS
  // =====================================

  private determineContextCategory(message: string): ContextCategory {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('work') || lowerMessage.includes('office') || lowerMessage.includes('meeting')) {
      return 'WORKPLACE';
    }
    if (lowerMessage.includes('project') || lowerMessage.includes('development') || lowerMessage.includes('build')) {
      return 'PROJECT';
    }
    if (lowerMessage.includes('code') || lowerMessage.includes('bug') || lowerMessage.includes('api')) {
      return 'TECHNICAL';
    }
    if (lowerMessage.includes('money') || lowerMessage.includes('budget') || lowerMessage.includes('cost')) {
      return 'FINANCIAL';
    }
    if (lowerMessage.includes('health') || lowerMessage.includes('fitness') || lowerMessage.includes('exercise')) {
      return 'HEALTH';
    }
    if (lowerMessage.includes('learn') || lowerMessage.includes('study') || lowerMessage.includes('course')) {
      return 'EDUCATIONAL';
    }
    if (lowerMessage.includes('create') || lowerMessage.includes('design') || lowerMessage.includes('art')) {
      return 'CREATIVE';
    }
    if (lowerMessage.includes('admin') || lowerMessage.includes('manage') || lowerMessage.includes('organize')) {
      return 'ADMINISTRATIVE';
    }
    if (lowerMessage.includes('personal') || lowerMessage.includes('private') || lowerMessage.includes('family')) {
      return 'PRIVATE';
    }
    
    return 'GENERAL';
  }

  private determinePrivacyLevel(message: string, contextCategory: ContextCategory): PrivacyLevel {
    const lowerMessage = message.toLowerCase();
    
    if (contextCategory === 'PRIVATE' || 
        lowerMessage.includes('confidential') || 
        lowerMessage.includes('secret') ||
        lowerMessage.includes('personal')) {
      return 'confidential';
    }
    
    if (contextCategory === 'WORKPLACE' || 
        contextCategory === 'PROJECT' ||
        lowerMessage.includes('internal') ||
        lowerMessage.includes('company')) {
      return 'internal';
    }
    
    if (lowerMessage.includes('restricted') || 
        lowerMessage.includes('sensitive') ||
        contextCategory === 'FINANCIAL') {
      return 'restricted';
    }
    
    return 'internal'; // Default to internal for OneAgent conversations
  }

  private analyzeCommunicationStyle(message: string): 'formal' | 'casual' | 'technical' | 'conversational' {
    const lowerMessage = message.toLowerCase();
    
    if (message.includes('please') && message.includes('thank you')) return 'formal';
    if (lowerMessage.includes('hey') || lowerMessage.includes('btw')) return 'casual';
    if (lowerMessage.includes('function') || lowerMessage.includes('algorithm')) return 'technical';
    
    return 'conversational';
  }

  private analyzeExpertiseLevel(message: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('how do i') || lowerMessage.includes('what is')) return 'beginner';
    if (lowerMessage.includes('best practice') || lowerMessage.includes('optimize')) return 'advanced';
    if (lowerMessage.includes('architecture') || lowerMessage.includes('design pattern')) return 'expert';
    
    return 'intermediate';
  }

  private analyzeIntentCategory(message: string): 'question' | 'request' | 'complaint' | 'compliment' | 'exploration' {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('?') || lowerMessage.includes('how') || lowerMessage.includes('what')) return 'question';
    if (lowerMessage.includes('please') || lowerMessage.includes('can you')) return 'request';
    if (lowerMessage.includes('wrong') || lowerMessage.includes('error')) return 'complaint';
    if (lowerMessage.includes('great') || lowerMessage.includes('excellent')) return 'compliment';
    
    return 'exploration';
  }

  private extractContextTags(message: string): string[] {
    const tags: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Technical tags
    if (lowerMessage.includes('code')) tags.push('coding');
    if (lowerMessage.includes('bug')) tags.push('debugging');
    if (lowerMessage.includes('test')) tags.push('testing');
    if (lowerMessage.includes('deploy')) tags.push('deployment');
    
    // Project tags
    if (lowerMessage.includes('feature')) tags.push('feature-development');
    if (lowerMessage.includes('requirement')) tags.push('requirements');
    if (lowerMessage.includes('deadline')) tags.push('timeline');
    
    // General tags
    if (lowerMessage.includes('urgent')) tags.push('urgent');
    if (lowerMessage.includes('important')) tags.push('important');
    if (lowerMessage.includes('question')) tags.push('question');
    
    return tags.length > 0 ? tags : ['general'];
  }

  private analyzeSentiment(message: string): number {
    const lowerMessage = message.toLowerCase();
    let score = 0.5; // Neutral
    
    // Positive indicators
    if (lowerMessage.includes('great') || lowerMessage.includes('excellent') || lowerMessage.includes('love')) {
      score += 0.3;
    }
    if (lowerMessage.includes('good') || lowerMessage.includes('nice') || lowerMessage.includes('thanks')) {
      score += 0.2;
    }
    
    // Negative indicators
    if (lowerMessage.includes('bad') || lowerMessage.includes('terrible') || lowerMessage.includes('hate')) {
      score -= 0.3;
    }
    if (lowerMessage.includes('problem') || lowerMessage.includes('error') || lowerMessage.includes('issue')) {
      score -= 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private analyzeComplexity(message: string): number {
    const wordCount = message.split(/\s+/).length;
    const sentenceCount = message.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    // Complexity based on length and structure
    let complexity = 0.3; // Base complexity
    
    if (wordCount > 50) complexity += 0.2;
    if (wordCount > 100) complexity += 0.2;
    if (avgWordsPerSentence > 15) complexity += 0.2;
    if (message.includes('because') || message.includes('however') || message.includes('therefore')) {
      complexity += 0.1;
    }
    
    return Math.min(1, complexity);
  }

  private analyzeUrgency(message: string): number {
    const lowerMessage = message.toLowerCase();
    let urgency = 0.3; // Base urgency
    
    if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('immediately')) {
      urgency += 0.4;
    }
    if (lowerMessage.includes('soon') || lowerMessage.includes('quickly') || lowerMessage.includes('fast')) {
      urgency += 0.2;
    }
    if (lowerMessage.includes('deadline') || lowerMessage.includes('due')) {
      urgency += 0.3;
    }
    if (lowerMessage.includes('emergency') || lowerMessage.includes('critical')) {
      urgency += 0.5;
    }
    
    return Math.min(1, urgency);
  }
}
