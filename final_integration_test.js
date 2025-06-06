// Final OneAgent Integration Test with IPv4
const axios = require('axios');

// Use IPv4 explicitly to avoid IPv6 connection issues
const BASE_URL = 'http://127.0.0.1:8000';

async function runIntegrationTest() {
  console.log('🧪 Final OneAgent Integration Test');
  console.log('=' .repeat(50));

  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server Status:', health.data.message);
    console.log('📊 Memory Count:', health.data.stats.total_memories);

    // Test 2: Add Memory (OneAgent format)
    console.log('\n2️⃣ Adding Memory...');
    const addMemory = await axios.post(`${BASE_URL}/v1/memories/`, {
      messages: "User prefers TypeScript over JavaScript for new projects",
      userId: "test-user-integration"
    });    console.log('✅ Memory Added:', addMemory.data.success);
    const memoryId = addMemory.data.data.id;

    // Test 3: Search Memory
    console.log('\n3️⃣ Searching Memory...');
    const searchResult = await axios.post(`${BASE_URL}/v1/memories/search`, {
      query: "programming language preferences",
      userId: "test-user-integration"
    });
    console.log('✅ Search Results:', searchResult.data.data.length, 'memories found');    // Test 4: Get All Memories for User
    console.log('\n4️⃣ Getting User Memories...');
    const userMemories = await axios.get(`${BASE_URL}/v1/memories/?userId=test-user-integration`);
    console.log('✅ User Memories:', userMemories.data.length, 'memories');
    console.error('\n❌ Test Failed:', error.message);
    console.log('✅ User Memories:', userMemories.data.length, 'memories');
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

runIntegrationTest();
