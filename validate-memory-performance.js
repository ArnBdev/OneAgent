
/**
 * Memory Performance Validation Script
 * Checks if the memory system performance fixes are working
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function validateMemoryPerformance() {
  console.log('🔍 Validating Memory System Performance...');
  console.log('==========================================');
  
  try {
    // Check server health
    const { stdout } = await execAsync('curl -s http://localhost:8083/health');
    const health = JSON.parse(stdout);
    
    console.log('📈 System Status:', health.status);
    console.log('📊 Quality Score:', health.qualityScore || 'N/A');
    
    // Test memory system tool
    const testBody = JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "oneagent_system_health",
        arguments: {}
      },
      id: 1
    });
    
    const { stdout: mcpResponse } = await execAsync(`curl -s -X POST -H "Content-Type: application/json" -d '${testBody}' http://localhost:8083/mcp`);
    const mcpResult = JSON.parse(mcpResponse);
    
    if (mcpResult.result && mcpResult.result.content && mcpResult.result.content[0]) {
      const systemHealth = JSON.parse(mcpResult.result.content[0].text);
      const memorySystem = systemHealth.components?.memorySystem;
      
      console.log('\n🧠 Memory System Status:');
      console.log('   Connection:', memorySystem?.connectionStatus || 'unknown');
      console.log('   Performance:', memorySystem?.performance || 'unknown');
      console.log('   Port:', memorySystem?.port || 'unknown');
      
      if (memorySystem?.performance === 'optimal') {
        console.log('\n✅ SUCCESS: Memory system performance is now OPTIMAL!');
        return true;
      } else if (memorySystem?.performance === 'degraded') {
        console.log('\n⚠️ STILL DEGRADED: Performance fixes may need more time to take effect');
        console.log('💡 Recommendation: Wait 2-3 minutes and run validation again');
        return false;
      } else {
        console.log('\n❓ UNKNOWN: Memory system status unclear');
        return false;
      }
    } else {
      console.log('\n❌ Failed to get memory system status from MCP tools');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Ensure OneAgent MCP server is running on port 8083');
    console.log('2. Check if memory performance fixes were applied correctly');
    console.log('3. Try restarting the server with: .\\restart-optimized-server.ps1');
    return false;
  }
}

if (require.main === module) {
  validateMemoryPerformance().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { validateMemoryPerformance };
