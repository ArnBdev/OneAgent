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

import { createUnifiedId, createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import { GEMINI_MODELS, type GeminiModel } from './gemini-model-registry';

/**
 * Kapabilitetsbasert modellvelger for OneAgent
 */
export type ModelCapability =
  | 'fast_text'
  | 'advanced_text'
  | 'fast_multimodal'
  | 'advanced_multimodal';
/**
 * Kapabilitetsbasert modellvalg
 *
 * Mapping:
 * - fast_text           => gemini-2.5-flash
 * - advanced_text       => gemini-2.5-pro
 * - fast_multimodal     => gemini-2.5-flash-latest
 * - advanced_multimodal => gemini-2.5-pro-latest
 */
export function getModelFor(capability: ModelCapability): ModelPick {
  switch (capability) {
    case 'fast_text':
      return pickGemini('gemini-2.5-flash', 'Fast tekstmodell (kapabilitet)');
    case 'advanced_text':
      return pickGemini('gemini-2.5-pro', 'Avansert tekstmodell (kapabilitet)');
    case 'fast_multimodal':
      return pickGemini('gemini-2.5-flash-latest', 'Rask multimodal modell (kapabilitet)');
    case 'advanced_multimodal':
      return pickGemini('gemini-2.5-pro-latest', 'Avansert multimodal modell (kapabilitet)');
    default:
      return pickGemini('gemini-2.5-flash', 'Fallback: ukjent kapabilitet');
  }
}

export type ModelKind = 'llm' | 'embedding' | 'vision' | 'audio' | 'multimodal';
export type ProviderId = 'google' | 'openai' | (string & {});

export interface ModelPick {
  provider: ProviderId;
  name: string; // provider-native model name
  kind: ModelKind;
  tier: 'premium' | 'standard' | 'budget' | 'embedding';
  reason: string;
  catalogId: string;
  addedAtIso: string;
  deprecated?: boolean;
  replacedBy?: string;
  settings?: {
    // Optional toggles for provider features (Phase 1 minimal)
    thinking?: boolean;
  };
}

/** Map Gemini registry model -> unified pick metadata (no duplication) */
function mapGeminiToPick(name: string, m: GeminiModel, reason: string): ModelPick {
  const kind: ModelKind = m.type === 'embedding' ? 'embedding' : 'llm';
  const tier =
    m.tier === 'pro'
      ? 'premium'
      : m.tier === 'flash'
        ? 'standard'
        : m.tier === 'lite'
          ? 'budget'
          : 'embedding';
  const ts = createUnifiedTimestamp();
  return {
    provider: 'google',
    name,
    kind,
    tier,
    reason,
    // Use allowed IdType 'operation' with descriptive context to avoid new IdType category
    catalogId: createUnifiedId('operation', `model_catalog:google:${name}`),
    addedAtIso: ts.iso,
    deprecated: m.deprecated,
    replacedBy: m.replacedBy,
  };
}

/**
 * Opinionated defaults for common roles
 * - demanding_llm: best for complex reasoning (gemini-2.5-pro)
 * - fast_llm: best price-performance and throughput (gemini-2.5-flash)
 * - ultrafast_llm: lowest latency / budget mode (gemini-2.5-flash-lite)
 * - embedding: stable embedding model (gemini-embedding-001)
 */
export type CommonRole = 'demanding_llm' | 'fast_llm' | 'ultrafast_llm' | 'embedding';

export function pickDefault(role: CommonRole): ModelPick {
  switch (role) {
    case 'demanding_llm':
      return pickGemini('gemini-2.5-pro', 'Default demanding LLM');
    case 'fast_llm':
      return pickGemini('gemini-2.5-flash', 'Default fast LLM');
    case 'ultrafast_llm':
      return pickGemini('gemini-2.5-flash-lite', 'Default ultrafast LLM');
    case 'embedding':
      return pickGemini('gemini-embedding-001', 'Default embedding model');
    default:
      return pickGemini('gemini-2.5-flash', 'Fallback default');
  }
}

/**
 * Generic picker for provider+name (Phase 1: Google only)
 */
export function pick(provider: ProviderId, name: string, reason = 'Explicit selection'): ModelPick {
  if (provider === 'google') return pickGemini(name, reason);
  if (provider === 'openai') return pickOpenAI(name, reason);
  // Future: add OpenAI/Anthropic adapters here
  return pickGemini('gemini-2.5-flash', `Fallback to Google: ${reason}`);
}

/** Ensure embeddings are representable via picker */
export function getEmbeddingDefault(): ModelPick {
  return pickDefault('embedding');
}

/** Select with optional provider feature settings (e.g., thinking) */
export function pickWithOptions(
  provider: ProviderId,
  name: string,
  options?: { thinking?: boolean },
  reason = 'Explicit selection with options',
): ModelPick {
  const base = pick(provider, name, reason);
  return { ...base, settings: { ...base.settings, ...options } };
}

// ================= Internal helpers =================
function pickGemini(name: string, reason: string): ModelPick {
  const gm = GEMINI_MODELS[name];
  if (!gm) {
    // If not found, prefer flash as safe default
    const fallback = GEMINI_MODELS['gemini-2.5-flash'];
    return mapGeminiToPick(
      'gemini-2.5-flash',
      fallback,
      `Fallback for unknown '${name}': ${reason}`,
    );
  }
  return mapGeminiToPick(name, gm, reason);
}

function pickOpenAI(name: string, reason: string): ModelPick {
  // Minimal OpenAI adapter (Phase 1) — map known GPT-5 variants
  // Source: https://platform.openai.com/docs/models/gpt-5 (details subject to provider docs)
  // We avoid asserting token limits/capabilities beyond tier/kind mapping.
  const tier: ModelPick['tier'] = name.includes('nano')
    ? 'budget'
    : name.includes('mini')
      ? 'standard'
      : 'premium';
  const kind: ModelKind = 'llm';
  const ts = createUnifiedTimestamp();
  return {
    provider: 'openai',
    name, // e.g., 'gpt-5', 'gpt-5-mini', 'gpt-5-nano'
    kind,
    tier,
    reason,
    catalogId: createUnifiedId('operation', `model_catalog:openai:${name}`),
    addedAtIso: ts.iso,
  };
}
