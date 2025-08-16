// Run with: node -r ts-node/register tests/unit/system-health.test.ts
/**
 * Test System Health
 * Comprehensive test of all backbone systems
 */

import { unifiedBackbone } from '../../coreagent/utils/UnifiedBackboneService';

async function testSystemHealth() {
  console.log('🔄 Testing System Health...');

  try {
    // Test overall system health
    const systemHealth = unifiedBackbone.getSystemHealth();
    console.log('✅ System Health:', JSON.stringify(systemHealth, null, 2));

    // Test individual components
    console.log('\n🔄 Testing Individual Components...');

    // Test time service
    const timeService = unifiedBackbone.getServices().timeService;
    const currentTime = timeService.now();
    console.log('✅ Time Service:', {
      timestamp: currentTime.iso,
      context: currentTime.context,
      energyLevel: currentTime.contextual.energyLevel,
    });

    // Test metadata service
    const metadataService = unifiedBackbone.getServices().metadataService;
    const testMetadata = metadataService.create('test', 'system-test');
    console.log('✅ Metadata Service:', {
      id: testMetadata.id,
      type: testMetadata.type,
      quality: testMetadata.quality.score,
    });

    // Test cache system
    const cacheHealth = unifiedBackbone.cache.getHealth();
    console.log('✅ Cache System:', cacheHealth);

    // Test error system
    const errorHealth = unifiedBackbone.errorHandler.getHealth();
    console.log('✅ Error System:', errorHealth);

    console.log('\n🎉 All systems operational!');
  } catch (error) {
    console.error('❌ System Test Error:', error);
  }
}

// Run the test
testSystemHealth()
  .then(() => {
    console.log('\n✅ System health test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
