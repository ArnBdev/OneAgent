/**
 * Enhanced ChatAPI - Universal Conversation Gateway (Canonical Version)
 *
 * Unified conversation system handling:
 * 1. User -> Agent conversations
 * 2. Agent -> Agent conversations
 * 3. Multi-agent team meetings
 * 4. Agent handoffs / transfers
 *
 * Canonical Compliance:
 * - IDs via createUnifiedId
 * - Time via createUnifiedTimestamp
 * - Metadata via unifiedMetadataService
 */

import { Request, Response } from 'express';
import type { IMemoryClient } from '../types/oneagent-backbone-types';
import { AgentType } from '../types/oneagent-backbone-types';
import { AgentFactory } from '../agents/base/AgentFactory';
import { ISpecializedAgent } from '../agents/base/ISpecializedAgent';
import { AgentContext, AgentResponse } from '../agents/base/BaseAgent';
import { createUnifiedTimestamp, unifiedMetadataService, createUnifiedId } from '../utils/UnifiedBackboneService';

export interface ConversationParticipant {
  id: string;
  type: 'user' | 'agent' | 'system' | 'team';
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
    [key: string]: unknown;
  };
}

export interface ConversationRequest {
  fromParticipant: ConversationParticipant;
  toParticipant?: ConversationParticipant;
  content: string;
  userId: string;
  conversationId?: string;
}

export interface ConversationResponse {
  message: ConversationMessage;
  success: boolean;
  error?: string;
}

export class EnhancedChatAPI {
  private unifiedMemoryClient: IMemoryClient;

  constructor(unifiedMemoryClient: IMemoryClient) {
    this.unifiedMemoryClient = unifiedMemoryClient;
  }

  /**
   * Universal message processing (user <-> agent, agent <-> agent)
   */
  async processUniversalMessage(request: ConversationRequest): Promise<ConversationResponse> {
    try {
      const messageId = this.generateMessageId();
      const conversationId = request.conversationId || this.generateConversationId();
      const ts = createUnifiedTimestamp();

      // Incoming message
      const message: ConversationMessage = {
        id: messageId,
        fromParticipant: request.fromParticipant,
        ...(request.toParticipant && { toParticipant: request.toParticipant }),
        content: request.content,
        timestamp: new Date(ts.utc),
        conversationId,
        metadata: {
          confidence: 1.0,
          qualityScore: 0.8
        }
      };

      // Route to appropriate agent
      const targetAgent = await this.selectTargetAgent(request);

      const agentContext: AgentContext = {
        user: {
          id: request.userId,
          name: 'User',
          createdAt: ts.iso,
          lastActiveAt: ts.iso
        },
        sessionId: conversationId,
        conversationHistory: [],
        metadata: {
          fromParticipant: request.fromParticipant,
          messageId
        }
      };

      const agentResponse = await (targetAgent as ISpecializedAgent).processMessage(agentContext, request.content);

      // Persist conversation pair
      await this.storeUniversalConversation(message, agentResponse, request.userId);

      const responseTs = createUnifiedTimestamp();
      const responseMetadata: ConversationMessage['metadata'] = {
        confidence: (agentResponse.metadata?.confidence as number) || 0.8,
        qualityScore: (agentResponse.metadata?.qualityScore as number) || 0.8
      };
      if (agentResponse.metadata?.reasoning) {
        responseMetadata.reasoning = agentResponse.metadata.reasoning as string;
      }

      const responseMessage: ConversationMessage = {
        id: this.generateMessageId(),
        fromParticipant: {
          id: 'coreagent',
          type: 'agent',
            // Keep original class name for traceability
          name: targetAgent.constructor.name,
          agentType: this.extractAgentType(targetAgent)
        },
        toParticipant: request.fromParticipant,
        content: agentResponse.content,
        timestamp: new Date(responseTs.utc),
        conversationId,
        metadata: responseMetadata
      };

      return { message: responseMessage, success: true };
    } catch (error) {
      const ts = createUnifiedTimestamp();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        message: {
          id: this.generateMessageId(),
          fromParticipant: { id: 'system', type: 'system', name: 'System' },
          content: 'I encountered an error processing your message.',
          timestamp: new Date(ts.utc),
          conversationId: request.conversationId || 'error',
          metadata: { qualityScore: 0.0 }
        },
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Agent -> Agent message
   */
  async sendAgentMessage(
    fromAgentType: string,
    toAgentType: string,
    content: string,
    userId: string,
    conversationId?: string
  ): Promise<ConversationResponse> {
    const allowedAgentTypes: AgentType[] = [
      'general','coding','research','analysis','creative','specialist','coordinator','validator','development','office','fitness','core','triage'
    ];

    const safeFrom: AgentType = allowedAgentTypes.includes(fromAgentType as AgentType) ? fromAgentType as AgentType : 'general';
    const safeTo: AgentType = allowedAgentTypes.includes(toAgentType as AgentType) ? toAgentType as AgentType : 'general';

    const fromParticipant: ConversationParticipant = {
      id: fromAgentType,
      type: 'agent',
      name: `${fromAgentType.charAt(0).toUpperCase() + fromAgentType.slice(1)}Agent`,
      agentType: safeFrom
    };
    const toParticipant: ConversationParticipant = {
      id: toAgentType,
      type: 'agent',
      name: `${toAgentType.charAt(0).toUpperCase() + toAgentType.slice(1)}Agent`,
      agentType: safeTo
    };

    return this.processUniversalMessage({
      fromParticipant,
      toParticipant,
      content,
      userId,
      ...(conversationId && { conversationId })
    });
  }

  /**
   * Conduct a multi-agent team meeting
   */
  async conductTeamMeeting(
    topic: string,
    participantAgentTypes: string[],
    userId: string,
    facilitator: string = 'core'
  ): Promise<ConversationMessage[]> {
    const conversationId = this.generateConversationId();
    const responses: ConversationMessage[] = [];

    const intro = await this.sendAgentMessage(
      facilitator,
      'team',
      `Team meeting topic: ${topic}. Please provide your perspectives.`,
      userId,
      conversationId
    );
    if (intro.success) responses.push(intro.message);

    for (const agentType of participantAgentTypes) {
      if (agentType !== facilitator) {
        const contrib = await this.sendAgentMessage(
          agentType,
          'team',
          `Perspective from ${agentType} on ${topic}...`,
          userId,
          conversationId
        );
        if (contrib.success) responses.push(contrib.message);
      }
    }

    const synthesis = await this.sendAgentMessage(
      facilitator,
      'team',
      `Synthesis of team perspectives on ${topic}...`,
      userId,
      conversationId
    );
    if (synthesis.success) responses.push(synthesis.message);

    return responses;
  }

  /**
   * HTTP compatibility endpoint
   */
  async handleChatMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, userId } = req.body;
      if (!message || !userId) {
        res.status(400).json({ error: 'Missing required fields: message and userId' });
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
        response: 'Error processing message.',
        agentType: 'error',
        success: false,
        error: errorMessage
      });
    }
  }

  /**
   * Agent selection routing
   */
  private async selectTargetAgent(request: ConversationRequest): Promise<ISpecializedAgent> {
    if (request.toParticipant?.agentType) {
      try {
        return AgentFactory.createAgent({
          type: request.toParticipant.agentType,
          id: createUnifiedId('agent', request.toParticipant.agentType),
          name: request.toParticipant.name,
          memoryEnabled: true,
            aiEnabled: true,
          userId: request.userId
        });
      } catch {
        // Fallback
      }
    }
    return AgentFactory.createAgent({
      type: 'general',
      id: createUnifiedId('agent', 'general'),
      name: 'DefaultAgent',
      memoryEnabled: true,
      aiEnabled: true,
      userId: request.userId
    });
  }

  /**
   * Persist conversation pair to memory (message + agent response summary)
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
      unifiedMetadataService.create('memory', 'UniversalConversationGateway', {
        system: {
          source: 'UniversalConversationGateway',
          component: 'conversation-system',
          userId
        },
        content: {
          category: 'universal_conversation',
          tags: [message.fromParticipant.type, 'agent'],
          sensitivity: 'internal',
          relevanceScore: 1.0,
          contextDependency: 'session'
        },
        quality: {
          score: 1.0,
          confidence: 1.0,
          constitutionalCompliant: true,
          validationLevel: 'enhanced'
        }
      })
    );
  }

  private extractAgentType(agent: ISpecializedAgent): AgentType {
    const className = agent.constructor.name.toLowerCase();
    const allowed: AgentType[] = [
      'general','coding','research','analysis','creative','specialist','coordinator','validator','development','office','fitness','core','triage'
    ];
    const guess = className.replace('agent','');
    return allowed.includes(guess as AgentType) ? guess as AgentType : 'general';
  }

  // Canonical ID helpers
  private generateConversationId(): string {
    return createUnifiedId('conversation', 'gateway');
  }
  private generateMessageId(): string {
    return createUnifiedId('message', 'gateway');
  }
}
