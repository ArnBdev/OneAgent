/**
 * AgentFactory - Factory for creating BaseAgent instances
 * 
 * This factory creates BaseAgent implementations that:
 * - Have memory integration
 * - Process messages with AI
 * - Store and recall conversation history
 * - Have specialized domain expertise
 */

import { BaseAgent } from '../base/BaseAgent';
import { CoreAgent } from '../specialized/CoreAgent';
import { DevAgent } from '../specialized/DevAgent';
import { OfficeAgent } from '../specialized/OfficeAgent';
import { FitnessAgent } from '../specialized/FitnessAgent';
import { TriageAgent } from '../specialized/TriageAgent';

export class AgentFactory {
  private static instances: Map<string, BaseAgent> = new Map();
  /**
   * Create or get existing CoreAgent instance
   */
  static async createCoreAgent(): Promise<BaseAgent> {
    const agentId = 'CoreAgent';
    
    if (this.instances.has(agentId)) {
      return this.instances.get(agentId)!;
    }

    const agent = new CoreAgent();
    await agent.initialize();
    
    this.instances.set(agentId, agent);
    console.log('✅ CoreAgent initialized with memory and AI capabilities');
    
    return agent;
  }

  /**
   * Create or get existing DevAgent instance
   */
  static async createDevAgent(): Promise<BaseAgent> {
    const agentId = 'DevAgent';
    
    if (this.instances.has(agentId)) {
      return this.instances.get(agentId)!;
    }

    const agent = new DevAgent();
    await agent.initialize();
    
    this.instances.set(agentId, agent);
    console.log('✅ DevAgent initialized with memory and AI capabilities');
    
    return agent;
  }
  /**
   * Create or get existing OfficeAgent instance
   */
  static async createOfficeAgent(): Promise<BaseAgent> {
    const agentId = 'OfficeAgent';
    
    if (this.instances.has(agentId)) {
      return this.instances.get(agentId)!;
    }

    const agent = new OfficeAgent();
    await agent.initialize();
    
    this.instances.set(agentId, agent);
    console.log('✅ OfficeAgent initialized with memory and AI capabilities');
    
    return agent;
  }

  /**
   * Create or get existing FitnessAgent instance
   */
  static async createFitnessAgent(): Promise<BaseAgent> {
    const agentId = 'FitnessAgent';
    
    if (this.instances.has(agentId)) {
      return this.instances.get(agentId)!;
    }

    const agent = new FitnessAgent();
    await agent.initialize();
    
    this.instances.set(agentId, agent);
    console.log('✅ FitnessAgent initialized with memory and AI capabilities');
    
    return agent;
  }
  /**
   * Create or get existing TriageAgent instance
   */
  static async createTriageAgent(): Promise<BaseAgent> {
    const agentId = 'TriageAgent';
    
    if (this.instances.has(agentId)) {
      return this.instances.get(agentId)!;
    }

    const agent = new TriageAgent();
    await agent.initialize();
    
    this.instances.set(agentId, agent);
    console.log('✅ TriageAgent initialized with memory and AI capabilities');
    
    return agent;
  }

  /**
   * Get all initialized agents
   */
  static getAllAgents(): Map<string, BaseAgent> {
    return new Map(this.instances);
  }

  /**
   * Get agent by ID
   */
  static getAgent(agentId: string): BaseAgent | undefined {
    return this.instances.get(agentId);
  }

  /**
   * Check if agent exists and is initialized
   */
  static hasAgent(agentId: string): boolean {
    const agent = this.instances.get(agentId);
    return agent !== undefined && agent.isReady();
  }

  /**
   * Get agent count
   */
  static getAgentCount(): number {
    return this.instances.size;
  }

  /**
   * Create all 5 core agents
   */
  static async createAllCoreAgents(): Promise<BaseAgent[]> {
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
  static async shutdownAllAgents(): Promise<void> {
    console.log('🛑 Shutting down all real agents...');
    
    const shutdownPromises = Array.from(this.instances.values()).map(agent => 
      agent.cleanup()
    );

    await Promise.all(shutdownPromises);
    this.instances.clear();
    
    console.log('✅ All real agents shut down gracefully');
  }

  /**
   * Get agent capabilities summary
   */
  static getAgentCapabilitiesSummary(): Record<string, string[]> {
    const summary: Record<string, string[]> = {};
    
    for (const [agentId, agent] of this.instances) {
      summary[agentId] = agent.getConfig().capabilities;
    }
    
    return summary;
  }
}
