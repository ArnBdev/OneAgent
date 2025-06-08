#!/usr/bin/env node

/**
 * OneAgent MCP Integration Test
 * Tests VS Code MCP connection to OneAgent server
 */

const https = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const MCP_SERVER_URL = 'http://localhost:8081/mcp';
const VSCODE_MCP_CONFIG = path.join(__dirname, '..', '.vscode', 'mcp.json');

console.log('🧪 OneAgent MCP Integration Test');
console.log('=====================================');

// Test 1: Verify MCP server is running
async function testMcpServerHealth() {
  console.log('\n1. Testing MCP Server Health...');
  
  try {
    const response = await fetch('http://localhost:8081/api/health');
    const data = await response.json();
    
    if (data.status === 'healthy') {
      console.log('✅ OneAgent MCP Server is healthy');
      console.log(`   - Endpoint: ${data.mcp.endpoint}`);
      console.log(`   - Protocol: ${data.mcp.protocol}`);
      console.log(`   - Capabilities: ${data.mcp.capabilities.join(', ')}`);
      return true;
    }
  } catch (error) {
    console.log('❌ OneAgent MCP Server is not responding');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 2: Test MCP initialization
async function testMcpInitialization() {
  console.log('\n2. Testing MCP Initialization...');
  
  const initRequest = {
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      clientInfo: {
        name: 'VS Code Test Client',
        version: '1.0.0'
      },
      capabilities: {}
    },
    id: 1
  };

  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(initRequest)
    });

    const data = await response.json();
    
    if (data.result && data.result.serverInfo) {
      console.log('✅ MCP Initialization successful');
      console.log(`   - Server: ${data.result.serverInfo.name} v${data.result.serverInfo.version}`);
      console.log(`   - Protocol: ${data.result.protocolVersion}`);
      
      // Extract session ID from headers
      const sessionId = response.headers.get('Mcp-Session-Id');
      if (sessionId) {
        console.log(`   - Session ID: ${sessionId}`);
        return sessionId;
      }
      return true;
    }
  } catch (error) {
    console.log('❌ MCP Initialization failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 3: Test MCP tools listing
async function testMcpToolsListing(sessionId) {
  console.log('\n3. Testing MCP Tools Listing...');
  
  const toolsRequest = {
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 2
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (sessionId && typeof sessionId === 'string') {
    headers['Mcp-Session-Id'] = sessionId;
  }

  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(toolsRequest)
    });

    const data = await response.json();
    
    if (data.result && data.result.tools) {
      console.log('✅ MCP Tools listing successful');
      console.log(`   - Available tools: ${data.result.tools.length}`);
      
      data.result.tools.forEach(tool => {
        console.log(`     • ${tool.name}: ${tool.description}`);
      });
      
      return data.result.tools;
    }
  } catch (error) {
    console.log('❌ MCP Tools listing failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 4: Test tool invocation
async function testToolInvocation(sessionId) {
  console.log('\n4. Testing Tool Invocation...');
  
  const toolCallRequest = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'system_status',
      arguments: {}
    },
    id: 3
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (sessionId && typeof sessionId === 'string') {
    headers['Mcp-Session-Id'] = sessionId;
  }

  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(toolCallRequest)
    });

    const data = await response.json();
    
    if (data.result && data.result.content) {
      console.log('✅ Tool invocation successful');
      console.log('   - Tool response received');
      
      // Parse the JSON content from the tool
      const content = JSON.parse(data.result.content[0].text);
      console.log(`   - Total operations: ${content.performance.totalOperations}`);
      console.log(`   - Average latency: ${content.performance.averageLatency}ms`);
      console.log(`   - Total memories: ${content.memory.totalMemories}`);
      
      return true;
    }
  } catch (error) {
    console.log('❌ Tool invocation failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 5: Verify VS Code MCP configuration
function testVSCodeConfiguration() {
  console.log('\n5. Testing VS Code MCP Configuration...');
  
  if (!fs.existsSync(VSCODE_MCP_CONFIG)) {
    console.log('❌ VS Code MCP configuration not found');
    console.log(`   Expected: ${VSCODE_MCP_CONFIG}`);
    return false;
  }

  try {
    const config = JSON.parse(fs.readFileSync(VSCODE_MCP_CONFIG, 'utf8'));
    
    if (config.servers && config.servers.oneAgent) {
      console.log('✅ VS Code MCP configuration valid');
      console.log(`   - Server URL: ${config.servers.oneAgent.url}`);
      console.log(`   - Transport: ${config.servers.oneAgent.type}`);
      return true;
    } else {
      console.log('❌ OneAgent server not configured in VS Code MCP');
      return false;
    }
  } catch (error) {
    console.log('❌ Invalid VS Code MCP configuration');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting OneAgent MCP Integration Tests...\n');
  
  const results = {
    serverHealth: false,
    initialization: false,
    toolsListing: false,
    toolInvocation: false,
    vsCodeConfig: false
  };

  // Test server health
  results.serverHealth = await testMcpServerHealth();
  
  if (!results.serverHealth) {
    console.log('\n❌ Cannot proceed - MCP server is not running');
    console.log('   💡 Start server with: npm run server:mcp');
    return;
  }

  // Test MCP initialization
  const sessionId = await testMcpInitialization();
  results.initialization = !!sessionId;

  // Test tools listing
  if (results.initialization) {
    const tools = await testMcpToolsListing(sessionId);
    results.toolsListing = !!tools;

    // Test tool invocation
    if (results.toolsListing) {
      results.toolInvocation = await testToolInvocation(sessionId);
    }
  }

  // Test VS Code configuration
  results.vsCodeConfig = testVSCodeConfiguration();

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  
  const testNames = {
    serverHealth: 'MCP Server Health',
    initialization: 'MCP Initialization',
    toolsListing: 'Tools Listing',
    toolInvocation: 'Tool Invocation',
    vsCodeConfig: 'VS Code Configuration'
  };

  let passedTests = 0;
  const totalTests = Object.keys(results).length;

  Object.entries(results).forEach(([key, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testNames[key]}`);
    if (passed) passedTests++;
  });

  console.log(`\n🎯 Tests Passed: ${passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! OneAgent MCP integration is ready!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Open VS Code Command Palette (Ctrl+Shift+P)');
    console.log('   2. Run: "MCP: List Servers"');
    console.log('   3. Verify "oneAgent" server appears');
    console.log('   4. Switch to Copilot Chat Agent mode');
    console.log('   5. Test OneAgent tools in chat');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Global fetch polyfill for Node.js environments that don't have it
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run the tests
runTests().catch(console.error);
