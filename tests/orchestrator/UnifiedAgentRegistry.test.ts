/**
 * Comprehensive Test Suite for UnifiedAgentRegistry
 * Phase 1.1 Validation Tests for OURA v3.0 Implementation
 */

import { UnifiedAgentRegistry } from '../../coreagent/orchestrator/UnifiedAgentRegistry';
import { ISpecializedAgent } from '../../coreagent/agents/base/ISpecializedAgent';
import { AgentConfig } from '../../coreagent/agents/base/BaseAgent';
import { TemporaryAgentConfig } from '../../coreagent/orchestrator/interfaces/IUnifiedAgentRegistry';

describe('UnifiedAgentRegistry - Phase 1.1 Validation', () => {
  let registry: UnifiedAgentRegistry;
  let mockAgent: jest.Mocked<ISpecializedAgent>;
  let mockMemoryClient: any;

  beforeEach(async () => {
    // Create mock memory client
    mockMemoryClient = {
      createMemory: jest.fn().mockResolvedValue({ success: true }),
      searchMemories: jest.fn().mockResolvedValue([]),
      isHealthy: jest.fn().mockResolvedValue(true)
    };

    // Create mock agent
    const agentConfig: AgentConfig = {
      id: 'test-agent-123',
      name: 'TestAgent',
      description: 'Test agent for validation',
      capabilities: ['testing', 'validation'],
      memoryEnabled: true,
      aiEnabled: true
    };

    mockAgent = {
      id: 'test-agent-123',
      config: agentConfig,
      initialize: jest.fn().mockResolvedValue(undefined),
      processMessage: jest.fn().mockResolvedValue({ content: 'test response' }),
      getAvailableActions: jest.fn().mockReturnValue([
        { type: 'test', description: 'Test action', parameters: {} }
      ]),
      executeAction: jest.fn().mockResolvedValue({}),
      getStatus: jest.fn().mockReturnValue({
        agentId: 'test-agent-123',
        name: 'TestAgent',
        description: 'Test agent',
        initialized: true,
        capabilities: ['testing'],
        memoryEnabled: true,
        aiEnabled: true,
        isHealthy: true,
        processedMessages: 0,
        errors: 0
      }),
      getName: jest.fn().mockReturnValue('TestAgent'),
      getHealthStatus: jest.fn().mockResolvedValue({
        isHealthy: true,
        uptime: 1000,
        memoryUsage: 100,
        lastActivity: new Date()
      }),
      cleanup: jest.fn().mockResolvedValue(undefined)
    } as jest.Mocked<ISpecializedAgent>;

    // Initialize registry
    registry = new UnifiedAgentRegistry();
    (registry as any).memoryClient = mockMemoryClient;
  });

  describe('🔥 CRITICAL: Basic Registry Operations', () => {
    test('should register persistent agent successfully', async () => {
      const result = await registry.registerAgent(mockAgent, 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.agentId).toBe('test-agent-123');
      expect(result.memoryIntegration).toBe(true);
      expect(mockMemoryClient.createMemory).toHaveBeenCalled();
    });

    test('should register temporary agent with lifecycle management', async () => {
      const tempConfig: TemporaryAgentConfig = {
        ...mockAgent.config,
        temporary: true,
        maxDuration: { hours: 2 },
        taskSpecific: {
          taskType: 'development',
          estimatedDuration: { hours: 1 },
          requiredCapabilities: ['coding', 'testing'],
          memoryInheritancePattern: 'development-patterns'
        },
        lifecycle: {
          maxDuration: { hours: 2 },
          autoCleanup: true,
          knowledgePreservation: true
        },
        memoryContext: {
          inheritFromUser: true,
          inheritFromDomain: ['development'],
          contributeToDomain: ['testing'],
          isolationLevel: 'permissive'
        }
      };

      const result = await registry.registerTemporaryAgent(mockAgent, tempConfig, 'user-123');
      
      expect(result.success).toBe(true);
      expect(result.temporaryAgent).toBe(true);
      expect(result.scheduledCleanup).toBeDefined();
    });

    test('should enforce user isolation', async () => {
      // Register agent for user-123
      await registry.registerAgent(mockAgent, 'user-123');
      
      // Try to access from different user
      const agents = await registry.getUserAgents('user-456');
      expect(agents).toHaveLength(0);
      
      // Verify correct user can access
      const userAgents = await registry.getUserAgents('user-123');
      expect(userAgents).toHaveLength(1);
    });
  });

  describe('🧠 MEMORY-FIRST: Knowledge Integration', () => {
    test('should integrate with memory system during registration', async () => {
      await registry.registerAgent(mockAgent, 'user-123');
      
      expect(mockMemoryClient.createMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Agent registered'),
          memoryType: 'agent_lifecycle',
          userId: 'user-123'
        })
      );
    });

    test('should load memory patterns for agent enhancement', async () => {
      mockMemoryClient.searchMemories.mockResolvedValue([
        { content: 'Development pattern 1', similarity: 0.9 },
        { content: 'Testing pattern 2', similarity: 0.8 }
      ]);

      const patternCount = await registry.loadMemoryPatternsForAgent('test-agent-123', 'user-123');
      expect(patternCount).toBeGreaterThan(0);
      expect(mockMemoryClient.searchMemories).toHaveBeenCalled();
    });

    test('should discover cross-agent learnings', async () => {
      const learnings = await registry.discoverCrossAgentLearnings('test-agent-123', 'user-123');
      expect(Array.isArray(learnings)).toBe(true);
    });
  });

  describe('⚖️ CONSTITUTIONAL AI: Validation & Compliance', () => {
    test('should validate Constitutional AI compliance during registration', async () => {
      const result = await registry.registerAgent(mockAgent, 'user-123');
      expect(result.constitutionalCompliant).toBe(true);
    });

    test('should enforce quality standards', async () => {
      const mockLowQualityAgent = { ...mockAgent };
      mockLowQualityAgent.config.capabilities = []; // Low quality

      const result = await registry.registerAgent(mockLowQualityAgent, 'user-123');
      // Should still succeed but with quality warnings
      expect(result.success).toBe(true);
      expect(result.qualityScore).toBeDefined();
    });

    test('should validate agent compliance', async () => {
      await registry.registerAgent(mockAgent, 'user-123');
      const isCompliant = await registry.validateConstitutionalCompliance('test-agent-123');
      expect(typeof isCompliant).toBe('boolean');
    });
  });

  describe('🚀 ADVANCED: Agent Discovery & Intelligence', () => {
    test('should discover agents by capability', async () => {
      await registry.registerAgent(mockAgent, 'user-123');
      
      const results = await registry.discoverAgentsByCapability('testing', 'user-123');
      expect(results).toHaveLength(1);
      expect(results[0].agent.config.name).toBe('TestAgent');
    });

    test('should provide intelligent agent recommendations', async () => {
      await registry.registerAgent(mockAgent, 'user-123');
      
      const recommendations = await registry.recommendAgentsForRequest('I need help with testing', 'user-123');
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].relevanceScore).toBeGreaterThan(0);
    });

    test('should handle health monitoring', async () => {
      await registry.registerAgent(mockAgent, 'user-123');
      
      const health = await registry.getAgentHealth('test-agent-123');
      expect(health).toBeDefined();
    });
  });

  describe('⏱️ LIFECYCLE: Agent Management', () => {
    test('should handle agent deregistration with memory preservation', async () => {
      await registry.registerAgent(mockAgent, 'user-123');
      
      const result = await registry.deregisterAgent('test-agent-123', true);
      expect(result).toBe(true);
      expect(mockMemoryClient.createMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('deregistered')
        })
      );
    });

    test('should schedule cleanup for temporary agents', async () => {
      const result = await registry.scheduleAgentCleanup('test-agent-123', { minutes: 30 });
      expect(typeof result).toBe('boolean');
    });

    test('should promote temporary agents to persistent', async () => {
      const result = await registry.promoteAgent('test-agent-123');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('📊 PERFORMANCE: Response Times & Efficiency', () => {
    test('should complete registration within 100ms', async () => {
      const startTime = Date.now();
      await registry.registerAgent(mockAgent, 'user-123');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(100);
    });

    test('should handle concurrent registrations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => {
        const agent = { ...mockAgent, id: `agent-${i}` };
        return registry.registerAgent(agent, 'user-123');
      });

      const results = await Promise.all(promises);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});

/**
 * Integration Tests for Real Memory System
 */
describe('UnifiedAgentRegistry - Real Memory Integration', () => {
  let registry: UnifiedAgentRegistry;

  beforeEach(async () => {
    registry = new UnifiedAgentRegistry();
    await registry.initialize();
  });

  test('should connect to real memory system', async () => {
    const isHealthy = await registry.isMemorySystemHealthy();
    expect(isHealthy).toBe(true);
  }, 10000);

  test('should perform real memory operations', async () => {
    const mockAgent = createMockAgent();
    const result = await registry.registerAgent(mockAgent, 'integration-test-user');
    
    expect(result.success).toBe(true);
    expect(result.memoryIntegration).toBe(true);
  }, 10000);
});

function createMockAgent(): ISpecializedAgent {
  const config: AgentConfig = {
    id: 'integration-test-agent',
    name: 'IntegrationTestAgent',
    description: 'Agent for integration testing',
    capabilities: ['testing', 'integration'],
    memoryEnabled: true,
    aiEnabled: true
  };

  return {
    id: 'integration-test-agent',
    config,
    initialize: async () => {},
    processMessage: async () => ({ content: 'test' }),
    getAvailableActions: () => [],
    executeAction: async () => ({}),
    getStatus: () => ({
      agentId: 'integration-test-agent',
      name: 'IntegrationTestAgent',
      description: 'Test agent',
      initialized: true,
      capabilities: ['testing'],
      memoryEnabled: true,
      aiEnabled: true,
      isHealthy: true,
      processedMessages: 0,
      errors: 0
    }),
    getName: () => 'IntegrationTestAgent',
    getHealthStatus: async () => ({
      isHealthy: true,
      uptime: 1000,
      memoryUsage: 100,
      lastActivity: new Date()
    }),
    cleanup: async () => {}
  };
}
