/**
 * Embedding Dimension Benchmark
 *
 * Tests quality differences between 768 and 1536 dimensions
 * using real-world semantic similarity tasks.
 *
 * Run: npx ts-node scripts/benchmark-embedding-dimensions.ts
 */

import { EnhancedEmbeddingService } from '../coreagent/services/EnhancedEmbeddingService';
import type { EmbeddingDimension } from '../coreagent/services/EnhancedEmbeddingService';

interface BenchmarkResult {
  dimension: EmbeddingDimension;
  avgSimilarity: number;
  avgProcessingTime: number;
  storageSize: number; // bytes per embedding
}

const TEST_PAIRS = [
  {
    label: 'Programming concepts',
    text1: 'JavaScript is a dynamic programming language',
    text2: 'Python is a versatile scripting language',
    expectedSimilarity: 0.85, // Should be high
  },
  {
    label: 'Unrelated topics',
    text1: 'Machine learning transforms data science',
    text2: 'Pizza is a popular Italian food',
    expectedSimilarity: 0.2, // Should be low
  },
  {
    label: 'Near-duplicates',
    text1: 'The quick brown fox jumps over the lazy dog',
    text2: 'A fast brown fox leaps above the sleeping canine',
    expectedSimilarity: 0.9, // Should be very high
  },
  {
    label: 'Semantic equivalence',
    text1: 'OneAgent helps developers build AI systems',
    text2: 'Developers use OneAgent for creating artificial intelligence applications',
    expectedSimilarity: 0.85, // Should be high
  },
  {
    label: 'Technical vs. non-technical',
    text1: 'Neural networks process data through layers',
    text2: 'The weather today is sunny and warm',
    expectedSimilarity: 0.1, // Should be very low
  },
];

async function benchmarkDimension(dimension: EmbeddingDimension): Promise<BenchmarkResult> {
  const service = new EnhancedEmbeddingService();

  let totalSimilarity = 0;
  let totalTime = 0;
  let storageSize = 0;

  console.log(`\n📊 Benchmarking ${dimension} dimensions...`);

  for (const pair of TEST_PAIRS) {
    const start = Date.now();

    // Generate embeddings with semantic similarity task type
    const result1 = await service.generateEmbedding(pair.text1, {
      taskType: 'SEMANTIC_SIMILARITY',
      dimensions: dimension,
    });

    const result2 = await service.generateEmbedding(pair.text2, {
      taskType: 'SEMANTIC_SIMILARITY',
      dimensions: dimension,
    });

    const elapsed = Date.now() - start;

    // Compute cosine similarity
    const similarity = service.cosineSimilarity(result1.embedding, result2.embedding);

    totalSimilarity += similarity;
    totalTime += elapsed;
    storageSize = result1.embedding.length * 4; // 4 bytes per float32

    const accuracyDelta = Math.abs(similarity - pair.expectedSimilarity);
    const accuracyGrade = accuracyDelta < 0.1 ? '✅' : accuracyDelta < 0.2 ? '⚠️' : '❌';

    console.log(`  ${accuracyGrade} ${pair.label}`);
    console.log(
      `     Similarity: ${similarity.toFixed(4)} (expected: ${pair.expectedSimilarity.toFixed(2)}, Δ: ${accuracyDelta.toFixed(4)})`,
    );
    console.log(`     Time: ${elapsed}ms`);
  }

  return {
    dimension,
    avgSimilarity: totalSimilarity / TEST_PAIRS.length,
    avgProcessingTime: totalTime / TEST_PAIRS.length,
    storageSize,
  };
}

async function runBenchmark() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 OneAgent Embedding Dimension Quality Benchmark');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Testing semantic similarity accuracy across dimensions');
  console.log('Model: gemini-embedding-001 (Gemini)');
  console.log('Task Type: SEMANTIC_SIMILARITY');
  console.log('');

  const results: BenchmarkResult[] = [];

  // Benchmark 768 dimensions (OneAgent default)
  results.push(await benchmarkDimension(768));

  // Benchmark 1536 dimensions (higher quality)
  results.push(await benchmarkDimension(1536));

  // Optional: Benchmark 3072 dimensions (maximum quality)
  // results.push(await benchmarkDimension(3072));

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📈 Benchmark Summary');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('┌─────────────┬──────────────┬──────────────┬──────────────┐');
  console.log('│  Dimension  │ Avg Similar  │   Avg Time   │ Storage (KB) │');
  console.log('├─────────────┼──────────────┼──────────────┼──────────────┤');

  for (const result of results) {
    const storageMB = (result.storageSize / 1024).toFixed(2);
    console.log(
      `│    ${result.dimension.toString().padEnd(4)}     │   ${result.avgSimilarity.toFixed(4)}     │   ${result.avgProcessingTime.toFixed(0).padStart(4)}ms     │   ${storageMB.padStart(7)}  │`,
    );
  }

  console.log('└─────────────┴──────────────┴──────────────┴──────────────┘\n');

  // Calculate quality difference
  if (results.length >= 2) {
    const dim768 = results[0];
    const dim1536 = results[1];

    const qualityImprovement =
      ((dim1536.avgSimilarity - dim768.avgSimilarity) / dim768.avgSimilarity) * 100;
    const timeOverhead =
      ((dim1536.avgProcessingTime - dim768.avgProcessingTime) / dim768.avgProcessingTime) * 100;
    const storageIncrease = ((dim1536.storageSize - dim768.storageSize) / dim768.storageSize) * 100;

    console.log('🔍 Comparison: 1536 vs 768 dimensions\n');
    console.log(
      `   Quality Improvement: ${qualityImprovement >= 0 ? '+' : ''}${qualityImprovement.toFixed(2)}%`,
    );
    console.log(`   Time Overhead: ${timeOverhead >= 0 ? '+' : ''}${timeOverhead.toFixed(2)}%`);
    console.log(
      `   Storage Increase: ${storageIncrease >= 0 ? '+' : ''}${storageIncrease.toFixed(2)}%`,
    );
    console.log('');

    // Recommendation
    if (Math.abs(qualityImprovement) < 1) {
      console.log('💡 Recommendation: Stay with 768 dimensions');
      console.log('   → Quality difference is negligible (<1%)');
      console.log('   → Saves storage and processing time');
    } else if (qualityImprovement > 5) {
      console.log('💡 Recommendation: Consider upgrading to 1536 dimensions');
      console.log(`   → Significant quality improvement (+${qualityImprovement.toFixed(1)}%)`);
      console.log('   → Trade storage/time for better accuracy');
    } else {
      console.log('💡 Recommendation: 768 dimensions optimal for most use cases');
      console.log(`   → Modest quality improvement (+${qualityImprovement.toFixed(1)}%)`);
      console.log('   → Balanced cost/quality trade-off');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

// Run benchmark
runBenchmark().catch((error) => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});
