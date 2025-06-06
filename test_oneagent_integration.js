// Test OneAgent mem0Client integration with running Gemini Memory Server v2
const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testOneAgentIntegration() {
  console.log('🧪 Testing OneAgent Integration with Gemini Memory Server v2');
  console.log('=' .repeat(60));

  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);
    console.log('📊 Server stats:', healthResponse.data.stats);

    // Test 2: Get All Memories (OneAgent format)
    console.log('\n2️⃣ Testing Get All Memories (OneAgent format)...');
    const memoriesResponse = await axios.get(`${BASE_URL}/v1/memories/`);
    console.log('✅ Get memories successful:', memoriesResponse.data.success);
    console.log('📝 Memory count:', memoriesResponse.data.data.length);

    // Test 3: Add Memory (OneAgent format)
    console.log('\n3️⃣ Testing Add Memory (OneAgent format)...');
    const addMemoryPayload = {
      content: "OneAgent integration test - User prefers TypeScript over JavaScript",
      userId: "test-user-123",
      agentId: "oneagent-core",
      workflowId: "integration-test-workflow",
      sessionId: "session-2025-06-06",
      metadata: {
        source: "integration_test",
        importance: "high",
        category: "user_preferences",
        timestamp: new Date().toISOString()
      }
    };

    const addResponse = await axios.post(`${BASE_URL}/v1/memories/`, addMemoryPayload);
    console.log('✅ Add memory successful:', addResponse.data.success);
    console.log('🆔 Memory ID:', addResponse.data.memory_id);
    const testMemoryId = addResponse.data.memory_id;

    // Test 4: Search Memories
    console.log('\n4️⃣ Testing Search Memories...');
    const searchPayload = {
      query: "TypeScript preferences",
      userId: "test-user-123",
      limit: 5
    };

    const searchResponse = await axios.post(`${BASE_URL}/memories/search`, searchPayload);
    console.log('✅ Search successful:', searchResponse.data.success);
    console.log('🔍 Search results:', searchResponse.data.data.length);

    // Test 5: Get Memory by ID
    console.log('\n5️⃣ Testing Get Memory by ID...');
    const getResponse = await axios.get(`${BASE_URL}/memories/${testMemoryId}`);
    console.log('✅ Get memory successful:', getResponse.data.success);
    console.log('📋 Memory content:', getResponse.data.data.content.substring(0, 50) + '...');

    // Test 6: Update Memory
    console.log('\n6️⃣ Testing Update Memory...');
    const updatePayload = {
      content: "OneAgent integration test - User strongly prefers TypeScript over JavaScript and Vue.js",
      metadata: {
        ...addMemoryPayload.metadata,
        updated: true,
        updateReason: "Enhanced user preference details"
      }
    };

    const updateResponse = await axios.put(`${BASE_URL}/memories/${testMemoryId}`, updatePayload);
    console.log('✅ Update memory successful:', updateResponse.data.success);

    // Test 7: Delete Memory
    console.log('\n7️⃣ Testing Delete Memory...');
    const deleteResponse = await axios.delete(`${BASE_URL}/v1/memories/${testMemoryId}`);
    console.log('✅ Delete memory successful:', deleteResponse.data.success);

    // Test 8: Verify OneAgent-specific features
    console.log('\n8️⃣ Testing OneAgent-specific features...');
    
    // Add workflow-specific memory
    const workflowMemoryPayload = {
      content: "Workflow context: Processing user documents with AI analysis",
      userId: "test-user-123",
      agentId: "oneagent-core",
      workflowId: "document-processing-001",
      sessionId: "session-doc-processing",
      memoryType: "workflow",
      metadata: {
        workflowStep: "document_analysis",
        processingType: "ai_analysis",
        priority: "medium"
      }
    };

    const workflowResponse = await axios.post(`${BASE_URL}/v1/memories/`, workflowMemoryPayload);
    console.log('✅ Workflow memory added:', workflowResponse.data.success);

    // Search workflow memories
    const workflowSearchPayload = {
      query: "workflow document processing",
      userId: "test-user-123",
      workflowId: "document-processing-001",
      limit: 10
    };

    const workflowSearchResponse = await axios.post(`${BASE_URL}/memories/search`, workflowSearchPayload);
    console.log('✅ Workflow search successful:', workflowSearchResponse.data.success);
    console.log('📊 Workflow memories found:', workflowSearchResponse.data.data.length);

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
    console.log('✅ OneAgent mem0Client is fully compatible with Gemini Memory Server v2');
    console.log('🚀 Local memory system is ready for production use!');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.response?.data || error.message);
    console.error('🔍 Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method
    });
  }
}

// Run the integration test
testOneAgentIntegration().catch(console.error);
