/**
 * OneAgentMem0Bridge.ts
 * Canonical bridge between OneAgent's UnifiedMemoryInterface and Mem0+Memgraph backend.
 * 
 * This file is the ONLY place where memory logic is implemented for OneAgent.
 * All memory operations, metadata, and intelligence features are mapped here.
 *
 * Author: OneAgent Professional Development Platform
 * Date: 2025-06-23
 */

import type {
  UnifiedMemoryInterface,
  ConversationMemory,
  LearningMemory,
  PatternMemory,
  MemorySearchQuery,
  MemoryResult,
  TimeWindow,
  ConversationData,
  EmergingPattern,
  CrossAgentLearning,
  MemoryAnalytics,
  QualityMetrics
} from '../memory/UnifiedMemoryInterface';
import { EnhancedMem0Client } from './EnhancedMem0Client';

/**
 * Canonical bridge for all OneAgent memory operations.
 * Implements UnifiedMemoryInterface, mapping to Mem0+Memgraph.
 */
export class OneAgentMem0Bridge implements UnifiedMemoryInterface {
  private client: EnhancedMem0Client;

  constructor(config: any) {
    this.client = new EnhancedMem0Client(config);
  }

  // Store a conversation with full metadata and temporal context
  async storeConversation(conversation: ConversationMemory): Promise<string> {
    return await this.client.createMemory(conversation.content, conversation.userId, conversation);
  }

  // Store a learning
  async storeLearning(learning: LearningMemory): Promise<string> {
    return await this.client.createMemory(learning.content, learning.agentId, learning);
  }

  // Store a pattern
  async storePattern(pattern: PatternMemory): Promise<string> {
    return await this.client.createMemory(pattern.description, pattern.agentId, pattern);
  }

  // Semantic search across all memory types
  async searchMemories(query: MemorySearchQuery): Promise<MemoryResult[]> {
    return await this.client.searchMemories(query.query, query.agentIds?.[0] || '', query.maxResults);
  }

  // Find learnings related to a specific memory
  async findRelatedLearnings(memoryId: string, agentId?: string): Promise<LearningMemory[]> {
    return await this.client.findRelatedLearnings(memoryId, agentId);
  }

  // Get all patterns for a specific agent
  async getAgentPatterns(agentId: string, patternType?: string): Promise<PatternMemory[]> {
    return await this.client.getAgentPatterns(agentId, patternType);
  }

  // Get conversation history for context
  async getConversationHistory(userId: string, agentId?: string, limit?: number): Promise<ConversationMemory[]> {
    return await this.client.getConversationHistory(userId, agentId, limit);
  }

  // Get conversations within a specific time window
  async getConversationsInWindow(timeWindow: TimeWindow): Promise<ConversationData[]> {
    return await this.client.getConversationsInWindow(timeWindow);
  }

  // Identify emerging patterns across agents
  async identifyEmergingPatterns(): Promise<EmergingPattern[]> {
    return await this.client.identifyEmergingPatterns();
  }

  // Suggest cross-agent learning opportunities
  async suggestCrossAgentLearnings(): Promise<CrossAgentLearning[]> {
    return await this.client.suggestCrossAgentLearnings();
  }

  // Apply a cross-agent learning transfer
  async applyCrossAgentLearning(learning: CrossAgentLearning): Promise<boolean> {
    return await this.client.applyCrossAgentLearning(learning);
  }

  // Get memory system analytics
  async getSystemAnalytics(agentId?: string): Promise<MemoryAnalytics> {
    return await this.client.getSystemAnalytics(agentId);
  }

  // Get quality metrics for stored memories
  async getQualityMetrics(timeRange?: { start: Date; end: Date }): Promise<QualityMetrics> {
    return await this.client.getQualityMetrics(timeRange);
  }

  // Connect to the memory system
  async connect(): Promise<void> {
    await this.client.connect();
  }

  // Disconnect from the memory system
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  // Check if the memory system is healthy
  async isHealthy(): Promise<boolean> {
    return await this.client.isHealthy();
  }

  // Check if the memory system is ready for operations
  isReady(): boolean {
    return this.client.isReady();
  }
}
