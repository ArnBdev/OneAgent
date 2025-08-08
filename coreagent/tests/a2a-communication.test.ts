/**
 * Integration Test for Unified Agent-to-Agent (A2A) Communication
 * 
 * This test verifies the complete A2A workflow through the OneAgentEngine:
 * 1. Agent Registration
 * 2. Agent Discovery
 * 3. Session Creation
 * 4. Message Sending
 * 5. Message History Retrieval
 * 
 * To run this test, you might need a tool like ts-node:
 * `npx ts-node c:\Users\arne\.cline\mcps\OneAgent\coreagent\tests\a2a-communication.test.ts`
 */

import { OneAgentEngine } from '../OneAgentEngine';
import { OneAgentRequest } from '../OneAgentEngine';
import { createUnifiedId } from '../utils/UnifiedBackboneService';

// Mock environment variables if they are not set globally
if (!process.env.MEM0_API_KEY) {
    process.env.MEM0_API_KEY = 'test-key-for-cli';
}
if (!process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = 'test-key-for-cli';
}

async function runTest() {
    console.log('🚀 Starting A2A Communication Integration Test...');

    const engine = OneAgentEngine.getInstance();
    await engine.initialize('cli');

    // --- Test Data ---
    const agent1Id = 'test-agent-1';
    const agent2Id = 'test-agent-2';
    let sessionId = '';

    // --- Helper to run requests and assert success ---
    async function processAndAssert(request: OneAgentRequest): Promise<any> {
        console.log(`\n▶️  Executing: ${request.method}`);
        const response = await engine.processRequest(request);
        
        console.assert(response.success, `❌ FAILED: ${request.method} was not successful. Error: ${response.error?.message}`);
        if (!response.success) {
            console.error(response.error);
            throw new Error(`Test failed at step: ${request.method}`);
        }
        
        console.log(`✅ SUCCESS: ${request.method}`);
        console.log('   Response Data:', JSON.stringify(response.data, null, 2));
        return response.data;
    }

    try {
        // 1. Register Agent 1
        await processAndAssert({
            id: createUnifiedId('mcp'),
            type: 'tool_call',
            method: 'oneagent_a2a_register_agent',
            params: { id: agent1Id, name: 'Test Agent 1', capabilities: ['testing', 'logging'] },
            timestamp: new Date().toISOString()
        });

        // 2. Register Agent 2
        await processAndAssert({
            id: createUnifiedId('mcp'),
            type: 'tool_call',
            method: 'oneagent_a2a_register_agent',
            params: { id: agent2Id, name: 'Test Agent 2', capabilities: ['testing', 'reporting'] },
            timestamp: new Date().toISOString()
        });

        // 3. Discover Agents with 'testing' capability
        const discoveredAgents = await processAndAssert({
            id: createUnifiedId('mcp'),
            type: 'tool_call',
            method: 'oneagent_a2a_discover_agents',
            params: { capabilities: ['testing'] },
            timestamp: new Date().toISOString()
        });
        console.assert(discoveredAgents.length === 2, '❌ FAILED: Should have discovered 2 agents.');

        // 4. Create a session
        const sessionData = await processAndAssert({
            id: createUnifiedId('mcp'),
            type: 'tool_call',
            method: 'oneagent_a2a_create_session',
            params: { name: 'Test Collaboration Session', participants: [agent1Id, agent2Id], topic: 'Integration Test' },
            timestamp: new Date().toISOString()
        });
        sessionId = sessionData.id;
        console.assert(sessionId, '❌ FAILED: Session ID was not returned.');

        // 5. Send a message from Agent 1 to Agent 2
        await processAndAssert({
            id: createUnifiedId('mcp'),
            type: 'tool_call',
            method: 'oneagent_a2a_send_message',
            params: { sessionId, fromAgent: agent1Id, toAgent: agent2Id, message: 'Hello Agent 2, this is a test message.', messageType: 'question' },
            timestamp: new Date().toISOString()
        });

        // 6. Get message history
        const history = await processAndAssert({
            id: createUnifiedId('mcp'),
            type: 'tool_call',
            method: 'oneagent_a2a_get_message_history',
            params: { sessionId },
            timestamp: new Date().toISOString()
        });
        console.assert(history.length === 1, '❌ FAILED: History should contain 1 message.');
        console.assert(history[0].message === 'Hello Agent 2, this is a test message.', '❌ FAILED: Message content mismatch.');

        console.log('\n\n🎉 All A2A communication tests passed successfully!');

    } catch (error) {
        console.error('\n\n🔥 A test failed, stopping execution.', (error as Error).message);
        process.exit(1);
    }
}

runTest();