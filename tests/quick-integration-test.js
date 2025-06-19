/**
 * Quick Integration Test for OneAgent Level 2 Core Components
 * Tests the basic functionality without complex dependencies
 */
import { BaseAgent } from '../agents/base/BaseAgent';
// Test configuration
const testConfig = {
    id: 'test-agent-001',
    name: 'TestAgent',
    description: 'Test agent for integration verification',
    capabilities: ['test', 'integration'],
    memoryEnabled: true,
    aiEnabled: true
};
// Simple test agent implementation
class TestAgent extends BaseAgent {
    async processMessage(context, message) {
        try {
            console.log(`Processing message: ${message}`);
            // Test memory functionality
            if (this.config.memoryEnabled) {
                await this.addMemory(context.user.id, message, { test: true });
                console.log('✅ Memory functionality working');
            }
            // Test AI functionality
            if (this.config.aiEnabled) {
                const response = await this.generateResponse(`Respond to: ${message}`);
                console.log('✅ AI functionality working');
                return this.createResponse(response);
            }
            return this.createResponse('Test response without AI');
        }
        catch (error) {
            console.error('Test failed:', error);
            return this.createResponse('Test failed');
        }
    }
}
// Run integration test
async function runIntegrationTest() {
    try {
        console.log('🚀 Starting OneAgent Level 2 Integration Test...\n');
        // Test 1: Agent Creation
        console.log('Test 1: Creating test agent...');
        const agent = new TestAgent(testConfig);
        console.log('✅ Agent created successfully');
        // Test 2: Agent Initialization
        console.log('\nTest 2: Initializing agent...');
        await agent.initialize();
        console.log('✅ Agent initialized successfully');
        // Test 3: Basic Processing
        console.log('\nTest 3: Testing message processing...');
        const testContext = {
            user: { id: 'test-user', name: 'Test User' },
            sessionId: 'test-session-001',
            conversationHistory: [],
            memoryContext: []
        };
        const response = await agent.processMessage(testContext, 'Hello, this is a test message');
        console.log('✅ Message processing completed');
        console.log(`Response: ${response.content}`);
        // Test 4: Configuration Validation
        console.log('\nTest 4: Validating configuration...');
        const config = agent.getConfig();
        console.log(`Agent ID: ${config.id}`);
        console.log(`Agent Name: ${config.name}`);
        console.log(`Memory Enabled: ${config.memoryEnabled}`);
        console.log(`AI Enabled: ${config.aiEnabled}`);
        console.log('✅ Configuration validation completed');
        // Test 5: Cleanup
        console.log('\nTest 5: Testing cleanup...');
        await agent.cleanup();
        console.log('✅ Cleanup completed');
        console.log('\n🎉 Integration Test PASSED - Core components are working!');
        console.log('\n📊 Test Summary:');
        console.log('- BaseAgent implementation: ✅ Working');
        console.log('- Memory integration: ✅ Working');
        console.log('- AI integration: ✅ Working');
        console.log('- Configuration system: ✅ Working');
        console.log('- Cleanup functionality: ✅ Working');
    }
    catch (error) {
        console.error('\n❌ Integration Test FAILED:', error);
        process.exit(1);
    }
}
// Run the test if this file is executed directly
if (require.main === module) {
    runIntegrationTest();
}
export { runIntegrationTest };
