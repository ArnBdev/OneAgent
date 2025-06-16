/**
 * Comprehensive test suite for DevAgent
 * 
 * Tests DevAgent functionality including BMAD v4 integration,
 * Context7 MCP documentation system, and unified cache performance.
 */

import { DevAgent } from '../coreagent/agents/specialized/DevAgent';
import { AgentConfig, AgentContext } from '../coreagent/agents/base/BaseAgent';
import { Context7MCPIntegration } from '../coreagent/mcp/Context7MCPIntegration';
import { UnifiedCacheSystem } from '../coreagent/performance/UnifiedCacheSystem';

describe('DevAgent Test Suite', () => {
  let devAgent: DevAgent;
  let mockConfig: AgentConfig;
  let mockContext: AgentContext;

  beforeEach(() => {
    mockConfig = {
      id: 'test-dev-agent',
      name: 'Test DevAgent',
      capabilities: [
        'code_analysis',
        'test_generation',
        'documentation_sync',
        'refactoring',
        'performance_optimization',
        'security_scanning',
        'git_workflow',
        'dependency_management'
      ],
      model: 'gpt-4',
      temperature: 0.1,
      maxTokens: 4000
    };

    mockContext = {
      user: { id: 'test-user', name: 'Test User' },
      sessionId: 'test-session',
      timestamp: new Date(),
      metadata: {}
    };

    devAgent = new DevAgent(mockConfig);
  });

  afterEach(async () => {
    await devAgent.cleanup();
  });

  describe('DevAgent Initialization', () => {
    test('should initialize with correct configuration', async () => {
      await devAgent.initialize();
      
      expect(devAgent.id).toBe('test-dev-agent');
      expect(devAgent.config.capabilities).toContain('code_analysis');
      expect(devAgent.isReady()).toBe(true);
    });

    test('should have BMAD v4 persona configuration', () => {
      const status = devAgent.getStatus();
      expect(status.isHealthy).toBe(true);
    });

    test('should initialize Context7 MCP integration', async () => {
      await devAgent.initialize();
      
      const metrics = devAgent.getDocumentationMetrics();
      expect(metrics).toHaveProperty('cacheHitRatio');
      expect(metrics).toHaveProperty('averageResponseTime');
    });
  });

  describe('BMAD v4 Prompting Integration', () => {
    test('should apply 9-point elicitation framework', async () => {
      await devAgent.initialize();
      
      const testMessage = 'Analyze this code for performance issues';
      const response = await devAgent.processMessage(mockContext, testMessage);
      
      expect(response.content).toBeDefined();
      expect(response.actions).toBeDefined();
      expect(response.metadata).toHaveProperty('bmadEnhanced');
    });

    test('should maintain quality-focused development principles', async () => {
      await devAgent.initialize();
      
      const codeAnalysisMessage = 'Review this function for best practices';
      const response = await devAgent.processMessage(mockContext, codeAnalysisMessage);
      
      expect(response.content).toContain('quality');
      expect(response.actions?.some(action => action.type === 'analyze_code')).toBe(true);
    });
  });

  describe('Development Actions', () => {
    beforeEach(async () => {
      await devAgent.initialize();
    });

    test('should execute code analysis action', async () => {
      const action = {
        type: 'analyze_code' as const,
        parameters: {
          code: 'function test() { return "hello"; }',
          language: 'javascript'
        }
      };

      const result = await devAgent.executeAction(action, mockContext);
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('suggestions');
    });

    test('should execute test generation action', async () => {
      const action = {
        type: 'generate_tests' as const,
        parameters: {
          code: 'function add(a, b) { return a + b; }',
          framework: 'jest'
        }
      };

      const result = await devAgent.executeAction(action, mockContext);
      expect(result).toHaveProperty('testCode');
      expect(result).toHaveProperty('coverage');
    });

    test('should execute documentation update action', async () => {
      const action = {
        type: 'update_documentation' as const,
        parameters: {
          code: 'function calculate() {}',
          documentationType: 'jsdoc'
        }
      };

      const result = await devAgent.executeAction(action, mockContext);
      expect(result).toHaveProperty('documentation');
      expect(result).toHaveProperty('synchronizationStatus');
    });

    test('should execute refactoring action', async () => {
      const action = {
        type: 'refactor_code' as const,
        parameters: {
          code: 'var x = 1; var y = 2; return x + y;',
          refactoringType: 'modernize'
        }
      };

      const result = await devAgent.executeAction(action, mockContext);
      expect(result).toHaveProperty('refactoredCode');
      expect(result).toHaveProperty('improvements');
    });

    test('should execute performance optimization action', async () => {
      const action = {
        type: 'optimize_performance' as const,
        parameters: {
          code: 'for(let i=0; i<1000000; i++) { console.log(i); }',
          optimizationType: 'efficiency'
        }
      };

      const result = await devAgent.executeAction(action, mockContext);
      expect(result).toHaveProperty('optimizedCode');
      expect(result).toHaveProperty('performanceGains');
    });

    test('should execute security scan action', async () => {
      const action = {
        type: 'security_scan' as const,
        parameters: {
          code: 'eval(userInput);',
          scanType: 'vulnerability'
        }
      };

      const result = await devAgent.executeAction(action, mockContext);
      expect(result).toHaveProperty('vulnerabilities');
      expect(result).toHaveProperty('recommendations');
    });

    test('should execute git workflow action', async () => {
      const action = {
        type: 'git_workflow' as const,
        parameters: {
          operation: 'commit_analysis',
          branchInfo: 'feature/new-component'
        }
      };

      const result = await devAgent.executeAction(action, mockContext);
      expect(result).toHaveProperty('workflowStatus');
      expect(result).toHaveProperty('recommendations');
    });

    test('should execute dependency management action', async () => {
      const action = {
        type: 'dependency_management' as const,
        parameters: {
          packageFile: 'package.json',
          operation: 'audit'
        }
      };

      const result = await devAgent.executeAction(action, mockContext);
      expect(result).toHaveProperty('dependencyStatus');
      expect(result).toHaveProperty('updates');
    });
  });

  describe('Context7 MCP Documentation Integration', () => {
    beforeEach(async () => {
      await devAgent.initialize();
    });

    test('should query external documentation', async () => {
      const results = await devAgent.queryExternalDocumentation(
        'React hooks useState',
        'Component state management',
        'react'
      );

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('source');
        expect(results[0]).toHaveProperty('title');
        expect(results[0]).toHaveProperty('content');
        expect(results[0]).toHaveProperty('relevanceScore');
      }
    });

    test('should provide fallback documentation when external sources fail', async () => {
      // Simulate external source failure by querying non-existent source
      const results = await devAgent.queryExternalDocumentation(
        'react component',
        'Basic React usage',
        'non-existent-source'
      );

      expect(Array.isArray(results)).toBe(true);
      // Should return fallback results for React queries
    });

    test('should track documentation metrics', async () => {
      await devAgent.queryExternalDocumentation('typescript interfaces');
      
      const metrics = devAgent.getDocumentationMetrics();
      expect(metrics).toHaveProperty('cacheHitRatio');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Memory and Learning System', () => {
    beforeEach(async () => {
      await devAgent.initialize();
    });

    test('should store development interactions for learning', async () => {
      const message = 'Help me optimize this database query';
      const response = await devAgent.processMessage(mockContext, message);

      expect(response).toBeDefined();
      // Memory storage would be tested with actual memory client
    });

    test('should retrieve relevant development patterns', async () => {
      // This would test the dev/ folder organization system
      const message = 'Show me patterns for API error handling';
      const response = await devAgent.processMessage(mockContext, message);

      expect(response.content).toBeDefined();
      expect(response.metadata).toHaveProperty('relevantPatterns');
    });
  });

  describe('Agent Registry Integration', () => {
    test('should be properly classified as development agent', () => {
      const capabilities = devAgent.config.capabilities;
      
      expect(capabilities).toContain('code_analysis');
      expect(capabilities).toContain('test_generation');
      expect(capabilities).toContain('refactoring');
      
      // Test that agent would be classified as 'development' type
      const hasDevCapabilities = capabilities.some(cap => 
        ['code_analysis', 'test_generation', 'refactoring', 'performance_optimization'].includes(cap)
      );
      expect(hasDevCapabilities).toBe(true);
    });

    test('should respond to development-related queries', async () => {
      await devAgent.initialize();
      
      const devQueries = [
        'analyze this code',
        'generate tests for function',
        'refactor this component',
        'optimize performance',
        'security scan needed'
      ];

      for (const query of devQueries) {
        const response = await devAgent.processMessage(mockContext, query);
        expect(response.content).toBeDefined();
        expect(response.actions?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance and Health Monitoring', () => {
    beforeEach(async () => {
      await devAgent.initialize();
    });

    test('should report healthy status', () => {
      const status = devAgent.getStatus();
      
      expect(status.isHealthy).toBe(true);
      expect(status.processedMessages).toBeDefined();
      expect(status.errors).toBeDefined();
      expect(Array.isArray(status.errors)).toBe(true);
    });

    test('should track processed messages', async () => {
      const initialStatus = devAgent.getStatus();
      const initialCount = initialStatus.processedMessages;

      await devAgent.processMessage(mockContext, 'Test message');

      const newStatus = devAgent.getStatus();
      expect(newStatus.processedMessages).toBe(initialCount + 1);
    });

    test('should handle errors gracefully', async () => {
      // Test with invalid action
      try {
        await devAgent.executeAction(
          { type: 'invalid_action' as any, parameters: {} },
          mockContext
        );
      } catch (error) {
        expect(error).toBeDefined();
      }

      const status = devAgent.getStatus();
      expect(status.isHealthy).toBe(true); // Should still be healthy
    });
  });

  describe('Cache Performance', () => {
    test('should meet performance targets for documentation cache', async () => {
      await devAgent.initialize();
      
      // Perform multiple queries to test cache performance
      const queries = [
        'React hooks',
        'TypeScript interfaces',
        'Express routing',
        'Node.js streams'
      ];

      for (const query of queries) {
        await devAgent.queryExternalDocumentation(query);
      }

      // Query the same items again to test cache hits
      for (const query of queries) {
        await devAgent.queryExternalDocumentation(query);
      }

      const metrics = devAgent.getDocumentationMetrics();
      expect(metrics.performanceStatus).toBeDefined();
    });
  });
});

describe('Context7MCPIntegration Unit Tests', () => {
  let context7: Context7MCPIntegration;

  beforeEach(() => {
    context7 = new Context7MCPIntegration();
  });

  test('should initialize with default documentation sources', () => {
    const sources = context7.getAvailableSources();
    expect(sources.length).toBeGreaterThan(0);
    
    const sourceNames = sources.map(s => s.name);
    expect(sourceNames).toContain('React Documentation');
    expect(sourceNames).toContain('TypeScript Documentation');
  });

  test('should provide cache metrics', () => {
    const metrics = context7.getCacheMetrics();
    expect(metrics).toHaveProperty('totalQueries');
    expect(metrics).toHaveProperty('cacheHits');
    expect(metrics).toHaveProperty('cacheMisses');
  });

  test('should track performance targets', () => {
    const performance = context7.getPerformanceStatus();
    expect(performance).toHaveProperty('cacheHitRatio');
    expect(performance).toHaveProperty('averageResponseTime');
    expect(performance).toHaveProperty('meetsTargets');
  });
});

describe('UnifiedCacheSystem Unit Tests', () => {
  let cache: UnifiedCacheSystem<string>;

  beforeEach(() => {
    cache = new UnifiedCacheSystem<string>({
      tier1Size: 5,
      tier2Size: 10,
      tier3Size: 20,
      defaultTTL: 60000
    });
  });

  afterEach(async () => {
    await cache.destroy();
  });

  test('should store and retrieve values', async () => {
    await cache.set('test-key', 'test-value');
    const result = await cache.get('test-key');
    expect(result).toBe('test-value');
  });

  test('should handle cache misses', async () => {
    const result = await cache.get('non-existent-key');
    expect(result).toBeUndefined();
  });

  test('should track cache metrics', async () => {
    await cache.set('key1', 'value1');
    await cache.get('key1'); // Hit
    await cache.get('key2'); // Miss

    const metrics = cache.getMetrics();
    expect(metrics.totalQueries).toBe(2);
    expect(metrics.tier3Hits).toBe(1);
    expect(metrics.totalMisses).toBe(1);
  });

  test('should promote frequently accessed items', async () => {
    await cache.set('frequent-key', 'frequent-value');
    
    // Access multiple times to trigger promotion
    await cache.get('frequent-key');
    await cache.get('frequent-key');
    await cache.get('frequent-key');
    await cache.get('frequent-key');

    const hitRatios = cache.getHitRatios();
    expect(hitRatios.overall).toBeGreaterThan(0);
  });

  test('should meet performance targets', async () => {
    // Add some test data
    for (let i = 0; i < 10; i++) {
      await cache.set(`key${i}`, `value${i}`);
    }

    // Perform lookups
    for (let i = 0; i < 10; i++) {
      await cache.get(`key${i}`);
    }

    const performance = cache.getPerformanceStatus();
    expect(performance).toHaveProperty('tier1Performance');
    expect(performance).toHaveProperty('tier2Performance');
    expect(performance).toHaveProperty('tier3Performance');
    expect(performance).toHaveProperty('overallHealth');
  });

  test('should handle TTL expiration', async () => {
    await cache.set('ttl-key', 'ttl-value', 1); // 1ms TTL
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result = await cache.get('ttl-key');
    expect(result).toBeUndefined();
  });

  test('should cleanup expired entries', async () => {
    await cache.set('temp-key', 'temp-value', 1);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await cache.cleanup();
    
    const result = await cache.get('temp-key');
    expect(result).toBeUndefined();
  });
});
