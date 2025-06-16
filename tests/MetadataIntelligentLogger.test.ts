/**
 * MetadataIntelligentLogger Unit Tests - ALITA Phase 1
 * 
 * Testing Strategy:
 * - Performance Tests: Validate <50ms target
 * - Privacy Tests: Ensure sensitive data detection
 * - Constitutional Tests: Verify AI safety compliance
 * - Integration Tests: Confirm memory system compatibility
 * 
 * @version 1.0.0
 * @date 2025-06-15
 */

import { describe, test, expect, beforeEach, jest } from 'jest';
import { performance } from 'perf_hooks';
import {
  MetadataIntelligentLogger,
  IMetadataIntelligentLogger,
  UserMessage,
  AIResponse,
  UserFeedback,
  ExpertiseLevel,
  CommunicationStyle,
  PrivacyLevel,
  UserIntent,
  ContextDomain
} from '../coreagent/tools/MetadataIntelligentLogger';

// Mock Dependencies
const mockConstitutionalValidator = {
  validate: jest.fn(),
  assessPrivacy: jest.fn(),
  validatePattern: jest.fn()
};

const mockMemoryClient = {
  storeConversationMetadata: jest.fn(),
  updateUserProfile: jest.fn(),
  getConversationsInWindow: jest.fn()
};

const mockPerformanceMonitor = {
  recordLatency: jest.fn(),
  recordError: jest.fn(),
  getMetrics: jest.fn()
};

describe('MetadataIntelligentLogger - ALITA Phase 1', () => {
  let logger: IMetadataIntelligentLogger;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockConstitutionalValidator.validate.mockResolvedValue({
      passed: true,
      score: 95,
      violations: []
    });
    
    mockConstitutionalValidator.assessPrivacy.mockResolvedValue({
      passed: true,
      riskLevel: 'low',
      sensitiveDataDetected: false
    });
    
    mockMemoryClient.storeConversationMetadata.mockResolvedValue('metadata-id-123');
    
    mockPerformanceMonitor.getMetrics.mockResolvedValue({
      averageLatency: 25,
      errorRate: 0.01,
      successCount: 100,
      totalOperations: 101
    });
    
    logger = new MetadataIntelligentLogger(
      mockConstitutionalValidator as any,
      mockMemoryClient as any,
      mockPerformanceMonitor as any
    );
  });

  describe('Performance Requirements - <50ms Target', () => {
    test('message analysis completes within 50ms', async () => {
      const message: UserMessage = {
        id: 'msg-001',
        userId: 'user-001',
        sessionId: 'session-001',
        content: 'Can you help me implement a React component?',
        timestamp: new Date()
      };

      const startTime = performance.now();
      const result = await logger.analyzeMessage(message);
      const endTime = performance.now();
      
      const actualTime = endTime - startTime;
      
      expect(actualTime).toBeLessThan(50);
      expect(result.processingTimeMs).toBeLessThan(50);
      expect(mockPerformanceMonitor.recordLatency).toHaveBeenCalledWith(
        'message_analysis', 
        expect.any(Number)
      );
    });

    test('response analysis completes within 50ms', async () => {
      const response: AIResponse = {
        id: 'resp-001',
        userId: 'user-001',
        sessionId: 'session-001',
        content: 'Here is a React component implementation because...',
        timestamp: new Date()
      };

      const startTime = performance.now();
      const result = await logger.analyzeResponse(response);
      const endTime = performance.now();
      
      const actualTime = endTime - startTime;
      
      expect(actualTime).toBeLessThan(50);
      expect(result.processingTimeMs).toBeLessThan(50);
    });
  });

  describe('Privacy Detection - Constitutional Compliance', () => {
    test('detects sensitive information correctly', async () => {
      const sensitiveData = [
        'My SSN is 123-45-6789',
        'Email me at john.doe@example.com',
        'My password is secret123',
        'Call me at 555-123-4567'
      ];

      for (const content of sensitiveData) {
        const privacyLevel = await logger.detectPrivacyLevel(content);
        expect(privacyLevel).toBe(PrivacyLevel.SENSITIVE);
      }
    });

    test('correctly identifies public content', async () => {
      const publicContent = 'How do I implement a sorting algorithm?';
      const privacyLevel = await logger.detectPrivacyLevel(publicContent);
      expect(privacyLevel).toBe(PrivacyLevel.PUBLIC);
    });

    test('handles constitutional validator restrictions', async () => {
      mockConstitutionalValidator.assessPrivacy.mockResolvedValue({
        passed: false,
        riskLevel: 'high',
        sensitiveDataDetected: true
      });

      const content = 'Some restricted content';
      const privacyLevel = await logger.detectPrivacyLevel(content);
      expect(privacyLevel).toBe(PrivacyLevel.RESTRICTED);
    });
  });

  describe('Expertise Level Detection', () => {
    test('correctly identifies beginner level', async () => {
      const message: UserMessage = {
        id: 'msg-002',
        userId: 'user-002',
        sessionId: 'session-002',
        content: 'What is programming?',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.expertiseLevel).toBe(ExpertiseLevel.BEGINNER);
    });

    test('correctly identifies expert level', async () => {
      const message: UserMessage = {
        id: 'msg-003',
        userId: 'user-003',
        sessionId: 'session-003',
        content: 'Can you help optimize this algorithm using dynamic programming and memoization techniques for better time complexity?',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.expertiseLevel).toBe(ExpertiseLevel.EXPERT);
    });
  });

  describe('Communication Style Detection', () => {
    test('detects formal communication style', async () => {
      const message: UserMessage = {
        id: 'msg-004',
        userId: 'user-004',
        sessionId: 'session-004',
        content: 'Could you please kindly assist me with this implementation? Thank you.',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.communicationStyle).toBe(CommunicationStyle.FORMAL);
    });

    test('detects casual communication style', async () => {
      const message: UserMessage = {
        id: 'msg-005',
        userId: 'user-005',
        sessionId: 'session-005',
        content: 'Hey! Can you help me with this cool feature? Thanks!',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.communicationStyle).toBe(CommunicationStyle.CASUAL);
    });

    test('detects technical communication style', async () => {
      const message: UserMessage = {
        id: 'msg-006',
        userId: 'user-006',
        sessionId: 'session-006',
        content: 'I need to refactor this function and update the method parameters.',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.communicationStyle).toBe(CommunicationStyle.TECHNICAL);
    });
  });

  describe('Intent Classification', () => {
    test('correctly identifies question intent', async () => {
      const message: UserMessage = {
        id: 'msg-007',
        userId: 'user-007',
        sessionId: 'session-007',
        content: 'How does React hooks work?',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.intent).toBe(UserIntent.QUESTION);
    });

    test('correctly identifies task request intent', async () => {
      const message: UserMessage = {
        id: 'msg-008',
        userId: 'user-008',
        sessionId: 'session-008',
        content: 'Please create a login component for me.',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.intent).toBe(UserIntent.TASK_REQUEST);
    });
  });

  describe('Context Domain Detection', () => {
    test('detects work domain', async () => {
      const message: UserMessage = {
        id: 'msg-009',
        userId: 'user-009',
        sessionId: 'session-009',
        content: 'I need this for our client project deadline.',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.contextDomain).toBe(ContextDomain.WORK);
    });

    test('detects technical domain', async () => {
      const message: UserMessage = {
        id: 'msg-010',
        userId: 'user-010',
        sessionId: 'session-010',
        content: 'Help me debug this programming algorithm.',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.contextDomain).toBe(ContextDomain.TECHNICAL);
    });
  });

  describe('Constitutional AI Integration', () => {
    test('validates all messages through constitutional validator', async () => {
      const message: UserMessage = {
        id: 'msg-011',
        userId: 'user-011',
        sessionId: 'session-011',
        content: 'Test message for constitutional validation',
        timestamp: new Date()
      };

      await logger.analyzeMessage(message);
      
      expect(mockConstitutionalValidator.validate).toHaveBeenCalledWith(
        message.content
      );
    });

    test('handles constitutional validation failures', async () => {
      mockConstitutionalValidator.validate.mockResolvedValue({
        passed: false,
        score: 30,
        violations: ['transparency']
      });

      const message: UserMessage = {
        id: 'msg-012',
        userId: 'user-012',
        sessionId: 'session-012',
        content: 'Message that fails constitutional validation',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.constitutionalCompliant).toBe(false);
    });
  });

  describe('Response Quality Assessment', () => {
    test('assesses response transparency based on reasoning explanations', async () => {
      const response: AIResponse = {
        id: 'resp-002',
        userId: 'user-002',
        sessionId: 'session-002',
        content: 'I recommend this approach because it provides better performance. The reason this works is due to efficient memory usage.',
        timestamp: new Date()
      };

      const result = await logger.analyzeResponse(response);
      expect(result.transparencyScore).toBeGreaterThan(0);
    });

    test('incorporates user feedback into helpfulness assessment', async () => {
      const response: AIResponse = {
        id: 'resp-003',
        userId: 'user-003',
        sessionId: 'session-003',
        content: 'Here is the solution you requested.',
        timestamp: new Date()
      };

      const feedback: UserFeedback = {
        helpfulnessScore: 0.9,
        satisfactionScore: 0.85,
        comments: 'Very helpful response!'
      };

      const result = await logger.analyzeResponse(response, feedback);
      expect(result.helpfulnessScore).toBe(0.9);
    });
  });

  describe('Memory Integration', () => {
    test('stores conversation metadata after analysis', async () => {
      const message: UserMessage = {
        id: 'msg-013',
        userId: 'user-013',
        sessionId: 'session-013',
        content: 'Test message for memory integration',
        timestamp: new Date()
      };

      await logger.analyzeMessage(message);
      
      expect(mockMemoryClient.storeConversationMetadata).toHaveBeenCalledWith({
        messageAnalysis: expect.objectContaining({
          messageId: 'msg-013',
          userId: 'user-013'
        }),
        userId: 'user-013',
        sessionId: 'session-013'
      });
    });
  });

  describe('Error Handling', () => {
    test('handles analysis errors gracefully', async () => {
      mockConstitutionalValidator.validate.mockRejectedValue(
        new Error('Constitutional validator error')
      );

      const message: UserMessage = {
        id: 'msg-014',
        userId: 'user-014',
        sessionId: 'session-014',
        content: 'Message that causes error',
        timestamp: new Date()
      };

      await expect(logger.analyzeMessage(message)).rejects.toThrow(
        'Message analysis failed:'
      );
      
      expect(mockPerformanceMonitor.recordError).toHaveBeenCalled();
    });
  });

  describe('Performance Metrics', () => {
    test('returns comprehensive performance metrics', async () => {
      const metrics = await logger.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('messageAnalysis');
      expect(metrics).toHaveProperty('responseAnalysis');
      expect(metrics).toHaveProperty('averageLatency');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics.averageLatency).toBe(25); // Based on mock data
    });
  });

  describe('Satisfaction Indicator Detection', () => {
    test('detects positive satisfaction indicators', async () => {
      const message: UserMessage = {
        id: 'msg-015',
        userId: 'user-015',
        sessionId: 'session-015',
        content: 'Thank you! That was perfect and very helpful.',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.satisfactionIndicators).toHaveLength(1);
      expect(result.satisfactionIndicators[0].type).toBe('positive');
      expect(result.satisfactionIndicators[0].confidence).toBeGreaterThan(0.5);
    });

    test('detects negative satisfaction indicators', async () => {
      const message: UserMessage = {
        id: 'msg-016',
        userId: 'user-016',
        sessionId: 'session-016',
        content: 'This is wrong and confusing. I am frustrated.',
        timestamp: new Date()
      };

      const result = await logger.analyzeMessage(message);
      expect(result.satisfactionIndicators).toHaveLength(1);
      expect(result.satisfactionIndicators[0].type).toBe('negative');
    });
  });
});

// Integration Test Suite
describe('MetadataIntelligentLogger Integration Tests', () => {
  test('end-to-end conversation analysis workflow', async () => {
    const logger = new MetadataIntelligentLogger(
      mockConstitutionalValidator as any,
      mockMemoryClient as any,
      mockPerformanceMonitor as any
    );

    // Simulate complete conversation flow
    const userMessage: UserMessage = {
      id: 'msg-integration-001',
      userId: 'user-integration-001',
      sessionId: 'session-integration-001',
      content: 'Can you please help me implement a secure authentication system? Thank you.',
      timestamp: new Date()
    };

    const aiResponse: AIResponse = {
      id: 'resp-integration-001',
      userId: 'user-integration-001',
      sessionId: 'session-integration-001',
      content: 'I can help you implement a secure authentication system because security is crucial for user data protection. The reason I recommend JWT tokens is due to their stateless nature.',
      timestamp: new Date()
    };

    const userFeedback: UserFeedback = {
      helpfulnessScore: 0.9,
      satisfactionScore: 0.85,
      comments: 'Great explanation!'
    };

    // Analyze message
    const messageAnalysis = await logger.analyzeMessage(userMessage);
    expect(messageAnalysis.expertiseLevel).toBe(ExpertiseLevel.INTERMEDIATE);
    expect(messageAnalysis.communicationStyle).toBe(CommunicationStyle.FORMAL);
    expect(messageAnalysis.intent).toBe(UserIntent.TASK_REQUEST);
    expect(messageAnalysis.contextDomain).toBe(ContextDomain.TECHNICAL);

    // Analyze response
    const responseAnalysis = await logger.analyzeResponse(aiResponse, userFeedback);
    expect(responseAnalysis.helpfulnessScore).toBe(0.9);
    expect(responseAnalysis.transparencyScore).toBeGreaterThan(0);

    // Verify all data was stored
    expect(mockMemoryClient.storeConversationMetadata).toHaveBeenCalledTimes(2);
  });
});
