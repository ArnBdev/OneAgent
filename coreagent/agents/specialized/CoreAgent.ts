/**
 * CoreAgent.ts - Core Orchestrator Agent Implementation
 * 
 * Core BaseAgent instance that:
 * - Inherits from BaseAgent with full functionality
 * - Orchestrates other agents
 * - Manages tasks and coordination
 * - Uses memory for cross-session persistence
 * - Provides actual system coordination
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResponse } from '../base/BaseAgent';
import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoreAgentResponse extends AgentResponse {
  tasks?: Task[];
  coordination?: string[];
  systemHealth?: number;
}

/**
 * Core Agent - BaseAgent implementation for orchestration
 */
export class CoreAgent extends BaseAgent {
  constructor(config?: AgentConfig, promptConfig?: any) {
    const defaultConfig: AgentConfig = {
      id: 'CoreAgent',
      name: 'CoreAgent',
      description: 'REAL orchestrator agent with memory, AI, and coordination capabilities',
      capabilities: [
        'task_orchestration',
        'agent_coordination', 
        'system_monitoring',
        'memory_management',
        'constitutional_validation',
        'bmad_analysis',
        'multi_agent_communication'
      ],
      memoryEnabled: true,
      aiEnabled: true
    };
    super(config || defaultConfig, promptConfig);
  }

  get id(): string {
    return this.config.id;
  }

  async processMessage(_context: AgentContext, _message: string): Promise<any> {
    throw new Error('processMessage is not implemented in CoreAgent. Use executeAction for orchestration.');
  }
}

// Export singleton instance for use in the server
export const coreAgent = new CoreAgent();
