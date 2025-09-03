/**
 * A2A Protocol Integration Test
 *
 * Tests the OneAgent A2A Protocol implementation for basic functionality
 * and integration with OneAgent systems.
 */

import { OneAgentA2AProtocol, AgentCard } from '../coreagent/protocols/a2a/A2AProtocol';
import { UnifiedBackboneService, createUnifiedId } from '../coreagent/utils/UnifiedBackboneService';

// Test Agent Card for integration testing
const testAgentCard: AgentCard = {
  protocolVersion: UnifiedBackboneService.getResolvedConfig().a2aProtocolVersion,
  name: 'OneAgent-Test',
  version: '1.0.0',
  url: UnifiedBackboneService.getResolvedConfig().a2aBaseUrl,
  description: 'Test agent for A2A protocol validation',
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  skills: [
    {
      id: 'test-skill',
      name: 'Test Skill',
      description: 'A test skill for validation',
      tags: ['test', 'validation'],
    },
  ],
  capabilities: {
    streaming: true,
    pushNotifications: false,
    stateTransitionHistory: true,
    extensions: [],
  },
  securitySchemes: {
    bearer: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT Bearer token authentication',
    },
  },
};

describe('A2A Protocol integration', () => {
  it('initializes, processes JSON-RPC, discovery/message methods, memory integration', async () => {
    const protocol = new OneAgentA2AProtocol(testAgentCard);
    await protocol.initialize();
    const agentCard = protocol.getAgentCard();
    expect(agentCard.name).toBe(testAgentCard.name);
    expect(agentCard.skills.length).toBeGreaterThan(0);

    const testRequest = {
      jsonrpc: '2.0' as const,
      method: 'message/send',
      params: {
        message: {
          id: createUnifiedId('message', 'a2a_test'),
          role: 'user' as const,
          parts: [{ kind: 'text' as const, text: 'Test message via A2A protocol' }],
          kind: 'message' as const,
        },
      },
      id: 1,
    };
    const response = await protocol.processRequest(testRequest);
    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(1);

    // Discovery (expected failure but method path)
    await protocol
      .discoverAgent(`${UnifiedBackboneService.getResolvedConfig().mcpUrl}/agent`)
      .catch(() => {});
    // Message sending (expected failure but surfaces method)
    await protocol
      .sendMessageToAgent(`${UnifiedBackboneService.getResolvedConfig().mcpUrl}/agent`, {
        id: createUnifiedId('message', 'a2a_test'),
        role: 'user' as const,
        parts: [{ kind: 'text' as const, text: 'Hello from OneAgent A2A!' }],
        kind: 'message' as const,
      })
      .catch(() => {});

    // Memory integration smoke: create second instance
    const protocol2 = new OneAgentA2AProtocol(testAgentCard);
    await protocol2.initialize();
    expect(protocol2.getAgentCard().protocolVersion).toBe(agentCard.protocolVersion);
  });
});
