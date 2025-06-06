#!/usr/bin/env npx tsx
/**
 * Memory Intelligence Performance Benchmark
 * Evaluates performance under various load conditions
 */

import { MemoryIntelligence } from '../coreagent/intelligence/memoryIntelligence';
import { Mem0Client } from '../coreagent/tools/mem0Client';
import { GeminiEmbeddingsTool } from '../coreagent/tools/geminiEmbeddings';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
}

async function benchmarkMemoryIntelligence() {
  console.log('🚀 Memory Intelligence Performance Benchmark');
  console.log('==============================================');

  try {
    // Initialize components
    const mockMem0Client = new Mem0Client('mock-api-key', 'local');
    const mockEmbeddingsTool = new GeminiEmbeddingsTool('mock-gemini-key');
    const memoryIntelligence = new MemoryIntelligence(mockMem0Client, mockEmbeddingsTool);

    // Create mock memory object for testing
    const mockMemory = {
      id: 'test-memory-' + Date.now(),
      content: 'This is a test memory for benchmarking memory intelligence performance and categorization capabilities.',
      metadata: { test: true, category: 'benchmark' },
      memoryType: 'session' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const results: BenchmarkResult[] = [];

    // Benchmark 1: Memory Categorization
    console.log('\n🏷️ Benchmarking Memory Categorization...');
    const categorizeResults = await runBenchmark(
      'Memory Categorization',
      50,
      () => memoryIntelligence.categorizeMemory(mockMemory)
    );
    results.push(categorizeResults);

    // Benchmark 2: Importance Score Calculation
    console.log('\n⭐ Benchmarking Importance Score Calculation...');
    const importanceResults = await runBenchmark(
      'Importance Score Calculation',
      50,
      () => memoryIntelligence.calculateImportanceScore(mockMemory)
    );
    results.push(importanceResults);

    // Benchmark 3: Memory Analytics Generation
    console.log('\n📊 Benchmarking Memory Analytics Generation...');
    const analyticsResults = await runBenchmark(
      'Memory Analytics Generation',
      10, // Fewer iterations for heavier operation
      () => memoryIntelligence.generateMemoryAnalytics()
    );
    results.push(analyticsResults);

    // Benchmark 4: Memory Summarization
    console.log('\n📝 Benchmarking Memory Summarization...');
    const summarizationResults = await runBenchmark(
      'Memory Summarization',
      30,
      () => memoryIntelligence.summarizeMemory(mockMemory)
    );
    results.push(summarizationResults);

    // Benchmark 5: Semantic Search
    console.log('\n🔍 Benchmarking Semantic Search...');
    const searchResults = await runBenchmark(
      'Semantic Search',
      20,
      () => memoryIntelligence.findSimilarMemories('test query for semantic search')
    );
    results.push(searchResults);

    // Benchmark 6: Concurrent Operations
    console.log('\n⚡ Benchmarking Concurrent Operations...');
    const concurrentStart = Date.now();
    const concurrentPromises = Array.from({ length: 20 }, () => 
      Promise.all([
        memoryIntelligence.categorizeMemory(mockMemory),
        memoryIntelligence.calculateImportanceScore(mockMemory),
        memoryIntelligence.summarizeMemory(mockMemory)
      ])
    );
    
    await Promise.all(concurrentPromises);
    const concurrentTime = Date.now() - concurrentStart;
    
    console.log(`⏱️ 20 concurrent operations (3 each): ${concurrentTime}ms`);
    console.log(`📈 Average per operation set: ${(concurrentTime / 20).toFixed(2)}ms`);

    // Display comprehensive results
    console.log('\n📋 BENCHMARK RESULTS SUMMARY');
    console.log('==============================================');
    
    results.forEach(result => {
      console.log(`\n🎯 ${result.operation}:`);
      console.log(`   Iterations: ${result.iterations}`);
      console.log(`   Total Time: ${result.totalTime}ms`);
      console.log(`   Average: ${result.averageTime.toFixed(2)}ms`);
      console.log(`   Min: ${result.minTime}ms`);
      console.log(`   Max: ${result.maxTime}ms`);
      console.log(`   Success Rate: ${(result.successRate * 100).toFixed(1)}%`);
      
      // Performance classification
      const classification = classifyPerformance(result.averageTime);
      console.log(`   Performance: ${classification}`);
    });

    // Memory usage estimation
    console.log('\n💾 MEMORY USAGE ESTIMATION');
    const memoryUsage = process.memoryUsage();
    console.log(`   RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);

    // Performance recommendations
    console.log('\n💡 PERFORMANCE RECOMMENDATIONS');
    results.forEach(result => {
      if (result.averageTime > 1000) {
        console.log(`⚠️  ${result.operation}: Consider optimization (>1s average)`);
      } else if (result.averageTime > 500) {
        console.log(`⚡ ${result.operation}: Monitor performance (>500ms average)`);
      } else {
        console.log(`✅ ${result.operation}: Excellent performance`);
      }
    });

    console.log('\n🎉 Benchmark Complete!');
    return {
      success: true,
      results,
      concurrentPerformance: {
        totalTime: concurrentTime,
        averagePerSet: concurrentTime / 20
      },
      memoryUsage
    };

  } catch (error) {
    console.error('❌ Benchmark Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runBenchmark<T>(
  operationName: string, 
  iterations: number, 
  operation: () => Promise<T>
): Promise<BenchmarkResult> {
  const times: number[] = [];
  let successCount = 0;
  
  console.log(`   Running ${iterations} iterations...`);
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await operation();
      successCount++;
    } catch (error) {
      console.log(`   ⚠️ Iteration ${i + 1} failed: ${error}`);
    }
    const end = Date.now();
    times.push(end - start);
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const successRate = successCount / iterations;
  
  return {
    operation: operationName,
    iterations,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    successRate
  };
}

function classifyPerformance(averageMs: number): string {
  if (averageMs < 50) return '🚄 Excellent (<50ms)';
  if (averageMs < 100) return '⚡ Very Good (<100ms)';
  if (averageMs < 200) return '✅ Good (<200ms)';
  if (averageMs < 500) return '⚠️ Acceptable (<500ms)';
  if (averageMs < 1000) return '🐌 Slow (<1s)';
  return '🔴 Critical (>1s)';
}

// Run benchmark if called directly
if (require.main === module) {
  benchmarkMemoryIntelligence()
    .then(result => {
      console.log('\n📊 Final Status:');
      console.log(`Status: ${result.success ? '✅ COMPLETED' : '❌ FAILED'}`);
      
      if (result.success) {
        const avgPerformance = result.results.reduce((sum, r) => sum + r.averageTime, 0) / result.results.length;
        console.log(`Overall Average Performance: ${avgPerformance.toFixed(2)}ms`);
      }
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Benchmark Crashed:', error);
      process.exit(1);
    });
}

export { benchmarkMemoryIntelligence };
