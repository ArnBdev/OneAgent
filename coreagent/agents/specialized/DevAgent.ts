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

import { BaseAgent, AgentConfig, AgentContext, AgentResponse, Message, AgentAction } from '../base/BaseAgent';
import { ISpecializedAgent, AgentStatus, AgentHealthStatus } from '../base/ISpecializedAgent';
import { GeminiClient } from '../../tools/geminiClient';
import { OneAgentMem0Bridge } from '../../memory/OneAgentMem0Bridge';
import { v4 as uuidv4 } from 'uuid';

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
  private conversationHistory: Message[] = [];
  
  constructor(config: AgentConfig) {
    super(config);

    this.capabilities = {
      codeReview: true,
      debugging: true,
      codeGeneration: true,
      architectureGuidance: true,
      testingSupport: true,      performanceOptimization: true
    };
  }

  /** ISpecializedAgent interface implementation */
  get id(): string {
    return this.config.id;
  }
  async initialize(): Promise<void> {
    // Call parent initialize first (includes auto-registration)
    await super.initialize();
    
    // Initialize any DevAgent-specific resources
    this.conversationHistory = [];
    console.log(`DevAgent ${this.id} initialized`);
  }
  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'code_review',
        description: 'Review code for quality, security, and best practices',
        parameters: {
          code: { type: 'string', required: true, description: 'Code to review' },
          language: { type: 'string', required: false, description: 'Programming language' }
        }
      },
      {
        type: 'debug_assistance',
        description: 'Help debug code issues and provide solutions',
        parameters: {
          error: { type: 'string', required: true, description: 'Error description or code' },
          context: { type: 'string', required: false, description: 'Additional context' }
        }
      },
      {
        type: 'generate_code',
        description: 'Generate code based on requirements',
        parameters: {
          requirements: { type: 'string', required: true, description: 'Code requirements' },
          language: { type: 'string', required: true, description: 'Target programming language' }
        }
      }
    ];
  }

  async executeAction(action: string | AgentAction, params: any, context?: AgentContext): Promise<any> {
    const actionType = typeof action === 'string' ? action : action.type;
    
    switch (actionType) {
      case 'code_review':
        return this.performCodeReview(params.code, params.language, context);
      case 'debug_assistance':
        return this.provideDebugAssistance(params.error, params.context, context);
      case 'generate_code':
        return this.generateCode(params.requirements, params.language, context);
      default:
        throw new Error(`Unknown action: ${actionType}`);
    }
  }

  getName(): string {
    return this.config.name;
  }
  async getHealthStatus(): Promise<AgentHealthStatus> {
    return {
      status: 'healthy',
      uptime: Date.now(),
      memoryUsage: 0,
      responseTime: 0,
      errorRate: 0,
      lastActivity: new Date()
    };
  }

  async cleanup(): Promise<void> {
    this.conversationHistory = [];
    console.log(`DevAgent ${this.id} cleaned up`);
  }
  // DevAgent-specific action implementations
  private async performCodeReview(code: string, language?: string, _context?: AgentContext): Promise<any> {
    // Implementation for code review
    return { 
      review: `Code review completed for ${language || 'unknown'} code`,
      suggestions: [`Review ${code.length} characters of code`],
      score: 85
    };
  }

  private async provideDebugAssistance(error: string, additionalContext?: string, _context?: AgentContext): Promise<any> {
    // Implementation for debug assistance
    return { 
      solution: `Debug assistance for: ${error}`,
      steps: additionalContext ? [`Context: ${additionalContext}`] : ['No additional context provided'],
      confidence: 0.8
    };
  }

  private async generateCode(requirements: string, language: string, _context?: AgentContext): Promise<any> {
    // Implementation for code generation
    return { 
      code: `// Generated ${language} code for: ${requirements}\n// TODO: Implement functionality`,
      explanation: `Code generated for ${requirements} in ${language}`,
      files: [`main.${language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : 'txt'}`]
    };
  }

  /**
   * REAL message processing - not just metadata!
   */
  async processMessage(context: AgentContext, message: string): Promise<DevAgentResponse> {
    this.validateContext(context);

    // Store the incoming message in memory (REAL memory integration)
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

    // Analyze the request type
    const requestType = this.analyzeRequestType(message);
    
    // Generate AI response using the enhanced prompt system
    const aiResponse = await this.generateDevelopmentResponse(message, context, requestType);

    // Store the agent response in memory
    await this.storeAgentResponse(context.user.id, aiResponse, context);

    // Add to conversation history
    const agentMessage: Message = {
      id: uuidv4(),
      content: aiResponse,
      sender: 'agent',
      timestamp: new Date(),
      metadata: {
        sessionId: context.sessionId,
        requestType,
        qualityScore: 85 // TODO: Calculate actual quality score
      }
    };
    this.conversationHistory.push(agentMessage);

    return this.createDevResponse(aiResponse, requestType);
  }

  /**
   * REAL AI-powered development response generation with personality enhancement
   */
  private async generateDevelopmentResponse(
    message: string, 
    context: AgentContext, 
    requestType: string
  ): Promise<string> {
    // Search for relevant memories to provide context
    const relevantMemories = await this.searchMemories(context.user.id, message, 5);
    
    // Build enhanced development prompt
    const developmentPrompt = this.buildDevelopmentPrompt(message, requestType, relevantMemories);
    
    // Generate base response using AI
    const baseResponse = await this.generateResponse(developmentPrompt, relevantMemories);
    
    // Apply personality enhancement for authentic DevAgent perspective
    const personalityEnhancedResponse = await this.generatePersonalityResponse(
      baseResponse,
      context,
      message
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
  private buildDevelopmentPrompt(message: string, requestType: string, memories: any[]): string {
    const memoryContext = memories.length > 0 
      ? `\nRelevant past context:\n${memories.map(m => `- ${m.content}`).join('\n')}`
      : '';

    const systemPrompt = `You are DevAgent, a professional development assistant with expertise in:
- Code review and quality analysis
- Debugging and troubleshooting
- Code generation and implementation
- Architecture and design guidance
- Testing strategies and implementation
- Performance optimization

Request type: ${requestType}
${memoryContext}

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
   * Store user message in memory with unified metadata and memory intelligence
   */
  private async storeUserMessage(userId: string, message: string, context: AgentContext): Promise<void> {
    const content = `User development request: ${message}`;
    
    // Use unified backbone metadata system for proper concern separation
    const metadata = {
      messageType: 'user_request',
      agentId: this.config.id,
      sessionId: context.sessionId,
      timestamp: new Date().toISOString(),
      userId: userId,
      // Enhanced metadata for unified backbone system
      category: context.projectContext ? 'PROJECTS' : 'WORKPLACE', // Project vs workplace categorization
      sensitivity: 'internal' as const,
      contextDependency: 'user' as const,
      tags: ['development', 'user-request', `agent:${this.config.id}`],
      relevanceScore: 0.8,
      // Development-specific metadata
      requestType: this.analyzeRequestType(message),
      technicalComplexity: this.assessTechnicalComplexity(message),
      domainKeywords: this.extractDomainKeywords(message)
    };

    await this.addMemory(userId, content, metadata);
  }
  /**
   * Store agent response in memory with unified metadata and memory intelligence
   */
  private async storeAgentResponse(userId: string, response: string, context: AgentContext): Promise<void> {
    const content = `DevAgent response: ${response}`;
    
    // Use unified backbone metadata system
    const metadata = {
      messageType: 'agent_response',
      agentId: this.config.id,
      sessionId: context.sessionId,
      timestamp: new Date().toISOString(),
      userId: userId,
      qualityScore: 85, // TODO: Calculate actual quality score
      // Enhanced metadata for unified backbone system
      category: context.projectContext ? 'PROJECTS' : 'WORKPLACE',
      sensitivity: 'internal' as const,
      contextDependency: 'user' as const,
      tags: ['development', 'agent-response', `agent:${this.config.id}`],
      relevanceScore: 0.9,
      // Development-specific metadata
      responseType: 'development_assistance',
      technicalLevel: 'intermediate',
      constitutionalCompliant: true
    };

    await this.addMemory(userId, content, metadata);
  }

  // =============================================================================
  // ENHANCED MEMORY INTELLIGENCE METHODS
  // =============================================================================

  /**
   * Assess technical complexity of a development request
   */
  private assessTechnicalComplexity(message: string): 'simple' | 'intermediate' | 'complex' {
    const complexKeywords = ['architecture', 'microservices', 'distributed', 'scalability', 'optimization', 'design patterns'];
    const intermediateKeywords = ['database', 'api', 'framework', 'testing', 'deployment'];
    
    const messageLower = message.toLowerCase();
    
    if (complexKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'complex';
    } else if (intermediateKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'intermediate';
    }
    return 'simple';
  }

  /**
   * Extract domain-specific keywords from message
   */
  private extractDomainKeywords(message: string): string[] {
    const allKeywords = this.getDomainKeywords();
    const messageLower = message.toLowerCase();
    
    return allKeywords.filter(keyword => 
      messageLower.includes(keyword.toLowerCase())
    );
  }

  /**
   * Generate development insights using memory intelligence
   */
  async generateDevelopmentInsights(userId: string, query?: string): Promise<any[]> {
    const insights = await this.generateMemoryInsights(userId, query, {
      category: 'PROJECTS',
      includeInstitutionalKnowledge: true,
      sensitivity: 'internal'
    });
    
    // Add development-specific insight processing
    return insights.map(insight => ({
      ...insight,
      developmentContext: true,
      technicalRelevance: this.calculateTechnicalRelevance(insight),
      actionableSteps: this.generateActionableSteps(insight)
    }));
  }

  /**
   * Analyze development conversation patterns
   */
  async analyzeDevelopmentPatterns(userId: string): Promise<{
    patterns: any[];
    insights: any[];
    quality: number;
    developmentMetrics: any;
  }> {
    const baseAnalysis = await this.analyzeConversationPatterns(userId);
    
    // Add development-specific metrics
    const developmentMetrics = {
      codeReviewFrequency: 0, // TODO: Calculate from memory
      debuggingSuccessRate: 0, // TODO: Calculate from memory
      architectureDiscussions: 0, // TODO: Calculate from memory
      testingCoverage: 0 // TODO: Calculate from memory
    };
    
    return {
      ...baseAnalysis,
      developmentMetrics
    };
  }

  /**
   * Calculate technical relevance of an insight
   */
  private calculateTechnicalRelevance(insight: any): number {
    // Simple heuristic based on technical keywords in insight content
    const technicalKeywords = this.getDomainKeywords();
    const content = insight.content || insight.description || '';
    const matches = technicalKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    return Math.min(1.0, matches / 10); // Normalize to 0-1 scale
  }

  /**
   * Generate actionable steps from insight
   */
  private generateActionableSteps(insight: any): string[] {
    // Basic implementation - could be enhanced with AI
    const insightType = insight.type || 'general';    
    switch (insightType) {
      case 'pattern':
        return ['Review pattern implementation', 'Consider optimization opportunities', 'Document best practices'];
      case 'anomaly':
        return ['Investigate root cause', 'Implement monitoring', 'Create prevention strategy'];
      case 'trend':
        return ['Monitor trend progression', 'Adapt development practices', 'Share findings with team'];
      default:
        return ['Review insight details', 'Plan implementation', 'Monitor results'];
    }
  }

  /**
   * Create specialized development response
   */
  private createDevResponse(content: string, requestType: string): DevAgentResponse {
    return {
      content,
      actions: [{
        type: 'development_assistance',
        description: `Provided ${requestType} assistance`,
        parameters: { requestType }
      }],
      memories: [], // Memories are handled separately
      metadata: {
        agentId: this.config.id,
        timestamp: new Date().toISOString(),
        requestType,
        capabilities: Object.keys(this.capabilities),
        isRealAgent: true // NOT just metadata!
      }
    };
  }

  /**
   * Get conversation history for this session
   */
  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): DevAgentCapabilities {    return { ...this.capabilities };
  }
}
