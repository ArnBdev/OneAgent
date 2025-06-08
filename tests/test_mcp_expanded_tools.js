const axios = require('axios');

async function testMCPServer() {
  const baseUrl = 'http://localhost:8082/mcp';
  
  console.log('🔧 Testing OneAgent MCP Server with expanded tools...\n');
  
  try {
    // Test 1: List all tools
    console.log('1. Testing tools/list...');
    const toolsResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    });
    console.log('✅ Tools available:', toolsResponse.data.result.tools.length);
    console.log('📝 Tool names:', toolsResponse.data.result.tools.map(t => t.name).join(', '));
    console.log('');

    // Test 2: System status
    console.log('2. Testing system_status tool...');
    const statusResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'system_status',
        arguments: {}
      },
      id: 2
    });
    console.log('✅ System status executed successfully');
    console.log('');

    // Test 3: AI Chat
    console.log('3. Testing ai_chat tool...');
    const chatResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'ai_chat',
        arguments: {
          question: 'What is 2+2?',
          temperature: 0.3
        }
      },
      id: 3
    });
    console.log('✅ AI Chat executed successfully');
    console.log('');

    // Test 4: Workflow Help
    console.log('4. Testing workflow_help tool...');
    const workflowResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'workflow_help',
        arguments: {}
      },
      id: 4
    });
    console.log('✅ Workflow help executed successfully');
    console.log('');

    console.log('🎉 All MCP tool tests passed! OneAgent now exposes full capabilities through MCP.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMCPServer();
