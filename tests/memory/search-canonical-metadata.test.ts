/**
 * Runtime test: verifies searchMemory returns canonical-adapted structure
 */
import { OneAgentMemory } from '../../coreagent/memory/OneAgentMemory';

(async () => {
  const memory = OneAgentMemory.getInstance();
  // Add a couple of memories
  await memory.addMemory('Search Test Memory A', { category: 'test', tags: ['search','a'] }, 'search-user');
  await memory.addMemory('Search Test Memory B', { category: 'test', tags: ['search','b'] }, 'search-user');

  const result = await memory.searchMemory({ query: 'Search Test Memory', userId: 'search-user', limit: 5 });
  if (!result) throw new Error('No result returned');
  if (!Array.isArray(result.results)) throw new Error('results not array');
  if (result.results.length < 2) throw new Error('expected at least 2 results');
  const first = result.results[0];
  const requiredKeys = ['id','content','metadata'];
  for (const k of requiredKeys) {
    if (!(k in first)) throw new Error(`missing key ${k} in memory record`);
  }
  if (!first.metadata || typeof first.metadata !== 'object') throw new Error('metadata missing or not object');
  console.log('[search-canonical-metadata.test] PASS', {
    totalFound: result.totalFound,
    sampleId: first.id,
    metadataKeys: Object.keys(first.metadata as Record<string, unknown>).slice(0,6)
  });
})();
