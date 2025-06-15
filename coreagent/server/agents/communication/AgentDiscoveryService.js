"use strict";
/**
 * AgentDiscoveryService - Automated Agent Discovery and Network Formation
 *
 * Implements the user's vision: CoreAgent broadcasts "Who's awake?" and agents respond
 * with their capabilities, creating a dynamic, self-organizing multi-agent network.
 *
 * Features:
 * - Broadcast discovery requests on common protocol
 * - Automatic agent registration via response
 * - Heartbeat-based health monitoring
 * - Self-cleanup when agents go offline
 * - Real-time network topology updates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentDiscoveryService = void 0;
const events_1 = require("events");
const index_1 = require("../../config/index");
/**
 * Automated Agent Discovery Service
 *
 * Replaces manual registration with dynamic discovery:
 * CoreAgent: "Who's awake?"
 * Agents: "Hey, what's up? Here's what I can do..."
 */
class AgentDiscoveryService extends events_1.EventEmitter {
    constructor(coreAgentId = 'CoreAgent-Core-v4.0.0', port = index_1.oneAgentConfig.mcpPort) {
        super();
        this.coreAgentId = coreAgentId;
        this.port = port;
        this.discoveryChannel = 'oneagent://discovery';
        this.heartbeatInterval = 30000; // 30 seconds
        this.discoveryTimeout = 5000; // 5 seconds
        this.activeDiscovery = new Map();
        this.lastSeen = new Map();
        this.setupDiscoveryProtocol();
    }
    /**
     * Broadcast "Who's awake?" discovery request
     * Now returns agents already registered in the multi-agent system
     */
    async discoverAgents() {
        console.log(`🔍 CoreAgent broadcasting: "Who's awake?" on ${this.discoveryChannel}`);
        // If we have access to the communication protocol, get registered agents directly
        if (this.communicationProtocol && this.communicationProtocol.getRegisteredAgents) {
            const registeredAgents = this.communicationProtocol.getRegisteredAgents();
            const responses = [];
            for (const [agentId, registration] of registeredAgents) {
                if (agentId !== this.coreAgentId) { // Don't include CoreAgent in discovery
                    const response = {
                        agentId: registration.agentId,
                        agentType: registration.agentType,
                        capabilities: registration.capabilities.map((cap) => ({
                            name: cap.name,
                            description: cap.description,
                            version: cap.version,
                            qualityThreshold: cap.qualityThreshold
                        })),
                        endpoint: registration.endpoint,
                        qualityScore: registration.qualityScore,
                        status: registration.status
                    };
                    responses.push(response);
                    console.log(`👋 Found agent: ${response.agentId} (${response.agentType})`);
                }
            }
            console.log(`✅ Discovery complete: Found ${responses.length} agents`);
            return responses;
        }
        // Fallback to event-based discovery (legacy mode)
        const discoveryMessage = {
            type: 'DISCOVER_AGENTS',
            sourceAgent: this.coreAgentId,
            timestamp: new Date()
        };
        // Broadcast discovery request
        await this.broadcast(discoveryMessage);
        // Wait for responses
        return new Promise((resolve) => {
            const responses = [];
            const timeout = setTimeout(() => {
                console.log(`✅ Discovery complete: Found ${responses.length} agents`);
                resolve(responses);
            }, this.discoveryTimeout);
            // Listen for agent responses
            this.on('agent_discovered', (response) => {
                responses.push(response);
                console.log(`👋 Agent says "Hey!": ${response.agentId} (${response.agentType})`);
            });
            // Clean up after timeout
            setTimeout(() => {
                this.removeAllListeners('agent_discovered');
            }, this.discoveryTimeout + 1000);
        });
    }
    /**
     * Register as an agent that responds to discovery
     * When CoreAgent asks "Who's awake?", this agent says "Hey, what's up!"
     */
    async respondToDiscovery(capabilities) {
        this.on('discovery_request', async (message) => {
            if (message.type === 'DISCOVER_AGENTS') {
                console.log(`👋 Heard "${message.sourceAgent}" asking "Who's awake?" - responding!`);
                const response = {
                    type: 'AGENT_AVAILABLE',
                    sourceAgent: capabilities.agentId,
                    timestamp: new Date(),
                    payload: {
                        ...capabilities,
                        respondingTo: message.sourceAgent
                    }
                };
                await this.broadcast(response);
                console.log(`📢 Said "Hey, what's up!" to ${message.sourceAgent}`);
            }
        });
        // Start heartbeat
        this.startHeartbeat(capabilities.agentId);
    }
    /**
     * Start heartbeat to maintain presence in the network
     * "I'm still here!" every 30 seconds
     */
    startHeartbeat(agentId) {
        const heartbeat = setInterval(() => {
            const heartbeatMessage = {
                type: 'AGENT_HEARTBEAT',
                sourceAgent: agentId,
                timestamp: new Date()
            };
            this.broadcast(heartbeatMessage);
            console.log(`💓 ${agentId}: "Still here!"}`);
        }, this.heartbeatInterval);
        this.activeDiscovery.set(agentId, heartbeat);
    }
    /**
     * Clean shutdown - tell everyone "I'm going offline"
     */
    async shutdown(agentId) {
        const shutdownMessage = {
            type: 'AGENT_SHUTDOWN',
            sourceAgent: agentId,
            timestamp: new Date()
        };
        await this.broadcast(shutdownMessage);
        console.log(`👋 ${agentId}: "Goodbye everyone!"`);
        // Clean up heartbeat
        const heartbeat = this.activeDiscovery.get(agentId);
        if (heartbeat) {
            clearInterval(heartbeat);
            this.activeDiscovery.delete(agentId);
        }
    }
    /**
     * Simulate broadcast on common protocol
     * In production, this would use WebSocket, UDP multicast, or message queue
     */
    async broadcast(message) {
        // Simulate network broadcast delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        // Emit to local listeners (simulating network reception)
        this.emit('discovery_message', message);
        // Handle different message types
        switch (message.type) {
            case 'DISCOVER_AGENTS':
                this.emit('discovery_request', message);
                break;
            case 'AGENT_AVAILABLE':
                this.emit('agent_discovered', message.payload);
                this.lastSeen.set(message.sourceAgent, message.timestamp);
                break;
            case 'AGENT_HEARTBEAT':
                this.lastSeen.set(message.sourceAgent, message.timestamp);
                this.emit('agent_heartbeat', message);
                break;
            case 'AGENT_SHUTDOWN':
                this.lastSeen.delete(message.sourceAgent);
                this.emit('agent_shutdown', message);
                break;
        }
    }
    /**
     * Setup discovery protocol listeners
     */
    setupDiscoveryProtocol() {
        // Auto-cleanup dead agents
        setInterval(() => {
            const now = new Date();
            const deadAgents = [];
            for (const [agentId, lastSeen] of this.lastSeen) {
                const timeSince = now.getTime() - lastSeen.getTime();
                if (timeSince > this.heartbeatInterval * 3) { // 90 seconds without heartbeat
                    deadAgents.push(agentId);
                }
            }
            deadAgents.forEach(agentId => {
                console.log(`☠️ Agent ${agentId} went silent - removing from network`);
                this.lastSeen.delete(agentId);
                this.emit('agent_dead', agentId);
            });
        }, this.heartbeatInterval);
        console.log(`🎯 AgentDiscoveryService initialized on ${this.discoveryChannel}`);
        console.log(`📡 Ready for "Who's awake?" broadcasts and "Hey!" responses`);
    }
    /**
     * Get current network status
     */
    getNetworkStatus() {
        return {
            totalAgents: this.lastSeen.size,
            aliveAgents: Array.from(this.lastSeen.keys()),
            lastSeen: this.lastSeen
        };
    }
    /**
     * Set the communication protocol reference (called from main server)
     */
    setCommunicationProtocol(protocol) {
        this.communicationProtocol = protocol;
        console.log('🔗 AgentDiscoveryService: Communication protocol connected');
    }
}
exports.AgentDiscoveryService = AgentDiscoveryService;
/**
 * Usage Example:
 *
 * // CoreAgent discovers agents
 * const discovery = new AgentDiscoveryService();
 * const agents = await discovery.discoverAgents();
 * console.log(`Found ${agents.length} agents ready to work!`);
 *
 * // Agent responds to discovery
 * await discovery.respondToDiscovery({
 *   agentId: 'DevAgent-001',
 *   agentType: 'development',
 *   capabilities: [...],
 *   endpoint: 'http://localhost:8084',
 *   qualityScore: 95,
 *   status: 'online'
 * });
 */
