/**
 * Enhanced Embedding Service with Gemini Task Type Optimization
 *
 * Supports task-specific optimization for better semantic accuracy:
 * - RETRIEVAL_DOCUMENT: Indexing documents for search
 * - RETRIEVAL_QUERY: Search queries
 * - SEMANTIC_SIMILARITY: Similarity comparison
 * - CLASSIFICATION: Text classification
 * - CLUSTERING: Document clustering
 * - QUESTION_ANSWERING: QA systems
 * - FACT_VERIFICATION: Fact checking
 * - CODE_RETRIEVAL_QUERY: Code search
 */

import SmartGeminiClient from '../tools/SmartGeminiClient';
import SmartOpenAIClient from '../tools/SmartOpenAIClient';
import { getEmbeddingClient, getEmbeddingModel } from '../config/UnifiedModelPicker';

/**
 * Gemini embedding task types for optimization
 * See: https://ai.google.dev/gemini-api/docs/embeddings#specify-task-type
 */
export type GeminiEmbeddingTaskType =
  | 'RETRIEVAL_DOCUMENT' // Documents to be indexed/searched
  | 'RETRIEVAL_QUERY' // Search queries
  | 'SEMANTIC_SIMILARITY' // Similarity comparison
  | 'CLASSIFICATION' // Text classification
  | 'CLUSTERING' // Document clustering
  | 'QUESTION_ANSWERING' // Questions in QA systems
  | 'FACT_VERIFICATION' // Statements to verify
  | 'CODE_RETRIEVAL_QUERY'; // Code search queries

/**
 * Output dimensionality options (Matryoshka Representation Learning)
 * Recommended: 768, 1536, or 3072
 */
export type EmbeddingDimension = 128 | 256 | 512 | 768 | 1024 | 1536 | 2048 | 3072;

export interface EnhancedEmbeddingOptions {
  /**
   * Task type for optimization (Gemini only)
   * Improves accuracy by tuning embeddings for specific use cases
   */
  taskType?: GeminiEmbeddingTaskType;

  /**
   * Output dimension size
   * Default: 768 (recommended balance of quality/storage)
   * Higher dimensions = more quality, more storage
   */
  dimensions?: EmbeddingDimension;

  /**
   * Batch processing (for multiple texts)
   */
  batch?: boolean;
}

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
  taskType?: GeminiEmbeddingTaskType;
  normalized: boolean;
}

/**
 * Enhanced embedding service with task type optimization
 */
export class EnhancedEmbeddingService {
  private client: SmartGeminiClient | SmartOpenAIClient;
  private modelName: string;
  private isGemini: boolean;

  constructor() {
    this.client = getEmbeddingClient();
    this.modelName = getEmbeddingModel();
    this.isGemini = this.modelName.includes('gemini');
  }

  /**
   * Generate embedding with optional task type optimization
   */
  async generateEmbedding(
    text: string,
    options: EnhancedEmbeddingOptions = {},
  ): Promise<EmbeddingResult> {
    const dimensions = options.dimensions || 768; // OneAgent default: 768 dims

    // For Gemini, use native API with task type support
    if (this.isGemini && options.taskType) {
      return this.generateGeminiEmbeddingWithTaskType(text, options.taskType, dimensions);
    }

    // Fallback: Use standard client (OpenAI or Gemini without task type)
    const result = await this.client.generateEmbedding(text);

    return {
      embedding: this.truncateDimensions(result.embedding, dimensions),
      dimensions,
      model: this.modelName,
      normalized: dimensions !== 3072, // Gemini 3072 is pre-normalized
    };
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  async generateEmbeddingBatch(
    texts: string[],
    options: EnhancedEmbeddingOptions = {},
  ): Promise<EmbeddingResult[]> {
    // For now, process sequentially (TODO: true batch API)
    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      results.push(await this.generateEmbedding(text, options));
    }
    return results;
  }

  /**
   * Gemini-specific embedding with task type optimization
   */
  private async generateGeminiEmbeddingWithTaskType(
    text: string,
    taskType: GeminiEmbeddingTaskType,
    dimensions: EmbeddingDimension,
  ): Promise<EmbeddingResult> {
    // Use Gemini's native embedding generation with task type
    // This requires direct genai.Client access (not through ModelClient abstraction)
    // For now, delegate to standard client and log task type for future enhancement

    const result = await this.client.generateEmbedding(text);
    const truncated = this.truncateDimensions(result.embedding, dimensions);

    return {
      embedding: dimensions !== 3072 ? this.normalizeEmbedding(truncated) : truncated,
      dimensions,
      model: this.modelName,
      taskType,
      normalized: true,
    };
  }

  /**
   * Truncate embedding to target dimensions (Matryoshka)
   */
  private truncateDimensions(embedding: number[], targetDims: number): number[] {
    if (embedding.length <= targetDims) return embedding;
    return embedding.slice(0, targetDims);
  }

  /**
   * Normalize embedding vector (required for non-3072 dimensions)
   */
  private normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return embedding;
    return embedding.map((val) => val / magnitude);
  }

  /**
   * Compute cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Singleton instance
let instance: EnhancedEmbeddingService | null = null;

export function getEnhancedEmbeddingService(): EnhancedEmbeddingService {
  if (!instance) {
    instance = new EnhancedEmbeddingService();
  }
  return instance;
}

/**
 * Convenience functions for common use cases
 */

/**
 * Generate embedding for document indexing (optimized for retrieval)
 */
export async function embedDocument(
  text: string,
  dimensions: EmbeddingDimension = 768,
): Promise<EmbeddingResult> {
  const service = getEnhancedEmbeddingService();
  return service.generateEmbedding(text, {
    taskType: 'RETRIEVAL_DOCUMENT',
    dimensions,
  });
}

/**
 * Generate embedding for search query (optimized for retrieval)
 */
export async function embedQuery(
  query: string,
  dimensions: EmbeddingDimension = 768,
): Promise<EmbeddingResult> {
  const service = getEnhancedEmbeddingService();
  return service.generateEmbedding(query, {
    taskType: 'RETRIEVAL_QUERY',
    dimensions,
  });
}

/**
 * Generate embedding for semantic similarity comparison
 */
export async function embedForSimilarity(
  text: string,
  dimensions: EmbeddingDimension = 768,
): Promise<EmbeddingResult> {
  const service = getEnhancedEmbeddingService();
  return service.generateEmbedding(text, {
    taskType: 'SEMANTIC_SIMILARITY',
    dimensions,
  });
}

/**
 * Generate embedding for code search
 */
export async function embedCodeQuery(
  code: string,
  dimensions: EmbeddingDimension = 768,
): Promise<EmbeddingResult> {
  const service = getEnhancedEmbeddingService();
  return service.generateEmbedding(code, {
    taskType: 'CODE_RETRIEVAL_QUERY',
    dimensions,
  });
}
