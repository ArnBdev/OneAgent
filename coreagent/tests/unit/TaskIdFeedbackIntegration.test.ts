import { BaseAgent, type AgentConfig } from '../../agents/base/BaseAgent';
import { HybridAgentOrchestrator } from '../../agents/orchestration/HybridAgentOrchestrator';
import type { MemoryRecord } from '../../types/oneagent-backbone-types';

// Mock OneAgentMemory globally for both BaseAgent and FeedbackService/Orchestrator usage
// eslint-disable-next-line no-var
var memMocks: { addMemoryCanonical: jest.Mock; searchMemory: jest.Mock };
jest.mock('../../memory/OneAgentMemory', () => {
  const addMemoryCanonical = jest.fn().mockResolvedValue('mem_1');
  const searchMemory = jest.fn().mockResolvedValue({ results: [] as MemoryRecord[], total: 0 });
  // Expose mocks to the test body via outer variable
  memMocks = { addMemoryCanonical, searchMemory };
  return {
    OneAgentMemory: {
      getInstance: jest.fn(() => ({ addMemoryCanonical, searchMemory })),
    },
  };
});

// Ensure hybrid search path is disabled for deterministic unit behavior
jest.mock('../../services/HybridMemorySearchService', () => ({
  hybridMemorySearchService: {
    isEnabled: () => false,
  },
}));

class DummyAgent extends BaseAgent {
  constructor() {
    const cfg: AgentConfig = {
      id: 'DummyAgent',
      name: 'DummyAgent',
      description: 'Test agent',
      capabilities: [],
      memoryEnabled: true,
      aiEnabled: false,
    };
    super(cfg);
  }
}

describe('TaskId -> Feedback integration', () => {
  beforeEach(() => {
    memMocks.addMemoryCanonical.mockClear();
    memMocks.searchMemory.mockClear();
  });

  it('records feedback using a real taskId produced by BaseAgent.searchMemoriesWithTask', async () => {
    const agent = new DummyAgent();
    await agent.initialize();

    // Produce a taskId via canonical search method
    const { taskId, result } = await agent.searchMemoriesWithTask('user_1', 'hello world', 3);
    expect(taskId).toBeTruthy();
    expect(Array.isArray(result.results)).toBe(true);

    const orchestrator = new HybridAgentOrchestrator();
    await orchestrator.recordFeedback(taskId, 'good', 'Looks good');

    // Verify feedback persisted to memory with correlated taskId
    const calls = (
      memMocks.addMemoryCanonical.mock.calls as Array<[string, unknown, string]>
    ).filter((c): c is [string, unknown, string] => Array.isArray(c) && typeof c[0] === 'string');
    const feedbackCall = calls.find(
      ([summary]) =>
        typeof summary === 'string' && summary.includes(`Feedback GOOD for task ${taskId}`),
    );

    expect(feedbackCall).toBeDefined();
    // Also ensure orchestrator audit entries were stored
    const orchestratorAuditPresent = calls.some(
      ([summary]) => typeof summary === 'string' && summary.includes('Orchestrator operation:'),
    );
    expect(orchestratorAuditPresent).toBe(true);
  });
});
