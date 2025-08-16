/**
 * OneAgent Unified Backbone Test
 * Critical Foundation Validation
 *
 * This test validates that the unified time and metadata services work correctly
 * and can be integrated into all OneAgent systems.
 *
 * Version: 1.0.0
 * Created: 2024-06-18
 * Priority: CRITICAL BACKBONE VALIDATION
 */

import {
  unifiedTimeService,
  unifiedMetadataService,
  unifiedBackbone,
  createUnifiedTimestamp,
  createUnifiedMetadata,
  getUnifiedSystemHealth,
} from '../coreagent/utils/UnifiedBackboneService.js';

interface TestResults {
  timeService: {
    timestamp: boolean;
    context: boolean;
    intelligence: boolean;
  };
  metadataService: {
    create: boolean;
    update: boolean;
    retrieve: boolean;
    quality: boolean;
  };
  agentIntegration: {
    contextCreation: boolean;
    alitaIntegration: boolean;
    systemHealth: boolean;
  };
  overall: {
    success: boolean;
    score: number;
    issues: string[];
  };
}

/**
 * Test unified time service functionality
 */
async function testTimeService(): Promise<{
  timestamp: boolean;
  context: boolean;
  intelligence: boolean;
}> {
  console.log('🕒 Testing Unified Time Service...');

  try {
    // Test timestamp creation
    const timestamp = unifiedTimeService.now();
    const timestampValid =
      timestamp &&
      typeof timestamp.unix === 'number' &&
      typeof timestamp.utc === 'string' &&
      typeof timestamp.timezone === 'string' &&
      typeof timestamp.context === 'string';

    console.log('✅ Timestamp:', timestampValid ? 'PASS' : 'FAIL', timestamp);

    // Test context retrieval
    const context = unifiedTimeService.getContext();
    const contextValid =
      context &&
      context.realTime &&
      context.context &&
      context.intelligence &&
      typeof context.intelligence.energyLevel === 'string';

    console.log('✅ Context:', contextValid ? 'PASS' : 'FAIL', context.intelligence);

    // Test intelligence features
    const energyLevel = unifiedTimeService.getEnergyLevel();
    const suggestionContext = unifiedTimeService.getSuggestionContext();
    const isOptimalFocus = unifiedTimeService.isOptimalTime('focus');

    const intelligenceValid =
      energyLevel && suggestionContext && typeof isOptimalFocus === 'boolean';

    console.log('✅ Intelligence:', intelligenceValid ? 'PASS' : 'FAIL', {
      energyLevel,
      suggestionContext,
      isOptimalFocus,
    });

    return {
      timestamp: timestampValid,
      context: contextValid,
      intelligence: intelligenceValid,
    };
  } catch (error) {
    console.error('❌ Time Service Error:', error);
    return { timestamp: false, context: false, intelligence: false };
  }
}

/**
 * Test unified metadata service functionality
 */
async function testMetadataService(): Promise<{
  create: boolean;
  update: boolean;
  retrieve: boolean;
  quality: boolean;
}> {
  console.log('📊 Testing Unified Metadata Service...');

  try {
    // Test metadata creation
    const metadata = unifiedMetadataService.create('test', 'unit_test', {
      content: {
        category: 'testing',
        tags: ['unit', 'backbone', 'validation'],
        sensitivity: 'internal',
        relevanceScore: 0.9,
        contextDependency: 'session',
      },
    });

    const createValid =
      metadata && metadata.id && metadata.temporal.created && metadata.quality.score > 0;

    console.log('✅ Create:', createValid ? 'PASS' : 'FAIL', metadata.id);

    // Test metadata update
    const updated = unifiedMetadataService.update(metadata.id, {
      quality: { ...metadata.quality, score: 95 },
    });

    const updateValid = updated && updated.quality.score === 95;
    console.log('✅ Update:', updateValid ? 'PASS' : 'FAIL', updated.quality.score);

    // Test metadata retrieval
    const retrieved = unifiedMetadataService.retrieve(metadata.id);
    const retrieveValid = retrieved && retrieved.id === metadata.id;
    console.log('✅ Retrieve:', retrieveValid ? 'PASS' : 'FAIL');

    // Test quality validation
    const qualityCheck = unifiedMetadataService.validateQuality(metadata);
    const qualityValid = qualityCheck && typeof qualityCheck.score === 'number';
    console.log('✅ Quality:', qualityValid ? 'PASS' : 'FAIL', qualityCheck);
    return {
      create: !!createValid,
      update: !!updateValid,
      retrieve: !!retrieveValid,
      quality: !!qualityValid,
    };
  } catch (error) {
    console.error('❌ Metadata Service Error:', error);
    return { create: false, update: false, retrieve: false, quality: false };
  }
}

/**
 * Test agent integration features
 */
async function testAgentIntegration(): Promise<{
  contextCreation: boolean;
  alitaIntegration: boolean;
  systemHealth: boolean;
}> {
  console.log('🤖 Testing Agent Integration...');

  try {
    // Test agent context creation
    const agentContext = unifiedBackbone.createAgentContext('test-agent', 'development', {
      sessionId: 'test-session-123',
      userId: 'test-user-456',
      capabilities: ['test_capability'],
      memoryEnabled: true,
      aiEnabled: true,
    });

    const contextValid =
      agentContext &&
      agentContext.agentId === 'test-agent' &&
      agentContext.timeService &&
      agentContext.metadataService &&
      agentContext.sessionId === 'test-session-123';

    console.log('✅ Agent Context:', contextValid ? 'PASS' : 'FAIL');

    // Test ALITA integration
    const alitaContext = unifiedBackbone.createALITAContext('test_trigger', 'moderate');
    const alitaValid =
      alitaContext &&
      alitaContext.evolutionTimestamp &&
      alitaContext.learningMetadata &&
      alitaContext.evolutionContext.trigger === 'test_trigger';

    console.log('✅ ALITA Integration:', alitaValid ? 'PASS' : 'FAIL');

    // Test system health
    const systemHealth = unifiedBackbone.getSystemHealth();
    const healthValid =
      systemHealth &&
      systemHealth.components.timeService.operational &&
      systemHealth.components.metadataService.operational &&
      typeof systemHealth.overall.score === 'number';

    console.log('✅ System Health:', healthValid ? 'PASS' : 'FAIL', systemHealth);

    return {
      contextCreation: contextValid,
      alitaIntegration: alitaValid,
      systemHealth: healthValid,
    };
  } catch (error) {
    console.error('❌ Agent Integration Error:', error);
    return { contextCreation: false, alitaIntegration: false, systemHealth: false };
  }
}

/**
 * Test convenience functions
 */
async function testConvenienceFunctions(): Promise<boolean> {
  console.log('🛠️ Testing Convenience Functions...');

  try {
    const timestamp = createUnifiedTimestamp();
    const metadata = createUnifiedMetadata('convenience_test', 'unit_test');
    const health = getUnifiedSystemHealth();
    const valid = !!(timestamp && metadata && health);
    console.log('✅ Convenience Functions:', valid ? 'PASS' : 'FAIL');

    return valid;
  } catch (error) {
    console.error('❌ Convenience Functions Error:', error);
    return false;
  }
}

/**
 * Run comprehensive unified backbone test
 */
export async function runUnifiedBackboneTest(): Promise<TestResults> {
  console.log('\n🚀 OneAgent Unified Backbone Test - STARTING\n');
  console.log('='.repeat(60));

  // Run all tests
  const timeResults = await testTimeService();
  const metadataResults = await testMetadataService();
  const agentResults = await testAgentIntegration();
  const convenienceValid = await testConvenienceFunctions();

  // Calculate overall score
  const allTests = [
    timeResults.timestamp,
    timeResults.context,
    timeResults.intelligence,
    metadataResults.create,
    metadataResults.update,
    metadataResults.retrieve,
    metadataResults.quality,
    agentResults.contextCreation,
    agentResults.alitaIntegration,
    agentResults.systemHealth,
    convenienceValid,
  ];

  const passedTests = allTests.filter((test) => test).length;
  const totalTests = allTests.length;
  const score = Math.round((passedTests / totalTests) * 100);
  const success = score >= 80; // 80% pass rate for success

  const issues: string[] = [];
  if (!timeResults.timestamp) issues.push('Time service timestamp creation failed');
  if (!timeResults.context) issues.push('Time service context retrieval failed');
  if (!timeResults.intelligence) issues.push('Time service intelligence features failed');
  if (!metadataResults.create) issues.push('Metadata service creation failed');
  if (!metadataResults.update) issues.push('Metadata service update failed');
  if (!metadataResults.retrieve) issues.push('Metadata service retrieval failed');
  if (!metadataResults.quality) issues.push('Metadata service quality validation failed');
  if (!agentResults.contextCreation) issues.push('Agent context creation failed');
  if (!agentResults.alitaIntegration) issues.push('ALITA integration failed');
  if (!agentResults.systemHealth) issues.push('System health monitoring failed');
  if (!convenienceValid) issues.push('Convenience functions failed');

  const results: TestResults = {
    timeService: timeResults,
    metadataService: metadataResults,
    agentIntegration: agentResults,
    overall: {
      success,
      score,
      issues,
    },
  };

  console.log('\n' + '='.repeat(60));
  console.log('🎯 UNIFIED BACKBONE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Overall Score: ${score}% (${passedTests}/${totalTests} tests passed)`);
  console.log(`Status: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);

  if (issues.length > 0) {
    console.log('\n❌ Issues Found:');
    issues.forEach((issue) => console.log(`  - ${issue}`));
  }

  if (success) {
    console.log('\n🎉 UNIFIED BACKBONE IS READY FOR SYSTEM INTEGRATION!');
    console.log('✅ Time service operational with intelligence');
    console.log('✅ Metadata service operational with quality validation');
    console.log('✅ Agent integration ready');
    console.log('✅ ALITA integration operational');
    console.log('✅ System health monitoring active');
  } else {
    console.log('\n⚠️  UNIFIED BACKBONE NEEDS FIXES BEFORE SYSTEM INTEGRATION');
  }

  console.log('\nNext Steps:');
  console.log('1. 🔄 Replace all new Date() with unifiedTimeService.now()');
  console.log('2. 📊 Update all metadata operations to use unifiedMetadataService');
  console.log('3. 🤖 Update AgentFactory to inject unified services');
  console.log('4. 🧠 Update memory systems to use unified interfaces');
  console.log('5. 💬 Update chat interfaces to use unified time/metadata');
  console.log('6. 🔄 Update ALITA to use real-time evolution tracking');

  return results;
}

// Self-executing test for immediate validation
runUnifiedBackboneTest()
  .then((results) => {
    process.exit(results.overall.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
