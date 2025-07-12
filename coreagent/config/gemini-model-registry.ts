// Gemini Model Registry for OneAgent
// MCP 2025-06-18 compliant, modular, and extensible
// Canonical Gemini model list based on Google official documentation (2025-06)
// See: https://ai.google.dev/pricing and https://ai.google.dev/models/gemini

export interface GeminiModel {
  name: string; // Canonical model name (e.g., 'gemini-2.5-pro', 'gemini-embedding-exp-03-07')
  tier: 'pro' | 'flash' | 'lite' | 'embedding';
  type: 'llm' | 'embedding';
  description: string;
  pricingUSDper1Ktokens: number; // Standardized pricing (USD per 1K tokens, as of 2025-06)
  inputLimitTokens?: number;
  outputLimitTokens?: number;
  version?: string;
  [key: string]: any; // For extensibility
}

export const GEMINI_MODELS: Record<string, GeminiModel> = {
  'gemini-2.5-pro': {
    name: 'gemini-2.5-pro',
    tier: 'pro',
    type: 'llm',
    description: 'Gemini 2.5 Pro (latest, full context, best for complex tasks)',
    pricingUSDper1Ktokens: 1.00,
    inputLimitTokens: 1048576,
    outputLimitTokens: 8192,
    version: '2.5'
  },
  'gemini-2.5-flash': {
    name: 'gemini-2.5-flash',
    tier: 'flash',
    type: 'llm',
    description: 'Gemini 2.5 Flash (ultra-fast, cost-effective, lower latency)',
    pricingUSDper1Ktokens: 0.35,
    inputLimitTokens: 1048576,
    outputLimitTokens: 8192,
    version: '2.5-flash'
  },
  'gemini-2.5-lite': {
    name: 'gemini-2.5-lite',
    tier: 'lite',
    type: 'llm',
    description: 'Gemini 2.5 Lite (lightweight, lowest cost, for simple tasks)',
    pricingUSDper1Ktokens: 0.10,
    inputLimitTokens: 32768,
    outputLimitTokens: 4096,
    version: '2.5-lite'
  },
  'gemini-embedding-exp-03-07': {
    name: 'gemini-embedding-exp-03-07',
    tier: 'embedding',
    type: 'embedding',
    description: 'Gemini Embedding Experimental (SOTA, multi-lingual/code/retrieval, elastic output, March 2025)',
    pricingUSDper1Ktokens: 0.13, // Use latest pricing if available
    inputLimitTokens: 8192,
    outputLimitTokens: 8192, // Embedding output is vector, not tokens
    outputDimensions: [3072, 1536, 768],
    experimental: true,
    version: 'exp-03-07',
    lastUpdate: '2025-03'
  },
  'text-embedding-004': {
    name: 'text-embedding-004',
    tier: 'embedding',
    type: 'embedding',
    description: 'Text Embedding 004 (SOTA, best for new projects, April 2024)',
    pricingUSDper1Ktokens: 0.13, // Use latest pricing if available
    inputLimitTokens: 2048,
    outputLimitTokens: 2048, // Embedding output is vector, not tokens
    outputDimensions: [768],
    experimental: false,
    version: '004',
    lastUpdate: '2024-04',
    recommended: true
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
      return GEMINI_MODELS['gemini-advanced'];
    case 'flash':
      return GEMINI_MODELS['gemini-2.5-flash'];
    case 'pro':
      return GEMINI_MODELS['gemini-2.5-pro'];
    default:
      return GEMINI_MODELS['gemini-2.5-pro'];
  }
}

/**
 * List all available Gemini models (canonical order).
 */
export function listGeminiModels(): GeminiModel[] {
  return Object.values(GEMINI_MODELS);
}
