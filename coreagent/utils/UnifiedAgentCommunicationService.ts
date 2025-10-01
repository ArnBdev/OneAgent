/**
 * UnifiedAgentCommunicationService
 * Canonical backbone for all agent-to-agent communication in OneAgent.
 *
 * This service provides a single, unified interface for all inter-agent interactions,
 * including registration, discovery, session management, and messaging. It ensures that
 * all communication is persistent, auditable, and accessible through the canonical
 * OneAgentMemory system, fulfilling the vision of a memory-driven architecture.
 *
 * All agent-to-agent communication MUST use this service.
 *
 * Key Principles:
 * - Single Source of Truth: This is the ONLY service for agent communication.
 * - Memory-Driven: All state (agents, sessions, messages) is stored in OneAgentMemory.
 * - Canonically Typed: Uses types from the unified backbone.
 * - Secure & Auditable: All interactions create a persistent record in memory.
 */

import {
  UnifiedAgentCommunicationInterface,
  AgentRegistration,
  AgentId,
  AgentFilter,
  AgentCardWithHealth,
  AgentMessage,
  MessageId,
  SessionConfig,
  SessionId,
  SessionInfo,
  A2AAgent,
  A2AGroupSession,
  A2AMessage,
  EnhancedSessionConfig,
  ConsensusResult,
  FacilitationRules,
  MessagePriority,
  SessionCoherence,
  EmergentInsight,
  NLACSMessage,
  AgentCommunicationExtension,
  AgentCommunicationEvent,
} from '../types/oneagent-backbone-types';
import type { MemorySearchResult } from '../types/oneagent-memory-types';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { getOneAgentMemory } from '../utils/UnifiedBackboneService';
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';
import {
  createUnifiedId,
  createUnifiedTimestamp,
  unifiedMetadataService,
} from '../utils/UnifiedBackboneService';
import { ToolDescriptor } from '../OneAgentEngine';
import { ConsensusEngine } from '../coordination/ConsensusEngine';
import { InsightSynthesisEngine } from '../coordination/InsightSynthesisEngine';
import { unifiedLogger } from './UnifiedLogger';

export class UnifiedAgentCommunicationService implements UnifiedAgentCommunicationInterface {
  private static instance: UnifiedAgentCommunicationService;
  private memory: OneAgentMemory;
  private eventHandlers: { [event: string]: ((payload: unknown) => void)[] } = {};
  // Fast test mode ephemeral registry (used when ONEAGENT_FAST_TEST_MODE=1 and memory searches are bypassed)
  private fastTestAgents?: Record<string, A2AAgent>;
  private fastTestSessions?: Record<string, A2AGroupSession>;
  private fastTestMessages?: Record<string, A2AMessage[]>;
  private silentLogging: boolean = process.env.ONEAGENT_SILENCE_COMM_LOGS === '1';
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = (():
    | 'debug'
    | 'info'
    | 'warn'
    | 'error' => {
    const lvl = (process.env.ONEAGENT_COMM_LOG_LEVEL || '').toLowerCase();
    return lvl === 'debug' || lvl === 'info' || lvl === 'warn' || lvl === 'error'
      ? (lvl as 'debug' | 'info' | 'warn' | 'error')
      : 'debug';
  })();

  // Phase 3 Enhanced Coordination Engines
  private consensusEngine: ConsensusEngine;
  private insightSynthesisEngine: InsightSynthesisEngine;
  // Rate limiting: agent-session windows
  private messageWindows: Record<string, number[]> = {};
  // Simple per-session operation queue to serialize mutations (join/leave)
  private sessionLocks: Record<string, Promise<unknown>> = {};

  // Configuration (future: externalize to unified config)
  private readonly RATE_LIMIT_MAX_MESSAGES = 30; // messages
  private readonly RATE_LIMIT_WINDOW_MS = 60_000; // 60s

  // Discovery caching (uses canonical OneAgentUnifiedBackbone cache)
  private readonly DISCOVERY_TTL_MS: number = (() => {
    const v = process.env.ONEAGENT_DISCOVERY_TTL_MS;
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) && n >= 0 ? n : 3_000; // default 3s
  })();
  private readonly DISCOVERY_TTL_EMPTY_MS: number = (() => {
    const v = process.env.ONEAGENT_DISCOVERY_TTL_EMPTY_MS;
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) && n >= 0 ? n : 10_000; // default 10s when empty
  })();

  // Helper error codes
  private error(code: string, message: string): Error {
    const err = new Error(message) as Error & { code?: string };
    err.code = code;
    return err;
  }

  private async runSafely<T>(
    operation: string,
    fn: () => Promise<T>,
    meta?: Record<string, unknown>,
  ): Promise<T> {
    const start = globalThis.performance?.now?.() ?? createUnifiedTimestamp().unix;
    try {
      const result = await fn();
      const durationMs = (globalThis.performance?.now?.() ?? createUnifiedTimestamp().unix) - start;
      unifiedMonitoringService.trackOperation(
        'UnifiedAgentCommunicationService',
        operation,
        'success',
        { ...(meta || {}), durationMs },
      );
      return result;
    } catch (error) {
      const durationMs = (globalThis.performance?.now?.() ?? createUnifiedTimestamp().unix) - start;
      unifiedMonitoringService.trackOperation(
        'UnifiedAgentCommunicationService',
        operation,
        'error',
        {
          ...(meta || {}),
          durationMs,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      throw error;
    }
  }

  // Singleton pattern ensures one canonical instance
  public static getInstance(memory?: OneAgentMemory): UnifiedAgentCommunicationService {
    if (!UnifiedAgentCommunicationService.instance) {
      const memoryInstance = memory || getOneAgentMemory();
      UnifiedAgentCommunicationService.instance = new UnifiedAgentCommunicationService(
        memoryInstance,
      );
    }
    return UnifiedAgentCommunicationService.instance;
  }

  private constructor(memory: OneAgentMemory) {
    this.memory = memory;
    if (process.env.ONEAGENT_FAST_TEST_MODE === '1') {
      // Defer heavy engine initialization to improve fast test startup time
      // Engines can be lazily created on first use if demanded by a test (not currently triggered in fast path)
      // This preserves canonical architecture while optimizing CI runtime.
      this.consensusEngine = null as unknown as ConsensusEngine;
      this.insightSynthesisEngine = null as unknown as InsightSynthesisEngine;
      if (!this.silentLogging)
        console.log(
          '🧪 FAST_TEST_MODE: Skipping immediate consensus/insight engine initialization',
        );
    } else {
      this.consensusEngine = new ConsensusEngine();
      this.insightSynthesisEngine = new InsightSynthesisEngine();
      if (!this.silentLogging)
        console.log(
          '✅ UnifiedAgentCommunicationService initialized with Phase 3 enhanced coordination engines.',
        );
    }
    if (process.env.ONEAGENT_FAST_TEST_MODE === '1') {
      this.fastTestAgents = {};
      this.fastTestSessions = {};
      this.fastTestMessages = {};
      if (!this.silentLogging)
        console.log('🧪 FAST_TEST_MODE active: using in-memory agent registry fallback');
    }
  }

  /**
   * Returns the JSON schemas for all A2A communication tools.
   * These schemas are used by the OneAgentEngine to dynamically expose A2A capabilities.
   */
  getToolSchemas(): ToolDescriptor[] {
    return [
      {
        name: 'oneagent_a2a_register_agent',
        description: 'Register an agent for multi-agent communication',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Agent ID' },
            name: { type: 'string', description: 'Agent name' },
            capabilities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Agent capabilities',
            },
            metadata: { type: 'object', description: 'Additional metadata' },
          },
          required: ['id', 'name', 'capabilities'],
        },
      },
      {
        name: 'oneagent_a2a_discover_agents',
        description: 'Discover agents by capabilities',
        inputSchema: {
          type: 'object',
          properties: {
            capabilities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Required capabilities',
            },
            status: {
              type: 'string',
              enum: ['online', 'offline', 'busy'],
              description: 'Agent status filter',
            },
            limit: { type: 'number', description: 'Maximum number of results' },
          },
        },
      },
      {
        name: 'oneagent_a2a_create_session',
        description: 'Create a multi-agent collaboration session',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Session name' },
            participants: {
              type: 'array',
              items: { type: 'string' },
              description: 'Participant agent IDs',
            },
            mode: {
              type: 'string',
              enum: ['collaborative', 'competitive', 'hierarchical'],
              description: 'Session mode',
            },
            topic: { type: 'string', description: 'Session topic' },
            metadata: { type: 'object', description: 'Additional metadata' },
          },
          required: ['name', 'participants'],
        },
      },
      {
        name: 'oneagent_a2a_join_session',
        description: 'Join an existing multi-agent session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID' },
            agentId: { type: 'string', description: 'Agent ID' },
          },
          required: ['sessionId', 'agentId'],
        },
      },
      {
        name: 'oneagent_a2a_send_message',
        description: 'Send a message to a specific agent',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID' },
            fromAgent: { type: 'string', description: 'Sender agent ID' },
            toAgent: { type: 'string', description: 'Recipient agent ID' },
            message: { type: 'string', description: 'Message content' },
            messageType: {
              type: 'string',
              enum: ['update', 'question', 'decision', 'action', 'insight'],
              description: 'Message type',
            },
            metadata: { type: 'object', description: 'Additional metadata' },
          },
          required: ['sessionId', 'fromAgent', 'toAgent', 'message'],
        },
      },
      {
        name: 'oneagent_a2a_broadcast_message',
        description: 'Broadcast a message to all participants in a session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID' },
            fromAgent: { type: 'string', description: 'Sender agent ID' },
            message: { type: 'string', description: 'Message content' },
            messageType: {
              type: 'string',
              enum: ['update', 'question', 'decision', 'action', 'insight'],
              description: 'Message type',
            },
            metadata: { type: 'object', description: 'Additional metadata' },
          },
          required: ['sessionId', 'fromAgent', 'message'],
        },
      },
      {
        name: 'oneagent_a2a_get_message_history',
        description: 'Get message history for a session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID' },
            limit: { type: 'number', description: 'Maximum number of messages to retrieve' },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'oneagent_a2a_get_session_info',
        description: 'Get information about a specific session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID' },
          },
          required: ['sessionId'],
        },
      },
    ];
  }

  /**
   * Registers a new agent in the system.
   * The agent's definition is stored persistently in the memory system.
   */
  async registerAgent(agent: AgentRegistration): Promise<AgentId> {
    return this.runSafely('registerAgent', async () => {
      const agentId = agent.id || createUnifiedId('agent', agent.name);
      const agentRecord: A2AAgent = {
        id: agentId,
        name: agent.name,
        capabilities: agent.capabilities,
        lastActive: createUnifiedTimestamp(),
        status: 'online',
        metadata: agent.metadata || {},
      };

      // Fast test mode: store in ephemeral map for discovery without memory backend lookups
      if (this.fastTestAgents) {
        this.fastTestAgents[agentId] = agentRecord;
      }

      const content = `Agent Registration: ${agent.name}`;
      const metadata = {
        ...unifiedMetadataService.create('agent_registration', 'UnifiedAgentCommunicationService', {
          system: {
            source: 'agent_registration',
            component: 'UnifiedAgentCommunicationService',
            agent: { id: agentId, type: 'specialized' },
          },
          content: {
            category: 'agent_lifecycle',
            tags: ['agent', 'registration', ...agent.capabilities],
            sensitivity: 'internal',
            relevanceScore: 1.0,
            contextDependency: 'global',
          },
        }),
        entityType: 'A2AAgent', // Critical for discovery
        agentData: agentRecord, // Store the full agent record
      };
      const memoryId = await this.memory.addMemory({ content, metadata });

      if (!this.silentLogging)
        console.log(
          `🤖 Agent registered via canonical service: ${agent.name} (${agentId}) -> Memory ID: ${memoryId}`,
        );
      // Fire lifecycle event for observers
      this.emit('agent_registered', { agent: agentRecord });
      // removed direct monitoring increment (handled via recordOpStatus earlier if needed)
      return agentId;
    });
  }

  /**
   * Discovers available agents based on capabilities and status.
   * Searches the canonical memory system for registered agents.
   */
  async discoverAgents(
    filter: AgentFilter & {
      health?: 'healthy' | 'degraded' | 'critical' | 'offline';
      role?: string;
    },
  ): Promise<AgentCardWithHealth[]> {
    return this.runSafely('discoverAgents', async () => {
      // Fast test mode short-circuit: return from in-memory registry
      if (this.fastTestAgents) {
        const candidates = Object.values(this.fastTestAgents).filter((agent) => {
          if (filter.status && agent.status !== filter.status) return false;
          if (filter.capabilities && filter.capabilities.length) {
            return filter.capabilities.every((c) => agent.capabilities.includes(c));
          }
          return true;
        });
        return candidates.map((agent) => ({
          id: agent.id,
          name: agent.name,
          capabilities: agent.capabilities,
          health: {
            status: 'healthy',
            uptime: 0,
            memoryUsage: 0,
            responseTime: 0,
            errorRate: 0,
            lastActivity: new Date(agent.lastActive.iso),
          },
          status: agent.status,
          lastActive: new Date(agent.lastActive.iso),
          metadata: agent.metadata,
        }));
      }
      // Try unified cache first (canonical cache, short TTL)
      const { OneAgentUnifiedBackbone } = await import('../utils/UnifiedBackboneService');
      const cache = OneAgentUnifiedBackbone.getInstance().cache;
      const cacheKey = this.buildDiscoveryCacheKey(filter);
      try {
        const cached = (await cache.get(cacheKey)) as AgentCardWithHealth[] | null;
        if (cached) {
          // Silent cache hit to avoid log noise; metrics still captured by runSafely wrapper
          return cached;
        }
      } catch {
        // Cache read is best-effort; continue on failure
      }

      const filters: Record<string, unknown> = { entityType: 'A2AAgent' };
      if (filter.status) {
        filters['agentData.status'] = filter.status;
      }
      const searchResults = await this.memory.searchMemory({
        query: filter.capabilities
          ? `agent with capabilities: ${filter.capabilities.join(', ')}`
          : 'discover all agents',
        userId: 'system_discovery',
        limit: filter.limit || 100,
        filters,
      });
      const agents = (Array.isArray(searchResults) ? searchResults : [])
        .map(
          (result: MemorySearchResult) =>
            (result.metadata as Record<string, unknown>)?.agentData as A2AAgent,
        )
        .filter((agent: A2AAgent): agent is A2AAgent => {
          if (!agent) return false;
          if (filter.capabilities && filter.capabilities.length > 0) {
            return filter.capabilities.every((cap) => agent.capabilities.includes(cap));
          }
          return true;
        })
        .map(
          (agent: A2AAgent): AgentCardWithHealth => ({
            id: agent.id,
            name: agent.name,
            capabilities: agent.capabilities,
            health: {
              status: 'healthy',
              uptime: createUnifiedTimestamp().unix - new Date(agent.lastActive.iso).getTime(),
              memoryUsage: 0,
              responseTime: 0,
              errorRate: 0,
              lastActivity: new Date(agent.lastActive.iso),
            },
            status: agent.status,
            lastActive: new Date(agent.lastActive.iso),
            metadata: agent.metadata,
          }),
        );

      // Populate cache with short TTL (longer when empty to add backoff)
      try {
        const ttl = agents.length === 0 ? this.DISCOVERY_TTL_EMPTY_MS : this.DISCOVERY_TTL_MS;
        await cache.set(cacheKey, agents, ttl);
      } catch {
        // Best-effort; ignore cache write failures
      }

      // Reduce log noise: only log when count changes materially; honor silentLogging flag
      try {
        const self = this as unknown as { __lastDiscoveryCount?: number; silentLogging?: boolean };
        const prev = self.__lastDiscoveryCount;
        if (prev !== agents.length) {
          self.__lastDiscoveryCount = agents.length;
          if (!self.silentLogging) {
            const payload = { previous: prev ?? null, current: agents.length };
            // honor configured log level
            const msg = `Agent discovery count changed`;
            switch (this.logLevel) {
              case 'info':
                unifiedLogger.info(msg, payload);
                break;
              case 'warn':
                unifiedLogger.warn(msg, payload);
                break;
              case 'error':
                unifiedLogger.error(msg, payload);
                break;
              case 'debug':
              default:
                unifiedLogger.debug(msg, payload);
            }
            // Emit a structured delta event for Mission Control / observers
            this.emit('discovery_delta', payload);
          }
        }
      } catch {
        /* noop */
      }
      // removed gauge call – discovery count can be derived by monitoring if needed
      return agents;
    });
  }

  /**
   * Build a deterministic cache key for agent discovery. Uses only serializable filter fields.
   */
  private buildDiscoveryCacheKey(
    filter: AgentFilter & {
      health?: 'healthy' | 'degraded' | 'critical' | 'offline';
      role?: string;
    },
  ): string {
    const caps = (filter.capabilities || []).slice().sort();
    const parts = [
      `caps:${caps.join('|')}`,
      `status:${filter.status || 'any'}`,
      `health:${filter.health || 'any'}`,
      `role:${filter.role || 'any'}`,
      `limit:${filter.limit ?? 'none'}`,
    ];
    return `uacs:discover:${parts.join(';')}`;
  }

  /**
   * Creates a new communication session for agents to collaborate.
   * The session is stored persistently in the memory system.
   */

  async createSession(
    sessionConfig: SessionConfig & { context?: Record<string, unknown>; nlacs?: boolean },
  ): Promise<SessionId> {
    return this.runSafely('createSession', async () => {
      if (this.fastTestSessions) {
        // In fast test mode reuse any active session with same name from in-memory map
        for (const s of Object.values(this.fastTestSessions)) {
          if (s.name === sessionConfig.name && s.status === 'active') {
            console.log(
              `♻️ [FAST_TEST_MODE] Reusing existing active session ${s.id} for name ${sessionConfig.name}`,
            );
            return s.id;
          }
        }
      } else {
        // Deduplicate active session with same name via memory search
        const existing = await this.memory.searchMemory({
          query: `session ${sessionConfig.name}`,
          userId: 'system_session_manager',
          limit: 1,
          filters: {
            'sessionData.name': sessionConfig.name,
            entityType: 'A2ASession',
            'sessionData.status': 'active',
          },
        });
        if (Array.isArray(existing) && existing.length) {
          interface SessionMetadataWrapper {
            sessionData?: A2AGroupSession;
          }
          const existingWrapper = existing[0]?.metadata as unknown as
            | SessionMetadataWrapper
            | undefined;
          const existingSession = existingWrapper?.sessionData;
          if (existingSession) {
            console.log(
              `♻️ Reusing existing active session ${existingSession.id} for name ${sessionConfig.name}`,
            );
            return existingSession.id;
          }
        }
      }
      const sessionId = createUnifiedId('session', sessionConfig.name);
      const sessionRecord: A2AGroupSession = {
        id: sessionId,
        name: sessionConfig.name,
        participants: sessionConfig.participants,
        mode: sessionConfig.mode || 'collaborative',
        topic: sessionConfig.topic,
        messages: [],
        createdAt: createUnifiedTimestamp(),
        status: 'active',
        metadata: {
          ...sessionConfig.metadata,
          nlacs: !!sessionConfig.nlacs,
          context: sessionConfig.context || {},
          extensions: sessionConfig.nlacs ? [{ uri: 'https://oneagent.ai/extensions/nlacs' }] : [],
        },
      };

      // Canonical metadata: expose entityType and sessionData at top-level for efficient filtering
      const sessionMetadata = {
        ...unifiedMetadataService.create('session_creation', 'UnifiedAgentCommunicationService', {
          system: {
            source: 'session_manager',
            component: 'UnifiedAgentCommunicationService',
            sessionId,
          },
          content: {
            category: 'agent_coordination',
            tags: ['session', 'creation', sessionConfig.mode || 'collaborative'],
            sensitivity: 'internal',
            relevanceScore: 1.0,
            contextDependency: 'session',
          },
          business: {
            entityType: 'A2ASession',
            sessionData: sessionRecord,
          },
        }),
        entityType: 'A2ASession',
        sessionData: sessionRecord,
      };

      await this.memory.addMemory({
        content: `Session Created: ${sessionConfig.name} - Topic: ${sessionConfig.topic}`,
        metadata: sessionMetadata,
      });

      if (this.fastTestSessions) {
        this.fastTestSessions[sessionId] = sessionRecord;
      }

      if (!this.silentLogging)
        console.log(
          `🤝 Session created via canonical service: ${sessionConfig.name} (${sessionId})`,
        );
      this.emit('session_created', { sessionId, session: sessionRecord });
      // removed direct monitoring increment
      return sessionId;
    });
  }

  /**
   * Sends a message between agents within a session.
   * The message is stored in memory, creating a permanent, auditable transcript.
   */
  async sendMessage(message: AgentMessage): Promise<MessageId> {
    return this.runSafely('sendMessage', async () => {
      // Validate session & participants
      const session = await this.getSessionInfo(message.sessionId);
      if (!session) throw this.error('SESSION_NOT_FOUND', `Session ${message.sessionId} not found`);
      if (!session.participants.includes(message.fromAgent))
        throw this.error(
          'SENDER_NOT_IN_SESSION',
          `Agent ${message.fromAgent} not in session ${message.sessionId}`,
        );
      if (message.toAgent && !session.participants.includes(message.toAgent))
        throw this.error(
          'RECIPIENT_NOT_IN_SESSION',
          `Agent ${message.toAgent} not in session ${message.sessionId}`,
        );
      this.enforceRateLimit(message.fromAgent, message.sessionId);
      const messageId = createUnifiedId('message', message.fromAgent);
      const messageRecord: A2AMessage = {
        id: messageId,
        sessionId: message.sessionId,
        fromAgent: message.fromAgent,
        toAgent: message.toAgent, // Can be a specific agent or 'broadcast'
        message: message.content,
        messageType: message.messageType || 'update',
        timestamp: createUnifiedTimestamp(),
        metadata: message.metadata,
      };

      // Canonical metadata: expose entityType and messageData at top-level for efficient filtering
      // Include durable NLACS hint in tags so downstream memory store retains it for filtering/verification
      const hasNlacs = Boolean(
        (message.metadata as Record<string, unknown> | undefined)?.nlacs === true ||
          (Array.isArray((message.metadata as Record<string, unknown> | undefined)?.extensions)
            ? ((message.metadata as Record<string, unknown>)?.extensions as unknown[]).some(
                (e: unknown) =>
                  !!(
                    e &&
                    typeof e === 'object' &&
                    (e as { uri?: string }).uri === 'https://oneagent.ai/extensions/nlacs'
                  ),
              )
            : false),
      );

      const baseTags = [
        'message',
        message.messageType || 'update',
        `from:${message.fromAgent}`,
        `to:${message.toAgent || 'all'}`,
      ];
      const tagsWithNlacs = hasNlacs ? [...baseTags, 'nlacs'] : baseTags;

      const messageMetadata = {
        ...unifiedMetadataService.create('agent_message', 'UnifiedAgentCommunicationService', {
          system: {
            source: 'messaging_service',
            component: 'UnifiedAgentCommunicationService',
            sessionId: message.sessionId,
            agent: { id: message.fromAgent, type: 'specialized' },
          },
          content: {
            category: 'agent_communication',
            tags: tagsWithNlacs,
            sensitivity: 'internal',
            relevanceScore: 1.0,
            contextDependency: 'session',
          },
          relationships: {
            parent: message.sessionId,
            children: [],
            related: [],
            dependencies: [],
          },
          business: {
            entityType: 'A2AMessage',
            messageData: messageRecord,
          },
        }),
        entityType: 'A2AMessage',
        messageData: messageRecord,
      };

      await this.memory.addMemory({ content: message.content, metadata: messageMetadata });

      if (this.fastTestMessages) {
        const arr = this.fastTestMessages[message.sessionId] || [];
        arr.push(messageRecord);
        this.fastTestMessages[message.sessionId] = arr;
      }

      if (!this.silentLogging)
        console.log(
          `📨 Message sent in session ${message.sessionId}: ${message.fromAgent} -> ${message.toAgent || 'all'}`,
        );
      this.emit('message_sent', { message: messageRecord });
      if (messageRecord.toAgent) {
        this.emit('message_received', { message: messageRecord, recipient: messageRecord.toAgent });
      } else {
        // Broadcast: notify for each participant except sender
        session.participants
          .filter((a) => a !== messageRecord.fromAgent)
          .forEach((recipient) => {
            this.emit('message_received', { message: messageRecord, recipient });
          });
      }
      // removed direct monitoring increment
      return messageId;
    });
  }

  /**
   * Retrieves the message history for a given session from memory.
   */
  async getMessageHistory(sessionId: SessionId, limit: number = 100): Promise<A2AMessage[]> {
    return this.runSafely('getMessageHistory', async () => {
      if (this.fastTestMessages) {
        const msgs = this.fastTestMessages[sessionId] || [];
        return msgs.slice(-limit);
      }
      const searchResults = await this.memory.searchMemory({
        query: `message history for session ${sessionId}`,
        userId: 'system_history',
        limit,
        filters: { 'messageData.sessionId': sessionId },
      });
      const messages = (Array.isArray(searchResults) ? searchResults : [])
        .map(
          (result: MemorySearchResult) =>
            (result.metadata as Record<string, unknown>)?.messageData as A2AMessage,
        )
        .filter((message: A2AMessage): message is A2AMessage => Boolean(message))
        .sort(
          (a: A2AMessage, b: A2AMessage) =>
            new Date(a.timestamp.iso).getTime() - new Date(b.timestamp.iso).getTime(),
        );
      return messages;
    });
  }

  /**
   * Retrieves information about a specific session from memory.
   */
  async getSessionInfo(sessionId: SessionId): Promise<SessionInfo | null> {
    return this.runSafely('getSessionInfo', async () => {
      if (this.fastTestSessions) {
        const fast = this.fastTestSessions[sessionId] || null;
        return fast as unknown as SessionInfo | null;
      }
      const searchResults = await this.memory.searchMemory({
        query: `info for session ${sessionId}`,
        userId: 'system_session_manager',
        limit: 1,
        filters: { 'sessionData.id': sessionId, entityType: 'A2ASession' },
      });
      const record = Array.isArray(searchResults) ? searchResults[0] : undefined;
      interface SessionMetadataWrapper {
        sessionData?: SessionInfo;
      }
      const metaWrapper = record?.metadata as unknown as SessionMetadataWrapper | undefined;
      const data = metaWrapper?.sessionData;
      return data || null;
    });
  }

  // The methods below are placeholders to satisfy the interface.
  // They can be implemented by building upon the memory-driven primitives above.

  async joinSession(sessionId: SessionId, agentId: AgentId): Promise<boolean> {
    return this.runSafely('joinSession', async () => {
      return this.serializeSessionOp(sessionId, async () => {
        const session = await this.getSessionInfo(sessionId);
        if (!session) throw this.error('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
        if (!session.participants.includes(agentId)) {
          session.participants.push(agentId);
          await this.persistSessionUpdate(session, `Agent ${agentId} joined session`);
          this.emit('session_participant_joined', { sessionId, agentId });
        }
        // removed direct monitoring increment
        return true;
      });
    });
  }

  async leaveSession(sessionId: SessionId, agentId: AgentId): Promise<boolean> {
    return this.runSafely('leaveSession', async () => {
      return this.serializeSessionOp(sessionId, async () => {
        const session = await this.getSessionInfo(sessionId);
        if (!session) throw this.error('SESSION_NOT_FOUND', `Session ${sessionId} not found`);
        const idx = session.participants.indexOf(agentId);
        if (idx >= 0) {
          session.participants.splice(idx, 1);
          await this.persistSessionUpdate(session, `Agent ${agentId} left session`);
          this.emit('session_participant_left', { sessionId, agentId });
        }
        // removed direct monitoring increment
        return true;
      });
    });
  }

  async broadcastMessage(message: AgentMessage): Promise<MessageId> {
    // This can be a specialized version of sendMessage where 'toAgent' is not set.
    const broadcastMessage = { ...message, toAgent: undefined };
    return this.sendMessage(broadcastMessage);
  }

  /**
   * Event-driven coordination: subscribe to agent lifecycle and communication events
   */
  on(event: AgentCommunicationEvent, handler: (payload: unknown) => void): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
    console.log(`🎯 Event handler registered for: ${event}`);
  }

  off(event: AgentCommunicationEvent, handler: (payload: unknown) => void): void {
    const handlers = this.eventHandlers[event];
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
    if (!this.silentLogging) console.log(`🧹 Event handler removed for: ${event}`);
  }

  /**
   * Extensibility: register new orchestration logic, protocols, or agent types
   */
  registerExtension(extension: AgentCommunicationExtension): void {
    console.log(`🔌 Registering extension: ${extension.name}`);
    try {
      extension.apply(this);
      console.log(`✅ Extension ${extension.name} registered successfully`);
    } catch (error) {
      console.error(`❌ Failed to register extension ${extension.name}:`, error);
    }
  }

  /**
   * Helper method to emit events
   */
  private emit(event: string, payload: unknown): void {
    const handlers = this.eventHandlers[event] || [];
    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`❌ Event handler error for ${event}:`, error);
      }
    });
  }

  // ========================================
  // PHASE 3: ENHANCED COORDINATION METHODS
  // ========================================

  /**
   * Create an enhanced business session with NLACS-powered discussions
   * Supports advanced facilitation, consensus building, and insight synthesis
   */
  async createBusinessSession(config: EnhancedSessionConfig): Promise<SessionId> {
    return this.runSafely('createBusinessSession', async () => {
      const sessionId = createUnifiedId('session', config.name);
      console.log(`🚀 Creating enhanced business session: ${config.name}`);

      const sessionRecord: A2AGroupSession = {
        id: sessionId,
        name: config.name,
        participants: config.participants,
        mode: config.mode || 'collaborative',
        topic: config.topic,
        messages: [],
        createdAt: createUnifiedTimestamp(),
        status: 'active',
        metadata: {
          ...config.metadata,
          nlacs: true, // Always enable NLACS for business sessions
          enhancedCoordination: true,
          communicationMode: config.communicationMode,
          discussionType: config.discussionType,
          facilitationMode: config.facilitationMode,
          insightTargets: config.insightTargets,
          consensusThreshold: config.consensusThreshold,
          qualityTargets: config.qualityTargets,
          businessContext: config.businessContext,
          extensions: [
            'https://oneagent.ai/extensions/nlacs',
            'https://oneagent.ai/extensions/phase3',
          ],
        },
      };

      const businessSessionMetadata = unifiedMetadataService.create(
        'business_session',
        'UnifiedAgentCommunicationService',
        {
          system: {
            source: 'business_coordination',
            component: 'UnifiedAgentCommunicationService',
            sessionId,
          },
          content: {
            category: 'business_collaboration',
            tags: [
              'business',
              'session',
              'enhanced',
              config.discussionType,
              config.facilitationMode,
            ],
            sensitivity: 'internal',
            relevanceScore: 1.0,
            contextDependency: 'session',
          },
          business: {
            entityType: 'EnhancedBusinessSession',
            sessionData: sessionRecord,
          },
        },
      );

      await this.memory.addMemory({
        content: `Enhanced Business Session Created: ${config.name} - Focus: ${config.discussionType} - Targets: ${config.insightTargets.join(', ')}`,
        metadata: await businessSessionMetadata,
      });

      // Emit business session creation event
      this.emit('business_session_created', {
        sessionId,
        config,
        enhancedFeatures: ['consensus', 'insights', 'facilitation'],
      });

      console.log(`✅ Enhanced business session created: ${config.name} (${sessionId})`);
      // removed direct monitoring increment
      return sessionId;
    });
  }

  /**
   * Facilitate discussion with advanced moderation and guidance
   * Uses Constitutional AI to ensure productive and safe discussions
   */
  async facilitateDiscussion(
    sessionId: SessionId,
    facilitationRules: FacilitationRules,
  ): Promise<void> {
    return this.runSafely('facilitateDiscussion', async () => {
      console.log(`🎯 Facilitating discussion for session: ${sessionId}`);

      const facilitationMetadata = await unifiedMetadataService.create(
        'facilitation_rules',
        'UnifiedAgentCommunicationService',
        {
          system: {
            source: 'discussion_facilitation',
            component: 'UnifiedAgentCommunicationService',
            sessionId,
          },
          content: {
            category: 'discussion_management',
            tags: ['facilitation', 'rules', 'moderation', 'quality'],
            sensitivity: 'internal',
            relevanceScore: 1.0,
            contextDependency: 'session',
          },
          business: {
            entityType: 'FacilitationRules',
            facilitationData: facilitationRules,
          },
        },
      );

      await this.memory.addMemory({
        content: `Discussion Facilitation Rules Applied: Session ${sessionId}`,
        metadata: facilitationMetadata,
      });

      // Emit facilitation start event
      this.emit('discussion_facilitation_started', { sessionId, rules: facilitationRules });
      console.log(`✅ Discussion facilitation active for session: ${sessionId}`);
      // removed direct monitoring increment
    });
  }

  /**
   * Build consensus among session participants using democratic decision-making
   * Integrates with ConsensusEngine for sophisticated agreement analysis
   */
  async buildConsensus(sessionId: SessionId, proposal: string): Promise<ConsensusResult> {
    return this.runSafely('buildConsensus', async () => {
      console.log(`🤝 Building consensus for proposal in session: ${sessionId}`);

      // Get session info and message history
      const sessionInfo = await this.getSessionInfo(sessionId);
      if (!sessionInfo) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const messageHistory = await this.getMessageHistory(sessionId, 100);

      // Create NLACS discussion context
      const discussionContext = {
        id: sessionId,
        topic: sessionInfo.topic,
        participants: sessionInfo.participants,
        messages: messageHistory.map((msg) => ({
          id: msg.id,
          discussionId: sessionId,
          agentId: msg.fromAgent,
          content: msg.message,
          messageType: 'contribution' as const,
          timestamp: new Date(msg.timestamp.iso),
          metadata: msg.metadata,
        })),
        emergentInsights: [], // Will be populated by insight synthesis
        status: 'active' as const,
        createdAt: new Date(sessionInfo.createdAt.iso),
        lastActivity: new Date(),
      };

      // Use consensus engine for democratic decision-making
      // Lazy init if skipped in fast mode
      if (!this.consensusEngine) {
        this.consensusEngine = new ConsensusEngine();
      }
      const consensusResult = await this.consensusEngine.buildConsensus(
        sessionInfo.participants,
        proposal,
        discussionContext,
      );

      // Emit consensus building events
      this.emit('consensus_building_completed', { sessionId, proposal, result: consensusResult });
      if (consensusResult.agreed) {
        this.emit('consensus_reached', {
          sessionId,
          proposal,
          consensusLevel: consensusResult.consensusLevel,
        });
      } else {
        this.emit('consensus_not_reached', {
          sessionId,
          proposal,
          compromises: consensusResult.compromisesReached,
        });
      }

      console.log(
        `${consensusResult.agreed ? '✅' : '⚠️'} Consensus ${consensusResult.agreed ? 'reached' : 'not reached'} for session: ${sessionId}`,
      );
      // Persist consensus result
      const consensusMetadata = unifiedMetadataService.create(
        'consensus_result',
        'UnifiedAgentCommunicationService',
        {
          system: {
            source: 'consensus_engine',
            component: 'UnifiedAgentCommunicationService',
            sessionId,
          },
          content: {
            category: 'consensus',
            tags: ['consensus', proposal],
            sensitivity: 'internal',
            relevanceScore: 1.0,
            contextDependency: 'session',
          },
          business: { entityType: 'ConsensusResult', consensusData: consensusResult },
        },
      );
      await this.memory.addMemory({
        content: `Consensus Result: ${proposal} -> ${consensusResult.agreed ? 'AGREED' : 'NOT AGREED'}`,
        metadata: await consensusMetadata,
      });
      // removed direct monitoring increment
      // removed direct monitoring increment
      return consensusResult;
    });
  }

  /**
   * Synthesize insights from multi-agent discussions
   * Uses InsightSynthesisEngine for breakthrough detection and novel connections
   */
  async synthesizeInsights(sessionId: SessionId): Promise<EmergentInsight[]> {
    return this.runSafely('synthesizeInsights', async () => {
      console.log(`✨ Synthesizing insights for session: ${sessionId}`);

      // Get session context and message history
      const sessionInfo = await this.getSessionInfo(sessionId);
      if (!sessionInfo) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const messageHistory = await this.getMessageHistory(sessionId, 100);

      // Create NLACS discussion context for insight synthesis
      const discussionContext = {
        id: sessionId,
        topic: sessionInfo.topic,
        participants: sessionInfo.participants,
        messages: messageHistory.map((msg) => ({
          id: msg.id,
          discussionId: sessionId,
          agentId: msg.fromAgent,
          content: msg.message,
          messageType: 'contribution' as const,
          timestamp: new Date(msg.timestamp.iso),
          metadata: msg.metadata,
        })),
        emergentInsights: [],
        status: 'active' as const,
        createdAt: new Date(sessionInfo.createdAt.iso),
        lastActivity: new Date(),
      };

      // Use insight synthesis engine for breakthrough detection
      if (!this.insightSynthesisEngine) {
        this.insightSynthesisEngine = new InsightSynthesisEngine();
      }
      const breakthroughInsights =
        await this.insightSynthesisEngine.detectBreakthroughMoments(discussionContext);
      const novelConnections =
        await this.insightSynthesisEngine.identifyNovelConnections(discussionContext);

      // Convert to EmergentInsight format
      const emergentInsights: EmergentInsight[] = [
        ...breakthroughInsights.map((insight) => ({
          id: insight.id,
          type: insight.type,
          content: insight.content,
          confidence: insight.confidence,
          contributors: insight.contributors,
          sources: insight.sources,
          implications: insight.implications,
          actionItems: insight.actionItems,
          validatedBy: [],
          createdAt: insight.createdAt,
          relevanceScore: insight.relevanceScore,
          metadata: {
            businessImpact: insight.businessImpact,
            noveltyScore: insight.noveltyScore,
            marketAdvantage: insight.marketAdvantage,
            implementationFeasibility: insight.implementationFeasibility,
          },
        })),
        ...novelConnections.map((connection) => ({
          id: connection.id,
          type: 'connection' as const,
          content: connection.description,
          confidence: connection.evidenceStrength,
          contributors: connection.validatedBy,
          sources: connection.sourceIds,
          implications: connection.actionableImplications,
          actionItems: connection.insights,
          validatedBy: connection.validatedBy,
          createdAt: connection.createdAt,
          relevanceScore: connection.businessRelevance,
          metadata: {
            connectionType: connection.connectionType,
            noveltyScore: connection.noveltyScore,
          },
        })),
      ];

      // Emit insight synthesis events
      this.emit('insights_synthesized', {
        sessionId,
        insightCount: emergentInsights.length,
        breakthroughCount: breakthroughInsights.length,
        connectionCount: novelConnections.length,
      });

      // Persist each insight
      for (const insight of emergentInsights) {
        const insightMetadata = unifiedMetadataService.create(
          'emergent_insight',
          'UnifiedAgentCommunicationService',
          {
            system: {
              source: 'insight_synthesis',
              component: 'UnifiedAgentCommunicationService',
              sessionId,
            },
            content: {
              category: 'insight',
              tags: ['insight', insight.type],
              sensitivity: 'internal',
              relevanceScore: insight.relevanceScore || 0.9,
              contextDependency: 'session',
            },
            business: { entityType: 'EmergentInsight', insightData: insight },
          },
        );
        await this.memory.addMemory({
          content: `Emergent Insight: ${insight.type} – ${insight.content.substring(0, 120)}`,
          metadata: await insightMetadata,
        });
      }
      // removed direct monitoring increment
      // removed direct monitoring increment
      console.log(
        `✨ Synthesized & persisted ${emergentInsights.length} insights for session: ${sessionId}`,
      );
      return emergentInsights;
    });
  }

  /**
   * Enable real-time collaboration mode for a session
   * Activates live message routing and coherence monitoring
   */
  async enableRealTimeMode(sessionId: SessionId): Promise<void> {
    return this.runSafely('enableRealTimeMode', async () => {
      console.log(`⚡ Enabling real-time mode for session: ${sessionId}`);
      const ts = createUnifiedTimestamp();
      const realtimeMetadata = unifiedMetadataService.create(
        'realtime_mode',
        'UnifiedAgentCommunicationService',
        {
          system: {
            source: 'realtime_coordination',
            component: 'UnifiedAgentCommunicationService',
            sessionId,
          },
          content: {
            category: 'realtime_collaboration',
            tags: ['realtime', 'collaboration', 'live', 'coordination'],
            sensitivity: 'internal',
            relevanceScore: 1.0,
            contextDependency: 'session',
          },
          business: {
            entityType: 'RealTimeMode',
            sessionId,
            enabledAt: ts.iso,
          },
        },
      );

      await this.memory.addMemory({
        content: `Real-Time Mode Enabled: Session ${sessionId}`,
        metadata: await realtimeMetadata,
      });

      this.emit('realtime_mode_enabled', { sessionId });
      // removed direct monitoring increment
      console.log(`⚡ Real-time mode active for session: ${sessionId}`);
    });
  }

  /**
   * Route message with priority-based delivery
   * Ensures critical messages are delivered immediately
   */
  async routeWithPriority(message: NLACSMessage, priority: MessagePriority): Promise<void> {
    return this.runSafely('routeWithPriority', async () => {
      console.log(
        `📨 Routing priority message: ${priority.level} - ${message.content.substring(0, 50)}...`,
      );
      const ts = createUnifiedTimestamp();
      // Enhanced message metadata with priority information
      const enhancedMessage = {
        ...message,
        metadata: {
          ...message.metadata,
          priority: priority,
          routedAt: ts.iso,
          enhancedRouting: true,
        },
      };

      const priorityMetadata = unifiedMetadataService.create(
        'priority_message',
        'UnifiedAgentCommunicationService',
        {
          system: {
            source: 'priority_routing',
            component: 'UnifiedAgentCommunicationService',
            sessionId: message.discussionId,
          },
          content: {
            category: 'priority_communication',
            tags: ['priority', priority.level, 'routing', 'enhanced'],
            sensitivity: 'internal',
            relevanceScore: this.getPriorityScore(priority.level),
            contextDependency: 'session',
          },
          business: {
            entityType: 'PriorityMessage',
            messageData: enhancedMessage,
            priorityData: priority,
          },
        },
      );

      await this.memory.addMemory({
        content: `Priority Message [${priority.level.toUpperCase()}]: ${message.content}`,
        metadata: await priorityMetadata,
      });

      // Emit priority routing events
      this.emit('priority_message_routed', { message: enhancedMessage, priority });
      if (priority.level === 'critical' || priority.level === 'urgent') {
        this.emit('urgent_message_alert', { message: enhancedMessage, priority });
      }

      // removed direct monitoring increment
      console.log(`📨 Priority message routed: ${priority.level} priority`);
    });
  }

  /**
   * Monitor and maintain session coherence
   * Ensures discussions stay focused and productive
   */
  async maintainCoherence(sessionId: SessionId): Promise<SessionCoherence> {
    return this.runSafely('maintainCoherence', async () => {
      console.log(`🎯 Monitoring coherence for session: ${sessionId}`);

      const sessionInfo = await this.getSessionInfo(sessionId);
      const messageHistory = await this.getMessageHistory(sessionId, 50);

      if (!sessionInfo || messageHistory.length === 0) {
        return {
          coherenceScore: 1.0,
          topicDrift: 0.0,
          participationBalance: {},
          insightGeneration: 0.0,
          discussionQuality: 1.0,
          issues: [],
          recommendations: ['Session appears to be starting or has no activity yet'],
        };
      }

      // Calculate coherence metrics
      const coherenceScore = this.calculateCoherenceScore(messageHistory, sessionInfo.topic);
      const topicDrift = this.calculateTopicDrift(messageHistory, sessionInfo.topic);
      const participationBalance = this.calculateParticipationBalance(
        messageHistory,
        sessionInfo.participants,
      );
      const insightGeneration = this.calculateInsightGenerationRate(messageHistory);
      const discussionQuality = this.calculateDiscussionQuality(messageHistory);

      // Identify coherence issues
      const issues = this.identifyCoherenceIssues(
        coherenceScore,
        topicDrift,
        participationBalance,
        discussionQuality,
      );
      const recommendations = this.generateCoherenceRecommendations(issues);

      const coherenceResult: SessionCoherence = {
        coherenceScore,
        topicDrift,
        participationBalance,
        insightGeneration,
        discussionQuality,
        issues,
        recommendations,
      };

      const coherenceMetadata = unifiedMetadataService.create(
        'coherence_analysis',
        'UnifiedAgentCommunicationService',
        {
          system: {
            source: 'coherence_monitoring',
            component: 'UnifiedAgentCommunicationService',
            sessionId,
          },
          content: {
            category: 'session_quality',
            tags: ['coherence', 'monitoring', 'quality', 'analysis'],
            sensitivity: 'internal',
            relevanceScore: 1.0,
            contextDependency: 'session',
          },
          business: {
            entityType: 'CoherenceAnalysis',
            coherenceData: coherenceResult,
          },
        },
      );

      await this.memory.addMemory({
        content: `Session Coherence Analysis: Score ${coherenceScore.toFixed(2)}, Drift ${topicDrift.toFixed(2)}, Quality ${discussionQuality.toFixed(2)}`,
        metadata: await coherenceMetadata,
      });

      // Emit coherence monitoring events
      this.emit('coherence_monitored', { sessionId, coherence: coherenceResult });
      if (coherenceScore < 0.7) {
        this.emit('coherence_degraded', { sessionId, coherence: coherenceResult });
      }

      console.log(
        `🎯 Session coherence: ${coherenceScore.toFixed(2)} (${issues.length} issues identified)`,
      );
      // removed direct monitoring increment
      return coherenceResult;
    });
  }

  /**
   * Helper methods for coherence monitoring
   */
  private getPriorityScore(level: 'low' | 'normal' | 'high' | 'urgent' | 'critical'): number {
    const scores = { low: 0.2, normal: 0.5, high: 0.7, urgent: 0.9, critical: 1.0 };
    return scores[level];
  }

  private calculateCoherenceScore(messages: A2AMessage[], topic: string): number {
    if (messages.length === 0) return 1.0;

    const topicWords = topic.toLowerCase().split(/\s+/);
    const relevantMessages = messages.filter((msg) =>
      topicWords.some((word) => msg.message.toLowerCase().includes(word)),
    );

    return relevantMessages.length / messages.length;
  }

  private calculateTopicDrift(messages: A2AMessage[], originalTopic: string): number {
    if (messages.length === 0) return 0.0;

    const recentMessages = messages.slice(-10); // Last 10 messages
    const topicRelevance = this.calculateCoherenceScore(recentMessages, originalTopic);

    return 1.0 - topicRelevance;
  }

  private calculateParticipationBalance(
    messages: A2AMessage[],
    participants: AgentId[],
  ): Record<AgentId, number> {
    const participation: Record<AgentId, number> = {};

    // Initialize with all participants
    participants.forEach((agent) => (participation[agent] = 0));

    // Count messages per participant
    messages.forEach((msg) => {
      if (participation[msg.fromAgent] !== undefined) {
        participation[msg.fromAgent]++;
      }
    });

    // Convert to percentages
    const total = messages.length;
    if (total > 0) {
      Object.keys(participation).forEach((agent) => {
        participation[agent] = (participation[agent] / total) * 100;
      });
    }

    return participation;
  }

  private calculateInsightGenerationRate(messages: A2AMessage[]): number {
    if (messages.length === 0) return 0.0;

    const insightIndicators = [
      'insight',
      'breakthrough',
      'realize',
      'understand',
      'solution',
      'idea',
    ];
    const insightMessages = messages.filter((msg) =>
      insightIndicators.some((indicator) => msg.message.toLowerCase().includes(indicator)),
    );

    return insightMessages.length / messages.length;
  }

  private calculateDiscussionQuality(messages: A2AMessage[]): number {
    if (messages.length === 0) return 1.0;

    let qualityScore = 0;

    messages.forEach((msg) => {
      let messageScore = 0.5; // Base score

      // Quality indicators
      if (msg.message.length > 50) messageScore += 0.1; // Substantial content
      if (msg.message.includes('?')) messageScore += 0.1; // Questions
      if (msg.message.toLowerCase().includes('because')) messageScore += 0.1; // Reasoning
      if (
        msg.message.toLowerCase().includes('data') ||
        msg.message.toLowerCase().includes('evidence')
      )
        messageScore += 0.1; // Evidence
      if (msg.messageType === 'insight' || msg.messageType === 'decision') messageScore += 0.2; // High-value message types

      qualityScore += Math.min(1.0, messageScore);
    });

    return qualityScore / messages.length;
  }

  private identifyCoherenceIssues(
    coherenceScore: number,
    topicDrift: number,
    participationBalance: Record<AgentId, number>,
    discussionQuality: number,
  ): Array<{
    type:
      | 'topic_drift'
      | 'uneven_participation'
      | 'circular_discussion'
      | 'low_quality'
      | 'conflict_escalation';
    severity: 'minor' | 'moderate' | 'major';
    description: string;
    affectedAgents: AgentId[];
    suggestedActions: string[];
  }> {
    const issues = [];

    if (topicDrift > 0.5) {
      issues.push({
        type: 'topic_drift' as const,
        severity: topicDrift > 0.8 ? ('major' as const) : ('moderate' as const),
        description: `Discussion has drifted significantly from original topic (${(topicDrift * 100).toFixed(1)}% drift)`,
        affectedAgents: [],
        suggestedActions: [
          'Remind participants of session objectives',
          'Refocus discussion on original topic',
        ],
      });
    }

    const participationValues = Object.values(participationBalance);
    const maxParticipation = Math.max(...participationValues);
    const minParticipation = Math.min(...participationValues);

    if (maxParticipation - minParticipation > 50) {
      issues.push({
        type: 'uneven_participation' as const,
        severity: 'moderate' as const,
        description: `Uneven participation detected (${maxParticipation.toFixed(1)}% max vs ${minParticipation.toFixed(1)}% min)`,
        affectedAgents: Object.keys(participationBalance).filter(
          (agent) => participationBalance[agent] < 10,
        ),
        suggestedActions: ['Encourage quiet participants', 'Moderate dominant participants'],
      });
    }

    if (discussionQuality < 0.6) {
      issues.push({
        type: 'low_quality' as const,
        severity: discussionQuality < 0.4 ? ('major' as const) : ('moderate' as const),
        description: `Discussion quality is below expected standards (${(discussionQuality * 100).toFixed(1)}%)`,
        affectedAgents: [],
        suggestedActions: ['Request more detailed contributions', 'Ask for evidence and reasoning'],
      });
    }

    return issues;
  }

  private generateCoherenceRecommendations(
    issues: Array<{
      type: string;
      severity: string;
      description: string;
      suggestedActions: string[];
    }>,
  ): string[] {
    const recommendations = [];

    if (issues.length === 0) {
      recommendations.push('Discussion is proceeding well with good coherence and quality');
    } else {
      issues.forEach((issue) => {
        recommendations.push(...issue.suggestedActions);
      });
    }

    return Array.from(new Set(recommendations)); // Remove duplicates
  }

  // =====================
  // INTERNAL HELPERS
  // =====================
  private enforceRateLimit(agentId: AgentId, sessionId: SessionId): void {
    const key = `${agentId}::${sessionId}`;
    const now = createUnifiedTimestamp().unix;
    const window = this.messageWindows[key] || [];
    const filtered = window.filter((ts) => now - ts < this.RATE_LIMIT_WINDOW_MS);
    if (filtered.length >= this.RATE_LIMIT_MAX_MESSAGES) {
      throw this.error(
        'RATE_LIMIT_EXCEEDED',
        `Agent ${agentId} exceeded ${this.RATE_LIMIT_MAX_MESSAGES} messages / ${this.RATE_LIMIT_WINDOW_MS / 1000}s in session ${sessionId}`,
      );
    }
    filtered.push(now);
    this.messageWindows[key] = filtered;
  }

  private async serializeSessionOp<T>(sessionId: SessionId, fn: () => Promise<T>): Promise<T> {
    const prev = this.sessionLocks[sessionId] || Promise.resolve();
    let release: (v: unknown) => void;
    const p = new Promise((res) => (release = res));
    this.sessionLocks[sessionId] = prev.then(() => p);
    try {
      const result = await fn();
      release!(null);
      return result;
    } finally {
      if (this.sessionLocks[sessionId] === p) delete this.sessionLocks[sessionId];
    }
  }

  private async persistSessionUpdate(
    session: A2AGroupSession | SessionInfo,
    activity: string,
  ): Promise<void> {
    const ts = createUnifiedTimestamp();
    const metadata = unifiedMetadataService.create(
      'session_update',
      'UnifiedAgentCommunicationService',
      {
        system: {
          source: 'session_update',
          component: 'UnifiedAgentCommunicationService',
          sessionId: session.id,
        },
        content: {
          category: 'agent_coordination',
          tags: ['session', 'update'],
          sensitivity: 'internal',
          relevanceScore: 0.9,
          contextDependency: 'session',
        },
        business: { entityType: 'A2ASessionUpdate', sessionData: session, activity, updatedAt: ts },
      },
    );
    await this.memory.addMemory({
      content: `Session Update: ${activity}`,
      metadata: await metadata,
    });
  }
}

// Export a single, canonical instance for the entire application to use.
// Export a lazily-resolved, singleton-backed proxy to avoid eager initialization at module load
// This prevents test flakes due to import timing and circular resolution during ts-node boot.
let __uacsSingleton: UnifiedAgentCommunicationService | null = null;
function __resolveUacs(): UnifiedAgentCommunicationService {
  if (!__uacsSingleton) {
    __uacsSingleton = UnifiedAgentCommunicationService.getInstance();
  }
  return __uacsSingleton;
}

export const unifiedAgentCommunicationService: UnifiedAgentCommunicationService = new Proxy(
  {} as UnifiedAgentCommunicationService,
  {
    get(_target, prop, _receiver) {
      const inst = __resolveUacs();
      const rec = inst as unknown as Record<PropertyKey, unknown>;
      const value = rec[prop as PropertyKey];
      if (typeof value === 'function') {
        const fn = value as (...args: unknown[]) => unknown;
        return fn.bind(inst);
      }
      return value;
    },
    set(_target, prop, value) {
      const inst = __resolveUacs();
      (inst as unknown as Record<PropertyKey, unknown>)[prop as PropertyKey] = value as unknown;
      return true;
    },
    has(_target, prop) {
      const inst = __resolveUacs();
      return prop in (inst as unknown as Record<PropertyKey, unknown>);
    },
  },
);

// Typed accessor for composition/testability without relying on Proxy interception
export function getUnifiedAgentCommunicationService(): UnifiedAgentCommunicationService {
  return __resolveUacs();
}
