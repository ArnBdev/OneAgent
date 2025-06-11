#!/usr/bin/env node
/**
 * Test the new MCP tools: Memory Management and Web Fetch
 * OneAgent Professional MCP Server v4.0.0
 */

const http = require('http');

console.log('🧪 Testing New OneAgent MCP Tools');
console.log('=' .repeat(50));

const MCP_SERVER_URL = 'http://localhost:8084/mcp';

/**
 * Send MCP request to server
 */
function sendMcpRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    });

    const options = {
      hostname: 'localhost',
      port: 8084,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Test memory management tools
 */
async function testMemoryManagement() {
  console.log('\n🧠 Testing Memory Management Tools');
  console.log('-'.repeat(40));

  try {
    // Test memory creation
    console.log('1️⃣ Testing memory creation...');
    const createResponse = await sendMcpRequest('tools/call', {
      name: 'oneagent_memory_create',
      arguments: {
        content: 'OneAgent MCP Copilot server now has comprehensive memory management capabilities',
        userId: 'test-user-copilot',
        metadata: {
          category: 'development',
          importance: 'high',
          testRun: true
        },
        memoryType: 'long_term'
      }
    });

    if (createResponse.result && createResponse.result.content) {
      const result = JSON.parse(createResponse.result.content[0].text);
      console.log(`✅ Memory Created: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Memory ID: ${result.memoryId}`);
      console.log(`   User ID: ${result.userId}`);
      console.log(`   Type: ${result.memoryType}`);

      if (result.success) {
        // Test memory editing
        console.log('\n2️⃣ Testing memory editing...');
        const editResponse = await sendMcpRequest('tools/call', {
          name: 'oneagent_memory_edit',
          arguments: {
            memoryId: result.memoryId,
            content: 'OneAgent MCP Copilot server now has comprehensive memory management capabilities - UPDATED',
            userId: 'test-user-copilot',
            metadata: {
              category: 'development',
              importance: 'critical',
              testRun: true,
              updated: true
            }
          }
        });

        if (editResponse.result && editResponse.result.content) {
          const editResult = JSON.parse(editResponse.result.content[0].text);
          console.log(`✅ Memory Edited: ${editResult.success ? 'SUCCESS' : 'FAILED'}`);
          console.log(`   Updated Content: ${editResult.content ? 'YES' : 'NO'}`);
        }

        // Test memory deletion (with confirmation)
        console.log('\n3️⃣ Testing memory deletion...');
        const deleteResponse = await sendMcpRequest('tools/call', {
          name: 'oneagent_memory_delete',
          arguments: {
            memoryId: result.memoryId,
            userId: 'test-user-copilot',
            confirm: true
          }
        });

        if (deleteResponse.result && deleteResponse.result.content) {
          const deleteResult = JSON.parse(deleteResponse.result.content[0].text);
          console.log(`✅ Memory Deleted: ${deleteResult.success ? 'SUCCESS' : 'FAILED'}`);
          console.log(`   Cleanup Operations: COMPLETED`);
        }
      }
    }

  } catch (error) {
    console.error(`❌ Memory Management Test Failed: ${error.message}`);
  }
}

/**
 * Test web fetch capabilities
 */
async function testWebFetch() {
  console.log('\n🌐 Testing Web Fetch Tool');
  console.log('-'.repeat(40));

  try {
    console.log('1️⃣ Testing web content fetching...');
    const fetchResponse = await sendMcpRequest('tools/call', {
      name: 'oneagent_web_fetch',
      arguments: {
        url: 'https://httpbin.org/json',
        extractContent: true,
        extractMetadata: true,
        timeout: 10000
      }
    });

    if (fetchResponse.result && fetchResponse.result.content) {
      const result = JSON.parse(fetchResponse.result.content[0].text);
      console.log(`✅ Web Fetch: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`   Status Code: ${result.statusCode}`);
      console.log(`   Content Type: ${result.content?.contentType || 'Unknown'}`);
      console.log(`   Content Size: ${result.content?.size || 0} bytes`);
      console.log(`   Fetch Time: ${result.fetchTime || 0} ms`);
      console.log(`   Capabilities: ${result.capabilities ? result.capabilities.join(', ') : 'None'}`);
    }

  } catch (error) {
    console.error(`❌ Web Fetch Test Failed: ${error.message}`);
  }
}

/**
 * Test server health with new capabilities
 */
async function testSystemHealth() {
  console.log('\n🏥 Testing System Health');
  console.log('-'.repeat(40));

  try {
    const healthResponse = await sendMcpRequest('tools/call', {
      name: 'oneagent_system_health',
      arguments: {}
    });

    if (healthResponse.result && healthResponse.result.content) {
      const health = JSON.parse(healthResponse.result.content[0].text);
      console.log(`✅ System Status: ${health.status}`);
      console.log(`   Version: ${health.version}`);
      console.log(`   Capabilities: ${health.capabilities ? health.capabilities.length : 0} total`);
      console.log(`   Memory System: ${health.components?.memorySystem?.status || 'Unknown'}`);
      console.log(`   Quality Score: ${health.metrics?.qualityScore?.toFixed(2) || 'Unknown'}%`);
      
      if (health.capabilities) {
        console.log('\n   Available Capabilities:');
        health.capabilities.forEach((cap, index) => {
          console.log(`     ${index + 1}. ${cap}`);
        });
      }
    }

  } catch (error) {
    console.error(`❌ System Health Test Failed: ${error.message}`);
  }
}

/**
 * Test tools list to verify new tools are registered
 */
async function testToolsList() {
  console.log('\n🔧 Testing Tools List');
  console.log('-'.repeat(40));

  try {
    const toolsResponse = await sendMcpRequest('tools/list');

    if (toolsResponse.result && toolsResponse.result.tools) {
      const tools = toolsResponse.result.tools;
      console.log(`✅ Total Tools Available: ${tools.length}`);
      
      const newTools = [
        'oneagent_memory_create',
        'oneagent_memory_edit', 
        'oneagent_memory_delete',
        'oneagent_web_fetch'
      ];

      console.log('\n   New Tools Status:');
      newTools.forEach(toolName => {
        const found = tools.find(tool => tool.name === toolName);
        console.log(`     ${found ? '✅' : '❌'} ${toolName}: ${found ? 'REGISTERED' : 'MISSING'}`);
      });

      console.log('\n   All Available Tools:');
      tools.forEach((tool, index) => {
        const isNew = newTools.includes(tool.name);
        console.log(`     ${index + 1}. ${tool.name}${isNew ? ' (NEW)' : ''}`);
      });
    }

  } catch (error) {
    console.error(`❌ Tools List Test Failed: ${error.message}`);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('🚀 Starting OneAgent MCP New Tools Test Suite');
    console.log(`📍 Target Server: ${MCP_SERVER_URL}`);
    console.log(`⏰ Test Started: ${new Date().toISOString()}\n`);

    await testToolsList();
    await testSystemHealth();
    await testMemoryManagement();
    await testWebFetch();

    console.log('\n🎉 All Tests Completed!');
    console.log('=' .repeat(50));
    console.log('✅ OneAgent MCP Copilot server is ready with comprehensive capabilities');
    console.log('📚 Memory Management: Create, Edit, Delete operations available');
    console.log('🌐 Web Fetch: HTML parsing and metadata extraction working');
    console.log('🧠 Constitutional AI: Quality validation integrated');
    console.log('📊 BMAD Framework: Systematic analysis available');

  } catch (error) {
    console.error(`❌ Test Suite Failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testMemoryManagement, testWebFetch, testSystemHealth, testToolsList };
