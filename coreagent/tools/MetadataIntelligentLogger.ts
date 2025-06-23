/**
 * MetadataIntelligentLogger - ALITA Phase 1 Implementation
 * 
 * Purpose: Capture rich conversation metadata with Constitutional AI compliance
 * Why: Complete data enables personalization while maintaining privacy
 * Performance Target: <50ms processing overhead
 * 
 * @version 1.0.0
 * @date 2025-06-15
 * @constitutional-compliant true
 */

import { performance } from 'perf_hooks';
import { ConversationData, TimeWindow, UserProfile } from '../types/oneagent-backbone-types';
import { ConversationMetadata, IMemoryClient as UnifiedIMemoryClient, PrivacyLevel as UnifiedPrivacyLevel, CommunicationStyle as UnifiedCommunicationStyle, ExpertiseLevel as UnifiedExpertiseLevel } from '../types/oneagent-backbone-types';

// Constitutional AI Integration
interface IConstitutionalValidator {
  validate(content: string): Promise<ConstitutionalResult>;
  assessPrivacy(content: string): Promise<PrivacyAssessment>;
  validatePattern(pattern: any): Promise<ValidationResult>;
}

// Memory System Integration
interface IMemoryClient {
  storeConversationMetadata(metadata: ConversationMetadata): Promise<string>;
  updateUserProfile(userId: string, profile: UserProfile): Promise<void>;
  getConversationsInWindow(timeWindow: TimeWindow): Promise<ConversationData[]>;
}

// Performance Monitoring
interface IPerformanceMonitor {
  recordLatency(operation: string, timeMs: number): Promise<void>;
  recordError(operation: string, error: Error): Promise<void>;
  getMetrics(operation: string): Promise<OperationMetrics>;
}

// Core Data Types
export interface MessageAnalysis {
  messageId: string;
  timestamp: Date;
  expertiseLevel: ExpertiseLevel;
  communicationStyle: CommunicationStyle;
  privacyLevel: PrivacyLevel;
  intent: UserIntent;
  processingTimeMs: number;
  constitutionalCompliant: boolean;
  satisfactionIndicators: SatisfactionIndicator[];
  contextDomain: ContextDomain;
}

export interface ResponseAnalysis {
  responseId: string;
  qualityScore: number;
  constitutionalScore: number;
  personalizationMatch: number;
  helpfulnessScore: number;
  transparencyScore: number;
  processingTimeMs: number;
}

export enum ExpertiseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate', 
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum CommunicationStyle {
  FORMAL = 'formal',
  CASUAL = 'casual',
  TECHNICAL = 'technical',
  CONVERSATIONAL = 'conversational'
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  GENERAL = 'general',
  SENSITIVE = 'sensitive',
  RESTRICTED = 'restricted'
}

export enum UserIntent {
  QUESTION = 'question',
  TASK_REQUEST = 'task_request',
  CLARIFICATION = 'clarification',
  FEEDBACK = 'feedback',
  EXPLORATION = 'exploration'
}

export enum ContextDomain {
  WORK = 'work',
  PERSONAL = 'personal',
  LEARNING = 'learning',
  TECHNICAL = 'technical',
  CREATIVE = 'creative'
}

export interface SatisfactionIndicator {
  type: 'positive' | 'negative' | 'neutral';
  confidence: number;
  source: 'explicit' | 'implicit';
}

// WHY: Interface-driven design enables testing and modularity
export interface IMetadataIntelligentLogger {
  // WHY: Comprehensive analysis enables better personalization
  analyzeMessage(message: UserMessage): Promise<MessageAnalysis>;
  
  // WHY: Response quality drives ALITA evolution
  analyzeResponse(response: AIResponse, userFeedback?: UserFeedback): Promise<ResponseAnalysis>;
  
  // WHY: Privacy detection prevents constitutional violations
  detectPrivacyLevel(content: string): Promise<PrivacyLevel>;
  
  // WHY: Performance monitoring ensures <50ms target
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
}

/**
 * MetadataIntelligentLogger Implementation
 * 
 * Core Features:
 * - Rich message analysis with privacy protection
 * - Constitutional AI validation throughout
 * - <50ms processing time with async architecture
 * - Pattern recognition for ALITA evolution
 */
export class MetadataIntelligentLogger implements IMetadataIntelligentLogger {
  
  constructor(
    private constitutionalValidator: IConstitutionalValidator,  // WHY: Safety first
    private memoryClient: IMemoryClient,  // WHY: Centralized storage
    private performanceMonitor: IPerformanceMonitor  // WHY: <50ms target enforcement
  ) {}

  /**
   * Analyze incoming user message with full metadata extraction
   * WHY: Complete analysis enables personalization and learning
   */
  async analyzeMessage(message: UserMessage): Promise<MessageAnalysis> {
    const startTime = performance.now();
    
    try {
      // Constitutional safety check first because safety is paramount
      const constitutionalResult = await this.constitutionalValidator.validate(message.content);
      
      // WHY: Parallel processing for speed while maintaining <50ms target
      const [expertise, style, privacy, intent, domain, satisfaction] = await Promise.all([
        this.detectExpertiseLevel(message.content),
        this.detectCommunicationStyle(message.content),
        this.detectPrivacyLevel(message.content),
        this.classifyIntent(message.content),
        this.detectContextDomain(message.content),
        this.detectSatisfactionIndicators(message.content)
      ]);

      const processingTime = performance.now() - startTime;
      
      // WHY: Performance monitoring ensures we meet <50ms target
      await this.performanceMonitor.recordLatency('message_analysis', processingTime);
      
      const analysis: MessageAnalysis = {
        messageId: message.id,
        timestamp: new Date(),
        expertiseLevel: expertise,
        communicationStyle: style,
        privacyLevel: privacy,
        intent: intent,
        contextDomain: domain,
        satisfactionIndicators: satisfaction,
        processingTimeMs: processingTime,
        constitutionalCompliant: constitutionalResult.passed
      };      // WHY: Store metadata for ALITA learning  
      await this.memoryClient.storeConversationMetadata({        messageAnalysis: {
          communicationStyle: analysis.communicationStyle as UnifiedCommunicationStyle,
          expertiseLevel: analysis.expertiseLevel as UnifiedExpertiseLevel,
          intentCategory: analysis.intent as any, // Map UserIntent to IntentCategory
          contextTags: [analysis.contextDomain],
          contextCategory: 'TECHNICAL', // Default context category
          privacyLevel: analysis.privacyLevel as UnifiedPrivacyLevel,
          sentimentScore: 0.5, // Default neutral sentiment
          complexityScore: expertise === 'expert' ? 0.9 : expertise === 'advanced' ? 0.7 : expertise === 'intermediate' ? 0.5 : 0.3,
          urgencyLevel: 0.5 // Default medium urgency
        },
        userId: message.userId,
        sessionId: message.sessionId,
        timestamp: new Date()
      });

      return analysis;    } catch (error) {
      const processingTime = performance.now() - startTime;
      await this.performanceMonitor.recordError('message_analysis', error as Error);
      throw new AnalysisError(`Message analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze AI response quality and Constitutional compliance
   * WHY: Response assessment drives ALITA evolution improvements
   */
  async analyzeResponse(response: AIResponse, userFeedback?: UserFeedback): Promise<ResponseAnalysis> {
    const startTime = performance.now();
    
    try {
      // WHY: Constitutional validation ensures safety compliance
      const constitutionalScore = await this.assessConstitutionalCompliance(response.content);
      
      // WHY: Quality metrics drive learning patterns
      const [qualityScore, personalizationMatch, helpfulness, transparency] = await Promise.all([
        this.assessOverallQuality(response.content),
        this.assessPersonalizationMatch(response.content, response.userId),
        this.assessHelpfulness(response.content, userFeedback),
        this.assessTransparency(response.content)
      ]);

      const processingTime = performance.now() - startTime;
      await this.performanceMonitor.recordLatency('response_analysis', processingTime);

      const analysis: ResponseAnalysis = {
        responseId: response.id,
        qualityScore,
        constitutionalScore,
        personalizationMatch,
        helpfulnessScore: helpfulness,
        transparencyScore: transparency,
        processingTimeMs: processingTime
      };      // WHY: Store response quality for ALITA learning
      await this.memoryClient.storeConversationMetadata({
        responseAnalysis: {
          qualityScore: analysis.qualityScore,
          helpfulnessScore: analysis.helpfulnessScore,
          accuracyScore: transparency, // Map transparency to accuracy
          constitutionalCompliance: analysis.constitutionalScore,
          responseTimeMs: analysis.processingTimeMs,
          tokensUsed: 0 // Default tokens used
        },
        userId: response.userId,
        sessionId: response.sessionId,
        timestamp: new Date()
      });

      return analysis;    } catch (error) {
      const processingTime = performance.now() - startTime;
      await this.performanceMonitor.recordError('response_analysis', error as Error);
      throw new AnalysisError(`Response analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Privacy Level Detection with Constitutional AI
   * WHY: Privacy protection is constitutionally required
   */
  async detectPrivacyLevel(content: string): Promise<PrivacyLevel> {
    // Constitutional AI check first because safety is paramount
    const safetyCheck = await this.constitutionalValidator.assessPrivacy(content);
    if (!safetyCheck.passed) {
      return PrivacyLevel.RESTRICTED;
    }
      // WHY: Pattern matching for sensitive information types
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/,  // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,  // Email
      /\b\d{16}\b/,  // Credit card
      /\b\d{3}-\d{3}-\d{4}\b/,  // Phone number
      /password\s*[:=]\s*\w+|secret\s*[:=]\s*\w+|confidential|private/i  // Keywords with context
    ];
    
    const personalPatterns = [
      /my name is|i am|i'm called/i,
      /my address|i live at/i,
      /born on|birthday|age \d+/i
    ];

    // WHY: Conservative approach protects user privacy
    if (sensitivePatterns.some(pattern => pattern.test(content))) {
      return PrivacyLevel.SENSITIVE;
    }
    
    if (personalPatterns.some(pattern => pattern.test(content))) {
      return PrivacyLevel.GENERAL;
    }
    
    return PrivacyLevel.PUBLIC;
  }

  /**
   * Expertise Level Detection
   * WHY: Response complexity should match user capability
   */
  private async detectExpertiseLevel(content: string): Promise<ExpertiseLevel> {
    const technicalTerms = content.match(/\b(algorithm|framework|implementation|architecture|optimization)\b/gi) || [];
    const complexSyntax = content.match(/[{}()[\]]/g) || [];
    const questionComplexity = content.includes('how') && content.includes('why') ? 1 : 0;
    
    const complexityScore = technicalTerms.length + complexSyntax.length + questionComplexity;
    
    if (complexityScore >= 8) return ExpertiseLevel.EXPERT;
    if (complexityScore >= 5) return ExpertiseLevel.ADVANCED;
    if (complexityScore >= 2) return ExpertiseLevel.INTERMEDIATE;
    return ExpertiseLevel.BEGINNER;
  }

  /**
   * Communication Style Detection  
   * WHY: Tone matching improves user comfort
   */
  private async detectCommunicationStyle(content: string): Promise<CommunicationStyle> {
    const formalIndicators = /please|kindly|would you|could you|thank you/gi;
    const casualIndicators = /hey|hi|yeah|cool|awesome|thanks/gi;
    const technicalIndicators = /function|class|method|variable|parameter/gi;
    
    const formalCount = (content.match(formalIndicators) || []).length;
    const casualCount = (content.match(casualIndicators) || []).length;
    const technicalCount = (content.match(technicalIndicators) || []).length;
    
    if (technicalCount >= 2) return CommunicationStyle.TECHNICAL;
    if (formalCount > casualCount) return CommunicationStyle.FORMAL;
    if (casualCount > 0) return CommunicationStyle.CASUAL;
    return CommunicationStyle.CONVERSATIONAL;
  }

  /**
   * Intent Classification
   * WHY: Different intents require different response strategies  
   */
  private async classifyIntent(content: string): Promise<UserIntent> {
    if (/\?|what|how|why|when|where|who/i.test(content)) {
      return UserIntent.QUESTION;
    }
    if (/please|can you|could you|implement|create|build/i.test(content)) {
      return UserIntent.TASK_REQUEST;
    }
    if (/clarify|explain|mean|understand/i.test(content)) {
      return UserIntent.CLARIFICATION;
    }
    if (/good|bad|like|dislike|better|worse/i.test(content)) {
      return UserIntent.FEEDBACK;
    }
    return UserIntent.EXPLORATION;
  }

  /**
   * Context Domain Detection
   * WHY: Cross-domain learning needs clear boundaries
   */
  private async detectContextDomain(content: string): Promise<ContextDomain> {
    const workKeywords = /meeting|project|deadline|client|business|company/i;
    const technicalKeywords = /code|programming|software|development|algorithm/i;
    const learningKeywords = /learn|study|understand|explain|teach/i;
    const creativeKeywords = /design|creative|art|writing|story/i;
    
    if (workKeywords.test(content)) return ContextDomain.WORK;
    if (technicalKeywords.test(content)) return ContextDomain.TECHNICAL;
    if (learningKeywords.test(content)) return ContextDomain.LEARNING;
    if (creativeKeywords.test(content)) return ContextDomain.CREATIVE;
    return ContextDomain.PERSONAL;
  }

  /**
   * Satisfaction Indicator Detection
   * WHY: User satisfaction drives ALITA evolution success metrics
   */
  private async detectSatisfactionIndicators(content: string): Promise<SatisfactionIndicator[]> {
    const indicators: SatisfactionIndicator[] = [];
    
    // Positive indicators
    const positivePatterns = /thank|thanks|great|awesome|perfect|excellent|good|helpful/i;
    if (positivePatterns.test(content)) {
      indicators.push({
        type: 'positive',
        confidence: 0.8,
        source: 'explicit'
      });
    }
    
    // Negative indicators  
    const negativePatterns = /wrong|bad|terrible|awful|confused|frustrated|error/i;
    if (negativePatterns.test(content)) {
      indicators.push({
        type: 'negative',
        confidence: 0.7,
        source: 'explicit'
      });
    }
    
    return indicators;
  }

  // Quality Assessment Methods
  private async assessConstitutionalCompliance(content: string): Promise<number> {
    const result = await this.constitutionalValidator.validate(content);
    return result.score || 0;
  }
  private async assessOverallQuality(_content: string): Promise<number> {
    // Implement quality scoring logic
    return 0.8; // Placeholder
  }

  private async assessPersonalizationMatch(_content: string, _userId: string): Promise<number> {
    // Implement personalization assessment
    return 0.75; // Placeholder
  }

  private async assessHelpfulness(_content: string, feedback?: UserFeedback): Promise<number> {
    // Implement helpfulness scoring
    return feedback?.helpfulnessScore || 0.8; // Placeholder
  }

  private async assessTransparency(content: string): Promise<number> {
    // Check for "because" explanations and clear reasoning
    const becauseCount = (content.match(/because|the reason|this is due to/gi) || []).length;
    const contentLength = content.length;
    return Math.min(becauseCount / (contentLength / 100), 1.0);
  }
  /**
   * Get Performance Metrics
   * WHY: Monitoring ensures <50ms target compliance
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const [messageMetrics, responseMetrics] = await Promise.all([
      this.performanceMonitor.getMetrics('message_analysis'),
      this.performanceMonitor.getMetrics('response_analysis')
    ]);
      return {
      messageAnalysis: messageMetrics,
      responseAnalysis: responseMetrics,
      averageLatency: (messageMetrics.averageLatency + responseMetrics.averageLatency) / 2,
      errorRate: (messageMetrics.errorRate + responseMetrics.errorRate) / 2
    };
  }
  /**
   * Log conversation with full metadata analysis
   * WHY: Complete conversation logging enables ALITA auto-evolution
   */
  async logConversation(data: {
    userMessage: string;
    aiResponse: string;
    timestamp: Date;
    sessionId: string;
    userId: string;
    [key: string]: any;
  }): Promise<{ id: string; timestamp: Date }> {
    try {
      const startTime = Date.now();
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const responseId = `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Analyze user message
      const messageAnalysis = await this.analyzeMessage({
        id: messageId,
        content: data.userMessage,
        userId: data.userId,
        timestamp: data.timestamp,
        sessionId: data.sessionId
      });

      // Analyze AI response (without feedback for now)
      const responseAnalysis = await this.analyzeResponse({
        id: responseId,
        content: data.aiResponse,
        timestamp: data.timestamp,
        sessionId: data.sessionId,
        userId: data.userId
      });      // Store conversation metadata
      const conversationId = await this.memoryClient.storeConversationMetadata({        messageAnalysis: {
          communicationStyle: messageAnalysis.communicationStyle as UnifiedCommunicationStyle,
          expertiseLevel: messageAnalysis.expertiseLevel as UnifiedExpertiseLevel,
          intentCategory: messageAnalysis.intent as any,
          contextTags: [messageAnalysis.contextDomain],
          contextCategory: 'TECHNICAL', // Default context category
          privacyLevel: messageAnalysis.privacyLevel as UnifiedPrivacyLevel,
          sentimentScore: 0.5,
          complexityScore: 0.5,
          urgencyLevel: 0.5
        },
        responseAnalysis: {
          qualityScore: responseAnalysis.qualityScore,
          helpfulnessScore: responseAnalysis.helpfulnessScore,
          accuracyScore: responseAnalysis.transparencyScore,
          constitutionalCompliance: responseAnalysis.constitutionalScore,
          responseTimeMs: responseAnalysis.processingTimeMs,
          tokensUsed: 0
        },
        userId: data.userId,
        sessionId: data.sessionId,
        timestamp: data.timestamp
      });

      const processingTime = Date.now() - startTime;
      console.log(`✅ Conversation logged in ${processingTime}ms (ID: ${conversationId})`);

      return {
        id: conversationId,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error('Failed to log conversation:', error);
      throw error;
    }
  }
}

// Supporting Types and Interfaces
export interface UserMessage {
  id: string;
  userId: string;
  sessionId: string;
  content: string;
  timestamp: Date;
}

export interface AIResponse {
  id: string;
  userId: string;
  sessionId: string;
  content: string;
  timestamp: Date;
}

export interface UserFeedback {
  helpfulnessScore: number;
  satisfactionScore: number;
  comments?: string;
}

export interface PerformanceMetrics {
  messageAnalysis: OperationMetrics;
  responseAnalysis: OperationMetrics;
  averageLatency: number;
  errorRate: number;
}

export interface OperationMetrics {
  averageLatency: number;
  errorRate: number;
  successCount: number;
  totalOperations: number;
}

export interface ConstitutionalResult {
  passed: boolean;
  score: number;
  violations: string[];
}

export interface PrivacyAssessment {
  passed: boolean;
  riskLevel: string;
  sensitiveDataDetected: boolean;
}

export interface ValidationResult {
  passed: boolean;
  reason?: string;
}

// Custom Errors
export class AnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export class ConstitutionalViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConstitutionalViolationError';
  }
}

export class PrivacyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrivacyViolationError';
  }
}
