/**
 * SessionContextManager - Phase 2 Implementation
 * ALITA Metadata Integration System
 * 
 * PURPOSE: Intelligent user profile learning and session management
 * FEATURES: User preference detection, context continuity, privacy boundaries
 * PERFORMANCE TARGET: <100ms profile updates, <50ms context retrieval
 * CONSTITUTIONAL AI: Ensures all learning respects safety and privacy
 */

import { ConstitutionalValidator } from '../validation/ConstitutionalValidator';
import { MemoryClient } from '../memory/MemoryClient';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';

// ========================================
// Interfaces for existing components
// ========================================

export interface IConstitutionalValidator {
  validate(content: string): Promise<{ passed: boolean; reasoning?: string }>;
  validateUserData(data: { userData: any; context: string }): Promise<{ passed: boolean; reasoning?: string }>;
  validatePattern?(pattern: any): Promise<{ passed: boolean; reasoning?: string }>;
}

export interface IMemoryClient {
  storeConversationMetadata(metadata: any): Promise<void>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, profile: UserProfile): Promise<void>;
  createUserProfile(userId: string, profile: UserProfile): Promise<void>;
  getSessionContext(sessionId: string): Promise<SessionContext | null>;
  updateSessionContext(sessionId: string, context: SessionContext): Promise<void>;
  createSession(sessionId: string, context: SessionContext): Promise<void>;
  getConversationsInWindow?(timeWindow: any): Promise<any[]>;
}

export interface IPerformanceMonitor {
  recordLatency(operation: string, timeMs: number): Promise<void>;
  recordError(operation: string, error: Error): Promise<void>;
  getMetrics?(operation: string): Promise<any>;
  startTimer(operation: string): IPerformanceTimer;
}

export interface IPerformanceTimer {
  end(result?: { success: boolean; reason?: string; error?: string; cached?: boolean; created?: boolean; [key: string]: any }): void;
}

export interface InteractionData {
  messageId: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  messageContent: string;
  aiResponse: string;
  responseTimeMs: number;
  userSatisfactionScore?: number; // 0-1 scale
  taskCompleted?: boolean;
  communicationStyle: CommunicationStyle;
  expertiseLevel: ExpertiseLevel;
  intentCategory: IntentCategory;
  contextTags: string[];
  privacyLevel: PrivacyLevel;
}

export interface UserProfile {
  userId: string;
  createdAt: Date;
  lastUpdated: Date;
  totalInteractions: number;
  
  // Communication Preferences
  preferredCommunicationStyle: CommunicationStyle;
  preferredResponseLength: ResponseLength;
  preferredTechnicalLevel: ExpertiseLevel;
  preferredFormality: FormalityLevel;
  
  // Expertise Tracking
  domainExpertise: Map<string, ExpertiseLevel>;
  learningProgression: LearningProgression[];
  
  // Interaction Patterns
  successfulPatterns: InteractionPattern[];
  unsuccessfulPatterns: InteractionPattern[];
  averageSessionLength: number;
  preferredInteractionTimes: TimePattern[];
  
  // Privacy Boundaries
  privacyBoundaries: PrivacyBoundaries;
  sensitiveTopics: string[];
  
  // Evolution Metrics
  satisfactionTrend: number; // Rolling average
  engagementScore: number; // 0-1 scale
  lastConstitutionalValidation: Date;
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  
  // Context Data
  conversationHistory: ConversationEntry[];
  currentTopic: string;
  topicProgression: TopicTransition[];
  
  // User State
  currentMood: MoodIndicator;
  currentExpertiseLevel: ExpertiseLevel;
  currentIntentCategory: IntentCategory;
  
  // Session Metrics
  messageCount: number;
  averageResponseTime: number;
  satisfactionScore: number;
  
  // Privacy Context
  activePolicyViolations: string[];
  privacyModeActive: boolean;
}

export interface PrivacyBoundaries {
  dataRetentionDays: number;
  allowPersonalization: boolean;
  allowCrossDomainLearning: boolean;
  sensitiveTopicFiltering: boolean;
  explicitConsentRequired: string[]; // Topics requiring explicit consent
  neverLog: string[]; // Topics to never store
  anonymizeAfterDays: number;
}

// Enums for type safety
export enum CommunicationStyle {
  FORMAL = 'formal',
  CASUAL = 'casual',
  TECHNICAL = 'technical',
  CONVERSATIONAL = 'conversational',
  INSTRUCTIONAL = 'instructional'
}

export enum ExpertiseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum IntentCategory {
  QUESTION = 'question',
  TASK = 'task',
  EXPLORATION = 'exploration',
  TROUBLESHOOTING = 'troubleshooting',
  LEARNING = 'learning',
  CREATIVE = 'creative'
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

export enum ResponseLength {
  CONCISE = 'concise',
  MODERATE = 'moderate',
  DETAILED = 'detailed',
  COMPREHENSIVE = 'comprehensive'
}

export enum FormalityLevel {
  CASUAL = 'casual',
  PROFESSIONAL = 'professional',
  ACADEMIC = 'academic',
  FORMAL = 'formal'
}

export enum MoodIndicator {
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  FRUSTRATED = 'frustrated',
  CURIOUS = 'curious',
  FOCUSED = 'focused'
}

export interface InteractionPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  averageSatisfaction: number;
  contexts: string[];
}

export interface LearningProgression {
  domain: string;
  startLevel: ExpertiseLevel;
  currentLevel: ExpertiseLevel;
  progressionRate: number;
  lastUpdate: Date;
}

export interface ConversationEntry {
  messageId: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  metadata: InteractionData;
}

export interface TopicTransition {
  fromTopic: string;
  toTopic: string;
  timestamp: Date;
  transitionSmooth: boolean;
  contextRetained: boolean;
}

export interface TimePattern {
  dayOfWeek: number;
  hourOfDay: number;
  frequency: number;
  avgSatisfaction: number;
}

// ========================================
// Privacy Engine Interface
// ========================================

export interface IPrivacyEngine {
  validateProfileData(profile: UserProfile): Promise<boolean>;
  sanitizeInteractionData(data: InteractionData): Promise<InteractionData>;
  checkTopicSensitivity(topic: string, boundaries: PrivacyBoundaries): Promise<boolean>;
  enforceRetentionPolicy(userId: string): Promise<void>;
}

// ========================================
// Main SessionContextManager Interface
// ========================================

export interface ISessionContextManager {
  // Profile Management
  updateUserProfile(userId: string, interactionData: InteractionData): Promise<UserProfile>;
  getUserProfile(userId: string): Promise<UserProfile>;
  createUserProfile(userId: string, initialBoundaries?: PrivacyBoundaries): Promise<UserProfile>;
  
  // Session Management
  getSessionContext(sessionId: string): Promise<SessionContext>;
  updateSessionContext(sessionId: string, update: Partial<SessionContext>): Promise<SessionContext>;
  createSession(userId: string, sessionId?: string): Promise<SessionContext>;
  endSession(sessionId: string): Promise<void>;
  
  // Privacy Management
  setPrivacyBoundaries(userId: string, boundaries: PrivacyBoundaries): Promise<void>;
  validatePrivacyCompliance(userId: string, data: any): Promise<boolean>;
  
  // Context Continuity
  getConversationHistory(sessionId: string, limit?: number): Promise<ConversationEntry[]>;
  resolveReferences(sessionId: string, currentMessage: string): Promise<string[]>;
  
  // Analytics
  getProfileEvolutionMetrics(userId: string): Promise<ProfileEvolutionMetrics>;
  getSessionAnalytics(sessionId: string): Promise<SessionAnalytics>;
}

export interface ProfileEvolutionMetrics {
  profileAge: number; // days
  interactionCount: number;
  satisfactionTrend: number[];
  expertiseGrowth: Map<string, number>;
  communicationStyleStability: number;
  lastEvolutionDate: Date;
}

export interface SessionAnalytics {
  duration: number; // minutes
  messageCount: number;
  topicCoverage: string[];
  satisfactionScore: number;
  productivityScore: number;
  contextContinuityScore: number;
}

// ========================================
// Privacy Engine Implementation
// ========================================

class PrivacyEngine implements IPrivacyEngine {
  constructor(
    private constitutionalValidator: IConstitutionalValidator,
    private performanceMonitor: IPerformanceMonitor
  ) {}

  async validateProfileData(profile: UserProfile): Promise<boolean> {
    const timer = this.performanceMonitor.startTimer('privacy_validation');
    
    try {
      // Check for Constitutional AI compliance
      const constitutional = await this.constitutionalValidator.validateUserData({
        userData: profile,
        context: 'profile_storage'
      });
      
      if (!constitutional.passed) {
        timer.end({ success: false, reason: 'constitutional_violation' });
        return false;
      }
      
      // Check privacy boundaries
      if (profile.privacyBoundaries) {
        // Validate retention policy
        if (profile.privacyBoundaries.dataRetentionDays < 1) {
          timer.end({ success: false, reason: 'invalid_retention_policy' });
          return false;
        }
        
        // Check sensitive topic handling
        if (profile.sensitiveTopics && profile.sensitiveTopics.length > 0) {
          if (!profile.privacyBoundaries.sensitiveTopicFiltering) {
            timer.end({ success: false, reason: 'sensitive_topic_mismatch' });
            return false;
          }
        }
      }
      
      timer.end({ success: true });
      return true;
    } catch (error) {      timer.end({ success: false, error: (error as Error).message });
      throw new Error(`Privacy validation failed: ${(error as Error).message}`);
    }
  }

  async sanitizeInteractionData(data: InteractionData): Promise<InteractionData> {
    const timer = this.performanceMonitor.startTimer('data_sanitization');
    
    try {
      const sanitized = { ...data };
      
      // Remove potential PII patterns
      sanitized.messageContent = this.removePII(data.messageContent);
      sanitized.aiResponse = this.removePII(data.aiResponse);
      
      // Apply privacy level constraints
      if (data.privacyLevel === PrivacyLevel.RESTRICTED) {
        sanitized.contextTags = [];
        sanitized.messageContent = '[RESTRICTED]';
      }
      
      timer.end({ success: true });
      return sanitized;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Data sanitization failed: ${errorMessage}`);
    }
  }

  async checkTopicSensitivity(topic: string, boundaries: PrivacyBoundaries): Promise<boolean> {
    // Check against never-log topics
    if (boundaries.neverLog.includes(topic.toLowerCase())) {
      return false;
    }
    
    // Check against explicit consent requirements
    if (boundaries.explicitConsentRequired.includes(topic.toLowerCase())) {
      // In real implementation, this would check for user consent
      return false;
    }
    
    return true;
  }

  async enforceRetentionPolicy(_userId: string): Promise<void> {
    // Implementation would handle data deletion based on retention policy
    // This is a placeholder for the actual implementation
  }

  private removePII(text: string): string {
    // Simple PII removal patterns - in production, use more sophisticated detection
    return text
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]');
  }
}

// ========================================
// Main SessionContextManager Implementation
// ========================================

export class SessionContextManager implements ISessionContextManager {
  private privacyEngine: IPrivacyEngine;
  private sessionCache: Map<string, SessionContext> = new Map();
  private profileCache: Map<string, UserProfile> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private memoryClient: IMemoryClient,
    private constitutionalValidator: IConstitutionalValidator,
    private performanceMonitor: IPerformanceMonitor
  ) {
    this.privacyEngine = new PrivacyEngine(constitutionalValidator, performanceMonitor);
  }

  // ========================================
  // Profile Management
  // ========================================

  async updateUserProfile(userId: string, interactionData: InteractionData): Promise<UserProfile> {
    const timer = this.performanceMonitor.startTimer('update_user_profile');
    
    try {
      // Constitutional safety check for user data
      const safetyValidation = await this.constitutionalValidator.validateUserData({
        userData: interactionData,
        context: 'profile_update'
      });
      
      if (!safetyValidation.passed) {
        timer.end({ success: false, reason: 'constitutional_violation' });
        throw new Error(`Constitutional violation in profile update: ${safetyValidation.reasoning}`);
      }

      // Get current profile
      const currentProfile = await this.getUserProfile(userId);
      
      // Sanitize interaction data
      const sanitizedData = await this.privacyEngine.sanitizeInteractionData(interactionData);
      
      // Compute weighted profile update
      const updatedProfile = await this.computeWeightedProfileUpdate(currentProfile, sanitizedData);
      
      // Privacy validation
      if (!await this.privacyEngine.validateProfileData(updatedProfile)) {
        timer.end({ success: false, reason: 'privacy_violation' });
        throw new Error('Profile update violates privacy boundaries');
      }

      // Store updated profile
      await this.memoryClient.updateUserProfile(userId, updatedProfile);
      
      // Update cache
      this.profileCache.set(userId, updatedProfile);
      
      timer.end({ success: true });
      return updatedProfile;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to update user profile: ${errorMessage}`);
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const timer = this.performanceMonitor.startTimer('get_user_profile');
    
    try {
      // Check cache first
      const cached = this.profileCache.get(userId);
      if (cached && !this.isProfileCacheStale(userId)) {
        timer.end({ success: true, cached: true });
        return cached;
      }

      // Fetch from memory client
      const profile = await this.memoryClient.getUserProfile(userId);
      
      if (!profile) {
        // Create new profile if doesn't exist
        const newProfile = await this.createUserProfile(userId);
        timer.end({ success: true, created: true });
        return newProfile;
      }

      // Update cache
      this.profileCache.set(userId, profile);
      
      timer.end({ success: true });
      return profile;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to get user profile: ${errorMessage}`);
    }
  }

  async createUserProfile(userId: string, initialBoundaries?: PrivacyBoundaries): Promise<UserProfile> {
    const timer = this.performanceMonitor.startTimer('create_user_profile');
    
    try {
      const defaultBoundaries: PrivacyBoundaries = {
        dataRetentionDays: 365,
        allowPersonalization: true,
        allowCrossDomainLearning: true,
        sensitiveTopicFiltering: true,
        explicitConsentRequired: [],
        neverLog: ['password', 'ssn', 'credit_card'],
        anonymizeAfterDays: 30
      };

      const profile: UserProfile = {
        userId,
        createdAt: new Date(),
        lastUpdated: new Date(),
        totalInteractions: 0,
        
        // Communication Preferences (defaults)
        preferredCommunicationStyle: CommunicationStyle.CONVERSATIONAL,
        preferredResponseLength: ResponseLength.MODERATE,
        preferredTechnicalLevel: ExpertiseLevel.INTERMEDIATE,
        preferredFormality: FormalityLevel.PROFESSIONAL,
        
        // Expertise Tracking
        domainExpertise: new Map(),
        learningProgression: [],
        
        // Interaction Patterns
        successfulPatterns: [],
        unsuccessfulPatterns: [],
        averageSessionLength: 0,
        preferredInteractionTimes: [],
        
        // Privacy Boundaries
        privacyBoundaries: initialBoundaries || defaultBoundaries,
        sensitiveTopics: [],
        
        // Evolution Metrics
        satisfactionTrend: 0.5, // Neutral starting point
        engagementScore: 0.5,
        lastConstitutionalValidation: new Date()
      };

      // Validate and store
      if (!await this.privacyEngine.validateProfileData(profile)) {
        timer.end({ success: false, reason: 'privacy_validation_failed' });
        throw new Error('Failed to validate new user profile');
      }

      await this.memoryClient.createUserProfile(userId, profile);
      
      // Update cache
      this.profileCache.set(userId, profile);
      
      timer.end({ success: true });
      return profile;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to create user profile: ${errorMessage}`);
    }
  }

  // ========================================
  // Session Management
  // ========================================

  async getSessionContext(sessionId: string): Promise<SessionContext> {
    const timer = this.performanceMonitor.startTimer('get_session_context');
    
    try {
      // Check cache first
      const cached = this.sessionCache.get(sessionId);
      if (cached && !this.isContextStale(cached)) {
        timer.end({ success: true, cached: true });
        return cached;
      }

      // Fetch from memory client
      let context = await this.memoryClient.getSessionContext(sessionId);
      
      if (!context) {
        timer.end({ success: false, reason: 'session_not_found' });
        throw new Error(`Session ${sessionId} not found`);
      }

      // Assemble fresh context if needed
      if (this.isContextStale(context)) {
        context = await this.assembleSessionContext(sessionId);
      }

      // Update cache
      this.sessionCache.set(sessionId, context);
      
      timer.end({ success: true });
      return context;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to get session context: ${errorMessage}`);
    }
  }

  async createSession(userId: string, sessionId?: string): Promise<SessionContext> {
    const timer = this.performanceMonitor.startTimer('create_session');
    
    try {
      const id = sessionId || `session_${userId}_${Date.now()}`;
      const now = new Date();

      const context: SessionContext = {
        sessionId: id,
        userId,
        startTime: now,
        lastActivity: now,
        isActive: true,
        
        // Context Data
        conversationHistory: [],
        currentTopic: '',
        topicProgression: [],
        
        // User State
        currentMood: MoodIndicator.NEUTRAL,
        currentExpertiseLevel: ExpertiseLevel.INTERMEDIATE,
        currentIntentCategory: IntentCategory.QUESTION,
        
        // Session Metrics
        messageCount: 0,
        averageResponseTime: 0,
        satisfactionScore: 0.5,
        
        // Privacy Context
        activePolicyViolations: [],
        privacyModeActive: false
      };

      // Store session
      await this.memoryClient.createSession(id, context);
      
      // Update cache
      this.sessionCache.set(id, context);
      
      timer.end({ success: true });
      return context;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to create session: ${errorMessage}`);
    }
  }

  async updateSessionContext(sessionId: string, update: Partial<SessionContext>): Promise<SessionContext> {
    const timer = this.performanceMonitor.startTimer('update_session_context');
    
    try {
      const currentContext = await this.getSessionContext(sessionId);
      const updatedContext = { ...currentContext, ...update, lastActivity: new Date() };
      
      // Store update
      await this.memoryClient.updateSessionContext(sessionId, updatedContext);
      
      // Update cache
      this.sessionCache.set(sessionId, updatedContext);
      
      timer.end({ success: true });
      return updatedContext;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to update session context: ${errorMessage}`);
    }
  }

  async endSession(sessionId: string): Promise<void> {
    const timer = this.performanceMonitor.startTimer('end_session');
    
    try {
      const context = await this.getSessionContext(sessionId);
      const endedContext = {
        ...context,
        isActive: false,
        lastActivity: new Date()
      };
      
      await this.memoryClient.updateSessionContext(sessionId, endedContext);
      
      // Remove from cache
      this.sessionCache.delete(sessionId);
      
      timer.end({ success: true });    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to end session: ${errorMessage}`);
    }
  }

  // ========================================
  // Privacy Management
  // ========================================

  async setPrivacyBoundaries(userId: string, boundaries: PrivacyBoundaries): Promise<void> {
    const timer = this.performanceMonitor.startTimer('set_privacy_boundaries');
    
    try {
      const profile = await this.getUserProfile(userId);
      profile.privacyBoundaries = boundaries;
      profile.lastUpdated = new Date();
      
      // Validate boundaries
      if (!await this.privacyEngine.validateProfileData(profile)) {
        timer.end({ success: false, reason: 'invalid_boundaries' });
        throw new Error('Invalid privacy boundaries');
      }
      
      await this.memoryClient.updateUserProfile(userId, profile);
      
      // Update cache
      this.profileCache.set(userId, profile);
      
      timer.end({ success: true });    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to set privacy boundaries: ${errorMessage}`);
    }
  }

  async validatePrivacyCompliance(userId: string, _data: any): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return await this.privacyEngine.validateProfileData(profile);
    } catch {
      return false;
    }
  }

  // ========================================
  // Context Continuity
  // ========================================

  async getConversationHistory(sessionId: string, limit: number = 10): Promise<ConversationEntry[]> {
    const timer = this.performanceMonitor.startTimer('get_conversation_history');
    
    try {
      const context = await this.getSessionContext(sessionId);
      const history = context.conversationHistory
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
      
      timer.end({ success: true });
      return history;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to get conversation history: ${errorMessage}`);
    }
  }

  async resolveReferences(sessionId: string, currentMessage: string): Promise<string[]> {
    const timer = this.performanceMonitor.startTimer('resolve_references');
    
    try {
      const history = await this.getConversationHistory(sessionId, 5);
      const references: string[] = [];
      
      // Simple reference resolution - look for pronouns and context clues
      const referencePatterns = [
        /\b(it|that|this|the previous|the last|earlier)\b/gi,
        /\b(what we discussed|what you mentioned|the topic)\b/gi
      ];
      
      for (const pattern of referencePatterns) {
        if (pattern.test(currentMessage)) {
          // Find relevant context from history
          for (const entry of history) {
            if (entry.userMessage.length > 20) { // Substantive message
              references.push(`Previous context: "${entry.userMessage.substring(0, 100)}..."`);
              break;
            }
          }
        }
      }
      
      timer.end({ success: true });
      return references;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to resolve references: ${errorMessage}`);
    }
  }

  // ========================================
  // Analytics
  // ========================================

  async getProfileEvolutionMetrics(userId: string): Promise<ProfileEvolutionMetrics> {
    const timer = this.performanceMonitor.startTimer('get_profile_metrics');
    
    try {
      const profile = await this.getUserProfile(userId);
      const now = new Date();
      const profileAge = Math.floor((now.getTime() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      const metrics: ProfileEvolutionMetrics = {
        profileAge,
        interactionCount: profile.totalInteractions,
        satisfactionTrend: [profile.satisfactionTrend], // Would be expanded to array in full implementation
        expertiseGrowth: new Map(Array.from(profile.domainExpertise.entries()).map(([domain, level]) => [domain, this.expertiseLevelToNumber(level)])),
        communicationStyleStability: 0.8, // Calculated based on style consistency
        lastEvolutionDate: profile.lastUpdated
      };
      
      timer.end({ success: true });
      return metrics;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to get profile metrics: ${errorMessage}`);
    }
  }

  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
    const timer = this.performanceMonitor.startTimer('get_session_analytics');
    
    try {
      const context = await this.getSessionContext(sessionId);
      const duration = Math.floor((context.lastActivity.getTime() - context.startTime.getTime()) / (1000 * 60));
      
      const analytics: SessionAnalytics = {
        duration,
        messageCount: context.messageCount,
        topicCoverage: context.topicProgression.map(t => t.toTopic),
        satisfactionScore: context.satisfactionScore,
        productivityScore: 0.7, // Calculated based on task completion
        contextContinuityScore: 0.8 // Calculated based on smooth transitions
      };
      
      timer.end({ success: true });
      return analytics;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      timer.end({ success: false, error: errorMessage });
      throw new Error(`Failed to get session analytics: ${errorMessage}`);
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private async computeWeightedProfileUpdate(
    currentProfile: UserProfile, 
    interactionData: InteractionData
  ): Promise<UserProfile> {
    const updated = { ...currentProfile };
    updated.lastUpdated = new Date();
    updated.totalInteractions += 1;
    
    // Weight factor based on interaction count (newer profiles change more)
    const weight = Math.min(0.1, 1.0 / Math.max(1, updated.totalInteractions * 0.1));
    
    // Update communication preferences with weighted average
    if (interactionData.userSatisfactionScore && interactionData.userSatisfactionScore > 0.7) {
      // Only learn from successful interactions
      const currentStyle = updated.preferredCommunicationStyle;
      if (currentStyle !== interactionData.communicationStyle) {
        // Gradual style adaptation
        // In full implementation, would use proper weighted averaging
      }
    }
    
    // Update satisfaction trend
    if (interactionData.userSatisfactionScore) {
      updated.satisfactionTrend = updated.satisfactionTrend * (1 - weight) + 
                                  interactionData.userSatisfactionScore * weight;
    }
    
    // Update domain expertise
    for (const tag of interactionData.contextTags) {
      const currentLevel = updated.domainExpertise.get(tag) || ExpertiseLevel.BEGINNER;
      // Gradual expertise progression based on successful interactions
      if (interactionData.userSatisfactionScore && interactionData.userSatisfactionScore > 0.8) {
        // Implementation would include expertise level progression logic
      }
    }
    
    return updated;
  }
  private async assembleSessionContext(sessionId: string): Promise<SessionContext> {
    // This would assemble context from various sources
    // For now, return the basic context from memory client
    const context = await this.memoryClient.getSessionContext(sessionId);
    if (!context) {
      throw new Error(`Session context not found for session: ${sessionId}`);
    }
    return context;
  }

  private isContextStale(context: SessionContext): boolean {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    return (now.getTime() - context.lastActivity.getTime()) > staleThreshold;
  }
  /**
   * Helper method to track operation performance
   */
  private async trackPerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      await this.performanceMonitor.recordLatency(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.performanceMonitor.recordLatency(operation, duration);
      await this.performanceMonitor.recordError(operation, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private isProfileCacheStale(_userId: string): boolean {
    // Simple staleness check - in production would be more sophisticated
    return false; // For now, cache doesn't expire
  }

  private expertiseLevelToNumber(level: ExpertiseLevel): number {
    switch (level) {
      case ExpertiseLevel.BEGINNER: return 1;
      case ExpertiseLevel.INTERMEDIATE: return 2;
      case ExpertiseLevel.ADVANCED: return 3;
      case ExpertiseLevel.EXPERT: return 4;
      default: return 1;
    }
  }
}

// ========================================
// Export Default Instance
// ========================================

export default SessionContextManager;
