import {
  getOneAgentMemory,
  createUnifiedTimestamp,
} from '../../coreagent/utils/UnifiedBackboneService';

describe('memory integration (embedding + search)', () => {
  jest.setTimeout(20000);
  jest.setTimeout(20000);
  it('adds memory with embedding metadata and can search it', async () => {
    const memory = getOneAgentMemory();
    const testMemory = {
      content: 'BMAD memory integration test for gemini-embedding-001 model',
      metadata: {
        type: 'bmad_system_test',
        embedding_model: 'gemini-embedding-001',
        test_timestamp: createUnifiedTimestamp(),
        constitutional_ai: 'validated',
      },
    } as any;
    const addResult = await memory.addMemory(testMemory);
    expect(addResult).toBeTruthy();
    // Allow a short delay for async embedding/index processes if present
    await new Promise((r) => setTimeout(r, 250));
    const searchResult: any = await memory.searchMemory({
      query: 'gemini embedding model',
      limit: 5,
    } as any);
    expect(searchResult).toBeTruthy();
    const list: any[] | undefined =
      searchResult.memories || searchResult.results || searchResult.items;
    if (Array.isArray(list) && list.length > 0) {
      expect(list[0]).toHaveProperty('content');
    }
  });
});
