/**
 * Level 2.5 Integration Example - Security Foundation + Integration Bridges
 * 
 * Demonstrates the complete integration of all Level 2.5 components:
 * - Security Foundation (RequestValidator, AuditLogger, SecureErrorHandler)
 * - Integration Bridges (MemoryBridge, PerformanceBridge, ContextManager, EnhancedRequestRouter)
 */

import { RequestValidator } from '../coreagent/validation/requestValidator';
import { SimpleAuditLogger } from '../coreagent/audit/auditLogger';
import { SecureErrorHandler } from '../coreagent/utils/secureErrorHandler';
import MemoryBridge from '../coreagent/integration/memoryBridge';
import PerformanceBridge from '../coreagent/integration/performanceBridge';
import ContextManager from '../coreagent/integration/contextManager';
import EnhancedRequestRouter from '../coreagent/integration/enhancedRequestRouter';
import { PerformanceAPI } from '../coreagent/api/performanceAPI';

// Mock implementations for the example
class MockMemoryIntelligence {
  async semanticSearch(query: string, limit: number, threshold: number, userId?: string) {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    return [
      { id: 'mem_1', content: `Search result for "${query}" - Technical documentation`, score: 0.95 },
      { id: 'mem_2', content: `Previous conversation about ${query}`, score: 0.87 },
      { id: 'mem_3', content: `Related project notes`, score: 0.75 }
    ];
  }

  async storeMemory(content: string, metadata: Record<string, any>, userId?: string) {
    await new Promise(resolve => setTimeout(resolve, 150));
    return `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getAnalytics(userId?: string) {
    return {
      totalMemories: 250,
      categoryBreakdown: { 'development': 120, 'general': 80, 'research': 50 },
      averageImportance: 0.78
    };
  }
}

/**
 * Level 2.5 Integration Example - Complete OneAgent Request Processing
 */
export class Level25IntegrationExample {
  private requestValidator: RequestValidator;
  private auditLogger: SimpleAuditLogger;
  private errorHandler: SecureErrorHandler;
  private contextManager: ContextManager;
  private performanceBridge: PerformanceBridge;
  private memoryBridge: MemoryBridge;
  private router: EnhancedRequestRouter;
  private performanceAPI: PerformanceAPI;

  constructor() {
    this.initializeComponents();
  }

  /**
   * Initialize all Level 2.5 components with proper configuration
   */
  private initializeComponents(): void {
    console.log('🚀 Initializing Level 2.5 Components...');

    // Phase 1a - Security Foundation
    this.requestValidator = new RequestValidator({
      maxRequestSize: 5 * 1024 * 1024, // 5MB
      maxPromptLength: 50000,
      allowedAgentTypes: ['research', 'dev', 'fitness', 'generic-gemini', 'office']
    });

    this.auditLogger = new SimpleAuditLogger({
      logDirectory: './logs/level-2-5',
      enableConsoleOutput: process.env.NODE_ENV === 'development',
      bufferSize: 50,
      flushInterval: 3000
    });

    this.errorHandler = new SecureErrorHandler({
      includeDebugInfo: process.env.NODE_ENV === 'development',
      enableDetailedLogging: true
    }, this.auditLogger);

    // Phase 1b - Integration Bridges
    this.contextManager = new ContextManager({
      enablePerformanceOptimization: true,
      enableSecurityChecks: true,
      sessionTimeout: 20 * 60 * 1000, // 20 minutes
      rateLimiting: {
        maxRequestsPerMinute: 30,
        windowSizeMs: 60000
      }
    }, this.auditLogger, this.errorHandler);

    // Mock performance API for example
    const mockMemoryIntelligence = new MockMemoryIntelligence();
    this.performanceAPI = new PerformanceAPI(
      mockMemoryIntelligence as any,
      null as any, // Mock Gemini client
      null as any, // Mock Mem0 client
      null as any  // Mock embeddings tool
    );

    this.performanceBridge = new PerformanceBridge(
      this.performanceAPI,
      {
        enableRealTimeMonitoring: true,
        monitoringInterval: 15000,
        enableAutoOptimization: false
      },
      this.auditLogger,
      this.errorHandler
    );

    this.memoryBridge = new MemoryBridge(
      mockMemoryIntelligence as any,
      this.performanceAPI,
      {
        enablePerformanceTracking: true,
        enableCaching: true,
        cacheTimeout: 10 * 60 * 1000 // 10 minutes
      },
      this.auditLogger,
      this.errorHandler
    );

    this.router = new EnhancedRequestRouter(
      this.contextManager,
      this.performanceBridge,
      {
        enableSecurityValidation: true,
        enablePerformanceOptimization: true,
        enableContextAwareRouting: true,
        fallbackAgent: 'generic-gemini',
        maxRoutingTime: 500
      },
      this.requestValidator,
      this.auditLogger,
      this.errorHandler
    );

    this.registerAgents();
    console.log('✅ Level 2.5 Components initialized successfully\n');
  }

  /**
   * Register available agents with the router
   */
  private async registerAgents(): Promise<void> {
    const agents = [
      { type: 'research', description: 'Specialized research and information gathering' },
      { type: 'dev', description: 'Software development and coding assistance' },
      { type: 'fitness', description: 'Health and fitness guidance' },
      { type: 'generic-gemini', description: 'General purpose AI assistant' },
      { type: 'office', description: 'Office productivity and document management' }
    ];

    for (const agent of agents) {
      await this.router.registerAgent(agent.type, { 
        name: agent.description,
        capabilities: ['text-processing', 'analysis']
      });
    }
  }

  /**
   * Process a complete user request through all Level 2.5 components
   */
  async processRequest(
    request: {
      prompt: string;
      agentType?: string;
      sessionId?: string;
      metadata?: Record<string, any>;
    },
    user: {
      id: string;
      name: string;
      email: string;
      permissions: string[];
      customInstructions?: string;
    }
  ): Promise<{
    success: boolean;
    result?: any;
    error?: any;
    metrics: {
      totalProcessingTime: number;
      securityValidationTime: number;
      routingTime: number;
      memorySearchTime: number;
      contextCreationTime: number;
    };
  }> {
    const processStartTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🔄 Processing request ${requestId}...`);
    console.log(`📝 Prompt: "${request.prompt.substring(0, 100)}${request.prompt.length > 100 ? '...' : ''}"`);
    console.log(`👤 User: ${user.name} (${user.id})`);
    console.log(`🎯 Requested Agent: ${request.agentType || 'auto-select'}\n`);

    try {
      // Step 1: Security Validation
      console.log('🔒 Step 1: Security Validation');
      const securityStartTime = Date.now();
      
      const enrichedRequest = {
        ...request,
        requestId,
        sessionId: request.sessionId || `sess_${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      const validationResult = this.requestValidator.validateRequest(enrichedRequest);
      
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      await this.auditLogger.logValidation(requestId, true, [], validationResult.warnings);
      const securityValidationTime = Date.now() - securityStartTime;
      console.log(`  ✅ Security validation passed (${securityValidationTime}ms)`);

      // Step 2: Context Creation
      console.log('🌐 Step 2: Context Creation');
      const contextStartTime = Date.now();
      
      const enrichedContext = await this.contextManager.createEnrichedContext(
        enrichedRequest as any,
        user as any,
        { customInstructions: user.customInstructions }
      );

      const contextCreationTime = Date.now() - contextStartTime;
      console.log(`  ✅ Context created (${contextCreationTime}ms)`);
      console.log(`  📊 Session: ${enrichedContext.session.requestCount} requests, Risk: ${enrichedContext.security.riskLevel}`);

      // Step 3: Request Routing
      console.log('🔀 Step 3: Request Routing');
      const routingStartTime = Date.now();
      
      const routingDecision = await this.router.routeRequest(enrichedRequest as any, user as any);
      
      const routingTime = Date.now() - routingStartTime;
      console.log(`  ✅ Routed to ${routingDecision.selectedAgent} (confidence: ${routingDecision.confidence}%, ${routingTime}ms)`);
      console.log(`  💡 Reasoning: ${routingDecision.reasoning.join(', ')}`);

      // Step 4: Memory Intelligence Search
      console.log('🧠 Step 4: Memory Intelligence Search');
      const memoryStartTime = Date.now();
      
      const memorySearchResult = await this.memoryBridge.performSearch(
        request.prompt,
        {
          requestId,
          userId: user.id,
          sessionId: enrichedRequest.sessionId,
          limit: 5,
          threshold: 0.7
        }
      );

      const memorySearchTime = Date.now() - memoryStartTime;
      console.log(`  ✅ Memory search completed (${memorySearchTime}ms)`);
      console.log(`  📚 Found ${memorySearchResult.results.length} relevant memories (${memorySearchResult.metadata.cached ? 'cached' : 'fresh'})`);

      // Step 5: Performance Tracking
      console.log('⚡ Step 5: Performance Tracking');
      
      const operationResult = await this.performanceBridge.trackOperation(
        routingDecision.selectedAgent,
        'process_request',
        async () => {
          // Simulate agent processing
          await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
          
          return {
            agentResponse: `Processed by ${routingDecision.selectedAgent}: ${request.prompt}`,
            memoryContext: memorySearchResult.results.slice(0, 3),
            confidenceScore: routingDecision.confidence,
            processingMetadata: {
              agentType: routingDecision.selectedAgent,
              memoryRelevance: memorySearchResult.metadata.totalResults,
              contextRiskLevel: enrichedContext.security.riskLevel
            }
          };
        },
        {
          requestId,
          userId: user.id,
          sessionId: enrichedRequest.sessionId
        }
      );

      console.log(`  ✅ Agent processing completed`);

      // Step 6: Store processing results in memory
      console.log('💾 Step 6: Memory Storage');
      
      const memoryContent = `Request: ${request.prompt}\nAgent: ${routingDecision.selectedAgent}\nResult: ${JSON.stringify(operationResult).substring(0, 200)}...`;
      
      await this.memoryBridge.storeMemory(
        memoryContent,
        {
          requestId,
          agentType: routingDecision.selectedAgent,
          userFeedback: 'pending',
          importance: 0.8,
          category: 'interaction'
        },
        {
          userId: user.id,
          sessionId: enrichedRequest.sessionId
        }
      );

      console.log(`  ✅ Results stored in memory`);

      // Calculate final metrics
      const totalProcessingTime = Date.now() - processStartTime;
      
      const metrics = {
        totalProcessingTime,
        securityValidationTime,
        routingTime,
        memorySearchTime,
        contextCreationTime
      };

      // Log successful completion
      await this.auditLogger.logRequest(
        user.id,
        enrichedRequest.sessionId,
        routingDecision.selectedAgent,
        requestId,
        `Request processed successfully in ${totalProcessingTime}ms`
      );

      console.log(`\n🎉 Request ${requestId} processed successfully!`);
      console.log(`⏱️  Total time: ${totalProcessingTime}ms`);
      console.log(`🎯 Final agent: ${routingDecision.selectedAgent}`);
      console.log(`📊 Performance score: ${memorySearchResult.metadata.performanceScore}/100\n`);

      return {
        success: true,
        result: operationResult,
        metrics
      };

    } catch (error) {
      // Handle errors through SecureErrorHandler
      console.log(`\n❌ Request ${requestId} failed`);
      
      const errorResponse = await this.errorHandler.handleError(error, {
        requestId,
        userId: user.id,
        operation: 'process_request'
      });

      const totalProcessingTime = Date.now() - processStartTime;
      
      console.log(`🔍 Error: ${errorResponse.error.message}`);
      console.log(`⏱️  Failed after: ${totalProcessingTime}ms\n`);

      return {
        success: false,
        error: errorResponse,
        metrics: {
          totalProcessingTime,
          securityValidationTime: 0,
          routingTime: 0,
          memorySearchTime: 0,
          contextCreationTime: 0
        }
      };
    }
  }

  /**
   * Get comprehensive system analytics
   */
  async getSystemAnalytics(): Promise<{
    performance: any;
    memory: any;
    context: any;
    routing: any;
    security: any;
  }> {
    console.log('📊 Gathering System Analytics...\n');

    const [
      performanceAnalytics,
      memoryAnalytics,
      contextAnalytics,
      routingAnalytics,
      securityMetrics
    ] = await Promise.all([
      this.performanceBridge.getPerformanceAnalytics(),
      this.memoryBridge.getMemoryAnalytics(),
      this.contextManager.getContextAnalytics(),
      this.router.getRoutingAnalytics(),
      this.performanceAPI.getSecurityMetrics()
    ]);

    return {
      performance: performanceAnalytics,
      memory: memoryAnalytics,
      context: contextAnalytics,
      routing: routingAnalytics,
      security: securityMetrics
    };
  }

  /**
   * Gracefully shutdown all components
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Level 2.5 components...');
    
    await Promise.all([
      this.auditLogger.shutdown(),
      this.performanceBridge.shutdown(),
      this.contextManager.shutdown()
    ]);
    
    console.log('✅ Level 2.5 shutdown complete\n');
  }
}

/**
 * Example usage demonstration
 */
export async function runLevel25Example(): Promise<void> {
  console.log('🎬 Level 2.5 Integration Example - Security Foundation + Integration Bridges');
  console.log('='.repeat(80) + '\n');

  const integration = new Level25IntegrationExample();

  // Example user
  const testUser = {
    id: 'user_123456',
    name: 'Alice Developer',
    email: 'alice@example.com',
    permissions: ['basic', 'development', 'research'],
    customInstructions: 'I prefer TypeScript examples and detailed technical explanations'
  };

  // Example requests
  const testRequests = [
    {
      prompt: 'Help me optimize a TypeScript function for better performance',
      agentType: 'dev',
      metadata: { priority: 'high', category: 'optimization' }
    },
    {
      prompt: 'Research the latest trends in AI memory management',
      agentType: 'research',
      metadata: { priority: 'medium', category: 'research' }
    },
    {
      prompt: 'What are some good exercises for building core strength?',
      agentType: 'fitness',
      metadata: { priority: 'low', category: 'health' }
    }
  ];

  try {
    // Process multiple requests to demonstrate the system
    for (let i = 0; i < testRequests.length; i++) {
      const request = testRequests[i];
      console.log(`📋 Test Request ${i + 1}/${testRequests.length}`);
      console.log('-'.repeat(40));
      
      const result = await integration.processRequest(request, testUser);
      
      if (result.success) {
        console.log(`✅ Request completed successfully`);
      } else {
        console.log(`❌ Request failed`);
      }
      
      if (i < testRequests.length - 1) {
        console.log('\n' + '='.repeat(80) + '\n');
        // Short delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Show system analytics
    console.log('\n' + '='.repeat(80));
    console.log('📈 System Analytics Summary');
    console.log('='.repeat(80));
    
    const analytics = await integration.getSystemAnalytics();
    
    console.log(`🏃 Active Sessions: ${analytics.context.activeSessions}`);
    console.log(`📊 Total Operations: ${analytics.performance.systemSummary.totalOperations}`);
    console.log(`⚡ Avg Response Time: ${analytics.performance.systemSummary.averageResponseTime.toFixed(0)}ms`);
    console.log(`🎯 System Health: ${analytics.performance.systemSummary.systemHealth}`);
    console.log(`🧠 Memory Cache Hit Rate: ${(analytics.memory.cacheStats.hitRate * 100).toFixed(1)}%`);

  } finally {
    await integration.shutdown();
  }

  console.log('\n🏁 Level 2.5 Integration Example completed!');
}

// Run example if called directly
if (require.main === module) {
  runLevel25Example().catch(console.error);
}
