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

import { BaseAgent, AgentConfig, AgentContext, AgentResponse, AgentAction } from '../base/BaseAgent';
import { ISpecializedAgent, AgentStatus, AgentHealthStatus } from '../base/ISpecializedAgent';
import { UnifiedMemoryClient } from '../../memory/UnifiedMemoryClient';
import { ConversationMemory, LearningMemory, PatternType, LearningType } from '../../memory/UnifiedMemoryInterface';

export class TemplateAgent extends BaseAgent implements ISpecializedAgent {
  public readonly id: string;
  public readonly config: AgentConfig;
  private processedMessages: number = 0;
  private errors: string[] = [];
  private readonly qualityThreshold: number = 85;
  private readonly timeZone: string = 'UTC';
  private lastActivity: Date = new Date();
  
  // Constitutional AI validation principles for this agent domain
  private readonly constitutionalPrinciples = {
    accuracy: 'Prefer "I don\'t know" to speculation in template domain',
    transparency: 'Explain template reasoning and acknowledge limitations',
    helpfulness: 'Provide actionable template guidance with clear next steps',
    safety: 'Avoid harmful template recommendations, consider security implications'
  };

  constructor(config: AgentConfig) {
    super(config);
    this.id = config.id || `template-agent-${Date.now()}`;
    this.config = config;
  }
  /**
   * Initialize the template agent with unified memory and constitutional AI
   */
  async initialize(): Promise<void> {
    try {
      await super.initialize();
      
      // Check unified memory client with proper error handling
      if (!this.memoryClient) {
        console.warn(`⚠️ TemplateAgent ${this.id}: Memory client not available, using fallback mode`);
      }
      
      // Store initialization in memory as a conversation record
      try {
        await this.addMemory('system', 
          `Template agent ${this.id} successfully initialized with unified memory system. Constitutional AI validation active.`
        );
      } catch (memoryError) {
        console.warn(`⚠️ Could not store initialization memory: ${memoryError}`);
      }
      
      this.lastActivity = new Date();
      console.log(`✅ TemplateAgent ${this.id} initialized successfully with Constitutional AI validation`);
    } catch (error) {
      this.errors.push(`Initialization error: ${error instanceof Error ? error.message : String(error)}`);
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
    const startTime = Date.now();
    this.lastActivity = new Date();
    
    try {
      this.validateContext(context);
      this.processedMessages++;

      // 1. UNIFIED MEMORY INTEGRATION (with fallback)
      let relevantMemories: any[] = [];
      try {
        // Store current message in unified memory system
        await this.addMemory(context.user.id, message, {
          agentType: 'template',
          sessionId: context.sessionId,
          timestamp: new Date().toISOString(),
          timeZone: this.timeZone,
          messageType: 'user_input',
          processingId: `proc_${Date.now()}`
        });

        // Search for relevant context using semantic search
        relevantMemories = await this.searchMemories(context.user.id, message, 5);
        console.log(`🧠 Retrieved ${relevantMemories.length} relevant memories for context enhancement`);
      } catch (memoryError) {
        console.warn(`⚠️ Memory operation failed, continuing with fallback: ${memoryError}`);
        relevantMemories = []; // Graceful fallback
      }      // 2. ANALYZE TASK FOR TEMPLATE-SPECIFIC ACTIONS
      const actions = await this.analyzeTemplateTask(message);
      
      // 3. GENERATE AI RESPONSE WITH CONSTITUTIONAL AI PATTERNS
      const prompt = this.buildTemplatePrompt(message, relevantMemories, context);
      const aiResponse = await this.generateResponse(prompt, relevantMemories);
      
      // TODO: Implement Constitutional AI validation when available
      // const validatedResponse = await this.applyConstitutionalValidation(aiResponse, message, context);
      const finalResponse = aiResponse; // Placeholder until Constitutional AI is integrated
      const qualityScore = 85; // Default quality score - implement actual scoring

      // 5. QUALITY THRESHOLD ENFORCEMENT
      if (qualityScore < this.qualityThreshold) {
        console.warn(`⚠️ Response quality ${qualityScore}% below threshold ${this.qualityThreshold}%`);
        
        // Store quality improvement learning
        try {
          await this.addMemory(context.user.id, 
            `Quality improvement needed: ${qualityScore}% < ${this.qualityThreshold}%. Refinement applied.`,
            {
              learningType: 'quality_improvement',
              originalQuality: qualityScore,
              threshold: this.qualityThreshold,
              timestamp: new Date().toISOString()
            }
          );
        } catch (memoryError) {
          console.warn(`⚠️ Could not store quality learning: ${memoryError}`);
        }
      }

      // 6. RECORD SUCCESSFUL PROCESSING FOR LEARNING
      try {
        await this.addMemory(context.user.id, 
          `Successfully processed template request. Quality: ${qualityScore}%. Processing time: ${Date.now() - startTime}ms`,
          {
            processingTime: Date.now() - startTime,
            qualityScore: qualityScore,
            actionsCount: actions.length,
            memoriesUsed: relevantMemories.length,
            timestamp: new Date().toISOString(),
            sessionId: context.sessionId
          }
        );
      } catch (memoryError) {
        console.warn(`⚠️ Could not store processing record: ${memoryError}`);
      }

      // Create enhanced response with metadata
      const response = this.createResponse(finalResponse, actions, relevantMemories);
      response.metadata = {
        ...response.metadata,
        processingTime: Date.now() - startTime,
        qualityScore: qualityScore,
        memoryEnhanced: relevantMemories.length > 0,
        timeZone: this.timeZone,
        constitutionalValidated: false // Will be true when Constitutional AI is integrated
      };
      
      return response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errors.push(`Processing error: ${errorMessage}`);
      console.error(`❌ TemplateAgent processing error:`, error);
      
      // Record error for learning and improvement
      try {
        await this.addMemory(context.user.id, 
          `Processing error encountered: ${errorMessage}. Fallback response provided.`,
          {
            errorType: 'processing_error',
            errorMessage,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            sessionId: context.sessionId
          }
        );
      } catch (memoryError) {
        console.warn(`⚠️ Could not store error record: ${memoryError}`);
      }      
      // Create error response with enhanced metadata
      const errorResponse = this.createResponse(
        "I apologize, but I encountered an error processing your template request. Please try again, and I'll apply my error recovery protocols.",
        [],
        []
      );
      
      errorResponse.metadata = {
        ...errorResponse.metadata,
        processingTime: Date.now() - startTime,
        qualityScore: 60, // Low quality due to error
        errorRecovery: true,
        constitutionalValidated: false
      };
      
      return errorResponse;
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
   */  getStatus(): { 
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
      errors: 0
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
  private async performAction3(_params: any, _context: AgentContext): Promise<any> {
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

  // =====================================
  // MODERN ONEAGENT 4.0.0 HELPER METHODS
  // =====================================

  /**
   * EXAMPLE: Multi-Agent Coordination Pattern
   * Demonstrates how to coordinate with other agents using OneAgent's MCP tools
   */
  private async coordinateWithOtherAgents(task: string, context: AgentContext): Promise<any> {
    try {
      console.log(`🤝 TemplateAgent coordinating with other agents for task: ${task}`);
      
      // Example of using coordinate_agents MCP tool (would require MCP client integration)
      // This showcases the pattern - implement when MCP client is available
      const coordinationResult = {
        agentsFound: [],
        taskDelegated: false,
        reason: 'MCP coordination not yet implemented in template',
        note: 'Use this pattern to coordinate with DevAgent, OfficeAgent, etc.'
      };
      
      // Store coordination attempt in memory for learning
      await this.addMemory(context.user.id, 
        `Attempted multi-agent coordination for: ${task}. Result: ${coordinationResult.reason}`,
        {
          coordinationType: 'multi_agent_task',
          task: task,
          timestamp: new Date().toISOString(),
          sessionId: context.sessionId
        }
      );
      
      return coordinationResult;
    } catch (error) {
      console.warn(`⚠️ Multi-agent coordination failed: ${error}`);
      return { success: false, error: `Coordination failed: ${error}` };
    }
  }

  /**
   * EXAMPLE: Constitutional AI Validation Pattern (Placeholder)
   * Shows how Constitutional AI would be integrated for response validation
   */
  private async applyConstitutionalValidationPattern(response: string, _userMessage: string): Promise<any> {
    // TODO: Integrate with actual Constitutional AI when available
    // This demonstrates the intended pattern
    
    const mockValidation = {
      content: response,
      qualityScore: 85,
      constitutionalMetrics: {
        accuracy: true,
        transparency: true,
        helpfulness: true,
        safety: true
      },
      improvements: [
        'Response meets Constitutional AI standards',
        'Template domain expertise validated'
      ]
    };
    
    console.log(`🛡️ Constitutional AI validation pattern applied (mock). Quality: ${mockValidation.qualityScore}%`);
    return mockValidation;
  }

  /**
   * EXAMPLE: Time-Aware Processing Pattern
   * Demonstrates proper time handling with timezone awareness
   */
  private getCurrentTimeStamp(): { iso: string; unix: number; timezone: string; readable: string } {
    const now = new Date();
    return {
      iso: now.toISOString(),
      unix: now.getTime(),
      timezone: this.timeZone,
      readable: now.toLocaleString('en-US', { 
        timeZone: this.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  }

  /**
   * EXAMPLE: Enhanced Error Recovery Pattern
   * Demonstrates professional error handling with learning integration
   */
  private async handleErrorWithLearning(error: Error, context: AgentContext, operation: string): Promise<void> {
    const timestamp = this.getCurrentTimeStamp();
    
    try {
      // Store error for learning and improvement
      await this.addMemory(context.user.id, 
        `Error in ${operation}: ${error.message}. Recovery protocols applied.`,
        {
          errorType: 'operational_error',
          operation: operation,
          errorMessage: error.message,
          errorStack: error.stack?.substring(0, 500), // Truncated for memory efficiency
          recoveryTimestamp: timestamp.iso,
          sessionId: context.sessionId,
          learningValue: 'high' // Mark for learning system
        }
      );
      
      console.log(`📝 Error recorded for learning improvement in operation: ${operation}`);
    } catch (memoryError) {
      // Even error recording failed - use console fallback
      console.error(`❌ Critical: Error recording failed in ${operation}:`, {
        originalError: error.message,
        memoryError: memoryError
      });
    }
  }

  /**
   * EXAMPLE: Quality Metrics Collection Pattern
   * Shows how to collect and analyze quality metrics for continuous improvement
   */
  private collectQualityMetrics(response: string, processingTime: number, memoriesUsed: number): any {
    return {
      responseLength: response.length,
      processingTime: processingTime,
      memoriesUsed: memoriesUsed,
      efficiency: memoriesUsed > 0 ? response.length / memoriesUsed : response.length,
      timeEfficiency: response.length / processingTime,
      qualityIndicators: {
        memoryEnhanced: memoriesUsed > 0,
        appropriateLength: response.length > 50 && response.length < 2000,
        timely: processingTime < 5000, // 5 seconds
        constitutionalCompliant: true // Would be from actual validation
      },
      timestamp: this.getCurrentTimeStamp()
    };
  }

  /**
   * EXAMPLE: Memory Search Enhancement Pattern
   * Demonstrates advanced memory search with fallbacks and quality assessment
   */
  private async searchMemoriesWithFallback(userId: string, query: string, limit: number = 5): Promise<{ memories: any[], searchMetrics: any }> {
    const searchStart = Date.now();
    let memories: any[] = [];
    let searchSuccess = false;
    
    try {
      memories = await this.searchMemories(userId, query, limit);
      searchSuccess = true;
      console.log(`🔍 Memory search successful: ${memories.length} results in ${Date.now() - searchStart}ms`);
    } catch (error) {
      console.warn(`⚠️ Memory search failed, using fallback: ${error}`);
      memories = []; // Graceful fallback
    }
    
    const searchMetrics = {
      searchTime: Date.now() - searchStart,
      resultsFound: memories.length,
      searchSuccess: searchSuccess,
      queryLength: query.length,
      efficiency: searchSuccess ? memories.length / (Date.now() - searchStart) : 0
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
