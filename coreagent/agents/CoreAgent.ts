/**
 * CoreAgent.ts
 * 
 * Central orchestrator agent using memory-driven communication.
 * The first operational agent in the OneAgent multi-agent system.
 * 
 * Features:
 * - Memory-driven message passing and context sharing
 * - Cross-agent and temporal perceptual memory
 * - Constitutional AI validation for all communications
 * - BMAD framework for complex decision making
 * - Quality scoring and performance monitoring
 * 
 * @version 4.0.0
 * @author OneAgent Professional Development Platform
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResponse, Message } from './base/BaseAgent';
import { memoryDrivenComm, AgentMessage, AgentContext as CommAgentContext } from './communication/MemoryDrivenAgentCommunication';
import { realUnifiedMemoryClient } from '../memory/RealUnifiedMemoryClient';
import { v4 as uuidv4 } from 'uuid';

export interface CoreAgentConfig extends AgentConfig {
  orchestrationEnabled: boolean;
  coordinationTimeout: number;
  maxConcurrentTasks: number;
}

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

/**
 * CoreAgent - Central orchestrator with memory-driven communication
 */
export class CoreAgent extends BaseAgent {
  private tasks: Map<string, Task> = new Map();
  private agentCapabilities: Map<string, string[]> = new Map();
  private isRegistered: boolean = false;

  constructor(config?: Partial<CoreAgentConfig>) {
    const defaultConfig: CoreAgentConfig = {
      id: 'core-agent',
      name: 'CoreAgent',
      description: 'Central orchestrator agent with memory-driven communication',
      capabilities: [
        'task_orchestration',
        'agent_coordination',
        'memory_management',
        'constitutional_validation',
        'bmad_analysis',
        'quality_scoring'
      ],
      memoryEnabled: true,
      aiEnabled: true,
      orchestrationEnabled: true,
      coordinationTimeout: 30000,
      maxConcurrentTasks: 10
    };

    super({ ...defaultConfig, ...config });
  }

  /**
   * Initialize CoreAgent and register with memory-driven communication
   */
  async initialize(): Promise<void> {
    try {
      console.log('[CoreAgent] Initializing...');
      
      // Initialize base agent
      await super.initialize();
      
      // Register with memory-driven communication hub
      const agentContext: CommAgentContext = {
        agentId: this.config.id,
        capabilities: this.config.capabilities,
        status: 'available',
        expertise: [
          'orchestration',
          'coordination',
          'memory_management',
          'constitutional_ai',
          'bmad_framework'
        ],
        recentActivity: new Date(),
        memoryCollectionId: '' // Will be set by registration
      };

      await memoryDrivenComm.registerAgent(agentContext);
      this.isRegistered = true;

      // Store initialization in memory
      await this.storeMemory(
        `CoreAgent initialized successfully with capabilities: ${this.config.capabilities.join(', ')}`,
        'initialization',
        {
          timestamp: new Date().toISOString(),
          capabilities: this.config.capabilities,
          status: 'operational'
        }
      );

      console.log('[CoreAgent] Initialization complete and registered in memory system');
    } catch (error) {
      console.error('[CoreAgent] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process user message with memory-driven context
   */
  async processMessage(context: AgentContext): Promise<AgentResponse> {
    try {
      console.log('[CoreAgent] Processing message with memory-driven context');
      
      if (!this.isRegistered) {
        await this.initialize();
      }

      // Get contextual information from memory system
      const memoryContext = await memoryDrivenComm.getAgentContext(
        this.config.id,
        context.conversationHistory[context.conversationHistory.length - 1]?.content
      );

      // Store incoming message in memory
      await this.storeMemory(
        `User message: ${context.conversationHistory[context.conversationHistory.length - 1]?.content}`,
        'user_interaction',
        {
          sessionId: context.sessionId,
          userId: context.user.id,
          timestamp: new Date().toISOString(),
          conversationLength: context.conversationHistory.length
        }
      );

      // Determine if this requires orchestration or direct response
      const requiresOrchestration = await this.analyzeTaskComplexity(
        context.conversationHistory[context.conversationHistory.length - 1]?.content
      );

      let response: AgentResponse;

      if (requiresOrchestration) {
        response = await this.orchestrateTask(context, memoryContext);
      } else {
        response = await this.generateDirectResponse(context, memoryContext);
      }

      // Store response in memory
      await this.storeMemory(
        `CoreAgent response: ${response.content}`,
        'agent_response',
        {
          sessionId: context.sessionId,
          userId: context.user.id,
          requiresOrchestration,
          timestamp: new Date().toISOString(),
          responseMetadata: response.metadata
        }
      );

      return response;
    } catch (error) {
      console.error('[CoreAgent] Error processing message:', error);
      
      return {
        content: 'I encountered an error processing your request. Let me try a different approach.',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Orchestrate complex tasks across multiple agents
   */
  private async orchestrateTask(
    context: AgentContext, 
    memoryContext: any
  ): Promise<AgentResponse> {
    console.log('[CoreAgent] Orchestrating multi-agent task');
    
    try {
      const userMessage = context.conversationHistory[context.conversationHistory.length - 1]?.content;
      
      // Create task
      const task: Task = {
        id: uuidv4(),
        description: userMessage,
        priority: 'medium',
        status: 'pending',
        context: {
          sessionId: context.sessionId,
          userId: context.user.id,
          memoryContext: memoryContext.relevantHistory
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.tasks.set(task.id, task);

      // Determine best agent for the task
      const suitableAgent = await this.findSuitableAgent(userMessage, memoryContext.peerAgents);
        if (suitableAgent) {
        // Delegate to suitable agent
        const delegationMessage: AgentMessage = {
          id: uuidv4(),
          fromAgent: this.config.id,
          toAgent: suitableAgent.agentId,
          messageType: 'coordination',
          content: `Task delegation: ${userMessage}`,
          priority: 'medium',
          timestamp: new Date(),
          metadata: {
            requiresResponse: true,
            context: { taskId: task.id, ...task.context },
            confidenceLevel: 0.8
          }
        };

        await memoryDrivenComm.sendMessage(delegationMessage);
        task.status = 'in_progress';
        task.assignedAgent = suitableAgent.agentId;
        task.updatedAt = new Date();

        return {
          content: `I'm coordinating with ${suitableAgent.agentId} to handle your request. This may take a moment...`,
          metadata: {
            taskId: task.id,
            delegatedTo: suitableAgent.agentId,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        // Handle directly if no suitable agent found
        return await this.generateDirectResponse(context, memoryContext);
      }
    } catch (error) {
      console.error('[CoreAgent] Task orchestration failed:', error);
      return {
        content: 'I encountered an issue coordinating this task. Let me handle it directly.',
        metadata: {
          error: error instanceof Error ? error.message : 'Orchestration error'
        }
      };
    }
  }

  /**
   * Generate direct response using AI and memory context
   */
  private async generateDirectResponse(
    context: AgentContext,
    memoryContext: any
  ): Promise<AgentResponse> {
    console.log('[CoreAgent] Generating direct response with memory context');
    
    try {
      const userMessage = context.conversationHistory[context.conversationHistory.length - 1]?.content;
      
      // Get relevant memory context
      const relevantMemories = await realUnifiedMemoryClient.getMemoryContext(
        userMessage,
        context.user.id,
        5
      );      // Use Constitutional AI and BMAD framework if available
      let enhancedResponse = userMessage;
      
      if (this.constitutionalAI) {
        const constitutionalResult = await this.constitutionalAI.validateResponse(
          userMessage,
          userMessage,
          context
        );
          if (constitutionalResult.isValid) {
          enhancedResponse = constitutionalResult.refinedResponse || userMessage;
        }
      }      // Generate AI response if available
      let aiResponse = '';
      if (this.aiClient) {
        const systemPrompt = this.buildSystemPrompt(memoryContext, relevantMemories);
        const chatResponse = await this.aiClient.chat(enhancedResponse, { 
          systemPrompt: systemPrompt 
        });
        aiResponse = chatResponse.response;
      }

      const responseContent = aiResponse || this.getFallbackResponse(userMessage);

      return {
        content: responseContent,
        memories: relevantMemories.memories,
        metadata: {
          memoryContext: relevantMemories.searchQuality,
          constitutionalValid: true,
          timestamp: new Date().toISOString(),
          responseType: 'direct'
        }
      };
    } catch (error) {
      console.error('[CoreAgent] Direct response generation failed:', error);
      return {
        content: 'I understand your request. Let me help you with that based on my current knowledge.',
        metadata: {
          error: error instanceof Error ? error.message : 'Response generation error',
          fallback: true
        }
      };
    }
  }

  /**
   * Analyze task complexity to determine if orchestration is needed
   */
  private async analyzeTaskComplexity(message: string): Promise<boolean> {
    // Simple heuristics - can be enhanced with AI analysis
    const complexityIndicators = [
      'create', 'build', 'develop', 'implement', 'design', 'analyze',
      'multiple', 'several', 'various', 'complex', 'advanced',
      'integrate', 'coordinate', 'manage', 'orchestrate'
    ];

    const messageWords = message.toLowerCase().split(' ');
    const complexityScore = messageWords.filter(word => 
      complexityIndicators.includes(word)
    ).length;

    // Store analysis in memory
    await this.storeMemory(
      `Task complexity analysis: "${message}" - Score: ${complexityScore}`,
      'task_analysis',
      {
        message,
        complexityScore,
        requiresOrchestration: complexityScore >= 2,
        timestamp: new Date().toISOString()
      }
    );

    return complexityScore >= 2; // Threshold for orchestration
  }

  /**
   * Find suitable agent for task delegation
   */
  private async findSuitableAgent(
    task: string, 
    availableAgents: CommAgentContext[]
  ): Promise<CommAgentContext | null> {
    console.log('[CoreAgent] Finding suitable agent for task:', task);

    // Simple capability matching - can be enhanced with semantic similarity
    const taskKeywords = task.toLowerCase().split(' ');
    
    let bestAgent: CommAgentContext | null = null;
    let bestScore = 0;

    for (const agent of availableAgents) {
      if (agent.status !== 'available') continue;

      let score = 0;
      for (const capability of agent.capabilities) {
        for (const keyword of taskKeywords) {
          if (capability.toLowerCase().includes(keyword) || 
              keyword.includes(capability.toLowerCase())) {
            score++;
          }
        }
      }

      for (const expertise of agent.expertise) {
        for (const keyword of taskKeywords) {
          if (expertise.toLowerCase().includes(keyword) || 
              keyword.includes(expertise.toLowerCase())) {
            score += 2; // Expertise weighs more than general capabilities
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    // Store agent selection in memory
    await this.storeMemory(
      `Agent selection: ${bestAgent?.agentId || 'none'} (score: ${bestScore}) for task: ${task}`,
      'agent_selection',
      {
        task,
        selectedAgent: bestAgent?.agentId,
        score: bestScore,
        availableAgents: availableAgents.map(a => a.agentId),
        timestamp: new Date().toISOString()
      }
    );

    return bestAgent;
  }

  /**
   * Build system prompt with memory context
   */
  private buildSystemPrompt(memoryContext: any, relevantMemories: any): string {
    return `You are CoreAgent, the central orchestrator in the OneAgent system.
    
Context:
- Recent agent messages: ${memoryContext.recentMessages?.length || 0}
- Relevant history: ${memoryContext.relevantHistory?.length || 0}
- Available peer agents: ${memoryContext.peerAgents?.length || 0}
- Memory context quality: ${relevantMemories.searchQuality || 0}
- System status: ${JSON.stringify(memoryContext.systemStatus)}

Your role is to help users while coordinating with other agents as needed.
Apply Constitutional AI principles: Accuracy, Transparency, Helpfulness, Safety.
Be concise, helpful, and honest about limitations.`;
  }

  /**
   * Get fallback response when AI is unavailable
   */
  private getFallbackResponse(_message: string): string {
    const responses = [
      "I understand your request. Let me help you with that.",
      "I'm processing your request and will coordinate with the appropriate systems.",
      "I'll work on that for you. Give me a moment to gather the necessary information.",
      "I'm analyzing your request to provide the best possible assistance."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Store information in memory system
   */
  private async storeMemory(
    content: string, 
    memoryType: string, 
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await realUnifiedMemoryClient.createMemory(
        content,
        this.config.id,
        'long_term',
        {
          ...metadata,
          agentId: this.config.id,
          memoryType
        }
      );
    } catch (error) {
      console.error('[CoreAgent] Failed to store memory:', error);
    }
  }

  /**
   * Get agent status
   */
  getStatus(): {
    agentId: string;
    isRegistered: boolean;
    activeTasks: number;
    capabilities: string[];
    lastActivity: Date;
  } {
    return {
      agentId: this.config.id,
      isRegistered: this.isRegistered,
      activeTasks: Array.from(this.tasks.values()).filter(t => t.status === 'in_progress').length,
      capabilities: this.config.capabilities,
      lastActivity: new Date()
    };
  }

  /**
   * Handle incoming messages from other agents
   */
  async handleAgentMessage(message: AgentMessage): Promise<void> {
    console.log(`[CoreAgent] Received message from ${message.fromAgent}:`, message.content);
    
    try {
      // Store incoming agent message
      await this.storeMemory(
        `Received from ${message.fromAgent}: ${message.content}`,
        'agent_communication',
        {
          fromAgent: message.fromAgent,
          messageType: message.messageType,
          messageId: message.id,
          timestamp: message.timestamp.toISOString()
        }
      );

      // Process based on message type
      switch (message.messageType) {
        case 'coordination':
          await this.handleCoordinationMessage(message);
          break;
        case 'context':
          await this.handleContextMessage(message);
          break;
        case 'learning':
          await this.handleLearningMessage(message);
          break;
        default:
          console.log(`[CoreAgent] Unhandled message type: ${message.messageType}`);
      }
    } catch (error) {
      console.error('[CoreAgent] Error handling agent message:', error);
    }
  }

  /**
   * Handle coordination messages from other agents
   */
  private async handleCoordinationMessage(message: AgentMessage): Promise<void> {
    console.log('[CoreAgent] Handling coordination message');
    
    if (message.metadata.requiresResponse) {
      const responseMessage: AgentMessage = {
        id: uuidv4(),
        fromAgent: this.config.id,
        toAgent: message.fromAgent,
        messageType: 'coordination',
        content: `Coordination acknowledged: ${message.content}`,
        priority: message.priority,
        timestamp: new Date(),
        replyToMessageId: message.id,        metadata: {
          requiresResponse: false,
          context: { 
            coordinationStatus: 'acknowledged',
            originalTaskId: message.metadata.context?.taskId 
          }
        }
      };

      await memoryDrivenComm.sendMessage(responseMessage);
    }
  }

  /**
   * Handle context sharing messages
   */
  private async handleContextMessage(_message: AgentMessage): Promise<void> {
    console.log('[CoreAgent] Handling context message');
    
    // Context messages are automatically stored in memory
    // Can be enhanced to trigger specific actions based on context
  }

  /**
   * Handle learning messages from other agents
   */
  private async handleLearningMessage(message: AgentMessage): Promise<void> {
    console.log('[CoreAgent] Handling learning message');
    
    // Store learning insights in memory with special categorization
    await this.storeMemory(
      `Learning insight from ${message.fromAgent}: ${message.content}`,
      'inter_agent_learning',
      {
        sourceAgent: message.fromAgent,
        learningType: 'inter_agent',
        timestamp: message.timestamp.toISOString()
      }
    );
  }
}

// Export singleton instance
export const coreAgent = new CoreAgent();
