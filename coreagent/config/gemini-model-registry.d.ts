export interface GeminiModel {
  name: string;
  tier: 'pro' | 'flash' | 'lite' | 'embedding';
  type: 'llm' | 'embedding';
  description: string;
  pricingUSDper1Ktokens: number;
  inputLimitTokens?: number;
  outputLimitTokens?: number;
  version?: string;
  [key: string]: any;
}
export declare const GEMINI_MODELS: Record<string, GeminiModel>;
/**
 * Get a Gemini model by canonical name or alias.
 * Falls back to 'gemini-2.5-pro' if not found.
 */
export declare function getGeminiModel(modelName: string): GeminiModel;
/**
 * Get the recommended model for a given agent type (extensible mapping).
 */
export declare function getModelForAgentType(agentType: string): GeminiModel;
/**
 * List all available Gemini models (canonical order).
 */
export declare function listGeminiModels(): GeminiModel[];
