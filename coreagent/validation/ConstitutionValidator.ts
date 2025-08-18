import { OneAgentMemory } from '../memory/OneAgentMemory';
import { GeminiClient } from '../tools/geminiClient';
import { pickDefault } from '../config/UnifiedModelPicker';

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
  private gemini = new GeminiClient({
    apiKey: process.env.GEMINI_API_KEY || '',
    model: pickDefault('embedding').name,
  });

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

    // Compute similarities
    const query = await this.gemini.generateEmbedding(actionDescription, {
      model: 'gemini-embedding-001',
      taskType: 'RETRIEVAL_QUERY',
    });
    const batch = await this.gemini.generateEmbeddingBatch(rules, {
      model: 'gemini-embedding-001',
      taskType: 'RETRIEVAL_DOCUMENT',
    });

    const sims = batch.map((b, i) => ({
      idx: i,
      sim: GeminiClient.calculateCosineSimilarity(query.embedding, b.embedding),
    }));
    sims.sort((a, b) => b.sim - a.sim);

    const top = sims
      .slice(0, topK)
      .map((s) => ({ id: String(s.idx), text: rules[s.idx], similarity: s.sim }));
    const maxSim = top.length ? top[0].similarity : 0;

    // Simple prohibition heuristic: block if top match includes strong negation and is above threshold
    const prohibitive = top.find(
      (m) =>
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
}

export default ConstitutionValidator;
