"use strict";
/**
 * AgentBootstrapService - Startup and management of REAL BaseAgent instances
 *
 * This service creates and manages actual BaseAgent implementations with:
 * - Real memory integration for conversation storage
 * - AI processing capabilities with Gemini
 * - Specialized domain expertise for each agent
 * - Message handling and response generation
 *
 * No more metadata-only registration - these are REAL, functioning agents!
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentBootstrap = exports.agentBootstrapService = exports.AgentBootstrapService = void 0;
const AgentFactory_1 = require("../specialized/AgentFactory");
class AgentBootstrapService {
    constructor() {
        this.agents = new Map();
        this.isBootstrapped = false;
        this.sharedDiscoveryService = undefined;
    }
    /**
     * Set the shared discovery service (called from main server)
     */
    setSharedDiscoveryService(discoveryService) {
        this.sharedDiscoveryService = discoveryService;
        console.log('🔗 AgentBootstrapService: Shared discovery service connected');
    }
    /**
     * Bootstrap all REAL agents with memory and AI capabilities
     * This creates actual BaseAgent instances, not just metadata!
     */
    async bootstrapAllAgents() {
        if (this.isBootstrapped) {
            console.log('⚠️  Agents already bootstrapped - skipping duplicate initialization');
            return;
        }
        console.log('🚀 AgentBootstrapService: Creating REAL agents with memory and AI...');
        console.log('🧠 These are actual BaseAgent instances with working processMessage() methods!');
        try {
            // Create all 5 REAL agents with memory and AI capabilities
            const realAgents = await AgentFactory_1.AgentFactory.createAllCoreAgents();
            // Store them in our local map
            for (const agent of realAgents) {
                const config = agent.getConfig();
                this.agents.set(config.id, agent);
                console.log(`📝 Registered REAL agent: ${config.id} (${config.capabilities.length} capabilities)`);
            }
            console.log('✅ REAL Agent Registration Complete:');
            console.log('   🧠 CoreAgent: Constitutional AI + BMAD orchestrator WITH MEMORY');
            console.log('   💻 DevAgent: Context7 + learning engine specialist WITH MEMORY');
            console.log('   📋 OfficeAgent: Productivity workflow specialist WITH MEMORY');
            console.log('   💪 FitnessAgent: Fitness and wellness tracking WITH MEMORY');
            console.log('   🔀 TriageAgent: Task routing and health monitoring WITH MEMORY');
            this.isBootstrapped = true;
            console.log('✅ AgentBootstrapService: All REAL agents initialized and ready!');
            console.log(`🎯 ${this.agents.size} agents with actual AI processing and memory storage`);
            console.log('� Agents can now handle real messages with processMessage() method!');
        }
        catch (error) {
            console.error('❌ AgentBootstrapService: Error during REAL agent initialization:', error);
            throw error;
        }
    }
    /**
     * Shutdown all agents gracefully
     */
    async shutdownAllAgents() {
        if (!this.isBootstrapped) {
            console.log('⚠️  No agents to shutdown - not bootstrapped');
            return;
        }
        console.log('🛑 AgentBootstrapService: Shutting down all REAL agents...');
        // Use the factory's shutdown method
        await AgentFactory_1.AgentFactory.shutdownAllAgents();
        this.agents.clear();
        this.isBootstrapped = false;
        console.log('✅ AgentBootstrapService: All REAL agents shut down gracefully');
    }
    /**
     * Get all initialized agents
     */
    getAgents() {
        return new Map(this.agents);
    }
    /**
     * Check if a specific agent is available
     */
    hasAgent(agentId) {
        const agent = this.agents.get(agentId);
        return agent !== undefined && agent.isReady();
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Get agent count
     */
    getAgentCount() {
        return this.agents.size;
    }
    /**
     * Get bootstrap status
     */
    isReady() {
        return this.isBootstrapped;
    }
    /**
     * Get status of all agents
     */
    getAgentStatus() {
        return Array.from(this.agents.entries()).map(([agentId, agent]) => ({
            agentId,
            isReady: agent.isReady(),
            capabilities: agent.getConfig().capabilities
        }));
    }
    /**
     * Process a message with a specific agent
     */
    async processMessageWithAgent(agentId, message, context) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        if (!agent.isReady()) {
            throw new Error(`Agent ${agentId} is not ready`);
        }
        try {
            const response = await agent.processMessage(context, message);
            return response.content;
        }
        catch (error) {
            console.error(`Error processing message with agent ${agentId}:`, error);
            throw error;
        }
    }
    /**
     * Get capabilities summary for all agents
     */
    getCapabilitiesSummary() {
        const summary = {};
        for (const [agentId, agent] of this.agents) {
            summary[agentId] = agent.getConfig().capabilities;
        }
        return summary;
    }
    /**
     * Check if bootstrap service is active
     */
    isActive() {
        return this.isBootstrapped;
    }
    /**
     * Add a new REAL agent dynamically
     */
    async addAgent(agentId, agent) {
        if (this.agents.has(agentId)) {
            console.log(`⚠️ Replacing existing agent: ${agentId}`);
            await this.agents.get(agentId)?.cleanup();
        }
        this.agents.set(agentId, agent);
        console.log(`✅ Agent ${agentId} added successfully`);
    }
    /**
     * Remove an agent
     */
    async removeAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            console.log(`⚠️ Agent ${agentId} not found for removal`);
            return false;
        }
        console.log(`🗑️ Removing agent: ${agentId}`);
        await agent.cleanup();
        this.agents.delete(agentId);
        console.log(`✅ Agent ${agentId} removed successfully`);
        return true;
    }
}
exports.AgentBootstrapService = AgentBootstrapService;
// Singleton instance for global use
exports.agentBootstrapService = new AgentBootstrapService();
exports.agentBootstrap = new AgentBootstrapService();
exports.default = AgentBootstrapService;
