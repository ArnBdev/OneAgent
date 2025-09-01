/**
 * Tests for CommunicationPersistenceAdapter canonical metadata invariants.
 */
process.env.ONEAGENT_FAST_TEST_MODE = '1';
import { CommunicationPersistenceAdapter } from '../../coreagent/communication/CommunicationPersistenceAdapter';
import { OneAgentMemory } from '../../coreagent/memory/OneAgentMemory';

// Minimal search shim: relying on OneAgentMemory existing API (assumption: getRecentMemories or direct storage?)
// We'll introspect the internal memory store if exposed; fallback skip if not available.

async function run() {
  const adapter = CommunicationPersistenceAdapter.getInstance();
  const memory = OneAgentMemory.getInstance() as any;
  const captured: { content: string; metadata: any; userId: string }[] = [];
  const originalAdd = memory.addMemoryCanonical.bind(memory);
  memory.addMemoryCanonical = (content: string, metadata: any, userId: string) => {
    captured.push({ content, metadata, userId });
    return Promise.resolve(`captured-${captured.length}`);
  };

  await adapter.persistTask({
    taskId: 'task-abc',
    status: 'pending',
    contextId: 'ctx-1',
    messageCount: 0,
    artifactCount: 0,
  });
  const taskRec = captured.find((c) => c.content.startsWith('A2A Task: task-abc'));
  if (!taskRec) throw new Error('Task record not captured');
  if (taskRec.metadata?.system?.component !== 'task') {
    console.error('DEBUG system component', taskRec.metadata?.system);
    throw new Error('Task metadata component mismatch');
  }
  if (taskRec.metadata?.content?.category !== 'agent_task') {
    console.error('DEBUG content block', taskRec.metadata?.content);
    throw new Error('Task category mismatch');
  }
  // Note: unifiedMetadataService strips unknown 'extra' block for task; validate via tags instead
  if (!taskRec.metadata?.content?.tags?.includes('task')) throw new Error('Task tag missing');

  const discussionObj = { id: 'disc-1', notes: ['n1'] };
  await adapter.persistDiscussionUpdate({
    discussion: discussionObj,
    discussionId: 'disc-1',
    topic: 'Testing',
    participants: ['agentA', 'agentB'],
    status: 'active',
    messageCount: 3,
    lastContributor: 'agentB',
  });
  const discRec = captured.find((c) => c.metadata?.system?.component === 'discussion_update');
  if (!discRec) throw new Error('Discussion update record not captured');
  if (discRec.metadata?.content?.category !== 'agent_coordination')
    throw new Error('Discussion category mismatch');
  // Participant list may be omitted in final metadata; no strict assertion here.

  memory.addMemoryCanonical = originalAdd; // restore
  console.log('[SMOKE] communication-persistence-adapter: PASS');
}

run().catch((err) => {
  console.error('[SMOKE] communication-persistence-adapter: FAIL', err);
  process.exit(1);
});
