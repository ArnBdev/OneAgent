/**
 * Test script for OneAgent MCP Copilot Server
 * Verifies that the server can start and respond to basic MCP requests
 */

import { createServer } from 'http';

async function testMcpCopilotServer() {
  console.log('🧪 Testing OneAgent MCP Copilot Server...');
  
  try {
    // Import the server
    const app = await import('./coreagent/server/oneagent-mcp-copilot');
    console.log('✅ Server module imported successfully');
    
    // Create HTTP server
    const server = createServer(app.default);
    
    // Test server can bind to port
    const testPort = 8084;
    server.listen(testPort, () => {
      console.log(`✅ Server started on port ${testPort}`);
      
      // Test basic health check
      fetch(`http://localhost:${testPort}/health`)
        .then(response => response.json())
        .then(data => {
          console.log('✅ Health check successful:', data.status);
          console.log('✅ Server version:', data.version);
          console.log('✅ GitHub Copilot ready:', data.github_copilot_ready);
          
          // Test MCP capabilities
          const mcpRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list'
          };
          
          return fetch(`http://localhost:${testPort}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mcpRequest)
          });
        })
        .then(response => response.json())
        .then(data => {
          console.log('✅ MCP tools/list successful');
          console.log(`✅ Available tools: ${data.result?.tools?.length || 0}`);
          
          // List some key tools
          const tools = data.result?.tools || [];
          const keyTools = tools.filter((t: any) => 
            t.name.includes('constitutional') || 
            t.name.includes('bmad') || 
            t.name.includes('quality')
          );
          
          keyTools.forEach((tool: any) => {
            console.log(`   🔧 ${tool.name}: ${tool.description}`);
          });
          
          console.log('🎉 OneAgent MCP Copilot Server test completed successfully!');
          console.log('🚀 Ready for GitHub Copilot Agent Mode integration');
          
          server.close();
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ MCP request failed:', error);
          server.close();
          process.exit(1);
        });
    });
    
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMcpCopilotServer();
