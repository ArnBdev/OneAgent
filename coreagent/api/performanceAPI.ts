/**
 * Performance API for OneAgent UI Integration
 *
 * Provides HTTP endpoints for accessing performance metrics, memory intelligence,
 * and system analytics from the UI layer.
 */

import { globalProfiler } from '../performance/profiler';
import { MemoryIntelligence } from '../intelligence/memoryIntelligence';
import { GeminiClient } from '../tools/geminiClient';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { MultimodalEmbeddingService } from '../tools/MultimodalEmbeddingService';
import {
  createUnifiedTimestamp,
  createUnifiedId,
  getUnifiedErrorHandler,
} from '../utils/UnifiedBackboneService';
import { metricsService } from '../services/MetricsService';

// Canonical API error details (aligned with unified error system)
export interface PerformanceAPIErrorDetails {
  id: string;
  type: string; // classification
  severity: string;
  message: string;
  timestamp: string;
}

export interface PerformanceAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string; // Backward compatibility (human-readable summary)
  errorDetails?: PerformanceAPIErrorDetails; // Structured canonical error info
  timestamp: string; // Unified timestamp (utc)
  traceId?: string; // Optional operation trace / correlation id
}

export interface SystemStatus {
  performance: {
    totalOperations: number;
    averageLatency: number;
    errorRate: number;
  };
  memory: {
    totalMemories: number;
    categoryBreakdown: Record<string, number>;
    avgImportanceScore: number;
    topCategories: string[];
  };
  security: {
    validationErrors: number;
    rateLimitViolations: number;
    authenticationFailures: number;
    securityAlertsActive: number;
    lastSecurityScan: string;
  };
  services: {
    gemini: 'connected' | 'error' | 'unknown';
    mem0: 'connected' | 'error' | 'unknown';
    embedding: 'connected' | 'error' | 'unknown';
  };
}

/**
 * Performance API for OneAgent system monitoring and intelligence
 */
export class PerformanceAPI {
  private memoryIntelligence: MemoryIntelligence;
  private geminiClient: GeminiClient;
  private memoryClient: OneAgentMemory;
  private embeddingsTool: MultimodalEmbeddingService;
  private errorHandler = getUnifiedErrorHandler();

  // Component identifier for unified error context
  private readonly component = 'PerformanceAPI';
  constructor(
    memoryIntelligence: MemoryIntelligence,
    geminiClient: GeminiClient,
    memoryClient: OneAgentMemory,
    embeddingsTool: MultimodalEmbeddingService,
  ) {
    this.memoryIntelligence = memoryIntelligence;
    this.geminiClient = geminiClient;
    this.memoryClient = memoryClient;
    this.embeddingsTool = embeddingsTool;
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(): Promise<PerformanceAPIResponse<SystemStatus>> {
    try {
      const report = await globalProfiler.generateReport();
      const memorySearch = await this.memoryClient.searchMemory({
        query: 'system',
        limit: 100,
        type: 'system',
      });
      const memoryData = memorySearch?.results || [];
      await this.memoryIntelligence.generateMemoryAnalytics('system');
      // Integrate unified error metrics (non-critical augmentation)
      let validationErrors = 0;
      try {
        const metricsAccessor = this.errorHandler as unknown as {
          getMetrics?: () => { errorsByType?: Record<string, number> };
        };
        const metrics = metricsAccessor.getMetrics?.();
        if (metrics?.errorsByType?.VALIDATION) {
          validationErrors = metrics.errorsByType.VALIDATION;
        }
      } catch {
        /* ignore metric augmentation failures */
      }

      // Test service connections
      const services: SystemStatus['services'] = {
        gemini: 'unknown',
        mem0: 'unknown',
        embedding: 'unknown',
      };
      try {
        // Test connection by attempting a simple search
        await this.memoryClient.searchMemory({
          query: 'test',
          limit: 1,
          type: 'system',
        });
        services.mem0 = 'connected';
      } catch {
        services.mem0 = 'error';
      }
      try {
        // Test would go here - for now assume embeddings work if memory works
        services.embedding = services.mem0 === 'connected' ? 'connected' : 'unknown';
        services.gemini = 'connected'; // Assume Gemini is available if we got this far
      } catch {
        services.embedding = 'error';
        services.gemini = 'error';
      }
      // Derive category breakdown and importance locally to avoid tight coupling
      const categoryBreakdown: Record<string, number> = {};
      for (const r of memoryData as Array<{
        metadata?: {
          content?: { tags?: string[]; category?: string };
          quality?: { score?: number };
        };
      }>) {
        const cat = r.metadata?.content?.tags?.[0] || r.metadata?.content?.category || 'general';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
      }
      const importanceSamples: number[] = (
        memoryData as Array<{ metadata?: { quality?: { score?: number } } }>
      ).map((r) => Math.round((r.metadata?.quality?.score ?? 0.7) * 100));
      const avgImportanceScore = importanceSamples.length
        ? Math.round(importanceSamples.reduce((a, b) => a + b, 0) / importanceSamples.length)
        : 0;

      const status: SystemStatus = {
        performance: {
          totalOperations: report.totalOperations,
          averageLatency: report.averageLatency,
          errorRate: report.errorRate,
        },
        memory: {
          totalMemories: memoryData.length,
          categoryBreakdown,
          avgImportanceScore,
          topCategories: Object.entries(categoryBreakdown)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([category]) => category),
        },
        security: {
          validationErrors,
          rateLimitViolations: 0,
          authenticationFailures: 0,
          securityAlertsActive: 0,
          lastSecurityScan: createUnifiedTimestamp().utc,
        },
        services,
      };

      return {
        success: true,
        data: status,
        timestamp: createUnifiedTimestamp().utc,
      };
    } catch (error) {
      const entry = await this.errorHandler.handleError(error as Error, {
        component: this.component,
        operation: 'getSystemStatus',
      });
      return {
        success: false,
        error: 'Failed to retrieve system status',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: createUnifiedTimestamp().utc,
        traceId: entry.id,
      };
    }
  }

  /**
   * Get detailed performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceAPIResponse> {
    try {
      const report = await globalProfiler.generateReport();
      return { success: true, data: report, timestamp: createUnifiedTimestamp().utc };
    } catch (error) {
      const entry = await this.errorHandler.handleError(error as Error, {
        component: this.component,
        operation: 'getPerformanceMetrics',
      });
      return {
        success: false,
        error: 'Failed to retrieve performance metrics',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: createUnifiedTimestamp().utc,
        traceId: entry.id,
      };
    }
  }

  /**
   * Get memory intelligence analytics
   */ async getMemoryAnalytics(filter?: {
    query?: string;
    limit?: number;
    userId?: string;
  }): Promise<PerformanceAPIResponse> {
    try {
      await this.memoryClient.searchMemory({
        query: filter?.query || '',
        limit: filter?.limit || 100,
        type: 'system',
      });
      const analytics = await this.memoryIntelligence.generateMemoryAnalytics(
        filter?.userId || 'system',
      );

      return {
        success: true,
        data: analytics,
        timestamp: createUnifiedTimestamp().utc,
      };
    } catch (error) {
      const entry = await this.errorHandler.handleError(error as Error, {
        component: this.component,
        operation: 'getMemoryAnalytics',
      });
      return {
        success: false,
        error: 'Failed to generate memory analytics',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: createUnifiedTimestamp().utc,
        traceId: entry.id,
      };
    }
  }

  /**
   * Search memories with intelligence
   */
  async searchMemories(
    query?: string,
    filter?: {
      limit?: number;
      userId?: string;
      type?: string;
      topK?: number;
      similarityThreshold?: number;
      model?: 'gemini-embedding-001' | 'text-embedding-004' | 'gemini-embedding-exp-03-07';
    },
  ): Promise<PerformanceAPIResponse> {
    try {
      let results: Record<string, unknown>;
      const taskId = createUnifiedId('task', 'performance_search');
      const t0 = createUnifiedTimestamp().unix;

      if (query) {
        // Use semantic search
        const searchResults = await this.embeddingsTool.semanticSearch(query, {
          topK: filter?.topK,
          similarityThreshold: filter?.similarityThreshold,
          model: filter?.model,
        });
        const elapsed = Math.max(0, createUnifiedTimestamp().unix - t0);
        const memories = searchResults.results.map((r) => r.memory);
        // Try to extract elapsedMs from analytics in a type-safe way
        const analyticsObj = (searchResults as unknown as { analytics?: { elapsedMs?: number } })
          .analytics;
        const analyticsElapsed =
          analyticsObj && typeof analyticsObj.elapsedMs === 'number'
            ? analyticsObj.elapsedMs
            : elapsed;
        // Emit canonical metrics for semantic search path
        void metricsService.logMemorySearch({
          taskId,
          userId: filter?.userId || 'system',
          agentId: 'PerformanceAPI',
          query,
          latencyMs: analyticsElapsed,
          vectorResultsCount: Array.isArray(memories) ? memories.length : 0,
          graphResultsCount: 0,
          finalContextSize: Array.isArray(memories) ? memories.length : 0,
        });
        results = {
          memories: searchResults.results.map((r) => r.memory),
          analytics: searchResults.analytics,
          searchType: 'semantic',
          taskId,
        };
      } else {
        // Use basic search
        const memoryResults = await this.memoryClient.searchMemory({
          query: query,
          limit: filter?.limit || 50,
          type: 'system',
        });
        const elapsed = Math.max(0, createUnifiedTimestamp().unix - t0);
        const memories = memoryResults?.results || [];
        // Emit canonical metrics for basic path
        void metricsService.logMemorySearch({
          taskId,
          userId: filter?.userId || 'system',
          agentId: 'PerformanceAPI',
          query: query || '',
          latencyMs: elapsed,
          vectorResultsCount: memories.length,
          graphResultsCount: 0,
          finalContextSize: memories.length,
        });
        results = {
          memories,
          searchType: 'basic',
          taskId,
        };
      }

      return {
        success: true,
        data: results,
        timestamp: createUnifiedTimestamp().utc,
      };
    } catch (error) {
      const entry = await this.errorHandler.handleError(error as Error, {
        component: this.component,
        operation: 'searchMemories',
        query,
      });
      return {
        success: false,
        error: 'Memory search failed',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: createUnifiedTimestamp().utc,
        traceId: entry.id,
      };
    }
  }

  /**
   * Create memory with intelligence
   */
  async createMemory(
    content: string,
    metadata?: Record<string, unknown>,
    userId?: string,
    agentId?: string,
  ): Promise<PerformanceAPIResponse> {
    try {
      // Categorize and score the memory (create temporary memory object)
      const tempMemory = {
        id: 'temp',
        content,
        metadata: metadata || {},
        createdAt: createUnifiedTimestamp().utc,
        updatedAt: createUnifiedTimestamp().utc,
      };

      const category = await this.memoryIntelligence.categorizeMemory(tempMemory);
      const importance = await this.memoryIntelligence.calculateImportanceScore(tempMemory);
      // Store with embedding and intelligence
      const result = await this.embeddingsTool.storeMemoryWithEmbedding(
        content,
        agentId || 'oneagent-system',
        userId || 'system',
        'learning',
        {
          ...metadata,
          category: category,
          importance_score: importance.overall,
        },
      );

      return {
        success: true,
        data: {
          memoryId: result.memoryId,
          embedding: result.embedding,
          intelligence: {
            category,
            importance,
          },
        },
        timestamp: createUnifiedTimestamp().utc,
      };
    } catch (error) {
      const entry = await this.errorHandler.handleError(error as Error, {
        component: this.component,
        operation: 'createMemory',
      });
      return {
        success: false,
        error: 'Failed to create memory',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: createUnifiedTimestamp().utc,
        traceId: entry.id,
      };
    }
  }

  /**
   * Get similar memories
   */
  async getSimilarMemories(
    memoryId: string,
    options?: { limit?: number },
  ): Promise<PerformanceAPIResponse> {
    try {
      const results = await this.embeddingsTool.findSimilarMemories(memoryId, options);

      return {
        success: true,
        data: results,
        timestamp: createUnifiedTimestamp().utc,
      };
    } catch (error) {
      const entry = await this.errorHandler.handleError(error as Error, {
        component: this.component,
        operation: 'getSimilarMemories',
        memoryId,
      });
      return {
        success: false,
        error: 'Failed to retrieve similar memories',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: createUnifiedTimestamp().utc,
        traceId: entry.id,
      };
    }
  }

  /**
   * Clear performance metrics
   */
  async clearPerformanceData(): Promise<PerformanceAPIResponse> {
    try {
      globalProfiler.clearMetrics();

      return {
        success: true,
        data: { message: 'Performance data cleared' },
        timestamp: createUnifiedTimestamp().utc,
      };
    } catch (error) {
      const entry = await this.errorHandler.handleError(error as Error, {
        component: this.component,
        operation: 'clearPerformanceData',
      });
      return {
        success: false,
        error: 'Failed to clear performance data',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: createUnifiedTimestamp().utc,
        traceId: entry.id,
      };
    }
  }

  /**
   * Record a performance event with metadata
   */
  async recordEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      const operationId = createUnifiedId('operation', `event_${eventType}`);
      globalProfiler.startOperation(operationId, eventType, data);
      globalProfiler.endOperation(operationId, true);
    } catch (error) {
      await this.errorHandler.handleError(error as Error, {
        component: this.component,
        operation: 'recordEvent',
        eventType,
      });
    }
  }

  /**
   * Record security-related events and metrics
   */
  async recordSecurityEvent(eventType: string, metadata: Record<string, unknown>): Promise<void> {
    const operationId = createUnifiedId('operation', `security_${eventType}`);
    globalProfiler.startOperation(operationId, `security_${eventType}`, metadata);
    globalProfiler.endOperation(operationId, true);
  }

  /**
   * Get security metrics and status
   */
  async getSecurityMetrics(): Promise<PerformanceAPIResponse> {
    try {
      // This would integrate with actual security tracking systems
      const securityStatus = {
        validationErrors: 0, // Would be tracked by RequestValidator
        rateLimitViolations: 0, // Would be tracked by ContextManager
        authenticationFailures: 0, // Would be tracked by authentication system
        securityAlertsActive: 0, // Would be tracked by PerformanceBridge
        lastSecurityScan: createUnifiedTimestamp().utc,
        securityLevel: 'operational' as 'secure' | 'operational' | 'warning' | 'critical',
      };

      return {
        success: true,
        data: securityStatus,
        timestamp: createUnifiedTimestamp().utc,
      };
    } catch (error) {
      const entry = await this.errorHandler.handleError(error as Error, {
        component: this.component,
        operation: 'getSecurityMetrics',
      });
      return {
        success: false,
        error: 'Failed to retrieve security metrics',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: createUnifiedTimestamp().utc,
        traceId: entry.id,
      };
    }
  }

  /**
   * Generate unified ID following canonical architecture
   */
  // Removed local ID generation to enforce canonical createUnifiedId usage (anti-parallel system compliance)
}
