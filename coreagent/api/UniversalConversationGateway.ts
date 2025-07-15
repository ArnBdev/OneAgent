/**
 * Enhanced ChatAPI - Universal Conversation Gateway
 * 
 * Extends the existing ChatAPI to become the unified conversation system
 * that handles user-to-agent AND agent-to-agent communication using
 * the same pathways for architectural cohesion.
 */

import { Request, Response } from 'express';
import { IMemoryClient, AgentType } from '../types/oneagent-backbone-types';
import { AgentFactory } from '../agents/base/AgentFactory';
import { ISpecializedAgent } from '../agents/base/ISpecializedAgent';
import { AgentContext, AgentResponse } from '../agents/base/BaseAgent';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

export interface ConversationParticipant {
  id: string;
  type: 'user' | 'agent';
  name: string;
  agentType?: AgentType;
}

export interface ConversationMessage {
  id: string;
  fromParticipant: ConversationParticipant;
  toParticipant?: ConversationParticipant;
  content: string;
  timestamp: Date;
  conversationId: string;
  metadata: {
    confidence?: number;
    reasoning?: string;
    memoryRelevance?: number;
    qualityScore?: number;
  };
}

export interface ConversationRequest {
  fromParticipant: ConversationParticipant;
  content: string;
  conversationId?: string;
  toParticipant?: ConversationParticipant;
  userId: string;
}

export interface ConversationResponse {
  message: ConversationMessage;
  success: boolean;
  error?: string;
}

/**
 * Enhanced ChatAPI - Now serves as Universal Conversation Gateway
 * 
 * This enhances the existing ChatAPI to support:
 * 1. User to Agent conversations (existing functionality)
 * 2. Agent to Agent conversations (new - using same pathways)
 * 3. Multi-agent team meetings (orchestrated conversations)
 * 4. Agent handoffs (conversation transfer)
 */
export class EnhancedChatAPI {
  private unifiedMemoryClient: IMemoryClient;

  constructor(unifiedMemoryClient: IMemoryClient) {
    this.unifiedMemoryClient = unifiedMemoryClient;
  }

  /**
   * Enhanced message processing for universal conversations
   * This method now handles BOTH user-to-agent AND agent-to-agent communication
   */
  async processUniversalMessage(request: ConversationRequest): Promise<ConversationResponse> {
    try {
      const messageId = this.generateMessageId();
      const conversationId = request.conversationId || this.generateConversationId();      // Create the message
      const message: ConversationMessage = {
        id: messageId,
        fromParticipant: request.fromParticipant,
        ...(request.toParticipant && { toParticipant: request.toParticipant }),
        content: request.content,
        timestamp: new Date(createUnifiedTimestamp().utc),
        conversationId: conversationId,
        metadata: {
          confidence: 1.0,
          qualityScore: 0.8
        }
      };

      // Determine target agent
      const targetAgent = await this.selectTargetAgent(request);      // Process through agent using existing CoreAgent.processMessage pathway
      const agentContext: AgentContext = {
        user: { 
          id: request.userId, 
          name: 'User',
          createdAt: createUnifiedTimestamp().iso,
          lastActiveAt: createUnifiedTimestamp().iso
        },
        sessionId: request.conversationId || messageId,
        conversationHistory: [],
        metadata: {
          fromParticipant: request.fromParticipant,
          messageId: messageId
        }
      };      
      const agentResponse = await (targetAgent as ISpecializedAgent).processMessage(agentContext, request.content);

      // Store conversation in memory using existing memory system
      await this.storeUniversalConversation(message, agentResponse, request.userId);

      // Create response metadata with proper typing
      const responseMetadata: ConversationMessage['metadata'] = {
        confidence: (agentResponse.metadata?.confidence as number) || 0.8,
        qualityScore: (agentResponse.metadata?.qualityScore as number) || 0.8
      };
      
      // Add reasoning if it exists
      if (agentResponse.metadata?.reasoning) {
        responseMetadata.reasoning = agentResponse.metadata.reasoning as string;
      }

      // Create response message
      const responseMessage: ConversationMessage = {
        id: this.generateMessageId(),
        fromParticipant: {
          id: 'coreagent',
          type: 'agent',
          name: targetAgent.constructor.name,
          agentType: this.extractAgentType(targetAgent)
        },
        toParticipant: request.fromParticipant,
        content: agentResponse.content,
        timestamp: new Date(createUnifiedTimestamp().utc),
        conversationId: conversationId,
        metadata: responseMetadata
      };

      return {
        message: responseMessage,
        success: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        message: {
          id: this.generateMessageId(),
          fromParticipant: { id: 'system', type: 'agent', name: 'System' },
          content: 'I apologize, but I encountered an error processing your message.',
          timestamp: new Date(createUnifiedTimestamp().utc),
          conversationId: request.conversationId || 'error',
          metadata: { qualityScore: 0.0 }
        },
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Agent-to-Agent communication using the same infrastructure
   * This enables agents to communicate naturally with each other
   */
  async sendAgentMessage(
    fromAgentType: string,
    toAgentType: string,
    content: string,
    userId: string,
    conversationId?: string
  ): Promise<ConversationResponse> {
    const allowedAgentTypes: AgentType[] = [
      'general', 'coding', 'research', 'analysis', 'creative', 'specialist', 'coordinator', 'validator', 'development', 'office', 'fitness', 'core', 'triage'
    ];
    const safeFromType: AgentType = allowedAgentTypes.includes(fromAgentType as AgentType)
      ? (fromAgentType as AgentType)
      : 'general';
    const safeToType: AgentType = allowedAgentTypes.includes(toAgentType as AgentType)
      ? (toAgentType as AgentType)
      : 'general';
    const fromParticipant: ConversationParticipant = {
      id: fromAgentType,
      type: 'agent',
      name: `${fromAgentType.charAt(0).toUpperCase() + fromAgentType.slice(1)}Agent`,
      agentType: safeFromType
    };
    const toParticipant: ConversationParticipant = {
      id: toAgentType,
      type: 'agent',
      name: `${toAgentType.charAt(0).toUpperCase() + toAgentType.slice(1)}Agent`,
      agentType: safeToType
    };
    return this.processUniversalMessage({
      fromParticipant,
      toParticipant,
      content,
      ...(conversationId && { conversationId }),
      userId
    });
  }

  /**
   * Team meeting orchestration using the same conversation pathways
   */
  async conductTeamMeeting(
    topic: string,
    participantAgentTypes: string[],
    userId: string,
    facilitator: string = 'core'
  ): Promise<ConversationMessage[]> {
    
    const conversationId = this.generateConversationId();
    const responses: ConversationMessage[] = [];

    // Facilitator introduces the topic
    const introResponse = await this.sendAgentMessage(
      facilitator,
      'team',
      `Let's begin our team meeting about: ${topic}. I'd like to hear perspectives from each team member.`,
      userId,
      conversationId
    );
    
    if (introResponse.success) {
      responses.push(introResponse.message);
    }

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
        
        if (agentResponse.success) {
          responses.push(agentResponse.message);
        }
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
    
    if (synthesisResponse.success) {
      responses.push(synthesisResponse.message);
    }

    return responses;
  }

  /**
   * Existing HTTP endpoint compatibility
   */
  async handleChatMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, userId } = req.body;

      if (!message || !userId) {
        res.status(400).json({
          error: 'Missing required fields: message and userId'
        });
        return;
      }

      const userParticipant: ConversationParticipant = {
        id: userId,
        type: 'user',
        name: `User ${userId}`
      };

      const response = await this.processUniversalMessage({
        fromParticipant: userParticipant,
        content: message,
        userId
      });

      res.json({
        response: response.message.content,
        agentType: response.message.fromParticipant.agentType || 'core',
        success: response.success,
        error: response.error
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        response: 'I apologize, but I encountered an error processing your message.',
        agentType: 'error',
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * Select the appropriate agent to handle the message
   */
  private async selectTargetAgent(request: ConversationRequest): Promise<ISpecializedAgent> {
    // If directed to specific agent, try to create that agent
    if (request.toParticipant?.agentType) {
      try {
        // Only allow valid AgentType values
        const allowedAgentTypes: AgentType[] = [
          'general', 'coding', 'research', 'analysis', 'creative', 'specialist', 'coordinator', 'validator', 'development', 'office', 'fitness', 'core', 'triage'
        ];
        const requestedType = request.toParticipant.agentType;
        const agentType: AgentType = allowedAgentTypes.includes(requestedType as AgentType)
          ? (requestedType as AgentType)
          : 'general';
        return AgentFactory.createAgent({
          type: agentType,
          id: `${requestedType}_${createUnifiedTimestamp().unix}`,
          name: request.toParticipant.name,
          memoryEnabled: true,
          aiEnabled: true,
          userId: request.userId
        });
      } catch {
        // Fallback to general agent if specific agent can't be created
        return AgentFactory.createAgent({
          type: 'general',
          id: `fallback_${createUnifiedTimestamp().unix}`,
          name: 'FallbackAgent',
          memoryEnabled: true,
          aiEnabled: true,
          userId: request.userId
        });
      }
    }

    // Default to a general agent for routing and general processing
    return AgentFactory.createAgent({
      type: 'general',
      id: `default_${createUnifiedTimestamp().unix}`,
      name: 'DefaultAgent',
      memoryEnabled: true,
      aiEnabled: true,
      userId: request.userId
    });
  }

  /**
   * Store conversation using existing memory system
   */
  private async storeUniversalConversation(
    message: ConversationMessage,
    agentResponse: AgentResponse,
    userId: string
  ): Promise<void> {
    
    const conversationText = `${message.fromParticipant.name}: ${message.content}\n` +
                           `${agentResponse.metadata?.agentType || 'Agent'}: ${agentResponse.content}`;

    await this.unifiedMemoryClient.store(
      conversationText,
      {
        userId: userId,
        timestamp: message.timestamp,
        category: 'universal_conversation',
        tags: [message.fromParticipant.type, 'agent'],
        importance: 'medium',
        constitutionallyValidated: true,
        sensitivityLevel: 'internal',
        relevanceScore: 1.0,
        confidenceScore: 1.0,
        sourceReliability: 1.0
      }
    );
  }

  /**
   * Extract agent type from agent instance
   */
  private extractAgentType(agent: ISpecializedAgent): AgentType {
    const className = agent.constructor.name.toLowerCase();
    const allowedAgentTypes: AgentType[] = [
      'general', 'coding', 'research', 'analysis', 'creative', 'specialist', 'coordinator', 'validator', 'development', 'office', 'fitness', 'core', 'triage'
    ];
    const typeGuess = className.replace('agent', '');
    return (allowedAgentTypes.includes(typeGuess as AgentType) ? (typeGuess as AgentType) : 'general');
  }

  // Utility methods
  private generateConversationId(): string {
    return `conv_${createUnifiedTimestamp().unix}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${createUnifiedTimestamp().unix}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
