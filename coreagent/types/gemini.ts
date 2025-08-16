// Type definitions for Google Gemini API

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{
    text: string;
  }>;
}

export interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index?: number;
    avgLogprobs?: number;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  modelVersion?: string;
  responseId?: string;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

export interface GeminiError {
  code: number;
  message: string;
  status: string;
  details?: unknown;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  context?: string;
}

export interface ChatResponse {
  response: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
  timestamp: string;
}

/**
 * Gemini Embeddings API Types
 */

export type EmbeddingTaskType =
  | 'SEMANTIC_SIMILARITY'
  | 'CLASSIFICATION'
  | 'CLUSTERING'
  | 'RETRIEVAL_DOCUMENT'
  | 'RETRIEVAL_QUERY'
  | 'QUESTION_ANSWERING'
  | 'FACT_VERIFICATION'
  | 'CODE_RETRIEVAL_QUERY';

export interface EmbeddingRequest {
  model?: string; // For batch requests
  content: {
    parts: Array<{
      text: string;
    }>;
  };
  taskType?: EmbeddingTaskType;
  title?: string;
}

export interface EmbeddingBatchRequest {
  requests: EmbeddingRequest[];
}

export interface EmbeddingResponse {
  embedding: {
    values: number[];
  };
}

// Batch response structure - each item directly contains values array
export interface BatchEmbeddingItem {
  values: number[]; // Direct structure based on actual API response
}

export interface EmbeddingBatchResponse {
  embeddings: BatchEmbeddingItem[];
}

export interface EmbeddingOptions {
  taskType?: EmbeddingTaskType;
  title?: string;
  model?: 'gemini-embedding-001' | undefined;
}

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  taskType?: EmbeddingTaskType | undefined;
  dimensions: number;
  timestamp: string;
}
