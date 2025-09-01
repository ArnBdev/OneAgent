import { OneAgentMemory } from '../memory/OneAgentMemory';
import { getModelFor } from '../config/UnifiedModelPicker';
import { embeddingCacheService } from '../services/EmbeddingCacheService';

export interface RuleMatch {
  id: string;
  text: string;
  similarity: number;
  domain?: string;
}

export interface ComplianceResult {
  allowed: boolean;
  score: number; // max matched similarity
  topMatches: RuleMatch[];
  reason?: string;
}

/**
 * ConstitutionValidator: Embedding-based semantic validator for pre-execution checks.
 * - Retrieves constitutional rules from memory (synced via SyncService)
 * - Computes embedding similarity with the action description
 * - If a high-similarity rule contains a prohibitive pattern, block execution
 */
export class ConstitutionValidator {
  private memory = OneAgentMemory.getInstance();
  private gemini = getModelFor('embedding_text');

  constructor(private opts: { topK?: number; threshold?: number } = {}) {}

  async check(actionDescription: string): Promise<ComplianceResult> {
    const topK = this.opts.topK ?? 5;
    const threshold = this.opts.threshold ?? 0.32;

    // Fast-test mode: allow by default
    if (process.env.ONEAGENT_FAST_TEST_MODE === '1') {
      return { allowed: true, score: 0, topMatches: [], reason: 'fast_test_mode' };
    }

    // Fetch up to 50 constitutional rules from memory (by tag/category text search)
    const search = await this.memory.searchMemory({
      query: 'constitutional_rule',
      userId: 'system',
      limit: 50,
    });
    const rules = (search?.results || []).map((r) => String(r.content)).filter(Boolean);
    if (rules.length === 0) {
      return { allowed: true, score: 0, topMatches: [], reason: 'no_rules_found' };
    }

    // Compute similarities if client exposes embedding API (GeminiClient or SmartGeminiClient pass-through)
    const maybe: unknown = this.gemini as unknown;
    const canEmbed =
      typeof maybe === 'object' &&
      maybe !== null &&
      'generateEmbedding' in maybe &&
      typeof (maybe as { generateEmbedding: unknown }).generateEmbedding === 'function' &&
      'generateEmbeddingBatch' in maybe &&
      typeof (maybe as { generateEmbeddingBatch: unknown }).generateEmbeddingBatch === 'function';

    if (canEmbed) {
      // Narrow to minimal embedding-capable client surface (avoid any)
      type EmbeddingLike = {
        generateEmbedding: (
          text: string,
          options?: Record<string, unknown>,
        ) => Promise<{
          embedding: number[];
        }>;
        generateEmbeddingBatch: (
          texts: string[],
          options?: Record<string, unknown>,
        ) => Promise<Array<{ embedding: number[] }>>;
      };
      const embedClient = maybe as EmbeddingLike;

      // Cached query embedding
      const queryVec = await embeddingCacheService.getOrCompute(
        embedClient,
        actionDescription,
        'query',
      );
      // Batch cached rule embeddings
      const ruleMap = await embeddingCacheService.getOrComputeBatch(embedClient, rules, 'rule');

      const batch = rules.map((r) => ({ embedding: ruleMap.get(r)! }));
      const queryNorm = embeddingCacheService.getNorm('query', actionDescription) || undefined;

      interface EmbeddingBatchItem {
        embedding: number[];
      }
      interface SimilarityObj {
        idx: number;
        sim: number;
      }
      const sims: SimilarityObj[] = batch.map((b: EmbeddingBatchItem, i: number) => {
        const ruleText = rules[i];
        const ruleNorm = embeddingCacheService.getNorm('rule', ruleText) || undefined;
        const sim = embeddingCacheService.cosineSimilarity(
          queryVec,
          b.embedding,
          queryNorm,
          ruleNorm,
        );
        return { idx: i, sim };
      });
      sims.sort((a: SimilarityObj, b: SimilarityObj) => b.sim - a.sim);

      const top = sims
        .slice(0, topK)
        .map((s: SimilarityObj) => ({ id: String(s.idx), text: rules[s.idx], similarity: s.sim }));
      const maxSim = top.length ? top[0].similarity : 0;

      // Simple prohibition heuristic: block if top match includes strong negation and is above threshold
      const prohibitive = top.find(
        (m: { similarity: number; text: string }) =>
          m.similarity >= threshold &&
          /\b(never|forbid|prohibited|do not|avoid|must not|ban|illegal)\b/i.test(m.text),
      );

      if (prohibitive) {
        return {
          allowed: false,
          score: maxSim,
          topMatches: top,
          reason: `Prohibitive rule matched with similarity ${prohibitive.similarity.toFixed(3)}`,
        };
      }

      return { allowed: true, score: maxSim, topMatches: top };
    }
    // If not GeminiClient, fallback to allow
    return { allowed: true, score: 0, topMatches: [], reason: 'Non-Gemini client, fallback allow' };
  }
}

export default ConstitutionValidator;
