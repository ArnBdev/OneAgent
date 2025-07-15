/**
 * Gemini Embeddings Tool for OneAgent
 * 
 * Provides semantic search, similarity matching, and embedding-based
 * memory enhancement for the OneAgent system using Google Gemini embeddings.
 * Updated to use UnifiedMemoryClient.
 */

import { GeminiClient } from './geminiClient';
import { OneAgentMemory, OneAgentMemoryConfig } from '../memory/OneAgentMemory';
import { EmbeddingResult, EmbeddingTaskType } from '../types/gemini';
import { globalProfiler } from '../performance/profiler';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

export interface SemanticSearchOptions {
  taskType?: EmbeddingTaskType;
  topK?: number;
  similarityThreshold?: number;
  model?: 'text-embedding-004' | 'embedding-001' | 'gemini-embedding-exp-03-07';
}

export interface MemoryEmbeddingOptions extends SemanticSearchOptions {
  workflowId?: string;
  sessionId?: string;
  memoryType?: 'short_term' | 'long_term' | 'workflow' | 'session';
}

export interface SemanticSearchResult {
  memory: {
    id: string;
    type: string;
    content: string;
    agentId: string;
    relevanceScore: number;
    timestamp: Date;
    metadata?: Record<string, unknown>;
    summary?: string;
  };
  similarity: number;
  embeddingResult?: EmbeddingResult;
}

export interface EmbeddingAnalytics {
  totalMemories: number;
  searchResults: number;
  averageSimilarity: number;
  topSimilarity: number;
  processingTime: number;
}

/**
 * Gemini Embeddings Tool
 * Integrates Gemini embeddings with UnifiedMemoryClient for semantic operations
 */
export class GeminiEmbeddingsTool {
  private geminiClient: GeminiClient;
  private memorySystem: OneAgentMemory;
  private embeddingCache: Map<string, EmbeddingResult> = new Map();

  constructor(geminiClient: GeminiClient, memorySystem?: OneAgentMemory) {
    this.geminiClient = geminiClient;
    if (memorySystem) {
      this.memorySystem = memorySystem;
    } else {
      const memoryConfig: OneAgentMemoryConfig = {
        apiKey: process.env.MEM0_API_KEY || 'demo-key',
        apiUrl: process.env.MEM0_API_URL
      };
      this.memorySystem = new OneAgentMemory(memoryConfig);
    }
    console.log('🔢 GeminiEmbeddingsTool initialized with canonical OneAgentMemory');
  }

  /**
   * Perform semantic search across memories using canonical memory system
   */
  async semanticSearch(
    query: string,
    options?: MemoryEmbeddingOptions
  ): Promise<{ results: SemanticSearchResult[]; analytics: EmbeddingAnalytics }> {
    const startTime = createUnifiedTimestamp().unix;
    const operationId = `semantic-search-${createUnifiedTimestamp().unix}`;
    try {
      globalProfiler.startOperation(operationId, 'semantic-search');
      // If mem0 supports embedding-based search, delegate to it:
      const searchResults = await this.memorySystem.searchMemory({
        type: 'conversations',
        query,
        topK: options?.topK || 10,
        similarityThreshold: options?.similarityThreshold || 0.1,
        embeddingModel: options?.model || 'gemini-embedding-exp-03-07',
        semanticSearch: true
      });
      // Map results to SemanticSearchResult format
      const results: SemanticSearchResult[] = (searchResults?.results || []).map((memory: unknown) => {
        const memoryItem = memory as {
          id: string;
          type?: string;
          content: string;
          agentId?: string;
          similarity?: number;
          relevanceScore?: number;
          timestamp?: string | Date;
          metadata?: Record<string, unknown>;
          summary?: string;
          embeddingResult?: EmbeddingResult;
        };
        return {
          memory: {
            id: memoryItem.id,
            type: memoryItem.type || 'conversation',
            content: memoryItem.content,
            agentId: memoryItem.agentId || 'default',
            relevanceScore: memoryItem.similarity || memoryItem.relevanceScore || 0,
            timestamp: memoryItem.timestamp ? new Date(memoryItem.timestamp) : new Date(),
            metadata: memoryItem.metadata || {},
            summary: memoryItem.summary || undefined
          },
          similarity: memoryItem.similarity || memoryItem.relevanceScore || 0,
          embeddingResult: memoryItem.embeddingResult || undefined
        };
      });
      const analytics: EmbeddingAnalytics = {
        totalMemories: searchResults?.total || results.length,
        searchResults: results.length,
        averageSimilarity: results.length > 0 ? results.reduce((sum, r) => sum + r.similarity, 0) / results.length : 0,
        topSimilarity: results.length > 0 ? results[0].similarity : 0,
        processingTime: createUnifiedTimestamp().unix - startTime
      };
      globalProfiler.endOperation(operationId, true);
      return { results, analytics };
    } catch (error) {
      globalProfiler.endOperation(operationId, false, error?.toString());
      console.error('❌ Semantic search failed:', error);
      return {
        results: [],
        analytics: {
          totalMemories: 0,
          searchResults: 0,
          averageSimilarity: 0,
          topSimilarity: 0,
          processingTime: createUnifiedTimestamp().unix - startTime
        }
      };
    }
  }

  /**
   * Store memory with embedding if required (otherwise use canonical addMemory)
   */
  async storeMemoryWithEmbedding(
    content: string,
    agentId: string,
    userId: string,
    memoryType: 'conversation' | 'learning' | 'pattern' = 'conversation',
    metadata?: Record<string, unknown>
  ): Promise<{ memoryId: string; embedding?: EmbeddingResult }> {
    const operationId = `store-memory-${createUnifiedTimestamp().unix}`;
    try {
      globalProfiler.startOperation(operationId, 'store-memory-embedding');
      // If mem0 supports embedding, just add memory
      const memoryData: Record<string, unknown> = {
        id: `${memoryType}_${createUnifiedTimestamp().unix}`,
        agentId,
        userId,
        content,
        timestamp: new Date(),
        metadata: {
          type: memoryType,
          agentId,
          ...(metadata || {})
        }
      };
      await this.memorySystem.addMemory({
        ...memoryData
      });
      globalProfiler.endOperation(operationId, true);
      return { memoryId: memoryData.id as string };
    } catch (error) {
      globalProfiler.endOperation(operationId, false, error?.toString());
      console.error('❌ Memory storage with embedding failed:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two embeddings (utility, not used if mem0 handles search)
   */
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Find similar memories (delegates to semanticSearch)
   */
  async findSimilarMemories(
    queryText: string,
    _searchQuery?: unknown,
    options?: MemoryEmbeddingOptions
  ): Promise<{
    results: SemanticSearchResult[];
    analytics: EmbeddingAnalytics;
  }> {
    return this.semanticSearch(queryText, options);
  }

  /**
   * Clear embedding cache (utility)
   */
  clearCache(): void {
    this.embeddingCache.clear();
    console.log('🧹 Embedding cache cleared');
  }

  /**
   * Get cache statistics (utility)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.embeddingCache.size,
      keys: Array.from(this.embeddingCache.keys())
    };
  }
}
// All memory and embedding operations are now handled by the canonical OneAgentMemory (mem0) system.
// This tool only provides custom embedding logic if required by future workflows.
