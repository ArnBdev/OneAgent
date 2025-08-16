/**
 * DevAgent.ts - Development Agent Implementation
 * 
 * BaseAgent instance that:
 * - Inherits from BaseAgent with memory integration
 * - Processes actual user messages
 * - Stores conversations in memory
 * - Uses AI for responses
 * - Has Constitutional AI validation
 * - Provides actual development assistance
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResponse } from '../base/BaseAgent';
import type { AgentMessage, MemoryRecord } from '../../types/oneagent-backbone-types';
import { createUnifiedTimestamp, unifiedMetadataService } from '../../utils/UnifiedBackboneService';
import { ISpecializedAgent } from '../base/ISpecializedAgent';
import { PromptConfig } from '../base/PromptEngine';


export interface DevAgentCapabilities {
  codeReview: boolean;
  debugging: boolean;
  codeGeneration: boolean;
  architectureGuidance: boolean;
  testingSupport: boolean;
  performanceOptimization: boolean;
}

export interface DevAgentResponse extends AgentResponse {
  codeExamples?: string[];
  suggestions?: string[];
  qualityScore?: number;
}

/**
 * Development Agent - ISpecializedAgent implementation
 */
export class DevAgent extends BaseAgent implements ISpecializedAgent {
  private capabilities: DevAgentCapabilities;
  private conversationHistory: AgentMessage[] = [];
  
  constructor(config: AgentConfig, promptConfig?: PromptConfig) {
    super(config, promptConfig);

    this.capabilities = {
      codeReview: true,
      debugging: true,
      codeGeneration: true,
      architectureGuidance: true,
      testingSupport: true,
      performanceOptimization: true
    };
  }

  /**
   * REAL message processing - not just metadata!
   */
  async processMessage(context: AgentContext, message: string): Promise<DevAgentResponse> {
    this.validateContext(context);

    // Add to conversation history
    const userMessage: AgentMessage = {
      sessionId: context.sessionId,
      fromAgent: this.config.id,
      toAgent: undefined,
      content: message,
      messageType: 'question',
      metadata: {
        userId: context.user.id
      }
    };
    this.conversationHistory.push(userMessage);

    // Persist user message in unified memory (canonical) with timestamp
    try {
      const metadata = unifiedMetadataService.create('dev_agent_user_message', 'DevAgent', {
        system: {
          source: 'dev_agent',
          component: 'DevAgent',
          sessionId: context.sessionId,
          userId: context.user.id
        },
        content: {
          category: 'dev_agent_user_message',
          tags: ['dev', 'user_message'],
          sensitivity: 'internal',
          relevanceScore: 0.1,
          contextDependency: 'session'
        }
      });
      await this.memoryClient?.addMemoryCanonical(message, metadata, context.user.id);
    } catch (memoryErr) {
      console.warn(`⚠️ DevAgent memory add failed: ${memoryErr}`);
    }

    // Attempt retrieval of prior similar memories for lightweight contextual enhancement
    let priorMemories: MemoryRecord[] = [];
    try {
      const search = await this.memoryClient?.searchMemory({
        query: message.slice(0, 80),
        limit: 3,
        filters: { type: 'dev_agent_user_message', agentId: this.config.id }
      });
  priorMemories = search?.results || [];
    } catch (searchErr) {
      console.warn(`⚠️ DevAgent memory search failed: ${searchErr}`);
    }

    // Analyze the request type
    const requestType = this.analyzeRequestType(message);
    
    // Generate AI response using the enhanced prompt system
    const aiResponse = await this.generateDevelopmentResponse(message, context, requestType);

    // Add to conversation history
    const agentMessage: AgentMessage = {
      sessionId: context.sessionId,
      fromAgent: this.config.id,
      toAgent: undefined,
      content: aiResponse,
      messageType: 'update',
      metadata: {
        requestType,
        qualityScore: 85 // TODO: Calculate actual quality score
      }
    };
    this.conversationHistory.push(agentMessage);

  return this.createDevResponse(aiResponse, requestType, priorMemories);
  }

  /**
   * REAL AI-powered development response generation with personality enhancement
   */
  private async generateDevelopmentResponse(
    message: string, 
    context: AgentContext, 
    requestType: string
  ): Promise<string> {
    // Build enhanced development prompt
    const developmentPrompt = this.buildDevelopmentPrompt(message, requestType);
    
    // Generate base response using AI
    const baseResponse = await this.generateResponse(developmentPrompt);
    
    // Apply personality enhancement for authentic DevAgent perspective
    const personalityEnhancedResponse = await this.generatePersonalityResponse(
      baseResponse,
      context,
      // Create a basic persona for DevAgent
      {
        role: 'Developer Assistant',
        style: 'Professional and analytical',
        coreStrength: 'Software development expertise and problem-solving',
        principles: ['accuracy', 'helpfulness', 'technical_precision'],
        frameworks: ['systematic_analysis', 'problem_solving']
      }
    );
    
    return personalityEnhancedResponse;
  }

  /**
   * Override domain context for DevAgent personality
   */
  protected getDomainContext(): string {
    return 'software-development';
  }

  /**
   * Override domain keywords for DevAgent expertise assessment
   */
  protected getDomainKeywords(): string[] {
    return [
      'code', 'function', 'class', 'variable', 'method', 'api', 'bug', 'debug',
      'test', 'architecture', 'database', 'algorithm', 'performance', 'security',
      'framework', 'library', 'typescript', 'javascript', 'python', 'node',
      'react', 'git', 'deployment', 'refactor', 'optimize', 'implement'
    ];
  }

  /**
   * Build specialized development prompt
   */
  private buildDevelopmentPrompt(message: string, requestType: string): string {
    const systemPrompt = `You are DevAgent, a professional development assistant with expertise in:
- Code review and quality analysis
- Debugging and troubleshooting
- Code generation and implementation
- Architecture and design guidance
- Testing strategies and implementation
- Performance optimization

Request type: ${requestType}

User request: ${message}

Provide helpful, actionable development guidance with specific examples where appropriate.`;

    return systemPrompt;
  }

  /**
   * Analyze what type of development request this is
   */
  private analyzeRequestType(message: string): string {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('review') || messageLower.includes('check')) {
      return 'code_review';
    } else if (messageLower.includes('debug') || messageLower.includes('error') || messageLower.includes('fix')) {
      return 'debugging';
    } else if (messageLower.includes('generate') || messageLower.includes('create') || messageLower.includes('build')) {
      return 'code_generation';
    } else if (messageLower.includes('architecture') || messageLower.includes('design') || messageLower.includes('structure')) {
      return 'architecture_guidance';
    } else if (messageLower.includes('test') || messageLower.includes('testing')) {
      return 'testing_support';
    } else if (messageLower.includes('optimize') || messageLower.includes('performance') || messageLower.includes('speed')) {
      return 'performance_optimization';
    }
    
    return 'general_development';
  }

  /**
   * Create specialized development response
   */
  private createDevResponse(content: string, requestType: string, priorMemories: MemoryRecord[] = []): DevAgentResponse {
    const ts = createUnifiedTimestamp();
    return {
      content,
      actions: [{
        type: 'development_assistance',
        description: `Provided ${requestType} assistance`,
        parameters: { requestType }
      }],
      memories: priorMemories, // Surface a few contextual memories
      metadata: {
        agentId: this.config.id,
        timestamp: ts.iso,
        requestType,
        capabilities: Object.keys(this.capabilities),
        isRealAgent: true, // NOT just metadata!
        priorMemoriesUsed: priorMemories.length
      }
    };
  }

  /**
   * Get conversation history for this session
   */
  getConversationHistory(): AgentMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): DevAgentCapabilities {    return { ...this.capabilities };
  }

  get id(): string {
    return this.config.id;
  }
}
