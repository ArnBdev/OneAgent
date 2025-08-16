import { UnifiedBackboneService } from '../coreagent/utils/UnifiedBackboneService';
import { OneAgentA2AProtocol } from '../coreagent/protocols/a2a/A2AProtocol';
import { OneAgentMemory } from '../coreagent/memory/OneAgentMemory';

describe('A2A + NLACS Integration', () => {
  const config = UnifiedBackboneService.config;
  const memory = OneAgentMemory.getInstance();
  const agentCard = {
    protocolVersion: config.a2aProtocolVersion,
    name: 'TestAgent',
    description: 'Test agent for A2A/NLACS integration',
    url: 'http://localhost:9000',
    version: '1.0.0',
    skills: [],
    capabilities: {},
    defaultInputModes: ['text'],
    defaultOutputModes: ['text'],
  };
  const a2a = new OneAgentA2AProtocol(agentCard);

  beforeAll(async () => {
    await a2a.initialize();
  });

  it('should register agent and store agent card in memory', async () => {
    const card = a2a.getAgentCard();
    expect(card.name).toBe('TestAgent');
    const results = await memory.searchMemory({ query: 'Agent Card: TestAgent', limit: 1 });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should send and store a direct agent message', async () => {
    const messageId = await a2a.sendAgentMessage({
      toAgent: 'PeerAgent',
      content: 'Hello, peer!',
      messageType: 'direct',
    });
    expect(typeof messageId).toBe('string');
    const results = await memory.searchMemory({ query: 'Hello, peer!', limit: 1 });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should retrieve recent agent messages for context', async () => {
    const messages = await a2a.getAgentMessages({ limit: 5 });
    expect(Array.isArray(messages)).toBe(true);
  });

  it('should support NLACS-style negotiation and context sharing', async () => {
    // Simulate negotiation by sending coordination messages
    await a2a.sendAgentMessage({
      toAgent: 'PeerAgent',
      content: 'Let us negotiate task ownership.',
      messageType: 'coordination',
    });
    const messages = await a2a.getAgentMessages({ messageTypes: ['coordination'], limit: 2 });
    expect(messages.some((m) => m.metadata?.messageType === 'coordination')).toBe(true);
  });
});
