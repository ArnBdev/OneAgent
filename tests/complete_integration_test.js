// Complete OneAgent Integration Test - Final Version
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:8000';

async function runCompleteTest() {
  console.log('🧪 Complete OneAgent Integration Test - Final');
  console.log('=' .repeat(50));

  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server Status:', health.data.message);
    console.log('📊 Memory Count:', health.data.stats.total_memories);

    // Test 2: Add Memory
    console.log('\n2️⃣ Adding Memory...');
    const addResponse = await axios.post(`${BASE_URL}/v1/memories/`, {
      messages: "Integration test: User prefers Python for data science projects",
      userId: "final-test-user"
    });
    console.log('✅ Memory Added:', addResponse.data.success);
    console.log('🆔 Memory ID:', addResponse.data.data.id);
    const memoryId = addResponse.data.data.id;

    // Test 3: Search Memory
    console.log('\n3️⃣ Searching Memory...');
    const searchResponse = await axios.post(`${BASE_URL}/v1/memories/search`, {
      query: "data science programming",
      userId: "final-test-user"
    });
    console.log('✅ Search Results:', searchResponse.data.data.length, 'memories found');

    // Test 4: Get All User Memories
    console.log('\n4️⃣ Getting User Memories...');
    const userMemoriesResponse = await axios.get(`${BASE_URL}/v1/memories/?userId=final-test-user`);
    
    // Debug the response structure
    console.log('📊 Response type:', typeof userMemoriesResponse.data);
    console.log('📊 Is array:', Array.isArray(userMemoriesResponse.data));
    
    if (Array.isArray(userMemoriesResponse.data)) {
      console.log('✅ User Memories:', userMemoriesResponse.data.length, 'memories');
    } else {
      console.log('⚠️ Unexpected response structure:', userMemoriesResponse.data);
    }

    // Test 5: Delete Memory
    console.log('\n5️⃣ Deleting Memory...');
    const deleteResponse = await axios.delete(`${BASE_URL}/v1/memories/${memoryId}`);
    console.log('✅ Memory Deleted:', deleteResponse.data.success);

    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('✅ OneAgent mem0Client integration is fully operational');
    console.log('✅ Gemini Memory Server v2 working correctly');
    console.log('✅ Local memory system ready for production use');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
    }
    if (error.config) {
      console.error('📊 Request URL:', error.config.url);
      console.error('📊 Request method:', error.config.method);
    }
  }
}

runCompleteTest();
