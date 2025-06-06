/**
 * Performance API for OneAgent UI Integration
 * 
 * Provides HTTP endpoints for accessing performance metrics, memory intelligence,
 * and system analytics from the UI layer.
 */

import { globalProfiler } from '../performance/profiler';
import { MemoryIntelligence } from '../intelligence/memoryIntelligence';
import { GeminiClient } from '../tools/geminiClient';
import { Mem0Client } from '../tools/mem0Client';
import { GeminiEmbeddingsTool } from '../tools/geminiEmbeddings';

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
  private mem0Client: Mem0Client;
  private embeddingsTool: GeminiEmbeddingsTool;

  constructor(
    memoryIntelligence: MemoryIntelligence,
    geminiClient: GeminiClient,
    mem0Client: Mem0Client,
    embeddingsTool: GeminiEmbeddingsTool
  ) {
    this.memoryIntelligence = memoryIntelligence;
    this.geminiClient = geminiClient;
    this.mem0Client = mem0Client;
    this.embeddingsTool = embeddingsTool;
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus(): Promise<PerformanceAPIResponse<SystemStatus>> {
    try {
      const report = globalProfiler.generateReport();
      
      // Get memory analytics
      const memories = await this.mem0Client.searchMemories({});      const memoryData = memories.success && memories.data ? memories.data : [];
      
      const analytics = await this.memoryIntelligence.generateMemoryAnalytics();
        // Test service connections
      const services: SystemStatus['services'] = {
        gemini: 'unknown',
        mem0: 'unknown',
        embedding: 'unknown'
      };

      try {
        await this.mem0Client.testConnection();
        services.mem0 = 'connected';
      } catch {
        services.mem0 = 'error';
      }

      try {
        await this.embeddingsTool.testEmbeddings();
        services.embedding = 'connected';
        services.gemini = 'connected';
      } catch {
        services.embedding = 'error';
        services.gemini = 'error';
      }

      const status: SystemStatus = {
        performance: {
          totalOperations: report.totalOperations,
          averageLatency: report.averageLatency,
          errorRate: report.errorRate,
          activeOperations: Object.keys(globalProfiler['activeOperations'] || {}).length
        },
        memory: {
          totalMemories: memoryData.length,
          categoryBreakdown: analytics.categoryBreakdown,
          avgImportanceScore: analytics.averageImportance,          topCategories: Object.entries(analytics.categoryBreakdown)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([category]) => category)
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
   */
  async getMemoryAnalytics(filter?: any): Promise<PerformanceAPIResponse> {
    try {
      const memories = await this.mem0Client.searchMemories(filter || {});
      const memoryData = memories.success && memories.data ? memories.data : [];
        const analytics = await this.memoryIntelligence.generateMemoryAnalytics();
      
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
        };
      } else {
        // Use basic search
        const memories = await this.mem0Client.searchMemories(filter || {});
        results = {
          memories: memories.success && memories.data ? memories.data : [],
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
    workflowId?: string
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
      const importance = await this.memoryIntelligence.calculateImportanceScore(tempMemory);

      // Store with embedding and intelligence
      const result = await this.embeddingsTool.storeMemoryWithEmbedding(
        content,        {
          ...metadata,
          category: category,
          importance_score: importance.overall
        },
        userId,
        agentId,
        workflowId
      );

      return {
        success: true,
        data: {
          memory: result.memory,
          embedding: result.embedding,          intelligence: {
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
}
