// Gemini Model Registry for OneAgent
// Updated 2025-01-07 with latest Gemini 2.5 and stable embedding models
// Constitutional AI compliant, modular, and extensible
// Based on Google AI documentation: https://ai.google.dev/gemini-api/docs/models
// Embedding models: https://ai.google.dev/gemini-api/docs/embeddings

export interface GeminiModel {
  name: string; // Canonical model name (e.g., 'gemini-2.5-pro', 'gemini-embedding-001')
  tier: 'pro' | 'flash' | 'lite' | 'embedding';
  type: 'llm' | 'embedding';
  description: string;
  pricingUSDper1Ktokens: number; // Standardized pricing (USD per 1K tokens, as of 2025-06)
  inputLimitTokens?: number;
  outputLimitTokens?: number;
  version?: string;
  thinkingEnabled?: boolean; // For models with thinking capabilities
  outputDimensions?: number[]; // For embedding models
  experimental?: boolean;
  deprecated?: boolean;
  replacedBy?: string;
  lastUpdate?: string;
  recommended?: boolean;
}

export const GEMINI_MODELS: Record<string, GeminiModel> = {
  'gemini-2.5-pro': {
    name: 'gemini-2.5-pro',
    tier: 'pro',
    type: 'llm',
    description: 'Gemini 2.5 Pro (latest stable, enhanced thinking and reasoning, multimodal understanding)',
    pricingUSDper1Ktokens: 1.00,
    inputLimitTokens: 1048576,
    outputLimitTokens: 8192,
    version: '2.5',
    thinkingEnabled: true
  },
  'gemini-2.5-flash': {
    name: 'gemini-2.5-flash',
    tier: 'flash',
    type: 'llm',
    description: 'Gemini 2.5 Flash (adaptive thinking, cost efficiency, best price-performance)',
    pricingUSDper1Ktokens: 0.35,
    inputLimitTokens: 1048576,
    outputLimitTokens: 8192,
    version: '2.5-flash',
    thinkingEnabled: true
  },
  'gemini-2.5-flash-lite': {
    name: 'gemini-2.5-flash-lite',
    tier: 'lite',
    type: 'llm',
    description: 'Gemini 2.5 Flash-Lite (most cost-efficient, high throughput, real-time use cases)',
    pricingUSDper1Ktokens: 0.10,
    inputLimitTokens: 32768,
    outputLimitTokens: 4096,
    version: '2.5-flash-lite'
  },
  'gemini-2.0-flash': {
    name: 'gemini-2.0-flash',
    tier: 'flash',
    type: 'llm',
    description: 'Gemini 2.0 Flash (next generation features, speed, realtime streaming)',
    pricingUSDper1Ktokens: 0.35,
    inputLimitTokens: 1048576,
    outputLimitTokens: 8192,
    version: '2.0-flash',
    experimental: false
  },
  'gemini-embedding-001': {
    name: 'gemini-embedding-001',
    tier: 'embedding',
    type: 'embedding',
    description: 'Gemini Embedding 001 (latest stable, Matryoshka Representation Learning, flexible dimensions)',
    pricingUSDper1Ktokens: 0.13,
    inputLimitTokens: 2048,
    outputLimitTokens: 3072, // Max embedding dimension
    outputDimensions: [128, 256, 512, 768, 1536, 2048, 3072],
    experimental: false,
    version: '001',
    lastUpdate: '2025-06',
    recommended: true
  },
  // Legacy models for backward compatibility
  'gemini-embedding-exp-03-07': {
    name: 'gemini-embedding-exp-03-07',
    tier: 'embedding',
    type: 'embedding',
    description: 'Gemini Embedding Experimental (DEPRECATED - use gemini-embedding-001)',
    pricingUSDper1Ktokens: 0.13,
    inputLimitTokens: 8192,
    outputLimitTokens: 8192,
    outputDimensions: [3072, 1536, 768],
    experimental: true,
    deprecated: true,
    replacedBy: 'gemini-embedding-001',
    version: 'exp-03-07',
    lastUpdate: '2025-03'
  },
  'text-embedding-004': {
    name: 'text-embedding-004',
    tier: 'embedding',
    type: 'embedding',
    description: 'Text Embedding 004 (legacy model - use gemini-embedding-001 for new projects)',
    pricingUSDper1Ktokens: 0.13,
    inputLimitTokens: 2048,
    outputLimitTokens: 2048,
    outputDimensions: [768],
    experimental: false,
    deprecated: true,
    replacedBy: 'gemini-embedding-001',
    version: '004',
    lastUpdate: '2024-04'
  }
};

/**
 * Get a Gemini model by canonical name or alias.
 * Falls back to 'gemini-2.5-pro' if not found.
 */
export function getGeminiModel(modelName: string): GeminiModel {
  return GEMINI_MODELS[modelName] || GEMINI_MODELS['gemini-2.5-pro'];
}

/**
 * Get the recommended model for a given agent type (extensible mapping).
 */
export function getModelForAgentType(agentType: string): GeminiModel {
  // Example mapping, update as needed for your agent taxonomy
  switch (agentType) {
    case 'advanced':
      return GEMINI_MODELS['gemini-2.5-pro'];
    case 'flash':
      return GEMINI_MODELS['gemini-2.5-flash'];
    case 'pro':
      return GEMINI_MODELS['gemini-2.5-pro'];
    case 'lite':
      return GEMINI_MODELS['gemini-2.5-flash-lite'];
    case 'embedding':
      return GEMINI_MODELS['gemini-embedding-001'];
    default:
      return GEMINI_MODELS['gemini-2.5-flash']; // Default to best price-performance
  }
}

/**
 * List all available Gemini models (canonical order).
 */
export function listGeminiModels(): GeminiModel[] {
  return Object.values(GEMINI_MODELS);
}

/**
 * Get the recommended replacement for deprecated models.
 */
export function getRecommendedReplacement(modelName: string): GeminiModel {
  const model = GEMINI_MODELS[modelName];
  if (model?.deprecated && model.replacedBy) {
    return GEMINI_MODELS[model.replacedBy];
  }
  return model || GEMINI_MODELS['gemini-2.5-flash'];
}

/**
 * Get all non-deprecated models for production use.
 */
export function getProductionModels(): GeminiModel[] {
  return Object.values(GEMINI_MODELS).filter(model => !model.deprecated);
}

/**
 * Get the latest embedding model (recommended for new implementations).
 */
export function getLatestEmbeddingModel(): GeminiModel {
  return GEMINI_MODELS['gemini-embedding-001'];
}
