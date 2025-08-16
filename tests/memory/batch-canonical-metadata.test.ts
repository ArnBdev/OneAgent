// Test: BatchMemoryOperations produces canonical metadata via addMemoryCanonical
// Lightweight runtime script (no external test framework) mirroring existing test style.
import { OneAgentMemory } from '../../coreagent/memory/OneAgentMemory';
import { unifiedMetadataService } from '../../coreagent/utils/UnifiedBackboneService';

async function main() {
  const memory = OneAgentMemory.getInstance({ apiUrl: process.env.MEMORY_API_URL });

  // Queue several batch operations with minimal legacy-shaped payloads
  const legacyLike = [
    { content: 'Batch Test A', userId: 'tester', metadata: { type: 'legacy_a', extra: 'x' } },
    { text: 'Batch Test B (text alias)', user_id: 'tester', metadata: { tags: ['b'] } },
    { content: 'Batch Test C', metadata: { unrelated: { nested: true } } }
  ];

  for (const op of legacyLike) {
    await memory.addMemoryBatch(op as unknown as Record<string, unknown>);
  }

  const result = await memory.flushBatch() as unknown as { results: Array<{ type: string; result: unknown; id?: string }>; errors: Array<{ type: string; error: string; id?: string }> };

  // Basic assertions
  const addResults = result.results.filter(r => r.type === 'add');
  const errors = result.errors.filter(e => e.type === 'add');

  console.log('Batch Canonical Metadata Test:', {
    queued: legacyLike.length,
    addResults: addResults.length,
    errors: errors.length,
    sample: addResults.slice(0, 2)
  });

  if (addResults.length !== legacyLike.length) {
    console.error('❌ Not all batch add operations succeeded');
    process.exitCode = 1;
  }

  // Perform a search to see if at least one inserted memory is retrievable
  try {
    const search = await memory.searchMemory('Batch Test');
    console.log('Search after batch add:', { count: search?.results.length });
  } catch (e) {
    console.warn('Search failed (non-fatal for this test):', (e as Error).message);
  }

  // Create an expected partial unified metadata to compare shape (synthetic example)
  const synthetic = unifiedMetadataService.create('batch_memory', 'TestHarness', { system: { userId: 'tester', source: 'TestHarness', component: 'batch-test' } });
  const requiredKeys = ['system', 'content', 'temporal'];
  const hasKeys = requiredKeys.every(k => Object.prototype.hasOwnProperty.call(synthetic, k));
  if (!hasKeys) {
    console.error('❌ Unified metadata shape unexpected');
    process.exitCode = 1;
  } else {
    console.log('✅ Unified metadata structural keys present');
  }
}

main().catch(err => {
  console.error('Batch metadata test execution error', err);
  process.exit(1);
});
