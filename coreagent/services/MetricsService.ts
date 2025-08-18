import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';
import {
  unifiedMetadataService,
  createUnifiedTimestamp,
  OneAgentUnifiedBackbone,
  generateUnifiedId,
} from '../utils/UnifiedBackboneService';
import { OneAgentMemory } from '../memory/OneAgentMemory';

export interface MetricLog {
  taskId: string;
  timestampIso: string;
  userId: string;
  agentId: string;
  query: string;
  latencyMs: number;
  vectorResultsCount: number;
  graphResultsCount: number;
  finalContextSize: number;
  finalAnswer?: string;
}

/**
 * MetricsService (canonical wrapper)
 * - Emits operation_metric events via UnifiedMonitoringService (single source of truth)
 * - Optional persistence to memory when ONEAGENT_METRICS_TO_MEMORY=true (best-effort)
 * - Avoids creating a parallel metrics aggregation system
 */
export class MetricsService {
  private static instance: MetricsService | null = null;

  static getInstance(): MetricsService {
    if (!MetricsService.instance) MetricsService.instance = new MetricsService();
    return MetricsService.instance;
  }

  /** Log a memory search operation (hybrid/vector+graph) */
  async logMemorySearch(
    partial: Omit<MetricLog, 'taskId' | 'timestampIso'> & {
      taskId?: string;
    },
  ): Promise<MetricLog> {
    const ts = createUnifiedTimestamp();
    const taskId = partial.taskId || generateUnifiedId('task', partial.agentId);

    const log: MetricLog = {
      taskId,
      timestampIso: ts.iso,
      userId: partial.userId,
      agentId: partial.agentId,
      query: partial.query,
      latencyMs: Math.max(0, Math.floor(partial.latencyMs || 0)),
      vectorResultsCount: Math.max(0, partial.vectorResultsCount || 0),
      graphResultsCount: Math.max(0, partial.graphResultsCount || 0),
      finalContextSize: Math.max(0, partial.finalContextSize || 0),
      finalAnswer: partial.finalAnswer,
    };

    // Emit canonical operation metric event
    unifiedMonitoringService.trackOperation('BaseAgent', 'memory_search', 'success', {
      durationMs: log.latencyMs,
      taskId: log.taskId,
      userId: log.userId,
      agentId: log.agentId,
      vectorResultsCount: log.vectorResultsCount,
      graphResultsCount: log.graphResultsCount,
      finalContextSize: log.finalContextSize,
      hasFinalAnswer: typeof log.finalAnswer === 'string' && log.finalAnswer.length > 0,
    });

    // Optional: persist to memory (best-effort; disabled in tests unless explicitly enabled)
    if (process.env.ONEAGENT_METRICS_TO_MEMORY === 'true') {
      try {
        const memory = OneAgentMemory.getInstance();
        const summary = `Metrics: memory_search -> ${log.vectorResultsCount}+${log.graphResultsCount} results in ${log.latencyMs}ms`;
        const metadata = unifiedMetadataService.create('metrics_log', 'MetricsService', {
          system: {
            userId: log.userId,
            component: 'MetricsService',
            source: 'MetricsService',
            agent: { id: log.agentId, type: 'specialized' },
          },
          content: {
            category: 'metrics',
            tags: ['memory_search', 'hybrid'],
            sensitivity: 'internal',
            relevanceScore: 0.1,
            contextDependency: 'session',
          },
          custom: { metricLog: log },
        });
        await memory.addMemoryCanonical(summary, metadata, log.userId);
      } catch (err) {
        // Swallow persistence errors; monitoring event is the canonical record
        OneAgentUnifiedBackbone.getInstance()
          .getServices()
          .errorHandler.handleError(err as Error, {
            component: 'MetricsService',
            operation: 'persist_metric',
            external: false,
          });
      }
    }

    return log;
  }
}

export const metricsService = MetricsService.getInstance();
