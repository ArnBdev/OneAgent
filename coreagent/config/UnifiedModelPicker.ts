/**
 * UnifiedModelPicker.ts
 * Provider-agnostic model picker that wraps existing provider registries.
 *
 * Goals:
 * - Single, extensible entrypoint for selecting models by role/use-case
 * - Clear roles per model (llm vs embedding, demanding vs fast)
 * - No duplication: delegates to canonical Gemini registry today
 * - Future-ready for other providers (OpenAI, Anthropic, etc.)
 */

import { GEMINI_MODELS } from './gemini-model-registry';
import { SmartOpenAIClient } from '../tools/SmartOpenAIClient';
import SmartGeminiClient from '../tools/SmartGeminiClient';

import { OPENAI_MODELS } from './openai-model-registry';

/**
 * Kapabilitetsbasert modellvelger for OneAgent
 */
export type ModelCapability =
  | 'fast_text'
  | 'advanced_text'
  | 'fast_multimodal'
  | 'advanced_multimodal'
  | 'embedding_text';
/**
 * Kapabilitetsbasert modellvalg
 *
 * Mapping:
 * - fast_text           => gemini-2.5-flash
 * - advanced_text       => gemini-2.5-pro
 * - fast_multimodal     => gemini-2.5-flash
 * - advanced_multimodal => gemini-2.5-pro
 */

export type ModelClient = SmartOpenAIClient | SmartGeminiClient;

// Simple in-memory client cache to prevent repeated instantiation noise
const clientCache = new Map<string, ModelClient>();

// Canonical embedding model selector (single source of truth)
export function getEmbeddingModel(): string {
  const source = (process.env.ONEAGENT_EMBEDDINGS_SOURCE || '').toLowerCase();
  if (source === 'openai' && process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  }
  // Default to Gemini embedding model
  return 'gemini-embedding-001';
}

/**
 * Provider-agnostic embedding client factory with minimal surface required by EmbeddingCacheService
 */
export function getEmbeddingClient(): ModelClient {
  const source = (process.env.ONEAGENT_EMBEDDINGS_SOURCE || '').toLowerCase();
  if (source === 'openai' && process.env.OPENAI_API_KEY) {
    return new SmartOpenAIClient({
      apiKey: process.env.OPENAI_API_KEY,
      model: getEmbeddingModel(),
    });
  }
  return new SmartGeminiClient({ apiKey: process.env.GEMINI_API_KEY, model: getEmbeddingModel() });
}

export function getModelFor(capability: ModelCapability): ModelClient {
  // Normalize generation capability; embedding_text selects a lightweight generation client plus exposes EMBEDDING_MODEL externally
  const effectiveCap = capability === 'embedding_text' ? 'fast_text' : capability;

  const buildKey = (provider: string, model: string) => `${provider}:${model}:${effectiveCap}`;

  const getOrCreateGemini = (modelName: string): SmartGeminiClient => {
    const key = buildKey('gemini', modelName);
    const cached = clientCache.get(key) as SmartGeminiClient | undefined;
    if (cached) return cached;
    const created = new SmartGeminiClient({ apiKey: process.env.GEMINI_API_KEY, model: modelName });
    clientCache.set(key, created);
    return created;
  };
  const getOrCreateOpenAI = (modelName: string): SmartOpenAIClient => {
    const key = buildKey('openai', modelName);
    const cached = clientCache.get(key) as SmartOpenAIClient | undefined;
    if (cached) return cached;
    const created = new SmartOpenAIClient({
      apiKey: process.env.OPENAI_API_KEY!,
      model: modelName,
    });
    clientCache.set(key, created);
    return created;
  };

  if (capability === 'embedding_text') {
    // Return a fast text client for any optional generation needs; callers must use getEmbeddingModel() for embedding ops
    const modelName =
      Object.keys(GEMINI_MODELS).find((m) => m.includes('flash')) || 'gemini-2.5-flash';
    return getOrCreateGemini(modelName);
  }
  if (effectiveCap === 'advanced_text') {
    if (
      process.env.OPENAI_API_KEY &&
      (process.env.ONEAGENT_PREFER_OPENAI === '1' || process.env.ONEAGENT_DISABLE_GEMINI === '1')
    ) {
      const modelName = Object.keys(OPENAI_MODELS)[0]; // default 'gpt-4o'
      return getOrCreateOpenAI(modelName);
    }
    const modelName = Object.keys(GEMINI_MODELS).find((m) => m.includes('pro')) || 'gemini-2.5-pro';
    return getOrCreateGemini(modelName);
  }
  if (effectiveCap === 'fast_text') {
    if (
      process.env.OPENAI_API_KEY &&
      (process.env.ONEAGENT_PREFER_OPENAI === '1' || process.env.ONEAGENT_DISABLE_GEMINI === '1')
    ) {
      const modelName = Object.keys(OPENAI_MODELS).find((m) => m.includes('mini')) || 'gpt-4o';
      return getOrCreateOpenAI(modelName);
    }
    const modelName =
      Object.keys(GEMINI_MODELS).find((m) => m.includes('flash')) || 'gemini-2.5-flash';
    return getOrCreateGemini(modelName);
  }
  if (effectiveCap === 'fast_multimodal') {
    if (
      process.env.OPENAI_API_KEY &&
      (process.env.ONEAGENT_PREFER_OPENAI === '1' || process.env.ONEAGENT_DISABLE_GEMINI === '1')
    ) {
      const modelName = Object.keys(OPENAI_MODELS)[0];
      return getOrCreateOpenAI(modelName);
    }
    const modelName =
      Object.keys(GEMINI_MODELS).find((m) => m.includes('flash')) || 'gemini-2.5-flash';
    return getOrCreateGemini(modelName);
  }
  if (effectiveCap === 'advanced_multimodal') {
    if (
      process.env.OPENAI_API_KEY &&
      (process.env.ONEAGENT_PREFER_OPENAI === '1' || process.env.ONEAGENT_DISABLE_GEMINI === '1')
    ) {
      const modelName = Object.keys(OPENAI_MODELS)[0];
      return getOrCreateOpenAI(modelName);
    }
    const modelName = Object.keys(GEMINI_MODELS).find((m) => m.includes('pro')) || 'gemini-2.5-pro';
    return getOrCreateGemini(modelName);
  }
  if (
    process.env.OPENAI_API_KEY &&
    (process.env.ONEAGENT_PREFER_OPENAI === '1' || process.env.ONEAGENT_DISABLE_GEMINI === '1')
  ) {
    const fallbackOpenAI = Object.keys(OPENAI_MODELS)[0];
    return getOrCreateOpenAI(fallbackOpenAI);
  }
  const fallback =
    Object.keys(GEMINI_MODELS).find((m) => m.includes('flash')) || 'gemini-2.5-flash';
  return getOrCreateGemini(fallback);
}
