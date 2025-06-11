const axios = require('axios');

async function testMCPConnection() {
  console.log('🔗 Testing OneAgent MCP Connection...\n');
  
  try {
    // Test the health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://127.0.0.1:8082/api/health');
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('📋 MCP Info:', healthResponse.data.mcp);
    console.log('');

    // Test MCP initialize
    console.log('2. Testing MCP initialize...');
    const initResponse = await axios.post('http://127.0.0.1:8082/mcp', {
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      },
      id: 1
    });
    console.log('✅ MCP Initialize successful');
    console.log('🏷️  Server:', initResponse.data.result.serverInfo.name);
    console.log('📦 Version:', initResponse.data.result.serverInfo.version);
    console.log('');

    // Test tools list
    console.log('3. Testing tools list...');
    const toolsResponse = await axios.post('http://127.0.0.1:8082/mcp', {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 2
    });
    console.log('✅ Tools list successful');
    console.log('🔧 Available tools:', toolsResponse.data.result.tools.length);
    console.log('📝 Tool names:', toolsResponse.data.result.tools.map(t => t.name).join(', '));
    console.log('');

    console.log('🎉 OneAgent MCP Server is successfully connected and ready to use!');
    console.log('🔗 MCP Endpoint: http://localhost:8082/mcp');
    console.log('💡 Use the .vscode/mcp.json configuration in your MCP client');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.response) {
      console.error('📄 Response:', error.response.data);
    }
  }
}

testMCPConnection();
