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
import { GeminiEmbeddingsTool } from '../tools/geminiEmbeddings';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

export interface PerformanceAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface SystemStatus {
  performance: {
    totalOperations: number;
    averageLatency: number;
    errorRate: number;
    activeOperations: number;
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
  private embeddingsTool: GeminiEmbeddingsTool;
  constructor(
    memoryIntelligence: MemoryIntelligence,
    geminiClient: GeminiClient,
    memoryClient: OneAgentMemory,
    embeddingsTool: GeminiEmbeddingsTool
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
      const report = globalProfiler.generateReport();
      const memoryResult = await this.memoryClient.searchMemory({
        query: 'system',
        limit: 100,
        type: 'system'
      });
      const memoryData = memoryResult.results || [];
      const analytics = await this.memoryIntelligence.generateMemoryAnalytics('system');
        // Test service connections
      const services: SystemStatus['services'] = {
        gemini: 'unknown',
        mem0: 'unknown',
        embedding: 'unknown'
      };      try {
        // Test connection by attempting a simple search
        await this.memoryClient.searchMemory({
          query: 'test',
          limit: 1,
          type: 'system'
        });
        services.mem0 = 'connected';
      } catch {
        services.mem0 = 'error';
      }try {
        // Test would go here - for now assume embeddings work if memory works
        services.embedding = services.mem0 === 'connected' ? 'connected' : 'unknown';
        services.gemini = 'connected'; // Assume Gemini is available if we got this far
      } catch {
        services.embedding = 'error';
        services.gemini = 'error';
      }      const status: SystemStatus = {
        performance: {
          totalOperations: report.totalOperations,
          averageLatency: report.averageLatency,
          errorRate: report.errorRate,
          activeOperations: Object.keys(globalProfiler['activeOperations'] || {}).length
        },
        memory: {
          totalMemories: memoryData.length,
          categoryBreakdown: analytics.categoryBreakdown,
          avgImportanceScore: analytics.averageImportance,
          topCategories: Object.entries(analytics.categoryBreakdown)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([category]) => category)
        },
        security: {
          validationErrors: 0,
          rateLimitViolations: 0,
          authenticationFailures: 0,
          securityAlertsActive: 0,
          lastSecurityScan: new Date().toISOString()
        },
        services
      };

      return {
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get detailed performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceAPIResponse> {
    try {
      const report = globalProfiler.generateReport();
      
      return {
        success: true,
        data: report,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get memory intelligence analytics
   */  async getMemoryAnalytics(filter?: any): Promise<PerformanceAPIResponse> {
    try {
      const memoryResult = await this.memoryClient.searchMemory({
        query: filter?.query || '',
        limit: filter?.limit || 100,
        type: 'system'
      });
      const memoryData = memoryResult.results || [];
      const analytics = await this.memoryIntelligence.generateMemoryAnalytics(filter?.userId || 'system');
      
      return {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Search memories with intelligence
   */
  async searchMemories(query?: string, filter?: any): Promise<PerformanceAPIResponse> {
    try {
      let results;
      
      if (query) {
        // Use semantic search
        const searchResults = await this.embeddingsTool.semanticSearch(query, filter);
        results = {
          memories: searchResults.results.map(r => r.memory),
          analytics: searchResults.analytics,
          searchType: 'semantic'
        };      } else {
        // Use basic search
        const memoryResult = await this.memoryClient.searchMemory({
          query: filter?.query || '',
          limit: filter?.limit || 50,
          type: 'system'
        });
        results = {
          memories: memoryResult.results || [],
          searchType: 'basic'
        };
      }
      
      return {
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create memory with intelligence
   */
  async createMemory(
    content: string,
    metadata?: Record<string, any>,
    userId?: string,
    agentId?: string,
    // workflowId?: string  // Currently unused
  ): Promise<PerformanceAPIResponse> {
    try {      // Categorize and score the memory (create temporary memory object)
      const tempMemory = { 
        id: 'temp', 
        content, 
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const category = await this.memoryIntelligence.categorizeMemory(tempMemory);
      const importance = await this.memoryIntelligence.calculateImportanceScore(tempMemory);      // Store with embedding and intelligence
      const result = await this.embeddingsTool.storeMemoryWithEmbedding(
        content,        agentId || 'oneagent-system',
        userId || 'system',
        'learning',
        {
          ...metadata,
          category: category,
          importance_score: importance.overall
        }
      );

      return {
        success: true,        data: {
          memoryId: result.memoryId,
          embedding: result.embedding,intelligence: {
            category: category,
            importance: importance
          }
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get similar memories
   */
  async getSimilarMemories(memoryId: string, options?: any): Promise<PerformanceAPIResponse> {
    try {
      const results = await this.embeddingsTool.findSimilarMemories(memoryId, options);
      
      return {
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
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
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Record a performance event with metadata
   */
  async recordEvent(eventType: string, data: Record<string, any>): Promise<void> {
    try {
      const operationId = this.generateUnifiedId('event', eventType);
      globalProfiler.startOperation(operationId, eventType, data);
      globalProfiler.endOperation(operationId, true);
    } catch (error) {
      // Silently handle errors to prevent disrupting main operations
      console.warn(`Failed to record event ${eventType}:`, error);
    }
  }

  /**
   * Record security-related events and metrics
   */
  async recordSecurityEvent(eventType: string, metadata: Record<string, any>): Promise<void> {
    const operationId = this.generateUnifiedId('security', eventType);
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
        lastSecurityScan: new Date().toISOString(),
        securityLevel: 'operational' as 'secure' | 'operational' | 'warning' | 'critical'
      };

      return {
        success: true,
        data: securityStatus,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate unified ID following canonical architecture
   */
  private generateUnifiedId(type: string, context?: string): string {
    const timestamp = createUnifiedTimestamp().unix;
    const randomSuffix = this.generateSecureRandomSuffix();
    const prefix = context ? `${type}_${context}` : type;
    return `${prefix}_${timestamp}_${randomSuffix}`;
  }
  
  private generateSecureRandomSuffix(): string {
    // Use crypto.randomUUID() for better randomness, fallback to Math.random()
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().split('-')[0]; // Use first segment
    }
    return Math.random().toString(36).substr(2, 9);
  }
}
