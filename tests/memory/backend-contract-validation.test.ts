import {
  ensureMemoryServerReady,
  validateEmbeddingApiContract,
  clearTestMemories,
} from './memoryTestUtils';

describe('Memory Backend Contract Validation', () => {
  const userId = 'contract-test';

  beforeAll(async () => {
    await ensureMemoryServerReady();
    await clearTestMemories(userId);
  });

  afterAll(async () => {
    await clearTestMemories(userId);
  });

  it('validates the embedding API contract and fails fast on backend errors', async () => {
    await validateEmbeddingApiContract();
  });
});
