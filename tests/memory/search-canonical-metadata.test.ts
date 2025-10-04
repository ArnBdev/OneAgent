import { getOneAgentMemory } from '../../coreagent/utils/UnifiedBackboneService';
import { ensureMemoryServerReady, clearTestMemories } from './memoryTestUtils';

describe('Memory Search (Canonical)', () => {
  jest.setTimeout(20000);
  const userId = 'search-user';
  const testMemories = [
    {
      content: 'Search Test Memory A',
      metadata: { category: 'test', tags: ['search', 'a'], userId },
    },
    {
      content: 'Search Test Memory B',
      metadata: { category: 'test', tags: ['search', 'b'], userId },
    },
  ];
  const memory = getOneAgentMemory();

  beforeAll(async () => {
    await ensureMemoryServerReady();
    await clearTestMemories(userId);
    for (const m of testMemories) {
      await memory.addMemory(m);
    }
  });

  afterAll(async () => {
    await clearTestMemories(userId);
  });

  it('returns canonical-adapted structure and finds all test memories', async () => {
    const result = await memory.searchMemory({
      query: 'Search Test Memory',
      userId,
      limit: 5,
    });
    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);
    const first = result[0];
    const requiredKeys = ['id', 'content', 'metadata'];
    for (const k of requiredKeys) {
      expect(first).toHaveProperty(k);
    }
    expect(first.metadata && typeof first.metadata === 'object').toBe(true);
  });
});
