// OpenAI Model Registry for OneAgent (minimal placeholder for provider-agnostic picker)
// Keep metadata conservative; avoid fabricating specifics.

export interface OpenAIModel {
  name: string; // e.g., 'gpt-5', 'gpt-5-mini', 'gpt-5-nano'
  tier: 'pro' | 'mini' | 'nano';
  type: 'llm';
  description?: string;
  pricingUSDper1Ktokens?: number; // optional, not set without source
  inputLimitTokens?: number; // optional
  outputLimitTokens?: number; // optional
  supportsThinking?: boolean; // capability flag, not a toggle
  deprecated?: boolean;
  replacedBy?: string;
  lastUpdate?: string;
}

export const OPENAI_MODELS: Record<string, OpenAIModel> = {
  'gpt-5': {
    name: 'gpt-5',
    tier: 'pro',
    type: 'llm',
    description: 'OpenAI GPT-5 (general-purpose, advanced reasoning)',
    supportsThinking: true,
  },
  'gpt-5-mini': {
    name: 'gpt-5-mini',
    tier: 'mini',
    type: 'llm',
    description: 'OpenAI GPT-5 Mini (cost/performance optimized)',
  },
  'gpt-5-nano': {
    name: 'gpt-5-nano',
    tier: 'nano',
    type: 'llm',
    description: 'OpenAI GPT-5 Nano (ultra-light, high throughput)',
  },
};

export function listOpenAIModels(): OpenAIModel[] {
  return Object.values(OPENAI_MODELS);
}
