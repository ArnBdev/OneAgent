/**
 * AgentFactory - Factory for creating specialized agents
 * 
 * This factory provides a centralized way to create and configure
 * different types of specialized agents in the OneAgent ecosystem.
 */

import { ISpecializedAgent } from './ISpecializedAgent';
import { AgentConfig } from './BaseAgent';
import { OfficeAgent } from '../specialized/OfficeAgent';
import { FitnessAgent } from '../specialized/FitnessAgent';
import { DevAgent } from '../specialized/DevAgent';
import { TemplateAgent } from '../templates/TemplateAgent';

export type AgentType = 'enhanced-development' | 'development' | 'office' | 'fitness' | 'general' | 'coach' | 'advisor' | 'template';

export interface AgentFactoryConfig {
  type: AgentType;
  id: string;
  name: string;
  description?: string;
  customCapabilities?: string[];
  memoryEnabled?: boolean;
  aiEnabled?: boolean;
}

export class AgentFactory {  private static readonly DEFAULT_CAPABILITIES = {
    'enhanced-development': ['revolutionary_prompting', 'constitutional_ai', 'bmad_elicitation', 'chain_of_verification', 'quality_validation', 'self_correction', 'adaptive_prompting', 'code_analysis', 'test_generation', 'documentation_sync', 'refactoring'],
    'development': ['code_analysis', 'test_generation', 'documentation_sync', 'refactoring', 'performance_optimization', 'security_scanning', 'git_workflow', 'dependency_management'],
    office: ['document_processing', 'calendar_management', 'email_assistance', 'task_organization'],
    fitness: ['workout_planning', 'nutrition_tracking', 'progress_monitoring', 'goal_setting'],
    general: ['conversation', 'information_retrieval', 'task_assistance'],
    coach: ['goal_setting', 'progress_tracking', 'motivation', 'feedback'],
    advisor: ['analysis', 'recommendations', 'strategic_planning', 'consultation'],
    template: ['unified_memory', 'multi_agent_coordination', 'constitutional_ai', 'bmad_analysis', 'quality_scoring', 'time_awareness', 'comprehensive_error_handling', 'extensible_design', 'best_practices']
  };

  /**
   * Create a specialized agent based on type and configuration
   */
  static async createAgent(factoryConfig: AgentFactoryConfig): Promise<ISpecializedAgent> {
    const agentConfig: AgentConfig = {
      id: factoryConfig.id,
      name: factoryConfig.name,
      description: factoryConfig.description || `${factoryConfig.type} agent`,
      capabilities: factoryConfig.customCapabilities || AgentFactory.DEFAULT_CAPABILITIES[factoryConfig.type],
      memoryEnabled: factoryConfig.memoryEnabled ?? true,
      aiEnabled: factoryConfig.aiEnabled ?? true
    };

    let agent: ISpecializedAgent;    switch (factoryConfig.type) {
      case 'enhanced-development':
        // Enhanced development agent with Revolutionary Prompt Engineering
        agent = new DevAgent({
          ...agentConfig,
          capabilities: [
            ...agentConfig.capabilities,
            'revolutionary_prompting',
            'constitutional_ai',
            'bmad_elicitation',
            'quality_validation'
          ]
        });
        break;
      case 'development':
        agent = new DevAgent(agentConfig);
        break;
      case 'office':
        agent = new OfficeAgent(agentConfig);
        break;      case 'fitness':
        agent = new FitnessAgent(agentConfig);
        break;
      case 'template':
        agent = new TemplateAgent(agentConfig);
        break;
      default:
        throw new Error(`Unknown agent type: ${factoryConfig.type}`);
    }

    await agent.initialize();
    return agent;
  }

  /**
   * Get default capabilities for an agent type
   */
  static getDefaultCapabilities(type: AgentType): string[] {
    return [...AgentFactory.DEFAULT_CAPABILITIES[type]];
  }

  /**
   * Get available agent types
   */
  static getAvailableTypes(): AgentType[] {
    return Object.keys(AgentFactory.DEFAULT_CAPABILITIES) as AgentType[];
  }

  /**
   * Validate agent factory configuration
   */
  static validateConfig(config: AgentFactoryConfig): void {
    if (!config.id || !config.name || !config.type) {
      throw new Error('Agent factory config must include id, name, and type');
    }

    if (!AgentFactory.DEFAULT_CAPABILITIES[config.type]) {
      throw new Error(`Unsupported agent type: ${config.type}`);
    }
  }

  /**
   * Create multiple agents from configurations
   */
  static async createAgents(configs: AgentFactoryConfig[]): Promise<ISpecializedAgent[]> {
    const agents: ISpecializedAgent[] = [];
    
    for (const config of configs) {
      try {
        const agent = await AgentFactory.createAgent(config);
        agents.push(agent);
      } catch (error) {
        console.error(`Failed to create agent ${config.id}:`, error);
        throw error;
      }
    }

    return agents;
  }
}