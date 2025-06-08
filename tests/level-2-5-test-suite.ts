/**
 * Comprehensive Test Suite for Level 2.5 - Security Foundation + Integration Bridges
 * 
 * Tests all components implemented in Phase 1a (Security Foundation) and Phase 1b (Integration Bridges)
 */

import { RequestValidator } from '../coreagent/validation/requestValidator';
import { SimpleAuditLogger } from '../coreagent/audit/auditLogger';
import { SecureErrorHandler } from '../coreagent/utils/secureErrorHandler';
import MemoryBridge from '../coreagent/integration/memoryBridge';
import PerformanceBridge from '../coreagent/integration/performanceBridge';
import ContextManager from '../coreagent/integration/contextManager';
import EnhancedRequestRouter from '../coreagent/integration/enhancedRequestRouter';

// Mock implementations for testing
class MockMemoryIntelligence {
  async semanticSearch(query: string, limit: number, threshold: number, userId?: string) {
    return [
      { id: '1', content: 'Mock result 1', score: 0.9 },
      { id: '2', content: 'Mock result 2', score: 0.8 }
    ];
  }

  async getMemory(memoryId: string, userId?: string) {
    return { id: memoryId, content: 'Mock memory content', userId };
  }

  async storeMemory(content: string, metadata: Record<string, any>, userId?: string) {
    return `mock_memory_${Date.now()}`;
  }

  async getAnalytics(userId?: string) {
    return {
      totalMemories: 100,
      categoryBreakdown: { 'general': 50, 'technical': 30, 'personal': 20 },
      averageImportance: 0.7
    };
  }
}

class MockPerformanceAPI {
  async recordEvent(eventType: string, data: any) {
    console.log(`Performance event recorded: ${eventType}`, data);
  }
}

class MockUser {
  id = 'test-user-123';
  name = 'Test User';
  email = 'test@example.com';
  preferences = {};
  permissions = ['basic', 'development'];
  customInstructions = 'I prefer TypeScript and detailed explanations';
}

/**
 * Test runner for Level 2.5 components
 */
class Level25TestSuite {
  private testResults: Array<{ component: string; test: string; passed: boolean; error?: string }> = [];
  
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Level 2.5 Test Suite - Security Foundation + Integration Bridges\n');
    
    // Phase 1a - Security Foundation Tests
    await this.testRequestValidator();
    await this.testSimpleAuditLogger();
    await this.testSecureErrorHandler();
    
    // Phase 1b - Integration Bridges Tests
    await this.testMemoryBridge();
    await this.testPerformanceBridge();
    await this.testContextManager();
    await this.testEnhancedRequestRouter();
    
    // Integration Tests
    await this.testComponentIntegration();
    
    this.printTestResults();
  }

  /**
   * Phase 1a Tests - Security Foundation
   */
  async testRequestValidator(): Promise<void> {
    console.log('🔒 Testing RequestValidator...');
    
    try {
      const validator = new RequestValidator();
      
      // Test valid request
      const validRequest = {
        prompt: 'Hello, world!',
        agentType: 'research',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      };
      
      const validResult = validator.validateRequest(validRequest);
      this.recordTest('RequestValidator', 'Valid request validation', validResult.isValid);
      
      // Test invalid request
      const invalidRequest = {
        prompt: '', // Empty prompt
        agentType: 'unknown-agent'
      };
      
      const invalidResult = validator.validateRequest(invalidRequest);
      this.recordTest('RequestValidator', 'Invalid request rejection', !invalidResult.isValid);
      
      // Test input sanitization
      const sanitized = validator.sanitizeInput('<script>alert("xss")</script>Hello');
      this.recordTest('RequestValidator', 'Input sanitization', !sanitized.includes('<script>'));
      
      // Test quick validation
      const quickValid = validator.quickValidate('Valid prompt', 'research');
      this.recordTest('RequestValidator', 'Quick validation', quickValid);
      
      console.log('  ✅ RequestValidator tests completed');
      
    } catch (error) {
      this.recordTest('RequestValidator', 'General functionality', false, error.message);
      console.log('  ❌ RequestValidator tests failed:', error.message);
    }
  }

  async testSimpleAuditLogger(): Promise<void> {
    console.log('📝 Testing SimpleAuditLogger...');
    
    try {
      const logger = new SimpleAuditLogger({
        logDirectory: './test-logs',
        enableConsoleOutput: false,
        bufferSize: 5
      });
      
      // Test different log levels
      await logger.logInfo('TEST', 'Test info message');
      await logger.logWarning('TEST', 'Test warning message');
      await logger.logError('TEST', 'Test error message');
      await logger.logSecurity('TEST', 'Test security message');
      
      // Test request logging
      await logger.logRequest(
        'user-123',
        'session-456',
        'research',
        'req-789',
        'Test request logged'
      );
      
      // Test validation logging
      await logger.logValidation('req-123', true, [], ['Minor warning']);
      
      const stats = logger.getStats();
      this.recordTest('SimpleAuditLogger', 'Basic logging operations', true);
      this.recordTest('SimpleAuditLogger', 'Stats tracking', stats.bufferSize >= 0);
      
      await logger.shutdown();
      console.log('  ✅ SimpleAuditLogger tests completed');
      
    } catch (error) {
      this.recordTest('SimpleAuditLogger', 'General functionality', false, error.message);
      console.log('  ❌ SimpleAuditLogger tests failed:', error.message);
    }
  }

  async testSecureErrorHandler(): Promise<void> {
    console.log('🛡️ Testing SecureErrorHandler...');
    
    try {
      const errorHandler = new SecureErrorHandler({
        includeDebugInfo: true,
        enableDetailedLogging: false // Disable for testing
      });
      
      // Test basic error handling
      const testError = new Error('Test error message');
      testError.stack = 'Error: Test error\n    at /home/user/sensitive/path/file.js:123:45';
      
      const errorResponse = await errorHandler.handleError(testError, {
        requestId: 'req-123',
        userId: 'user-456'
      });
      
      this.recordTest('SecureErrorHandler', 'Error response format', !errorResponse.success);
      this.recordTest('SecureErrorHandler', 'Error sanitization', !errorResponse.error.message.includes('sensitive'));
      
      // Test validation error handling
      const validationResponse = await errorHandler.handleValidationError(
        ['Invalid input'],
        ['Warning message'],
        { requestId: 'req-456' }
      );
      
      this.recordTest('SecureErrorHandler', 'Validation error handling', 
        validationResponse.error.category === 'VALIDATION');
      
      // Test success response creation
      const successResponse = errorHandler.createSuccessResponse({ data: 'test' }, 'req-789');
      this.recordTest('SecureErrorHandler', 'Success response creation', successResponse.success);
      
      console.log('  ✅ SecureErrorHandler tests completed');
      
    } catch (error) {
      this.recordTest('SecureErrorHandler', 'General functionality', false, error.message);
      console.log('  ❌ SecureErrorHandler tests failed:', error.message);
    }
  }

  /**
   * Phase 1b Tests - Integration Bridges
   */
  async testMemoryBridge(): Promise<void> {
    console.log('🧠 Testing MemoryBridge...');
    
    try {
      const mockMemoryIntelligence = new MockMemoryIntelligence();
      const mockPerformanceAPI = new MockPerformanceAPI();
      
      const memoryBridge = new MemoryBridge(
        mockMemoryIntelligence as any,
        mockPerformanceAPI as any,
        {
          enablePerformanceTracking: true,
          enableCaching: true
        }
      );
      
      // Test memory search with performance tracking
      const searchResult = await memoryBridge.performSearch('test query', {
        userId: 'user-123',
        requestId: 'req-456'
      });
      
      this.recordTest('MemoryBridge', 'Search with performance tracking', 
        searchResult.results.length > 0 && searchResult.metadata.searchTime > 0);
      
      // Test memory retrieval
      const memory = await memoryBridge.retrieveMemory('memory-123', {
        userId: 'user-123'
      });
      
      this.recordTest('MemoryBridge', 'Memory retrieval', memory.id === 'memory-123');
      
      // Test memory storage
      const memoryId = await memoryBridge.storeMemory(
        'Test memory content',
        { category: 'test' },
        { userId: 'user-123' }
      );
      
      this.recordTest('MemoryBridge', 'Memory storage', memoryId.startsWith('mock_memory_'));
      
      // Test analytics
      const analytics = await memoryBridge.getMemoryAnalytics('user-123');
      this.recordTest('MemoryBridge', 'Analytics retrieval', 
        analytics.intelligence && analytics.performance && analytics.cacheStats);
      
      console.log('  ✅ MemoryBridge tests completed');
      
    } catch (error) {
      this.recordTest('MemoryBridge', 'General functionality', false, error.message);
      console.log('  ❌ MemoryBridge tests failed:', error.message);
    }
  }

  async testPerformanceBridge(): Promise<void> {
    console.log('⚡ Testing PerformanceBridge...');
    
    try {
      const mockPerformanceAPI = new MockPerformanceAPI();
      
      const performanceBridge = new PerformanceBridge(
        mockPerformanceAPI as any,
        {
          enableRealTimeMonitoring: true,
          monitoringInterval: 1000
        }
      );
      
      // Test operation tracking
      const result = await performanceBridge.trackOperation(
        'test-component',
        'test-operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
          return 'operation result';
        },
        { userId: 'user-123' }
      );
      
      this.recordTest('PerformanceBridge', 'Operation tracking', result === 'operation result');
      
      // Test component performance retrieval
      const componentPerf = await performanceBridge.getComponentPerformance('test-component');
      this.recordTest('PerformanceBridge', 'Component performance tracking', 
        componentPerf && componentPerf.componentName === 'test-component');
      
      // Test analytics
      const analytics = await performanceBridge.getPerformanceAnalytics();
      this.recordTest('PerformanceBridge', 'Performance analytics', 
        analytics.systemSummary && analytics.components);
      
      // Test system metrics recording
      await performanceBridge.recordSystemMetrics();
      this.recordTest('PerformanceBridge', 'System metrics recording', true);
      
      await performanceBridge.shutdown();
      console.log('  ✅ PerformanceBridge tests completed');
      
    } catch (error) {
      this.recordTest('PerformanceBridge', 'General functionality', false, error.message);
      console.log('  ❌ PerformanceBridge tests failed:', error.message);
    }
  }

  async testContextManager(): Promise<void> {
    console.log('🌐 Testing ContextManager...');
    
    try {
      const contextManager = new ContextManager({
        enablePerformanceOptimization: true,
        enableSecurityChecks: true
      });
      
      const mockUser = new MockUser();
      const mockRequest = {
        requestId: 'req-123',
        sessionId: 'session-456',
        prompt: 'Test prompt',
        agentType: 'research',
        metadata: { test: true }
      };
      
      // Test enriched context creation
      const enrichedContext = await contextManager.createEnrichedContext(
        mockRequest as any,
        mockUser as any,
        { customInstructions: 'Test instructions' }
      );
      
      this.recordTest('ContextManager', 'Enriched context creation', 
        enrichedContext.request && enrichedContext.user && enrichedContext.session);
      
      // Test rate limiting
      const rateLimitCheck = await contextManager.checkRateLimit('user-123');
      this.recordTest('ContextManager', 'Rate limit checking', 
        typeof rateLimitCheck.allowed === 'boolean');
      
      // Test context analytics
      const analytics = await contextManager.getContextAnalytics();
      this.recordTest('ContextManager', 'Context analytics', 
        typeof analytics.activeSessions === 'number');
      
      // Test session management
      const session = await contextManager.getSession('session-456');
      this.recordTest('ContextManager', 'Session management', session !== null);
      
      await contextManager.shutdown();
      console.log('  ✅ ContextManager tests completed');
      
    } catch (error) {
      this.recordTest('ContextManager', 'General functionality', false, error.message);
      console.log('  ❌ ContextManager tests failed:', error.message);
    }
  }

  async testEnhancedRequestRouter(): Promise<void> {
    console.log('🔀 Testing EnhancedRequestRouter...');
    
    try {
      const contextManager = new ContextManager();
      const performanceAPI = new MockPerformanceAPI();
      const performanceBridge = new PerformanceBridge(performanceAPI as any);
      
      const router = new EnhancedRequestRouter(
        contextManager,
        performanceBridge,
        {
          enableSecurityValidation: true,
          enableContextAwareRouting: true,
          fallbackAgent: 'generic-gemini'
        }
      );
      
      // Register test agents
      await router.registerAgent('research', { name: 'Research Agent' });
      await router.registerAgent('dev', { name: 'Development Agent' });
      await router.registerAgent('generic-gemini', { name: 'Generic Agent' });
      
      const mockUser = new MockUser();
      const mockRequest = {
        requestId: 'req-123',
        prompt: 'Test research query',
        agentType: 'research',
        metadata: {}
      };
      
      // Test request routing
      const routingDecision = await router.routeRequest(mockRequest as any, mockUser as any);
      
      this.recordTest('EnhancedRequestRouter', 'Request routing', 
        routingDecision.selectedAgent && routingDecision.confidence > 0);
      
      this.recordTest('EnhancedRequestRouter', 'Security checks', 
        routingDecision.securityChecks.validation && 
        typeof routingDecision.securityChecks.rateLimit === 'boolean');
      
      // Test available agents
      const availableAgents = router.getAvailableAgents();
      this.recordTest('EnhancedRequestRouter', 'Agent registration', 
        availableAgents.includes('research') && availableAgents.includes('dev'));
      
      console.log('  ✅ EnhancedRequestRouter tests completed');
      
    } catch (error) {
      this.recordTest('EnhancedRequestRouter', 'General functionality', false, error.message);
      console.log('  ❌ EnhancedRequestRouter tests failed:', error.message);
    }
  }

  /**
   * Integration Tests
   */
  async testComponentIntegration(): Promise<void> {
    console.log('🔗 Testing Component Integration...');
    
    try {
      // Test that all components can work together
      const contextManager = new ContextManager();
      const performanceAPI = new MockPerformanceAPI();
      const performanceBridge = new PerformanceBridge(performanceAPI as any);
      const memoryIntelligence = new MockMemoryIntelligence();
      const memoryBridge = new MemoryBridge(memoryIntelligence as any, performanceAPI as any);
      
      const router = new EnhancedRequestRouter(contextManager, performanceBridge);
      
      // Test full workflow
      const mockUser = new MockUser();
      const mockRequest = {
        requestId: 'req-integration-test',
        prompt: 'Integration test prompt',
        agentType: 'research',
        metadata: { integrationTest: true }
      };
      
      // 1. Route request
      await router.registerAgent('research', { name: 'Research Agent' });
      const routingDecision = await router.routeRequest(mockRequest as any, mockUser as any);
      
      // 2. Create enriched context
      const enrichedContext = await contextManager.createEnrichedContext(
        mockRequest as any,
        mockUser as any
      );
      
      // 3. Perform memory search
      const searchResult = await memoryBridge.performSearch('integration test', {
        requestId: mockRequest.requestId,
        userId: mockUser.id
      });
      
      this.recordTest('Integration', 'Full workflow execution', 
        routingDecision.selectedAgent && enrichedContext.request && searchResult.results.length > 0);
      
      this.recordTest('Integration', 'Cross-component data flow', 
        enrichedContext.request.requestId === mockRequest.requestId);
      
      console.log('  ✅ Component Integration tests completed');
      
    } catch (error) {
      this.recordTest('Integration', 'Component integration', false, error.message);
      console.log('  ❌ Component Integration tests failed:', error.message);
    }
  }

  /**
   * Helper methods
   */
  private recordTest(component: string, test: string, passed: boolean, error?: string): void {
    this.testResults.push({ component, test, passed, error });
  }

  private printTestResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(80));
    
    const componentGroups = new Map<string, Array<typeof this.testResults[0]>>();
    
    this.testResults.forEach(result => {
      if (!componentGroups.has(result.component)) {
        componentGroups.set(result.component, []);
      }
      componentGroups.get(result.component)!.push(result);
    });
    
    let totalTests = 0;
    let passedTests = 0;
    
    for (const [component, tests] of componentGroups) {
      const componentPassed = tests.filter(t => t.passed).length;
      const componentTotal = tests.length;
      const componentStatus = componentPassed === componentTotal ? '✅' : '❌';
      
      console.log(`\n${componentStatus} ${component}: ${componentPassed}/${componentTotal} tests passed`);
      
      tests.forEach(test => {
        const status = test.passed ? '  ✅' : '  ❌';
        console.log(`${status} ${test.test}`);
        if (!test.passed && test.error) {
          console.log(`     Error: ${test.error}`);
        }
      });
      
      totalTests += componentTotal;
      passedTests += componentPassed;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`🎯 Overall Results: ${passedTests}/${totalTests} tests passed (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All Level 2.5 tests passed! Security Foundation + Integration Bridges are operational.');
    } else {
      console.log('⚠️  Some tests failed. Review the errors above for debugging.');
    }
  }
}

// Export for use
export { Level25TestSuite };

// Run tests if called directly
if (require.main === module) {
  const testSuite = new Level25TestSuite();
  testSuite.runAllTests().catch(console.error);
}
