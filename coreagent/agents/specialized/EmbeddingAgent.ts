/**
 * EmbeddingAgent - Specialized Agent for Advanced Embedding Operations
 *
 * Capabilities:
 * - Task-type optimized embeddings (8 Gemini task types)
 * - Batch embedding generation
 * - Similarity computation and clustering
 * - Dimension benchmarking and analysis
 * - Asymmetric optimization for search/indexing
 *
 * Use Cases:
 * - Semantic search and retrieval
 * - Document clustering and organization
 * - Deduplication and similarity detection
 * - Code search and analysis
 * - Constitutional AI fact verification (embedding-based)
 */

import { BaseAgent } from '../base/BaseAgent';
import type { AgentConfig, AgentContext, AgentResponse, AgentAction } from '../base/BaseAgent';
import {
  EnhancedEmbeddingService,
  type GeminiEmbeddingTaskType,
  type EmbeddingDimension,
} from '../../services/EnhancedEmbeddingService';
import { createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';

export interface EmbeddingAgentConfig extends AgentConfig {
  defaultDimension?: EmbeddingDimension;
  enableBatching?: boolean;
  cachingEnabled?: boolean;
}

export interface EmbeddingSimilarityResult {
  text1: string;
  text2: string;
  similarity: number;
  taskType: GeminiEmbeddingTaskType;
  dimensions: number;
}

export interface ClusteringResult {
  clusters: Array<{
    centroid: number[];
    members: string[];
    avgSimilarity: number;
  }>;
  orphans: string[];
}

/**
 * EmbeddingAgent - Specialized agent for embedding operations
 */
export class EmbeddingAgent extends BaseAgent {
  private embeddingService: EnhancedEmbeddingService;
  private defaultDimension: EmbeddingDimension;
  private enableBatching: boolean;

  constructor(config: EmbeddingAgentConfig) {
    super({
      ...config,
      capabilities: [
        ...config.capabilities,
        'embedding_generation',
        'similarity_computation',
        'clustering',
        'semantic_search',
        'task_type_optimization',
      ],
    });

    this.embeddingService = new EnhancedEmbeddingService();
    this.defaultDimension = config.defaultDimension || 768;
    this.enableBatching = config.enableBatching ?? true;
  }

  async initialize(): Promise<void> {
    await super.initialize();
    console.log(
      `[EmbeddingAgent:${this.config.id}] Initialized with ${this.defaultDimension} dimensions`,
    );
  }

  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    const command = this.parseCommand(message);

    switch (command.action) {
      case 'embed_document':
        return this.handleEmbedDocument(
          command.params as { text: string; dimensions?: EmbeddingDimension },
        );
      case 'embed_query':
        return this.handleEmbedQuery(
          command.params as { query: string; dimensions?: EmbeddingDimension },
        );
      case 'compute_similarity':
        return this.handleComputeSimilarity(
          command.params as {
            text1: string;
            text2: string;
            taskType?: GeminiEmbeddingTaskType;
            dimensions?: EmbeddingDimension;
          },
        );
      case 'cluster_texts':
        return this.handleClusterTexts(
          command.params as {
            texts: string[];
            numClusters: number;
            taskType?: GeminiEmbeddingTaskType;
            dimensions?: EmbeddingDimension;
          },
        );
      case 'batch_embed':
        return this.handleBatchEmbed(
          command.params as {
            texts: string[];
            taskType?: GeminiEmbeddingTaskType;
            dimensions?: EmbeddingDimension;
          },
        );
      case 'benchmark_dimensions':
        return this.handleBenchmarkDimensions(
          command.params as {
            testPairs: Array<{ text1: string; text2: string; expectedSimilarity: number }>;
            dimensions: EmbeddingDimension[];
          },
        );
      default:
        return this.handleGenericEmbedding(context, message);
    }
  }

  /**
   * Embed document for indexing (RETRIEVAL_DOCUMENT task type)
   */
  private async handleEmbedDocument(params: {
    text: string;
    dimensions?: EmbeddingDimension;
  }): Promise<AgentResponse> {
    const result = await this.embeddingService.generateEmbedding(params.text, {
      taskType: 'RETRIEVAL_DOCUMENT',
      dimensions: params.dimensions || this.defaultDimension,
    });

    return {
      content: `Document embedded with ${result.dimensions} dimensions (task: RETRIEVAL_DOCUMENT)`,
      metadata: {
        embeddingResult: result,
        taskType: 'RETRIEVAL_DOCUMENT',
        optimized: true,
      },
    };
  }

  /**
   * Embed query for search (RETRIEVAL_QUERY task type)
   */
  private async handleEmbedQuery(params: {
    query: string;
    dimensions?: EmbeddingDimension;
  }): Promise<AgentResponse> {
    const result = await this.embeddingService.generateEmbedding(params.query, {
      taskType: 'RETRIEVAL_QUERY',
      dimensions: params.dimensions || this.defaultDimension,
    });

    return {
      content: `Query embedded with ${result.dimensions} dimensions (task: RETRIEVAL_QUERY)`,
      metadata: {
        embeddingResult: result,
        taskType: 'RETRIEVAL_QUERY',
        optimized: true,
      },
    };
  }

  /**
   * Compute similarity between two texts
   */
  private async handleComputeSimilarity(params: {
    text1: string;
    text2: string;
    taskType?: GeminiEmbeddingTaskType;
    dimensions?: EmbeddingDimension;
  }): Promise<AgentResponse> {
    const taskType = params.taskType || 'SEMANTIC_SIMILARITY';
    const dimensions = params.dimensions || this.defaultDimension;

    // Generate embeddings with same task type
    const [result1, result2] = await Promise.all([
      this.embeddingService.generateEmbedding(params.text1, { taskType, dimensions }),
      this.embeddingService.generateEmbedding(params.text2, { taskType, dimensions }),
    ]);

    // Compute similarity
    const similarity = this.embeddingService.cosineSimilarity(result1.embedding, result2.embedding);

    const similarityResult: EmbeddingSimilarityResult = {
      text1: params.text1,
      text2: params.text2,
      similarity,
      taskType,
      dimensions,
    };

    return {
      content: `Similarity: ${(similarity * 100).toFixed(2)}% (task: ${taskType}, ${dimensions} dims)`,
      metadata: {
        similarityResult,
        timestamp: createUnifiedTimestamp().iso,
      },
    };
  }

  /**
   * Cluster texts using k-means on embeddings
   */
  private async handleClusterTexts(params: {
    texts: string[];
    numClusters: number;
    taskType?: GeminiEmbeddingTaskType;
    dimensions?: EmbeddingDimension;
  }): Promise<AgentResponse> {
    const taskType = params.taskType || 'CLUSTERING';
    const dimensions = params.dimensions || this.defaultDimension;

    // Generate embeddings for all texts
    const embeddings = await this.embeddingService.generateEmbeddingBatch(params.texts, {
      taskType,
      dimensions,
    });

    // Simple k-means clustering
    const clusters = this.kMeansClustering(
      embeddings.map((e) => e.embedding),
      params.texts,
      params.numClusters,
    );

    return {
      content: `Clustered ${params.texts.length} texts into ${clusters.clusters.length} clusters`,
      metadata: {
        clusteringResult: clusters,
        taskType,
        dimensions,
        timestamp: createUnifiedTimestamp().iso,
      },
    };
  }

  /**
   * Batch embed multiple texts
   */
  private async handleBatchEmbed(params: {
    texts: string[];
    taskType?: GeminiEmbeddingTaskType;
    dimensions?: EmbeddingDimension;
  }): Promise<AgentResponse> {
    if (!this.enableBatching) {
      throw new Error('Batching is disabled for this agent');
    }

    const taskType = params.taskType || 'RETRIEVAL_DOCUMENT';
    const dimensions = params.dimensions || this.defaultDimension;

    const results = await this.embeddingService.generateEmbeddingBatch(params.texts, {
      taskType,
      dimensions,
    });

    return {
      content: `Generated ${results.length} embeddings (task: ${taskType}, ${dimensions} dims)`,
      metadata: {
        batchResults: results,
        count: results.length,
        taskType,
        dimensions,
      },
    };
  }

  /**
   * Benchmark different dimensions for quality/performance trade-offs
   */
  private async handleBenchmarkDimensions(params: {
    testPairs: Array<{ text1: string; text2: string; expectedSimilarity: number }>;
    dimensions: EmbeddingDimension[];
  }): Promise<AgentResponse> {
    const results: Record<string, { avgAccuracy: number; avgTime: number }> = {};

    for (const dim of params.dimensions) {
      const startTime = createUnifiedTimestamp().unix;
      let totalAccuracy = 0;

      for (const pair of params.testPairs) {
        const [result1, result2] = await Promise.all([
          this.embeddingService.generateEmbedding(pair.text1, {
            taskType: 'SEMANTIC_SIMILARITY',
            dimensions: dim,
          }),
          this.embeddingService.generateEmbedding(pair.text2, {
            taskType: 'SEMANTIC_SIMILARITY',
            dimensions: dim,
          }),
        ]);

        const similarity = this.embeddingService.cosineSimilarity(
          result1.embedding,
          result2.embedding,
        );
        const accuracy = 1 - Math.abs(similarity - pair.expectedSimilarity);
        totalAccuracy += accuracy;
      }

      const avgTime = (createUnifiedTimestamp().unix - startTime) / params.testPairs.length;
      const avgAccuracy = totalAccuracy / params.testPairs.length;

      results[dim] = { avgAccuracy, avgTime };
    }

    return {
      content: `Benchmark complete: tested ${params.dimensions.length} dimensions across ${params.testPairs.length} pairs`,
      metadata: {
        benchmarkResults: results,
        timestamp: createUnifiedTimestamp().iso,
      },
    };
  }

  /**
   * Generic embedding handler for free-form requests
   */
  private async handleGenericEmbedding(
    context: AgentContext,
    message: string,
  ): Promise<AgentResponse> {
    // Use Constitutional AI to determine intent
    const intent = this.determineIntent(message);

    switch (intent) {
      case 'search':
        return this.handleEmbedQuery({ query: message });
      case 'index':
        return this.handleEmbedDocument({ text: message });
      default:
        return {
          content: `I'm an EmbeddingAgent. I can help with:
- Document indexing (embed_document)
- Query embedding (embed_query)
- Similarity computation (compute_similarity)
- Text clustering (cluster_texts)
- Batch embedding (batch_embed)
- Dimension benchmarking (benchmark_dimensions)

Please specify what you'd like to do!`,
        };
    }
  }

  /**
   * Simple k-means clustering implementation
   */
  private kMeansClustering(embeddings: number[][], texts: string[], k: number): ClusteringResult {
    // Initialize centroids randomly
    const centroids = embeddings.slice(0, k);
    const assignments: number[] = new Array(embeddings.length).fill(0);

    // Iterate until convergence (max 10 iterations for simplicity)
    for (let iter = 0; iter < 10; iter++) {
      // Assign each point to nearest centroid
      for (let i = 0; i < embeddings.length; i++) {
        let minDist = Infinity;
        let bestCluster = 0;

        for (let j = 0; j < k; j++) {
          const dist = 1 - this.embeddingService.cosineSimilarity(embeddings[i], centroids[j]); // Distance = 1 - similarity
          if (dist < minDist) {
            minDist = dist;
            bestCluster = j;
          }
        }

        assignments[i] = bestCluster;
      }

      // Update centroids
      for (let j = 0; j < k; j++) {
        const clusterPoints = embeddings.filter((_, i) => assignments[i] === j);
        if (clusterPoints.length > 0) {
          const centroid = new Array(clusterPoints[0].length).fill(0);
          for (const point of clusterPoints) {
            for (let d = 0; d < point.length; d++) {
              centroid[d] += point[d];
            }
          }
          for (let d = 0; d < centroid.length; d++) {
            centroid[d] /= clusterPoints.length;
          }
          centroids[j] = centroid;
        }
      }
    }

    // Build result
    const clusters = centroids.map((centroid, i) => {
      const members = texts.filter((_, idx) => assignments[idx] === i);
      const clusterEmbeddings = embeddings.filter((_, idx) => assignments[idx] === i);
      const avgSimilarity =
        clusterEmbeddings.reduce(
          (sum, emb) => sum + this.embeddingService.cosineSimilarity(emb, centroid),
          0,
        ) / clusterEmbeddings.length;

      return {
        centroid,
        members,
        avgSimilarity,
      };
    });

    return {
      clusters: clusters.filter((c) => c.members.length > 0),
      orphans: [], // No orphans in k-means
    };
  }

  /**
   * Parse command from message
   */
  private parseCommand(message: string): { action: string; params: Record<string, unknown> } {
    // Simple command parsing (can be enhanced with NLP)
    const lower = message.toLowerCase();

    if (lower.includes('embed') && lower.includes('document')) {
      return { action: 'embed_document', params: { text: message } };
    }
    if (lower.includes('embed') && lower.includes('query')) {
      return { action: 'embed_query', params: { query: message } };
    }
    if (lower.includes('similarity') || lower.includes('compare')) {
      return { action: 'compute_similarity', params: {} };
    }
    if (lower.includes('cluster')) {
      return { action: 'cluster_texts', params: {} };
    }
    if (lower.includes('batch')) {
      return { action: 'batch_embed', params: {} };
    }
    if (lower.includes('benchmark')) {
      return { action: 'benchmark_dimensions', params: {} };
    }

    return { action: 'generic', params: {} };
  }

  /**
   * Determine user intent from message
   */
  private determineIntent(message: string): 'search' | 'index' | 'unknown' {
    const lower = message.toLowerCase();
    if (
      lower.includes('search') ||
      lower.includes('find') ||
      lower.includes('query') ||
      lower.includes('?')
    ) {
      return 'search';
    }
    if (lower.includes('add') || lower.includes('store') || lower.includes('index')) {
      return 'index';
    }
    return 'unknown';
  }

  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'embed_document',
        description: 'Generate embedding for document indexing (RETRIEVAL_DOCUMENT)',
        parameters: { text: 'string', dimensions: 'EmbeddingDimension?' },
      },
      {
        type: 'embed_query',
        description: 'Generate embedding for search query (RETRIEVAL_QUERY)',
        parameters: { query: 'string', dimensions: 'EmbeddingDimension?' },
      },
      {
        type: 'compute_similarity',
        description: 'Compute cosine similarity between two texts',
        parameters: {
          text1: 'string',
          text2: 'string',
          taskType: 'GeminiEmbeddingTaskType?',
          dimensions: 'EmbeddingDimension?',
        },
      },
      {
        type: 'cluster_texts',
        description: 'Cluster texts using k-means on embeddings',
        parameters: {
          texts: 'string[]',
          numClusters: 'number',
          taskType: 'GeminiEmbeddingTaskType?',
          dimensions: 'EmbeddingDimension?',
        },
      },
      {
        type: 'batch_embed',
        description: 'Generate embeddings for multiple texts',
        parameters: {
          texts: 'string[]',
          taskType: 'GeminiEmbeddingTaskType?',
          dimensions: 'EmbeddingDimension?',
        },
      },
      {
        type: 'benchmark_dimensions',
        description: 'Benchmark different dimensions for quality/performance',
        parameters: { testPairs: 'TestPair[]', dimensions: 'EmbeddingDimension[]' },
      },
    ];
  }

  async executeAction(
    action: string | AgentAction,
    params: Record<string, unknown>,
    _context?: AgentContext,
  ): Promise<AgentResponse> {
    const actionType = typeof action === 'string' ? action : action.type;

    switch (actionType) {
      case 'embed_document':
        return this.handleEmbedDocument(
          params as { text: string; dimensions?: EmbeddingDimension },
        );
      case 'embed_query':
        return this.handleEmbedQuery(params as { query: string; dimensions?: EmbeddingDimension });
      case 'compute_similarity':
        return this.handleComputeSimilarity(
          params as {
            text1: string;
            text2: string;
            taskType?: GeminiEmbeddingTaskType;
            dimensions?: EmbeddingDimension;
          },
        );
      case 'cluster_texts':
        return this.handleClusterTexts(
          params as {
            texts: string[];
            numClusters: number;
            taskType?: GeminiEmbeddingTaskType;
            dimensions?: EmbeddingDimension;
          },
        );
      case 'batch_embed':
        return this.handleBatchEmbed(
          params as {
            texts: string[];
            taskType?: GeminiEmbeddingTaskType;
            dimensions?: EmbeddingDimension;
          },
        );
      case 'benchmark_dimensions':
        return this.handleBenchmarkDimensions(
          params as {
            testPairs: Array<{ text1: string; text2: string; expectedSimilarity: number }>;
            dimensions: EmbeddingDimension[];
          },
        );
      default:
        throw new Error(`Unknown action: ${actionType}`);
    }
  }
}
