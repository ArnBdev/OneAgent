// NOTE: Ensure we use canonical timestamp utilities
import { createUnifiedTimestamp, unifiedMetadataService } from '../utils/UnifiedBackboneService';

interface TestMetadata { type: string; timestamp: string; source: string; [key: string]: unknown }
interface TestEntry { content: string; metadata: TestMetadata }
interface SearchResultLite { data?: unknown[]; [k: string]: unknown }
interface BatchFlushResultLite { results?: unknown[]; errors?: unknown[]; [k: string]: unknown }
interface OptimizationStatsLite { cache?: { size?: number; hitRate?: number }; batch?: { queueSize?: number }; cachingEnabled?: boolean; [k: string]: unknown }
interface MemoryTestInterface {
  addMemory: (entry: TestEntry) => Promise<unknown>;
  searchMemory?: (params: { query: string; limit?: number }) => Promise<SearchResultLite>;
  addMemoryBatch?: (entry: TestEntry) => Promise<unknown>;
  flushBatch?: () => Promise<BatchFlushResultLite>;
  getOptimizationStats?: () => OptimizationStatsLite;
}
/**
 * Simple Content Generator for Testing OneAgent Memory Optimizations
 * Generates lightweight test content to minimize quota usage
 */

export class SimpleTestContent {
  private static counter = 0;

  /**
   * Generate simple test memory entry
   */
  static generateTest(): TestEntry {
    this.counter++;
    return {
      content: `Test entry #${this.counter}`,
      metadata: {
        type: 'test',
        timestamp: createUnifiedTimestamp().iso,
        source: 'simple_test',
        counter: this.counter
      }
    };
  }

  /**
   * Generate batch test entries
   */
  static generateBatch(count: number): TestEntry[] {
    return Array.from({ length: count }, () => this.generateTest());
  }

  /**
   * Generate search queries for testing
   */
  static generateSearchQueries(): string[] {
    return [
      'test entry',
      'configuration',
      'optimization',
      'batch operation',
      'cache test'
    ];
  }

  /**
   * Generate progress update entry
   */
  static generateProgressUpdate(message: string): TestEntry {
    return {
      content: `Progress: ${message}`,
      metadata: {
        type: 'progress',
  // Canonical timestamp
  timestamp: createUnifiedTimestamp().iso,
        source: 'optimization_test'
      }
    };
  }

  /**
   * Reset counter for testing
   */
  static reset(): void {
    this.counter = 0;
  }
}

/**
 * Quota-aware testing utilities
 */
export class QuotaOptimizedTesting {
  /**
   * Test memory operations with minimal quota usage
   */
  static async testMemoryOperations(memory: MemoryTestInterface): Promise<void> {
    console.log('[QuotaOptimizedTesting] Starting lightweight memory tests...');
    
    // Test 1: Simple add
    const testEntry = SimpleTestContent.generateTest();
    console.log('[QuotaOptimizedTesting] Adding simple test entry...');
    
    try {
      // Build partial unified metadata from legacy test entry for canonical path
      const unified = unifiedMetadataService.create('test_entry', 'QuotaOptimizedTesting', {
        system: { userId: 'tester', component: 'quota-tests', source: 'SimpleTestContent' },
        content: { category: 'test', tags: ['test','quota','simple'], sensitivity: 'internal', relevanceScore: 0.3, contextDependency: 'session' },
        custom: { original: testEntry.metadata || {}, testCounter: testEntry.metadata?.counter }
      });
      await (memory as unknown as { addMemoryCanonical: (c: string, m?: unknown, u?: string)=>Promise<string> }).addMemoryCanonical(testEntry.content, unified, 'tester');
      console.log('[QuotaOptimizedTesting] ✅ Simple add successful');
    } catch (error) {
      console.log('[QuotaOptimizedTesting] ❌ Simple add failed:', error instanceof Error ? error.message : String(error));
    }
    
    // Test 2: Simple search
    if (typeof memory.searchMemory === 'function') {
      try {
        const searchResult = await memory.searchMemory({ query: 'test', limit: 3 });
  console.log('[QuotaOptimizedTesting] ✅ Simple search successful, found:', (searchResult?.data?.length || 0), 'results');
      } catch (error) {
        console.log('[QuotaOptimizedTesting] ❌ Simple search failed:', error instanceof Error ? error.message : String(error));
      }
    } else {
      console.log('[QuotaOptimizedTesting] ℹ️ searchMemory not supported in this implementation');
    }
    
    // Test 3: Batch operations
    console.log('[QuotaOptimizedTesting] Testing batch operations...');
    const batchEntries = SimpleTestContent.generateBatch(3);
    
    if (typeof memory.addMemoryBatch === 'function') {
      for (const entry of batchEntries) {
        try {
          await memory.addMemoryBatch(entry); // Batch path will canonicalize internally now
        } catch (error) {
          console.log('[QuotaOptimizedTesting] Batch add error:', error instanceof Error ? error.message : String(error));
        }
      }
    } else {
      console.log('[QuotaOptimizedTesting] ℹ️ addMemoryBatch not supported');
    }
    
    // Flush batch
    if (typeof memory.flushBatch === 'function') {
      try {
        const batchResult = await memory.flushBatch();
        console.log('[QuotaOptimizedTesting] ✅ Batch flush successful:', (batchResult?.results || []).length, 'operations');
      } catch (error) {
        console.log('[QuotaOptimizedTesting] ❌ Batch flush failed:', error instanceof Error ? error.message : String(error));
      }
    } else {
      console.log('[QuotaOptimizedTesting] ℹ️ flushBatch not supported');
    }
    
    // Test 4: Optimization stats
    if (typeof memory.getOptimizationStats === 'function') {
      const stats = memory.getOptimizationStats();
      console.log('[QuotaOptimizedTesting] Optimization stats:', {
        cacheSize: stats.cache?.size,
        hitRate: stats.cache ? Math.round((stats.cache.hitRate || 0) * 100) + '%' : 'n/a',
        batchQueue: stats.batch?.queueSize,
        cachingEnabled: stats.cachingEnabled
      });
    } else {
      console.log('[QuotaOptimizedTesting] ℹ️ getOptimizationStats not supported');
    }
    
    console.log('[QuotaOptimizedTesting] Testing complete!');
  }
}
