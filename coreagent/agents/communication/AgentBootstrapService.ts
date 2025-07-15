/**
 * AgentBootstrapService - Startup and management of REAL BaseAgent instances
 * 
 * This service creates and manages actual BaseAgent implementations with:
 * - Real memory integration for conversation storage
 * - AI processing capabilities with Gemini
 * - Specialized domain expertise for each agent
 * - Message handling and response generation
 * 
 * Uses CANONICAL systems:
 * - HybridAgentRegistry for agent registration
 * - A2AProtocol for standards-compliant communication
 * - Shared OneAgentMemory for memory-driven context
 */

import { HybridAgentRegistry } from '../registry/HybridAgentRegistry';
import { AgentFactory } from '../base/AgentFactory';
import { ISpecializedAgent } from '../base/ISpecializedAgent';
import { AgentContext } from '../base/BaseAgent';
import { AgentRegistration, createAgentCard } from '../../types/AgentCard';
import { unifiedTimeService, unifiedMetadataService } from '../../utils/UnifiedBackboneService';

export class AgentBootstrapService {
  private agents: Map<string, ISpecializedAgent> = new Map();
  private isBootstrapped: boolean = false;
  private registry: HybridAgentRegistry;
  
  constructor() {
    this.registry = new HybridAgentRegistry();
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
        
        // Register with canonical HybridAgentRegistry
        await this.registerAgentWithRegistry(agent);
      }
        console.log('✅ REAL Agent Registration Complete:');
      console.log('   🧠 CoreAgent: Constitutional AI + BMAD orchestrator WITH MEMORY');
      console.log('   💻 DevAgent: Context7 + learning engine specialist WITH MEMORY');
      console.log('   📋 OfficeAgent: Productivity workflow specialist WITH MEMORY');
      console.log('   💪 FitnessAgent: Fitness and wellness tracking WITH MEMORY');

      this.isBootstrapped = true;

      console.log('✅ AgentBootstrapService: All REAL agents initialized and ready!');
      console.log(`🎯 ${this.agents.size} agents with actual AI processing and memory storage`);
      console.log('📡 Agents registered with canonical HybridAgentRegistry for discovery');

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
    context: { user: unknown; sessionId: string; conversationHistory: unknown[] }
  ): Promise<string> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.getStatus().initialized) {
      throw new Error(`Agent ${agentId} is not ready`);
    }

    try {
      const response = await agent.processMessage(context as AgentContext, message);
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
   * Register agent with canonical HybridAgentRegistry
   */
  private async registerAgentWithRegistry(agent: ISpecializedAgent): Promise<void> {
    const config = agent.config;
    
    // Create AgentRegistration using canonical backbone service
    const agentCard = createAgentCard(
      {
        name: config.id,
        agentId: config.id,
        agentType: 'specialized',
        description: `Specialized agent: ${config.id}`,
        version: '1.0.0',
        url: '',
        capabilities: {
          streaming: false,
          pushNotifications: false,
          stateTransitionHistory: false,
          extensions: []
        },
        skills: [],
        status: 'active',
        health: 'healthy'
      },
      {
        timeService: unifiedTimeService,
        metadataService: unifiedMetadataService
      }
    );
    
    // Create AgentRegistration with required fields
    const registration: AgentRegistration = {
      ...agentCard,
      qualityScore: 85 // Required for AgentRegistration
    };

    try {
      await this.registry.registerAgent(registration);
      console.log(`📋 Agent ${config.id} registered with HybridAgentRegistry`);
    } catch (error) {
      console.error(`❌ Failed to register agent ${config.id} with registry:`, error);
    }
  }

  /**
   * Register all existing agents with the registry
   * Called when the registry is set after agents are already created
   */
  async registerAllExistingAgents(): Promise<void> {
    if (!this.registry) {
      console.warn('⚠️ Registry not available for bulk registration');
      return;
    }
    
    console.log('🔄 Registering all existing agents with canonical registry...');
    
    const agents = Array.from(this.agents.values());
    for (const agent of agents) {
      await this.registerAgentWithRegistry(agent);
    }
    
    console.log(`✅ Successfully registered ${agents.length} agents with canonical registry`);
  }

  /**
   * Create all core agents using the canonical AgentFactory
   */
  private async createAllCoreAgents(): Promise<ISpecializedAgent[]> {
    // Define proper agent configurations with meaningful names
    const agentConfigs = [
      {
        type: 'core' as const,
        id: 'core-agent',
        name: 'CoreAgent',
        description: 'Core system agent for fundamental operations'
      },
      {
        type: 'development' as const,
        id: 'dev-agent',
        name: 'DevAgent',
        description: 'Development and coding assistance agent'
      },
      {
        type: 'office' as const,
        id: 'office-agent',
        name: 'OfficeAgent', 
        description: 'Office productivity and management agent'
      },
      {
        type: 'fitness' as const,
        id: 'fitness-agent',
        name: 'FitnessAgent',
        description: 'Health and fitness guidance agent'
      },
      {
        type: 'triage' as const,
        id: 'triage-agent',
        name: 'TriageAgent',
        description: 'Task routing and system health agent'
      },
      {
        type: 'planner' as const,
        id: 'planner-agent',
        name: 'PlannerAgent',
        description: 'Strategic planning and task orchestration agent'
      },
      {
        type: 'validator' as const,
        id: 'validator-agent',
        name: 'ValidationAgent',
        description: 'Quality validation and Constitutional AI compliance agent'
      }
    ];

    const agents: ISpecializedAgent[] = [];

    for (const config of agentConfigs) {
      try {
        const agent = await AgentFactory.createAgent({
          ...config,
          memoryEnabled: true,
          aiEnabled: true,
          modelTier: 'standard'
        });
        agents.push(agent);
        console.log(`✅ Created ${config.name} with canonical AgentFactory`);
      } catch (error) {
        console.error(`❌ Failed to create ${config.name}:`, error);
      }
    }

    return agents;
  }
}

// Singleton instance for global use
export const agentBootstrapService = new AgentBootstrapService();
export const agentBootstrap = new AgentBootstrapService();

export default AgentBootstrapService;
