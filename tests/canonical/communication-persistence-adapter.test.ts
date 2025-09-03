/**
 * Tests for CommunicationPersistenceAdapter canonical metadata invariants.
 */
process.env.ONEAGENT_FAST_TEST_MODE = '1';
import { CommunicationPersistenceAdapter } from '../../coreagent/communication/CommunicationPersistenceAdapter';
import { OneAgentMemory } from '../../coreagent/memory/OneAgentMemory';

describe('communication-persistence-adapter (canonical)', () => {
  it('persists task & discussion metadata with canonical fields', async () => {
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
    expect(taskRec).toBeTruthy();
    expect(taskRec?.metadata?.system?.component).toBe('task');
    expect(taskRec?.metadata?.content?.category).toBe('agent_task');
    expect(taskRec?.metadata?.content?.tags).toEqual(expect.arrayContaining(['task']));

    await adapter.persistDiscussionUpdate({
      discussion: { id: 'disc-1', notes: ['n1'] },
      discussionId: 'disc-1',
      topic: 'Testing',
      participants: ['agentA', 'agentB'],
      status: 'active',
      messageCount: 3,
      lastContributor: 'agentB',
    });
    const discRec = captured.find((c) => c.metadata?.system?.component === 'discussion_update');
    expect(discRec).toBeTruthy();
    expect(discRec?.metadata?.content?.category).toBe('agent_coordination');

    memory.addMemoryCanonical = originalAdd; // restore
  });
});
