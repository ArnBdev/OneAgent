/**
 * Quick Integration Test for Revolutionary Prompt Engineering
 * 
 * This is a simplified test to validate basic functionality of our enhanced system
 */

// Test the enhanced agent factory without running full test suite
async function quickTest() {
  try {
    console.log('🧪 Quick Revolutionary Prompt Engineering Test\n');

    // Dynamic import for testing
    const { AgentFactory } = await import('../coreagent/agents/base/AgentFactory');
    const { AgentRegistry } = await import('../coreagent/orchestrator/agentRegistry');

    // Test 1: Create Enhanced Development Agent
    console.log('1. Testing Enhanced Development Agent Creation...');
    const enhancedAgent = await AgentFactory.createAgent({
      type: 'enhanced-development',
      id: 'quick-test-enhanced',
      name: 'QuickTestEnhanced',
      description: 'Quick test enhanced agent'
    });
    console.log(`   ✅ Enhanced Agent Created: ${enhancedAgent.getName()}`);
    console.log(`   📊 Capabilities: ${enhancedAgent.config.capabilities.slice(0, 3).join(', ')}...`);

    // Test 2: Registry Integration
    console.log('\n2. Testing Registry Integration...');
    const registry = new AgentRegistry();
    await registry.registerAgent(enhancedAgent);
    console.log(`   ✅ Agent Registered Successfully`);
    console.log(`   📊 Registry Agent Count: ${registry.getAgentCount()}`);

    // Test 3: Agent Matching
    console.log('\n3. Testing Enhanced Agent Matching...');
    const testRequest = "I need revolutionary prompt engineering for my development task";
    const matchedAgent = await registry.findBestAgent(testRequest);
    const matchedCorrectly = matchedAgent?.id === enhancedAgent.id;
    console.log(`   ${matchedCorrectly ? '✅' : '❌'} Agent Matching: ${matchedCorrectly ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   📊 Matched Agent: ${matchedAgent?.getName() || 'None'}`);

    // Test 4: Message Processing  
    console.log('\n4. Testing Message Processing...');
    const mockContext = {
      user: { 
        id: 'test-user', 
        name: 'Test User',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      },
      sessionId: 'quick-test-session',
      conversationHistory: [],
      memoryContext: []
    };

    const testMessage = "Help me create a TypeScript class with proper error handling";
    const response = await enhancedAgent.processMessage(mockContext, testMessage);
    const hasResponse = response.content.length > 0;
    console.log(`   ${hasResponse ? '✅' : '❌'} Message Processing: ${hasResponse ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   📊 Response Length: ${response.content.length} characters`);
    console.log(`   📊 Actions Generated: ${response.actions?.length || 0}`);

    console.log('\n🚀 Quick Test Results:');
    console.log('   ✅ Enhanced Agent Factory: WORKING');
    console.log('   ✅ Registry Integration: WORKING'); 
    console.log(`   ${matchedCorrectly ? '✅' : '❌'} Agent Matching: ${matchedCorrectly ? 'WORKING' : 'NEEDS_FIX'}`);
    console.log(`   ${hasResponse ? '✅' : '❌'} Message Processing: ${hasResponse ? 'WORKING' : 'NEEDS_FIX'}`);

    const allWorking = matchedCorrectly && hasResponse;
    console.log(`\n🎯 Revolutionary Prompt Engineering System: ${allWorking ? 'READY ✅' : 'NEEDS ATTENTION ⚠️'}`);

    return allWorking;

  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  quickTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { quickTest };
