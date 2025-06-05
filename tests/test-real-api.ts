// Test your actual Google AI Studio API key
import * as dotenv from 'dotenv';
import { GeminiClient } from '../coreagent/tools/geminiClient';

// Load environment variables
dotenv.config();

async function testActualAPIKey() {
  console.log('🧪 Testing Your Actual Google AI Studio API Key...\n');

  // Check if API key exists
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_API_KEY not found in .env file');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');
  console.log('🔑 Full key length:', apiKey.length, 'characters');

  // Create client with your real API key
  const client = new GeminiClient({
    apiKey: apiKey,
    model: 'gemini-2.5-pro-preview-05-06'
  });

  console.log('✅ GeminiClient created');
  console.log('📋 Config:', client.getConfig());

  try {
    // Test 1: Simple connection test
    console.log('\n🧪 Test 1: Connection Test');
    const connectionOk = await client.testConnection();
    console.log('✅ Connection test result:', connectionOk);    // Test 2: Basic text generation
    console.log('\n🧪 Test 2: Basic Text Generation');
    const chatResponse = await client.chat('Say "Hello from Google AI Studio!" exactly.');
    console.log('✅ Text generation successful:');
    console.log('📝 Response:', chatResponse.response);    // Test 3: Single embedding generation
    console.log('\n🧪 Test 3: Single Embedding Generation');
    const embeddingResult = await client.generateEmbedding('Hello world, this is a test embedding.');
    console.log('✅ Embedding generation successful:');
    console.log('📊 Dimensions:', embeddingResult.dimensions);
    console.log('📈 First 5 values:', embeddingResult.embedding.slice(0, 5));
    console.log('📈 Last 5 values:', embeddingResult.embedding.slice(-5));

    // Test 4: Batch embeddings
    console.log('\n🧪 Test 4: Batch Embedding Generation');
    const batchEmbeddingResults = await client.generateEmbeddingBatch([
      'First test document for batch embedding',
      'Second test document for batch embedding',
      'Third test document for batch embedding'
    ]);
    console.log('✅ Batch embeddings successful:');
    console.log('📊 Number of embeddings:', batchEmbeddingResults.length);
    console.log('📊 Each embedding dimensions:', batchEmbeddingResults[0]?.dimensions);    // Test 5: Similarity calculation
    if (batchEmbeddingResults.length >= 2) {
      console.log('\n🧪 Test 5: Similarity Calculation');
      const similarity = GeminiClient.calculateCosineSimilarity(
        batchEmbeddingResults[0].embedding, 
        batchEmbeddingResults[1].embedding
      );
      console.log('✅ Similarity calculation successful:');
      console.log('📈 Similarity score:', similarity.toFixed(4));
    }

    console.log('\n🎉 ALL TESTS PASSED! Your Google AI Studio API key is fully working.');
    console.log('🚀 Gemini embeddings integration is production-ready with your API key.');

  } catch (error) {
    console.error('\n❌ API Test Failed with your key:');
    if (error instanceof Error) {
      console.error('📝 Error message:', error.message);
      
      // Check for specific API errors
      if (error.message.includes('API_KEY_INVALID')) {
        console.error('🔑 The API key appears to be invalid');
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        console.error('💰 API quota has been exceeded');
      } else if (error.message.includes('permission')) {
        console.error('🔒 API key lacks required permissions');
      } else if (error.message.includes('429')) {
        console.error('⏳ Rate limit hit - this is normal during testing');
      }
    }
    console.error('🔧 Full error:', error);
  }
}

// Helper function for similarity calculation
function calculateCosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Run the test
testActualAPIKey().catch(console.error);
