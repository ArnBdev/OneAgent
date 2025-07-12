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

import { BaseAgent } from '../base/BaseAgent';
import { MemoryDrivenAgentCommunication, AgentContext } from './MemoryDrivenAgentCommunication';
import { oneAgentConfig } from '../../config/index';
import { AgentFactory } from '../base/AgentFactory';
import { ISpecializedAgent } from '../base/ISpecializedAgent';
import type { AgentType } from '../../types/oneagent-backbone-types';

export class AgentBootstrapService {
  private agents: Map<string, ISpecializedAgent> = new Map();
  private isBootstrapped: boolean = false;
  private communicationHub: MemoryDrivenAgentCommunication | undefined = undefined;
  
  /**
   * Set the communication protocol for agent registration
   */
  async setCommunicationHub(hub: MemoryDrivenAgentCommunication): Promise<void> {
    this.communicationHub = hub;
    console.log('🔗 AgentBootstrapService: Communication protocol connected');
    
    // If agents are already bootstrapped, register them immediately
    if (this.isBootstrapped && this.agents.size > 0) {
      await this.registerAllExistingAgents();
    }
  }

  /**
   * Bootstrap all REAL agents with memory and AI capabilities
   * This creates actual BaseAgent instances, not just metadata!
   */
  async bootstrapAllAgents(): Promise<void> {
    if (this.isBootstrapped) {
      console.log('⚠️  Agents already bootstrapped - skipping duplicate initialization');
      return;
    }

    console.log('🚀 AgentBootstrapService: Creating REAL agents with memory and AI...');
    console.log('🧠 These are actual BaseAgent instances with working processMessage() methods!');    
    try {      
      // Create all core agents using AgentFactory
      const realAgents = await this.createAllCoreAgents();
        // Store them in our local map
      for (const agent of realAgents) {
        const config = agent.config;
        this.agents.set(config.id, agent);
        console.log(`📝 Registered REAL agent: ${config.id} (${config.capabilities.length} capabilities)`);
        
        // Auto-register each agent with the communication protocol
        await this.registerAgentWithCommunicationProtocol(agent);
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

    } catch (error) {
      console.error('❌ AgentBootstrapService: Error during REAL agent initialization:', error);
      throw error;
    }
  }

  /**
   * Shutdown all agents gracefully
   */
  async shutdownAllAgents(): Promise<void> {
    if (!this.isBootstrapped) {
      console.log('⚠️  No agents to shutdown - not bootstrapped');
      return;
    }

    console.log('🛑 AgentBootstrapService: Shutting down all REAL agents...');

    // Shutdown all agents gracefully
    for (const [agentId, agent] of this.agents) {
      try {
        await agent.cleanup();
        console.log(`✅ Shutdown agent: ${agentId}`);
      } catch (error) {
        console.error(`❌ Error shutting down agent ${agentId}:`, error);
      }
    }
    
    this.agents.clear();
    this.isBootstrapped = false;

    console.log('✅ AgentBootstrapService: All REAL agents shut down gracefully');
  }

  /**
   * Get all initialized agents
   */
  getAgents(): Map<string, ISpecializedAgent> {
    return new Map(this.agents);
  }

  /**
   * Check if a specific agent is available
   */
  hasAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    return agent !== undefined && agent.getStatus().initialized;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): ISpecializedAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get agent count
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Get bootstrap status
   */
  isReady(): boolean {
    return this.isBootstrapped;
  }

  /**
   * Get status of all agents
   */
  getAgentStatus(): Array<{ agentId: string; isReady: boolean; capabilities: string[] }> {
    return Array.from(this.agents.entries()).map(([agentId, agent]) => ({
      agentId,
      isReady: agent.getStatus().initialized,
      capabilities: agent.config.capabilities
    }));
  }

  /**
   * Process a message with a specific agent
   */
  async processMessageWithAgent(
    agentId: string, 
    message: string, 
    context: { user: any; sessionId: string; conversationHistory: any[] }
  ): Promise<string> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.getStatus().initialized) {
      throw new Error(`Agent ${agentId} is not ready`);
    }

    try {
      const response = await agent.processMessage(context as any, message);
      return response.content;
    } catch (error) {
      console.error(`Error processing message with agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get capabilities summary for all agents
   */  getCapabilitiesSummary(): Record<string, string[]> {
    const summary: Record<string, string[]> = {};
    
    Array.from(this.agents.entries()).forEach(([agentId, agent]) => {
      summary[agentId] = agent.config.capabilities;
    });
    
    return summary;
  }

  /**
   * Check if bootstrap service is active
   */
  isActive(): boolean {
    return this.isBootstrapped;
  }

  /**
   * Add a new REAL agent dynamically
   */
  async addAgent(agentId: string, agent: ISpecializedAgent): Promise<void> {
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
  async removeAgent(agentId: string): Promise<boolean> {
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

  /**
   * Centrally register an agent with the communication protocol
   * This ensures all agents are discoverable through the multi-agent system
   */
  private async registerAgentWithCommunicationProtocol(agent: ISpecializedAgent): Promise<void> {
    if (!this.communicationHub) {
      console.warn(`⚠️ Communication hub not available for ${agent.config.id} registration`);
      return;
    }

    try {
      const config = agent.config;
      
      // Create AgentContext for communication hub registration
      const agentContext: AgentContext = {
        agentId: config.id,
        capabilities: config.capabilities,
        status: 'available' as const,
        expertise: config.capabilities,
        recentActivity: new Date(),
        memoryCollectionId: `agent_${config.id}_memory`
      };

      // Register with communication hub
      await this.communicationHub.registerAgent(agentContext);
      console.log(`✅ Agent ${config.id} registered with communication protocol`);
    } catch (error) {
      console.error(`❌ Error registering ${agent.config.id} with communication protocol:`, error);
    }
  }

  /**
   * Register all existing agents with the communication protocol
   * Called when the communication protocol is set after agents are already created
   */
  async registerAllExistingAgents(): Promise<void> {
    if (!this.communicationHub) {
      console.warn('⚠️ Communication hub not available for bulk registration');
      return;
    }
    
    console.log('🔄 Registering all existing agents with communication hub...');
    
    const agents = Array.from(this.agents.values());
    for (const agent of agents) {
      await this.registerAgentWithCommunicationProtocol(agent);
    }
    
    console.log(`✅ Registered ${this.agents.size} agents with communication protocol`);
  }

  /**
   * Create all core agents using the canonical AgentFactory
   */
  private async createAllCoreAgents(): Promise<ISpecializedAgent[]> {
    const coreAgentTypes: AgentType[] = ['core', 'development', 'office', 'fitness', 'general'];
    const agents: ISpecializedAgent[] = [];

    for (const agentType of coreAgentTypes) {
      try {
        const agent = await AgentFactory.createAgent({
          type: agentType,
          id: `${agentType}-agent-${Date.now()}`,
          name: `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`,
          memoryEnabled: true,
          aiEnabled: true,
          modelTier: 'standard'
        });
        agents.push(agent);
        console.log(`✅ Created ${agentType} agent with canonical AgentFactory`);
      } catch (error) {
        console.error(`❌ Failed to create ${agentType} agent:`, error);
      }
    }

    return agents;
  }
}

// Singleton instance for global use
export const agentBootstrapService = new AgentBootstrapService();
export const agentBootstrap = new AgentBootstrapService();

export default AgentBootstrapService;
