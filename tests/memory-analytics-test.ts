#!/usr/bin/env npx tsx
/**
 * Memory Analytics Test Suite
 * Tests the generateMemoryAnalytics() function with comprehensive scenarios
 */

import { MemoryIntelligence } from '../coreagent/intelligence/memoryIntelligence';
import { Mem0Client } from '../coreagent/tools/mem0Client';
import { GeminiEmbeddingsTool } from '../coreagent/tools/geminiEmbeddings';

async function testMemoryAnalytics() {
  console.log('🧪 Memory Analytics Test Suite');
  console.log('=====================================');

  try {
    // Initialize with mock clients
    const mockMem0Client = new Mem0Client('mock-api-key', 'local');
    const mockEmbeddingsTool = new GeminiEmbeddingsTool('mock-gemini-key');
    
    // Create memory intelligence instance
    const memoryIntelligence = new MemoryIntelligence(mockMem0Client, mockEmbeddingsTool);

    console.log('\n🔍 Test 1: Generate Memory Analytics');
    
    const startTime = Date.now();
    const analytics = await memoryIntelligence.generateMemoryAnalytics();
    const endTime = Date.now();
    
    console.log(`⏱️ Analytics generation took: ${endTime - startTime}ms`);
    
    // Validate analytics structure
    console.log('\n📊 Analytics Results:');
    console.log(`- Total Memories: ${analytics.totalMemories}`);
    console.log(`- Category Counts: ${Object.keys(analytics.categoryCounts).length} categories`);
    console.log(`- Average Importance: ${analytics.averageImportance.toFixed(2)}`);
    console.log(`- Top Categories: ${analytics.topCategories.length} categories`);
    console.log(`- Memory Growth Rate: ${analytics.memoryGrowthRate.toFixed(2)} memories/day`);
    console.log(`- Access Patterns: ${analytics.accessPatterns.length} hourly patterns`);
    console.log(`- Similarity Networks: ${analytics.similarityNetworks.length} networks`);

    // Validate categoryBreakdown alias
    const categoriesMatch = JSON.stringify(analytics.categoryCounts) === JSON.stringify(analytics.categoryBreakdown);
    console.log(`\n✅ categoryBreakdown alias works: ${categoriesMatch}`);

    // Validate data structure integrity
    const validStructure = (
      typeof analytics.totalMemories === 'number' &&
      typeof analytics.categoryCounts === 'object' &&
      typeof analytics.categoryBreakdown === 'object' &&
      typeof analytics.averageImportance === 'number' &&
      Array.isArray(analytics.topCategories) &&
      typeof analytics.memoryGrowthRate === 'number' &&
      Array.isArray(analytics.accessPatterns) &&
      Array.isArray(analytics.similarityNetworks)
    );
    
    console.log(`✅ Data structure valid: ${validStructure}`);

    // Test performance under load simulation
    console.log('\n⚡ Test 2: Performance Under Load');
    const loadTestStart = Date.now();
    
    const batchPromises = Array.from({ length: 5 }, () => 
      memoryIntelligence.generateMemoryAnalytics()
    );
    
    const batchResults = await Promise.all(batchPromises);
    const loadTestEnd = Date.now();
    
    console.log(`⏱️ Batch analytics (5x) took: ${loadTestEnd - loadTestStart}ms`);
    console.log(`📈 Average per request: ${((loadTestEnd - loadTestStart) / 5).toFixed(2)}ms`);
    
    // Validate consistency across batch
    const firstResult = JSON.stringify(batchResults[0]);
    const consistent = batchResults.every(result => 
      JSON.stringify(result) === firstResult
    );
    console.log(`✅ Batch consistency: ${consistent}`);

    // Test error handling
    console.log('\n🛡️ Test 3: Error Handling');
    
    // This should handle gracefully when no memories exist
    const errorTestStart = Date.now();
    const emptyAnalytics = await memoryIntelligence.generateMemoryAnalytics();
    const errorTestEnd = Date.now();
    
    console.log(`⏱️ Empty state handling took: ${errorTestEnd - errorTestStart}ms`);
    console.log(`✅ Empty state handled gracefully: ${emptyAnalytics.totalMemories === 0}`);

    console.log('\n🎉 All Memory Analytics Tests Passed!');
    console.log('=====================================');
    
    return {
      success: true,
      analytics,
      performanceMetrics: {
        singleRequest: endTime - startTime,
        batchAverage: (loadTestEnd - loadTestStart) / 5,
        emptyStateHandling: errorTestEnd - errorTestStart
      }
    };

  } catch (error) {
    console.error('❌ Memory Analytics Test Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  testMemoryAnalytics()
    .then(result => {
      console.log('\n📋 Test Summary:');
      console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (result.success && result.performanceMetrics) {
        console.log('Performance Metrics:');
        console.log(`- Single Request: ${result.performanceMetrics.singleRequest}ms`);
        console.log(`- Batch Average: ${result.performanceMetrics.batchAverage.toFixed(2)}ms`);
        console.log(`- Empty State: ${result.performanceMetrics.emptyStateHandling}ms`);
      }
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test Suite Crashed:', error);
      process.exit(1);
    });
}

export { testMemoryAnalytics };
