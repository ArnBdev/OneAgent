// Enable fast test path for unified comm service to avoid heavy backends
process.env.ONEAGENT_FAST_TEST_MODE = '1';

describe('A2A discovery + messaging smoke', () => {
  jest.setTimeout(15000);
  it('discovers agents and exchanges messages', async () => {
    const { AgentFactory } = await import('../../coreagent/agents/base/AgentFactory');
    const { unifiedAgentCommunicationService } = await import(
      '../../coreagent/utils/UnifiedAgentCommunicationService'
    );

    const dev = await AgentFactory.createDevAgent();
    const triage = await AgentFactory.createTriageAgent();

    const discovered = await unifiedAgentCommunicationService.discoverAgents({
      capabilities: ['debugging'],
    });
    expect(discovered.length).toBeGreaterThanOrEqual(1);

    const sessionId = await unifiedAgentCommunicationService.createSession({
      name: 'smoke',
      participants: [dev.config.id, triage.config.id],
      topic: 'smoke-test',
    });

    const messageId = await unifiedAgentCommunicationService.sendMessage({
      sessionId,
      fromAgent: dev.config.id,
      toAgent: triage.config.id,
      content: 'hello from dev',
    });
    expect(messageId).toContain('message_');

    const history = await unifiedAgentCommunicationService.getMessageHistory(sessionId, 10);
    expect(history.at(-1)?.fromAgent).toBe(dev.config.id);

    await AgentFactory.shutdownAllAgents();
  });
});
