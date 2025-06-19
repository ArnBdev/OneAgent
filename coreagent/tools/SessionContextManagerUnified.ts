/**
 * SessionContextManager - Phase 2 Implementation (UNIFIED)
 * ALITA Metadata Integration System
 * 
 * PURPOSE: Intelligent user profile learning and session management
 * FEATURES: User preference detection, context continuity, privacy boundaries
 * PERFORMANCE TARGET: <100ms profile updates, <50ms context retrieval
 * CONSTITUTIONAL AI: Ensures all learning respects safety and privacy
 * 
 * @version 2.0.0 - Unified Interface Implementation
 * @date 2025-06-16
 */

import { ConstitutionalValidator } from '../validation/ConstitutionalValidator';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';
import { 
  UserProfile,
  SessionContext,
  ConversationData,
  TimeWindow,
  IMemoryClient,
  CommunicationStyle,
  ExpertiseLevel,
  ConversationMetadata
} from '../types/oneagent-backbone-types';

// ========================================
// Core Interfaces (Minimal - using unified types)
// ========================================

export interface SessionLearningData {
  userId: string;
  sessionId: string;
  messageContent: string;
  aiResponse: string;
  timestamp: Date;
  responseTimeMs: number;
  userSatisfactionScore: number;
  taskCompleted: boolean;
  communicationStyle: CommunicationStyle;
  expertiseLevel: ExpertiseLevel;
  intentCategory: string;
  contextTags: string[];
  privacyLevel: string;
}

export interface UserLearningInsight {
  insightType: 'communication_preference' | 'expertise_growth' | 'interaction_pattern' | 'privacy_boundary';
  confidence: number;
  description: string;
  evidence: any[];
  actionableChange: {
    profileUpdate?: Partial<UserProfile>;
    sessionAdjustment?: Partial<SessionContext>;
  };
}

// ========================================
// SessionContextManager Class
// ========================================

export class SessionContextManager {
  private memoryClient: IMemoryClient;
  private constitutionalValidator: ConstitutionalValidator;
  private performanceMonitor: PerformanceMonitor;

  constructor(
    memoryClient: IMemoryClient,
    constitutionalValidator: ConstitutionalValidator,
    performanceMonitor: PerformanceMonitor
  ) {
    this.memoryClient = memoryClient;
    this.constitutionalValidator = constitutionalValidator;
    this.performanceMonitor = performanceMonitor;
  }
  /**
   * Learn from user interaction and update profile
   * WHY: Continuous learning enables personalization while respecting Constitutional AI principles
   */
  async learnFromInteraction(data: SessionLearningData): Promise<UserLearningInsight[]> {
    const startTime = Date.now();
    
    try {
      // Constitutional validation first
      const validation = await this.constitutionalValidator.validate(
        `User interaction: ${data.messageContent.substring(0, 100)}...`
      );      if (!validation.passed) {
        console.warn('Constitutional validation failed for learning data:', validation.violations);
        return [];
      }

      // Generate insights from interaction
      const insights: UserLearningInsight[] = [];

      // Communication style learning
      const communicationInsight = await this.analyzeCommunicationPattern(data);
      if (communicationInsight) {
        insights.push(communicationInsight);
      }

      // Expertise level assessment
      const expertiseInsight = await this.analyzeExpertiseProgression(data);
      if (expertiseInsight) {
        insights.push(expertiseInsight);
      }

      // Apply insights to user profile
      if (insights.length > 0) {
        await this.applyLearningInsights(data.userId, insights);
      }

      await this.performanceMonitor.recordLatency('session_learning', Date.now() - startTime);
      return insights;

    } catch (error) {
      await this.performanceMonitor.recordError('session_learning', error as Error);
      console.error('Failed to learn from interaction:', error);
      return [];
    }
  }

  /**
   * Update session context with conversation insights
   */
  async updateSessionContext(sessionId: string, updates: Partial<SessionContext>): Promise<void> {
    try {
      const validation = await this.constitutionalValidator.validate(
        `Session update: ${JSON.stringify(updates)}`
      );

      if (!validation.passed) {
        console.warn('Constitutional validation failed for session update');
        return;
      }

      await this.memoryClient.updateSessionContext(sessionId, updates);
    } catch (error) {
      console.error('Failed to update session context:', error);
      throw error;
    }
  }

  /**
   * Get session context with privacy filtering
   */
  async getSessionContext(sessionId: string): Promise<SessionContext | null> {
    try {
      const context = await this.memoryClient.getSessionContext(sessionId);
      
      if (!context) {
        return null;
      }

      // Apply Constitutional AI privacy filtering
      return this.applyPrivacyFiltering(context);
    } catch (error) {
      console.error('Failed to get session context:', error);
      return null;
    }
  }

  // ========================================
  // Private Analysis Methods
  // ========================================

  private async analyzeCommunicationPattern(data: SessionLearningData): Promise<UserLearningInsight | null> {
    try {
      // Simple communication style detection based on message characteristics
      const messageLength = data.messageContent.length;
      const hasQuestions = data.messageContent.includes('?');
      const hasTechnicalTerms = /\b(function|class|interface|algorithm|database)\b/i.test(data.messageContent);

      let detectedStyle: CommunicationStyle = 'conversational';
      
      if (hasTechnicalTerms && messageLength > 100) {
        detectedStyle = 'technical';
      } else if (messageLength < 50) {
        detectedStyle = 'casual';
      } else if (!hasQuestions && messageLength > 200) {
        detectedStyle = 'formal';
      }

      if (detectedStyle !== data.communicationStyle) {
        return {
          insightType: 'communication_preference',
          confidence: 0.7,
          description: `User shows preference for ${detectedStyle} communication style`,
          evidence: [{ messageLength, hasQuestions, hasTechnicalTerms }],
          actionableChange: {
            profileUpdate: {
              preferredCommunicationStyle: detectedStyle
            }
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to analyze communication pattern:', error);
      return null;
    }
  }

  private async analyzeExpertiseProgression(data: SessionLearningData): Promise<UserLearningInsight | null> {
    try {
      // Simple expertise assessment based on task completion and satisfaction
      if (data.taskCompleted && data.userSatisfactionScore > 0.8) {
        const currentLevel = data.expertiseLevel;
        let suggestedLevel: ExpertiseLevel = currentLevel;

        // Suggest progression based on successful interactions
        if (currentLevel === 'beginner' && data.userSatisfactionScore > 0.9) {
          suggestedLevel = 'intermediate';
        } else if (currentLevel === 'intermediate' && data.userSatisfactionScore > 0.9) {
          suggestedLevel = 'advanced';
        }

        if (suggestedLevel !== currentLevel) {
          return {
            insightType: 'expertise_growth',
            confidence: 0.8,
            description: `User demonstrates readiness for ${suggestedLevel} level interactions`,
            evidence: [{ taskCompleted: data.taskCompleted, satisfaction: data.userSatisfactionScore }],
            actionableChange: {
              profileUpdate: {
                preferredTechnicalLevel: suggestedLevel
              }
            }
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to analyze expertise progression:', error);
      return null;
    }
  }

  private async applyLearningInsights(userId: string, insights: UserLearningInsight[]): Promise<void> {
    try {
      for (const insight of insights) {
        if (insight.actionableChange.profileUpdate) {
          await this.memoryClient.updateUserProfile(userId, insight.actionableChange.profileUpdate);
          console.log(`Applied learning insight for user ${userId}:`, insight.description);
        }
      }
    } catch (error) {
      console.error('Failed to apply learning insights:', error);
    }
  }

  private applyPrivacyFiltering(context: SessionContext): SessionContext {
    // Apply Constitutional AI privacy principles
    const filtered = { ...context };
    
    if (filtered.privacyModeActive) {
      // Remove sensitive conversation history details
      filtered.conversationHistory = filtered.conversationHistory.map(entry => ({
        ...entry,
        content: '[Privacy filtered]'
      }));
    }

    return filtered;
  }
}

export default SessionContextManager;
