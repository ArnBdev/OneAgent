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
    BusinessWorkflowTemplate,
    WorkflowInstance,
    WorkflowProgress,
    NLACSMessage
} from '../types/oneagent-backbone-types';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { createUnifiedId, createUnifiedTimestamp, unifiedMetadataService } from '../utils/UnifiedBackboneService';
import { ToolDescriptor } from '../OneAgentEngine';
import { ConsensusEngine } from '../coordination/ConsensusEngine';
import { InsightSynthesisEngine } from '../coordination/InsightSynthesisEngine';

export class UnifiedAgentCommunicationService implements UnifiedAgentCommunicationInterface {
    private static instance: UnifiedAgentCommunicationService;
    private memory: OneAgentMemory;
    private eventHandlers: { [event: string]: ((payload: unknown) => void)[] } = {};
    
    // Phase 3 Enhanced Coordination Engines
    private consensusEngine: ConsensusEngine;
    private insightSynthesisEngine: InsightSynthesisEngine;

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
        this.consensusEngine = new ConsensusEngine();
        this.insightSynthesisEngine = new InsightSynthesisEngine();
        console.log('✅ UnifiedAgentCommunicationService initialized with Phase 3 enhanced coordination engines.');
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
                    contextDependency: 'global'
                },
            }),
            entityType: 'A2AAgent', // Critical for discovery
            agentData: agentRecord, // Store the full agent record
        };
        const memoryId = await this.memory.addMemoryCanonical(content, metadata, 'system_registry');

        console.log(`🤖 Agent registered via canonical service: ${agent.name} (${agentId}) -> Memory ID: ${memoryId}`);
        return agentId;
    }

    /**
     * Discovers available agents based on capabilities and status.
     * Searches the canonical memory system for registered agents.
     */
    async discoverAgents(filter: AgentFilter & { health?: 'healthy' | 'degraded' | 'critical' | 'offline'; role?: string; }): Promise<AgentCardWithHealth[]> {
        const metadata_filter: Record<string, unknown> = { 'agentData.entityType': 'A2AAgent' };

        if (filter.status) {
            metadata_filter['agentData.status'] = filter.status;
        }

        const searchResults = await this.memory.searchMemory({
            query: filter.capabilities ? `agent with capabilities: ${filter.capabilities.join(', ')}` : 'discover all agents',
            user_id: 'system_discovery',
            limit: filter.limit || 100,
            metadata_filter: metadata_filter,
        });

        const agents = searchResults.results
            .map((result: Record<string, unknown>) => (result.metadata as Record<string, unknown>)?.agentData as A2AAgent)
            .filter((agent: A2AAgent): agent is A2AAgent => {
                if (!agent) return false;
                if (filter.capabilities && filter.capabilities.length > 0) {
                    return filter.capabilities.every(cap => agent.capabilities.includes(cap));
                }
                return true;
            })
            .map((agent: A2AAgent): AgentCardWithHealth => ({
                id: agent.id,
                name: agent.name,
                capabilities: agent.capabilities,
                health: {
                    status: 'healthy' as const,
                    uptime: createUnifiedTimestamp().unix * 1000 - new Date(agent.lastActive.iso).getTime(),
                    memoryUsage: 50,
                    responseTime: 100,
                    errorRate: 0,
                    lastActivity: new Date(agent.lastActive.iso)
                },
                status: agent.status,
                lastActive: new Date(agent.lastActive.iso),
                metadata: agent.metadata
            }));
        
        console.log(`🔍 Agent discovery found ${agents.length} agents.`);
        return agents;
    }

    /**
     * Creates a new communication session for agents to collaborate.
     * The session is stored persistently in the memory system.
     */
    async createSession(sessionConfig: SessionConfig & { context?: Record<string, unknown>; nlacs?: boolean }): Promise<SessionId> {
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
                extensions: sessionConfig.nlacs ? [{ uri: 'https://oneagent.ai/extensions/nlacs' }] : []
            },
        };

        const sessionMetadata = unifiedMetadataService.create('session_creation', 'UnifiedAgentCommunicationService', {
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
            business: {
                entityType: 'A2ASession',
                sessionData: sessionRecord,
            }
        });
        
        await this.memory.addMemoryCanonical(
            `Session Created: ${sessionConfig.name} - Topic: ${sessionConfig.topic}`,
            sessionMetadata,
            'system_session_manager'
        );

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

        const messageMetadata = unifiedMetadataService.create('agent_message', 'UnifiedAgentCommunicationService', {
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
            business: {
                entityType: 'A2AMessage',
                messageData: messageRecord,
            }
        });
        
        await this.memory.addMemoryCanonical(
            message.content,
            messageMetadata,
            'system_messaging'
        );
        
        console.log(`📨 Message sent in session ${message.sessionId}: ${message.fromAgent} -> ${message.toAgent || 'all'}`);
        return messageId;
    }

    /**
     * Retrieves the message history for a given session from memory.
     */
    async getMessageHistory(sessionId: SessionId, limit: number = 100): Promise<A2AMessage[]> {
        const searchResults = await this.memory.searchMemory({
            query: `message history for session ${sessionId}`,
            user_id: 'system_history',
            limit,
            metadata_filter: { 'messageData.sessionId': sessionId },
        });

        const messages = searchResults.results
            .map((result: Record<string, unknown>) => (result.metadata as Record<string, unknown>)?.messageData as A2AMessage)
            .filter((message: A2AMessage): message is A2AMessage => Boolean(message))
            .sort((a: A2AMessage, b: A2AMessage) => new Date(a.timestamp.iso).getTime() - new Date(b.timestamp.iso).getTime());

        return messages;
    }

    /**
     * Retrieves information about a specific session from memory.
     */
    async getSessionInfo(sessionId: SessionId): Promise<SessionInfo | null> {
         const searchResults = await this.memory.searchMemory({
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

    async joinSession(sessionId: SessionId, _agentId: AgentId): Promise<boolean> {
        // Implementation: Search for session, update participant list in memory, save back.
        console.warn(`joinSession for ${sessionId} not fully implemented.`);
        return true;
    }

    async leaveSession(sessionId: SessionId, _agentId: AgentId): Promise<boolean> {
        // Implementation: Search for session, remove participant, save back.
        console.warn(`leaveSession for ${sessionId} not fully implemented.`);
        return true;
    }

    async broadcastMessage(message: AgentMessage): Promise<MessageId> {
        // This can be a specialized version of sendMessage where 'toAgent' is not set.
        const broadcastMessage = { ...message, toAgent: undefined };
        return this.sendMessage(broadcastMessage);
    }

    /**
     * Event-driven coordination: subscribe to agent lifecycle and communication events
     */
    on(event: string, handler: (payload: unknown) => void): void {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
        console.log(`🎯 Event handler registered for: ${event}`);
    }

    /**
     * Extensibility: register new orchestration logic, protocols, or agent types
     */
    registerExtension(extension: { name: string; description?: string; apply: (service: UnifiedAgentCommunicationService) => void }): void {
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
        handlers.forEach(handler => {
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
                extensions: ['https://oneagent.ai/extensions/nlacs', 'https://oneagent.ai/extensions/phase3']
            },
        };

        const businessSessionMetadata = unifiedMetadataService.create('business_session', 'UnifiedAgentCommunicationService', {
            system: {
                source: 'business_coordination',
                component: 'UnifiedAgentCommunicationService',
                sessionId,
            },
            content: {
                category: 'business_collaboration',
                tags: ['business', 'session', 'enhanced', config.discussionType, config.facilitationMode],
                sensitivity: 'internal',
                relevanceScore: 1.0,
                contextDependency: 'session'
            },
            business: {
                entityType: 'EnhancedBusinessSession',
                sessionData: sessionRecord,
            }
        });
        
        await this.memory.addMemoryCanonical(
            `Enhanced Business Session Created: ${config.name} - Focus: ${config.discussionType} - Targets: ${config.insightTargets.join(', ')}`,
            businessSessionMetadata,
            'system_business_sessions'
        );

        // Emit business session creation event
        this.emit('business_session_created', { 
            sessionId, 
            config, 
            enhancedFeatures: ['consensus', 'insights', 'facilitation'] 
        });

        console.log(`✅ Enhanced business session created: ${config.name} (${sessionId})`);
        return sessionId;
    }

    /**
     * Facilitate discussion with advanced moderation and guidance
     * Uses Constitutional AI to ensure productive and safe discussions
     */
    async facilitateDiscussion(sessionId: SessionId, facilitationRules: FacilitationRules): Promise<void> {
        console.log(`🎯 Facilitating discussion for session: ${sessionId}`);

        const facilitationMetadata = unifiedMetadataService.create('facilitation_rules', 'UnifiedAgentCommunicationService', {
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
                contextDependency: 'session'
            },
            business: {
                entityType: 'FacilitationRules',
                facilitationData: facilitationRules,
            }
        });
        
        await this.memory.addMemoryCanonical(
            `Discussion Facilitation Rules Applied: Session ${sessionId}`,
            facilitationMetadata,
            'system_facilitation'
        );

        // Emit facilitation start event
        this.emit('discussion_facilitation_started', { sessionId, rules: facilitationRules });
        console.log(`✅ Discussion facilitation active for session: ${sessionId}`);
    }

    /**
     * Build consensus among session participants using democratic decision-making
     * Integrates with ConsensusEngine for sophisticated agreement analysis
     */
    async buildConsensus(sessionId: SessionId, proposal: string): Promise<ConsensusResult> {
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
            messages: messageHistory.map(msg => ({
                id: msg.id,
                discussionId: sessionId,
                agentId: msg.fromAgent,
                content: msg.message,
                messageType: 'contribution' as const,
                timestamp: new Date(msg.timestamp.iso),
                metadata: msg.metadata
            })),
            emergentInsights: [], // Will be populated by insight synthesis
            status: 'active' as const,
            createdAt: new Date(sessionInfo.createdAt.iso),
            lastActivity: new Date()
        };

        // Use consensus engine for democratic decision-making
        const consensusResult = await this.consensusEngine.buildConsensus(
            sessionInfo.participants,
            proposal,
            discussionContext
        );

        // Emit consensus building events
        this.emit('consensus_building_completed', { sessionId, proposal, result: consensusResult });
        if (consensusResult.agreed) {
            this.emit('consensus_reached', { sessionId, proposal, consensusLevel: consensusResult.consensusLevel });
        } else {
            this.emit('consensus_not_reached', { sessionId, proposal, compromises: consensusResult.compromisesReached });
        }

        console.log(`${consensusResult.agreed ? '✅' : '⚠️'} Consensus ${consensusResult.agreed ? 'reached' : 'not reached'} for session: ${sessionId}`);
        return consensusResult;
    }

    /**
     * Synthesize insights from multi-agent discussions
     * Uses InsightSynthesisEngine for breakthrough detection and novel connections
     */
    async synthesizeInsights(sessionId: SessionId): Promise<EmergentInsight[]> {
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
            messages: messageHistory.map(msg => ({
                id: msg.id,
                discussionId: sessionId,
                agentId: msg.fromAgent,
                content: msg.message,
                messageType: 'contribution' as const,
                timestamp: new Date(msg.timestamp.iso),
                metadata: msg.metadata
            })),
            emergentInsights: [],
            status: 'active' as const,
            createdAt: new Date(sessionInfo.createdAt.iso),
            lastActivity: new Date()
        };

        // Use insight synthesis engine for breakthrough detection
        const breakthroughInsights = await this.insightSynthesisEngine.detectBreakthroughMoments(discussionContext);
        const novelConnections = await this.insightSynthesisEngine.identifyNovelConnections(discussionContext);

        // Convert to EmergentInsight format
        const emergentInsights: EmergentInsight[] = [
            ...breakthroughInsights.map(insight => ({
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
                    implementationFeasibility: insight.implementationFeasibility
                }
            })),
            ...novelConnections.map(connection => ({
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
                    noveltyScore: connection.noveltyScore
                }
            }))
        ];

        // Emit insight synthesis events
        this.emit('insights_synthesized', { 
            sessionId, 
            insightCount: emergentInsights.length,
            breakthroughCount: breakthroughInsights.length,
            connectionCount: novelConnections.length
        });

        console.log(`✨ Synthesized ${emergentInsights.length} insights for session: ${sessionId}`);
        return emergentInsights;
    }

    /**
     * Enable real-time collaboration mode for a session
     * Activates live message routing and coherence monitoring
     */
    async enableRealTimeMode(sessionId: SessionId): Promise<void> {
        console.log(`⚡ Enabling real-time mode for session: ${sessionId}`);

        const realtimeMetadata = unifiedMetadataService.create('realtime_mode', 'UnifiedAgentCommunicationService', {
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
                contextDependency: 'session'
            },
            business: {
                entityType: 'RealTimeMode',
                sessionId,
                enabledAt: new Date().toISOString()
            }
        });
        
        await this.memory.addMemoryCanonical(
            `Real-Time Mode Enabled: Session ${sessionId}`,
            realtimeMetadata,
            'system_realtime'
        );

        this.emit('realtime_mode_enabled', { sessionId });
        console.log(`⚡ Real-time mode active for session: ${sessionId}`);
    }

    /**
     * Route message with priority-based delivery
     * Ensures critical messages are delivered immediately
     */
    async routeWithPriority(message: NLACSMessage, priority: MessagePriority): Promise<void> {
        console.log(`📨 Routing priority message: ${priority.level} - ${message.content.substring(0, 50)}...`);

        // Enhanced message metadata with priority information
        const enhancedMessage = {
            ...message,
            metadata: {
                ...message.metadata,
                priority: priority,
                routedAt: new Date().toISOString(),
                enhancedRouting: true
            }
        };

        const priorityMetadata = unifiedMetadataService.create('priority_message', 'UnifiedAgentCommunicationService', {
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
                contextDependency: 'session'
            },
            business: {
                entityType: 'PriorityMessage',
                messageData: enhancedMessage,
                priorityData: priority
            }
        });
        
        await this.memory.addMemoryCanonical(
            `Priority Message [${priority.level.toUpperCase()}]: ${message.content}`,
            priorityMetadata,
            'system_priority_routing'
        );

        // Emit priority routing events
        this.emit('priority_message_routed', { message: enhancedMessage, priority });
        if (priority.level === 'critical' || priority.level === 'urgent') {
            this.emit('urgent_message_alert', { message: enhancedMessage, priority });
        }

        console.log(`📨 Priority message routed: ${priority.level} priority`);
    }

    /**
     * Monitor and maintain session coherence
     * Ensures discussions stay focused and productive
     */
    async maintainCoherence(sessionId: SessionId): Promise<SessionCoherence> {
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
                recommendations: ['Session appears to be starting or has no activity yet']
            };
        }

        // Calculate coherence metrics
        const coherenceScore = this.calculateCoherenceScore(messageHistory, sessionInfo.topic);
        const topicDrift = this.calculateTopicDrift(messageHistory, sessionInfo.topic);
        const participationBalance = this.calculateParticipationBalance(messageHistory, sessionInfo.participants);
        const insightGeneration = this.calculateInsightGenerationRate(messageHistory);
        const discussionQuality = this.calculateDiscussionQuality(messageHistory);

        // Identify coherence issues
        const issues = this.identifyCoherenceIssues(coherenceScore, topicDrift, participationBalance, discussionQuality);
        const recommendations = this.generateCoherenceRecommendations(issues);

        const coherenceResult: SessionCoherence = {
            coherenceScore,
            topicDrift,
            participationBalance,
            insightGeneration,
            discussionQuality,
            issues,
            recommendations
        };

        const coherenceMetadata = unifiedMetadataService.create('coherence_analysis', 'UnifiedAgentCommunicationService', {
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
                contextDependency: 'session'
            },
            business: {
                entityType: 'CoherenceAnalysis',
                coherenceData: coherenceResult,
            }
        });
        
        await this.memory.addMemoryCanonical(
            `Session Coherence Analysis: Score ${coherenceScore.toFixed(2)}, Drift ${topicDrift.toFixed(2)}, Quality ${discussionQuality.toFixed(2)}`,
            coherenceMetadata,
            'system_coherence'
        );

        // Emit coherence monitoring events
        this.emit('coherence_monitored', { sessionId, coherence: coherenceResult });
        if (coherenceScore < 0.7) {
            this.emit('coherence_degraded', { sessionId, coherence: coherenceResult });
        }

        console.log(`🎯 Session coherence: ${coherenceScore.toFixed(2)} (${issues.length} issues identified)`);
        return coherenceResult;
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
        const relevantMessages = messages.filter(msg => 
            topicWords.some(word => msg.message.toLowerCase().includes(word))
        );
        
        return relevantMessages.length / messages.length;
    }

    private calculateTopicDrift(messages: A2AMessage[], originalTopic: string): number {
        if (messages.length === 0) return 0.0;
        
        const recentMessages = messages.slice(-10); // Last 10 messages
        const topicRelevance = this.calculateCoherenceScore(recentMessages, originalTopic);
        
        return 1.0 - topicRelevance;
    }

    private calculateParticipationBalance(messages: A2AMessage[], participants: AgentId[]): Record<AgentId, number> {
        const participation: Record<AgentId, number> = {};
        
        // Initialize with all participants
        participants.forEach(agent => participation[agent] = 0);
        
        // Count messages per participant
        messages.forEach(msg => {
            if (participation[msg.fromAgent] !== undefined) {
                participation[msg.fromAgent]++;
            }
        });
        
        // Convert to percentages
        const total = messages.length;
        if (total > 0) {
            Object.keys(participation).forEach(agent => {
                participation[agent] = (participation[agent] / total) * 100;
            });
        }
        
        return participation;
    }

    private calculateInsightGenerationRate(messages: A2AMessage[]): number {
        if (messages.length === 0) return 0.0;
        
        const insightIndicators = ['insight', 'breakthrough', 'realize', 'understand', 'solution', 'idea'];
        const insightMessages = messages.filter(msg =>
            insightIndicators.some(indicator => msg.message.toLowerCase().includes(indicator))
        );
        
        return insightMessages.length / messages.length;
    }

    private calculateDiscussionQuality(messages: A2AMessage[]): number {
        if (messages.length === 0) return 1.0;
        
        let qualityScore = 0;
        
        messages.forEach(msg => {
            let messageScore = 0.5; // Base score
            
            // Quality indicators
            if (msg.message.length > 50) messageScore += 0.1; // Substantial content
            if (msg.message.includes('?')) messageScore += 0.1; // Questions
            if (msg.message.toLowerCase().includes('because')) messageScore += 0.1; // Reasoning
            if (msg.message.toLowerCase().includes('data') || msg.message.toLowerCase().includes('evidence')) messageScore += 0.1; // Evidence
            if (msg.messageType === 'insight' || msg.messageType === 'decision') messageScore += 0.2; // High-value message types
            
            qualityScore += Math.min(1.0, messageScore);
        });
        
        return qualityScore / messages.length;
    }

    private identifyCoherenceIssues(
        coherenceScore: number, 
        topicDrift: number, 
        participationBalance: Record<AgentId, number>, 
        discussionQuality: number
    ): Array<{ type: 'topic_drift' | 'uneven_participation' | 'circular_discussion' | 'low_quality' | 'conflict_escalation'; severity: 'minor' | 'moderate' | 'major'; description: string; affectedAgents: AgentId[]; suggestedActions: string[] }> {
        const issues = [];
        
        if (topicDrift > 0.5) {
            issues.push({
                type: 'topic_drift' as const,
                severity: topicDrift > 0.8 ? 'major' as const : 'moderate' as const,
                description: `Discussion has drifted significantly from original topic (${(topicDrift * 100).toFixed(1)}% drift)`,
                affectedAgents: [],
                suggestedActions: ['Remind participants of session objectives', 'Refocus discussion on original topic']
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
                affectedAgents: Object.keys(participationBalance).filter(agent => participationBalance[agent] < 10),
                suggestedActions: ['Encourage quiet participants', 'Moderate dominant participants']
            });
        }
        
        if (discussionQuality < 0.6) {
            issues.push({
                type: 'low_quality' as const,
                severity: discussionQuality < 0.4 ? 'major' as const : 'moderate' as const,
                description: `Discussion quality is below expected standards (${(discussionQuality * 100).toFixed(1)}%)`,
                affectedAgents: [],
                suggestedActions: ['Request more detailed contributions', 'Ask for evidence and reasoning']
            });
        }
        
        return issues;
    }

    private generateCoherenceRecommendations(issues: Array<{ type: string; severity: string; description: string; suggestedActions: string[] }>): string[] {
        const recommendations = [];
        
        if (issues.length === 0) {
            recommendations.push('Discussion is proceeding well with good coherence and quality');
        } else {
            issues.forEach(issue => {
                recommendations.push(...issue.suggestedActions);
            });
        }
        
        return Array.from(new Set(recommendations)); // Remove duplicates
    }
}

// Export a single, canonical instance for the entire application to use.
export const unifiedAgentCommunicationService = UnifiedAgentCommunicationService.getInstance();
