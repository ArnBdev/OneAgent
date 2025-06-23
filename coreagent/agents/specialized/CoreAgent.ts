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

import { BaseAgent, AgentConfig, AgentContext, AgentResponse, Message } from '../base/BaseAgent';
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
  private tasks: Map<string, Task> = new Map();
  private agentRegistry: Map<string, any> = new Map();
  private conversationHistory: Message[] = [];  constructor(config?: AgentConfig) {
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
      memoryEnabled: true,  // REAL memory integration
      aiEnabled: true       // REAL AI integration
    };

    super(config || defaultConfig);
  }

  /**
   * REAL message processing with orchestration logic
   */
  async processMessage(context: AgentContext, message: string): Promise<CoreAgentResponse> {
    this.validateContext(context);

    // Store the incoming message in memory
    await this.storeUserMessage(context.user.id, message, context);

    // Add to conversation history
    const userMessage: Message = {
      id: uuidv4(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
      metadata: {
        sessionId: context.sessionId,
        userId: context.user.id
      }
    };
    this.conversationHistory.push(userMessage);

    // Analyze the request for orchestration needs
    const orchestrationAnalysis = await this.analyzeOrchestrationRequest(message, context);
    
    // Generate coordinated response
    const response = await this.generateOrchestrationResponse(message, context, orchestrationAnalysis);

    // Store the agent response in memory
    await this.storeAgentResponse(context.user.id, response, context);

    // Add to conversation history
    const agentMessage: Message = {
      id: uuidv4(),
      content: response,
      sender: 'agent',
      timestamp: new Date(),
      metadata: {
        sessionId: context.sessionId,
        orchestrationNeeded: orchestrationAnalysis.needsOrchestration,
        tasksCreated: orchestrationAnalysis.tasksToCreate.length
      }
    };
    this.conversationHistory.push(agentMessage);

    return this.createCoreResponse(response, orchestrationAnalysis);
  }

  /**
   * Analyze if the request needs multi-agent orchestration
   */
  private async analyzeOrchestrationRequest(message: string, context: AgentContext): Promise<{
    needsOrchestration: boolean;
    suggestedAgents: string[];
    tasksToCreate: Partial<Task>[];
    complexity: 'simple' | 'medium' | 'complex';
  }> {
    const messageLower = message.toLowerCase();
    
    // Check for complex requests that need multiple agents
    const orchestrationKeywords = [
      'coordinate', 'multiple', 'team', 'collaborate', 'complex project',
      'end-to-end', 'full stack', 'comprehensive', 'integrate'
    ];
    
    const needsOrchestration = orchestrationKeywords.some(keyword => 
      messageLower.includes(keyword)
    );

    // Suggest agents based on request content
    const suggestedAgents: string[] = [];
    if (messageLower.includes('code') || messageLower.includes('develop')) {
      suggestedAgents.push('DevAgent');
    }
    if (messageLower.includes('office') || messageLower.includes('document')) {
      suggestedAgents.push('OfficeAgent');
    }
    if (messageLower.includes('fitness') || messageLower.includes('health')) {
      suggestedAgents.push('FitnessAgent');
    }

    // Create tasks if orchestration is needed
    const tasksToCreate: Partial<Task>[] = [];
    if (needsOrchestration) {
      tasksToCreate.push({
        description: `Coordinate response to: ${message}`,
        priority: 'medium',
        status: 'pending',
        context: { originalRequest: message, sessionId: context.sessionId }
      });
    }

    return {
      needsOrchestration,
      suggestedAgents,
      tasksToCreate,
      complexity: needsOrchestration ? 'complex' : 'simple'
    };
  }

  /**
   * Generate orchestration response using AI
   */
  private async generateOrchestrationResponse(
    message: string, 
    context: AgentContext,
    analysis: any
  ): Promise<string> {
    // Search for relevant coordination memories
    const relevantMemories = await this.searchMemories(context.user.id, message, 5);
    
    // Build orchestration prompt
    const orchestrationPrompt = this.buildOrchestrationPrompt(message, analysis, relevantMemories);
    
    // Generate response using AI
    const response = await this.generateResponse(orchestrationPrompt, relevantMemories);
    
    return response;
  }

  /**
   * Build specialized orchestration prompt
   */
  private buildOrchestrationPrompt(message: string, analysis: any, memories: any[]): string {
    const memoryContext = memories.length > 0 
      ? `\nRelevant past coordination:\n${memories.map(m => `- ${m.content}`).join('\n')}`
      : '';

    const systemPrompt = `You are CoreAgent, the central orchestrator for the OneAgent system. You coordinate multiple specialized agents and manage complex tasks.

Your capabilities:
- Task orchestration and delegation
- Multi-agent coordination
- System health monitoring
- Memory management across sessions
- Constitutional AI validation

Analysis of current request:
- Needs orchestration: ${analysis.needsOrchestration}
- Suggested agents: ${analysis.suggestedAgents.join(', ') || 'None'}
- Complexity: ${analysis.complexity}

${memoryContext}

User request: ${message}

If orchestration is needed, explain how you'll coordinate multiple agents. If not, provide direct assistance while maintaining system oversight.`;

    return systemPrompt;
  }

  /**
   * Create a new task
   */
  async createTask(description: string, priority: Task['priority'] = 'medium'): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      description,
      priority,
      status: 'pending',
      context: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(task.id, task);
    
    // Store task in memory for persistence
    await this.addMemory('system', `Task created: ${description}`, {
      taskId: task.id,
      priority,
      createdAt: task.createdAt.toISOString()
    });

    return task;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: Task['status']): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.status = status;
    task.updatedAt = new Date();
    
    // Store update in memory
    await this.addMemory('system', `Task ${taskId} status updated to ${status}`, {
      taskId,
      newStatus: status,
      updatedAt: task.updatedAt.toISOString()
    });

    return true;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Register an agent in the system
   */
  async registerAgent(agentId: string, agentData: any): Promise<void> {
    this.agentRegistry.set(agentId, agentData);
    
    await this.addMemory('system', `Agent registered: ${agentId}`, {
      agentId,
      capabilities: agentData.capabilities,
      registeredAt: new Date().toISOString()
    });
  }

  /**
   * Store user message in memory
   */
  private async storeUserMessage(userId: string, message: string, context: AgentContext): Promise<void> {
    const content = `User coordination request: ${message}`;
    const metadata = {
      messageType: 'coordination_request',
      agentId: this.config.id,
      sessionId: context.sessionId,
      timestamp: new Date().toISOString(),
      userId: userId
    };

    await this.addMemory(userId, content, metadata);
  }

  /**
   * Store agent response in memory
   */
  private async storeAgentResponse(userId: string, response: string, context: AgentContext): Promise<void> {
    const content = `CoreAgent coordination response: ${response}`;
    const metadata = {
      messageType: 'coordination_response',
      agentId: this.config.id,
      sessionId: context.sessionId,
      timestamp: new Date().toISOString(),
      userId: userId
    };

    await this.addMemory(userId, content, metadata);
  }

  /**
   * Create specialized core response
   */
  private createCoreResponse(content: string, analysis: any): CoreAgentResponse {
    return {
      content,
      actions: [{
        type: 'orchestration',
        description: 'Provided system orchestration and coordination',
        parameters: { 
          needsOrchestration: analysis.needsOrchestration,
          complexity: analysis.complexity
        }
      }],
      memories: [], // Memories are handled separately
      metadata: {
        agentId: this.config.id,
        timestamp: new Date().toISOString(),
        orchestrationAnalysis: analysis,
        totalTasks: this.tasks.size,
        registeredAgents: this.agentRegistry.size,
        isRealAgent: true // NOT just metadata!
      }
    };
  }

  /**
   * Get system health summary
   */
  getSystemHealth(): {
    totalTasks: number;
    activeTasks: number;
    registeredAgents: number;
    conversationLength: number;
  } {
    const activeTasks = Array.from(this.tasks.values())
      .filter(task => task.status === 'in_progress').length;

    return {
      totalTasks: this.tasks.size,
      activeTasks,
      registeredAgents: this.agentRegistry.size,
      conversationLength: this.conversationHistory.length
    };
  }

  /**
   * Override cleanup to save state
   */
  async cleanup(): Promise<void> {
    // Save final system state to memory
    const systemHealth = this.getSystemHealth();
    await this.addMemory('system', `CoreAgent session ended. Final state: ${JSON.stringify(systemHealth)}`, {
      sessionEnd: true,
      finalState: systemHealth
    });
    
    await super.cleanup();
  }
}

// Export singleton instance for use in the server
export const coreAgent = new CoreAgent();
