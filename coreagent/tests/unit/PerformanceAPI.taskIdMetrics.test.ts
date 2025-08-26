import { PerformanceAPI } from '../../api/performanceAPI';
import { metricsService } from '../../services/MetricsService';
import { createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';
import type { MemoryIntelligence } from '../../intelligence/memoryIntelligence';
import type { GeminiClient } from '../../tools/geminiClient';
import type { OneAgentMemory } from '../../memory/OneAgentMemory';
import type { MultimodalEmbeddingService } from '../../tools/MultimodalEmbeddingService';

// Spy on metrics logging to validate correlation without side-effects
const logSpy = jest.spyOn(metricsService, 'logMemorySearch');

describe('PerformanceAPI.searchMemories -> taskId + metrics correlation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('semantic path: returns taskId and emits correlated metrics', async () => {
    // Arrange: stub dependencies
    const memoryIntelligence = {} as unknown; // not used in this test
    const geminiClient = {} as unknown; // not used in this test
    const memoryClient = {
      searchMemory: jest.fn(),
    } as unknown;
    const embeddingsTool = {
      semanticSearch: jest.fn().mockResolvedValue({
        results: [
          { memory: { id: 'm1', content: 'alpha', metadata: { content: { category: 'system' } } } },
        ],
        analytics: { elapsedMs: 12 },
      }),
    } as unknown;

    // Avoid persisting metrics; only record the log call
    logSpy.mockResolvedValue({
      taskId: 't_semantic',
      timestampIso: createUnifiedTimestamp().iso,
      userId: 'system',
      agentId: 'PerformanceAPI',
      query: 'hello',
      latencyMs: 12,
      vectorResultsCount: 1,
      graphResultsCount: 0,
      finalContextSize: 1,
      finalAnswer: undefined,
    });

    const api = new PerformanceAPI(
      memoryIntelligence as unknown as MemoryIntelligence,
      geminiClient as unknown as GeminiClient,
      memoryClient as unknown as OneAgentMemory,
      embeddingsTool as unknown as MultimodalEmbeddingService,
    );

    // Act
    const res = await api.searchMemories('hello', { userId: 'u1', topK: 3 });

    // Assert
    expect(res.success).toBe(true);
    const data = res.data as { taskId: string; memories: unknown[]; searchType: string };
    expect(typeof data.taskId).toBe('string');
    expect(data.searchType).toBe('semantic');
    expect(Array.isArray(data.memories)).toBe(true);

    // Ensure metrics were emitted with same taskId
    expect(logSpy).toHaveBeenCalled();
    const calledWith = (logSpy.mock.calls[0] || [])[0] as { taskId?: string };
    expect(calledWith?.taskId).toBe(data.taskId);
  });

  it('basic path: returns taskId and emits correlated metrics', async () => {
    // Arrange
    const memoryIntelligence = {} as unknown;
    const geminiClient = {} as unknown;
    const memoryClient = {
      searchMemory: jest.fn().mockResolvedValue({
        results: [{ id: 'm2', content: 'beta' }],
        total: 1,
      }),
    } as unknown;
    const embeddingsTool = {
      semanticSearch: jest.fn(),
    } as unknown;

    logSpy.mockResolvedValue({
      taskId: 't_basic',
      timestampIso: createUnifiedTimestamp().iso,
      userId: 'system',
      agentId: 'PerformanceAPI',
      query: '',
      latencyMs: 5,
      vectorResultsCount: 1,
      graphResultsCount: 0,
      finalContextSize: 1,
      finalAnswer: undefined,
    });

    const api = new PerformanceAPI(
      memoryIntelligence as unknown as MemoryIntelligence,
      geminiClient as unknown as GeminiClient,
      memoryClient as unknown as OneAgentMemory,
      embeddingsTool as unknown as MultimodalEmbeddingService,
    );

    // Act (no query -> basic path)
    const res = await api.searchMemories(undefined, { limit: 2, userId: 'u2' });

    // Assert
    expect(res.success).toBe(true);
    const data = res.data as { taskId: string; memories: unknown[]; searchType: string };
    expect(typeof data.taskId).toBe('string');
    expect(data.searchType).toBe('basic');
    expect(Array.isArray(data.memories)).toBe(true);

    expect(logSpy).toHaveBeenCalled();
    const calledWith = (logSpy.mock.calls[0] || [])[0] as { taskId?: string };
    expect(calledWith?.taskId).toBe(data.taskId);
  });
});
