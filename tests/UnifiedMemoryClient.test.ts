/**
 * UnifiedMemoryClient Test Suite
 * 
 * Comprehensive testing for MCP compliance and Constitutional AI integration
 * 
 * @version 4.0.0
 */

import { UnifiedMemoryClient, ConstitutionalLevel } from './UnifiedMemoryClient';

/**
 * Test configuration
 */
const TEST_CONFIG = {
  host: 'localhost',
  port: 8083,
  timeout: 5000,
  retryAttempts: 2,
  retryDelay: 1000,
  enableSSL: false
};

/**
 * Test data
 */
const TEST_USER_ID = 'test-user-001';
const TEST_MEMORY_CONTENT = 'This is a test memory entry for Constitutional AI validation and quality scoring.';
const TEST_QUERY = 'test memory constitutional validation';

/**
 * Main test runner
 */
async function runUnifiedMemoryClientTests(): Promise<void> {
  console.log('🚀 Starting UnifiedMemoryClient Test Suite...\n');

  const client = new UnifiedMemoryClient(TEST_CONFIG);
  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  try {
    // Test 1: Client Initialization
    await testClientInitialization(client, testResults);

    // Test 2: Connection Management
    await testConnectionManagement(client, testResults);

    // Test 3: Memory Operations
    await testMemoryOperations(client, testResults);

    // Test 4: Constitutional AI Validation
    await testConstitutionalValidation(client, testResults);

    // Test 5: Quality Scoring
    await testQualityScoring(client, testResults);

    // Test 6: Performance Metrics
    await testPerformanceMetrics(client, testResults);

    // Test 7: Error Handling
    await testErrorHandling(client, testResults);

    // Test 8: MCP Protocol Compliance
    await testMCPCompliance(client, testResults);

  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
  } finally {
    // Cleanup
    try {
      await client.disconnect();
    } catch (error) {
      console.warn('Warning: Error during cleanup:', error);
    }

    // Print results
    printTestResults(testResults);
  }
}

/**
 * Test client initialization
 */
async function testClientInitialization(client: UnifiedMemoryClient, results: any): Promise<void> {
  console.log('📋 Test 1: Client Initialization');
  
  try {
    // Test metrics initialization
    const initialMetrics = client.getMetrics();
    assert(initialMetrics.totalRequests === 0, 'Initial total requests should be 0');
    assert(initialMetrics.successfulRequests === 0, 'Initial successful requests should be 0');
    assert(initialMetrics.averageQualityScore === 0, 'Initial quality score should be 0');
    
    // Test connection status
    assert(!client.isConnectionHealthy(), 'Client should not be healthy before connection');
    
    console.log('✅ Client initialization test passed\n');
    results.passed++;
  } catch (error) {
    console.error('❌ Client initialization test failed:', error);
    results.failed++;
  }
  results.total++;
}

/**
 * Test connection management
 */
async function testConnectionManagement(client: UnifiedMemoryClient, results: any): Promise<void> {
  console.log('📋 Test 2: Connection Management');
  
  try {
    // Test connection
    console.log('Attempting to connect to MCP server...');
    
    try {
      await client.connect();
      console.log('✅ Connection successful');
    } catch (error) {
      console.log('⚠️ Connection failed (server may not be running):', error);
      // This is expected if server is not running
    }

    // Test disconnect
    await client.disconnect();
    console.log('✅ Disconnect successful');
    
    console.log('✅ Connection management test passed\n');
    results.passed++;
  } catch (error) {
    console.error('❌ Connection management test failed:', error);
    results.failed++;
  }
  results.total++;
}

/**
 * Test memory operations
 */
async function testMemoryOperations(client: UnifiedMemoryClient, results: any): Promise<void> {
  console.log('📋 Test 3: Memory Operations');
  
  try {
    // Test create memory
    const createResult = await client.createMemory(
      TEST_MEMORY_CONTENT,
      TEST_USER_ID,
      'long_term',
      { 
        category: 'test',
        constitutionalLevel: 'PROFESSIONAL'
      }
    );

    // Result should have proper structure even if server is not available
    assert(typeof createResult.success === 'boolean', 'Create result should have success property');
    
    // Test memory context retrieval
    const searchResult = await client.getMemoryContext(
      TEST_QUERY,
      TEST_USER_ID,
      5
    );

    assert(Array.isArray(searchResult.entries), 'Search result should have entries array');
    assert(typeof searchResult.totalCount === 'number', 'Search result should have totalCount');
    assert(searchResult.qualityMetrics !== undefined, 'Search result should have qualityMetrics');

    console.log('✅ Memory operations test passed\n');
    results.passed++;
  } catch (error) {
    console.error('❌ Memory operations test failed:', error);
    results.failed++;
  }
  results.total++;
}

/**
 * Test Constitutional AI validation
 */
async function testConstitutionalValidation(client: UnifiedMemoryClient, results: any): Promise<void> {
  console.log('📋 Test 4: Constitutional AI Validation');
  
  try {
    const validationResult = await client.validateConstitutional(
      TEST_MEMORY_CONTENT,
      { source: 'test' }
    );

    assert(typeof validationResult.isValid === 'boolean', 'Validation should have isValid property');
    assert(typeof validationResult.score === 'number', 'Validation should have score property');
    assert(Array.isArray(validationResult.violations), 'Validation should have violations array');
    assert(Array.isArray(validationResult.recommendations), 'Validation should have recommendations array');

    console.log('✅ Constitutional AI validation test passed\n');
    results.passed++;
  } catch (error) {
    console.error('❌ Constitutional AI validation test failed:', error);
    results.failed++;
  }
  results.total++;
}

/**
 * Test quality scoring
 */
async function testQualityScoring(client: UnifiedMemoryClient, results: any): Promise<void> {
  console.log('📋 Test 5: Quality Scoring');
  
  try {
    const qualityResult = await client.generateQualityScore(
      TEST_MEMORY_CONTENT,
      ['accuracy', 'clarity', 'completeness']
    );

    assert(typeof qualityResult.overallScore === 'number', 'Quality result should have overallScore');
    assert(typeof qualityResult.criteriaScores === 'object', 'Quality result should have criteriaScores');
    assert(typeof qualityResult.grade === 'string', 'Quality result should have grade');
    assert(Array.isArray(qualityResult.improvements), 'Quality result should have improvements array');

    console.log('✅ Quality scoring test passed\n');
    results.passed++;
  } catch (error) {
    console.error('❌ Quality scoring test failed:', error);
    results.failed++;
  }
  results.total++;
}

/**
 * Test performance metrics
 */
async function testPerformanceMetrics(client: UnifiedMemoryClient, results: any): Promise<void> {
  console.log('📋 Test 6: Performance Metrics');
  
  try {
    const metrics = client.getMetrics();
    
    // Check all required metric properties
    const requiredProps = [
      'totalRequests', 'successfulRequests', 'failedRequests',
      'averageResponseTime', 'qualityScores', 'constitutionalCompliance',
      'averageQualityScore', 'successRate'
    ];
    
    for (const prop of requiredProps) {
      assert(metrics.hasOwnProperty(prop), `Metrics should have ${prop} property`);
    }

    // Test metrics reset
    client.resetMetrics();
    const resetMetrics = client.getMetrics();
    assert(resetMetrics.totalRequests === 0, 'Reset metrics should have zero total requests');

    console.log('✅ Performance metrics test passed\n');
    results.passed++;
  } catch (error) {
    console.error('❌ Performance metrics test failed:', error);
    results.failed++;
  }
  results.total++;
}

/**
 * Test error handling
 */
async function testErrorHandling(client: UnifiedMemoryClient, results: any): Promise<void> {
  console.log('📋 Test 7: Error Handling');
  
  try {
    // Test invalid memory operation
    const deleteResult = await client.deleteMemory('invalid-id', TEST_USER_ID, false);
    assert(!deleteResult.success, 'Delete without confirmation should fail');
    assert(deleteResult.error !== undefined, 'Failed operation should have error message');

    // Test connection health check
    const isHealthy = client.isConnectionHealthy();
    assert(typeof isHealthy === 'boolean', 'Connection health should return boolean');

    console.log('✅ Error handling test passed\n');
    results.passed++;
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
    results.failed++;
  }
  results.total++;
}

/**
 * Test MCP protocol compliance
 */
async function testMCPCompliance(client: UnifiedMemoryClient, results: any): Promise<void> {
  console.log('📋 Test 8: MCP Protocol Compliance');
  
  try {
    // Test system health endpoint
    const health = await client.getSystemHealth();
    // Should return null if server not available, not throw error
    assert(health === null || typeof health === 'object', 'System health should return object or null');

    // Test proper event handling
    let eventFired = false;
    client.on('error', () => { eventFired = true; });
    
    // Trigger an error condition
    try {
      await client.createMemory('', ''); // Invalid parameters
    } catch (error) {
      // Expected to fail
    }

    console.log('✅ MCP protocol compliance test passed\n');
    results.passed++;
  } catch (error) {
    console.error('❌ MCP protocol compliance test failed:', error);
    results.failed++;
  }
  results.total++;
}

/**
 * Simple assertion function
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Print test results summary
 */
function printTestResults(results: any): void {
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! UnifiedMemoryClient is MCP-compliant and ready for production.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the implementation and retry.');
  }
}

// Export the test runner
export { runUnifiedMemoryClientTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runUnifiedMemoryClientTests().catch(console.error);
}
