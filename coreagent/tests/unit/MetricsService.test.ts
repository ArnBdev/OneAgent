import { metricsService } from '../../services/MetricsService';
import { unifiedMonitoringService } from '../../monitoring/UnifiedMonitoringService';

jest.mock('../../monitoring/UnifiedMonitoringService', () => {
  const actual = jest.requireActual('../../monitoring/UnifiedMonitoringService');
  return {
    ...actual,
    unifiedMonitoringService: {
      trackOperation: jest.fn(),
    },
  };
});

describe('MetricsService', () => {
  it('logs hybrid memory search via monitoring', async () => {
    const log = await metricsService.logMemorySearch({
      userId: 'u1',
      agentId: 'a1',
      query: 'hello',
      latencyMs: 25,
      vectorResultsCount: 3,
      graphResultsCount: 2,
      finalContextSize: 4,
    });

    expect(log.latencyMs).toBe(25);
    expect(unifiedMonitoringService.trackOperation).toHaveBeenCalledWith(
      'BaseAgent',
      'memory_search',
      'success',
      expect.objectContaining({
        durationMs: 25,
        agentId: 'a1',
        userId: 'u1',
        vectorResultsCount: 3,
        graphResultsCount: 2,
        finalContextSize: 4,
      }),
    );
  });
});
