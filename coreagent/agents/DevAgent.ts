/**
 * DevAgent.ts
 * 
 * Development assistant agent using memory-driven communication.
 * Specializes in coding assistance, code review, and development workflows.
 * 
 * Features:
 * - Memory-driven context sharing for coding patterns and solutions
 * - Cross-session learning from development interactions
 * - Integration with context7 for advanced code understanding
 * - Constitutional AI for code quality and safety validation
 * - BMAD framework for complex development task analysis
 * 
 * @version 4.0.0
 * @author OneAgent Professional Development Platform
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResponse, Message } from './base/BaseAgent';
import { memoryDrivenComm, AgentMessage, AgentContext as CommAgentContext } from './communication/MemoryDrivenAgentCommunication';
import { realUnifiedMemoryClient } from '../memory/RealUnifiedMemoryClient';
import { AdvancedCodeAnalysisEngine, CodeAnalysisRequest, CodeAnalysisResult } from './AdvancedCodeAnalysisEngine';
import { DevAgentLearningEngine, LearnedPattern, LearningContext } from './DevAgentLearningEngine';
import { v4 as uuidv4 } from 'uuid';

// Enhanced development-specific Constitutional principles
interface DevelopmentConstitutionalPrinciple {
  id: string;
  name: string;
  description: string;
  validationRule: string;
  severityLevel: 'critical' | 'high' | 'medium' | 'low';
}

const DEVELOPMENT_CONSTITUTIONAL_PRINCIPLES: DevelopmentConstitutionalPrinciple[] = [
  {
    id: 'development_accuracy',
    name: 'Development Accuracy',
    description: 'Provide precise, tested development guidance based on established patterns',
    validationRule: 'Response includes specific code examples or references to documentation',
    severityLevel: 'critical'
  },
  {
    id: 'security_first',
    name: 'Security-First Development',
    description: 'Always consider security implications and best practices',
    validationRule: 'Security considerations are mentioned for sensitive operations',
    severityLevel: 'critical'
  },
  {
    id: 'comprehensive_analysis',
    name: 'Comprehensive Technical Analysis',
    description: 'Consider dependencies, edge cases, and system implications',
    validationRule: 'Response addresses potential complications and alternatives',
    severityLevel: 'high'
  },
  {
    id: 'maintainability',
    name: 'Long-term Maintainability',
    description: 'Prioritize solutions that will remain maintainable and extensible',
    validationRule: 'Response considers long-term implications and maintenance',
    severityLevel: 'high'
  }
];

// Enhanced metadata interface for learning
interface EnhancedLearningMetadata extends LearningContext {
  complexity?: 'simple' | 'medium' | 'complex' | 'expert';
  advancedPrompting?: boolean;
  qualityScore?: number;
  importance?: number;
  constitutionalCompliance?: {
    validated: boolean;
    principles: string[];
    score: number;
  };
}

export interface DevAgentConfig extends AgentConfig {
  codeReviewEnabled: boolean;
  context7Integration: boolean;
  maxCodeComplexity: number;
  supportedLanguages: string[];
}

export interface CodeContext {
  language: string;
  framework?: string;
  codeSnippet?: string;
  filePath?: string;
  problemDescription?: string;
  requestType: 'review' | 'debug' | 'implement' | 'explain' | 'optimize' | 'test' | 'refactor';
}

/**
 * DevAgent - Development assistant with memory-driven communication
 */
export class DevAgent extends BaseAgent {
  private codePatterns: Map<string, any> = new Map();
  private knownSolutions: Map<string, any> = new Map();
  private isRegistered: boolean = false;
  private codeAnalysisEngine!: AdvancedCodeAnalysisEngine;
  private learningEngine!: DevAgentLearningEngine;

  constructor(config?: Partial<DevAgentConfig>) {
    const defaultConfig: DevAgentConfig = {
      id: 'dev-agent',
      name: 'DevAgent',
      description: 'Development assistant agent with memory-driven communication and context7 integration',
      capabilities: [
        'code_review',
        'code_generation',
        'debugging_assistance',
        'architecture_guidance',
        'best_practices',
        'context7_integration',
        'memory_driven_learning'
      ],
      memoryEnabled: true,
      aiEnabled: true,
      codeReviewEnabled: true,
      context7Integration: true,
      maxCodeComplexity: 1000,
      supportedLanguages: [
        'typescript',
        'javascript',
        'python',
        'java',
        'go',
        'rust',
        'c++',
        'c#'
      ]
    };

    super({ ...defaultConfig, ...config });
  }
  /**
   * Initialize DevAgent and register with memory-driven communication
   */
  async initialize(): Promise<void> {
    try {
      console.log('[DevAgent] Initializing...');
      
      // Initialize base agent
      await super.initialize();
        // Initialize advanced code analysis engine
      this.codeAnalysisEngine = new AdvancedCodeAnalysisEngine(this.config.id, memoryDrivenComm);
      
      // Initialize adaptive learning engine
      this.learningEngine = new DevAgentLearningEngine(this.config.id, memoryDrivenComm);
      await this.learningEngine.initialize();
      
      // Register with memory-driven communication hub
      const agentContext: CommAgentContext = {
        agentId: this.config.id,
        capabilities: this.config.capabilities,
        status: 'available',
        expertise: [
          'software_development',
          'code_review',
          'debugging',
          'architecture_design',
          'best_practices',
          'context7_analysis',
          'memory_driven_learning'
        ],
        recentActivity: new Date(),
        memoryCollectionId: '' // Will be set by registration
      };

      await memoryDrivenComm.registerAgent(agentContext);
      this.isRegistered = true;

      // Load existing code patterns from memory
      await this.loadCodePatternsFromMemory();      // Store initialization in memory
      await this.storeDevMemory(
        `DevAgent initialized with advanced code analysis engine, adaptive learning engine, context7 integration, and memory-driven learning`,
        'initialization',
        {
          timestamp: new Date().toISOString(),
          capabilities: this.config.capabilities,
          supportedLanguages: (this.config as DevAgentConfig).supportedLanguages,
          status: 'operational',
          codeAnalysisEngine: 'enabled',
          learningEngine: 'enabled'
        }
      );

      console.log('[DevAgent] Initialization complete and registered in memory system');
    } catch (error) {
      console.error('[DevAgent] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process development-related messages with memory-driven context
   */
  async processMessage(context: AgentContext): Promise<AgentResponse> {
    try {
      console.log('[DevAgent] Processing development message with memory-driven context');
      
      if (!this.isRegistered) {
        await this.initialize();
      }

      const userMessage = context.conversationHistory[context.conversationHistory.length - 1]?.content;
        // Analyze if this is a development-related request
      const codeContext = await this.analyzeCodeContext(userMessage);
      
      if (!codeContext) {
        // Not a development request, delegate to CoreAgent
        await this.delegateToCore(context);
        return {
          content: "I've forwarded your request to CoreAgent as it appears to be outside my development expertise.",
          metadata: {
            delegated: true,
            timestamp: new Date().toISOString()
          }
        };
      }      // Use advanced code analysis engine for sophisticated analysis
      const analysisRequest: CodeAnalysisRequest = {
        code: codeContext.codeSnippet || '',
        language: codeContext.language,
        requestType: codeContext.requestType === 'implement' ? 'review' : codeContext.requestType as 'review' | 'debug' | 'optimize' | 'explain' | 'test' | 'refactor',
        userId: context.user.id,
        ...(codeContext.problemDescription && { context: codeContext.problemDescription }),
        ...(codeContext.filePath && { filePath: codeContext.filePath }),
        ...(codeContext.problemDescription && { problemDescription: codeContext.problemDescription }),
        ...(context.sessionId && { sessionId: context.sessionId })
      };

      let analysisResult: CodeAnalysisResult | null = null;
      if (codeContext.codeSnippet) {
        analysisResult = await this.codeAnalysisEngine.analyzeCode(analysisRequest);
        
        // Learn from context7 documentation if used
        if (analysisResult.documentation.length > 0) {
          await this.learningEngine.learnFromDocumentation(
            analysisResult.documentation,
            codeContext.language,
            codeContext.problemDescription || 'general development'
          );
        }
      }

      // Get relevant learned patterns
      const learnedPatterns = await this.learningEngine.findRelevantPatterns(
        codeContext.problemDescription || userMessage,
        codeContext.language,
        this.mapRequestTypeToCategory(codeContext.requestType)
      );

      // Get contextual information from memory system
      const memoryContext = await memoryDrivenComm.getAgentContext(
        this.config.id,
        userMessage
      );

      // Get relevant development patterns and solutions from memory
      const relevantPatterns = await this.getRelevantCodePatterns(codeContext);
      
      // Store incoming message in memory
      await this.storeDevMemory(
        `Development request: ${userMessage}`,
        'user_request',
        {
          sessionId: context.sessionId,
          userId: context.user.id,
          codeContext,
          analysisUsed: !!analysisResult,
          timestamp: new Date().toISOString()
        }
      );      // Generate development response with advanced analysis and learned patterns
      const response = await this.generateDevelopmentResponse(
        context, 
        codeContext, 
        memoryContext, 
        relevantPatterns,
        analysisResult,
        learnedPatterns
      );      // Learn from this interaction if successful
      if (response.metadata?.success !== false) {
        // Apply Constitutional AI validation
        const constitutionalValidation = await this.validateDevelopmentResponse(
          response.content,
          codeContext,
          userMessage
        );

        // Determine enhanced complexity
        const complexity = this.determineTaskComplexityEnhanced(userMessage, codeContext);

        // Calculate quality score (for future integration with quality scoring)
        const qualityScore = constitutionalValidation.score;

        const enhancedLearningContext: EnhancedLearningMetadata = {
          sessionId: context.sessionId,
          userId: context.user.id,
          language: codeContext.language,
          problemType: codeContext.requestType,
          successfulOutcome: true, // Assume success unless explicitly marked as failure
          complexity,
          advancedPrompting: true,
          qualityScore,
          importance: complexity === 'expert' ? 1.0 : complexity === 'complex' ? 0.8 : 0.6,
          constitutionalCompliance: constitutionalValidation,
          ...(codeContext.framework && { framework: codeContext.framework }),
          ...(analysisResult && { analysisResult }),
          ...(analysisResult?.documentation && { documentationUsed: analysisResult.documentation })
        };
        
        await this.learningEngine.learnFromInteraction(
          codeContext.problemDescription || userMessage,
          response.content,
          codeContext.language,
          enhancedLearningContext
        );
      }

      // Store response and learn from interaction
      await this.storeDevMemory(
        `DevAgent response: ${response.content}`,
        'agent_response',
        {
          sessionId: context.sessionId,
          userId: context.user.id,
          codeContext,
          responseMetadata: response.metadata,
          timestamp: new Date().toISOString()
        }
      );

      // Learn from the interaction
      await this.learnFromInteraction(codeContext, response);

      return response;
    } catch (error) {
      console.error('[DevAgent] Error processing message:', error);
      
      return {
        content: 'I encountered an error processing your development request. Let me try a different approach or delegate to another agent.',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Analyze user message to extract code context
   */
  private async analyzeCodeContext(message: string): Promise<CodeContext | null> {
    console.log('[DevAgent] Analyzing code context');
    
    // Simple heuristics - can be enhanced with AI analysis
    const developmentKeywords = [
      'code', 'debug', 'implement', 'function', 'class', 'bug', 'error',
      'review', 'optimize', 'refactor', 'typescript', 'javascript', 'python',
      'api', 'database', 'frontend', 'backend', 'algorithm', 'data structure'
    ];

    const messageWords = message.toLowerCase().split(' ');
    const devScore = messageWords.filter(word => 
      developmentKeywords.some(keyword => word.includes(keyword) || keyword.includes(word))
    ).length;

    if (devScore < 1) {
      return null; // Not a development request
    }    // Determine request type
    let requestType: CodeContext['requestType'] = 'explain';
    if (message.toLowerCase().includes('review')) requestType = 'review';
    if (message.toLowerCase().includes('debug') || message.toLowerCase().includes('error')) requestType = 'debug';
    if (message.toLowerCase().includes('implement') || message.toLowerCase().includes('create')) requestType = 'implement';
    if (message.toLowerCase().includes('optimize') || message.toLowerCase().includes('improve')) requestType = 'optimize';
    if (message.toLowerCase().includes('test') || message.toLowerCase().includes('testing')) requestType = 'test';
    if (message.toLowerCase().includes('refactor') || message.toLowerCase().includes('restructure')) requestType = 'refactor';

    // Detect language
    const supportedLanguages = (this.config as DevAgentConfig).supportedLanguages;
    let language = 'javascript'; // default
    for (const lang of supportedLanguages) {
      if (message.toLowerCase().includes(lang)) {
        language = lang;
        break;
      }
    }

    const codeContext: CodeContext = {
      language,
      requestType,
      problemDescription: message
    };

    // Store context analysis in memory
    await this.storeDevMemory(
      `Code context analysis: ${JSON.stringify(codeContext)}`,
      'context_analysis',
      {
        originalMessage: message,
        devScore,
        detectedLanguage: language,
        requestType,
        timestamp: new Date().toISOString()
      }
    );

    return codeContext;
  }

  /**
   * Generate development-specific response
   */  private async generateDevelopmentResponse(
    context: AgentContext,
    codeContext: CodeContext,
    memoryContext: any,
    relevantPatterns: any[],
    analysisResult?: CodeAnalysisResult | null,
    learnedPatterns?: LearnedPattern[]
  ): Promise<AgentResponse> {
    console.log('[DevAgent] Generating development response');
    
    try {
      const userMessage = context.conversationHistory[context.conversationHistory.length - 1]?.content;
      
      // Get relevant memory context
      const relevantMemories = await realUnifiedMemoryClient.getMemoryContext(
        `${codeContext.language} ${codeContext.requestType} ${userMessage}`,
        context.user.id,
        5
      );      // Build development-specific system prompt with analysis result and learned patterns
      const systemPrompt = this.buildDevelopmentSystemPrompt(
        codeContext, 
        memoryContext, 
        relevantMemories, 
        relevantPatterns,
        analysisResult,
        learnedPatterns || []
      );

      // Generate AI response if available
      let aiResponse = '';
      if (this.aiClient) {
        const chatResponse = await this.aiClient.chat(userMessage, { 
          systemPrompt: systemPrompt 
        });
        aiResponse = chatResponse.response;
      }

      const responseContent = aiResponse || this.getDevelopmentFallbackResponse(codeContext);

      return {
        content: responseContent,
        memories: relevantMemories.memories,
        metadata: {
          codeContext,
          memoryContext: relevantMemories.searchQuality,
          relevantPatterns: relevantPatterns.length,
          constitutionalValid: true,
          timestamp: new Date().toISOString(),
          responseType: 'development',
          context7Applied: (this.config as DevAgentConfig).context7Integration
        }
      };
    } catch (error) {
      console.error('[DevAgent] Development response generation failed:', error);
      return {
        content: `I understand you need help with ${codeContext.language} development. Let me provide some guidance based on my current knowledge.`,
        metadata: {
          error: error instanceof Error ? error.message : 'Response generation error',
          fallback: true,
          codeContext
        }
      };
    }
  }

  /**
   * Build development-specific system prompt
   */  private buildDevelopmentSystemPrompt(
    codeContext: CodeContext,
    memoryContext: any,
    relevantMemories: any,
    relevantPatterns: any[],
    analysisResult?: CodeAnalysisResult | null,
    learnedPatterns?: LearnedPattern[]
  ): string {
    let prompt = `You are DevAgent, a specialized development assistant in the OneAgent system.

Development Context:
- Language: ${codeContext.language}
- Request Type: ${codeContext.requestType}
- Problem: ${codeContext.problemDescription}

Memory Context:
- Relevant code patterns: ${relevantPatterns.length}
- Memory quality: ${relevantMemories.searchQuality || 0}
- Previous similar solutions: ${relevantMemories.memories?.length || 0}

Agent Network:
- Available peer agents: ${memoryContext.peerAgents?.length || 0}
- Recent agent communications: ${memoryContext.recentMessages?.length || 0}

Your expertise: Software development, code review, debugging, architecture design, best practices.
Apply Constitutional AI principles: Accuracy, Transparency, Helpfulness, Safety.

Enhanced Development-Specific Constitutional Principles:
1. Development Accuracy (CRITICAL): Provide precise, tested development guidance based on established patterns
   - Include specific code examples or references to documentation
   - Validate recommendations against known best practices
   
2. Security-First Development (CRITICAL): Always consider security implications and best practices  
   - Mention security considerations for sensitive operations (auth, user input, data handling)
   - Highlight potential vulnerabilities and mitigation strategies
   
3. Comprehensive Technical Analysis (HIGH): Consider dependencies, edge cases, and system implications
   - Address potential complications and alternative approaches
   - Consider impact on existing codebase and architecture
   
4. Long-term Maintainability (HIGH): Prioritize solutions that will remain maintainable and extensible
   - Consider future maintenance and scaling requirements  
   - Recommend patterns that enhance code readability and extensibility`;

    if (analysisResult) {
      prompt += `

Advanced Code Analysis Results:
- Quality Score: ${analysisResult.qualityScore}%
- Constitutional Compliance: ${analysisResult.constitutionalCompliance}
- Context7 Documentation Used: ${analysisResult.metadata.context7Used}
- Memory Enhanced: ${analysisResult.metadata.memoryEnhanced}
- Analysis: ${analysisResult.analysis}
- Suggestions: ${analysisResult.suggestions.length} recommendations
- Patterns Found: ${analysisResult.patterns.length}
- Memory Insights: ${analysisResult.memoryInsights.length}

Use this analysis to provide more targeted and informed assistance.`;
    }

    if (learnedPatterns && learnedPatterns.length > 0) {
      prompt += `

Learned Patterns & Solutions:
${learnedPatterns.map(pattern => `
- ${pattern.name} (${pattern.category}, confidence: ${(pattern.confidence * 100).toFixed(0)}%)
  Problem: ${pattern.problem}
  Solution: ${pattern.solution}
  Success Rate: ${(pattern.successRate * 100).toFixed(0)}%
`).join('')}

Apply these learned patterns where relevant to provide better assistance.`;
    }

    return prompt + `

Focus on:
1. Providing accurate, working code solutions
2. Explaining the reasoning behind recommendations
3. Suggesting best practices and potential improvements
4. Being transparent about limitations and assumptions
5. Ensuring code safety and security considerations

For code review: Be constructive and educational.
For debugging: Provide systematic troubleshooting steps.
For implementation: Offer clean, maintainable solutions.
For optimization: Balance performance with readability.`;
  }

  /**
   * Get relevant code patterns from memory
   */
  private async getRelevantCodePatterns(codeContext: CodeContext): Promise<any[]> {
    try {
      const searchQuery = `${codeContext.language} ${codeContext.requestType} code pattern solution`;
      const memoryResult = await realUnifiedMemoryClient.getMemoryContext(
        searchQuery,
        this.config.id,
        10
      );

      return memoryResult.memories || [];
    } catch (error) {
      console.error('[DevAgent] Failed to get relevant code patterns:', error);
      return [];
    }
  }

  /**
   * Load existing code patterns from memory on initialization
   */
  private async loadCodePatternsFromMemory(): Promise<void> {
    try {
      console.log('[DevAgent] Loading code patterns from memory');
      
      const patternsResult = await realUnifiedMemoryClient.getMemoryContext(
        'code patterns solutions best practices',
        this.config.id,
        50
      );

      for (const pattern of patternsResult.memories || []) {
        const metadata = pattern.metadata || {};
        if (metadata.language && metadata.pattern) {
          this.codePatterns.set(
            `${metadata.language}_${metadata.pattern}`,
            pattern
          );
        }
      }

      console.log(`[DevAgent] Loaded ${this.codePatterns.size} code patterns from memory`);
    } catch (error) {
      console.error('[DevAgent] Failed to load code patterns from memory:', error);
    }
  }

  /**
   * Learn from interaction and store patterns
   */
  private async learnFromInteraction(
    codeContext: CodeContext,
    response: AgentResponse
  ): Promise<void> {
    try {
      // Extract learnings from successful interactions
      if (response.metadata && !response.metadata.error) {
        const learningKey = `${codeContext.language}_${codeContext.requestType}`;
        
        // Store the interaction as a learning pattern
        await this.storeDevMemory(
          `Learning pattern: ${learningKey} - ${response.content.substring(0, 200)}...`,
          'learning_pattern',
          {
            codeContext,
            responseQuality: response.metadata.memoryContext || 0,
            interactionType: 'successful',
            timestamp: new Date().toISOString(),
            pattern: learningKey
          }
        );

        console.log(`[DevAgent] Learned new pattern: ${learningKey}`);
      }
    } catch (error) {
      console.error('[DevAgent] Failed to learn from interaction:', error);
    }
  }

  /**
   * Delegate non-development requests to CoreAgent
   */
  private async delegateToCore(context: AgentContext): Promise<void> {
    try {
      const userMessage = context.conversationHistory[context.conversationHistory.length - 1]?.content;
      
      const delegationMessage: AgentMessage = {
        id: uuidv4(),
        fromAgent: this.config.id,
        toAgent: 'core-agent',
        messageType: 'coordination',
        content: `Delegation from DevAgent: User request outside development scope - ${userMessage}`,
        priority: 'medium',
        timestamp: new Date(),
        metadata: {
          requiresResponse: false,
          context: {
            originalRequest: userMessage,
            delegationReason: 'outside_dev_scope',
            sessionId: context.sessionId,
            userId: context.user.id
          }
        }
      };

      await memoryDrivenComm.sendMessage(delegationMessage);
      console.log('[DevAgent] Delegated request to CoreAgent');
    } catch (error) {
      console.error('[DevAgent] Failed to delegate to CoreAgent:', error);
    }
  }

  /**
   * Get fallback response for development requests
   */  private getDevelopmentFallbackResponse(codeContext: CodeContext): string {
    const responses = {
      review: `I'd be happy to review your ${codeContext.language} code. Please share the code you'd like me to examine, and I'll provide feedback on best practices, potential issues, and improvements.`,
      debug: `Let's debug your ${codeContext.language} issue together. Please share the error message, relevant code, and describe what you expected vs. what's happening.`,
      implement: `I can help you implement a solution in ${codeContext.language}. Could you provide more details about the requirements and any specific constraints or preferences?`,
      explain: `I'd be glad to explain ${codeContext.language} concepts. What specific aspect would you like me to clarify?`,
      optimize: `I can help optimize your ${codeContext.language} code. Please share the code you'd like to improve, and I'll suggest performance and maintainability enhancements.`,
      test: `I can help you write tests for your ${codeContext.language} code. Please share the code you want to test, and I'll suggest appropriate testing strategies.`,
      refactor: `I can help refactor your ${codeContext.language} code to improve its structure and maintainability. Please share the code you'd like to refactor.`
    };
    
    return responses[codeContext.requestType] || responses.explain;
  }

  /**
   * Store development-specific information in memory system
   */
  private async storeDevMemory(
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
          memoryType,
          agentDomain: 'development'
        }
      );
    } catch (error) {
      console.error('[DevAgent] Failed to store development memory:', error);
    }
  }

  /**
   * Handle incoming messages from other agents
   */
  async handleAgentMessage(message: AgentMessage): Promise<void> {
    console.log(`[DevAgent] Received message from ${message.fromAgent}:`, message.content);
    
    try {
      // Store incoming agent message
      await this.storeDevMemory(
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
          await this.handleDevelopmentCoordination(message);
          break;
        case 'context':
          await this.handleDevelopmentContext(message);
          break;
        case 'learning':
          await this.handleDevelopmentLearning(message);
          break;
        default:
          console.log(`[DevAgent] Unhandled message type: ${message.messageType}`);
      }
    } catch (error) {
      console.error('[DevAgent] Error handling agent message:', error);
    }
  }

  /**
   * Handle development coordination messages
   */
  private async handleDevelopmentCoordination(message: AgentMessage): Promise<void> {
    console.log('[DevAgent] Handling development coordination message');
    
    // Analyze if this is a development-related coordination request
    const codeContext = await this.analyzeCodeContext(message.content);
    
    if (codeContext && message.metadata.requiresResponse) {
      const responseMessage: AgentMessage = {
        id: uuidv4(),
        fromAgent: this.config.id,
        toAgent: message.fromAgent,
        messageType: 'coordination',
        content: `Development coordination acknowledged: I can assist with ${codeContext.language} ${codeContext.requestType}`,
        priority: message.priority,
        timestamp: new Date(),
        replyToMessageId: message.id,
        metadata: {
          context: {
            coordinationStatus: 'acknowledged',
            canHandle: true,
            codeContext
          }
        }
      };

      await memoryDrivenComm.sendMessage(responseMessage);
    }
  }

  /**
   * Handle development context sharing
   */
  private async handleDevelopmentContext(_message: AgentMessage): Promise<void> {
    console.log('[DevAgent] Handling development context message');
    // Context messages are automatically stored in memory
  }

  /**
   * Handle development learning messages
   */
  private async handleDevelopmentLearning(message: AgentMessage): Promise<void> {
    console.log('[DevAgent] Handling development learning message');
    
    // Store development-specific learning insights
    await this.storeDevMemory(
      `Development learning from ${message.fromAgent}: ${message.content}`,
      'inter_agent_learning',
      {
        sourceAgent: message.fromAgent,
        learningType: 'development_inter_agent',
        timestamp: message.timestamp.toISOString()
      }
    );
  }

  /**
   * Get agent status
   */
  getStatus(): {
    agentId: string;
    isRegistered: boolean;
    loadedPatterns: number;
    knownSolutions: number;
    capabilities: string[];
    supportedLanguages: string[];
    lastActivity: Date;
  } {
    return {
      agentId: this.config.id,
      isRegistered: this.isRegistered,
      loadedPatterns: this.codePatterns.size,
      knownSolutions: this.knownSolutions.size,
      capabilities: this.config.capabilities,
      supportedLanguages: (this.config as DevAgentConfig).supportedLanguages,
      lastActivity: new Date()
    };  }

  /**
   * Get learning metrics from the adaptive learning engine
   */  async getLearningMetrics() {
    return await this.learningEngine.getLearningMetrics();
  }

  /**
   * Clean up old or low-quality patterns
   */
  async cleanupLearningPatterns(): Promise<{ removed: number; updated: number }> {
    return await this.learningEngine.cleanupPatterns();
  }

  /**
   * Map request type to learning pattern category
   */
  private mapRequestTypeToCategory(requestType: CodeContext['requestType']): LearnedPattern['category'] | undefined {
    const mapping: Record<string, LearnedPattern['category']> = {
      'debug': 'debugging',
      'review': 'best-practice',
      'optimize': 'best-practice',
      'implement': 'solution',
      'explain': 'solution',
      'test': 'best-practice',
      'refactor': 'best-practice'
    };
    return mapping[requestType];
  }

  /**
   * Apply development-specific Constitutional AI validation
   */
  private async validateDevelopmentResponse(
    response: string,
    codeContext: CodeContext,
    userMessage: string
  ): Promise<{ validated: boolean; principles: string[]; score: number }> {
    const violations: string[] = [];
    let score = 100;

    for (const principle of DEVELOPMENT_CONSTITUTIONAL_PRINCIPLES) {
      let isValid = true;
      
      switch (principle.id) {
        case 'development_accuracy':
          // Check if response includes code examples or documentation references
          if (codeContext.requestType === 'implement' || codeContext.requestType === 'review') {
            const hasCodeExample = /```[\s\S]*```/.test(response) || /`[^`]+`/.test(response);
            const hasDocReference = /documentation|docs|reference|specification/i.test(response);
            isValid = hasCodeExample || hasDocReference;
          }
          break;
        
        case 'security_first':
          // Check security considerations for sensitive operations
          const sensitiveKeywords = ['auth', 'password', 'token', 'api', 'database', 'user', 'input', 'validation'];
          const hasSensitiveContent = sensitiveKeywords.some(keyword => 
            userMessage.toLowerCase().includes(keyword) || codeContext.codeSnippet?.toLowerCase().includes(keyword)
          );
          if (hasSensitiveContent) {
            isValid = /security|secure|vulnerabilit|sanitiz|validat|escap/i.test(response);
          }
          break;
        
        case 'comprehensive_analysis':
          // Check for consideration of dependencies, edge cases, complications
          const analysisKeywords = ['consider', 'however', 'note', 'also', 'potential', 'edge', 'alternative', 'dependency'];
          isValid = analysisKeywords.some(keyword => response.toLowerCase().includes(keyword));
          break;
        
        case 'maintainability':
          // Check for long-term considerations
          const maintainabilityKeywords = ['maintain', 'extend', 'scalab', 'readable', 'documentation', 'future', 'update'];
          if (codeContext.requestType === 'implement' || codeContext.requestType === 'refactor') {
            isValid = maintainabilityKeywords.some(keyword => response.toLowerCase().includes(keyword));
          }
          break;
      }

      if (!isValid) {
        violations.push(principle.id);
        const penalty = principle.severityLevel === 'critical' ? 25 : 
                       principle.severityLevel === 'high' ? 15 : 10;
        score -= penalty;
      }
    }

    return {
      validated: violations.length === 0,
      principles: violations,
      score: Math.max(0, score)
    };
  }  /**
   * Determine task complexity based on content analysis (override BaseAgent method)
   */
  protected determineTaskComplexity(message: string): 'simple' | 'medium' | 'complex' {
    let complexityScore = 0;

    // Content complexity indicators
    const complexKeywords = [
      // Architecture/Design (3 points each)
      'architecture', 'design', 'pattern', 'microservice', 'distributed', 'scalability',
      // Advanced concepts (2 points each)
      'async', 'concurrent', 'parallel', 'optimization', 'performance', 'algorithm',
      // Integration complexity (2 points each)
      'integration', 'api', 'database', 'deployment', 'infrastructure', 'docker',
      // Security/Enterprise (2 points each)
      'security', 'authentication', 'authorization', 'compliance', 'enterprise'
    ];

    const mediumKeywords = [
      // Standard development (1 point each)
      'class', 'interface', 'function', 'method', 'component', 'module',
      'testing', 'debugging', 'refactor', 'implement', 'framework'
    ];

    // Score based on keywords
    for (const keyword of complexKeywords) {
      if (message.toLowerCase().includes(keyword)) {
        complexityScore += keyword.length > 10 ? 3 : 2;
      }
    }

    for (const keyword of mediumKeywords) {
      if (message.toLowerCase().includes(keyword)) {
        complexityScore += 1;
      }
    }

    // Message length complexity
    if (message.length > 500) complexityScore += 2;
    else if (message.length > 200) complexityScore += 1;

    // Code context detection from message content
    const hasCodeSnippet = message.includes('```') || message.includes('function') || message.includes('class');
    if (hasCodeSnippet) {
      complexityScore += 1;
    }

    // Determine final complexity (expert maps to complex for BaseAgent compatibility)
    if (complexityScore >= 8) return 'complex'; // Expert level mapped to complex
    if (complexityScore >= 5) return 'complex';
    if (complexityScore >= 2) return 'medium';
    return 'simple';
  }

  /**
   * Enhanced complexity determination with development context
   */
  private determineTaskComplexityEnhanced(message: string, codeContext?: CodeContext): 'simple' | 'medium' | 'complex' | 'expert' {
    const baseComplexity = this.determineTaskComplexity(message);
    let complexityScore = baseComplexity === 'complex' ? 6 : baseComplexity === 'medium' ? 3 : 1;

    // Code context complexity
    if (codeContext?.codeSnippet) {
      const codeLines = codeContext.codeSnippet.split('\n').length;
      if (codeLines > 50) complexityScore += 3;
      else if (codeLines > 20) complexityScore += 2;
      else if (codeLines > 5) complexityScore += 1;
    }

    // Request type complexity
    const complexRequestTypes = ['implement', 'optimize', 'refactor'];
    if (codeContext && complexRequestTypes.includes(codeContext.requestType)) {
      complexityScore += 2;
    }

    // Enhanced determination with expert level
    if (complexityScore >= 10) return 'expert';
    if (complexityScore >= 6) return 'complex';
    if (complexityScore >= 3) return 'medium';
    return 'simple';
  }
}

// Export singleton instance
export const devAgent = new DevAgent();
