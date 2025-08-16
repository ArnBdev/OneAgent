// Canonical Communication Invariants Test
// Verifies send/receive counts, broadcast fan-out, and handler lifecycle (on/off).

// Ensure fast test mode before imports
process.env.ONEAGENT_FAST_TEST_MODE = '1';
process.env.ONEAGENT_DISABLE_AUTO_MONITORING = '1'; // keep test output minimal and avoid monitoring-based flakiness

import {
  createUnifiedTimestamp,
  createUnifiedId,
} from '../../coreagent/utils/UnifiedBackboneService';

(async () => {
  const { AgentFactory } = await import('../../coreagent/agents/specialized/AgentFactory');
  const { unifiedAgentCommunicationService } = await import(
    '../../coreagent/utils/UnifiedAgentCommunicationService'
  );

  // Event counters
  const counters = { sent: 0, received: 0, registered: 0 };
  const onSent = () => (counters.sent += 1);
  const onReceived = () => (counters.received += 1);
  const onRegistered = () => (counters.registered += 1);

  unifiedAgentCommunicationService.on('message_sent', onSent);
  unifiedAgentCommunicationService.on('message_received', onReceived);
  unifiedAgentCommunicationService.on('agent_registered', onRegistered);

  try {
    // Canonical timestamp/id usage (visibility for test start)
    const ts = createUnifiedTimestamp();
    const testId = createUnifiedId('operation', 'comm-invariants');
    void ts; // not strictly needed beyond initialization; kept to satisfy canonical usage guidance

    // Create two agents
    const dev = await AgentFactory.createDevAgent();
    const triage = await AgentFactory.createTriageAgent();

    // Expect >= 2 registrations
    if (counters.registered < 2)
      throw new Error(`expected >=2 registrations, got ${counters.registered}`);

    // Create session with both agents
    const sessionId = await unifiedAgentCommunicationService.createSession({
      name: `comm-invariants-${testId}`,
      participants: [dev.config.id, triage.config.id],
      topic: 'invariants',
    });

    // Targeted send: dev -> triage
    const sentBefore = counters.sent;
    const recvBefore = counters.received;
    await unifiedAgentCommunicationService.sendMessage({
      sessionId,
      fromAgent: dev.config.id,
      toAgent: triage.config.id,
      content: 'ping-one',
    });
    if (counters.sent !== sentBefore + 1)
      throw new Error(`sent counter mismatch (targeted): ${counters.sent} vs ${sentBefore + 1}`);
    if (counters.received !== recvBefore + 1)
      throw new Error(
        `received counter mismatch (targeted): ${counters.received} vs ${recvBefore + 1}`,
      );

    // Broadcast: triage -> all (2 participants total). Expect at least one receive (dev gets it). Implementation may or may not deliver to sender; accept >=1.
    const recvBeforeBroadcast = counters.received;
    await unifiedAgentCommunicationService.broadcastMessage({
      sessionId,
      fromAgent: triage.config.id,
      content: 'broadcast-one',
    });
    if (counters.received < recvBeforeBroadcast + 1) {
      throw new Error(
        `received counter did not increase after broadcast: ${counters.received} vs >= ${recvBeforeBroadcast + 1}`,
      );
    }

    // Handler lifecycle: remove listeners and ensure no further increments
    unifiedAgentCommunicationService.off('message_sent', onSent);
    unifiedAgentCommunicationService.off('message_received', onReceived);

    const sentBeforeOff = counters.sent;
    const recvBeforeOff = counters.received;
    await unifiedAgentCommunicationService.sendMessage({
      sessionId,
      fromAgent: dev.config.id,
      toAgent: triage.config.id,
      content: 'ping-after-off',
    });
    await unifiedAgentCommunicationService.broadcastMessage({
      sessionId,
      fromAgent: triage.config.id,
      content: 'broadcast-after-off',
    });

    if (counters.sent !== sentBeforeOff)
      throw new Error(`sent incremented after off: ${counters.sent} vs ${sentBeforeOff}`);
    if (counters.received !== recvBeforeOff)
      throw new Error(`received incremented after off: ${counters.received} vs ${recvBeforeOff}`);

    console.log('[communication-invariants.test] PASS', {
      registered: counters.registered,
      sent: counters.sent,
      received: counters.received,
      sessionId,
    });
    // Clean shutdown of agents
    await AgentFactory.shutdownAllAgents();
    if (process.env.ONEAGENT_FAST_TEST_MODE === '1') process.exit(0);
  } catch (err) {
    // Always attempt to detach listeners before exit
    unifiedAgentCommunicationService.off('message_sent', onSent);
    unifiedAgentCommunicationService.off('message_received', onReceived);
    unifiedAgentCommunicationService.off('agent_registered', onRegistered);
    try {
      const { AgentFactory } = await import('../../coreagent/agents/specialized/AgentFactory');
      await AgentFactory.shutdownAllAgents();
    } catch (e) {
      // best-effort cleanup
      console.warn('Agent shutdown cleanup failed (non-fatal):', e);
    }
    console.error('[communication-invariants.test] FAIL', err);
    process.exit(1);
  } finally {
    // Ensure registered listener is removed too
    unifiedAgentCommunicationService.off('agent_registered', onRegistered);
  }
})();
