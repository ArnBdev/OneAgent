import SmartGeminiClient from '../../tools/SmartGeminiClient';

// Mock wrapper GeminiClient (dependency of SmartGeminiClient) to force fallback
jest.mock('../../tools/geminiClient', () => {
  return {
    GeminiClient: class MockGeminiClient {
      async chat() {
        throw new Error('forced wrapper failure for fallback test');
      }
      getConfig() {
        return { mock: true };
      }
      generateEmbedding() {
        return { vector: [0.1, 0.2] };
      }
      generateEmbeddingBatch() {
        return [{ vector: [0.1, 0.2] }];
      }
    },
  };
});

// Mock GoogleGenAI SDK
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: async ({ contents }: { contents: string }) => ({
          text: `ECHO:${contents}`,
        }),
      };
    },
  };
});

describe('SmartGeminiClient fallback', () => {
  const API_KEY = 'test-key';

  it('falls back to direct GenAI path when wrapper fails', async () => {
    const client = new SmartGeminiClient({ apiKey: API_KEY, useWrapperFirst: true });
    const res = await client.generateContent('Hello');
    expect(res.response).toBe('ECHO:Hello');
    const status = client.getStatus();
    expect(status.directAvailable).toBe(true);
  });

  it('direct mode disabled when env flag set', async () => {
    process.env.ONEAGENT_DISABLE_GENAI_DIRECT = '1';
    const client = new SmartGeminiClient({ apiKey: API_KEY, useWrapperFirst: false });
    await expect(client.generateContent('Hi')).rejects.toThrow(/fallback is disabled/);
    delete process.env.ONEAGENT_DISABLE_GENAI_DIRECT;
  });
});
