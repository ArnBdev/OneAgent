/**
 * MemoryContextBridge - Implementation of memory and conversation context integration
 * 
 * This class bridges memory storage with conversation context to provide
 * enriched context for agent responses and maintain conversation continuity.
 */

import { 
  IMemoryContextBridge,
  EnrichedContext,
  ConversationTurn,
  MemoryContext,
  ConversationSummary,
  UserProfile,
  SessionMetadata,
  MemorySearchResult,
  SearchOptions,
  TimeRange,
  MemoryType
} from './interfaces/IMemoryContextBridge';
import { AgentContext, Message } from '../agents/base/BaseAgent_new';
import { UnifiedMemoryClient } from '../memory/UnifiedMemoryClient';
import { userService } from './userService';

export class MemoryContextBridge implements IMemoryContextBridge {
  private memoryClient: UnifiedMemoryClient;
  private conversationTurns: Map<string, ConversationTurn[]> = new Map();
  private sessionMetadata: Map<string, SessionMetadata> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();

  constructor(memoryClient: UnifiedMemoryClient) {
    this.memoryClient = memoryClient;
  }

  /**
   * Get conversation context enriched with relevant memories
   */
  async getEnrichedContext(userId: string, sessionId: string, currentMessage: string): Promise<EnrichedContext> {
    try {
      // Get base conversation context
      const conversationHistory = this.getSessionConversations(sessionId);
      const baseContext: AgentContext = {
        user: { id: userId, name: 'User', createdAt: new Date().toISOString(), lastActiveAt: new Date().toISOString() },
        sessionId,
        conversationHistory: conversationHistory.map(turn => turn.userMessage),
        memoryContext: []
      };

      // Search for relevant memories
      const relevantMemories = await this.searchRelevantMemories(userId, currentMessage, conversationHistory);

      // Get conversation summary
      const conversationSummary = this.generateConversationSummary(sessionId, conversationHistory);

      // Get or create user profile
      const userProfile = await this.getUserProfile(userId);

      // Get session metadata
      const sessionMetadata = this.getSessionMetadata(sessionId);

      return {
        baseContext,
        relevantMemories,
        conversationSummary,
        userProfile,
        sessionMetadata
      };

    } catch (error) {
      console.error('Error enriching context:', error);
      throw error;
    }
  }

  /**
   * Store conversation turn with context
   */
  async storeConversationTurn(turn: ConversationTurn): Promise<void> {
    try {
      // Store in local conversation history
      if (!this.conversationTurns.has(turn.sessionId)) {
        this.conversationTurns.set(turn.sessionId, []);
      }
      this.conversationTurns.get(turn.sessionId)!.push(turn);      // Store user message in memory
      const conversationMemory1 = {
        id: `${turn.sessionId}-${turn.userMessage.id}`,
        userId: turn.userId,
        agentId: turn.agentId || 'memory-bridge',
        sessionId: turn.sessionId,
        content: turn.userMessage.content,
        timestamp: turn.timestamp,
        context: {
          actionType: 'conversation',
          sessionId: turn.sessionId,
          messageId: turn.userMessage.id
        },
        outcome: {
          success: true,
          satisfaction: 'pending' as const,
          qualityScore: 0.8
        },
        metadata: {
          role: 'user',
          messageId: turn.userMessage.id,
          timestamp: turn.timestamp.toISOString()
        }
      };
      
      await this.memoryClient.storeConversation(conversationMemory1);      // Store agent response in memory if significant
      if (this.isSignificantResponse(turn.agentResponse)) {
        const conversationMemory2 = {
          id: `${turn.sessionId}-${turn.agentResponse.id}`,
          userId: turn.userId,
          agentId: turn.agentId || 'memory-bridge',
          timestamp: turn.timestamp,
          content: turn.agentResponse.content,
          context: {
            actionType: 'conversation',
            sessionId: turn.sessionId,
            messageId: turn.agentResponse.id,
            isAgentResponse: true
          },
          outcome: {
            success: true,
            satisfaction: 'high' as const,
            qualityScore: 0.85
          },
          metadata: {
            role: 'agent',
            messageId: turn.agentResponse.id,
            timestamp: turn.timestamp.toISOString()
          }
        };
        
        await this.memoryClient.storeConversation(conversationMemory2);
      }

      // Update session metadata
      this.updateSessionMetadata(turn.sessionId, turn);

    } catch (error) {
      console.error('Error storing conversation turn:', error);
      throw error;
    }
  }

  /**
   * Retrieve conversation history with memory context
   */
  async getConversationHistory(_userId: string, sessionId: string, limit?: number): Promise<ConversationTurn[]> {
    const turns = this.conversationTurns.get(sessionId) || [];
    
    if (limit) {
      return turns.slice(-limit);
    }
    
    return turns;
  }

  /**
   * Search across conversations and memories
   */  async searchConversationMemories(userId: string, query: string, options?: SearchOptions): Promise<MemorySearchResult[]> {
    try {
      const results: MemorySearchResult[] = [];
      const searchLimit = options?.limit || 10;

      // Search memories
      if (options?.includeMemories !== false) {
        const memoryResults = await this.memoryClient.searchMemories({
          query,
          maxResults: searchLimit,
          semanticSearch: true
        });
        
        for (const memory of memoryResults) {
          results.push({
            type: 'memory',
            content: memory.content,
            relevanceScore: memory.relevanceScore,
            timestamp: memory.timestamp,
            context: memory.metadata || {},
            id: memory.id
          });
        }
      }

      // Search conversations
      if (options?.includeConversations !== false) {
        const conversationResults = this.searchLocalConversations(userId, query, options);
        results.push(...conversationResults);
      }

      // Sort by relevance score and apply limit
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return results.slice(0, searchLimit);

    } catch (error) {
      console.error('Error searching conversation memories:', error);
      return [];
    }
  }

  /**
   * Update memory relevance based on conversation feedback
   */
  async updateMemoryRelevance(memoryId: string, relevanceScore: number): Promise<void> {
    try {
      // For now, we'll store this as metadata in the memory
      // In a full implementation, this would update the memory store directly
      console.log(`Updated memory ${memoryId} relevance to ${relevanceScore}`);
    } catch (error) {
      console.error('Error updating memory relevance:', error);
    }
  }

  /**
   * Get memory context for a specific conversation turn
   */
  async getMemoryContext(_userId: string, messageId: string): Promise<MemoryContext> {
    try {
      // Find the conversation turn with this message
      for (const turns of this.conversationTurns.values()) {
        const turn = turns.find(t => 
          t.userMessage.id === messageId || t.agentResponse.id === messageId
        );
        
        if (turn && turn.memoryContext.length > 0) {
          return turn.memoryContext[0]; // Return first memory context
        }
      }

      // Return empty context if not found
      return {
        memoryId: '',
        content: '',
        relevanceScore: 0,
        memoryType: 'contextual',
        timestamp: new Date(),
        metadata: {}
      };

    } catch (error) {
      console.error('Error getting memory context:', error);
      throw error;
    }
  }

  /**
   * Cleanup old conversation data
   */
  async cleanupOldConversations(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let cleanedCount = 0;

    for (const [sessionId, turns] of this.conversationTurns.entries()) {
      const filteredTurns = turns.filter(turn => turn.timestamp > cutoffDate);
      
      if (filteredTurns.length !== turns.length) {
        cleanedCount += turns.length - filteredTurns.length;
        
        if (filteredTurns.length === 0) {
          this.conversationTurns.delete(sessionId);
          this.sessionMetadata.delete(sessionId);
        } else {
          this.conversationTurns.set(sessionId, filteredTurns);
        }
      }
    }

    console.log(`Cleaned up ${cleanedCount} old conversation turns`);
    return cleanedCount;
  }

  /**
   * Search for relevant memories based on current message and conversation history
   */
  private async searchRelevantMemories(_userId: string, currentMessage: string, conversationHistory: ConversationTurn[]): Promise<MemoryContext[]> {
    const memoryContexts: MemoryContext[] = [];

    try {      // Search based on current message
      const directResults = await this.memoryClient.searchMemories({
        query: currentMessage,
        maxResults: 5,
        semanticSearch: true
      });
      
      for (const memory of directResults) {
        memoryContexts.push({
          memoryId: memory.id,
          content: memory.content,
          relevanceScore: memory.relevanceScore,
          memoryType: this.determineMemoryType(memory.metadata),
          timestamp: memory.timestamp,
          metadata: memory.metadata || {}
        });
      }

      // Search based on conversation context if we have history
      if (conversationHistory.length > 0) {
        const recentMessages = conversationHistory
          .slice(-3)
          .map(turn => turn.userMessage.content)
          .join(' ');
          const contextResults = await this.memoryClient.searchMemories({
          query: recentMessages,
          maxResults: 3,
          semanticSearch: true
        });
        
        for (const memory of contextResults) {
          // Avoid duplicates
          if (!memoryContexts.some(ctx => ctx.memoryId === memory.id)) {
            memoryContexts.push({
              memoryId: memory.id,
              content: memory.content,
              relevanceScore: memory.relevanceScore * 0.8, // Slightly lower score for context matches
              memoryType: this.determineMemoryType(memory.metadata),
              timestamp: memory.timestamp,
              metadata: memory.metadata || {}
            });
          }
        }
      }

    } catch (error) {
      console.error('Error searching relevant memories:', error);
    }

    return memoryContexts.slice(0, 8); // Limit to top 8 memories
  }

  /**
   * Determine memory type from metadata
   */
  private determineMemoryType(metadata: any): MemoryType {
    if (!metadata) return 'contextual';
    
    if (metadata.type) {
      return metadata.type as MemoryType;
    }
    
    if (metadata.isAgentResponse) {
      return 'conversation';
    }
    
    return 'contextual';
  }

  /**
   * Get session conversations
   */
  private getSessionConversations(sessionId: string): ConversationTurn[] {
    return this.conversationTurns.get(sessionId) || [];
  }

  /**
   * Generate conversation summary
   */
  private generateConversationSummary(sessionId: string, conversationHistory: ConversationTurn[]): ConversationSummary {
    const totalMessages = conversationHistory.length;
    const lastActivity = conversationHistory.length > 0 ? 
      conversationHistory[conversationHistory.length - 1].timestamp : 
      new Date();

    // Extract dominant topics (simplified)
    const allMessages = conversationHistory.map(turn => turn.userMessage.content).join(' ');
    const words = allMessages.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 4) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    const dominantTopics = Array.from(wordCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);

    return {
      sessionId,
      totalMessages,
      dominantTopics,
      sentiment: 0.5, // Simplified sentiment
      lastActivity,
      keyPoints: [] // Would be extracted in full implementation
    };
  }  /**
   * Get or create user profile
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    // Create new profile with User object integration
    const customInstructions = await this.getUserCustomInstructions(userId);
    const profile: UserProfile = {
      userId,
      preferences: {},
      goals: [],
      commonTopics: [],
      communicationStyle: 'conversational',
      lastSeen: new Date(),
      ...(customInstructions && { customInstructions })
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }
  /**
   * Fetch customInstructions from User object via UserService
   */
  private async getUserCustomInstructions(userId: string): Promise<string | undefined> {
    try {
      // Use UserService to fetch customInstructions
      const customInstructions = await userService.getUserCustomInstructions(userId);
      return customInstructions || undefined;
    } catch (error) {
      console.warn(`Failed to fetch customInstructions for user ${userId}:`, error);
      return undefined;
    }
  }

  /**
   * Get session metadata
   */
  private getSessionMetadata(sessionId: string): SessionMetadata {
    if (!this.sessionMetadata.has(sessionId)) {
      this.sessionMetadata.set(sessionId, {
        sessionId,
        startTime: new Date(),
        duration: 0,
        messageCount: 0,
        activeAgents: [],
        context: {}
      });
    }

    return this.sessionMetadata.get(sessionId)!;
  }

  /**
   * Update session metadata
   */
  private updateSessionMetadata(sessionId: string, turn: ConversationTurn): void {
    const metadata = this.getSessionMetadata(sessionId);
    
    metadata.messageCount++;
    metadata.duration = Date.now() - metadata.startTime.getTime();
    
    if (turn.agentId && !metadata.activeAgents.includes(turn.agentId)) {
      metadata.activeAgents.push(turn.agentId);
    }
  }

  /**
   * Check if response is significant enough to store
   */
  private isSignificantResponse(message: Message): boolean {
    // Store responses that are longer than 50 characters or contain key information
    return message.content.length > 50 || 
           message.content.includes('remember') ||
           message.content.includes('important');
  }

  /**
   * Search local conversations
   */
  private searchLocalConversations(userId: string, query: string, _options?: SearchOptions): MemorySearchResult[] {
    const results: MemorySearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const [sessionId, turns] of this.conversationTurns.entries()) {
      for (const turn of turns) {
        if (turn.userId !== userId) continue;

        // Check user message
        if (turn.userMessage.content.toLowerCase().includes(queryLower)) {
          results.push({
            type: 'conversation',
            content: turn.userMessage.content,
            relevanceScore: 0.7,
            timestamp: turn.timestamp,
            context: { sessionId, messageType: 'user' },
            id: turn.userMessage.id
          });
        }

        // Check agent response
        if (turn.agentResponse.content.toLowerCase().includes(queryLower)) {
          results.push({
            type: 'conversation',
            content: turn.agentResponse.content,
            relevanceScore: 0.6,
            timestamp: turn.timestamp,
            context: { sessionId, messageType: 'agent' },
            id: turn.agentResponse.id
          });
        }
      }
    }

    return results;
  }
}
