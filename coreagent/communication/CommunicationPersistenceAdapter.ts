/**
 * CommunicationPersistenceAdapter
 * Centralized helper ensuring consistent metadata + canonical memory writes
 * for all agent communication artifacts.
 */
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { unifiedMetadataService, createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import { COMM_METADATA_KEYS } from '../types/communication-constants';

export interface PersistAgentMessageParams {
  fromAgent: string;
  toAgent: string;
  messageType: string;
  priority: string;
  content: string;
  threadId?: string;
  replyToMessageId?: string;
  extra?: Record<string, unknown>;
}

export class CommunicationPersistenceAdapter {
  private static instance: CommunicationPersistenceAdapter;
  private memory: OneAgentMemory;

  private constructor(memory: OneAgentMemory) {
    this.memory = memory;
  }

  public static getInstance(): CommunicationPersistenceAdapter {
    if (!CommunicationPersistenceAdapter.instance) {
      CommunicationPersistenceAdapter.instance = new CommunicationPersistenceAdapter(
        OneAgentMemory.getInstance(),
      );
    }
    return CommunicationPersistenceAdapter.instance;
  }

  async persistAgentMessage(params: PersistAgentMessageParams): Promise<string> {
    const ts = createUnifiedTimestamp();
    const metadata = unifiedMetadataService.create('agent_message', 'communication_adapter', {
      system: {
        source: 'communication_adapter',
        component: 'agent_message',
        agent: { id: params.fromAgent, type: 'a2a' },
      },
      content: {
        category: 'a2a_message',
        tags: [params.messageType, params.priority],
        sensitivity: 'internal',
        relevanceScore: 0.9,
        contextDependency: 'global',
      },
      extra: {
        [COMM_METADATA_KEYS.fromAgent]: params.fromAgent,
        [COMM_METADATA_KEYS.toAgent]: params.toAgent,
        [COMM_METADATA_KEYS.messageType]: params.messageType,
        [COMM_METADATA_KEYS.priority]: params.priority,
        [COMM_METADATA_KEYS.threadId]: params.threadId,
        [COMM_METADATA_KEYS.replyToMessageId]: params.replyToMessageId,
        ...params.extra,
      },
      temporal: {
        created: ts,
        updated: ts,
        contextSnapshot: {
          timeOfDay: ts.contextual?.timeOfDay || 'unknown',
          dayOfWeek: new Date(ts.utc).toLocaleDateString('en-US', { weekday: 'long' }),
          businessContext: true,
          energyContext: 'standard',
        },
      },
    });
    return this.memory.addMemory({
      content: `Agent Message: ${params.fromAgent} -> ${params.toAgent}\n${params.content}`,
      metadata: {
        ...metadata,
        type: 'system_messaging',
      },
    });
  }

  async persistDiscussion(payload: {
    discussionId: string;
    topic: string;
    participants: string[];
    creator: string;
    status: string;
    extra?: Record<string, unknown>;
  }): Promise<string> {
    const ts = createUnifiedTimestamp();
    const metadata = unifiedMetadataService.create('agent_discussion', 'communication_adapter', {
      system: { source: 'communication_adapter', component: 'discussion_manager' },
      content: {
        category: 'agent_coordination',
        tags: ['discussion', ...payload.participants.map((p) => `agent:${p}`)],
        sensitivity: 'internal',
        relevanceScore: 0.9,
        contextDependency: 'session',
      },
      extra: { ...payload, participants: payload.participants.join(','), ...payload.extra },
      temporal: {
        created: ts,
        updated: ts,
        contextSnapshot: {
          timeOfDay: ts.contextual?.timeOfDay || 'unknown',
          dayOfWeek: new Date(ts.utc).toLocaleDateString('en-US', { weekday: 'long' }),
          businessContext: true,
          energyContext: 'standard',
        },
      },
    });
    return this.memory.addMemory({
      content: `Agent Discussion: ${payload.topic} (${payload.discussionId})`,
      metadata: {
        ...metadata,
        type: 'system_discussion',
      },
    });
  }

  async persistDiscussionContribution(payload: {
    discussionId: string;
    messageId: string;
    contributor: string;
    contributionType: string;
    content: string;
    extra?: Record<string, unknown>;
  }): Promise<string> {
    const ts = createUnifiedTimestamp();
    const metadata = unifiedMetadataService.create(
      'agent_discussion_contribution',
      'communication_adapter',
      {
        system: { source: 'communication_adapter', component: 'discussion_contribution' },
        content: {
          category: 'agent_coordination',
          tags: ['contribution', payload.contributionType],
          sensitivity: 'internal',
          relevanceScore: 0.85,
          contextDependency: 'session',
        },
        extra: { ...payload, ...payload.extra },
        temporal: {
          created: ts,
          updated: ts,
          contextSnapshot: {
            timeOfDay: ts.contextual?.timeOfDay || 'unknown',
            dayOfWeek: new Date(ts.utc).toLocaleDateString('en-US', { weekday: 'long' }),
            businessContext: true,
            energyContext: 'standard',
          },
        },
      },
    );
    return this.memory.addMemory({
      content: `Discussion Contribution: ${payload.contributor} -> ${payload.contributionType}\n${payload.content}`,
      metadata: {
        ...metadata,
        type: 'system_discussion',
      },
    });
  }

  async persistInsight(payload: {
    insightId: string;
    type: string;
    confidence: number;
    relevanceScore: number;
    contributor: string;
    extra?: Record<string, unknown>;
  }): Promise<string> {
    const ts = createUnifiedTimestamp();
    const metadata = unifiedMetadataService.create('agent_insight', 'communication_adapter', {
      system: { source: 'communication_adapter', component: 'insight' },
      content: {
        category: 'agent_insight',
        tags: ['insight', payload.type],
        sensitivity: 'internal',
        relevanceScore: payload.relevanceScore,
        contextDependency: 'global',
      },
      extra: { ...payload, ...payload.extra },
      temporal: {
        created: ts,
        updated: ts,
        contextSnapshot: {
          timeOfDay: ts.contextual?.timeOfDay || 'unknown',
          dayOfWeek: new Date(ts.utc).toLocaleDateString('en-US', { weekday: 'long' }),
          businessContext: true,
          energyContext: 'standard',
        },
      },
    });
    return this.memory.addMemory({
      content: `Agent Insight: ${payload.type} (${payload.insightId})`,
      metadata: {
        ...metadata,
        type: 'system_insight',
      },
    });
  }

  async persistKnowledge(payload: {
    knowledgeId: string;
    threadCount: number;
    insightCount: number;
    synthesizer: string;
    confidence: number;
    qualityScore: number;
    extra?: Record<string, unknown>;
  }): Promise<string> {
    const ts = createUnifiedTimestamp();
    const metadata = unifiedMetadataService.create(
      'synthesized_knowledge',
      'communication_adapter',
      {
        system: { source: 'communication_adapter', component: 'knowledge_synthesis' },
        content: {
          category: 'agent_knowledge',
          tags: ['knowledge', 'synthesis'],
          sensitivity: 'internal',
          relevanceScore: 0.9,
          contextDependency: 'global',
        },
        extra: { ...payload, ...payload.extra },
        temporal: {
          created: ts,
          updated: ts,
          contextSnapshot: {
            timeOfDay: ts.contextual?.timeOfDay || 'unknown',
            dayOfWeek: new Date(ts.utc).toLocaleDateString('en-US', { weekday: 'long' }),
            businessContext: true,
            energyContext: 'standard',
          },
        },
      },
    );
    return this.memory.addMemory({
      content: `Synthesized Knowledge: ${payload.knowledgeId}`,
      metadata: {
        ...metadata,
        type: 'system_knowledge',
      },
    });
  }

  async persistAgentStatus(payload: { agentId: string; status: string }): Promise<string> {
    const ts = createUnifiedTimestamp();
    const metadata = unifiedMetadataService.create('agent_status', 'communication_adapter', {
      system: { source: 'communication_adapter', component: 'status' },
      content: {
        category: 'agent_lifecycle',
        tags: ['status', payload.status],
        sensitivity: 'internal',
        relevanceScore: 0.6,
        contextDependency: 'global',
      },
      extra: { ...payload },
      temporal: {
        created: ts,
        updated: ts,
        contextSnapshot: {
          timeOfDay: ts.contextual?.timeOfDay || 'unknown',
          dayOfWeek: new Date(ts.utc).toLocaleDateString('en-US', { weekday: 'long' }),
          businessContext: true,
          energyContext: 'standard',
        },
      },
    });
    return this.memory.addMemory({
      content: `Agent Status: ${payload.agentId} -> ${payload.status}`,
      metadata: {
        ...metadata,
        type: 'system_status',
      },
    });
  }

  /**
   * Persist or update an agent task record (replaces legacy storeA2AMemory('a2a_task', ...))
   */
  async persistTask(payload: {
    taskId: string;
    contextId?: string;
    status: string;
    messageCount: number;
    artifactCount: number;
    extra?: Record<string, unknown>;
  }): Promise<string> {
    const ts = createUnifiedTimestamp();
    const metadata = unifiedMetadataService.create('a2a_task', 'communication_adapter', {
      system: { source: 'communication_adapter', component: 'task' },
      content: {
        category: 'agent_task',
        tags: ['task', payload.status],
        sensitivity: 'internal',
        relevanceScore: 0.7,
        contextDependency: 'session',
      },
      extra: { ...payload, ...payload.extra },
      temporal: {
        created: ts,
        updated: ts,
        contextSnapshot: {
          timeOfDay: ts.contextual?.timeOfDay || 'unknown',
          dayOfWeek: new Date(ts.utc).toLocaleDateString('en-US', { weekday: 'long' }),
          businessContext: true,
          energyContext: 'standard',
        },
      },
    });
    return this.memory.addMemory({
      content: `A2A Task: ${payload.taskId}`,
      metadata: {
        ...metadata,
        type: 'system_task',
      },
    });
  }

  /**
   * Update a discussion aggregate record (maintains legacy search semantics with full JSON content)
   */
  async persistDiscussionUpdate(payload: {
    discussion: unknown; // full discussion object JSON stringified as content
    discussionId: string;
    topic: string;
    participants: string[];
    status?: string;
    messageCount?: number;
    lastContributor?: string;
    updatedBy?: string;
    extra?: Record<string, unknown>;
  }): Promise<string> {
    const ts = createUnifiedTimestamp();
    const metadata = unifiedMetadataService.create('agent_discussion', 'communication_adapter', {
      system: { source: 'communication_adapter', component: 'discussion_update' },
      content: {
        category: 'agent_coordination',
        tags: ['discussion', 'update', ...payload.participants.map((p) => `agent:${p}`)],
        sensitivity: 'internal',
        relevanceScore: 0.85,
        contextDependency: 'session',
      },
      extra: {
        discussionId: payload.discussionId,
        topic: payload.topic,
        participants: payload.participants.join(','),
        status: payload.status,
        messageCount: payload.messageCount,
        lastContributor: payload.lastContributor,
        updatedBy: payload.updatedBy,
        ...payload.extra,
      },
      temporal: {
        created: ts,
        updated: ts,
        contextSnapshot: {
          timeOfDay: ts.contextual?.timeOfDay || 'unknown',
          dayOfWeek: new Date(ts.utc).toLocaleDateString('en-US', { weekday: 'long' }),
          businessContext: true,
          energyContext: 'standard',
        },
      },
    });
    return this.memory.addMemory({
      content: JSON.stringify(payload.discussion),
      metadata: {
        ...metadata,
        type: 'system_discussion',
      },
    });
  }

  async storeRecord(
    type: string,
    content: string,
    extra: Record<string, unknown>,
  ): Promise<string> {
    const ts = createUnifiedTimestamp();
    const metadata = unifiedMetadataService.create(type, 'communication_adapter', {
      content: {
        category: 'agent_comm',
        tags: [type],
        sensitivity: 'internal',
        relevanceScore: 0.5,
        contextDependency: 'global',
      },
      extra,
      temporal: {
        created: ts,
        updated: ts,
        contextSnapshot: {
          timeOfDay: ts.contextual?.timeOfDay || 'unknown',
          dayOfWeek: new Date(ts.utc).toLocaleDateString('en-US', { weekday: 'long' }),
          businessContext: true,
          energyContext: 'standard',
        },
      },
    });
    return this.memory.addMemory({
      content,
      metadata: {
        ...metadata,
        type: 'system_comm',
      },
    });
  }
}
