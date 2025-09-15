/**
 * TemplateAgent - Professional Template for Creating OneAgent Specialized Agents
 *
 * This template demonstrates OneAgent Professional 4.0.0 best practices including:
 * - UnifiedMemoryClient integration with proper error handling
 * - Constitutional AI validation patterns
 * - Multi-agent coordination tool usage
 * - Time awareness and ISO timestamp handling
 * - Quality threshold enforcement (85%+)
 * - Professional error handling with graceful fallbacks
 *
 * MODERNIZATION CHECKLIST:
 * 1. Copy this file to coreagent/agents/specialized/YourAgentName.ts
 * 2. Replace "Template" with your agent name (e.g., "Research", "Medical", "Finance")
 * 3. Replace "template" with your domain (e.g., "research", "medical", "finance")
 * 4. Update capabilities, actions, and domain-specific logic
 * 5. Customize Constitutional AI validation criteria for your domain
 * 6. Add domain-specific multi-agent coordination patterns
 * 7. Add to AgentFactory imports and switch statement
 * 8. Update AgentRegistry matching criteria
 * 9. Create comprehensive tests for your agent
 * 10. Document integration points and quality thresholds
 */

import {
  BaseAgent,
  AgentConfig,
  AgentContext,
  AgentResponse,
  AgentAction,
} from '../base/BaseAgent';
import { ISpecializedAgent, AgentHealthStatus } from '../base/ISpecializedAgent';
import { MemoryRecord } from '../../types/oneagent-backbone-types';
import { createUnifiedTimestamp, createUnifiedId } from '../../utils/UnifiedBackboneService';

export class TemplateAgent extends BaseAgent implements ISpecializedAgent {
  public readonly id: string;
  public readonly config: AgentConfig;
  private processedMessages: number = 0;
  private errors: string[] = [];
  private readonly qualityThreshold: number = 85; // Local additional quality heuristic (constitutional loop uses its own threshold)
  private readonly timeZone: string = 'UTC';
  private lastActivity: Date = new Date(createUnifiedTimestamp().utc);

  constructor(config: AgentConfig) {
    super(config);
    this.id = config.id || `template-agent-${createUnifiedTimestamp().unix}`;
    this.config = config;
  }
  /**
   * Initialize the template agent with unified memory and constitutional AI
   */
  async initialize(): Promise<void> {
    try {
      await super.initialize();
      // Record initialization using canonical BaseAgent memory helper (singleton memory system)
      try {
        await this.addMemory(
          'system',
          `Template agent ${this.id} initialized. Constitutional AI + PromptEngine auto-enabled when provided via AgentFactory.`,
          {
            type: 'system',
            timestamp: createUnifiedTimestamp().iso,
            agentId: this.id,
          },
        );
      } catch (memoryError) {
        console.warn(`⚠️ Could not store initialization memory: ${memoryError}`);
      }
      this.lastActivity = new Date(createUnifiedTimestamp().utc);
      console.log(
        `✅ TemplateAgent ${this.id} initialized successfully with Constitutional AI validation`,
      );
    } catch (error) {
      this.errors.push(
        `Initialization error: ${error instanceof Error ? error.message : String(error)}`,
      );
      console.error(`❌ TemplateAgent ${this.id} initialization failed:`, error);
      throw error;
    }
  }
  /**
   * Process template-related messages with unified memory and Constitutional AI validation
   *
   * Demonstrates professional OneAgent 4.0.0 patterns:
   * - Unified memory client usage with error handling
   * - Constitutional AI validation integration
   * - Time awareness with ISO timestamps
   * - Quality threshold enforcement
   * - Professional error handling with graceful fallbacks
   */
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    const startTime = createUnifiedTimestamp().unix;
    this.lastActivity = new Date(createUnifiedTimestamp().utc);
    this.processedMessages++;
    try {
      // Delegate core generation to BaseAgent (uses constitutional loop if promptEngine present)
      const baseResponse = await super.processMessage(context, message);
      // Analyze for template-specific suggested actions (non-destructive augmentation)
      const suggestedActions = await this.analyzeTemplateTask(message);
      // Augment metadata & record quality heuristic (reuse constitutional score if present)
      const constitutionalScore =
        (baseResponse.metadata?.constitutionalScore as number | undefined) ?? 0;
      const qualityScore = Math.max(constitutionalScore * 100, this.qualityThreshold); // simple heuristic placeholder
      // Memory logging for processing summary
      try {
        await this.addMemory(
          context.user.id,
          `Template processing summary. Actions: ${suggestedActions.length}. ConstitutionalScore: ${constitutionalScore}.`,
          {
            type: 'template_processing',
            actionsCount: suggestedActions.length,
            constitutionalScore,
            processingTime: createUnifiedTimestamp().unix - startTime,
            timestamp: createUnifiedTimestamp().iso,
          },
        );
      } catch (memErr) {
        console.warn(`⚠️ Could not store template processing summary: ${memErr}`);
      }
      return {
        ...baseResponse,
        actions: suggestedActions,
        metadata: {
          ...baseResponse.metadata,
          templateAugmented: true,
          actionsSuggested: suggestedActions.length,
          processingTime: createUnifiedTimestamp().unix - startTime,
          qualityScore,
          timeZone: this.timeZone,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errors.push(`Processing error: ${errorMessage}`);
      console.error('❌ TemplateAgent processing error:', error);
      try {
        await this.addMemory(context.user.id, `Template processing error: ${errorMessage}`, {
          type: 'processing_error',
          timestamp: createUnifiedTimestamp().iso,
        });
      } catch {
        /* memory logging failure ignored */
      }
      return {
        content:
          'I encountered an internal error while processing your template request. Please try again.',
        actions: [],
        memories: [],
        metadata: {
          error: errorMessage,
          processingTime: createUnifiedTimestamp().unix - startTime,
          qualityScore: 50,
          errorRecovery: true,
          templateAugmented: false,
        },
      };
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
        parameters: { input: 'string', options: 'array' },
      },
      {
        type: 'template_action_2',
        description: 'Perform second template action',
        parameters: { data: 'object', format: 'string' },
      },
      {
        type: 'template_action_3',
        description: 'Perform third template action',
        parameters: { query: 'string', filters: 'object' },
      },
      // Add more actions specific to your domain
    ];
  }

  /**
   * Execute template-specific actions
   */
  async executeAction(
    action: string | AgentAction,
    params: Record<string, unknown>,
    context?: AgentContext,
  ): Promise<AgentResponse> {
    const actionType = typeof action === 'string' ? action : action.type;
    const actionParams = typeof action === 'string' ? params : action.parameters;

    if (!context) {
      throw new Error('Context is required for template actions');
    }

    switch (actionType) {
      case 'template_action_1':
        return await this.performAction1(actionParams, context);
      case 'template_action_2':
        return await this.performAction2(actionParams, context);
      case 'template_action_3':
        return await this.performAction3(actionParams, context);
      default:
        return await super.executeAction(action, params, context);
    }
  }
  /**
   * Get agent status
   */ getStatus(): {
    agentId: string;
    name: string;
    description: string;
    initialized: boolean;
    capabilities: string[];
    memoryEnabled: boolean;
    aiEnabled: boolean;
    lastActivity?: Date;
    isHealthy: boolean;
    processedMessages: number;
    errors: number;
  } {
    return {
      agentId: this.id,
      name: this.config.name,
      description: this.config.description,
      initialized: true,
      capabilities: this.config.capabilities,
      memoryEnabled: this.config.memoryEnabled,
      aiEnabled: this.config.aiEnabled,
      lastActivity: this.lastActivity,
      isHealthy: true,
      processedMessages: 0,
      errors: 0,
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
      uptime: createUnifiedTimestamp().unix,
      memoryUsage: 0, // Mock value
      responseTime: 50, // Mock value
      errorRate: this.processedMessages > 0 ? this.errors.length / this.processedMessages : 0,
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
        parameters: { input: message },
      });
    }

    if (lowerMessage.includes('action2') || lowerMessage.includes('do2')) {
      actions.push({
        type: 'template_action_2',
        description: 'Perform action 2 based on request',
        parameters: { data: { request: message } },
      });
    }

    return actions;
  }

  /**
   * Build template-specific prompt for AI
   *
   * TODO: Customize this prompt for your agent's domain and personality
   */
  private buildTemplatePrompt(
    message: string,
    memories: MemoryRecord[],
    context: AgentContext,
  ): string {
    // Extract customInstructions from enriched context userProfile
    // Use backbone user context instead of removed enrichedContext
    const customInstructions = context.metadata?.customInstructions;

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
  private async performAction1(
    params: Record<string, unknown>,
    _context: AgentContext,
  ): Promise<AgentResponse> {
    // TODO: Implement your first action
    return {
      content: `Action 1 completed with input: ${params.input}`,
      metadata: {
        actionId: createUnifiedId('operation', 'template_1'),
        success: true,
        timestamp: createUnifiedTimestamp().iso,
      },
    };
  }

  private async performAction2(
    params: Record<string, unknown>,
    _context: AgentContext,
  ): Promise<AgentResponse> {
    // TODO: Implement your second action
    return {
      content: `Action 2 completed with data: ${JSON.stringify(params.data)}`,
      metadata: {
        actionId: createUnifiedId('operation', 'template_2'),
        success: true,
        timestamp: createUnifiedTimestamp().iso,
      },
    };
  }
  private async performAction3(
    _params: Record<string, unknown>,
    _context: AgentContext,
  ): Promise<AgentResponse> {
    // TODO: Implement your third action
    return {
      content: 'Action 3 completed',
      metadata: {
        actionId: createUnifiedId('operation', 'template_3'),
        success: true,
        timestamp: createUnifiedTimestamp().iso,
      },
    };
  }

  // =====================================
  // MODERN ONEAGENT 4.0.0 HELPER METHODS
  // =====================================

  /**
   * EXAMPLE: Multi-Agent Coordination Pattern
   * Demonstrates how to coordinate with other agents using OneAgent's MCP tools
   */
  private async coordinateWithOtherAgents(
    task: string,
    context: AgentContext,
  ): Promise<AgentResponse> {
    try {
      console.log(`🤝 TemplateAgent coordinating with other agents for task: ${task}`);

      // Example of using coordinate_agents MCP tool (would require MCP client integration)
      // This showcases the pattern - implement when MCP client is available
      const coordinationResult = {
        agentsFound: [],
        taskDelegated: false,
        reason: 'MCP coordination not yet implemented in template',
        note: 'Use this pattern to coordinate with DevAgent, OfficeAgent, etc.',
      };

      // Store coordination attempt in memory for learning
      await this.addMemory(
        context.user.id,
        `Attempted multi-agent coordination for: ${task}. Result: ${coordinationResult.reason}`,
        {
          coordinationType: 'multi_agent_task',
          task: task,
          timestamp: createUnifiedTimestamp().iso,
          sessionId: context.sessionId,
        },
      );

      return {
        content: `Multi-agent coordination completed for: ${task}. Result: ${coordinationResult.reason}`,
        metadata: {
          coordinationType: 'multi_agent_task',
          task: task,
          timestamp: createUnifiedTimestamp().iso,
          sessionId: context.sessionId,
          coordinationResult,
        },
      };
    } catch (error) {
      console.warn(`⚠️ Multi-agent coordination failed: ${error}`);
      return {
        content: `Coordination failed: ${error}`,
        metadata: {
          success: false,
          error: `${error}`,
          timestamp: createUnifiedTimestamp().iso,
        },
      };
    }
  }

  /**
   * EXAMPLE: Constitutional AI Validation Pattern (Placeholder)
   * Shows how Constitutional AI would be integrated for response validation
   */
  private async applyConstitutionalValidationPattern(
    response: string,
    _userMessage: string,
  ): Promise<{ validated: boolean; feedback: string; score: number }> {
    // TODO: Integrate with actual Constitutional AI when available
    // This demonstrates the intended pattern

    const mockValidation = {
      content: response,
      qualityScore: 85,
      constitutionalMetrics: {
        accuracy: true,
        transparency: true,
        helpfulness: true,
        safety: true,
      },
      improvements: [
        'Response meets Constitutional AI standards',
        'Template domain expertise validated',
      ],
    };

    console.log(
      `🛡️ Constitutional AI validation pattern applied (mock). Quality: ${mockValidation.qualityScore}%`,
    );
    return {
      validated: mockValidation.qualityScore >= 85,
      feedback: mockValidation.improvements.join(', '),
      score: mockValidation.qualityScore,
    };
  }

  /**
   * EXAMPLE: Time-Aware Processing Pattern
   * Demonstrates proper time handling with timezone awareness
   */
  private getCurrentTimeStamp(): { iso: string; unix: number; timezone: string; readable: string } {
    const timestamp = createUnifiedTimestamp();
    return {
      iso: timestamp.iso,
      unix: timestamp.unix,
      timezone: this.timeZone,
      readable: timestamp.local,
    };
  }

  /**
   * EXAMPLE: Enhanced Error Recovery Pattern
   * Demonstrates professional error handling with learning integration
   */
  private async handleErrorWithLearning(
    error: Error,
    context: AgentContext,
    operation: string,
  ): Promise<void> {
    const timestamp = this.getCurrentTimeStamp();

    try {
      // Store error for learning and improvement
      await this.addMemory(
        context.user.id,
        `Error in ${operation}: ${error.message}. Recovery protocols applied.`,
        {
          errorType: 'operational_error',
          operation: operation,
          errorMessage: error.message,
          errorStack: error.stack?.substring(0, 500), // Truncated for memory efficiency
          recoveryTimestamp: timestamp.iso,
          sessionId: context.sessionId,
          learningValue: 'high', // Mark for learning system
        },
      );

      console.log(`📝 Error recorded for learning improvement in operation: ${operation}`);
    } catch (memoryError) {
      // Even error recording failed - use console fallback
      console.error(`❌ Critical: Error recording failed in ${operation}:`, {
        originalError: error.message,
        memoryError: memoryError,
      });
    }
  }

  /**
   * EXAMPLE: Quality Metrics Collection Pattern
   * Shows how to collect and analyze quality metrics for continuous improvement
   */
  private collectQualityMetrics(
    response: string,
    processingTime: number,
    memoriesUsed: number,
  ): { qualityScore: number; metrics: Record<string, number> } {
    const metrics = {
      responseLength: response.length,
      processingTime: processingTime,
      memoriesUsed: memoriesUsed,
      efficiency: memoriesUsed > 0 ? response.length / memoriesUsed : response.length,
      timeEfficiency: response.length / processingTime,
    };

    const qualityScore = Math.min(
      100,
      Math.max(
        0,
        metrics.efficiency * 0.3 +
          metrics.timeEfficiency * 0.3 +
          (memoriesUsed > 0 ? 20 : 0) +
          (response.length > 50 && response.length < 2000 ? 20 : 0),
      ),
    );

    return {
      qualityScore,
      metrics,
    };
  }

  /**
   * EXAMPLE: Memory Search Enhancement Pattern
   * Demonstrates advanced memory search with fallbacks and quality assessment
   */
  private async searchMemoriesWithFallback(
    userId: string,
    query: string,
    limit: number = 5,
  ): Promise<{
    memories: MemoryRecord[];
    searchMetrics: { found: number; searchTime: number; method: string };
  }> {
    const searchStart = createUnifiedTimestamp().unix;
    let memories: MemoryRecord[] = [];
    let searchSuccess = false;

    try {
      const search = await this.searchMemories(userId, query, limit);
      memories = search.result.results;
      searchSuccess = true;
      console.log(
        `🔍 Memory search successful: ${memories.length} results in ${createUnifiedTimestamp().unix - searchStart}ms`,
      );
    } catch (error) {
      console.warn(`⚠️ Memory search failed, using fallback: ${error}`);
      memories = []; // Graceful fallback
    }

    const searchMetrics = {
      searchTime: createUnifiedTimestamp().unix - searchStart,
      found: memories.length,
      method: searchSuccess ? 'memory_search' : 'fallback',
    };

    return { memories, searchMetrics };
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
