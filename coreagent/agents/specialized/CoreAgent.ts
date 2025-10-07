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
import { ISpecializedAgent } from '../base/ISpecializedAgent';
import { PromptConfig } from '../base/PromptEngine';
import { createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';

export interface Task {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  context: Record<string, unknown>;
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
export class CoreAgent extends BaseAgent implements ISpecializedAgent {
  constructor(config?: AgentConfig, promptConfig?: PromptConfig) {
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
        'multi_agent_communication',
      ],
      memoryEnabled: true,
      aiEnabled: true,
    };
    super(config || defaultConfig, promptConfig);
  }

  get id(): string {
    return this.config.id;
  }

  async processMessage(context: AgentContext, message: string): Promise<CoreAgentResponse> {
    this.validateContext(context);

    // Core agent processes orchestration and system coordination requests
    const response = await this.generateCoreResponse(message);

    // Store interaction in memory for system coordination tracking (canonical MemoryAddRequest)
    await this.addMemory({
      content: `Core orchestration request: ${message}\nResponse: ${response}`,
      metadata: {
        type: 'core_orchestration',
        category: 'system_coordination',
        timestamp: createUnifiedTimestamp().iso,
        sessionId: context.sessionId,
        userId: context.user.id,
      },
    });

    const base = {
      content: response,
      actions: [],
      memories: [],
      metadata: {
        agentId: this.config.id,
        timestamp: createUnifiedTimestamp().iso,
        systemHealth: await this.getSystemHealth(),
        isRealAgent: true,
      },
    };
    return (await this.finalizeResponseWithTaskDetection(message, base)) as CoreAgentResponse;
  }

  /**
   * Generate core orchestration response
   */
  private async generateCoreResponse(message: string): Promise<string> {
    const corePrompt = `You are CoreAgent, the central orchestrator for the OneAgent system.
Your role is to coordinate system activities, monitor agent health, and manage resources.

User request: ${message}

Provide coordination guidance, system status updates, or delegate to appropriate specialized agents.`;

    return await this.generateResponse(corePrompt);
  }

  /**
   * Get current system health metrics
   */
  private async getSystemHealth(): Promise<number> {
    // TODO: Implement actual system health calculation
    // For now, return a baseline health score
    return 85;
  }
}

// Export singleton instance for use in the server
export const coreAgent = new CoreAgent();
