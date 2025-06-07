/**
 * IMemoryContextBridge - Interface for bridging memory and conversation context
 * 
 * This interface manages the integration between memory storage and
 * conversation context for enhanced agent responses.
 */

import { AgentContext, Message } from '../../agents/base/BaseAgent_new';

export interface IMemoryContextBridge {
  /**
   * Get conversation context enriched with relevant memories
   */
  getEnrichedContext(userId: string, sessionId: string, currentMessage: string): Promise<EnrichedContext>;

  /**
   * Store conversation turn with context
   */
  storeConversationTurn(turn: ConversationTurn): Promise<void>;

  /**
   * Retrieve conversation history with memory context
   */
  getConversationHistory(userId: string, sessionId: string, limit?: number): Promise<ConversationTurn[]>;

  /**
   * Search across conversations and memories
   */
  searchConversationMemories(userId: string, query: string, options?: SearchOptions): Promise<MemorySearchResult[]>;

  /**
   * Update memory relevance based on conversation feedback
   */
  updateMemoryRelevance(memoryId: string, relevanceScore: number): Promise<void>;

  /**
   * Get memory context for a specific conversation turn
   */
  getMemoryContext(userId: string, messageId: string): Promise<MemoryContext>;

  /**
   * Cleanup old conversation data
   */
  cleanupOldConversations(olderThanDays: number): Promise<number>;
}

export interface EnrichedContext {
  baseContext: AgentContext;
  relevantMemories: MemoryContext[];
  conversationSummary: ConversationSummary;
  userProfile: UserProfile;
  sessionMetadata: SessionMetadata;
}

export interface ConversationTurn {
  id: string;
  userId: string;
  sessionId: string;
  userMessage: Message;
  agentResponse: Message;
  memoryContext: MemoryContext[];
  timestamp: Date;
  agentId?: string;
}

export interface MemoryContext {
  memoryId: string;
  content: string;
  relevanceScore: number;
  memoryType: MemoryType;
  timestamp: Date;
  metadata: Record<string, any>;
}

export type MemoryType = 'conversation' | 'fact' | 'preference' | 'goal' | 'feedback' | 'contextual';

export interface ConversationSummary {
  sessionId: string;
  totalMessages: number;
  dominantTopics: string[];
  sentiment: number;
  lastActivity: Date;
  keyPoints: string[];
}

export interface UserProfile {
  userId: string;
  preferences: Record<string, any>;
  goals: string[];
  commonTopics: string[];
  communicationStyle: string;
  lastSeen: Date;
  customInstructions?: string;  // User-specific agent behavior instructions
}

export interface SessionMetadata {
  sessionId: string;
  startTime: Date;
  duration: number;
  messageCount: number;
  activeAgents: string[];
  context: Record<string, any>;
}

export interface SearchOptions {
  limit?: number;
  includeConversations?: boolean;
  includeMemories?: boolean;
  timeRange?: TimeRange;
  memoryTypes?: MemoryType[];
  minRelevanceScore?: number;
}

export interface TimeRange {
  start?: Date;
  end?: Date;
}

export interface MemorySearchResult {
  type: 'memory' | 'conversation';
  content: string;
  relevanceScore: number;
  timestamp: Date;
  context: Record<string, any>;
  id: string;
}