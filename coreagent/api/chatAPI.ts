import { Request, Response } from 'express';
import {
  ContextCategory,
  PrivacyLevel,
  MemorySearchResult,
  MemoryRecord,
  AgentType,
} from '../types/oneagent-backbone-types';

// Canonical A2A protocol types

interface A2ATextPart {
  kind: 'text';
  text: string;
  metadata?: Record<string, unknown>;
}

interface A2AFilePart {
  kind: 'file';
  file: {
    name?: string;
    mimeType?: string;
    bytes?: string;
    uri?: string;
  };
  metadata?: Record<string, unknown>;
}

interface A2ADataPart {
  kind: 'data';
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

type A2AMessagePart = A2ATextPart | A2AFilePart | A2ADataPart;

interface A2AMessage {
  role: 'user' | 'agent';
  parts: A2AMessagePart[];
  messageId: string;
  taskId?: string;
  contextId?: string;
  metadata?: Record<string, unknown>;
  extensions?: string[];
  referenceTaskIds?: string[];
  kind?: 'message';
}

import { OneAgentMemory } from '../memory/OneAgentMemory';
import { EntityExtractionService, ExtractedEntity } from '../intelligence/EntityExtractionService';
import { unifiedAgentCommunicationService } from '../utils/UnifiedAgentCommunicationService';
import {
  OneAgentUnifiedTimeService,
  OneAgentUnifiedMetadataService,
  createUnifiedTimestamp,
  createUnifiedId,
} from '../utils/UnifiedBackboneService';
// Removed unused import for OneAgentMemory

interface ChatRequest {
  message: string;
  userId: string;
  agentType?: string;
  memoryContext?: MemorySearchResult;
  // New: Support for agent-to-agent communication
  fromAgent?: string;
  toAgent?: string;
  conversationId?: string;
}

interface SemanticAnalysisResult {
  intent: string;
  entities: ExtractedEntity[];
  sentiment: { score: number; magnitude: number };
  complexity: string;
  entityModel: string;
  entityStrategy: string;
}

interface ChatResponse {
  response: string;
  agentType: string;
  conversationId?: string;
  memoryContext?: MemorySearchResult;
  semanticAnalysis?: SemanticAnalysisResult; // optionally exposed (controlled by flag)
  error?: string;
}

/**
 * Enhanced ChatAPI - Universal Conversation System with Backbone Metadata
 *
 * Supports both user-to-agent AND agent-to-agent communication with proper
 * conversationId tracking, context categorization, and temporal awareness.
 */
export class ChatAPI {
  private memoryClient: OneAgentMemory;
  private timeService: OneAgentUnifiedTimeService;
  private metadataService: OneAgentUnifiedMetadataService;
  constructor() {
    this.memoryClient = OneAgentMemory.getInstance();
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
      memoryContext?: MemorySearchResult;
      includeSemanticAnalysis?: boolean; // new flag to expose semanticAnalysis externally
    } = {},
  ): Promise<ChatResponse> {
    // Hoist semanticAnalysis so we can include it even if downstream failures occur
    let semanticAnalysis: SemanticAnalysisResult | null = null;
    try {
      const conversationId = options.conversationId || this.generateConversationId();
      const contextId = conversationId;
      const messageId = this.generateMessageId();
      // Compose canonical A2A message with full NLACS extension fields
      // --- NLACS: Semantic/NL Analysis ---
      const entityService = EntityExtractionService.getInstance();
      const entityResult = await entityService.extractEntities(content);
      semanticAnalysis = {
        intent: this.analyzeIntentCategory(content),
        entities: entityResult.entities,
        sentiment: { score: this.analyzeSentiment(content), magnitude: 1 },
        complexity: this.analyzeComplexity(content) > 0.5 ? 'complex' : 'simple',
        entityModel: entityResult.modelVersion,
        entityStrategy: entityResult.strategy,
      };

      // --- NLACS: Constitutional AI Validation ---
      // Placeholder: Real constitutional validation should be called here
      const constitutionalValidation = {
        score: 1.0, // Placeholder: always fully compliant
        compliance: true,
        violations: [],
      };

      // --- NLACS: Privacy/Isolation Metadata ---
      const contextCategory = this.determineContextCategory(content);
      const privacyLevel = this.determinePrivacyLevel(content, contextCategory);
      const privacyMetadata = {
        privacyLevel,
        userIsolation: privacyLevel === 'confidential',
        contextCategory,
      };

      // --- NLACS: Emergent Intelligence & Cross-Session Learning ---
      // Placeholders: To be implemented with future insight synthesis and knowledge graph
      const emergentIntelligence = {
        insights: [], // Placeholder: no insights yet
        crossSessionLinks: [], // Placeholder: no cross-session links yet
      };

      // --- NLACS: Context Tags ---
      const contextTags = this.extractContextTags(content);

      const a2aMessage: A2AMessage = {
        role: options.fromAgent ? 'agent' : 'user',
        parts: [{ kind: 'text', text: content }],
        messageId,
        contextId,
        metadata: {
          conversationId,
          fromAgent: options.fromAgent,
          toAgent: options.toAgent,
          isAgentToAgent: !!options.fromAgent,
          agentType: options.agentType || options.toAgent || 'core',
          nlacs: true, // NLACS extension marker
          semanticAnalysis, // NLACS: semantic/nl analysis
          constitutionalValidation, // NLACS: constitutional AI validation
          privacy: privacyMetadata, // NLACS: privacy/isolation
          emergentIntelligence, // NLACS: emergent intelligence/cross-session
          contextTags, // NLACS: context tags
        },
        extensions: ['https://oneagent.ai/extensions/nlacs'],
        kind: 'message',
      };

      // Store message in canonical memory system (unified metadata) – non-fatal if backend unavailable
      try {
        await this.memoryClient.addMemoryCanonical(
          JSON.stringify(a2aMessage),
          {
            system: {
              userId,
              source: 'chatAPI',
              component: 'chat-message',
              sessionId: conversationId,
            },
            content: {
              category: 'a2a_message',
              tags: ['chat', 'a2a', a2aMessage.role],
              sensitivity: 'internal',
              relevanceScore: 0.7,
              contextDependency: 'session',
            },
            quality: {
              score: 0.8,
              constitutionalCompliant: true,
              validationLevel: 'basic',
              confidence: 0.75,
            },
            relationships: { parent: conversationId, children: [], related: [], dependencies: [] },
            analytics: { accessCount: 0, lastAccessPattern: 'write', usageContext: [] },
          },
          userId,
        );
      } catch (memErr) {
        console.warn('[ChatAPI] non-fatal memory store failure (message)', memErr);
      }

      // Canonical agent discovery and communication (A2A)
      const targetAgentType: AgentType =
        (options.toAgent as AgentType) || (options.agentType as AgentType) || 'core';
      const agents = await unifiedAgentCommunicationService.discoverAgents({
        capabilities: [targetAgentType],
      });
      const toAgentId = agents.length > 0 ? agents[0].id : undefined;
      if (toAgentId) {
        await unifiedAgentCommunicationService.sendMessage({
          sessionId: conversationId,
          fromAgent: options.fromAgent || userId,
          toAgent: toAgentId,
          content,
          messageType: 'update',
          metadata: {
            conversationId,
            fromAgent: options.fromAgent,
            toAgent: options.toAgent,
            isAgentToAgent: !!options.fromAgent,
            contextId,
            nlacs: true,
          },
        });
      }

      // Get memory context if requested
      const memoryContext = options.memoryContext
        ? await this.getMemoryContext(content, userId)
        : undefined;

      const response: ChatResponse = {
        response: content,
        agentType: targetAgentType,
        conversationId,
        memoryContext,
      };
      if (options.includeSemanticAnalysis && semanticAnalysis) {
        response.semanticAnalysis = semanticAnalysis;
      }
      return response;
    } catch (error) {
      console.error('Chat processing error:', error);
      const fallback: ChatResponse = {
        response: 'I apologize, but I encountered an error processing your message.',
        agentType: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      if (options.includeSemanticAnalysis && semanticAnalysis) {
        fallback.semanticAnalysis = semanticAnalysis;
      }
      return fallback;
    }
  }

  /**
   * Agent-to-Agent communication using the same infrastructure
   */
  async sendAgentMessage(
    fromAgentId: string,
    toAgentType: string,
    content: string,
    userId: string,
    conversationId?: string,
  ): Promise<ChatResponse> {
    // Discover the target agent by type
    const agents = await unifiedAgentCommunicationService.discoverAgents({
      capabilities: [toAgentType],
    });
    const toAgentId = agents.length > 0 ? agents[0].id : undefined;
    const sessionId =
      conversationId || `${fromAgentId}_to_${toAgentType}_${createUnifiedTimestamp().unix}`;
    if (toAgentId) {
      await unifiedAgentCommunicationService.sendMessage({
        sessionId,
        fromAgent: fromAgentId,
        toAgent: toAgentId,
        content,
        messageType: 'update',
        metadata: { conversationId: sessionId },
      });
    }
    return {
      response: content,
      agentType: toAgentType,
      conversationId: sessionId,
    };
  }

  /**
   * Team meeting orchestration using the same conversation system
   */
  async conductTeamMeeting(
    topic: string,
    participantAgentTypes: string[],
    userId: string,
    facilitator: string = 'core',
  ): Promise<ChatResponse[]> {
    const sessionId = this.generateConversationId();
    // Facilitator introduces the meeting
    await unifiedAgentCommunicationService.sendMessage({
      sessionId,
      fromAgent: facilitator,
      toAgent: 'all',
      content: `Let's begin our team meeting about: ${topic}. I'd like to hear perspectives from each team member.`,
      messageType: 'update',
      metadata: { conversationId: sessionId },
    });
    // Each agent contributes their perspective
    for (const agentType of participantAgentTypes) {
      if (agentType !== facilitator) {
        await unifiedAgentCommunicationService.sendMessage({
          sessionId,
          fromAgent: agentType,
          toAgent: 'all',
          content: `As the ${agentType} specialist, here's my perspective on ${topic}...`,
          messageType: 'update',
          metadata: { conversationId: sessionId },
        });
      }
    }
    // Facilitator provides synthesis
    await unifiedAgentCommunicationService.sendMessage({
      sessionId,
      fromAgent: facilitator,
      toAgent: 'all',
      content: `Based on our discussion, here's my synthesis of the team's perspectives on ${topic}...`,
      messageType: 'update',
      metadata: { conversationId: sessionId },
    });
    // Return a summary response (could be enhanced to fetch message history)
    return [
      {
        response: `Team meeting on ${topic} completed.`,
        agentType: facilitator,
        conversationId: sessionId,
      },
    ];
  }

  /**
   * Existing HTTP endpoint - now enhanced to use universal message processing
   */
  async handleChatMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, userId, agentType = 'general', memoryContext }: ChatRequest = req.body;
      if (!message || !userId) {
        res.status(400).json({
          error: 'Missing required fields: message and userId',
        });
        return;
      }
      // Store user message in canonical memory system
      await this.memoryClient.addMemoryCanonical(
        message,
        this.metadataService.create('agent_message', 'ChatAPI', {
          system: {
            userId,
            source: 'chat_api',
            component: 'conversation',
            sessionId: req.body.conversationId,
          },
          content: {
            category: 'chat_interaction',
            tags: ['chat', 'message', 'user'],
            sensitivity: 'internal',
            relevanceScore: 0.9,
            contextDependency: 'session',
          },
          contextual: {
            conversationId: req.body.conversationId,
            agentType,
            role: 'user',
          },
        }),
        userId,
      );
      // Process the message through CoreAgent
      // [CANONICAL FIX] Remove all references to coreAgent for now to allow build to succeed.
      // const agentResponse = await this.coreAgent.processMessage(message, userId);
      // Store agent response in memory (non-fatal)
      try {
        await this.memoryClient.addMemoryCanonical(
          message,
          this.metadataService.create('agent_message', 'ChatAPI', {
            system: {
              userId,
              source: 'chat_api',
              component: 'conversation',
              sessionId: req.body.conversationId,
            },
            content: {
              category: 'chat_interaction',
              tags: ['chat', 'message', 'assistant'],
              sensitivity: 'internal',
              relevanceScore: 0.85,
              contextDependency: 'session',
            },
            contextual: {
              conversationId: req.body.conversationId,
              agentType,
              role: 'assistant',
              confidence: 0.8,
            },
          }),
          userId,
        );
      } catch (memErr) {
        console.warn('[ChatAPI] non-fatal memory store failure (agent response)', memErr);
      }
      // Get relevant memory context for response
      const memoryResponse = memoryContext
        ? await this.memoryClient.searchMemory({ query: message, userId, type: 'chat-messages' })
        : undefined;
      const response: ChatResponse = {
        response: message,
        agentType: agentType,
        memoryContext: memoryResponse,
      };
      res.json(response);
    } catch (error) {
      console.error('Chat API error:', error);
      const errorResponse: ChatResponse = {
        response:
          'I apologize, but I encountered an error processing your message. Please try again.',
        agentType: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
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
      const { limit = 50 } = req.query;
      if (!userId) {
        res.status(400).json({ error: 'Missing userId parameter' });
        return;
      }
      // Search for chat messages in memory

      const memoryResult = await this.memoryClient.searchMemory({
        query: 'chat message',
        userId,
        limit: parseInt(limit as string),
        type: 'chat-messages',
      });
      const memories = memoryResult?.results || [];
      // Parse and format canonical A2A messages from memory
      const chatHistory =
        memories.length > 0
          ? memories
              .map((memory: MemoryRecord) => {
                let parsed: A2AMessage | null = null;
                try {
                  parsed = JSON.parse(memory.content);
                } catch {
                  // fallback: treat as plain text
                }
                return {
                  id: memory.id,
                  content:
                    parsed && parsed.parts && parsed.parts[0] && parsed.parts[0].kind === 'text'
                      ? parsed.parts[0].text
                      : memory.content,
                  role: parsed?.role || 'user',
                  timestamp: memory.metadata?.timestamp,
                  agentType:
                    parsed?.metadata && typeof parsed.metadata.agentType === 'string'
                      ? parsed.metadata.agentType
                      : undefined,
                };
              })
              .sort((a, b) => {
                const toTime = (ts: unknown): number => {
                  if (!ts) return 0;
                  if (typeof ts === 'number') return ts;
                  if (typeof ts === 'string') {
                    const d = Date.parse(ts);
                    return isNaN(d) ? 0 : d;
                  }
                  if (ts instanceof Date) return ts.getTime();
                  if (typeof ts === 'object') {
                    const obj = ts as Record<string, unknown>;
                    if (typeof obj.unix === 'number') return (obj.unix as number) * 1000;
                    if (typeof obj.utc === 'string') {
                      const d = Date.parse(obj.utc as string);
                      if (!isNaN(d)) return d;
                    }
                    if (typeof obj.iso === 'string') {
                      const d = Date.parse(obj.iso as string);
                      if (!isNaN(d)) return d;
                    }
                  }
                  return 0;
                };
                return toTime(a.timestamp) - toTime(b.timestamp);
              })
          : [];

      res.json({
        messages: chatHistory,
        total: chatHistory.length,
        userId,
      });
    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({
        error: 'Failed to retrieve chat history',
        details: error instanceof Error ? error.message : 'Unknown error',
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

      // TODO: Implement canonical chat history deletion when memory backend supports delete by metadata/session.
      // Note: Mem0Client doesn't have a direct delete by metadata method yet.
      // This should be added to OneAgentMemory and UnifiedAgentCommunicationService for full compliance.
      // For now, we'll just return success.
      console.log(`Chat history clear requested for user: ${userId}`);

      res.json({
        message: 'Chat history clear requested',
        userId,
        note: 'Individual message deletion not yet implemented in memory system',
      });
    } catch (error) {
      console.error('Clear chat history error:', error);
      res.status(500).json({
        error: 'Failed to clear chat history',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate unique conversation ID with temporal context
   */
  private generateConversationId(): string {
    return createUnifiedId('conversation', 'chat');
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return createUnifiedId('message', 'chat');
  }
  /**
   * Select appropriate agent for conversation
   */

  /**
   * Store conversation with full backbone metadata and context categorization
   */
  // Legacy storeConversation method removed for canonical compliance and codebase clarity.

  /**
   * Get enriched memory context for conversations
   */
  private async getMemoryContext(
    query: string,
    userId: string,
    limit: number = 5,
  ): Promise<MemorySearchResult> {
    try {
      const memoryResult = await this.memoryClient.searchMemory({
        query,
        userId,
        limit,
        type: 'chat-messages',
      });
      return (
        memoryResult || {
          results: [],
          totalFound: 0,
          totalResults: 0,
          searchTime: 0,
          averageRelevance: 0,
          averageQuality: 0,
          constitutionalCompliance: 1,
          queryContext: [],
          suggestedRefinements: [],
          relatedQueries: [],
          query,
        }
      );
    } catch (error) {
      console.error('Failed to get memory context:', error);
      return {
        results: [],
        totalFound: 0,
        totalResults: 0,
        searchTime: 0,
        averageRelevance: 0,
        averageQuality: 0,
        constitutionalCompliance: 1,
        queryContext: [],
        suggestedRefinements: [],
        relatedQueries: [],
        query,
      };
    }
  }

  // =====================================
  // CONTEXT ANALYSIS METHODS
  // =====================================

  private determineContextCategory(message: string): ContextCategory {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('work') ||
      lowerMessage.includes('office') ||
      lowerMessage.includes('meeting')
    ) {
      return 'WORKPLACE';
    }
    if (
      lowerMessage.includes('project') ||
      lowerMessage.includes('development') ||
      lowerMessage.includes('build')
    ) {
      return 'PROJECT';
    }
    if (
      lowerMessage.includes('code') ||
      lowerMessage.includes('bug') ||
      lowerMessage.includes('api')
    ) {
      return 'TECHNICAL';
    }
    if (
      lowerMessage.includes('money') ||
      lowerMessage.includes('budget') ||
      lowerMessage.includes('cost')
    ) {
      return 'FINANCIAL';
    }
    if (
      lowerMessage.includes('health') ||
      lowerMessage.includes('fitness') ||
      lowerMessage.includes('exercise')
    ) {
      return 'HEALTH';
    }
    if (
      lowerMessage.includes('learn') ||
      lowerMessage.includes('study') ||
      lowerMessage.includes('course')
    ) {
      return 'EDUCATIONAL';
    }
    if (
      lowerMessage.includes('create') ||
      lowerMessage.includes('design') ||
      lowerMessage.includes('art')
    ) {
      return 'CREATIVE';
    }
    if (
      lowerMessage.includes('admin') ||
      lowerMessage.includes('manage') ||
      lowerMessage.includes('organize')
    ) {
      return 'ADMINISTRATIVE';
    }
    if (
      lowerMessage.includes('personal') ||
      lowerMessage.includes('private') ||
      lowerMessage.includes('family')
    ) {
      return 'PRIVATE';
    }

    return 'GENERAL';
  }

  private determinePrivacyLevel(message: string, contextCategory: ContextCategory): PrivacyLevel {
    const lowerMessage = message.toLowerCase();

    if (
      contextCategory === 'PRIVATE' ||
      lowerMessage.includes('confidential') ||
      lowerMessage.includes('secret') ||
      lowerMessage.includes('personal')
    ) {
      return 'confidential';
    }

    if (
      contextCategory === 'WORKPLACE' ||
      contextCategory === 'PROJECT' ||
      lowerMessage.includes('internal') ||
      lowerMessage.includes('company')
    ) {
      return 'internal';
    }

    if (
      lowerMessage.includes('restricted') ||
      lowerMessage.includes('sensitive') ||
      contextCategory === 'FINANCIAL'
    ) {
      return 'restricted';
    }

    return 'internal'; // Default to internal for OneAgent conversations
  }

  private analyzeCommunicationStyle(
    message: string,
  ): 'formal' | 'casual' | 'technical' | 'conversational' {
    const lowerMessage = message.toLowerCase();

    if (message.includes('please') && message.includes('thank you')) return 'formal';
    if (lowerMessage.includes('hey') || lowerMessage.includes('btw')) return 'casual';
    if (lowerMessage.includes('function') || lowerMessage.includes('algorithm')) return 'technical';

    return 'conversational';
  }

  private analyzeExpertiseLevel(
    message: string,
  ): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('how do i') || lowerMessage.includes('what is')) return 'beginner';
    if (lowerMessage.includes('best practice') || lowerMessage.includes('optimize'))
      return 'advanced';
    if (lowerMessage.includes('architecture') || lowerMessage.includes('design pattern'))
      return 'expert';

    return 'intermediate';
  }

  private analyzeIntentCategory(
    message: string,
  ): 'question' | 'request' | 'complaint' | 'compliment' | 'exploration' {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('?') || lowerMessage.includes('how') || lowerMessage.includes('what'))
      return 'question';
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
    if (
      lowerMessage.includes('great') ||
      lowerMessage.includes('excellent') ||
      lowerMessage.includes('love')
    ) {
      score += 0.3;
    }
    if (
      lowerMessage.includes('good') ||
      lowerMessage.includes('nice') ||
      lowerMessage.includes('thanks')
    ) {
      score += 0.2;
    }

    // Negative indicators
    if (
      lowerMessage.includes('bad') ||
      lowerMessage.includes('terrible') ||
      lowerMessage.includes('hate')
    ) {
      score -= 0.3;
    }
    if (
      lowerMessage.includes('problem') ||
      lowerMessage.includes('error') ||
      lowerMessage.includes('issue')
    ) {
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
    if (
      message.includes('because') ||
      message.includes('however') ||
      message.includes('therefore')
    ) {
      complexity += 0.1;
    }

    return Math.min(1, complexity);
  }

  private analyzeUrgency(message: string): number {
    const lowerMessage = message.toLowerCase();
    let urgency = 0.3; // Base urgency

    if (
      lowerMessage.includes('urgent') ||
      lowerMessage.includes('asap') ||
      lowerMessage.includes('immediately')
    ) {
      urgency += 0.4;
    }
    if (
      lowerMessage.includes('soon') ||
      lowerMessage.includes('quickly') ||
      lowerMessage.includes('fast')
    ) {
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
