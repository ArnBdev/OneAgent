"use strict";
/**
 * AgentFactory - Factory for creating BaseAgent instances
 *
 * This factory creates BaseAgent implementations that:
 * - Have memory integration
 * - Process messages with AI
 * - Store and recall conversation history
 * - Have specialized domain expertise
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentFactory = void 0;
const CoreAgent_1 = require("../specialized/CoreAgent");
const DevAgent_1 = require("../specialized/DevAgent");
const OfficeAgent_1 = require("../specialized/OfficeAgent");
const FitnessAgent_1 = require("../specialized/FitnessAgent");
const TriageAgent_1 = require("../specialized/TriageAgent");
class AgentFactory {
    /**
     * Create or get existing CoreAgent instance
     */
    static async createCoreAgent() {
        const agentId = 'CoreAgent';
        if (this.instances.has(agentId)) {
            return this.instances.get(agentId);
        }
        const agent = new CoreAgent_1.CoreAgent();
        await agent.initialize();
        this.instances.set(agentId, agent);
        console.log('✅ CoreAgent initialized with memory and AI capabilities');
        return agent;
    }
    /**
     * Create or get existing DevAgent instance
     */
    static async createDevAgent() {
        const agentId = 'DevAgent';
        if (this.instances.has(agentId)) {
            return this.instances.get(agentId);
        }
        const agent = new DevAgent_1.DevAgent();
        await agent.initialize();
        this.instances.set(agentId, agent);
        console.log('✅ DevAgent initialized with memory and AI capabilities');
        return agent;
    }
    /**
     * Create or get existing OfficeAgent instance
     */
    static async createOfficeAgent() {
        const agentId = 'OfficeAgent';
        if (this.instances.has(agentId)) {
            return this.instances.get(agentId);
        }
        const agent = new OfficeAgent_1.OfficeAgent();
        await agent.initialize();
        this.instances.set(agentId, agent);
        console.log('✅ OfficeAgent initialized with memory and AI capabilities');
        return agent;
    }
    /**
     * Create or get existing FitnessAgent instance
     */
    static async createFitnessAgent() {
        const agentId = 'FitnessAgent';
        if (this.instances.has(agentId)) {
            return this.instances.get(agentId);
        }
        const agent = new FitnessAgent_1.FitnessAgent();
        await agent.initialize();
        this.instances.set(agentId, agent);
        console.log('✅ FitnessAgent initialized with memory and AI capabilities');
        return agent;
    }
    /**
     * Create or get existing TriageAgent instance
     */
    static async createTriageAgent() {
        const agentId = 'TriageAgent';
        if (this.instances.has(agentId)) {
            return this.instances.get(agentId);
        }
        const agent = new TriageAgent_1.TriageAgent();
        await agent.initialize();
        this.instances.set(agentId, agent);
        console.log('✅ TriageAgent initialized with memory and AI capabilities');
        return agent;
    }
    /**
     * Get all initialized agents
     */
    static getAllAgents() {
        return new Map(this.instances);
    }
    /**
     * Get agent by ID
     */
    static getAgent(agentId) {
        return this.instances.get(agentId);
    }
    /**
     * Check if agent exists and is initialized
     */
    static hasAgent(agentId) {
        const agent = this.instances.get(agentId);
        return agent !== undefined && agent.isReady();
    }
    /**
     * Get agent count
     */
    static getAgentCount() {
        return this.instances.size;
    }
    /**
     * Create all 5 core agents
     */
    static async createAllCoreAgents() {
        console.log('🤖 Creating all 5 core REAL agents with memory and AI...');
        const agents = await Promise.all([
            this.createCoreAgent(),
            this.createDevAgent(),
            this.createOfficeAgent(),
            this.createFitnessAgent(),
            this.createTriageAgent()
        ]);
        console.log(`✅ All ${agents.length} core agents initialized and ready!`);
        return agents;
    }
    /**
     * Shutdown all agents gracefully
     */
    static async shutdownAllAgents() {
        console.log('🛑 Shutting down all real agents...');
        const shutdownPromises = Array.from(this.instances.values()).map(agent => agent.cleanup());
        await Promise.all(shutdownPromises);
        this.instances.clear();
        console.log('✅ All real agents shut down gracefully');
    }
    /**
     * Get agent capabilities summary
     */
    static getAgentCapabilitiesSummary() {
        const summary = {};
        for (const [agentId, agent] of this.instances) {
            summary[agentId] = agent.getConfig().capabilities;
        }
        return summary;
    }
}
exports.AgentFactory = AgentFactory;
AgentFactory.instances = new Map();
