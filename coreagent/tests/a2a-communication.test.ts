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

import { OneAgentEngine, OneAgentRequest } from '../OneAgentEngine';
import { createUnifiedId } from '../utils/UnifiedBackboneService';

// Mock environment variables if they are not set globally
if (!process.env.MEM0_API_KEY) {
  process.env.MEM0_API_KEY = 'test-key-for-cli';
}
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = 'test-key-for-cli';
}

describe('A2A communication integration', () => {
  let engine: OneAgentEngine;
  const agent1Id = 'test-agent-1';
  const agent2Id = 'test-agent-2';
  let sessionId = '';

  beforeAll(async () => {
    engine = OneAgentEngine.getInstance();
    await engine.initialize('cli');
  });

  async function processAndAssert<T = unknown>(request: OneAgentRequest): Promise<T> {
    const response = await engine.processRequest(request);
    expect(response.success).toBe(true);
    return response.data as T;
  }

  it('performs full register, discover, session, message, history workflow', async () => {
    await processAndAssert({
      id: createUnifiedId('mcp'),
      type: 'tool_call',
      method: 'oneagent_a2a_register_agent',
      params: { id: agent1Id, name: 'Test Agent 1', capabilities: ['testing', 'logging'] },
      timestamp: new Date().toISOString(),
    });
    await processAndAssert({
      id: createUnifiedId('mcp'),
      type: 'tool_call',
      method: 'oneagent_a2a_register_agent',
      params: { id: agent2Id, name: 'Test Agent 2', capabilities: ['testing', 'reporting'] },
      timestamp: new Date().toISOString(),
    });
    type AgentSummary = { id: string; name?: string; capabilities?: string[] };
    const discoveredAgents = await processAndAssert<AgentSummary[]>({
      id: createUnifiedId('mcp'),
      type: 'tool_call',
      method: 'oneagent_a2a_discover_agents',
      params: { capabilities: ['testing'] },
      timestamp: new Date().toISOString(),
    });
    expect(discoveredAgents.length).toBe(2);

    type SessionInfo = { id: string };
    const sessionData = await processAndAssert<SessionInfo>({
      id: createUnifiedId('mcp'),
      type: 'tool_call',
      method: 'oneagent_a2a_create_session',
      params: {
        name: 'Test Collaboration Session',
        participants: [agent1Id, agent2Id],
        topic: 'Integration Test',
      },
      timestamp: new Date().toISOString(),
    });
    sessionId = sessionData.id;
    expect(sessionId).toBeTruthy();

    await processAndAssert({
      id: createUnifiedId('mcp'),
      type: 'tool_call',
      method: 'oneagent_a2a_send_message',
      params: {
        sessionId,
        fromAgent: agent1Id,
        toAgent: agent2Id,
        message: 'Hello Agent 2, this is a test message.',
        messageType: 'question',
      },
      timestamp: new Date().toISOString(),
    });
    type MessageRecord = { message: string };
    const history = await processAndAssert<MessageRecord[]>({
      id: createUnifiedId('mcp'),
      type: 'tool_call',
      method: 'oneagent_a2a_get_message_history',
      params: { sessionId },
      timestamp: new Date().toISOString(),
    });
    expect(history.length).toBe(1);
    expect(history[0].message).toBe('Hello Agent 2, this is a test message.');
  }, 30000);
});
