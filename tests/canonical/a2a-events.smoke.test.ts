// Minimal inline jest-like globals fallback to allow standalone execution via ts-node
if (!(globalThis as any).describe) {
  type TestFn = () => Promise<void> | void;
  const tests: Array<{ name: string; fn: TestFn }> = [];
  (globalThis as any).describe = (_name: string, fn: () => void) => fn();
  (globalThis as any).it = (name: string, fn: TestFn) => tests.push({ name, fn });
  (globalThis as any).test = (name: string, fn: TestFn) => tests.push({ name, fn });
  (globalThis as any).jest = { setTimeout: (_ms: number) => {} };
  (globalThis as any).expect = (received: any) => ({
    toBeGreaterThanOrEqual: (min: number) => {
      if (!(received >= min)) throw new Error(`Expected ${received} >= ${min}`);
    },
    toBeTruthy: () => {
      if (!received) throw new Error('Expected value to be truthy');
    },
    toContain: (v: unknown) => {
      if (!Array.isArray(received) || !received.includes(v))
        throw new Error('Expected array to contain value');
    },
  });
  // Auto-run queued tests at end of tick
  queueMicrotask(async () => {
    let failures = 0;
    for (const t of tests) {
      try {
        await t.fn();
        console.log(`✔ ${t.name}`);
      } catch (e) {
        failures++;
        console.error(`✖ ${t.name}:`, e);
      }
    }
    if (failures > 0) process.exitCode = 1;
  });
}
process.env.ONEAGENT_FAST_TEST_MODE = '1';

describe('A2A events smoke', () => {
  jest.setTimeout(15000);
  it('emits register, send, receive, broadcast events', async () => {
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
    expect(events.filter((e) => e.type === 'registered').length).toBeGreaterThanOrEqual(2);

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

    expect(events.filter((e) => e.type === 'sent').length).toBeGreaterThanOrEqual(1);
    expect(events.filter((e) => e.type === 'received').length).toBeGreaterThanOrEqual(1);

    await unifiedAgentCommunicationService.broadcastMessage({
      sessionId,
      fromAgent: triage.config.id,
      content: 'broadcast',
    });

    expect(events.filter((e) => e.type === 'received').length).toBeGreaterThanOrEqual(2);

    unifiedAgentCommunicationService.off('message_sent', onSent);
    unifiedAgentCommunicationService.off('message_received', onReceived);
    unifiedAgentCommunicationService.off('agent_registered', onRegistered);

    await AgentFactory.shutdownAllAgents();
  });
});
