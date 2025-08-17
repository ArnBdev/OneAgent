// Enable fast test path for unified comm service to avoid heavy backends
process.env.ONEAGENT_FAST_TEST_MODE = '1';

(async () => {
  // Import after setting env so the singleton picks up FAST_TEST_MODE
  const { AgentFactory } = await import('../../coreagent/agents/base/AgentFactory');
  const { unifiedAgentCommunicationService } = await import(
    '../../coreagent/utils/UnifiedAgentCommunicationService'
  );

  const dev = await AgentFactory.createDevAgent();
  const triage = await AgentFactory.createTriageAgent();

  // Discover agents
  const discovered = await unifiedAgentCommunicationService.discoverAgents({
    capabilities: ['debugging'],
  });
  console.log('discovered_count', discovered.length);

  // Create a session and join both agents
  const sessionId = await unifiedAgentCommunicationService.createSession({
    name: 'smoke',
    participants: [dev.config.id, triage.config.id],
    topic: 'smoke-test',
  });

  // Send message from dev to triage
  const messageId = await unifiedAgentCommunicationService.sendMessage({
    sessionId,
    fromAgent: dev.config.id,
    toAgent: triage.config.id,
    content: 'hello from dev',
  });
  console.log('message_id_prefix', messageId.split(':')[0]);

  // Get history
  const history = await unifiedAgentCommunicationService.getMessageHistory(sessionId, 10);
  console.log('history_last_from', history.at(-1)?.fromAgent);

  await AgentFactory.shutdownAllAgents();
})();
