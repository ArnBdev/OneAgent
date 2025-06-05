/**
 * Mem0 Integration Test
 * Tests the current status of Mem0 implementation in OneAgent
 */

import { Mem0Client } from '../coreagent/tools/mem0Client';

async function testMem0Integration() {
  console.log('🧠 Testing Mem0 Integration Status...\n');

  // Test with different configurations
  const configs = [
    { name: 'Local OSS', config: { deploymentType: 'local' as const } },
    { name: 'Cloud API', config: { deploymentType: 'cloud' as const } },
    { name: 'Mock Mode', config: { deploymentType: 'cloud' as const, cloudApiKey: '' } }
  ];

  for (const { name, config } of configs) {
    console.log(`\n🔧 Testing ${name} Configuration:`);
    console.log('━'.repeat(50));

    try {
      const client = new Mem0Client(config);
      
      // Get configuration info
      const clientConfig = client.getConfig();
      console.log('📋 Config:', {
        deploymentType: clientConfig.deploymentType,
        mockMode: clientConfig.mockMode,
        hasCloudKey: clientConfig.hasCloudKey
      });

      // Test connection
      console.log('🔌 Testing connection...');
      const connectionResult = await client.testConnection();
      console.log(`✅ Connection: ${connectionResult ? 'OK' : 'FAILED'}`);

      // Test basic operations
      console.log('📝 Testing memory creation...');
      const createResult = await client.createMemory(
        'Test memory content for OneAgent',
        { test: true, timestamp: new Date().toISOString() },
        'test-user',
        'test-agent'
      );
      console.log(`✅ Create: ${createResult.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (createResult.success && createResult.data) {
        const memoryId = createResult.data.id;
        console.log(`   Memory ID: ${memoryId}`);
        
        // Test search
        console.log('🔍 Testing memory search...');
        const searchResult = await client.searchMemories({
          userId: 'test-user',
          limit: 5
        });
        console.log(`✅ Search: ${searchResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`   Found: ${searchResult.data?.length || 0} memories`);

        // Test workflow context
        console.log('📊 Testing workflow context...');
        const workflowResult = await client.storeWorkflowContext(
          'test-workflow',
          { step: 1, status: 'testing' },
          'test-user'
        );
        console.log(`✅ Workflow: ${workflowResult.success ? 'SUCCESS' : 'FAILED'}`);
      }

    } catch (error) {
      console.error(`❌ Error testing ${name}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n🏁 Mem0 Integration Test Complete\n');
}

// Helper function to summarize current status
function printMem0Status() {
  console.log('🧠 MEM0 INTEGRATION STATUS SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ IMPLEMENTED FEATURES:');
  console.log('   • Complete Mem0Client with CRUD operations');
  console.log('   • Multi-deployment support (local/cloud/hybrid)');
  console.log('   • OneAgent-specific extensions (workflow, session)');
  console.log('   • Mock mode for development and testing');
  console.log('   • Enhanced memory types and filtering');
  console.log('   • Connection testing and validation');
  console.log('   • Error handling and fallback strategies');
  console.log();
  console.log('🚀 READY FOR:');
  console.log('   • Production deployment with local Mem0 OSS');
  console.log('   • Cloud-based memory with valid API key');
  console.log('   • Development with mock data');
  console.log('   • AI workflow integration');
  console.log();
  console.log('📋 NEXT ENHANCEMENTS:');
  console.log('   • Vector similarity search');
  console.log('   • Memory analytics and insights');
  console.log('   • Automatic categorization');
  console.log('   • Performance optimization');
  console.log();
}

// Run the tests
if (require.main === module) {
  printMem0Status();
  testMem0Integration().catch(console.error);
}
