// Canonical A2A + NLACS test using UnifiedAgentCommunicationService
// Fast path: avoid external services and use in-memory registries
process.env.ONEAGENT_FAST_TEST_MODE = '1';
process.env.ONEAGENT_DISABLE_AUTO_MONITORING = '1';

import { unifiedAgentCommunicationService } from '../../coreagent/utils/UnifiedAgentCommunicationService';
import { AgentFactory } from '../../coreagent/agents/base/AgentFactory';

describe('A2A NLACS (canonical service)', () => {
  let devId: string;
  let triageId: string;
  let sessionId: string;

  beforeAll(async () => {
    const dev = await AgentFactory.createDevAgent();
    const triage = await AgentFactory.createTriageAgent();
    devId = dev.getConfig().id;
    triageId = triage.getConfig().id;

    sessionId = await unifiedAgentCommunicationService.createSession({
      name: 'nlacs-canonical',
      participants: [devId, triageId],
      topic: 'nlacs-validation',
      metadata: { purpose: 'test' },
    });
  });

  afterAll(async () => {
    await AgentFactory.shutdownAllAgents();
  });

  it('stores and retrieves NLACS-extended message metadata', async () => {
    const nlacsExt = {
      uri: 'https://oneagent.ai/extensions/nlacs',
      discussionId: 'test-discussion',
      role: 'facilitator',
      phase: 'proposal',
    } as const;

    await unifiedAgentCommunicationService.sendMessage({
      sessionId,
      fromAgent: triageId,
      toAgent: devId,
      content: 'Please evaluate feasibility and outline next steps.',
      messageType: 'question',
      metadata: {
        nlacs: true,
        extensions: [nlacsExt],
        testTag: 'canonical-nlacs',
      },
    });

    const history = await unifiedAgentCommunicationService.getMessageHistory(sessionId, 5);
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    const last = history[history.length - 1];
    expect(last.sessionId).toBe(sessionId);
    expect(last.toAgent).toBe(devId);
    expect(last.metadata?.nlacs).toBe(true);
    const exts = (last.metadata?.extensions || []) as Array<{ uri?: string }>;
    expect(exts.some((e) => e && e.uri === 'https://oneagent.ai/extensions/nlacs')).toBe(true);
  });

  it('persists messages with NLACS metadata in OneAgentMemory (non-fast mode)', async () => {
    // Disable fast test mode for this case (save/restore)
    const prevFast = process.env.ONEAGENT_FAST_TEST_MODE;
    delete process.env.ONEAGENT_FAST_TEST_MODE;

    const { OneAgentMemory } = await import('../../coreagent/memory/OneAgentMemory');
    const memory = OneAgentMemory.getInstance({});

    // Ensure memory server is reachable and ready; if not, skip this test gracefully
    const ready = await memory.waitForReady(20000, 750);
    if (!ready) {
      console.warn('[TEST] Memory server not ready; skipping persistence verification case.');
      // Restore FAST_TEST_MODE and exit early
      if (prevFast) process.env.ONEAGENT_FAST_TEST_MODE = prevFast;
      expect(true).toBe(true);
      return;
    }

    // Send a message with NLACS extension to persist
    await unifiedAgentCommunicationService.sendMessage({
      sessionId,
      fromAgent: devId,
      toAgent: triageId,
      content: 'NLACS persistence check message',
      messageType: 'update',
      metadata: {
        nlacs: true,
        extensions: [{ uri: 'https://oneagent.ai/extensions/nlacs', topic: 'persistence' }],
        testTag: 'canonical-nlacs-persist',
      },
    });

    // Query the memory for recent messages in this session
    const results = await memory.searchMemory({
      query: `message history for session ${sessionId}`,
      user_id: 'system_history',
      limit: 10,
      // metadata_filter validated in service; here we perform a broader query then inspect fields
    });
    expect(results && Array.isArray(results.results)).toBe(true);
    const items = (results?.results || []) as Array<{ metadata?: Record<string, unknown> }>;
    // Find the item with our test tag and NLACS tag propagated
    const hit = items.find((r) => {
      const md = (r.metadata || {}) as Record<string, unknown>;
      const messageData = md.messageData as Record<string, unknown> | undefined;
      const tags = ((md.content as Record<string, unknown> | undefined)?.tags || []) as string[];
      const hasNlacsTag = Array.isArray(tags) && tags.includes('nlacs');
      const extensions =
        (messageData?.metadata as { extensions?: Array<{ uri?: string }> } | undefined)
          ?.extensions || [];
      const hasNlacsExt = extensions.some(
        (e) => e && e.uri === 'https://oneagent.ai/extensions/nlacs',
      );
      const content = (messageData?.message as string) || '';
      return content.includes('NLACS persistence check message') && hasNlacsTag && hasNlacsExt;
    });
    expect(!!hit).toBe(true);

    // Restore FAST_TEST_MODE
    if (prevFast) process.env.ONEAGENT_FAST_TEST_MODE = prevFast;
  });

  it('broadcasts messages to all session participants', async () => {
    // Ensure fast path to avoid external dependency for this test
    process.env.ONEAGENT_FAST_TEST_MODE = '1';
    const historyBefore = await unifiedAgentCommunicationService.getMessageHistory(sessionId, 100);
    const countBefore = historyBefore.length;

    await unifiedAgentCommunicationService.broadcastMessage({
      sessionId,
      fromAgent: triageId,
      content: 'Broadcast NLACS test',
      messageType: 'insight',
      metadata: { nlacs: true, extensions: [{ uri: 'https://oneagent.ai/extensions/nlacs' }] },
    });

    const historyAfter = await unifiedAgentCommunicationService.getMessageHistory(sessionId, 100);
    expect(historyAfter.length).toBeGreaterThan(countBefore);
    const last = historyAfter[historyAfter.length - 1];
    // Broadcast has no toAgent, and should carry NLACS metadata
    expect(last.toAgent === undefined || last.toAgent === null).toBe(true);
    expect(last.metadata?.nlacs).toBe(true);
    const exts = (last.metadata?.extensions || []) as Array<{ uri?: string }>;
    expect(exts.some((e) => e && e.uri === 'https://oneagent.ai/extensions/nlacs')).toBe(true);
  });
});
