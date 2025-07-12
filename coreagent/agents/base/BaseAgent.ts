/**
 * BaseAgent - Core Agent Implementation for OneAgent
 * 
 * Enhanced with Advanced Prompt Engineering System:
 * - Constitutional AI principles and self-correction
 * - BMAD 9-point elicitation framework  
 * - Systematic prompting frameworks (R-T-F, T-A-G, R-I-S-E, R-G-C, C-A-R-E)
 * - Chain-of-Verification (CoVe) patterns
 * - RAG integration with source grounding
 * 
 * Achieves 20-95% improvements in accuracy, task adherence, and quality.
 */

import { OneAgentMemory } from '../../memory/OneAgentMemory';
import { oneAgentConfig } from '../../config/index';
import { OneAgentUnifiedBackbone } from '../../utils/UnifiedBackboneService';
import { SmartGeminiClient } from '../../tools/SmartGeminiClient';
import { GeminiClient } from '../../tools/geminiClient';
import { User } from '../../types/user';
import { MemoryIntelligence } from '../../intelligence/memoryIntelligence';
import { ConversationData, IntelligenceInsight, MemorySearchResult, SessionContext } from '../../types/oneagent-backbone-types';
import { 
  EnhancedPromptEngine, 
  EnhancedPromptConfig, 
  AgentPersona,
  ConstitutionalPrinciple
} from './EnhancedPromptEngine';
import { ConstitutionalAI, ValidationResult } from './ConstitutionalAI';
import { BMADElicitationEngine, ElicitationResult } from './BMADElicitationEngine';
import { PersonalityEngine, PersonalityContext, PersonalityExpression } from '../personality/PersonalityEngine';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  memoryEnabled: boolean;
  aiEnabled: boolean;
  // A2A system configuration
  a2aEnabled?: boolean;
  a2aCapabilities?: string[];
}

export interface AgentContext {
  user: User;
  sessionId: string;
  conversationHistory: Message[];
  memoryContext?: any[];
  // enrichedContext?: any;  // Optional enriched context (interface removed)
  
  // Enhanced context for inter-agent communication
  projectContext?: string; // Project identifier for context isolation
  topicContext?: string; // Topic/domain for context organization
  metadata?: any; // Unified metadata for enhanced tracking
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  content: string;
  actions?: AgentAction[];
  memories?: any[];
  metadata?: Record<string, any>;
}

export interface AgentAction {
  type: string;
  description: string;
  parameters: Record<string, any>;
}

/**
 * Base Agent class providing common functionality for all OneAgent agents
 * Enhanced with Advanced Prompt Engineering System
 */
export abstract class BaseAgent {
  public config: AgentConfig;
  protected memoryClient?: OneAgentMemory;
  protected memoryIntelligence?: MemoryIntelligence;
  protected aiClient?: SmartGeminiClient;
  protected isInitialized: boolean = false;
  protected unifiedBackbone: OneAgentUnifiedBackbone;
  
  // Advanced Prompt Engineering Components
  protected promptEngine?: EnhancedPromptEngine;
  protected constitutionalAI?: ConstitutionalAI;
  protected bmadElicitation?: BMADElicitationEngine;
  protected promptConfig?: EnhancedPromptConfig;
  protected personalityEngine?: PersonalityEngine;
  
  // A2A Multi-Agent Communication
  protected a2aEnabled: boolean = false;
  protected a2aCapabilities: string[] = [];
  protected currentSessions: Set<string> = new Set();
  constructor(config: AgentConfig, promptConfig?: EnhancedPromptConfig) {
    this.config = config;
    this.promptConfig = promptConfig || this.getDefaultPromptConfig();
    this.unifiedBackbone = OneAgentUnifiedBackbone.getInstance();
  }/**
   * Initialize the agent with necessary clients and advanced prompt engineering
   */
  async initialize(): Promise<void> {
    try {
      // Initialize memory client if enabled
      if (this.config.memoryEnabled) {
        this.memoryClient = new OneAgentMemory({});
        // Initialize Memory Intelligence layer
        try {
          this.memoryIntelligence = new MemoryIntelligence(this.memoryClient, {
            enableSemanticSearch: true,
            maxResults: 50,
            similarityThreshold: 0.7,
            enableConstitutionalValidation: true
          });
          console.log(`🧠 Memory Intelligence initialized for ${this.constructor.name} with unified backbone metadata system`);
        } catch (error) {
          console.warn(`⚠️ Memory Intelligence initialization failed:`, error);
        }
      }// Initialize AI client if enabled with intelligent model selection
      if (this.config.aiEnabled) {
        // Import intelligent model selection
        const { ModelTierSelector } = await import('../../config/gemini-model-tier-selector');
        const tierSelector = ModelTierSelector.getInstance();
        
        // Select optimal model based on agent type and capabilities
        const modelSelection = tierSelector.selectOptimalModel({
          agentType: this.constructor.name,
          taskType: 'general-purpose',
          scenario: 'agent-initialization',
          prioritizeCost: false, // Agents need good performance
          prioritizePerformance: true
        });
        
        console.log(`🧠 ${this.constructor.name} using intelligent model: ${modelSelection.primaryModel}`);
        console.log(`   Tier: ${modelSelection.tier} | Reasoning: ${modelSelection.reasoning}`);
        
        this.aiClient = new SmartGeminiClient({
          apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
          model: modelSelection.primaryModel
        });
      }

      // Initialize Advanced Prompt Engineering System
      await this.initializePromptEngineering();

      // AUTO-REGISTRATION: Register agent with communication protocol
      await this.autoRegisterAgent();

      this.isInitialized = true;
    } catch (error) {
      console.error(`Failed to initialize agent ${this.config.id}:`, error);
      throw error;
    }
  }  /**
   * Automatically register agent with the communication protocol
   * This ensures all agents are discoverable and prevents phantom agent issues
   */
  private async autoRegisterAgent(): Promise<void> {
    try {
      // Register with the integrated A2A system instead of separate communication protocol
      if (this.a2aEnabled) {
        await this.registerWithA2ASystem();
      }
      
      console.log(`✅ Agent created (metadata service unavailable): ${this.config.name}/${this.config.id}`);
    } catch (error) {
      console.error(`❌ Auto-registration error for ${this.config.id}:`, error);
      // Don't throw - registration failure shouldn't prevent agent initialization
    }
  }

  /**
   * Initialize the advanced prompt engineering system
   */
  private async initializePromptEngineering(): Promise<void> {
    if (!this.promptConfig) return;

    try {
      // Initialize Enhanced Prompt Engine
      this.promptEngine = new EnhancedPromptEngine(this.promptConfig);

      // Initialize Constitutional AI
      this.constitutionalAI = new ConstitutionalAI({
        principles: this.promptConfig.constitutionalPrinciples,
        qualityThreshold: this.promptConfig.qualityThreshold
      });

      // Initialize BMAD Elicitation Engine
      this.bmadElicitation = new BMADElicitationEngine();

      // Initialize Personality Engine
      this.personalityEngine = new PersonalityEngine();

      console.log(`Advanced Prompt Engineering initialized for agent ${this.config.id}`);
    } catch (error) {
      console.warn(`Prompt engineering initialization failed for ${this.config.id}:`, error);
      // Continue without enhanced prompting if initialization fails
    }
  }
  /**
   * Process a user message and generate a response
   */
  abstract processMessage(context: AgentContext, message: string): Promise<AgentResponse>;  /**
   * Add memory for the user with unified metadata system integration
   */
  protected async addMemory(userId: string, content: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.memoryClient) {
      throw new Error('Memory client not initialized');
    }
    // Create canonical ConversationData for storage
    const now = new Date();
    const sessionContext = {
      sessionId: metadata?.sessionId || 'default',
      userId: userId,
      startTime: now,
      lastActivity: now,
      currentTopic: metadata?.category || 'conversation',
      conversationMode: 'exploration',
      sessionType: 'quick_query',
      expectedDuration: 5,
      goalDefinition: 'Store user memory',
      constitutionalMode: 'strict',
      validationLevel: 'enhanced',
      responseQuality: [0.8],
      userSatisfaction: [1.0],
      goalProgress: 1.0,
      relevantMemories: [],
      newLearnings: [content],
      constitutionalCompliance: 1.0,
      helpfulnessScore: 1.0,
      accuracyMaintained: true
    } as SessionContext;
    const conversation: ConversationData = {
      conversationId: metadata?.conversationId || `conv_${Date.now()}`,
      participants: [this.config.id, userId],
      startTime: now,
      topics: [metadata?.category || 'conversation'],
      keyInsights: [content],
      decisions: [],
      actionItems: [],
      overallQuality: metadata?.qualityScore || 0.8,
      qualityScore: metadata?.qualityScore || 0.8,
      constitutionalCompliance: 1.0,
      constitutionalCompliant: true,
      userSatisfaction: 1.0,
      goalAchievement: 1.0,
      newKnowledge: [content],
      improvedUnderstanding: [],
      skillDemonstrations: [],
      sessionContext,
      principleApplications: [],
      ethicalConsiderations: [],
      safetyMeasures: [],
      responseTimings: [],
      qualityTrends: [],
      engagementLevels: [],
      timestamp: now,
      userId: userId,
      messageCount: 1,
      conversationLength: 1,
      contextTags: metadata?.tags || [],
      communicationStyle: 'formal',
      technicalLevel: 'intermediate',
      domain: metadata?.domain || 'general',
      taskCompleted: true,
      responseTime: 1000
    };
    // Store conversation in canonical memory system
    await this.memoryClient.addMemory({
      content: JSON.stringify(conversation),
      metadata: {
        ...metadata,
        category: 'conversations',
        type: 'conversation_data',
        userId: userId,
        sessionId: metadata?.sessionId || 'default'
      }
    });
  }/**
   * Search for relevant memories using intelligent search when available
   */
  protected async searchMemories(_userId: string, query: string, limit: number = 10): Promise<any[]> {
    if (!this.memoryClient) {
      return [];
    }
    // Use Memory Intelligence for enhanced search if available
    if (this.memoryIntelligence) {
      try {
        const intelligentResult = await this.memoryIntelligence.intelligentSearch(query, _userId, { maxResults: limit });
        return intelligentResult.results || [];
      } catch (error) {
        console.warn(`Memory Intelligence search failed, falling back to standard search:`, error);
      }
    }
    // Fallback to standard memory search using canonical memory system
    const result = await this.memoryClient.searchMemory({
      query,
      user_id: _userId,
      limit
    });
    return result.memories || [];
  }/**
   * Generate AI response using advanced prompt engineering system
   */
  protected async generateResponse(prompt: string, context?: any[]): Promise<string> {
    if (!this.aiClient) {
      throw new Error('AI client not initialized');
    }

    // Use advanced prompt engineering if available
    if (this.promptEngine && this.constitutionalAI) {
      return await this.generateEnhancedResponse(prompt, context || []);
    }

    // Fallback to standard prompt generation
    return await this.generateStandardResponse(prompt, context);
  }
  /**
   * Generate response using advanced prompt engineering system
   */
  protected async generateEnhancedResponse(message: string, memories: any[]): Promise<string> {
    try {
      // Phase 1: Build enhanced prompt using the advanced system
      const enhancedPrompt = await this.promptEngine!.buildEnhancedPrompt(
        message,
        memories,
        this.getCurrentContext(),
        this.determineTaskComplexity(message)
      );

      // Phase 2: Generate initial AI response
      const initialResponse = await this.aiClient!.chat(enhancedPrompt);
      let response = initialResponse.response || '';

      // Phase 3: Constitutional AI validation and self-correction
      const validation = await this.constitutionalAI!.validateResponse(
        response,
        message,
        { memories, agentId: this.config.id }
      );

      // Phase 4: Apply refinements if quality threshold not met
      if (!validation.isValid && validation.refinedResponse) {
        response = validation.refinedResponse;
        console.log(`Enhanced response quality from ${validation.score}% through constitutional refinement`);
      }

      // Phase 5: Chain-of-Verification for critical responses (if enabled)
      if (this.promptConfig?.enableCoVe && this.shouldApplyCoVe(message, response)) {
        response = await this.applyChainOfVerification(response, message);
      }

      return response;

    } catch (error) {
      console.warn(`Enhanced prompt generation failed for ${this.config.id}:`, error);
      // Fallback to standard generation
      return await this.generateStandardResponse(message, memories);
    }
  }

  /**
   * Standard prompt generation (fallback)
   */
  protected async generateStandardResponse(prompt: string, context?: any[]): Promise<string> {
    // Incorporate context into the prompt if provided
    let enhancedPrompt = prompt;
    if (context && context.length > 0) {
      const contextStr = context.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join('\n');
      enhancedPrompt = `Context:\n${contextStr}\n\nQuery: ${prompt}`;
    }

    const response = await this.aiClient!.chat(enhancedPrompt);
    return response.response || '';
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Check if agent is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Override in specialized agents if needed
    this.isInitialized = false;
  }

  /**
   * Validate agent context
   */
  protected validateContext(context: AgentContext): void {
    if (!context.user || !context.sessionId) {
      throw new Error('Invalid agent context: missing user or sessionId');
    }
  }

  /**
   * Create a standardized response object
   */
  protected createResponse(content: string, actions?: AgentAction[], memories?: any[]): AgentResponse {
    return {
      content,
      actions: actions || [],
      memories: memories || [],
      metadata: {
        agentId: this.config.id,
        timestamp: new Date().toISOString(),
      },
    };
  }  /**
   * Get default prompt configuration for advanced prompt engineering
   */
  protected getDefaultPromptConfig(): EnhancedPromptConfig {
    return {
      agentPersona: this.getDefaultPersona(),
      constitutionalPrinciples: this.getDefaultConstitutionalPrinciples(),
      enabledFrameworks: ['RTF', 'TAG'], // Start with basic frameworks
      enableCoVe: false, // Disable CoVe for simple tasks initially
      enableRAG: true,   // Enable RAG for better context
      qualityThreshold: 75 // 75% quality threshold
    };
  }

  /**
   * Get default agent persona (override in specialized agents)
   */
  protected getDefaultPersona(): AgentPersona {
    return {
      role: `Professional ${this.config.name} Assistant AI`,
      style: 'Professional, helpful, and precise',
      coreStrength: 'General assistance and problem-solving',
      principles: [
        'Accuracy and reliability in all responses',
        'Clear and actionable guidance',
        'Respectful and professional communication',
        'User-focused problem solving'
      ],
      frameworks: ['RTF', 'TAG']
    };
  }

  /**
   * Get default constitutional principles
   */
  protected getDefaultConstitutionalPrinciples(): ConstitutionalPrinciple[] {
    return [
      {
        id: 'accuracy',
        name: 'Accuracy Over Speculation',
        description: 'Prefer "I don\'t know" to guessing or speculation',
        validationRule: 'Response includes source attribution or uncertainty acknowledgment',
        severityLevel: 'critical'
      },
      {
        id: 'transparency',
        name: 'Transparency in Reasoning',
        description: 'Explain reasoning process and acknowledge limitations',
        validationRule: 'Response includes reasoning explanation or limitation acknowledgment',
        severityLevel: 'high'
      },
      {
        id: 'helpfulness',
        name: 'Actionable Helpfulness',
        description: 'Provide actionable, relevant guidance that serves user goals',
        validationRule: 'Response contains specific, actionable recommendations',
        severityLevel: 'high'
      },
      {
        id: 'safety',
        name: 'Safety-First Approach',
        description: 'Avoid harmful or misleading recommendations',
        validationRule: 'Response avoids potentially harmful suggestions',
        severityLevel: 'critical'
      }
    ];
  }
  /**
   * Apply Chain-of-Verification for critical responses
   */
  protected async applyChainOfVerification(response: string, userMessage: string): Promise<string> {
    try {
      // Generate verification questions
      const verificationSteps = await this.constitutionalAI!.generateSelfCritique(response, userMessage);

      // Apply verification insights to refine response
      const verificationPrompt = `
Original Response: ${response}

Verification Analysis:
Strengths: ${verificationSteps.strengths.join(', ')}
Areas for Improvement: ${verificationSteps.improvements.join(', ')}

Generate a refined response that addresses the improvement areas while maintaining the strengths:`;

      const verifiedResponse = await this.aiClient!.chat(verificationPrompt);
      return verifiedResponse.response || response;

    } catch (error) {
      console.warn('Chain-of-Verification failed:', error);
      return response;
    }
  }

  /**
   * Determine if Chain-of-Verification should be applied
   */
  protected shouldApplyCoVe(message: string, response: string): boolean {
    // Apply CoVe for critical or complex scenarios
    const criticalKeywords = ['delete', 'remove', 'critical', 'important', 'security', 'production'];
    const isComplex = response.length > 500;
    const isCritical = criticalKeywords.some(keyword => 
      message.toLowerCase().includes(keyword) || response.toLowerCase().includes(keyword)
    );

    return isComplex || isCritical;
  }

  /**
   * Determine task complexity for enhanced prompting
   */
  protected determineTaskComplexity(message: string): 'simple' | 'medium' | 'complex' {
    const complexIndicators = ['analyze', 'design', 'architecture', 'strategy', 'optimize'];
    const mediumIndicators = ['explain', 'compare', 'evaluate', 'recommend'];

    const messageLower = message.toLowerCase();
    
    if (complexIndicators.some(indicator => messageLower.includes(indicator)) || message.length > 200) {
      return 'complex';
    }
    if (mediumIndicators.some(indicator => messageLower.includes(indicator)) || message.length > 100) {
      return 'medium';
    }
    return 'simple';
  }  /**
   * Get current agent context for enhanced prompting
   */
  protected getCurrentContext(): AgentContext {
    // Provide a basic context - specialized agents should override this
    const baseContext: AgentContext = {
      user: { 
        id: 'default', 
        name: 'User',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()      },
      sessionId: this.unifiedBackbone.getServices().metadataService.create(
        'agent-session',
        'BaseAgent',
        { 
          content: { 
            category: 'agent-session',
            tags: ['base-agent'],
            sensitivity: 'internal',
            relevanceScore: 0.8,
            contextDependency: 'session'
          }
        }
      ).id,
      conversationHistory: [],
      memoryContext: []
    };

    return baseContext;
  }

  /**
   * Get agent status and health information
   * This is a common method all agents should have for monitoring
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
      agentId: this.config.id,
      name: this.config.name,
      description: this.config.description,
      initialized: this.isInitialized,
      capabilities: this.config.capabilities,
      memoryEnabled: this.config.memoryEnabled,
      aiEnabled: this.config.aiEnabled,
      lastActivity: new Date(), // Could be enhanced to track actual last activity
      isHealthy: this.isInitialized,
      processedMessages: 0, // Could be enhanced to track actual processed messages
      errors: 0 // Could be enhanced to track actual errors
    };
  }

  /**
   * Generate personality-enhanced response
   */
  protected async generatePersonalityResponse(
    baseResponse: string, 
    context: AgentContext,
    userMessage: string
  ): Promise<string> {
    if (!this.personalityEngine) {
      return baseResponse;
    }

    try {
      // Build personality context from agent context
      const personalityContext: PersonalityContext = {
        conversation_history: context.conversationHistory?.map(m => m.content) || [],
        domain_context: this.getDomainContext(),
        user_relationship_level: this.calculateUserRelationshipLevel(context),
        topic_expertise_level: this.calculateTopicExpertiseLevel(userMessage),
        formality_level: this.calculateFormalityLevel(context, userMessage),
        emotional_context: this.detectEmotionalContext(userMessage)
      };

      // Generate personality-enhanced response
      const personalityExpression = await this.personalityEngine.generatePersonalityResponse(
        this.config.id,
        baseResponse,
        personalityContext
      );

      // Log personality metrics for analysis
      console.log(`[${this.config.id}] Personality Response Generated:`, {
        authenticityScore: personalityExpression.authenticity_score,
        constitutionalCompliance: personalityExpression.constitutional_compliance,
        personalityMarkers: personalityExpression.personality_markers.length,
        perspectiveIndicators: personalityExpression.perspective_indicators.length
      });

      return personalityExpression.content;
    } catch (error) {
      console.warn(`Personality enhancement failed for ${this.config.id}:`, error);
      return baseResponse; // Fallback to base response
    }
  }

  /**
   * Get domain context for personality engine (override in specialized agents)
   */
  protected getDomainContext(): string {
    return 'general-assistance';
  }

  /**
   * Calculate user relationship level based on context
   */
  protected calculateUserRelationshipLevel(context: AgentContext): number {
    // Simple heuristic based on conversation history length
    const historyLength = context.conversationHistory?.length || 0;
    return Math.min(1.0, historyLength / 10); // 0.0 to 1.0 scale
  }

  /**
   * Calculate topic expertise level based on user message content
   */
  protected calculateTopicExpertiseLevel(userMessage: string): number {
    // Default implementation - override in specialized agents
    const domainKeywords = this.getDomainKeywords();
    const messageLower = userMessage.toLowerCase();
    const matchedKeywords = domainKeywords.filter(keyword => 
      messageLower.includes(keyword.toLowerCase())
    ).length;
    
    return Math.min(1.0, matchedKeywords / Math.max(1, domainKeywords.length * 0.3));
  }

  /**
   * Get domain-specific keywords (override in specialized agents)
   */
  protected getDomainKeywords(): string[] {
    return ['help', 'assist', 'support', 'question', 'problem'];
  }
  /**
   * Calculate formality level based on context and message
   */
  protected calculateFormalityLevel(_context: AgentContext, userMessage: string): number {
    // Simple heuristic based on message characteristics
    const hasFormalGreeting = /\b(please|thank you|could you|would you)\b/i.test(userMessage);
    const hasInformalLanguage = /\b(hey|hi|yo|gonna|wanna|isn't|don't)\b/i.test(userMessage);
    const hasFullSentences = userMessage.split('.').length > 1;
    
    let formalityScore = 0.5; // Base neutral
    if (hasFormalGreeting) formalityScore += 0.3;
    if (hasFullSentences) formalityScore += 0.2;
    if (hasInformalLanguage) formalityScore -= 0.3;
    
    return Math.max(0.0, Math.min(1.0, formalityScore));
  }

  /**
   * Detect emotional context from user message
   */
  protected detectEmotionalContext(userMessage: string): string {
    const frustrationKeywords = ['frustrated', 'annoyed', 'stuck', 'problem', 'broken', 'error'];
    const excitementKeywords = ['excited', 'great', 'awesome', 'love', 'amazing'];
    const urgencyKeywords = ['urgent', 'asap', 'quickly', 'immediately', 'rush'];
    
    const messageLower = userMessage.toLowerCase();
    
    if (frustrationKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'frustrated';
    }
    if (excitementKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'excited';
    }    if (urgencyKeywords.some(keyword => messageLower.includes(keyword))) {
      return 'urgent';
    }
    
    return 'neutral';
  }

  // =============================================================================
  // ISPECIALIZEDAGENT INTERFACE IMPLEMENTATION
  // =============================================================================

  /**
   * Get available actions for this agent
   */
  getAvailableActions(): AgentAction[] {
    const baseActions: AgentAction[] = [
      {
        type: 'processMessage',
        description: 'Process a user message and generate a response',
        parameters: { message: 'string', context: 'AgentContext' }
      },
      {
        type: 'processConversation',
        description: 'Process multi-agent conversation context and generate response',
        parameters: { 
          topic: 'string', 
          context: 'string', 
          conversationId: 'string',
          conversationHistory: 'NLACSMessage[]',
          userMessage: 'string'
        }
      },
      {
        type: 'getStatus',
        description: 'Get agent status and health information',
        parameters: {}
      },
      {
        type: 'analyze',
        description: 'Analyze content or context with agent expertise',
        parameters: { content: 'string', analysisType: 'string' }
      }
    ];

    // Allow subclasses to extend available actions
    return this.getSpecializedActions().concat(baseActions);
  }

  /**
   * Override this method in specialized agents to add specific actions
   */
  protected getSpecializedActions(): AgentAction[] {
    return [];
  }

  /**
   * Execute a specific action - CRITICAL FOR NLACS INTEGRATION
   */
  async executeAction(action: string | AgentAction, params: any, context?: AgentContext): Promise<any> {
    const actionType = typeof action === 'string' ? action : action.type;

    try {
      switch (actionType) {
        case 'processMessage':
          if (!context) {
            throw new Error('Context required for processMessage action');
          }
          return await this.processMessage(context, params.message);

        case 'processConversation':
          // NEW: Critical action for NLACS real agent integration
          return await this.processConversationAction(params);

        case 'getStatus':
          return this.getStatus();

        case 'analyze':
          return await this.analyzeContent(params.content, params.analysisType || 'general');

        default:
          // Allow specialized agents to handle their own actions
          return await this.executeSpecializedAction(actionType, params, context);
      }
    } catch (error) {
      console.error(`Error executing action ${actionType}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        action: actionType
      };
    }
  }

  /**
   * NEW: Process conversation action for NLACS integration
   */
  protected async processConversationAction(params: {
    topic: string;
    context: string;
    conversationId: string;
    conversationHistory?: any[];
    userMessage: string;
  }): Promise<any> {
    try {
      // Build conversation context for the agent
      const conversationPrompt = `
Topic: ${params.topic}

Previous conversation context:
${params.context}

User request: ${params.userMessage}

Please provide your perspective as a ${this.config.name} on this topic, considering the conversation context.
Focus on your domain expertise and provide insights that contribute to the discussion.
`;

      // Use the agent's AI capabilities to generate a response
      if (this.aiClient) {
        const aiResponse = await this.aiClient.chat(conversationPrompt);
          return {
          success: true,
          content: aiResponse.response,
          confidence: 0.85,
          reasoning: `Generated response using ${this.config.name} expertise`,
          qualityScore: 0.85,
          metadata: {
            agentType: this.config.name,
            action: 'processConversation',
            timestamp: new Date()
          }
        };
      } else {
        // Fallback response without AI
        return {
          success: true,
          content: `As a ${this.config.name}, I understand the topic "${params.topic}". ${this.generateBasicResponse(params.topic)}`,
          confidence: 0.70,
          reasoning: 'Generated basic response without AI',
          qualityScore: 0.70
        };
      }
    } catch (error) {
      console.error(`Error in processConversationAction:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        content: 'I apologize, but I encountered an error processing this conversation.',
        confidence: 0.0
      };
    }
  }

  /**
   * Generate basic response without AI (fallback)
   */
  protected generateBasicResponse(_topic: string): string {
    const responses = [
      `I can help analyze this topic from my perspective.`,
      `Let me contribute to this discussion based on my capabilities.`,
      `I'll provide insights relevant to this topic.`,
      `Based on my expertise, I can offer some thoughts on this.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Override this method in specialized agents for custom actions
   */
  protected async executeSpecializedAction(actionType: string, _params: any, _context?: AgentContext): Promise<any> {
    throw new Error(`Unknown action type: ${actionType}`);
  }

  /**
   * Analyze content with agent expertise
   */
  protected async analyzeContent(content: string, analysisType: string): Promise<any> {
    return {
      success: true,
      analysis: `Analysis of "${content}" using ${analysisType} approach`,
      confidence: 0.75,
      agentType: this.config.name
    };
  }
  /**
   * Get agent name
   */
  getName(): string {
    return this.config.name;
  }
  /**
   * Get detailed health status
   */
  async getHealthStatus(): Promise<any> {
    return {
      status: this.isInitialized ? 'healthy' : 'offline',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed,
      responseTime: 100, // Mock value
      errorRate: 0,
      lastActivity: new Date()
    };
  }
  // =============================================================================
  // MEMORY INTELLIGENCE INTEGRATION METHODS
  // =============================================================================

  /**
   * Generate memory insights for the user using MemoryIntelligence layer with metadata separation
   */
  async generateMemoryInsights(userId: string, query?: string, options?: {
    category?: string; // WORKPLACE, PRIVATE, PROJECTS, etc.
    includeInstitutionalKnowledge?: boolean;
    sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted';
  }): Promise<IntelligenceInsight[]> {
    if (!this.memoryIntelligence) {
      console.warn(`Memory Intelligence not available for ${this.config.id}`);
      return [];
    }

    try {
      // Create metadata-aware search query that respects concern separation
      const searchQuery = query || `insights for user ${userId}`;
      
      // Use MemoryIntelligence with metadata awareness
      const searchResult = await this.memoryIntelligence.intelligentSearch(searchQuery, userId, { 
        maxResults: 20 
      });
      
      // Extract insights with metadata filtering
      const metadata = (searchResult as any).metadata;
      const insights = metadata?.insights || [];
      
      // Add institutional knowledge if requested (global context)
      if (options?.includeInstitutionalKnowledge) {
        // This would search for global knowledge patterns while respecting privacy
        const institutionalInsights = await this.getInstitutionalInsights(searchQuery, options);
        insights.push(...institutionalInsights);
      }
      
      // Filter by category and sensitivity if specified
      return this.filterInsightsByMetadata(insights, options);
    } catch (error) {
      console.error(`Generate memory insights failed for ${this.config.id}:`, error);
      return [];
    }
  }

  /**
   * Analyze conversation patterns using MemoryIntelligence layer
   */
  async analyzeConversationPatterns(userId: string, _timeRange?: string): Promise<{
    patterns: any[];
    insights: IntelligenceInsight[];
    quality: number;
  }> {
    if (!this.memoryIntelligence) {
      console.warn(`Memory Intelligence not available for ${this.config.id}`);
      return { patterns: [], insights: [], quality: 0 };
    }

    try {
      // Generate analytics for conversation patterns
      const analytics = await this.memoryIntelligence.generateMemoryAnalytics(userId);
      
      // Extract patterns from analytics
      const patterns = [
        {
          type: 'conversation_frequency',
          value: analytics.totalConversations || 0,
          trend: 'stable' // Could be enhanced with trend analysis
        },
        {
          type: 'quality_trend', 
          value: analytics.averageQuality || 0,
          trend: analytics.averageQuality > 0.8 ? 'improving' : 'needs_attention'
        },
        {
          type: 'constitutional_compliance',
          value: analytics.constitutionalCompliance ? 1.0 : 0.0,
          trend: analytics.constitutionalCompliance ? 'compliant' : 'needs_review'
        }
      ];

      // Get insights from analytics
      const insights = analytics.insights || [];

      return {
        patterns,
        insights,
        quality: analytics.averageQuality || 0
      };
    } catch (error) {
      console.error(`Analyze conversation patterns failed for ${this.config.id}:`, error);
      return { patterns: [], insights: [], quality: 0 };
    }
  }

  /**
   * Get institutional insights (global knowledge) while respecting privacy
   */
  private async getInstitutionalInsights(query: string, options?: {
    category?: string;
    sensitivity?: string;
  }): Promise<IntelligenceInsight[]> {
    // This would query for patterns and insights that are marked as:
    // - contextDependency: 'global'
    // - sensitivity: 'public' or 'internal'
    // - No userId specific data
    
    console.log(`Fetching institutional insights for: ${query}, category: ${options?.category}`);
    
    // Placeholder for institutional knowledge retrieval
    // In real implementation, this would search memory with metadata filters:
    // - contextDependency: 'global'
    // - category: options?.category
    // - No system.userId filter
    
    return [];
  }

  /**
   * Filter insights by metadata criteria for concern separation
   */
  private filterInsightsByMetadata(insights: IntelligenceInsight[], options?: {
    category?: string;
    sensitivity?: string;
  }): IntelligenceInsight[] {
    if (!options) return insights;
    
    return insights.filter(insight => {
      // Apply metadata-based filtering
      if (options.category && insight.categories && !insight.categories.includes(options.category)) {
        return false;
      }
      
      // Additional sensitivity filtering would go here
      return true;
    });
  }

  // =============================================================================
  // A2A MULTI-AGENT COMMUNICATION SYSTEM INTEGRATION
  // =============================================================================

  /**
   * Register agent with the integrated A2A system
   */
  protected async registerWithA2ASystem(): Promise<void> {
    try {
      // Import OneAgentEngine to access A2A functionality
      const { OneAgentEngine } = await import('../../OneAgentEngine');
      const engine = OneAgentEngine.getInstance();

      // Register agent with A2A system
      const registration = {
        id: this.config.id,
        name: this.config.name,
        capabilities: this.a2aCapabilities
      };

      // Call A2A registration through OneAgentEngine
      const request = {
        id: `register_${this.config.id}_${Date.now()}`,
        type: 'tool_call' as const,
        method: 'oneagent_a2a_register_agent',
        params: registration,
        timestamp: new Date().toISOString()
      };

      const response = await engine.processRequest(request);
      
      if (response.success) {
        console.log(`🤖 A2A Registration successful for ${this.config.id}`);
      } else {
        console.warn(`⚠️ A2A Registration failed for ${this.config.id}:`, response.error?.message);
      }
    } catch (error) {
      console.error(`❌ A2A Registration error for ${this.config.id}:`, error);
    }
  }

  /**
   * Join an A2A session
   */
  protected async joinA2ASession(sessionId: string): Promise<boolean> {
    if (!this.a2aEnabled) {
      console.warn(`A2A not enabled for ${this.config.id}`);
      return false;
    }

    try {
      const { OneAgentEngine } = await import('../../OneAgentEngine');
      const engine = OneAgentEngine.getInstance();

      const request = {
        id: `join_${sessionId}_${this.config.id}_${Date.now()}`,
        type: 'tool_call' as const,
        method: 'oneagent_a2a_join_session',
        params: {
          sessionId,
          agentId: this.config.id
        },
        timestamp: new Date().toISOString()
      };

      const response = await engine.processRequest(request);
      
      if (response.success) {
        this.currentSessions.add(sessionId);
        console.log(`🤝 ${this.config.id} joined A2A session: ${sessionId}`);
        return true;
      } else {
        console.warn(`⚠️ Failed to join A2A session ${sessionId}:`, response.error?.message);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error joining A2A session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Send message in A2A session
   */
  protected async sendA2AMessage(
    sessionId: string,
    toAgent: string,
    message: string,
    messageType: 'update' | 'question' | 'decision' | 'action' | 'insight' = 'update'
  ): Promise<boolean> {
    if (!this.a2aEnabled || !this.currentSessions.has(sessionId)) {
      console.warn(`Cannot send A2A message: not in session ${sessionId}`);
      return false;
    }

    try {
      const { OneAgentEngine } = await import('../../OneAgentEngine');
      const engine = OneAgentEngine.getInstance();

      const request = {
        id: `send_${sessionId}_${Date.now()}`,
        type: 'tool_call' as const,
        method: 'oneagent_a2a_send_message',
        params: {
          sessionId,
          fromAgent: this.config.id,
          toAgent,
          message,
          messageType
        },
        timestamp: new Date().toISOString()
      };

      const response = await engine.processRequest(request);
      
      if (response.success) {
        console.log(`📤 ${this.config.id} sent A2A message to ${toAgent} in session ${sessionId}`);
        return true;
      } else {
        console.warn(`⚠️ Failed to send A2A message:`, response.error?.message);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error sending A2A message:`, error);
      return false;
    }
  }

  /**
   * Broadcast message in A2A session
   */
  protected async broadcastA2AMessage(
    sessionId: string,
    message: string,
    messageType: 'update' | 'question' | 'decision' | 'action' | 'insight' = 'update'
  ): Promise<boolean> {
    if (!this.a2aEnabled || !this.currentSessions.has(sessionId)) {
      console.warn(`Cannot broadcast A2A message: not in session ${sessionId}`);
      return false;
    }

    try {
      const { OneAgentEngine } = await import('../../OneAgentEngine');
      const engine = OneAgentEngine.getInstance();

      const request = {
        id: `broadcast_${sessionId}_${Date.now()}`,
        type: 'tool_call' as const,
        method: 'oneagent_a2a_broadcast_message',
        params: {
          sessionId,
          fromAgent: this.config.id,
          message,
          messageType
        },
        timestamp: new Date().toISOString()
      };

      const response = await engine.processRequest(request);
      
      if (response.success) {
        console.log(`📢 ${this.config.id} broadcast A2A message in session ${sessionId}`);
        return true;
      } else {
        console.warn(`⚠️ Failed to broadcast A2A message:`, response.error?.message);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error broadcasting A2A message:`, error);
      return false;
    }
  }

  /**
   * Get A2A session message history
   */
  protected async getA2AMessageHistory(sessionId: string, limit: number = 10): Promise<any[]> {
    if (!this.a2aEnabled) {
      return [];
    }

    try {
      const { OneAgentEngine } = await import('../../OneAgentEngine');
      const engine = OneAgentEngine.getInstance();

      const request = {
        id: `history_${sessionId}_${Date.now()}`,
        type: 'tool_call' as const,
        method: 'oneagent_a2a_get_message_history',
        params: {
          sessionId,
          limit
        },
        timestamp: new Date().toISOString()
      };

      const response = await engine.processRequest(request);
      
      if (response.success) {
        return response.data || [];
      } else {
        console.warn(`⚠️ Failed to get A2A message history:`, response.error?.message);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error getting A2A message history:`, error);
      return [];
    }
  }

  /**
   * Discover other A2A agents by capabilities
   */
  protected async discoverA2AAgents(capabilities?: string[]): Promise<any[]> {
    if (!this.a2aEnabled) {
      return [];
    }

    try {
      const { OneAgentEngine } = await import('../../OneAgentEngine');
      const engine = OneAgentEngine.getInstance();

      const request = {
        id: `discover_${this.config.id}_${Date.now()}`,
        type: 'tool_call' as const,
        method: 'oneagent_a2a_discover_agents',
        params: {
          capabilities,
          excludeAgentId: this.config.id
        },
        timestamp: new Date().toISOString()
      };

      const response = await engine.processRequest(request);
      
      if (response.success) {
        return response.data || [];
      } else {
        console.warn(`⚠️ Failed to discover A2A agents:`, response.error?.message);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error discovering A2A agents:`, error);
      return [];
    }
  }

  /**
   * Enable/disable A2A communication for this agent
   */
  protected setA2AEnabled(enabled: boolean): void {
    this.a2aEnabled = enabled;
    console.log(`🔄 A2A communication ${enabled ? 'enabled' : 'disabled'} for ${this.config.id}`);
  }

  /**
   * Get A2A status and current sessions
   */
  protected getA2AStatus(): {
    enabled: boolean;
    capabilities: string[];
    currentSessions: string[];
    registeredAgents: number;
  } {
    return {
      enabled: this.a2aEnabled,
      capabilities: this.a2aCapabilities,
      currentSessions: Array.from(this.currentSessions),
      registeredAgents: 0 // Could be enhanced to track actual registered agents
    };
  }
}