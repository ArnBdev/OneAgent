import { BaseAgent, type AgentConfig } from '../../agents/base/BaseAgent';
import { UnifiedBackboneService } from '../../utils/UnifiedBackboneService';

// Mock MemgraphService singleton
const writeQueryMock = jest.fn().mockResolvedValue({ success: true });
const isEnabledMock = jest.fn().mockReturnValue(true);
jest.mock('../../services/MemgraphService', () => ({
  memgraphService: {
    isEnabled: () => isEnabledMock(),
    writeQuery: (...args: unknown[]) => writeQueryMock(...args),
  },
}));

// Mock KnowledgeExtractor to return deterministic small graph
const extractKnowledgeMock = jest.fn().mockResolvedValue({
  nodes: [
    { id: 'OpenAI', label: 'Organization', properties: {} },
    { id: 'ChatGPT', label: 'Product', properties: {} },
  ],
  edges: [{ source: 'OpenAI', target: 'ChatGPT', label: 'CREATED', properties: {} }],
});
jest.mock('../../tools/KnowledgeExtractor', () => ({
  KnowledgeExtractor: jest.fn().mockImplementation(() => ({
    extractKnowledge: (...args: unknown[]) => extractKnowledgeMock(...args),
  })),
}));

// Minimal concrete agent for testing (exposes addMemory)
class TestAgent extends BaseAgent {
  constructor() {
    const cfg: AgentConfig = {
      id: 'TestAgent',
      name: 'Test Agent',
      description: 'Test',
      capabilities: [],
      memoryEnabled: true,
      aiEnabled: false,
    };
    super(cfg);
    // Inject minimal memory client mock to avoid network
    // @ts-expect-error: partial mock for tests
    this.memoryClient = {
      addMemory: jest.fn().mockResolvedValue('mem-id'),
    };
  }
  public async callAddMemory(userId: string, content: string, metadata?: Record<string, unknown>) {
    return (
      this as unknown as {
        addMemory: (u: string, c: string, m?: Record<string, unknown>) => Promise<void>;
      }
    ).addMemory(userId, content, metadata);
  }
}

describe('BaseAgent graph enrichment (feature-flagged)', () => {
  const configEnabled = {
    ...UnifiedBackboneService.getResolvedConfig(),
    features: { enableGraphEnrichment: true },
    memgraph: { enabled: true, url: 'bolt://localhost:7687', driver: 'neo4j' as const },
  };
  const configDisabled = {
    ...UnifiedBackboneService.getResolvedConfig(),
    features: { enableGraphEnrichment: false },
    memgraph: { enabled: true, url: 'bolt://localhost:7687', driver: 'neo4j' as const },
  };

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('triggers extraction and writes nodes/edges when enabled', async () => {
    jest
      .spyOn(UnifiedBackboneService, 'getResolvedConfig')
      .mockReturnValue(
        configEnabled as ReturnType<typeof UnifiedBackboneService.getResolvedConfig>,
      );
    const agent = new TestAgent();
    await agent.callAddMemory('u1', 'OpenAI created ChatGPT.');

    // Allow background microtask to schedule
    await new Promise((r) => setTimeout(r, 0));

    expect(extractKnowledgeMock).toHaveBeenCalled();
    // 2 nodes + 1 edge = 3 write operations
    expect(writeQueryMock).toHaveBeenCalledTimes(3);
  });

  it('does not write to graph when feature flag disabled', async () => {
    jest
      .spyOn(UnifiedBackboneService, 'getResolvedConfig')
      .mockReturnValue(
        configDisabled as ReturnType<typeof UnifiedBackboneService.getResolvedConfig>,
      );
    const agent = new TestAgent();
    await agent.callAddMemory('u1', 'OpenAI created ChatGPT.');
    await new Promise((r) => setTimeout(r, 0));
    expect(writeQueryMock).not.toHaveBeenCalled();
  });
});
