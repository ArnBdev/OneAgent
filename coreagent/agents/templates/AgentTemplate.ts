/**
 * AgentTemplate - Quick Start Template for Creating OneAgent Specialized Agents
 * 
 * Replace "Template" with your agent name throughout this file
 * Replace "template" with your domain/capability throughout this file
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to coreagent/agents/specialized/YourAgentName.ts
 * 2. Find and replace "Template" with your agent name (e.g., "Research", "Medical", "Finance")
 * 3. Find and replace "template" with your domain (e.g., "research", "medical", "finance")
 * 4. Update capabilities, actions, and logic for your specific domain
 * 5. Add to AgentFactory imports and switch statement
 * 6. Update AgentRegistry matching criteria
 * 7. Create tests for your agent
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResponse, AgentAction } from '../base/BaseAgent';
import { ISpecializedAgent, AgentStatus, AgentHealthStatus } from '../base/ISpecializedAgent';

export class TemplateAgent extends BaseAgent implements ISpecializedAgent {
  public readonly id: string;
  public readonly config: AgentConfig;
  private processedMessages: number = 0;
  private errors: string[] = [];

  constructor(config: AgentConfig) {
    super(config);
    this.id = config.id || `template-agent-${Date.now()}`;
    this.config = config;
  }

  /**
   * Initialize the template agent
   */
  async initialize(): Promise<void> {
    await super.initialize();
    console.log(`TemplateAgent ${this.id} initialized successfully`);
  }

  /**
   * Process template-related messages
   */
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    try {
      this.validateContext(context);
      this.processedMessages++;

      // Add message to memory for context
      await this.addMemory(context.user.id, message, {
        agentType: 'template',
        sessionId: context.sessionId,
        timestamp: new Date().toISOString()
      });

      // Search for relevant memories
      const relevantMemories = await this.searchMemories(context.user.id, message, 5);

      // Analyze the message for template-specific tasks
      const actions = await this.analyzeTemplateTask(message);
      
      // Generate response using AI with template context
      const prompt = this.buildTemplatePrompt(message, relevantMemories, context);
      const aiResponse = await this.generateResponse(prompt, relevantMemories);

      return this.createResponse(aiResponse, actions, relevantMemories);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errors.push(`Processing error: ${errorMessage}`);
      console.error('TemplateAgent processing error:', error);
      
      return this.createResponse(
        "I apologize, but I encountered an error processing your template request. Please try again.",
        [],
        []
      );
    }
  }

  /**
   * Get available template actions
   * 
   * TODO: Replace with your domain-specific actions
   * Examples: 'research_search', 'medical_diagnose', 'finance_analyze'
   */
  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'template_action_1',
        description: 'Perform first template action',
        parameters: { input: 'string', options: 'array' }
      },
      {
        type: 'template_action_2', 
        description: 'Perform second template action',
        parameters: { data: 'object', format: 'string' }
      },
      {
        type: 'template_action_3',
        description: 'Perform third template action',
        parameters: { query: 'string', filters: 'object' }
      }
      // Add more actions specific to your domain
    ];
  }

  /**
   * Execute template-specific actions
   */
  async executeAction(action: AgentAction, context: AgentContext): Promise<any> {
    switch (action.type) {
      case 'template_action_1':
        return await this.performAction1(action.parameters, context);
      case 'template_action_2':
        return await this.performAction2(action.parameters, context);
      case 'template_action_3':
        return await this.performAction3(action.parameters, context);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Get agent status
   */
  getStatus(): AgentStatus {
    return {
      isHealthy: this.isReady() && this.errors.length < 5,
      lastActivity: new Date(),
      memoryCount: 0, // Would be fetched from memory client
      processedMessages: this.processedMessages,
      errors: [...this.errors]
    };
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.config.name || `TemplateAgent-${this.id}`;
  }

  /**
   * Get detailed health status
   */
  async getHealthStatus(): Promise<AgentHealthStatus> {
    return {
      status: this.isReady() && this.errors.length < 5 ? 'healthy' : 'degraded',
      uptime: Date.now(),
      memoryUsage: 0, // Mock value
      responseTime: 50, // Mock value
      errorRate: this.processedMessages > 0 ? this.errors.length / this.processedMessages : 0
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.errors = [];
    console.log(`TemplateAgent ${this.id} cleaned up`);
  }

  // PRIVATE METHODS - Customize these for your domain

  /**
   * Analyze message for template-specific tasks
   * 
   * TODO: Add keyword detection and action mapping for your domain
   */
  private async analyzeTemplateTask(message: string): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];
    const lowerMessage = message.toLowerCase();

    // TODO: Replace these keywords with your domain-specific terms
    if (lowerMessage.includes('action1') || lowerMessage.includes('do1')) {
      actions.push({
        type: 'template_action_1',
        description: 'Perform action 1 based on request',
        parameters: { input: message }
      });
    }

    if (lowerMessage.includes('action2') || lowerMessage.includes('do2')) {
      actions.push({
        type: 'template_action_2',
        description: 'Perform action 2 based on request',
        parameters: { data: { request: message } }
      });
    }

    return actions;
  }

  /**
   * Build template-specific prompt for AI
   * 
   * TODO: Customize this prompt for your agent's domain and personality
   */
  private buildTemplatePrompt(message: string, memories: any[], context: AgentContext): string {
    // Extract customInstructions from enriched context userProfile
    const customInstructions = context.enrichedContext?.userProfile?.customInstructions;
    
    let prompt = `
You are a Template Assistant AI specialized in [YOUR DOMAIN HERE].

Context:
- User: ${context.user.name || 'User'}
- Session: ${context.sessionId}
- Previous interactions: ${memories.length} relevant memories`;

    // Add custom instructions if available
    if (customInstructions) {
      prompt += `
- User Preferences: ${customInstructions}`;
    }

    prompt += `

User Request: ${message}

Please provide helpful assistance with [YOUR DOMAIN] including:
- [Capability 1]
- [Capability 2] 
- [Capability 3]
- [Capability 4]

Be [PERSONALITY TRAITS: professional, friendly, expert, etc.] in your responses.`;

    return prompt;
  }

  /**
   * Template action implementations
   * 
   * TODO: Replace these with your actual domain logic
   */
  private async performAction1(params: any, _context: AgentContext): Promise<any> {
    // TODO: Implement your first action
    return {
      success: true,
      actionId: `action1_${Date.now()}`,
      result: `Action 1 completed with input: ${params.input}`,
      data: {
        // Add relevant response data
      }
    };
  }

  private async performAction2(params: any, _context: AgentContext): Promise<any> {
    // TODO: Implement your second action
    return {
      success: true,
      actionId: `action2_${Date.now()}`,
      result: `Action 2 completed with data: ${JSON.stringify(params.data)}`,
      data: {
        // Add relevant response data
      }
    };
  }

  private async performAction3(params: any, _context: AgentContext): Promise<any> {
    // TODO: Implement your third action
    return {
      success: true,
      actionId: `action3_${Date.now()}`,
      result: `Action 3 completed`,
      data: {
        // Add relevant response data
      }
    };
  }
}

/*
 * INTEGRATION CHECKLIST:
 * 
 * 1. AgentFactory Integration:
 *    - Add import: import { TemplateAgent } from '../specialized/TemplateAgent';
 *    - Add to AgentType: 'template'
 *    - Add to DEFAULT_CAPABILITIES: template: ['capability1', 'capability2']
 *    - Add case to createAgent switch: case 'template': agent = new TemplateAgent(agentConfig); break;
 * 
 * 2. AgentRegistry Integration:
 *    - Add to initializeMatchingCriteria: keywords, requiredCapabilities, priority
 *    - Add to determineAgentType: capability detection logic
 * 
 * 3. Testing:
 *    - Create tests/agents/TemplateAgent.test.ts
 *    - Test initialization, message processing, actions, error handling
 * 
 * 4. Documentation:
 *    - Update README with new agent capabilities
 *    - Add usage examples
 * 
 * 5. Type Definitions:
 *    - Update any relevant type definitions
 *    - Ensure TypeScript compilation passes
 */
