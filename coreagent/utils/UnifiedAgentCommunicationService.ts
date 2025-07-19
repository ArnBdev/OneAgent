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
    AgentCard,
    AgentMessage,
    MessageId,
    SessionConfig,
    SessionId,
    SessionInfo,
    A2AAgent,
    A2AGroupSession,
    A2AMessage,
} from '../types/oneagent-backbone-types';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { createUnifiedId, createUnifiedTimestamp, unifiedMetadataService } from '../utils/UnifiedBackboneService';
import { ToolDescriptor } from '../OneAgentEngine';

export class UnifiedAgentCommunicationService implements UnifiedAgentCommunicationInterface {
    private static instance: UnifiedAgentCommunicationService;
    private memory: OneAgentMemory;

    // Singleton pattern ensures one canonical instance
    public static getInstance(): UnifiedAgentCommunicationService {
        if (!UnifiedAgentCommunicationService.instance) {
            // Pass the canonical memory system instance
            const memoryInstance = OneAgentMemory.getInstance();
            UnifiedAgentCommunicationService.instance = new UnifiedAgentCommunicationService(memoryInstance);
        }
        return UnifiedAgentCommunicationService.instance;
    }

    private constructor(memory: OneAgentMemory) {
        this.memory = memory;
        console.log('✅ UnifiedAgentCommunicationService initialized with canonical memory.');
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
                        capabilities: { type: 'array', items: { type: 'string' }, description: 'Agent capabilities' },
                        metadata: { type: 'object', description: 'Additional metadata' }
                    },
                    required: ['id', 'name', 'capabilities']
                }
            },
            {
                name: 'oneagent_a2a_discover_agents',
                description: 'Discover agents by capabilities',
                inputSchema: {
                    type: 'object',
                    properties: {
                        capabilities: { type: 'array', items: { type: 'string' }, description: 'Required capabilities' },
                        status: { type: 'string', enum: ['online', 'offline', 'busy'], description: 'Agent status filter' },
                        limit: { type: 'number', description: 'Maximum number of results' }
                    }
                }
            },
            {
                name: 'oneagent_a2a_create_session',
                description: 'Create a multi-agent collaboration session',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Session name' },
                        participants: { type: 'array', items: { type: 'string' }, description: 'Participant agent IDs' },
                        mode: { type: 'string', enum: ['collaborative', 'competitive', 'hierarchical'], description: 'Session mode' },
                        topic: { type: 'string', description: 'Session topic' },
                        metadata: { type: 'object', description: 'Additional metadata' }
                    },
                    required: ['name', 'participants']
                }
            },
            {
                name: 'oneagent_a2a_join_session',
                description: 'Join an existing multi-agent session',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sessionId: { type: 'string', description: 'Session ID' },
                        agentId: { type: 'string', description: 'Agent ID' }
                    },
                    required: ['sessionId', 'agentId']
                }
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
                        messageType: { type: 'string', enum: ['update', 'question', 'decision', 'action', 'insight'], description: 'Message type' },
                        metadata: { type: 'object', description: 'Additional metadata' }
                    },
                    required: ['sessionId', 'fromAgent', 'toAgent', 'message']
                }
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
                        messageType: { type: 'string', enum: ['update', 'question', 'decision', 'action', 'insight'], description: 'Message type' },
                        metadata: { type: 'object', description: 'Additional metadata' }
                    },
                    required: ['sessionId', 'fromAgent', 'message']
                }
            },
            {
                name: 'oneagent_a2a_get_message_history',
                description: 'Get message history for a session',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sessionId: { type: 'string', description: 'Session ID' },
                        limit: { type: 'number', description: 'Maximum number of messages to retrieve' }
                    },
                    required: ['sessionId']
                }
            },
            {
                name: 'oneagent_a2a_get_session_info',
                description: 'Get information about a specific session',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sessionId: { type: 'string', description: 'Session ID' }
                    },
                    required: ['sessionId']
                }
            }
        ];
    }

    /**
     * Registers a new agent in the system.
     * The agent's definition is stored persistently in the memory system.
     */
    async registerAgent(agent: AgentRegistration): Promise<AgentId> {
        const agentId = agent.id || createUnifiedId('agent', agent.name);
        const agentRecord: A2AAgent = {
            id: agentId,
            name: agent.name,
            capabilities: agent.capabilities,
            lastActive: createUnifiedTimestamp(),
            status: 'online',
            metadata: agent.metadata || {},
        };

        const memoryId = await this.memory.add({
            content: `Agent Registration: ${agent.name}`,
            user_id: 'system_registry', // System-level user for agent data
            metadata: {
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
                        contextDependency: 'global'
                    },
                }),
                entityType: 'A2AAgent', // Critical for discovery
                agentData: agentRecord, // Store the full agent record
            },
        });

        console.log(`🤖 Agent registered via canonical service: ${agent.name} (${agentId}) -> Memory ID: ${memoryId}`);
        return agentId;
    }

    /**
     * Discovers available agents based on capabilities and status.
     * Searches the canonical memory system for registered agents.
     */
    async discoverAgents(filter: AgentFilter): Promise<AgentCard[]> {
        const metadata_filter: Record<string, any> = { 'agentData.entityType': 'A2AAgent' };

        if (filter.status) {
            metadata_filter['agentData.status'] = filter.status;
        }

        const searchResults = await this.memory.search({
            query: filter.capabilities ? `agent with capabilities: ${filter.capabilities.join(', ')}` : 'discover all agents',
            user_id: 'system_discovery',
            limit: filter.limit || 100,
            metadata_filter: metadata_filter,
        });

        const agents = searchResults
            .map(result => result.metadata?.agentData as A2AAgent)
            .filter((agent): agent is A2AAgent => {
                if (!agent) return false;
                if (filter.capabilities && filter.capabilities.length > 0) {
                    return filter.capabilities.every(cap => agent.capabilities.includes(cap));
                }
                return true;
            });
        
        console.log(`🔍 Agent discovery found ${agents.length} agents.`);
        return agents;
    }

    /**
     * Creates a new communication session for agents to collaborate.
     * The session is stored persistently in the memory system.
     */
    async createSession(sessionConfig: SessionConfig): Promise<SessionId> {
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
            metadata: sessionConfig.metadata || {},
        };

        await this.memory.add({
            content: `Session Created: ${sessionConfig.name} - Topic: ${sessionConfig.topic}`,
            user_id: 'system_session_manager',
            metadata: {
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
                        contextDependency: 'session'
                    },
                }),
                entityType: 'A2ASession',
                sessionData: sessionRecord,
            },
        });

        console.log(`🤝 Session created via canonical service: ${sessionConfig.name} (${sessionId})`);
        return sessionId;
    }

    /**
     * Sends a message between agents within a session.
     * The message is stored in memory, creating a permanent, auditable transcript.
     */
    async sendMessage(message: AgentMessage): Promise<MessageId> {
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

        await this.memory.add({
            content: message.content,
            user_id: 'system_messaging',
            metadata: {
                ...unifiedMetadataService.create('agent_message', 'UnifiedAgentCommunicationService', {
                    system: {
                        source: 'messaging_service',
                        component: 'UnifiedAgentCommunicationService',
                        sessionId: message.sessionId,
                        agent: { id: message.fromAgent, type: 'specialized' },
                    },
                    content: {
                        category: 'agent_communication',
                        tags: ['message', message.messageType || 'update', `from:${message.fromAgent}`, `to:${message.toAgent || 'all'}`],
                        sensitivity: 'internal',
                        relevanceScore: 1.0,
                        contextDependency: 'session'
                    },
                    relationships: {
                        parent: message.sessionId,
                        children: [],
                        related: [],
                        dependencies: []
                    },
                }),
                entityType: 'A2AMessage',
                messageData: messageRecord,
            },
        });
        
        console.log(`📨 Message sent in session ${message.sessionId}: ${message.fromAgent} -> ${message.toAgent || 'all'}`);
        return messageId;
    }

    /**
     * Retrieves the message history for a given session from memory.
     */
    async getMessageHistory(sessionId: SessionId, limit: number = 100): Promise<A2AMessage[]> {
        const searchResults = await this.memory.search({
            query: `message history for session ${sessionId}`,
            user_id: 'system_history',
            limit,
            metadata_filter: { 'messageData.sessionId': sessionId },
        });

        const messages = searchResults
            .map(result => result.metadata?.messageData as A2AMessage)
            .filter((message): message is A2AMessage => Boolean(message))
            .sort((a, b) => new Date(a.timestamp.iso).getTime() - new Date(b.timestamp.iso).getTime());

        return messages;
    }

    /**
     * Retrieves information about a specific session from memory.
     */
    async getSessionInfo(sessionId: SessionId): Promise<SessionInfo | null> {
         const searchResults = await this.memory.search({
            query: `info for session ${sessionId}`,
            user_id: 'system_session_manager',
            limit: 1,
            metadata_filter: { 'sessionData.id': sessionId, entityType: 'A2ASession' },
        });

        if (searchResults.length > 0 && searchResults[0].metadata?.sessionData) {
            return searchResults[0].metadata?.sessionData as SessionInfo;
        }

        return null;
    }
    
    // The methods below are placeholders to satisfy the interface.
    // They can be implemented by building upon the memory-driven primitives above.

    async joinSession(sessionId: SessionId, agentId: AgentId): Promise<boolean> {
        // Implementation: Search for session, update participant list in memory, save back.
        console.warn(`joinSession for ${sessionId} not fully implemented.`);
        return true;
    }

    async leaveSession(sessionId: SessionId, agentId: AgentId): Promise<boolean> {
        // Implementation: Search for session, remove participant, save back.
        console.warn(`leaveSession for ${sessionId} not fully implemented.`);
        return true;
    }

    async broadcastMessage(message: AgentMessage): Promise<MessageId> {
        // This can be a specialized version of sendMessage where 'toAgent' is not set.
        const broadcastMessage = { ...message, toAgent: undefined };
        return this.sendMessage(broadcastMessage);
    }
}

// Export a single, canonical instance for the entire application to use.
export const unifiedAgentCommunicationService = UnifiedAgentCommunicationService.getInstance();
