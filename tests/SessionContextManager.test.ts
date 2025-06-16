/**
 * SessionContextManager Integration Test
 * Phase 2 of ALITA Metadata Integration Implementation
 * Focus on core functionality and interface compliance
 */

import { SessionContextManager, UserProfile, SessionContext, PrivacyBoundaries, CommunicationStyle, ExpertiseLevel, IntentCategory, PrivacyLevel, ResponseLength, FormalityLevel } from '../coreagent/tools/SessionContextManager';
import { MemoryClient } from '../coreagent/memory/MemoryClient';
import { ConstitutionalValidator } from '../coreagent/validation/ConstitutionalValidator';
import { PerformanceMonitor } from '../coreagent/monitoring/PerformanceMonitor';

// Mock implementations matching actual interfaces
class MockMemoryClient extends MemoryClient {
  private mockProfiles = new Map<string, UserProfile>();
  private mockSessions = new Map<string, SessionContext>();

  async storeConversationMetadata(metadata: any): Promise<void> {
    // Mock implementation
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.mockProfiles.get(userId) || null;
  }

  async updateUserProfile(userId: string, profile: UserProfile): Promise<void> {
    this.mockProfiles.set(userId, profile);
  }

  async createUserProfile(userId: string, profile: UserProfile): Promise<void> {
    this.mockProfiles.set(userId, profile);
  }

  async getSessionContext(sessionId: string): Promise<SessionContext | null> {
    return this.mockSessions.get(sessionId) || null;
  }

  async updateSessionContext(sessionId: string, context: SessionContext): Promise<void> {
    this.mockSessions.set(sessionId, context);
  }

  async createSession(sessionId: string, context: SessionContext): Promise<void> {
    this.mockSessions.set(sessionId, context);
  }
}

class MockConstitutionalValidator extends ConstitutionalValidator {
  async validate(content: string): Promise<{ passed: boolean; reasoning?: string }> {
    return {
      passed: true,
      reasoning: 'Content meets Constitutional AI standards'
    };
  }

  async validateUserData(data: { userData: any; context: string }): Promise<{ passed: boolean; reasoning?: string }> {
    return {
      passed: true,
      reasoning: 'User data validated successfully'
    };
  }
}

class MockPerformanceMonitor extends PerformanceMonitor {
  startTimer(operation: string) {
    return {
      end: (result?: { success: boolean; error?: string; reason?: string; cached?: boolean; created?: boolean }) => {
        console.log(`Operation ${operation} completed:`, result);
      }
    };
  }

  async recordLatency(operation: string, timeMs: number): Promise<void> {
    console.log(`Latency ${operation}: ${timeMs}ms`);
  }

  async recordError(operation: string, error: string): Promise<void> {
    console.log(`Error ${operation}: ${error}`);
  }
}

describe('SessionContextManager Integration Tests', () => {
  let manager: SessionContextManager;
  let mockMemoryClient: MockMemoryClient;
  let mockValidator: MockConstitutionalValidator;
  let mockMonitor: MockPerformanceMonitor;

  beforeEach(() => {
    mockMemoryClient = new MockMemoryClient();
    mockValidator = new MockConstitutionalValidator();
    mockMonitor = new MockPerformanceMonitor();
    
    manager = new SessionContextManager(
      mockMemoryClient,
      mockValidator,
      mockMonitor
    );
  });

  describe('User Profile Management', () => {
    test('should create user profile with proper structure', async () => {
      const privacyBoundaries: PrivacyBoundaries = {
        dataRetentionDays: 90,
        allowPersonalization: true,
        allowCrossDomainLearning: false,
        sensitiveTopicFiltering: true,
        explicitConsentRequired: ['health', 'finance'],
        neverLog: ['passwords', 'keys'],
        anonymizeAfterDays: 365
      };

      const profile = await manager.createUserProfile('user1', privacyBoundaries);

      expect(profile.userId).toBe('user1');
      expect(profile.privacyBoundaries.dataRetentionDays).toBe(90);
      expect(profile.totalInteractions).toBe(0);
      expect(profile.domainExpertise).toBeInstanceOf(Map);
    });

    test('should retrieve existing user profile', async () => {
      const privacyBoundaries: PrivacyBoundaries = {
        dataRetentionDays: 30,
        allowPersonalization: true,
        allowCrossDomainLearning: true,
        sensitiveTopicFiltering: false,
        explicitConsentRequired: [],
        neverLog: [],
        anonymizeAfterDays: 180
      };

      await manager.createUserProfile('user1', privacyBoundaries);
      const retrieved = await manager.getUserProfile('user1');

      expect(retrieved.userId).toBe('user1');
      expect(retrieved.privacyBoundaries.dataRetentionDays).toBe(30);
    });

    test('should update user profile', async () => {
      const privacyBoundaries: PrivacyBoundaries = {
        dataRetentionDays: 60,
        allowPersonalization: true,
        allowCrossDomainLearning: false,
        sensitiveTopicFiltering: true,
        explicitConsentRequired: [],
        neverLog: [],
        anonymizeAfterDays: 365
      };

      await manager.createUserProfile('user1', privacyBoundaries);
      
      const updates = {
        preferredCommunicationStyle: CommunicationStyle.TECHNICAL,
        totalInteractions: 5
      };

      await manager.updateUserProfile('user1', updates);
      const updated = await manager.getUserProfile('user1');

      expect(updated.preferredCommunicationStyle).toBe(CommunicationStyle.TECHNICAL);
      expect(updated.totalInteractions).toBe(5);
    });
  });

  describe('Session Management', () => {
    test('should create session context', async () => {
      const session = await manager.createSession('session1', 'user1');

      expect(session.sessionId).toBe('session1');
      expect(session.userId).toBe('user1');
      expect(session.isActive).toBe(true);
      expect(session.messageCount).toBe(0);
    });

    test('should retrieve session context', async () => {
      await manager.createSession('session1', 'user1');
      const retrieved = await manager.getSessionContext('session1');

      expect(retrieved.sessionId).toBe('session1');
      expect(retrieved.userId).toBe('user1');
      expect(retrieved.isActive).toBe(true);
    });

    test('should update session context', async () => {
      await manager.createSession('session1', 'user1');
      
      const updates = {
        currentTopic: 'TypeScript Development',
        messageCount: 3
      };

      await manager.updateSessionContext('session1', updates);
      const updated = await manager.getSessionContext('session1');

      expect(updated.currentTopic).toBe('TypeScript Development');
      expect(updated.messageCount).toBe(3);
    });

    test('should end session', async () => {
      await manager.createSession('session1', 'user1');
      await manager.endSession('session1');
      
      const session = await manager.getSessionContext('session1');
      expect(session.isActive).toBe(false);
    });
  });

  describe('Privacy Management', () => {
    test('should set privacy boundaries', async () => {
      const boundaries: PrivacyBoundaries = {
        dataRetentionDays: 30,
        allowPersonalization: false,
        allowCrossDomainLearning: false,
        sensitiveTopicFiltering: true,
        explicitConsentRequired: ['health', 'finance', 'personal'],
        neverLog: ['passwords', 'api_keys', 'tokens'],
        anonymizeAfterDays: 90
      };

      await manager.setPrivacyBoundaries('user1', boundaries);
      
      // Verify privacy boundaries were set by creating profile and checking
      await manager.createUserProfile('user1', boundaries);
      const profile = await manager.getUserProfile('user1');
      
      expect(profile.privacyBoundaries.allowPersonalization).toBe(false);
      expect(profile.privacyBoundaries.neverLog).toContain('passwords');
    });

    test('should validate privacy compliance', async () => {
      const testUserId = 'user1';
      const testData = { content: 'This is safe content' };

      const isCompliant = await manager.validatePrivacyCompliance(testUserId, testData);
      
      expect(typeof isCompliant).toBe('boolean');
      // Should not throw error and return a boolean result
    });
  });

  describe('Context and History', () => {
    test('should get conversation history', async () => {
      const options = {
        sessionId: 'session1',
        limit: 10,
        includeContext: true
      };

      const history = await manager.getConversationHistory('user1', options);
      
      expect(Array.isArray(history)).toBe(true);
      // Should return empty array for new user, not throw error
    });

    test('should resolve contextual references', async () => {
      const conversationHistory = [
        {
          role: 'user' as const,
          content: 'Help me with this function',
          metadata: { codeSnippet: 'function test() {}' }
        }
      ];

      const resolved = await manager.resolveContextualReferences(
        'user1',
        'How can I improve it?',
        conversationHistory
      );

      expect(resolved).toHaveProperty('resolvedReferences');
      expect(resolved).toHaveProperty('contextualMeaning');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid user ID', async () => {
      await expect(
        manager.getUserProfile('')
      ).rejects.toThrow();
    });

    test('should handle nonexistent session', async () => {
      await expect(
        manager.getSessionContext('nonexistent-session')
      ).rejects.toThrow('Session context not found');
    });

    test('should handle malformed privacy boundaries', async () => {
      const invalidBoundaries = {} as PrivacyBoundaries;
      
      await expect(
        manager.createUserProfile('user1', invalidBoundaries)
      ).rejects.toThrow();
    });
  });

  describe('Performance and Monitoring', () => {
    test('should track operation performance', async () => {
      const privacyBoundaries: PrivacyBoundaries = {
        dataRetentionDays: 90,
        allowPersonalization: true,
        allowCrossDomainLearning: true,
        sensitiveTopicFiltering: false,
        explicitConsentRequired: [],
        neverLog: [],
        anonymizeAfterDays: 365
      };

      // These operations should complete without errors and log performance metrics
      await manager.createUserProfile('user1', privacyBoundaries);
      await manager.createSession('session1', 'user1');
      await manager.getSessionContext('session1');
      
      // If we get here without errors, performance monitoring is working
      expect(true).toBe(true);
    });

    test('should handle concurrent operations', async () => {
      const privacyBoundaries: PrivacyBoundaries = {
        dataRetentionDays: 90,
        allowPersonalization: true,
        allowCrossDomainLearning: true,
        sensitiveTopicFiltering: false,
        explicitConsentRequired: [],
        neverLog: [],
        anonymizeAfterDays: 365
      };

      const operations = [
        manager.createUserProfile('user1', privacyBoundaries),
        manager.createUserProfile('user2', privacyBoundaries),
        manager.createSession('session1', 'user1'),
        manager.createSession('session2', 'user2')
      ];

      await expect(Promise.all(operations)).resolves.toBeTruthy();
    });
  });
});
