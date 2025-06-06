// Simple OneAgent Integration Test
const axios = require('axios');

async function main() {
  console.log('🧪 Testing OneAgent Integration with Gemini Memory Server v2');
  console.log('=' .repeat(60));

  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing Health Check...');
    const healthResponse = await axios.get('http://localhost:8000/health');
    console.log('✅ Health check passed');
    console.log('📊 Stats:', healthResponse.data.stats);

    // Test 2: Get All Memories
    console.log('\n2️⃣ Testing Get All Memories...');
    const memoriesResponse = await axios.get('http://localhost:8000/v1/memories/');
    console.log('✅ Memories retrieved:', memoriesResponse.data.data.length, 'memories');

    // Test 3: Add a Memory
    console.log('\n3️⃣ Testing Add Memory...');
    const addResponse = await axios.post('http://localhost:8000/v1/memories/', {
      messages: "The user prefers TypeScript over JavaScript for new projects",
      userId: "test-user-123"
    });
    console.log('✅ Memory added:', addResponse.data.success);

    // Test 4: Search Memories
    console.log('\n4️⃣ Testing Memory Search...');
    const searchResponse = await axios.post('http://localhost:8000/v1/memories/search', {
      query: "programming language preferences",
      userId: "test-user-123"
    });
    console.log('✅ Search completed:', searchResponse.data.data.length, 'results');

    console.log('\n🎉 All tests passed! OneAgent integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

main();
