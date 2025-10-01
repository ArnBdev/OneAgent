import { getOneAgentMemory } from '../../../utils/UnifiedBackboneService';
import { AlitaAgent } from '../../../agents/specialized/AlitaAgent';
import { OneAgentMemory } from '../../../memory/OneAgentMemory';
import SmartGeminiClient from '../../../tools/SmartGeminiClient';
import { simpleGit } from 'simple-git';

// Explicit factory mocks
jest.mock('../../../tools/SmartGeminiClient', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    generateContent: jest.fn().mockResolvedValue({
      response: JSON.stringify({
        analysis: 'Observed repeated failures in knowledge retrieval focus',
        targetFile: 'specs/test.spec.md',
        suggestedChange: 'Add rule to prioritize task-focused retrieval windows.',
        reason: 'Addresses bad ratings referencing off-topic answers',
      }),
    }),
  })),
}));
jest.mock('simple-git', () => ({
  simpleGit: jest.fn(),
}));
jest.mock('fs/promises', () => ({
  __esModule: true,
  readFile: jest.fn().mockRejectedValue(new Error('not found')),
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

describe('AlitaAgent.execute end-to-end (mocked)', () => {
  const FIX_TASK = 'task-abc';
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.GITHUB_TOKEN = 'test-token';
    fetchMock = jest.fn() as unknown as jest.MockedFunction<typeof fetch>;
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock;
  });

  it('collects experience, calls LLM, writes file, commits, pushes, and opens draft PR', async () => {
    // Mock OneAgentMemory.getInstance
    const memoryInst = {
      searchMemory: jest.fn().mockImplementation(({ query, userId }) => {
        if (query === 'feedback_record' && userId === 'feedback') {
          return Promise.resolve({
            results: [
              {
                metadata: {
                  custom: {
                    feedback: {
                      taskId: FIX_TASK,
                      userRating: 'bad',
                      correction: 'Answer was off-topic',
                    },
                  },
                },
              },
            ],
          });
        }
        if (query === 'metrics_log' && userId === 'default-user') {
          return Promise.resolve({
            results: [
              {
                metadata: {
                  custom: {
                    metricLog: {
                      taskId: FIX_TASK,
                      query: 'q',
                      latencyMs: 123,
                      vectorResultsCount: 5,
                      graphResultsCount: 2,
                      finalContextSize: 42,
                    },
                  },
                },
              },
            ],
          });
        }
        return Promise.resolve({ results: [] });
      }),
    } as unknown as OneAgentMemory;
    (getOneAgentMemory as unknown as jest.Mock).mockReturnValue(memoryInst);

    // Mock SmartGeminiClient
    const json = {
      analysis: 'Observed repeated failures in knowledge retrieval focus',
      targetFile: 'specs/test.spec.md',
      suggestedChange: 'Add rule to prioritize task-focused retrieval windows.',
      reason: 'Addresses bad ratings referencing off-topic answers',
    };
    const SmartGeminiClientMock = SmartGeminiClient as unknown as jest.Mock;
    SmartGeminiClientMock.mockImplementation(() => ({
      generateContent: jest.fn().mockResolvedValue({ response: JSON.stringify(json) }),
    }));

    // Mock simple-git
    const gitMock = {
      checkIsRepo: jest.fn().mockResolvedValue(true),
      checkoutLocalBranch: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      getRemotes: jest.fn().mockResolvedValue([
        {
          name: 'origin',
          refs: {
            fetch: 'https://github.com/acme/oneagent.git',
            push: 'https://github.com/acme/oneagent.git',
          },
        },
      ]),
      push: jest.fn().mockResolvedValue(undefined),
      revparse: jest.fn().mockResolvedValue('origin/main'),
    };
    const simpleGitMockFn = simpleGit as unknown as jest.Mock;
    simpleGitMockFn.mockReturnValue(gitMock);

    // Mock fetch for PR creation
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ html_url: 'https://github.com/acme/oneagent/pull/1' }),
    } as unknown as Response);

    const agent = new AlitaAgent();
    const result = await agent.execute(10);

    expect(result.analysis).toBe(json.analysis);
    expect(result.targetFile).toBe(json.targetFile);
    expect(result.suggestedChange).toBe(json.suggestedChange);
    expect(result.reason).toBe(json.reason);
    expect(result.prUrl).toBe('https://github.com/acme/oneagent/pull/1');

    // Verify GitOps sequence
    expect(gitMock.checkoutLocalBranch).toHaveBeenCalled();
    expect(gitMock.add).toHaveBeenCalledWith([json.targetFile]);
    expect(gitMock.commit).toHaveBeenCalled();
    expect(gitMock.push).toHaveBeenCalled();

    // Verify PR HTTP
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/repos/acme/oneagent/pulls'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
