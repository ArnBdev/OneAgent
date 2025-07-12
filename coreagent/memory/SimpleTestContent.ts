/**
 * Simple Content Generator for Testing OneAgent Memory Optimizations
 * Generates lightweight test content to minimize quota usage
 */

export class SimpleTestContent {
  private static counter = 0;

  /**
   * Generate simple test memory entry
   */
  static generateTest(): { content: string; metadata: any } {
    this.counter++;
    return {
      content: `Test entry #${this.counter}`,
      metadata: {
        type: 'test',
        timestamp: new Date().toISOString(),
        counter: this.counter
      }
    };
  }

  /**
   * Generate batch test entries
   */
  static generateBatch(count: number): Array<{ content: string; metadata: any }> {
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
  static generateProgressUpdate(message: string): { content: string; metadata: any } {
    return {
      content: `Progress: ${message}`,
      metadata: {
        type: 'progress',
        timestamp: new Date().toISOString(),
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
  static async testMemoryOperations(memory: any): Promise<void> {
    console.log('[QuotaOptimizedTesting] Starting lightweight memory tests...');
    
    // Test 1: Simple add
    const testEntry = SimpleTestContent.generateTest();
    console.log('[QuotaOptimizedTesting] Adding simple test entry...');
    
    try {
      await memory.addMemory(testEntry);
      console.log('[QuotaOptimizedTesting] ✅ Simple add successful');
    } catch (error) {
      console.log('[QuotaOptimizedTesting] ❌ Simple add failed:', error instanceof Error ? error.message : String(error));
    }
    
    // Test 2: Simple search
    try {
      const searchResult = await memory.searchMemory({ query: 'test', limit: 3 });
      console.log('[QuotaOptimizedTesting] ✅ Simple search successful, found:', searchResult?.data?.length || 0, 'results');
    } catch (error) {
      console.log('[QuotaOptimizedTesting] ❌ Simple search failed:', error instanceof Error ? error.message : String(error));
    }
    
    // Test 3: Batch operations
    console.log('[QuotaOptimizedTesting] Testing batch operations...');
    const batchEntries = SimpleTestContent.generateBatch(3);
    
    for (const entry of batchEntries) {
      try {
        await memory.addMemoryBatch(entry);
      } catch (error) {
        console.log('[QuotaOptimizedTesting] Batch add error:', error instanceof Error ? error.message : String(error));
      }
    }
    
    // Flush batch
    try {
      const batchResult = await memory.flushBatch();
      console.log('[QuotaOptimizedTesting] ✅ Batch flush successful:', batchResult.results.length, 'operations');
    } catch (error) {
      console.log('[QuotaOptimizedTesting] ❌ Batch flush failed:', error instanceof Error ? error.message : String(error));
    }
    
    // Test 4: Optimization stats
    const stats = memory.getOptimizationStats();
    console.log('[QuotaOptimizedTesting] Optimization stats:', {
      cacheSize: stats.cache.size,
      hitRate: Math.round(stats.cache.hitRate * 100) + '%',
      batchQueue: stats.batch.queueSize,
      cachingEnabled: stats.cachingEnabled
    });
    
    console.log('[QuotaOptimizedTesting] Testing complete!');
  }
}
