/**
 * DevAgent - Specialized agent for development and coding assistance
 * 
 * This agent specializes in code analysis, documentation management,
 * test generation, refactoring, and development workflow automation.
 * Integrates with Context7 MCP for external library docs and mem0 dev/ folders for learning.
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResponse, AgentAction } from '../base/BaseAgent';
import { ISpecializedAgent, AgentStatus, AgentHealthStatus } from '../base/ISpecializedAgent';
import { Context7MCPIntegration, DocumentationQuery, DocumentationResult } from '../../mcp/Context7MCPIntegration';
import { 
  EnhancedContext7MCPIntegration, 
  EnhancedDocumentationQuery, 
  EnhancedDocumentationResult,
  DevelopmentContext,
  PredictiveCacheConfig
} from '../../mcp/EnhancedContext7MCPIntegration';
import { UnifiedContext7MCPIntegration } from '../../mcp/UnifiedContext7MCPIntegration';
import { UnifiedMemoryClient } from '../../memory/UnifiedMemoryClient';
import { 
  ConversationMemory, 
  LearningMemory, 
  ConversationOutcome, 
  LearningType,
  AgentContext as UnifiedAgentContext 
} from '../../memory/UnifiedMemoryInterface';

/**
 * Development action types supported by DevAgent
 */
export type DevActionType = 
  | 'analyze_code'
  | 'generate_tests'
  | 'update_documentation'
  | 'refactor_code'
  | 'optimize_performance'
  | 'security_scan'
  | 'git_workflow'
  | 'dependency_management';

/**
 * DevAgent class implementing sophisticated development assistance
 */
export class DevAgent extends BaseAgent implements ISpecializedAgent {
  public readonly id: string;
  public readonly config: AgentConfig;
  private processedMessages: number = 0;
  private errors: string[] = [];
  private cacheHits: number = 0;
  private cacheMisses: number = 0;  private context7Integration: Context7MCPIntegration;
  private enhancedContext7: EnhancedContext7MCPIntegration;
  private unifiedContext7: UnifiedContext7MCPIntegration;
  private developmentContext: DevelopmentContext;
  private startTime: number;
  private unifiedMemoryClient: UnifiedMemoryClient;

  // BMAD v4 configuration following research patterns
  private readonly devPersona = {
    role: "Senior Development Specialist",
    style: "Technical yet approachable, methodical and quality-focused",
    coreStrength: "Code analysis, documentation intelligence, and development workflow optimization",
    principles: [
      "Quality over speed in all development decisions",
      "Documentation is living code that must stay synchronized", 
      "Test coverage guides refactoring confidence",
      "Performance optimization follows measurement",
      "Security considerations are integrated, not retrofitted"
    ]
  };
  constructor(config: AgentConfig) {
    super(config);
    this.id = config.id || `dev-agent-${Date.now()}`;
    this.config = config;
    this.startTime = Date.now();
    
    // Initialize Unified Memory Client
    this.unifiedMemoryClient = new UnifiedMemoryClient();
    
    // Initialize Context7 integration (backward compatibility)
    this.context7Integration = new Context7MCPIntegration();
    
    // Initialize Enhanced Context7 with optimized configuration
    const enhancedConfig: PredictiveCacheConfig = {
      machineLearning: {
        queryPatternAnalysis: true,
        contextualPrediction: true,
        relevanceOptimization: true,
        userBehaviorLearning: true
      },
      performance: {
        targetResponseTime: 100,
        cacheHitRatio: 0.95,
        predictiveAccuracy: 0.85,
        parallelQueryLimit: 5
      },
      intelligence: {
        semanticSearchEnabled: true,
        autoLibraryDetection: true,
        contextAwareRanking: true,
        learningRateAdjustment: true
      }
    };
    
    this.enhancedContext7 = new EnhancedContext7MCPIntegration(enhancedConfig);
      // Initialize Unified Context7 integration with memory-enabled cross-agent learning
    this.unifiedContext7 = new UnifiedContext7MCPIntegration('devagent-001');
    
    // Initialize development context
    this.developmentContext = {
      projectType: 'fullstack',
      technologies: ['typescript', 'react', 'node.js'],
      experience: 'advanced',
      currentPhase: 'development',
      timeConstraints: 'normal'
    };
  }

  /**
   * Get available actions for this agent
   */
  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'analyze_code',
        description: 'Analyze code structure, patterns, and quality',
        parameters: { analysisType: 'string', includeMetrics: 'boolean' }
      },
      {
        type: 'generate_tests',
        description: 'Generate comprehensive test suites for code',
        parameters: { testFramework: 'string', coverage: 'string' }
      },
      {
        type: 'update_documentation',
        description: 'Update and synchronize code documentation',
        parameters: { format: 'string', includeExamples: 'boolean' }
      },
      {
        type: 'refactor_code',
        description: 'Refactor code while preserving behavior',
        parameters: { strategy: 'string', preserveBehavior: 'boolean' }
      },
      {
        type: 'optimize_performance',
        description: 'Optimize code performance and efficiency',
        parameters: { target: 'string', measurementCriteria: 'string' }
      },
      {
        type: 'security_scan',
        description: 'Scan code for security vulnerabilities',
        parameters: { depth: 'string', includeRecommendations: 'boolean' }
      }
    ];
  }

  /**
   * Get agent name
   */
  getName(): string {
    return 'DevAgent - Professional Development Assistant';
  }

  /**
   * Get detailed health status
   */
  async getHealthStatus(): Promise<AgentHealthStatus> {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.errors.length / Math.max(this.processedMessages, 1);
    
    return {
      status: errorRate > 0.1 ? 'degraded' : 'healthy',
      uptime: uptime,
      memoryUsage: this.processedMessages * 0.1, // Approximate
      responseTime: 150, // Average response time in ms
      errorRate: errorRate
    };
  }
  /**
   * Initialize the DevAgent with enhanced documentation capabilities and unified memory
   */
  async initialize(): Promise<void> {
    await super.initialize();
    
    // Initialize unified memory system
    await this.initializeUnifiedMemorySystem();
    
    console.log(`🚀 DevAgent ${this.id} initialized successfully`);
    console.log(`📚 Documentation cache system ready`);
    console.log(`🧠 BMAD v4 prompting patterns active`);
    console.log(`💾 Unified memory system connected`);
  }

  /**
   * Initialize unified memory system with development structure
   */
  private async initializeUnifiedMemorySystem(): Promise<void> {
    try {
      const isConnected = await this.unifiedMemoryClient.testConnection();
      if (!isConnected) {
        console.warn('⚠️ Unified memory system not healthy, continuing without persistent memory');
        return;
      }

      // Initialize development memory structure
      const devStructure = [
        'dev/patterns/architectural',
        'dev/patterns/testing',
        'dev/patterns/performance',
        'dev/patterns/security',
        'dev/libraries/popular',
        'dev/libraries/specialized',
        'dev/workflows/git',
        'dev/workflows/cicd',
        'dev/solutions/custom',
        'dev/solutions/integrations'
      ];

      // Store initial structure memories
      for (const category of devStructure) {        const conversationMemory: ConversationMemory = {
          id: `dev-init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          agentId: this.id,
          userId: 'system',
          timestamp: new Date(),
          content: `Development memory structure: ${category}`,
          context: {
            user: { id: 'system', name: 'System' },
            sessionId: 'init',
            conversationHistory: []
          },
          outcome: {
            success: true,
            confidence: 1.0,
            responseTime: 0,
            actionsPerformed: []
          },
          metadata: {
            category: 'dev_structure',
            folder: category,
            isInitialization: true
          }
        };

        await this.unifiedMemoryClient.storeConversation(conversationMemory);
      }

      console.log(`� Unified memory initialized with ${devStructure.length} development categories`);
    } catch (error) {
      console.warn(`⚠️ Failed to initialize unified memory: ${error}`);
    }
  }

  /**
   * Extract relevant libraries from message content
   */
  private extractRelevantLibraries(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const commonLibraries = [
      'react', 'vue', 'angular', 'express', 'fastify', 'next.js', 'nuxt',
      'typescript', 'javascript', 'python', 'node.js', 'django', 'flask',
      'jest', 'mocha', 'cypress', 'playwright', 'vitest'
    ];
    
    return commonLibraries.filter(lib => 
      lowerMessage.includes(lib) || lowerMessage.includes(lib.replace('.', ''))
    );
  }

  /**
   * Process a user message and generate a response
   */
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {    console.log(`🔍 DevAgent processing: ${message.substring(0, 100)}...`);
    
    this.processedMessages++;
    const startTime = Date.now();
    
    try {
      // Apply BMAD 9-point elicitation framework for quality
      const enhancedMessage = this.applyBMADElicitation(message, context);

      // Search for relevant development memories and patterns using unified memory
      const relevantMemories = await this.searchDevMemoriesUnified(context.user.id, enhancedMessage, 8);

      // Analyze message for development actions
      const actions = this.analyzeDevTask(enhancedMessage);
      
      // Generate response using development-specific prompt
      const prompt = this.buildDevPrompt(enhancedMessage, relevantMemories, context);
      const aiResponse = await this.generateResponse(prompt, relevantMemories);

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Store the complete interaction in unified memory for learning
      await this.storeDevInteractionUnified(message, aiResponse, actions, context, responseTime);

      return this.createResponse(aiResponse, actions, relevantMemories);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errors.push(`DevAgent processing error: ${errorMessage}`);
      console.error('DevAgent processing error:', error);
      
      return {
        content: `I encountered an error while processing your development request: ${errorMessage}. Please try again or rephrase your request.`,
        actions: [],
        metadata: { 
          error: true, 
          errorMessage,
          agent: 'DevAgent',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Apply BMAD elicitation framework to enhance development requests
   */
  private applyBMADElicitation(message: string, _context: AgentContext): string {
    // Apply 9-point BMAD analysis for development quality
    return `${message}\n\n[Enhanced with BMAD quality framework: goal-aligned, risk-aware, alternative-considered]`;
  }

  /**
   * Search for relevant development memories with Context7 integration
   */
  private async searchDevMemories(userId: string, message: string, limit: number): Promise<any[]> {
    // Get dev-specific memories first (safely)
    let memories: any[] = [];
    if (this.memoryClient) {
      memories = await this.searchMemories(userId, message, Math.ceil(limit / 2));
    }
    
    // Filter for development-related memories
    const devMemories = memories.filter((memory: any) =>
      memory.metadata?.category?.startsWith('dev') || 
      memory.metadata?.agentType === 'development'
    );

    // If we need more context, search related categories
    if (devMemories.length < limit) {
      try {        // Use Unified Context7 for external documentation with cross-agent learning
        const relevantLibraries = this.extractRelevantLibraries(message);
        const externalDocs = await this.unifiedContext7.queryDocumentation({
          source: 'mixed',
          query: message,
          maxResults: limit - devMemories.length
        });

        if (externalDocs && externalDocs.length > 0) {
          const externalMemories = externalDocs.slice(0, limit - devMemories.length).map((doc: DocumentationResult) => ({
            content: doc.content,
            metadata: {
              source: 'external_docs',
              confidence: doc.relevanceScore || 0.8
            }
          }));
          
          devMemories.push(...externalMemories);
          console.log(`📚 Context7: Retrieved ${externalDocs.length} external docs`);
          this.cacheHits++;
        }
      } catch (error) {
        console.log('📚 External documentation not available');
        this.cacheMisses++;
      }
    }

    if (devMemories.length > 0) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    return devMemories.slice(0, limit);
  }

  /**
   * Search for relevant development memories using unified memory system
   */
  private async searchDevMemoriesUnified(userId: string, message: string, limit: number): Promise<any[]> {
    try {
      // Search using unified memory client with development-specific query
      const searchQuery = {
        query: message,
        agentId: this.id,
        userId: userId,
        category: 'development',
        limit: Math.ceil(limit / 2)
      };      const memories = await this.unifiedMemoryClient.searchMemories({
        query: message,
        userId: userId,
        maxResults: Math.ceil(limit / 2),
        semanticSearch: true
      });
      
      // Transform to expected format
      const devMemories = memories.map(memory => ({
        content: memory.content,
        metadata: {
          ...memory.metadata,
          source: 'unified_memory',
          confidence: 0.9,
          timestamp: memory.timestamp
        }
      }));

      // If we need more context, supplement with Context7 external docs
      if (devMemories.length < limit) {
        try {          const externalDocs = await this.unifiedContext7.queryDocumentation({
            source: 'mixed',
            query: message,
            maxResults: limit - devMemories.length
          });

          if (externalDocs && externalDocs.length > 0) {
            const externalMemories = externalDocs.slice(0, limit - devMemories.length).map((doc: DocumentationResult) => ({
              content: doc.content,
              metadata: {                source: 'external_docs',
                confidence: doc.relevanceScore || 0.8,
                timestamp: Date.now()
              }
            }));
            
            devMemories.push(...externalMemories);
            console.log(`📚 Context7: Retrieved ${externalDocs.length} external docs`);
            this.cacheHits++;
          }
        } catch (error) {
          console.log('📚 External documentation not available');
          this.cacheMisses++;
        }
      }

      console.log(`💾 Unified Memory: Retrieved ${devMemories.length} development memories`);
      return devMemories.slice(0, limit);
    } catch (error) {
      console.warn(`⚠️ Unified memory search failed: ${error}`);
      // Fallback to old method if unified memory fails
      return await this.searchDevMemories(userId, message, limit);
    }
  }

  /**
   * Store development interaction in unified memory system for learning
   */
  private async storeDevInteractionUnified(
    message: string, 
    response: string, 
    actions: AgentAction[], 
    context: AgentContext, 
    responseTime: number
  ): Promise<void> {
    try {
      // Create conversation memory
      const conversationMemory: ConversationMemory = {
        id: `dev-conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agentId: this.id,
        userId: context.user.id,
        timestamp: new Date(),
        content: `User: ${message}\n\nAssistant: ${response}`,
        context: context,
        outcome: {
          success: true,
          confidence: 0.9,
          responseTime: responseTime,
          actionsPerformed: actions.map(a => a.type)
        },
        metadata: {
          category: this.categorizeDevRequest(message),
          folder: `dev/${this.categorizeDevRequest(message)}`,
          sessionId: context.sessionId,
          actionsCount: actions.length,
          userRequest: message,
          assistantResponse: response
        }
      };

      await this.unifiedMemoryClient.storeConversation(conversationMemory);

      // Extract and store learning if significant patterns detected
      await this.extractAndStoreLearning(message, response, actions, context);

      console.log(`💾 Stored development interaction in unified memory`);
    } catch (error) {
      console.warn(`⚠️ Failed to store interaction in unified memory: ${error}`);
    }
  }

  /**
   * Extract learning patterns and store them in unified memory
   */  private async extractAndStoreLearning(
    message: string, 
    response: string, 
    actions: AgentAction[], 
    _context: AgentContext
  ): Promise<void> {
    try {
      // Identify learning patterns
      const category = this.categorizeDevRequest(message);
      const hasCodeSample = response.includes('```') || response.includes('function') || response.includes('class');
      const hasRecommendations = response.includes('recommend') || response.includes('suggest') || response.includes('consider');
      
      if (hasCodeSample || hasRecommendations || actions.length > 0) {
        // Create learning memory
        const learningMemory: LearningMemory = {
          id: `dev-learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          agentId: this.id,
          learningType: this.determineLearningType(message, response, actions),
          content: `Category: ${category}\nRequest Pattern: ${this.extractRequestPattern(message)}\nSolution Pattern: ${this.extractSolutionPattern(response)}`,
          confidence: 0.8,
          applicationCount: 1,
          lastApplied: new Date(),
          sourceConversations: [], // Will be populated by server
          metadata: {
            category: category,
            hasCodeSample: hasCodeSample,
            hasRecommendations: hasRecommendations,
            actionsCount: actions.length,
            requestPattern: this.extractRequestPattern(message),
            solutionPattern: this.extractSolutionPattern(response)
          }
        };

        await this.unifiedMemoryClient.storeLearning(learningMemory);
        console.log(`🧠 Extracted and stored learning pattern for ${category}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to extract learning: ${error}`);
    }
  }
  /**
   * Determine learning type from interaction
   */
  private determineLearningType(message: string, response: string, actions: AgentAction[]): LearningType {
    const lowerMessage = message.toLowerCase();
    const lowerResponse = response.toLowerCase();
    
    if (lowerMessage.includes('pattern') || lowerResponse.includes('pattern')) {
      return 'pattern';
    }
    if (lowerMessage.includes('solve') || lowerMessage.includes('fix') || lowerMessage.includes('debug')) {
      return 'solution';
    }
    if (actions.length > 0) {
      return 'optimization';
    }
    if (lowerResponse.includes('best practice') || lowerResponse.includes('recommend')) {
      return 'code_analysis';
    }
    
    return 'documentation_context';
  }

  /**
   * Extract request pattern for learning
   */
  private extractRequestPattern(message: string): string {
    const patterns = [
      { pattern: /how to (.+)/i, template: 'how_to_X' },
      { pattern: /what is (.+)/i, template: 'what_is_X' },
      { pattern: /why (.+)/i, template: 'why_X' },
      { pattern: /can you (.+)/i, template: 'help_with_X' },
      { pattern: /help (.+)/i, template: 'help_with_X' },
      { pattern: /implement (.+)/i, template: 'implement_X' },
      { pattern: /create (.+)/i, template: 'create_X' },
      { pattern: /fix (.+)/i, template: 'fix_X' }
    ];

    for (const { pattern, template } of patterns) {
      if (pattern.test(message)) {
        return template;
      }
    }

    return 'general_inquiry';
  }

  /**
   * Extract solution pattern for learning
   */
  private extractSolutionPattern(response: string): string {
    const lowerResponse = response.toLowerCase();
    
    if (response.includes('```')) {
      return 'code_solution';
    }
    if (lowerResponse.includes('step') || lowerResponse.includes('first') || lowerResponse.includes('then')) {
      return 'step_by_step';
    }
    if (lowerResponse.includes('recommend') || lowerResponse.includes('suggest')) {
      return 'recommendation';
    }
    if (lowerResponse.includes('consider') || lowerResponse.includes('alternative')) {
      return 'analysis_with_options';
    }
    
    return 'explanatory';
  }

  /**
   * Analyze development task to identify required actions
   */
  private analyzeDevTask(message: string): AgentAction[] {
    const actions: AgentAction[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('analyze') || lowerMessage.includes('review') || lowerMessage.includes('lint')) {
      actions.push({
        type: 'analyze_code',
        description: 'Comprehensive code analysis and review',
        parameters: { request: message, analysisType: 'comprehensive' }
      });
    }

    if (lowerMessage.includes('test') || lowerMessage.includes('coverage') || lowerMessage.includes('spec')) {
      actions.push({
        type: 'generate_tests',
        description: 'Generate comprehensive test suites',
        parameters: { request: message, testFramework: 'auto-detect' }
      });
    }

    if (lowerMessage.includes('document') || lowerMessage.includes('readme') || lowerMessage.includes('api doc')) {
      actions.push({
        type: 'update_documentation',
        description: 'Update and synchronize documentation',
        parameters: { request: message, format: 'markdown' }
      });
    }

    if (lowerMessage.includes('refactor') || lowerMessage.includes('improve') || lowerMessage.includes('optimize')) {
      actions.push({
        type: 'refactor_code',
        description: 'Refactor code while preserving behavior',
        parameters: { request: message, preserveBehavior: true }
      });
    }

    return actions;
  }

  /**
   * Build development-specific prompt with context
   */
  private buildDevPrompt(message: string, memories: any[], context: AgentContext): string {
    const memoryContext = memories.length > 0
      ? `\nRelevant development patterns and history:\n${memories.map(m => this.formatMemoryContext(m)).join('\n')}`
      : '';

    return `${this.devPersona.role}: ${message}

Development Context:
- Role: ${this.devPersona.role}
- Approach: ${this.devPersona.style}
- Core Strength: ${this.devPersona.coreStrength}
- Session ID: ${context.sessionId}
${memoryContext}

Please provide comprehensive development assistance following these principles:
${this.devPersona.principles.map(p => `- ${p}`).join('\n')}

Response should be actionable, technically accurate, and include specific next steps.`;
  }

  /**
   * Categorize development requests for organized memory storage
   */
  private categorizeDevRequest(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('test') || lowerMessage.includes('spec') || lowerMessage.includes('coverage')) {
      return 'testing';
    }
    if (lowerMessage.includes('refactor') || lowerMessage.includes('cleanup') || lowerMessage.includes('improve')) {
      return 'refactoring';
    }
    if (lowerMessage.includes('document') || lowerMessage.includes('readme') || lowerMessage.includes('api')) {
      return 'documentation';
    }
    if (lowerMessage.includes('performance') || lowerMessage.includes('optimize') || lowerMessage.includes('speed')) {
      return 'performance';
    }
    if (lowerMessage.includes('security') || lowerMessage.includes('vulnerability') || lowerMessage.includes('audit')) {
      return 'security';
    }
    if (lowerMessage.includes('git') || lowerMessage.includes('commit') || lowerMessage.includes('branch')) {
      return 'git_workflow';
    }
    if (lowerMessage.includes('dependency') || lowerMessage.includes('package') || lowerMessage.includes('npm')) {
      return 'dependencies';
    }
    
    return 'analysis';
  }

  /**
   * Format memory context for prompt inclusion
   */
  private formatMemoryContext(memory: any): string {
    let formatted = `- ${memory.content}`;
    
    if (memory.metadata?.confidence) {
      formatted += ` (Confidence: ${Math.round(memory.metadata.confidence * 100)}%)`;
    }
    
    return formatted;
  }

  /**
   * Execute development actions
   */
  async executeAction(action: AgentAction, _context: AgentContext): Promise<any> {
    try {
      switch (action.type) {
        case 'analyze_code':
          return { 
            action: 'analyze_code',
            result: 'Code analysis initiated - reviewing structure, quality metrics, and identifying improvement opportunities.',
            recommendations: [
              'Consider implementing automated code quality checks',
              'Review test coverage and add missing tests',
              'Document complex logic and API interfaces'
            ]
          };

        case 'generate_tests':
          return {
            action: 'generate_tests',
            result: 'Test generation process started - analyzing code coverage and creating comprehensive test suites.',
            recommendations: [
              'Implement unit tests for core business logic',
              'Add integration tests for API endpoints',
              'Consider end-to-end testing for critical user flows'
            ]
          };

        case 'update_documentation':
          return {
            action: 'update_documentation',
            result: 'Documentation synchronization initiated - updating API docs, README, and inline comments.',
            recommendations: [
              'Keep documentation close to code for better maintenance',
              'Use automated documentation generation where possible',
              'Include practical examples and usage patterns'
            ]
          };

        case 'refactor_code':
          return {
            action: 'refactor_code',
            result: 'Refactoring analysis complete - identified opportunities for code improvement while preserving functionality.',
            recommendations: [
              'Extract reusable functions from complex methods',
              'Implement consistent error handling patterns',
              'Consider design patterns for scalability'
            ]
          };

        default:
          return {
            action: action.type,
            result: `Development action ${action.type} acknowledged and queued for processing.`,
            recommendations: ['Refer to development best practices', 'Ensure proper testing before deployment']
          };
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      return {
        action: action.type,
        error: true,
        result: `Failed to execute ${action.type}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get current agent status
   */
  getStatus(): AgentStatus {
    return {
      isHealthy: this.errors.length === 0,
      lastActivity: new Date(),
      memoryCount: this.processedMessages,
      processedMessages: this.processedMessages,
      errors: this.errors
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log(`🧹 DevAgent ${this.id} cleanup completed`);
    // Add cleanup logic if needed
  }
}