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
import { TriageAgent } from '../specialized/TriageAgent';
import { DevAgent } from '../specialized/DevAgent';
import { EnhancedDevAgent } from '../specialized/EnhancedDevAgent';

export type AgentType = 'office' | 'fitness' | 'general' | 'coach' | 'advisor' | 'triage' | 'development' | 'enhanced-development';

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
    office: ['document_processing', 'calendar_management', 'email_assistance', 'task_organization'],
    fitness: ['workout_planning', 'nutrition_tracking', 'progress_monitoring', 'goal_setting'],
    general: ['conversation', 'information_retrieval', 'task_assistance'],
    coach: ['goal_setting', 'progress_tracking', 'motivation', 'feedback'],
    advisor: ['analysis', 'recommendations', 'strategic_planning', 'consultation'],
    triage: ['task_routing', 'error_recovery', 'agent_health_monitoring', 'workload_balancing'],
    development: ['code_analysis', 'test_generation', 'documentation_sync', 'refactoring', 'performance_optimization', 'security_scanning', 'git_workflow', 'dependency_management'],
    'enhanced-development': ['revolutionary_prompting', 'constitutional_ai', 'bmad_elicitation', 'chain_of_verification', 'quality_validation', 'self_correction', 'adaptive_prompting', 'code_analysis', 'test_generation', 'documentation_sync', 'refactoring', 'performance_optimization', 'security_scanning', 'git_workflow', 'dependency_management']
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
      case 'office':
        agent = new OfficeAgent(agentConfig);
        break;
      case 'fitness':
        agent = new FitnessAgent(agentConfig);
        break;
      case 'triage':
        agent = new TriageAgent(agentConfig);
        break;
      case 'development':
        agent = new DevAgent(agentConfig);
        break;
      case 'enhanced-development':
        agent = new EnhancedDevAgent(agentConfig);
        break;
      case 'general':
      case 'coach':
      case 'advisor':
        // For now, these use a placeholder implementation
        // TODO: Implement GeneralAgent, CoachAgent, AdvisorAgent
        throw new Error(`Agent type '${factoryConfig.type}' not yet implemented`);
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