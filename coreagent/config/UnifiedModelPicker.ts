/**
 * UnifiedModelPicker.ts
 * MULTI-PROVIDER, CAPABILITY-BASED MODEL SELECTION
 *
 * Architecture Goals:
 * - Provider-agnostic: Support OpenAI, Gemini, Claude, Local models
 * - Capability-based: Select by task requirements (utility, reasoning, analysis)
 * - Cost-optimized: Automatic routing to most cost-effective model for capability
 * - Modality-aware: Text, multimodal, embedding support
 * - Future-ready: Extensible for new providers without breaking changes
 *
 * Epic 15 Implementation: Tiered capabilities with -latest aliases
 * - utility: High-throughput, cost-sensitive (flash-lite-latest)
 * - agentic_reasoning: Main agent work, tool use (flash-latest)
 * - deep_analysis: Complex reasoning, BMAD, Constitutional AI (pro-latest)
 */

import { GEMINI_MODELS } from './gemini-model-registry';
import { SmartOpenAIClient } from '../tools/SmartOpenAIClient';
import SmartGeminiClient from '../tools/SmartGeminiClient';

/**
 * EPIC 15: Capability-based model selection (multi-provider)
 *
 * Capabilities map to cost/quality/latency requirements:
 * - utility:              Fast, cheap, high-throughput (triage, logging, routing)
 * - agentic_reasoning:    Balanced, tool use, main agent work (BaseAgent default)
 * - deep_analysis:        Complex reasoning, multi-step, critical decisions (BMAD, Constitutional AI)
 * - fast_multimodal:      Quick image/audio processing
 * - advanced_multimodal:  Deep multimodal analysis
 * - embedding_text:       Vector embeddings for memory/search
 *
 * Provider Selection (configurable via env):
 * - ONEAGENT_PREFER_OPENAI=1: Use OpenAI models (gpt-4o, gpt-4o-mini)
 * - Default: Use Gemini models (gemini-flash-latest, gemini-flash-lite-latest)
 * - Future: ONEAGENT_PREFER_CLAUDE=1, ONEAGENT_PREFER_LOCAL=1
 */
export type ModelCapability =
  | 'utility' // Epic 15: High-throughput, cost-optimized (flash-lite, gpt-4o-mini)
  | 'agentic_reasoning' // Epic 15: Main agent work, tool use (flash, gpt-4o)
  | 'deep_analysis' // Epic 15: Complex reasoning (pro, o1-preview)
  | 'fast_text' // Legacy: fast text (preserved for backward compat)
  | 'advanced_text' // Legacy: advanced text (preserved for backward compat)
  | 'fast_multimodal' // Multimodal: fast image/audio
  | 'advanced_multimodal' // Multimodal: advanced image/audio
  | 'embedding_text'; // Embeddings: vector generation

/**
 * CAPABILITY TIER MAPPING (Epic 15 Architecture)
 *
 * | Capability         | Use Cases                          | Gemini Model           | OpenAI Model       | Cost/1M | Latency |
 * |--------------------|-----------------------------------|------------------------|--------------------| ------- |---------|
 * | utility            | Triage, routing, logging          | gemini-flash-lite-latest | gpt-4o-mini      | $0.10   | ~200ms  |
 * | agentic_reasoning  | Agent execution, tool calls       | gemini-flash-latest    | gpt-4o           | $0.35   | ~400ms  |
 * | deep_analysis      | BMAD, Constitutional AI, complex  | gemini-pro-latest      | o1-preview       | $1.00   | ~2s     |
 * | fast_multimodal    | Image/audio quick processing      | gemini-flash-latest    | gpt-4o           | $0.35   | ~500ms  |
 * | advanced_multimodal| Deep image/audio analysis         | gemini-pro-latest      | gpt-4o           | $1.00   | ~1s     |
 * | embedding_text     | Memory, search, semantic vectors  | gemini-embedding-001   | text-embed-3-small | $0.13 | ~100ms  |
 */

export type ModelClient = SmartOpenAIClient | SmartGeminiClient;

// Simple in-memory client cache to prevent repeated instantiation noise
/**
 * ARCHITECTURAL EXCEPTION: This Map is used for ephemeral client caching to prevent
 * repeated instantiation. It is NOT persistent business state. Allowed for performance optimization.
 */
// eslint-disable-next-line oneagent/no-parallel-cache
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
  // Epic 15: Map new capabilities to legacy for backward compatibility
  let effectiveCap: ModelCapability = capability;

  // Backward compatibility: Map Epic 15 capabilities to existing models
  if (capability === 'utility') effectiveCap = 'fast_text'; // Upgrade to lite model below
  if (capability === 'agentic_reasoning') effectiveCap = 'fast_text';
  if (capability === 'deep_analysis') effectiveCap = 'advanced_text';
  if (capability === 'embedding_text') effectiveCap = 'fast_text'; // Embedding handled separately

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

  // Epic 15: Embedding capability (unchanged)
  if (capability === 'embedding_text') {
    const modelName =
      Object.keys(GEMINI_MODELS).find((m) => m.includes('flash')) || 'gemini-flash-latest';
    return getOrCreateGemini(modelName);
  }

  // Epic 15: Multi-provider capability routing
  const preferOpenAI = process.env.ONEAGENT_PREFER_OPENAI === '1' && process.env.OPENAI_API_KEY;

  // Route based on capability tier (Epic 15 implementation)
  if (capability === 'utility') {
    // High-throughput, cost-sensitive tasks (triage, routing, logging)
    if (preferOpenAI) {
      return getOrCreateOpenAI('gpt-4o-mini'); // OpenAI cheapest
    }
    return getOrCreateGemini('gemini-flash-lite-latest'); // Gemini cheapest (70% savings!)
  }

  if (
    capability === 'agentic_reasoning' ||
    effectiveCap === 'fast_text' ||
    effectiveCap === 'fast_multimodal'
  ) {
    // Main agent work, tool use, fast multimodal
    if (preferOpenAI) {
      return getOrCreateOpenAI('gpt-4o'); // OpenAI balanced
    }
    return getOrCreateGemini('gemini-flash-latest'); // Gemini balanced (auto-updates!)
  }

  if (
    capability === 'deep_analysis' ||
    effectiveCap === 'advanced_text' ||
    effectiveCap === 'advanced_multimodal'
  ) {
    // Complex reasoning, BMAD, Constitutional AI, advanced multimodal
    if (preferOpenAI) {
      return getOrCreateOpenAI('o1-preview'); // OpenAI deepest reasoning
    }
    return getOrCreateGemini('gemini-pro-latest'); // Gemini deepest (auto-updates!)
  }

  // Fallback: Use fast_text behavior (Gemini Flash)
  return getOrCreateGemini('gemini-flash-latest');
}
