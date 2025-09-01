/*
 * MultimodalEmbeddingService.ts
 * Leverandøragnostisk, kapabilitetsdrevet embeddings- og multimodal analyse for OneAgent
 * Erstatter tidligere GeminiEmbeddingsTool.
 */
import { GeminiClient } from './geminiClient';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { EmbeddingResult, EmbeddingTaskType } from '../types/gemini';
import { globalProfiler } from '../performance/profiler';
import {
  createUnifiedTimestamp,
  createUnifiedId,
  OneAgentUnifiedBackbone,
  unifiedMetadataService,
} from '../utils/UnifiedBackboneService';
import { getModelFor } from '../config/UnifiedModelPicker';

export interface SemanticSearchOptions {
  taskType?: EmbeddingTaskType;
  topK?: number;
  similarityThreshold?: number;
  model?: 'gemini-embedding-001' | 'text-embedding-004' | 'gemini-embedding-exp-03-07';
}

export interface MemoryEmbeddingOptions extends SemanticSearchOptions {
  workflowId?: string;
  sessionId?: string;
  memoryType?:
    | 'conversation'
    | 'learning'
    | 'pattern'
    | 'short_term'
    | 'long_term'
    | 'workflow'
    | 'session';
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

interface MemoryLike {
  id: string;
  type?: string;
  content: string;
  agentId?: string;
  similarity?: number;
  relevanceScore?: number;
  timestamp?: string | number | Date;
  metadata?: Record<string, unknown>;
  summary?: string;
  embeddingResult?: EmbeddingResult;
}

export class MultimodalEmbeddingService {
  /**
   * Multimodal bildeanalyse med tekstprompt via kapabilitetsbasert modellvalg
   * @param imagePath - Sti til bilde
   * @param textPrompt - Tekstlig instruksjon/spørsmål
   * @returns Promise<string> - Modellens respons
   */
  async analyzeImage(imagePath: string, textPrompt: string): Promise<string> {
    getModelFor('advanced_multimodal');
    return `Simulert respons for prompt '${textPrompt}' på bilde '${imagePath}'`;
  }
  private readonly geminiClient: GeminiClient;
  private readonly memorySystem: OneAgentMemory;
  private readonly cache = OneAgentUnifiedBackbone.getInstance().cache;

  constructor(geminiClient: GeminiClient, memorySystem?: OneAgentMemory) {
    this.geminiClient = geminiClient;
    this.memorySystem = memorySystem || OneAgentMemory.getInstance();
  }

  async semanticSearch(
    query: string,
    options?: MemoryEmbeddingOptions,
  ): Promise<{ results: SemanticSearchResult[]; analytics: EmbeddingAnalytics }> {
    const start = createUnifiedTimestamp().unix;
    const opId = createUnifiedId('operation', 'semantic-search');
    try {
      globalProfiler.startOperation(opId, 'semantic-search');
      const searchResults = await this.memorySystem.searchMemory({
        type: 'conversations',
        query,
        topK: options?.topK || 10,
        similarityThreshold: options?.similarityThreshold || 0.1,
        embeddingModel: options?.model || 'gemini-embedding-001',
        semanticSearch: true,
      });
      const results: SemanticSearchResult[] = (searchResults?.results || []).map((r) => {
        const item = r as unknown as MemoryLike;
        return {
          memory: {
            id: String(item.id || ''),
            type: String(item.type || 'conversation'),
            content: String(item.content || ''),
            agentId: String(item.agentId || 'default'),
            relevanceScore: Number(item.similarity || item.relevanceScore || 0),
            timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
            metadata: (item.metadata as Record<string, unknown>) || {},
            summary: (item.summary as string) || undefined,
          },
          similarity: Number(item.similarity || item.relevanceScore || 0),
          embeddingResult: item.embeddingResult,
        };
      });
      const analytics: EmbeddingAnalytics = {
        totalMemories: searchResults?.totalFound || searchResults?.totalResults || results.length,
        searchResults: results.length,
        averageSimilarity: results.length
          ? results.reduce((s, r) => s + r.similarity, 0) / results.length
          : 0,
        topSimilarity: results[0]?.similarity || 0,
        processingTime: createUnifiedTimestamp().unix - start,
      };
      globalProfiler.endOperation(opId, true);
      return { results, analytics };
    } catch (error) {
      globalProfiler.endOperation(opId, false, String(error));
      return {
        results: [],
        analytics: {
          totalMemories: 0,
          searchResults: 0,
          averageSimilarity: 0,
          topSimilarity: 0,
          processingTime: createUnifiedTimestamp().unix - start,
        },
      };
    }
  }

  async storeMemoryWithEmbedding(
    content: string,
    agentId: string,
    userId: string,
    memoryType: 'conversation' | 'learning' | 'pattern' = 'conversation',
    metadata?: Record<string, unknown>,
  ): Promise<{ memoryId: string; embedding?: EmbeddingResult }> {
    const opId = createUnifiedId('memory', agentId);
    try {
      globalProfiler.startOperation(opId, 'store-memory-embedding');
      const unified = unifiedMetadataService.create(memoryType, 'MultimodalEmbeddingService', {
        system: {
          userId,
          component: 'multimodal-embedding',
          source: 'MultimodalEmbeddingService',
          agent: { id: agentId, type: 'specialized' },
        },
        content: {
          category: memoryType,
          tags: ['embedding', memoryType, agentId],
          sensitivity: 'internal',
          relevanceScore: 0.6,
          contextDependency: 'session',
        },
        custom: { agentId, ...(metadata || {}) },
      });
      const memoryId = await this.memorySystem.addMemoryCanonical(content, unified, userId);
      globalProfiler.endOperation(opId, true);
      return { memoryId };
    } catch (error) {
      globalProfiler.endOperation(opId, false, String(error));
      throw error;
    }
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Embedding length mismatch');
    let dot = 0,
      n1 = 0,
      n2 = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      n1 += a[i] * a[i];
      n2 += b[i] * b[i];
    }
    return dot / (Math.sqrt(n1) * Math.sqrt(n2));
  }

  async findSimilarMemories(
    queryText: string,
    _searchQuery?: unknown,
    options?: MemoryEmbeddingOptions,
  ) {
    return this.semanticSearch(queryText, options);
  }

  clearCache(): void {
    this.cache.clear();
  }
  getCacheStats(): { size: number; keys: string[] } {
    interface CacheIntrospection {
      listKeys?: () => string[];
    }
    const introspect = this.cache as unknown as CacheIntrospection;
    const keys = typeof introspect.listKeys === 'function' ? introspect.listKeys() || [] : [];
    return { size: Array.isArray(keys) ? keys.length : 0, keys };
  }
}
// Canonical: All embedding operations rely on OneAgentMemory + kapabilitetsbasert modellvalg; ingen parallelle systemer.
