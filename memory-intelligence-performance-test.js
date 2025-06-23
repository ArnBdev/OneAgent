/**
 * Memory Intelligence Performance Test
 * Compare timing between basic memory search and intelligent memory search
 */

import { realUnifiedMemoryClient } from '../coreagent/memory/RealUnifiedMemoryClient';
import { MemoryIntelligence } from '../coreagent/intelligence/memoryIntelligence';

async function performanceTest() {
  console.log('🔬 Memory Intelligence Performance Test');
  console.log('=====================================');
  
  // Test parameters
  const testUserId = 'perf_test_user';
  const testQuery = 'TypeScript development patterns';
  const iterations = 5;
  
  // Initialize systems
  await realUnifiedMemoryClient.connect();
  const memoryIntelligence = new MemoryIntelligence(realUnifiedMemoryClient);
    // Basic memory search timing
  console.log('\n📊 Basic Memory Search Performance:');
  const basicTimes = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    try {
      await realUnifiedMemoryClient.getMemoryContext(testQuery, testUserId, 20);
      const duration = Date.now() - startTime;
      basicTimes.push(duration);
      console.log(`  Run ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`  Run ${i + 1}: ERROR - ${error}`);
    }
  }
  
  // Intelligent memory search timing
  console.log('\n🧠 Intelligent Memory Search Performance:');
  const intelligentTimes = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    try {
      await memoryIntelligence.intelligentSearch(testQuery, testUserId, { maxResults: 20 });
      const duration = Date.now() - startTime;
      intelligentTimes.push(duration);
      console.log(`  Run ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`  Run ${i + 1}: ERROR - ${error}`);
    }
  }
  
  // Calculate statistics
  const basicAvg = basicTimes.reduce((a, b) => a + b, 0) / basicTimes.length;
  const intelligentAvg = intelligentTimes.reduce((a, b) => a + b, 0) / intelligentTimes.length;
  const overhead = intelligentAvg - basicAvg;
  const overheadPercent = (overhead / basicAvg) * 100;
  
  console.log('\n📈 Performance Analysis:');
  console.log(`  Basic Search Average:      ${basicAvg.toFixed(2)}ms`);
  console.log(`  Intelligent Search Average: ${intelligentAvg.toFixed(2)}ms`);
  console.log(`  Intelligence Overhead:     ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(1)}%)`);
  
  // Performance verdict
  console.log('\n🎯 Performance Verdict:');
  if (overhead < 50) {
    console.log('  ✅ MINIMAL OVERHEAD - Intelligence overhead is negligible');
  } else if (overhead < 100) {
    console.log('  ⚠️ MODERATE OVERHEAD - Acceptable for enhanced features');
  } else {
    console.log('  ❌ HIGH OVERHEAD - May justify separate basic/intelligent tools');
  }
  
  console.log('\n💡 Recommendation:');
  if (overheadPercent < 25) {
    console.log('  Replace basic tools with intelligent versions - overhead is minimal');
  } else if (overheadPercent < 50) {
    console.log('  Offer both versions - let users choose based on needs');
  } else {
    console.log('  Keep separate basic and intelligent tools');
  }
}

// Run the test
performanceTest().catch(console.error);
