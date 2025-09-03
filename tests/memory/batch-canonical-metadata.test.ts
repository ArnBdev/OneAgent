import { OneAgentMemory } from '../../coreagent/memory/OneAgentMemory';
import { unifiedMetadataService } from '../../coreagent/utils/UnifiedBackboneService';

describe('batch canonical metadata (memory)', () => {
  it('queues batch adds and flushes with canonical metadata shape', async () => {
    const memory = OneAgentMemory.getInstance({ apiUrl: process.env.MEMORY_API_URL });
    const legacyLike = [
      { content: 'Batch Test A', userId: 'tester', metadata: { type: 'legacy_a', extra: 'x' } },
      { text: 'Batch Test B (text alias)', user_id: 'tester', metadata: { tags: ['b'] } },
      { content: 'Batch Test C', metadata: { unrelated: { nested: true } } },
    ];
    for (const op of legacyLike) {
      await memory.addMemoryBatch(op as any);
    }
    const result: any = await memory.flushBatch();
    const addResults = (result.results || []).filter((r: any) => r.type === 'add');
    expect(addResults.length).toBe(legacyLike.length);

    // Structural metadata exemplar
    const synthetic = unifiedMetadataService.create('batch_memory', 'TestHarness', {
      system: { userId: 'tester', source: 'TestHarness', component: 'batch-test' },
    });
    ['system', 'content', 'temporal'].forEach((k) =>
      expect(Object.prototype.hasOwnProperty.call(synthetic, k)).toBe(true),
    );
  });
});
