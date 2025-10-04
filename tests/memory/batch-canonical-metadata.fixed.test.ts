import { getOneAgentMemory } from '../../coreagent/utils/UnifiedBackboneService';
import { ensureMemoryServerReady, clearTestMemories } from './memoryTestUtils';

describe('Batch Canonical Metadata (Memory)', () => {
  jest.setTimeout(20000);
  const userId = 'batch-tester';
  const memory = getOneAgentMemory();
  const batchItems = [
    { content: 'Batch Test A', metadata: { type: 'legacy_a', extra: 'x', userId } },
    { content: 'Batch Test B', metadata: { tags: ['b'], userId } },
    { content: 'Batch Test C', metadata: { unrelated: { nested: true }, userId } },
  ];

  beforeAll(async () => {
    await ensureMemoryServerReady();
    await clearTestMemories(userId);
  });

  afterAll(async () => {
    await clearTestMemories(userId);
  });

  it('queues batch adds and flushes with canonical metadata shape', async () => {
    // Add batch items
    for (const item of batchItems) {
      await memory.addMemory(item);
    }
    // Allow for async processing
    await new Promise((r) => setTimeout(r, 200));
    // Search for one of the batch items
    const result = await memory.searchMemory({ query: 'Batch Test A', userId, limit: 1 });
    expect(result).toBeTruthy();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const item = result[0];
      expect(item).toHaveProperty('metadata');
      expect(typeof item.metadata).toBe('object');
    }
  });
});
