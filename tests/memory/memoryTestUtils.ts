// Canonical Jest test helpers for OneAgent memory tests
// Provides setup/teardown, health checks, and canonical test data

import { getOneAgentMemory } from '../../coreagent/utils/UnifiedBackboneService';

/**
 * Ensures the memory server is healthy before running tests.
 * Throws with diagnostics if not healthy within timeout.
 */
export async function ensureMemoryServerReady(timeoutMs = 20000): Promise<void> {
  const memory = getOneAgentMemory();
  const start = Date.now();
  let lastErr: unknown = undefined;
  let lastHealth: any = undefined;
  while (Date.now() - start < timeoutMs) {
    try {
      const health = await memory.getHealthStatus();
      lastHealth = health;
      console.log('[TEST] Memory health check:', health);
      if (health && health.healthy) return;
    } catch (err) {
      lastErr = err;
      console.error('[TEST] Memory health check error:', err);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.error(
    '[TEST] Memory server not healthy after',
    timeoutMs,
    'ms. Last health:',
    lastHealth,
    'Last error:',
    lastErr,
  );
  throw new Error(
    `Memory server not healthy after ${timeoutMs}ms` + (lastErr ? `: ${lastErr}` : ''),
  );
}

/**
 * Deletes all test memories for a given userId. Robust error handling and diagnostics.
 */
export async function clearTestMemories(userId = 'test-user') {
  const memory = getOneAgentMemory();
  let results: any[] = [];
  try {
    results = await memory.searchMemory({ query: '', userId, limit: 100 });
    console.log(`[TEST] clearTestMemories: found ${results.length} memories for userId=${userId}`);
  } catch (err) {
    console.error('[TEST] clearTestMemories: searchMemory error:', err);
    return;
  }
  for (const item of results || []) {
    if (item.id) {
      try {
        await memory.deleteMemory({ id: item.id });
        console.log(`[TEST] clearTestMemories: deleted memory id=${item.id}`);
      } catch (e) {
        console.error(`[TEST] clearTestMemories: failed to delete memory id=${item.id}`, e);
      }
    }
  }
}

/**
 * Canonical test memory entry for use in all memory tests.
 */
export const canonicalTestMemory = {
  content: 'Canonical test memory entry',
  metadata: {
    type: 'test',
    test: true,
    userId: 'test-user',
    timestamp: new Date().toISOString(),
  },
};

/**
 * Validates the backend embedding API contract by sending a minimal valid request.
 * Fails fast if the backend returns a 400/500 or if the contract is broken.
 */
export async function validateEmbeddingApiContract(): Promise<void> {
  const memory = getOneAgentMemory();
  try {
    // Try to add a minimal memory and check for backend errors
    const result = await memory.addMemory({
      content: 'Embedding API contract test',
      metadata: { userId: 'contract-test', type: 'contract', test: true },
    });
    if (!result || typeof result !== 'string' || result.length === 0) {
      throw new Error('Embedding API contract test failed: No ID returned');
    }
    // Optionally, search for it to confirm
    const search = await memory.searchMemory({
      query: 'Embedding API contract test',
      userId: 'contract-test',
      limit: 1,
    });
    if (!Array.isArray(search) || search.length === 0) {
      throw new Error('Embedding API contract test failed: Memory not found after add');
    }
    console.log('[TEST] Embedding API contract validation PASSED');
  } catch (err: any) {
    console.error('[TEST] Embedding API contract validation FAILED:', err?.message || err);
    throw new Error('Embedding API contract validation failed: ' + (err?.message || err));
  }
}

/**
 * Utility to generate a unique userId for test isolation.
 */
export function generateTestUserId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Retry search with exponential backoff to handle mem0's async fact extraction.
 *
 * mem0 extracts facts asynchronously - memories are not immediately searchable after add.
 * This helper retries search with exponential backoff (100ms → 200ms → 400ms → 800ms → 1600ms).
 *
 * @param searchFn - Function that performs the search (returns array of results)
 * @param maxAttempts - Maximum number of retry attempts (default: 5)
 * @param baseDelayMs - Base delay for exponential backoff (default: 100ms)
 * @returns Search results (empty array if all retries fail)
 */
export async function retrySearchWithBackoff<T>(
  searchFn: () => Promise<T[]>,
  maxAttempts = 5,
  baseDelayMs = 100,
): Promise<T[]> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const results = await searchFn();
    if (results.length > 0) {
      if (attempt > 0) {
        console.log(`[TEST] Search succeeded on attempt ${attempt + 1}`);
      }
      return results;
    }

    if (attempt < maxAttempts - 1) {
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      console.log(
        `[TEST] Search returned 0 results, retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxAttempts})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.warn(`[TEST] Search returned 0 results after ${maxAttempts} attempts`);
  return [];
}
