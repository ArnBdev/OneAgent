/**
 * AgentFactory - Factory for creating BaseAgent instances
 * 
 * This factory creates BaseAgent implementations that:
 * - Have memory integration
 * - Process messages with AI
 * - Store and recall conversation history
 * - Have specialized domain expertise
 */

import { BaseAgent, AgentConfig } from '../base/BaseAgent';
import { CoreAgent } from '../specialized/CoreAgent';
import { DevAgent } from '../specialized/DevAgent';
import { OfficeAgent } from '../specialized/OfficeAgent';
import { FitnessAgent } from '../specialized/FitnessAgent';
import { TriageAgent } from '../specialized/TriageAgent';
import { loadYamlFile } from '../base/yamlLoader';
import { getPersonaConfig } from '../base/personaRegistry';
import { PromptConfig } from '../base/PromptEngine';
import { OneAgentUnifiedBackbone, createUnifiedId } from '../../utils/UnifiedBackboneService';
import { unifiedAgentCommunicationService } from '../../utils/UnifiedAgentCommunicationService';
import { AgentType } from '../../types/oneagent-backbone-types';

function buildPromptConfig(agentType: string): PromptConfig | undefined {
  const personaConfig = getPersonaConfig(agentType);
  if (!personaConfig?.persona || !personaConfig?.quality) {
    return undefined;
  }
  
  const persona = loadYamlFile(personaConfig.persona);
  const quality = loadYamlFile(personaConfig.quality);
  
  // Return undefined if we can't construct a valid EnhancedPromptConfig
  // The agents will fall back to default prompt configuration
  if (!persona || !quality) {
    return undefined;
  }
  
  // TODO: Properly construct EnhancedPromptConfig from loaded YAML files
  // For now, return undefined to use default configuration
  return undefined;
}

export class AgentFactory {
  private static instances: Map<string, BaseAgent> = new Map();
  private static backbone = OneAgentUnifiedBackbone.getInstance();

  private static setUnifiedContext(agent: BaseAgent, config: AgentConfig, agentType: AgentType): void {
    // Create a canonical session and inject unified context prior to initialize()
    const sessionId = createUnifiedId('session', config.id);
    const context = this.backbone.createAgentContext(config.id, agentType, {
      sessionId,
      capabilities: config.capabilities,
      memoryEnabled: config.memoryEnabled,
      aiEnabled: config.aiEnabled
    });
    agent.setUnifiedContext(context);
  }
  /**
   * Create or get existing CoreAgent instance
   */
  static async createCoreAgent(): Promise<BaseAgent> {
    const agentId = 'CoreAgent';
    
    if (this.instances.has(agentId)) {
      return this.instances.get(agentId)!;
    }

    const config: AgentConfig = {
      id: agentId,
      name: 'Core Agent',
      description: 'Agent specialized in core orchestration',
      capabilities: ['system_coordination', 'agent_integration', 'service_management', 'health_monitoring'],
      memoryEnabled: true,
      aiEnabled: true
    };
    const promptConfig = buildPromptConfig('core');
  const agent = new CoreAgent(config, promptConfig);
  // Inject canonical unified context before initialization
  this.setUnifiedContext(agent, config, 'core');
  await agent.initialize();
  await unifiedAgentCommunicationService.registerAgent({ id: agentId, name: config.name, capabilities: config.capabilities, metadata: { role: 'core' } });
    
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
      console.log(`🔄 Returning existing ${agentId} instance`);
      return this.instances.get(agentId)!;
    }

    const config: AgentConfig = {
      id: agentId,
      name: 'Development Agent',
      description: 'Agent specialized in development tasks',
      capabilities: ['code-review', 'debugging', 'architecture', 'testing'],
      memoryEnabled: true,
      aiEnabled: true
    };
    const promptConfig = buildPromptConfig('development');
  const agent = new DevAgent(config, promptConfig);
  // Inject canonical unified context before initialization
  this.setUnifiedContext(agent, config, 'development');
  await agent.initialize();
  await unifiedAgentCommunicationService.registerAgent({ id: agentId, name: config.name, capabilities: config.capabilities, metadata: { role: 'development' } });
    
    this.instances.set(agentId, agent);
    console.log('✅ DevAgent initialized with memory, AI capabilities, and auto-registration');
    
    return agent;
  }
  /**
   * Create or get existing OfficeAgent instance
   */
  static async createOfficeAgent(): Promise<BaseAgent> {
    const agentId = 'OfficeAgent';
    
    if (this.instances.has(agentId)) {
      console.log(`🔄 Returning existing ${agentId} instance`);
      return this.instances.get(agentId)!;
    }

    const config: AgentConfig = {
      id: agentId,
      name: 'Office Agent',
      description: 'Agent specialized in office productivity tasks',
      capabilities: ['email-management', 'scheduling', 'document-creation', 'communication'],
      memoryEnabled: true,
      aiEnabled: true
    };
    const promptConfig = buildPromptConfig('office');
  const agent = new OfficeAgent(config, promptConfig);
  // Inject canonical unified context before initialization
  this.setUnifiedContext(agent, config, 'office');
  await agent.initialize();
  await unifiedAgentCommunicationService.registerAgent({ id: agentId, name: config.name, capabilities: config.capabilities, metadata: { role: 'office' } });
    
    this.instances.set(agentId, agent);
    console.log('✅ OfficeAgent initialized with memory, AI capabilities, and auto-registration');
    
    return agent;
  }

  /**
   * Create or get existing FitnessAgent instance
   */
  static async createFitnessAgent(): Promise<BaseAgent> {
    const agentId = 'FitnessAgent';
    
    if (this.instances.has(agentId)) {
      console.log(`🔄 Returning existing ${agentId} instance`);
      return this.instances.get(agentId)!;
    }

    const config: AgentConfig = {
      id: agentId,
      name: 'Fitness Agent',
      description: 'Agent specialized in fitness and health guidance',
      capabilities: ['workout-planning', 'nutrition-advice', 'health-tracking', 'motivation'],
      memoryEnabled: true,
      aiEnabled: true
    };
    const promptConfig = buildPromptConfig('fitness');
  const agent = new FitnessAgent(config, promptConfig);
  // Inject canonical unified context before initialization
  this.setUnifiedContext(agent, config, 'fitness');
  await agent.initialize();
  await unifiedAgentCommunicationService.registerAgent({ id: agentId, name: config.name, capabilities: config.capabilities, metadata: { role: 'fitness' } });
    
    this.instances.set(agentId, agent);
    console.log('✅ FitnessAgent initialized with memory and AI capabilities');
    
    return agent;
  }
  /**
   * Create or get existing TriageAgent instance
   */  static async createTriageAgent(): Promise<BaseAgent> {
    const agentId = 'TriageAgent';
    
    if (this.instances.has(agentId)) {
      return this.instances.get(agentId)!;
    }

    const config: AgentConfig = {
      id: agentId,
      name: 'Triage Agent',
      description: 'Agent specialized in task routing and prioritization',
      capabilities: ['task-routing', 'priority-assessment', 'delegation', 'coordination'],
      memoryEnabled: true,
      aiEnabled: true
    };
    const promptConfig = buildPromptConfig('triage');
  const agent = new TriageAgent(config, promptConfig);
  // Inject canonical unified context before initialization
  this.setUnifiedContext(agent, config, 'triage');
  await agent.initialize();
  await unifiedAgentCommunicationService.registerAgent({ id: agentId, name: config.name, capabilities: config.capabilities, metadata: { role: 'triage' } });
    
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
   */  static getAgentCapabilitiesSummary(): Record<string, string[]> {
    const summary: Record<string, string[]> = {};
    
    Array.from(this.instances.entries()).forEach(([agentId, agent]) => {
      summary[agentId] = agent.getConfig().capabilities;
    });
    
    return summary;
  }
}
