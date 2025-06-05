/**
 * Gemini Embeddings Tool for OneAgent
 * 
 * Provides semantic search, similarity matching, and embedding-based
 * memory enhancement for the OneAgent system using Google Gemini embeddings.
 */

import { GeminiClient } from './geminiClient';
import { Mem0Client, Mem0Memory, Mem0SearchFilter } from './mem0Client';
import { EmbeddingOptions, EmbeddingResult, EmbeddingTaskType } from '../types/gemini';
import { globalProfiler } from '../performance/profiler';

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
  memory: Mem0Memory;
  similarity: number;
  embeddingResult: EmbeddingResult;
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
 * Integrates Gemini embeddings with Mem0 memory system for semantic operations
 */
export class GeminiEmbeddingsTool {
  private geminiClient: GeminiClient;
  private mem0Client: Mem0Client;
  private embeddingCache: Map<string, EmbeddingResult> = new Map();

  constructor(geminiClient: GeminiClient, mem0Client: Mem0Client) {
    this.geminiClient = geminiClient;
    this.mem0Client = mem0Client;
    console.log('🔢 GeminiEmbeddingsTool initialized');
  }
  /**
   * Perform semantic search across memories
   */
  async semanticSearch(
    query: string, 
    filter?: Mem0SearchFilter, 
    options?: MemoryEmbeddingOptions
  ): Promise<{ results: SemanticSearchResult[]; analytics: EmbeddingAnalytics }> {
    const operationId = `semantic_search_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'semantic_search', { 
      query: query.substring(0, 50),
      threshold: options?.similarityThreshold,
      topK: options?.topK
    });

    const startTime = Date.now();
    console.log(`🔍 Performing semantic search for: "${query.substring(0, 50)}..."`);

    try {
      // Retrieve memories using Mem0 filter
      const memoriesResponse = await this.mem0Client.searchMemories(filter || {});
      
      if (!memoriesResponse.success || !memoriesResponse.data) {
        console.log('⚠️ No memories found for semantic search');
        return {
          results: [],
          analytics: {
            totalMemories: 0,
            searchResults: 0,
            averageSimilarity: 0,
            topSimilarity: 0,
            processingTime: Date.now() - startTime
          }
        };
      }

      const memories = memoriesResponse.data;
      console.log(`📚 Found ${memories.length} memories for semantic analysis`);

      // Generate embedding for search query
      const queryEmbedding = await this.geminiClient.generateEmbedding(query, {
        taskType: options?.taskType || 'RETRIEVAL_QUERY',
        model: options?.model
      });

      // Generate embeddings for memory contents
      const memoryTexts = memories.map(memory => memory.content);
      const memoryEmbeddings = await this.geminiClient.generateEmbeddingBatch(memoryTexts, {
        taskType: 'RETRIEVAL_DOCUMENT',
        model: options?.model
      });

      // Calculate similarities and create results
      const searchResults: SemanticSearchResult[] = memories.map((memory, index) => {
        const embeddingResult = memoryEmbeddings[index];
        const similarity = GeminiClient.calculateCosineSimilarity(
          queryEmbedding.embedding, 
          embeddingResult.embedding
        );

        return {
          memory,
          similarity,
          embeddingResult
        };
      });

      // Filter by similarity threshold
      const threshold = options?.similarityThreshold || 0.5;
      const filteredResults = searchResults.filter(result => result.similarity >= threshold);

      // Sort by similarity (highest first)
      filteredResults.sort((a, b) => b.similarity - a.similarity);

      // Apply topK limit
      const topK = options?.topK || filteredResults.length;
      const finalResults = filteredResults.slice(0, topK);

      // Calculate analytics
      const similarities = finalResults.map(r => r.similarity);
      const analytics: EmbeddingAnalytics = {
        totalMemories: memories.length,
        searchResults: finalResults.length,
        averageSimilarity: similarities.length > 0 ? similarities.reduce((a, b) => a + b, 0) / similarities.length : 0,
        topSimilarity: similarities.length > 0 ? Math.max(...similarities) : 0,
        processingTime: Date.now() - startTime
      };      console.log(`✅ Semantic search completed: ${finalResults.length} results in ${analytics.processingTime}ms`);
      globalProfiler.endOperation(operationId, true);
      return { results: finalResults, analytics };

    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
  /**
   * Store memory with embedding for future semantic searches
   */
  async storeMemoryWithEmbedding(
    content: string,
    metadata?: Record<string, any>,
    userId?: string,
    agentId?: string,
    workflowId?: string,
    memoryType: 'short_term' | 'long_term' | 'workflow' | 'session' = 'long_term',
    embeddingOptions?: EmbeddingOptions
  ): Promise<{ memory: Mem0Memory; embedding: EmbeddingResult }> {
    const operationId = `store_memory_embedding_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'store_memory_with_embedding', { 
      contentLength: content.length,
      memoryType,
      userId,
      agentId 
    });

    console.log(`💾 Storing memory with embedding: "${content.substring(0, 50)}..."`);

    try {
      // Generate embedding for the content
      const embedding = await this.geminiClient.generateEmbedding(content, {
        taskType: 'RETRIEVAL_DOCUMENT',
        ...embeddingOptions
      });

      // Store memory in Mem0 with embedding metadata
      const enhancedMetadata = {
        ...metadata,
        has_embedding: true,
        embedding_model: embeddingOptions?.model || 'text-embedding-004',
        embedding_dimensions: embedding.dimensions,
        embedding_task_type: embedding.taskType
      };

      const memoryResponse = await this.mem0Client.createMemory(
        content,
        enhancedMetadata,
        userId,
        agentId,
        workflowId,
        memoryType
      );

      if (!memoryResponse.success || !memoryResponse.data) {
        throw new Error('Failed to store memory');
      }

      // Cache the embedding for future use
      if (memoryResponse.data.id) {
        this.embeddingCache.set(memoryResponse.data.id, embedding);
      }      console.log(`✅ Memory stored with embedding: ${memoryResponse.data.id}`);
      globalProfiler.endOperation(operationId, true);
      return {
        memory: memoryResponse.data,
        embedding
      };

    } catch (error) {
      console.error('❌ Failed to store memory with embedding:', error);
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Find similar memories to a given memory
   */
  async findSimilarMemories(
    memoryId: string,
    options?: MemoryEmbeddingOptions
  ): Promise<{ results: SemanticSearchResult[]; analytics: EmbeddingAnalytics }> {
    console.log(`🔍 Finding similar memories to: ${memoryId}`);

    try {
      // Get the reference memory
      const memoryResponse = await this.mem0Client.getMemory(memoryId);
      
      if (!memoryResponse.success || !memoryResponse.data) {
        throw new Error(`Memory not found: ${memoryId}`);
      }

      const referenceMemory = memoryResponse.data;
      
      // Use the memory content for semantic search
      return this.semanticSearch(referenceMemory.content, {
        // Exclude the reference memory from results
        userId: referenceMemory.userId,
        agentId: referenceMemory.agentId,
        workflowId: options?.workflowId || referenceMemory.workflowId,
        sessionId: options?.sessionId || referenceMemory.sessionId,
        memoryType: options?.memoryType || referenceMemory.memoryType
      }, options);

    } catch (error) {
      console.error('❌ Failed to find similar memories:', error);
      throw error;
    }
  }
  /**
   * Cluster memories by semantic similarity
   */
  async clusterMemories(
    filter?: Mem0SearchFilter,
    options?: { 
      numClusters?: number; 
      model?: string;
      similarityThreshold?: number;
    }
  ): Promise<Array<{ 
    cluster: number; 
    memories: Mem0Memory[]; 
    centroid: number[];
    avgSimilarity: number;
  }>> {
    const operationId = `cluster_memories_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'cluster_memories', { 
      numClusters: options?.numClusters,
      model: options?.model
    });

    console.log('🎯 Clustering memories by semantic similarity...');

    try {
      // Get memories
      const memoriesResponse = await this.mem0Client.searchMemories(filter || {});
      
      if (!memoriesResponse.success || !memoriesResponse.data || memoriesResponse.data.length < 2) {
        console.log('⚠️ Insufficient memories for clustering');
        return [];
      }

      const memories = memoriesResponse.data;
      console.log(`📊 Clustering ${memories.length} memories`);

      // Generate embeddings for all memories
      const memoryTexts = memories.map(memory => memory.content);
      const embeddings = await this.geminiClient.generateEmbeddingBatch(memoryTexts, {
        taskType: 'CLUSTERING',
        model: options?.model as any
      });

      // Simple k-means clustering implementation
      const numClusters = Math.min(options?.numClusters || 3, Math.floor(memories.length / 2));
      const clusters = this.performKMeansClustering(embeddings, memories, numClusters);      console.log(`✅ Created ${clusters.length} clusters`);
      globalProfiler.endOperation(operationId, true);
      return clusters;

    } catch (error) {
      console.error('❌ Memory clustering failed:', error);
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Test embeddings functionality
   */
  async testEmbeddings(): Promise<boolean> {
    try {
      console.log('🧪 Testing Gemini embeddings functionality...');

      // Test single embedding
      const testText = "OneAgent is a modular AI agent platform";
      const embedding = await this.geminiClient.generateEmbedding(testText, {
        taskType: 'SEMANTIC_SIMILARITY'
      });

      console.log(`✅ Single embedding: ${embedding.dimensions} dimensions`);

      // Test batch embeddings
      const testTexts = [
        "AI agent platform",
        "Machine learning system", 
        "Software development tools"
      ];
      
      const batchEmbeddings = await this.geminiClient.generateEmbeddingBatch(testTexts, {
        taskType: 'CLUSTERING'
      });

      console.log(`✅ Batch embeddings: ${batchEmbeddings.length} embeddings generated`);

      // Test similarity calculation
      const similarity = GeminiClient.calculateCosineSimilarity(
        embedding.embedding,
        batchEmbeddings[0].embedding
      );

      console.log(`✅ Similarity calculation: ${similarity.toFixed(4)}`);
      console.log('🎉 Embeddings test completed successfully');
      
      return true;

    } catch (error) {
      console.error('❌ Embeddings test failed:', error);
      return false;
    }
  }

  /**
   * Simple k-means clustering implementation
   */
  private performKMeansClustering(
    embeddings: EmbeddingResult[],
    memories: Mem0Memory[],
    k: number
  ): Array<{ 
    cluster: number; 
    memories: Mem0Memory[]; 
    centroid: number[];
    avgSimilarity: number;
  }> {
    const numPoints = embeddings.length;
    const dimensions = embeddings[0].embedding.length;

    // Initialize centroids randomly
    const centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * numPoints);
      centroids.push([...embeddings[randomIndex].embedding]);
    }

    let assignments = new Array(numPoints).fill(0);
    let converged = false;
    let iterations = 0;
    const maxIterations = 100;

    while (!converged && iterations < maxIterations) {      // Assign points to closest centroids
      const newAssignments = embeddings.map((embedding) => {
        let minDistance = Infinity;
        let closestCentroid = 0;

        for (let j = 0; j < k; j++) {
          const distance = this.calculateEuclideanDistance(embedding.embedding, centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            closestCentroid = j;
          }
        }

        return closestCentroid;
      });

      // Check for convergence
      converged = newAssignments.every((assignment, index) => assignment === assignments[index]);
      assignments = newAssignments;

      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterPoints = embeddings.filter((_, index) => assignments[index] === j);
        if (clusterPoints.length > 0) {
          for (let d = 0; d < dimensions; d++) {
            centroids[j][d] = clusterPoints.reduce((sum, point) => sum + point.embedding[d], 0) / clusterPoints.length;
          }
        }
      }

      iterations++;
    }

    // Create cluster results
    const clusters = [];
    for (let j = 0; j < k; j++) {
      const clusterMemories = memories.filter((_, index) => assignments[index] === j);
      const clusterEmbeddings = embeddings.filter((_, index) => assignments[index] === j);
      
      // Calculate average similarity within cluster
      let totalSimilarity = 0;
      let pairCount = 0;
      
      for (let i = 0; i < clusterEmbeddings.length; i++) {
        for (let l = i + 1; l < clusterEmbeddings.length; l++) {
          totalSimilarity += GeminiClient.calculateCosineSimilarity(
            clusterEmbeddings[i].embedding,
            clusterEmbeddings[l].embedding
          );
          pairCount++;
        }
      }

      const avgSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0;

      clusters.push({
        cluster: j,
        memories: clusterMemories,
        centroid: centroids[j],
        avgSimilarity
      });
    }

    return clusters.filter(cluster => cluster.memories.length > 0);
  }

  /**
   * Calculate Euclidean distance between two vectors
   */
  private calculateEuclideanDistance(vec1: number[], vec2: number[]): number {
    return Math.sqrt(
      vec1.reduce((sum, val, index) => sum + Math.pow(val - vec2[index], 2), 0)
    );
  }

  /**
   * Get embedding cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.embeddingCache.size,
      memoryUsage: `${Math.round(this.embeddingCache.size * 384 * 8 / 1024)} KB` // Approximate for 384-dim embeddings
    };
  }

  /**
   * Clear embedding cache
   */
  clearCache() {
    this.embeddingCache.clear();
    console.log('🗑️ Embedding cache cleared');
  }
}
