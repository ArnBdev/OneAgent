/**
 * Unit tests for ConstitutionValidator
 */
import ConstitutionValidator from '../../validation/ConstitutionValidator';
import { OneAgentMemory } from '../../memory/OneAgentMemory';
import { GeminiClient } from '../../tools/geminiClient';
import type { EmbeddingResult } from '../../types/gemini';
// Removed unused imports after canonical mock fix

// Ensure fast mode is disabled for these tests so validator doesn't auto-allow
delete process.env.ONEAGENT_FAST_TEST_MODE;

describe('ConstitutionValidator.check', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    // Reset memory singleton
    (OneAgentMemory as unknown as { instance: unknown | null }).instance = null;
  });

  function mockSearchMemoryWith(rules: string[]) {
    // Canonical MemorySearchResult[] mock
    const payload = rules.map((r, i) => ({
      id: `r${i}`,
      content: r,
      metadata: {
        type: 'memory',
        userId: 'system',
        category: 'constitutional_rule',
        tags: ['test'],
        timestamp: new Date().toISOString(),
      },
    }));
    jest.spyOn(OneAgentMemory.prototype, 'searchMemory').mockResolvedValue(payload);
  }

  function mockEmbeddings(queryVec: number[], docVecs: number[][]) {
    const queryRes: EmbeddingResult = {
      embedding: queryVec,
      text: 'q',
      dimensions: queryVec.length,
      timestamp: new Date().toISOString(),
    };
    const docRes: EmbeddingResult[] = docVecs.map((v) => ({
      embedding: v,
      text: 'd',
      dimensions: v.length,
      timestamp: new Date().toISOString(),
    }));

    jest.spyOn(GeminiClient.prototype, 'generateEmbedding').mockResolvedValue(queryRes);
    jest.spyOn(GeminiClient.prototype, 'generateEmbeddingBatch').mockResolvedValue(docRes);
  }

  it('allows when action matches permissive "should" rule', async () => {
    mockSearchMemoryWith([
      'You should be helpful and provide clear explanations.',
      'You must not leak credentials.',
    ]);
    // Make query align with first rule strongly
    mockEmbeddings(
      [1, 0, 0],
      [
        [1, 0, 0], // high sim to permissive rule
        [0, 1, 0],
      ],
    );

    const validator = new ConstitutionValidator({ threshold: 0.3, topK: 3 });
    const res = await validator.check('Provide a clear explanation of system behavior.');
    expect(res.allowed).toBe(true);
    expect(res.score).toBeGreaterThan(0.9);
  });

  it('blocks when action matches prohibitive rule above threshold', async () => {
    mockSearchMemoryWith([
      'You must not share personally identifiable information (PII) publicly.',
      'Encourage safe and ethical usage.',
    ]);
    // Make query align with first (prohibitive) rule strongly
    mockEmbeddings(
      [1, 0, 0],
      [
        [1, 0, 0], // high sim to prohibitive
        [0, 1, 0],
      ],
    );

    const validator = new ConstitutionValidator({ threshold: 0.32, topK: 3 });
    const res = await validator.check("Share the user's email address with the channel.");
    expect(res.allowed).toBe(false);
    expect(res.reason).toMatch(/Prohibitive rule matched/);
  });

  it('respects threshold to allow borderline similarities', async () => {
    mockSearchMemoryWith([
      'Do not write files to unauthorized locations.',
      'Be concise when possible.',
    ]);
    // Borderline similarity to prohibitive rule (~0.33)
    mockEmbeddings(
      [1, 0, 0],
      [
        [0.33, Math.sqrt(1 - 0.33 * 0.33), 0],
        [0.1, Math.sqrt(1 - 0.1 * 0.1), 0],
      ],
    );

    // Use slightly higher threshold so it passes
    const validator = new ConstitutionValidator({ threshold: 0.4, topK: 3 });
    const res = await validator.check('Write a temporary note to buffer only.');
    expect(res.allowed).toBe(true);
  });
});
