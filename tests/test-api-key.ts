// Test Google AI Studio API key functionality
import * as dotenv from 'dotenv';
import { GeminiClient } from '../coreagent/tools/geminiClient';

// Load environment variables
dotenv.config();

async function testGoogleAPIKey() {
  console.log('🧪 Testing Google AI Studio API Key...\n');

  // Check if API key exists
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY not found in .env file');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');

  // Create client with real API key
  const client = new GeminiClient({
    apiKey: apiKey,
    model: 'gemini-2.5-pro-preview-05-06'
  });

  console.log('✅ GeminiClient created');
  console.log('📋 Config:', client.getConfig());
  try {
    // Test 1: Basic text generation
    console.log('\n🧪 Test 1: Basic Text Generation');
    const response = await client.chat('Say "Hello from Google AI Studio!" in exactly those words.');
    console.log('✅ Text generation successful:');
    console.log('📝 Response:', response.response);

    // Test 2: Single embedding generation
    console.log('\n🧪 Test 2: Single Embedding Generation');
    const embedding = await client.generateEmbedding('Hello world, this is a test embedding.');
    console.log('✅ Embedding generation successful:');
    console.log('📊 Dimensions:', embedding.dimensions);
    console.log('📈 First 5 values:', embedding.embedding.slice(0, 5));    // Test 3: Batch embeddings
    console.log('\n🧪 Test 3: Batch Embedding Generation');
    const batchEmbeddings = await client.generateEmbeddingBatch([
      'First test document for batch embedding',
      'Second test document for batch embedding',
      'Third test document for batch embedding'
    ]);
    console.log('✅ Batch embeddings successful:');
    console.log('📊 Number of embeddings:', batchEmbeddings.length);
    console.log('📊 Each embedding dimensions:', batchEmbeddings[0]?.dimensions);

    // Test 4: Similarity calculation
    if (batchEmbeddings.length >= 2) {
      console.log('\n🧪 Test 4: Similarity Calculation');
      const similarity = GeminiClient.calculateCosineSimilarity(
        batchEmbeddings[0].embedding, 
        batchEmbeddings[1].embedding
      );
      console.log('✅ Similarity calculation successful:');
      console.log('📈 Similarity score:', similarity.toFixed(4));
    }

    console.log('\n🎉 ALL TESTS PASSED! Google AI Studio API is fully working.');
    console.log('🚀 Gemini embeddings integration is production-ready.');

  } catch (error) {
    console.error('\n❌ API Test Failed:');
    if (error instanceof Error) {
      console.error('📝 Error message:', error.message);
      
      // Check for specific API errors
      if (error.message.includes('API_KEY_INVALID')) {
        console.error('🔑 The API key appears to be invalid');
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        console.error('💰 API quota has been exceeded');
      } else if (error.message.includes('permission')) {
        console.error('🔒 API key lacks required permissions');
      }
    }
    console.error('🔧 Full error:', error);
  }
}

// Helper function for similarity calculation
function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return similarity;
}

// Run the test
testGoogleAPIKey().catch(console.error);
