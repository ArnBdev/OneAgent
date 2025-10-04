/**
 * Diagnostic test to understand mem0 indexing behavior
 *
 * This test isolates the add+search flow to debug why mem0 is not indexing memories.
 * Check the Python backend logs for [ADD] and [SEARCH] tags to see what mem0 is doing.
 */

import { getOneAgentMemory } from '../../coreagent/utils/UnifiedBackboneService';
import { ensureMemoryServerReady, retrySearchWithBackoff } from './memoryTestUtils';

describe('mem0 Indexing Diagnostic', () => {
  jest.setTimeout(30000);
  const userId = `diagnose-${Date.now()}`;
  const memory = getOneAgentMemory();

  beforeAll(async () => {
    await ensureMemoryServerReady();
  });

  it('adds a simple memory and checks backend response', async () => {
    console.log(`\n=== DIAGNOSTIC: Adding memory for userId=${userId} ===`);

    const addResult = await memory.addMemory({
      content: 'Diagnostic test: The capital of France is Paris',
      metadata: { userId, type: 'diagnostic', test: true },
    });

    console.log('Add result:', JSON.stringify(addResult, null, 2));

    expect(addResult).toBeTruthy();
    expect(typeof addResult).toBe('string'); // Should be a memory ID

    console.log(`\n=== DIAGNOSTIC: Memory ID returned: ${addResult} ===`);
  });

  it('searches for the added memory immediately', async () => {
    console.log(`\n=== DIAGNOSTIC: Searching immediately (no retry) ===`);

    const results = await memory.searchMemory({
      query: 'capital of France',
      userId,
      limit: 10,
    });

    console.log(`Search results (immediate): ${results.length} memories found`);
    if (results.length > 0) {
      console.log('First result:', JSON.stringify(results[0], null, 2));
    } else {
      console.warn('⚠️  No results found immediately after add');
    }
  });

  it('searches with retry/backoff to handle async indexing', async () => {
    console.log(`\n=== DIAGNOSTIC: Searching with retry/backoff ===`);

    const results = await retrySearchWithBackoff(
      () =>
        memory.searchMemory({
          query: 'capital of France',
          userId,
          limit: 10,
        }),
      5, // max attempts
      500, // start with 500ms delay
    );

    console.log(`Search results (with retry): ${results.length} memories found`);
    if (results.length > 0) {
      console.log('First result:', JSON.stringify(results[0], null, 2));
      console.log('✅ Memory successfully indexed and searchable');
    } else {
      console.error('❌ Memory NOT indexed even after retries');
      console.error('Check Python backend logs for [ADD] and [SEARCH] tags');
      console.error('Possible issues:');
      console.error('  1. Embedding API errors (OpenAI rate limit?)');
      console.error('  2. ChromaDB/Qdrant storage errors');
      console.error('  3. mem0 fact extraction disabled or failing');
    }
  });

  it('checks get_all to see if memory exists (bypass search)', async () => {
    console.log(`\n=== DIAGNOSTIC: Checking get_all (bypass search) ===`);

    // get_all uses different code path than search
    const results = await memory.searchMemory({
      query: '', // Empty query might trigger get_all
      userId,
      limit: 100,
    });

    console.log(`get_all results: ${results.length} total memories for user`);
    if (results.length > 0) {
      console.log('Memories exist in storage (get_all found them)');
      console.log('First memory:', JSON.stringify(results[0], null, 2));
    } else {
      console.error('No memories found even in get_all - add may have failed silently');
    }
  });
});
