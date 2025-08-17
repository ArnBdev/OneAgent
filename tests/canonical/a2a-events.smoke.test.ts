// Ensure fast test mode before imports
process.env.ONEAGENT_FAST_TEST_MODE = '1';

(async () => {
  const { AgentFactory } = await import('../../coreagent/agents/base/AgentFactory');
  const { unifiedAgentCommunicationService } = await import(
    '../../coreagent/utils/UnifiedAgentCommunicationService'
  );

  const events: Array<{ type: string; payload: unknown }> = [];
  const onSent = (p: unknown) => events.push({ type: 'sent', payload: p });
  const onReceived = (p: unknown) => events.push({ type: 'received', payload: p });
  const onRegistered = (p: unknown) => events.push({ type: 'registered', payload: p });

  unifiedAgentCommunicationService.on('message_sent', onSent);
  unifiedAgentCommunicationService.on('message_received', onReceived);
  unifiedAgentCommunicationService.on('agent_registered', onRegistered);

  const dev = await AgentFactory.createDevAgent();
  const triage = await AgentFactory.createTriageAgent();

  // Expect at least two registrations
  console.log('events_registered_count', events.filter((e) => e.type === 'registered').length);

  const sessionId = await unifiedAgentCommunicationService.createSession({
    name: 'events',
    participants: [dev.config.id, triage.config.id],
    topic: 'events-test',
  });

  await unifiedAgentCommunicationService.sendMessage({
    sessionId,
    fromAgent: dev.config.id,
    toAgent: triage.config.id,
    content: 'ping',
  });

  console.log('events_sent_count', events.filter((e) => e.type === 'sent').length);
  console.log('events_received_count', events.filter((e) => e.type === 'received').length);

  // Broadcast
  await unifiedAgentCommunicationService.broadcastMessage({
    sessionId,
    fromAgent: triage.config.id,
    content: 'broadcast',
  });

  console.log(
    'events_received_after_broadcast',
    events.filter((e) => e.type === 'received').length,
  );

  unifiedAgentCommunicationService.off('message_sent', onSent);
  unifiedAgentCommunicationService.off('message_received', onReceived);
  unifiedAgentCommunicationService.off('agent_registered', onRegistered);

  await AgentFactory.shutdownAllAgents();
})();
