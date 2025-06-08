/**
 * MemoryBridge - Coordination bridge between Memory Intelligence and Performance API
 * Part of Level 2.5 Integration Bridges (Phase 1b)
 * 
 * Provides seamless integration between memory operations and performance monitoring.
 */

import { MemoryIntelligence } from '../intelligence/memoryIntelligence';
import { PerformanceAPI } from '../api/performanceAPI';
import { SimpleAuditLogger, defaultAuditLogger } from '../audit/auditLogger';
import { SecureErrorHandler, defaultSecureErrorHandler } from '../utils/secureErrorHandler';

export interface MemoryPerformanceMetrics {
  searchLatency: number;
  retrievalLatency: number;
  indexingLatency: number;
  memoryUtilization: number;
  cacheHitRate: number;
  operationsPerSecond: number;
}

export interface MemoryBridgeConfig {
  enablePerformanceTracking: boolean;
  enableCaching: boolean;
  cacheTimeout: number;
  maxCacheSize: number;
  performanceThresholds: {
    searchWarning: number;
    searchError: number;
    retrievalWarning: number;
    retrievalError: number;
  };
}

export interface MemorySearchResult {
  results: any[];
  metadata: {
    searchTime: number;
    totalResults: number;
    cached: boolean;
    performanceScore: number;
  };
}

export class MemoryBridge {
  private memoryIntelligence: MemoryIntelligence;
  private performanceAPI: PerformanceAPI;
  private auditLogger: SimpleAuditLogger;
  private errorHandler: SecureErrorHandler;
  private config: MemoryBridgeConfig;
  private searchCache = new Map<string, { data: any; timestamp: number }>();
  private metrics: MemoryPerformanceMetrics;

  constructor(
    memoryIntelligence: MemoryIntelligence,
    performanceAPI: PerformanceAPI,
    config?: Partial<MemoryBridgeConfig>,
    auditLogger?: SimpleAuditLogger,
    errorHandler?: SecureErrorHandler
  ) {
    this.memoryIntelligence = memoryIntelligence;
    this.performanceAPI = performanceAPI;
    this.auditLogger = auditLogger || defaultAuditLogger;
    this.errorHandler = errorHandler || defaultSecureErrorHandler;
    
    this.config = {
      enablePerformanceTracking: true,
      enableCaching: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      maxCacheSize: 1000,
      performanceThresholds: {
        searchWarning: 1000, // 1 second
        searchError: 5000,   // 5 seconds
        retrievalWarning: 500, // 500ms
        retrievalError: 2000   // 2 seconds
      },
      ...config
    };

    this.metrics = {
      searchLatency: 0,
      retrievalLatency: 0,
      indexingLatency: 0,
      memoryUtilization: 0,
      cacheHitRate: 0,
      operationsPerSecond: 0
    };

    this.initializeMetricsTracking();
  }

  /**
   * Performs intelligent memory search with performance monitoring
   */
  async performSearch(
    query: string,
    options: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
      limit?: number;
      threshold?: number;
      useCache?: boolean;
    } = {}
  ): Promise<MemorySearchResult> {
    const startTime = Date.now();
    const searchKey = this.generateCacheKey(query, options);
    
    try {
      // Check cache first
      if (this.config.enableCaching && options.useCache !== false) {
        const cached = this.getCachedResult(searchKey);
        if (cached) {
          const searchTime = Date.now() - startTime;
          await this.recordSearchMetrics(searchTime, true);
          
          return {
            results: cached.data,
            metadata: {
              searchTime,
              totalResults: cached.data.length,
              cached: true,
              performanceScore: this.calculatePerformanceScore(searchTime)
            }
          };
        }
      }      // Perform actual search
      const searchResults = await this.memoryIntelligence.semanticSearch(
        query,
        {
          limit: options.limit || 10,
          userId: options.userId
        },
        {
          topK: options.limit || 10,
          similarityThreshold: options.threshold || 0.7
        }
      );

      const searchTime = Date.now() - startTime;
      
      // Cache results
      if (this.config.enableCaching) {
        this.setCachedResult(searchKey, searchResults);
      }

      // Record performance metrics
      await this.recordSearchMetrics(searchTime, false);
      
      // Check performance thresholds
      await this.checkPerformanceThresholds('search', searchTime, options);

      return {
        results: searchResults,
        metadata: {
          searchTime,
          totalResults: searchResults.length,
          cached: false,
          performanceScore: this.calculatePerformanceScore(searchTime)
        }
      };

    } catch (error) {
      const searchTime = Date.now() - startTime;
      await this.handleMemoryError(error, 'search', { ...options, searchTime });
      throw error;
    }
  }

  /**
   * Retrieves memory entries with performance tracking
   */
  async retrieveMemory(
    memoryId: string,
    options: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
    } = {}
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.memoryIntelligence.getMemory(memoryId, options.userId);
      const retrievalTime = Date.now() - startTime;
      
      await this.recordRetrievalMetrics(retrievalTime);
      await this.checkPerformanceThresholds('retrieval', retrievalTime, options);
      
      return result;
    } catch (error) {
      const retrievalTime = Date.now() - startTime;
      await this.handleMemoryError(error, 'retrieval', { ...options, retrievalTime });
      throw error;
    }
  }

  /**
   * Stores memory with performance tracking
   */
  async storeMemory(
    content: string,
    metadata: Record<string, any>,
    options: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
    } = {}
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      const memoryId = await this.memoryIntelligence.storeMemory(
        content,
        metadata,
        options.userId
      );
      
      const indexingTime = Date.now() - startTime;
      await this.recordIndexingMetrics(indexingTime);
      
      // Invalidate related cache entries
      this.invalidateRelatedCache(content);
      
      return memoryId;
    } catch (error) {
      const indexingTime = Date.now() - startTime;
      await this.handleMemoryError(error, 'indexing', { ...options, indexingTime });
      throw error;
    }
  }

  /**
   * Gets comprehensive memory analytics with performance data
   */
  async getMemoryAnalytics(userId?: string): Promise<{
    intelligence: any;
    performance: MemoryPerformanceMetrics;
    cacheStats: { size: number; hitRate: number };
  }> {
    try {
      const intelligenceData = await this.memoryIntelligence.getAnalytics(userId);
      const cacheStats = this.getCacheStatistics();
      
      return {
        intelligence: intelligenceData,
        performance: { ...this.metrics },
        cacheStats
      };
    } catch (error) {
      await this.handleMemoryError(error, 'analytics', { userId });
      throw error;
    }
  }

  /**
   * Records search performance metrics
   */
  private async recordSearchMetrics(latency: number, cached: boolean): Promise<void> {
    if (!this.config.enablePerformanceTracking) return;

    this.metrics.searchLatency = latency;
    
    if (cached) {
      this.updateCacheHitRate(true);
    } else {
      this.updateCacheHitRate(false);
    }

    await this.performanceAPI.recordEvent('memory_search', {
      latency,
      cached,
      timestamp: Date.now()
    });
  }

  /**
   * Records retrieval performance metrics
   */
  private async recordRetrievalMetrics(latency: number): Promise<void> {
    if (!this.config.enablePerformanceTracking) return;

    this.metrics.retrievalLatency = latency;
    
    await this.performanceAPI.recordEvent('memory_retrieval', {
      latency,
      timestamp: Date.now()
    });
  }

  /**
   * Records indexing performance metrics
   */
  private async recordIndexingMetrics(latency: number): Promise<void> {
    if (!this.config.enablePerformanceTracking) return;

    this.metrics.indexingLatency = latency;
    
    await this.performanceAPI.recordEvent('memory_indexing', {
      latency,
      timestamp: Date.now()
    });
  }

  /**
   * Checks performance thresholds and logs warnings/errors
   */
  private async checkPerformanceThresholds(
    operation: 'search' | 'retrieval',
    latency: number,
    context: any
  ): Promise<void> {
    const thresholds = this.config.performanceThresholds;
    const warningThreshold = operation === 'search' ? thresholds.searchWarning : thresholds.retrievalWarning;
    const errorThreshold = operation === 'search' ? thresholds.searchError : thresholds.retrievalError;

    if (latency > errorThreshold) {
      await this.auditLogger.logError(
        'MEMORY_PERFORMANCE',
        `${operation} operation exceeded error threshold: ${latency}ms > ${errorThreshold}ms`,
        { ...context, latency, threshold: errorThreshold }
      );
    } else if (latency > warningThreshold) {
      await this.auditLogger.logWarning(
        'MEMORY_PERFORMANCE',
        `${operation} operation exceeded warning threshold: ${latency}ms > ${warningThreshold}ms`,
        { ...context, latency, threshold: warningThreshold }
      );
    }
  }

  /**
   * Handles memory operation errors
   */
  private async handleMemoryError(error: any, operation: string, context: any): Promise<void> {
    await this.auditLogger.logError(
      'MEMORY_BRIDGE',
      `Memory ${operation} operation failed: ${error.message}`,
      { ...context, error: error.message, stack: error.stack }
    );
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(query: string, options: any): string {
    const keyData = {
      query: query.toLowerCase().trim(),
      limit: options.limit || 10,
      threshold: options.threshold || 0.7,
      userId: options.userId || 'anonymous'
    };
    return JSON.stringify(keyData);
  }

  private getCachedResult(key: string): { data: any } | null {
    const cached = this.searchCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.config.cacheTimeout) {
      this.searchCache.delete(key);
      return null;
    }
    
    return cached;
  }
  private setCachedResult(key: string, data: any): void {
    if (this.searchCache.size >= this.config.maxCacheSize) {
      // Remove oldest entry
      const oldestKey = this.searchCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.searchCache.delete(oldestKey);
      }
    }
    
    this.searchCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private invalidateRelatedCache(content: string): void {
    const keywords = content.toLowerCase().split(/\s+/).slice(0, 5);
    
    for (const [key] of this.searchCache) {
      const keyData = JSON.parse(key);
      if (keywords.some(keyword => keyData.query.includes(keyword))) {
        this.searchCache.delete(key);
      }
    }
  }

  private getCacheStatistics(): { size: number; hitRate: number } {
    return {
      size: this.searchCache.size,
      hitRate: this.metrics.cacheHitRate
    };
  }

  private updateCacheHitRate(hit: boolean): void {
    // Simple moving average
    const alpha = 0.1;
    const hitValue = hit ? 1 : 0;
    this.metrics.cacheHitRate = (1 - alpha) * this.metrics.cacheHitRate + alpha * hitValue;
  }

  private calculatePerformanceScore(latency: number): number {
    // Score from 0-100 based on latency
    const maxLatency = 5000; // 5 seconds
    return Math.max(0, Math.min(100, 100 - (latency / maxLatency) * 100));
  }

  private initializeMetricsTracking(): void {
    // Initialize periodic metrics updates
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  private updateSystemMetrics(): void {
    // Update memory utilization and operations per second
    this.metrics.memoryUtilization = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100;
    // OPS tracking would be implemented based on actual usage patterns
  }

  /**
   * Gets current bridge configuration
   */
  getConfig(): MemoryBridgeConfig {
    return { ...this.config };
  }

  /**
   * Updates bridge configuration
   */
  updateConfig(newConfig: Partial<MemoryBridgeConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default MemoryBridge;
