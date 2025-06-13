/**
 * AgentBootstrapService - Automatic startup of all specialized agents
 * 
 * This service automatically starts all specialized agents and makes them
 * participate in the discovery protocol. No more manual registration needed!
 * 
 * When CoreAgent asks "Who's awake?", all these agents will respond automatically.
 */

import { AgentAutoRegistration, AgentAutoRegistrationFactory, AgentRegistrationConfig } from './AgentAutoRegistration';
import { AgentDiscoveryService } from './AgentDiscoveryService';

export class AgentBootstrapService {
  private agents: Map<string, AgentAutoRegistration> = new Map();
  private isBootstrapped: boolean = false;
  private sharedDiscoveryService: AgentDiscoveryService | undefined = undefined;
  /**
   * Set the shared discovery service (called from main server)
   */
  setSharedDiscoveryService(discoveryService: AgentDiscoveryService): void {
    this.sharedDiscoveryService = discoveryService;
    console.log('🔗 AgentBootstrapService: Shared discovery service connected');
  }

  /**
   * Bootstrap all specialized agents for auto-discovery
   * This replaces manual MCP tool registration calls
   */
  async bootstrapAllAgents(): Promise<void> {
    if (this.isBootstrapped) {
      console.log('⚠️  Agents already bootstrapped - skipping duplicate initialization');
      return;
    }

    console.log('🚀 AgentBootstrapService: Starting automatic agent initialization...');
    console.log('📢 All agents will automatically respond to CoreAgent discovery broadcasts');    try {
      // Create all specialized agents with shared discovery service
      const coreAgent = AgentAutoRegistrationFactory.createCoreAgent(this.sharedDiscoveryService);
      const devAgent = AgentAutoRegistrationFactory.createDevAgent(this.sharedDiscoveryService);
      const enhancedDevAgent = AgentAutoRegistrationFactory.createEnhancedDevAgent(this.sharedDiscoveryService);
      const officeAgent = AgentAutoRegistrationFactory.createOfficeAgent(this.sharedDiscoveryService);
      const fitnessAgent = AgentAutoRegistrationFactory.createFitnessAgent(this.sharedDiscoveryService);
      const triageAgent = AgentAutoRegistrationFactory.createTriageAgent(this.sharedDiscoveryService);      // Store agents with standardized naming convention: {Type}Agent-v{Version}
      this.agents.set('CoreAgent-v4.0', coreAgent);
      this.agents.set('DevAgent-v4.0', devAgent);
      this.agents.set('EnhancedDevAgent-v4.0', enhancedDevAgent);
      this.agents.set('OfficeAgent-v2.0', officeAgent);
      this.agents.set('FitnessAgent-v1.0', fitnessAgent);
      this.agents.set('TriageAgent-v3.0', triageAgent);

      // Start auto-registration for all agents
      const startupPromises = Array.from(this.agents.values()).map(agent => 
        agent.startAutoRegistration()
      );

      await Promise.all(startupPromises);

      this.isBootstrapped = true;

      console.log('✅ AgentBootstrapService: All agents initialized and ready for discovery!');
      console.log(`🎯 ${this.agents.size} agents now listening for "Who's awake?" broadcasts`);
      console.log('📡 Agents will automatically register when CoreAgent discovers them');

    } catch (error) {
      console.error('❌ AgentBootstrapService: Error during agent initialization:', error);
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

    console.log('🛑 AgentBootstrapService: Shutting down all agents...');

    const shutdownPromises = Array.from(this.agents.values()).map(agent => 
      agent.stopAutoRegistration()
    );

    await Promise.all(shutdownPromises);

    this.agents.clear();
    this.isBootstrapped = false;

    console.log('✅ AgentBootstrapService: All agents shut down gracefully');
  }

  /**
   * Get status of all bootstrapped agents
   */
  getAgentStatus(): Array<{
    agentId: string;
    isRegistered: boolean;
    lastSeen: Date;
    capabilities: number;
    qualityScore: number;
  }> {
    return Array.from(this.agents.values()).map(agent => agent.getStatus());
  }

  /**
   * Check if bootstrap service is active
   */
  isActive(): boolean {
    return this.isBootstrapped;
  }

  /**
   * Get count of active agents
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Restart a specific agent
   */
  async restartAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.log(`⚠️  Agent ${agentId} not found in bootstrap service`);
      return false;
    }

    console.log(`🔄 Restarting ${agentId}...`);
    
    try {
      await agent.stopAutoRegistration();
      await agent.startAutoRegistration();
      console.log(`✅ ${agentId} restarted successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to restart ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Add a new agent to the bootstrap service
   */
  async addAgent(agentId: string, agent: AgentAutoRegistration): Promise<void> {
    if (this.agents.has(agentId)) {
      console.log(`⚠️  Agent ${agentId} already exists - stopping existing agent first`);
      await this.agents.get(agentId)?.stopAutoRegistration();
    }

    this.agents.set(agentId, agent);
    
    if (this.isBootstrapped) {
      await agent.startAutoRegistration();
      console.log(`✅ Added and started ${agentId} to active bootstrap service`);
    } else {
      console.log(`✅ Added ${agentId} to bootstrap service (will start on next bootstrap)`);
    }
  }

  /**
   * Remove an agent from the bootstrap service
   */
  async removeAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.log(`⚠️  Agent ${agentId} not found in bootstrap service`);
      return false;
    }

    await agent.stopAutoRegistration();
    this.agents.delete(agentId);
    console.log(`✅ Removed ${agentId} from bootstrap service`);
    return true;
  }
}

// Singleton instance for global use
export const agentBootstrap = new AgentBootstrapService();

export default AgentBootstrapService;
