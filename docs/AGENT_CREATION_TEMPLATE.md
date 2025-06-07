# 🤖 OneAgent - Agent Creation Template & Developer Guide

**Version:** June 2025  
**Developer:** GitHub Copilot  
**Purpose:** Complete guide for creating specialized agents in OneAgent ecosystem  
**Prerequisites:** TypeScript knowledge, OneAgent architecture understanding

---

## 🎯 **Quick Start Guide**

### **1. Choose Your Agent Type**
```typescript
// Available base types (extend as needed)
export type AgentType = 'office' | 'fitness' | 'general' | 'coach' | 'advisor' | 'research' | 'medical' | 'dev';

// Your new agent type
const NEW_AGENT_TYPE = 'research'; // Example: ResearchAgent
```

### **2. Create Agent Template**
```bash
# Navigate to agents directory
cd coreagent/agents/specialized/

# Create your new agent file
touch YourAgentName.ts  # e.g., ResearchAgent.ts
```

### **3. Use Complete Template**
Copy the template from [Agent Template Code](#-complete-agent-template-code) section below.

---

## 🏗️ **Agent Architecture Overview**

### **Core Components**
```
BaseAgent (Abstract)
├── AgentConfig: Configuration and capabilities
├── AgentContext: User, session, and memory context
├── AgentResponse: Standardized response format
└── ISpecializedAgent: Interface for specialized functionality

Your Specialized Agent
├── Extends BaseAgent
├── Implements ISpecializedAgent
├── Domain-specific logic and actions
└── Custom prompt templates and processing
```

### **Key Interfaces**
```typescript
// Agent Configuration
interface AgentConfig {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // Agent description
  capabilities: string[];        // List of capabilities
  memoryEnabled: boolean;        // Enable memory features
  aiEnabled: boolean;           // Enable AI/LLM features
}

// Specialized Agent Contract
interface ISpecializedAgent {
  readonly id: string;
  readonly config: AgentConfig;
  
  initialize(): Promise<void>;
  processMessage(context: AgentContext, message: string): Promise<AgentResponse>;
  getAvailableActions(): AgentAction[];
  executeAction(action: AgentAction, context: AgentContext): Promise<any>;
  getStatus(): AgentStatus;
  getName(): string;
  getHealthStatus(): Promise<AgentHealthStatus>;
  cleanup(): Promise<void>;
}
```

---

## 🛠️ **Complete Agent Template Code**

### **1. Basic Agent Template (ResearchAgent Example)**

```typescript
/**
 * ResearchAgent - Specialized agent for research and information gathering
 * 
 * This agent specializes in web search, data analysis, information synthesis,
 * and providing comprehensive research insights.
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResponse, AgentAction } from '../base/BaseAgent';
import { ISpecializedAgent, AgentStatus, AgentHealthStatus } from '../base/ISpecializedAgent';

export class ResearchAgent extends BaseAgent implements ISpecializedAgent {
  public readonly id: string;
  public readonly config: AgentConfig;
  private processedMessages: number = 0;
  private errors: string[] = [];

  constructor(config: AgentConfig) {
    super(config);
    this.id = config.id || `research-agent-${Date.now()}`;
    this.config = config;
  }

  /**
   * Initialize the research agent
   */
  async initialize(): Promise<void> {
    await super.initialize();
    console.log(`ResearchAgent ${this.id} initialized successfully`);
  }

  /**
   * Process research-related messages
   */
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    try {
      this.validateContext(context);
      this.processedMessages++;

      // Add message to memory for context
      await this.addMemory(context.user.id, message, {
        agentType: 'research',
        sessionId: context.sessionId,
        timestamp: new Date().toISOString()
      });

      // Search for relevant memories
      const relevantMemories = await this.searchMemories(context.user.id, message, 5);

      // Analyze the message for research tasks
      const actions = await this.analyzeResearchTask(message);
      
      // Generate response using AI with research context
      const prompt = this.buildResearchPrompt(message, relevantMemories, context);
      const aiResponse = await this.generateResponse(prompt, relevantMemories);

      return this.createResponse(aiResponse, actions, relevantMemories);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errors.push(`Processing error: ${errorMessage}`);
      console.error('ResearchAgent processing error:', error);
      
      return this.createResponse(
        "I apologize, but I encountered an error processing your research request. Please try again.",
        [],
        []
      );
    }
  }

  /**
   * Get available research actions
   */
  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'web_search',
        description: 'Search the web for information',
        parameters: { query: 'string', sources: 'array', depth: 'number' }
      },
      {
        type: 'data_analyze',
        description: 'Analyze data and extract insights',
        parameters: { data: 'object', analysisType: 'string' }
      },
      {
        type: 'source_verify',
        description: 'Verify information sources',
        parameters: { sources: 'array', criteria: 'string' }
      },
      {
        type: 'report_generate',
        description: 'Generate research report',
        parameters: { findings: 'array', format: 'string' }
      },
      {
        type: 'trend_analyze',
        description: 'Analyze trends and patterns',
        parameters: { topic: 'string', timeframe: 'string' }
      }
    ];
  }

  /**
   * Execute research-specific actions
   */
  async executeAction(action: AgentAction, context: AgentContext): Promise<any> {
    switch (action.type) {
      case 'web_search':
        return await this.performWebSearch(action.parameters, context);
      case 'data_analyze':
        return await this.analyzeData(action.parameters, context);
      case 'source_verify':
        return await this.verifySources(action.parameters, context);
      case 'report_generate':
        return await this.generateReport(action.parameters, context);
      case 'trend_analyze':
        return await this.analyzeTrends(action.parameters, context);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Get agent status
   */
  getStatus(): AgentStatus {
    return {
      isHealthy: this.isReady() && this.errors.length < 5,
      lastActivity: new Date(),
      memoryCount: 0, // Would be fetched from memory client
      processedMessages: this.processedMessages,
      errors: [...this.errors]
    };
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.config.name || `ResearchAgent-${this.id}`;
  }

  /**
   * Get detailed health status
   */
  async getHealthStatus(): Promise<AgentHealthStatus> {
    return {
      status: this.isReady() && this.errors.length < 5 ? 'healthy' : 'degraded',
      uptime: Date.now(),
      memoryUsage: 0, // Mock value
      responseTime: 50, // Mock value
      errorRate: this.processedMessages > 0 ? this.errors.length / this.processedMessages : 0
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.errors = [];
    console.log(`ResearchAgent ${this.id} cleaned up`);
  }

  /**
   * Analyze message for research tasks
   */
  private async analyzeResearchTask(message: string): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('research')) {
      actions.push({
        type: 'web_search',
        description: 'Search for information based on request',
        parameters: { query: message }
      });
    }

    if (lowerMessage.includes('analyze') || lowerMessage.includes('data')) {
      actions.push({
        type: 'data_analyze',
        description: 'Analyze data based on request',
        parameters: { request: message }
      });
    }

    if (lowerMessage.includes('report') || lowerMessage.includes('summary')) {
      actions.push({
        type: 'report_generate',
        description: 'Generate report based on request',
        parameters: { request: message }
      });
    }

    return actions;
  }

  /**
   * Build research-specific prompt for AI
   */
  private buildResearchPrompt(message: string, memories: any[], context: AgentContext): string {
    // Extract customInstructions from enriched context userProfile
    const customInstructions = context.enrichedContext?.userProfile?.customInstructions;
    
    let prompt = `
You are a Research Assistant AI specialized in information gathering and analysis.

Context:
- User: ${context.user.name || 'User'}
- Session: ${context.sessionId}
- Previous interactions: ${memories.length} relevant memories`;

    // Add custom instructions if available
    if (customInstructions) {
      prompt += `
- User Preferences: ${customInstructions}`;
    }

    prompt += `

User Request: ${message}

Please provide comprehensive research assistance including:
- Web search and information gathering
- Data analysis and insights
- Source verification and credibility assessment
- Report generation and synthesis
- Trend analysis and pattern recognition

Be thorough, accurate, and cite sources when possible.`;

    return prompt;
  }

  /**
   * Research action implementations
   */
  private async performWebSearch(params: any, _context: AgentContext): Promise<any> {
    // Mock web search implementation
    return {
      success: true,
      searchId: `search_${Date.now()}`,
      results: [
        { title: 'Search Result 1', url: 'https://example.com/1', snippet: 'Relevant information...' },
        { title: 'Search Result 2', url: 'https://example.com/2', snippet: 'More information...' }
      ],
      message: `Web search performed for: ${params.query || params.request}`
    };
  }

  private async analyzeData(params: any, _context: AgentContext): Promise<any> {
    // Mock data analysis implementation
    return {
      success: true,
      analysisId: `analysis_${Date.now()}`,
      insights: ['Key insight 1', 'Key insight 2', 'Key insight 3'],
      message: `Data analysis completed for: ${params.request}`
    };
  }

  private async verifySources(params: any, _context: AgentContext): Promise<any> {
    // Mock source verification implementation
    return {
      success: true,
      verificationId: `verify_${Date.now()}`,
      verified: true,
      credibilityScore: 85,
      message: `Sources verified with 85% credibility score`
    };
  }

  private async generateReport(params: any, _context: AgentContext): Promise<any> {
    // Mock report generation implementation
    return {
      success: true,
      reportId: `report_${Date.now()}`,
      sections: ['Executive Summary', 'Findings', 'Recommendations', 'Sources'],
      message: `Research report generated based on: ${params.request}`
    };
  }

  private async analyzeTrends(params: any, _context: AgentContext): Promise<any> {
    // Mock trend analysis implementation
    return {
      success: true,
      trendId: `trend_${Date.now()}`,
      trends: ['Upward trend in topic relevance', 'Seasonal variations detected'],
      message: `Trend analysis completed for: ${params.topic || params.request}`
    };
  }
}
```

---

## 🏭 **AgentFactory Integration**

### **1. Update AgentFactory**
Add your new agent type to the factory:

```typescript
// In coreagent/agents/base/AgentFactory.ts

import { ResearchAgent } from '../specialized/ResearchAgent'; // Add import

export type AgentType = 'office' | 'fitness' | 'general' | 'coach' | 'advisor' | 'research'; // Add your type

export class AgentFactory {
  private static readonly DEFAULT_CAPABILITIES = {
    // ...existing capabilities...
    research: ['web_search', 'data_analysis', 'source_verification', 'report_generation', 'trend_analysis'], // Add capabilities
  };

  static async createAgent(factoryConfig: AgentFactoryConfig): Promise<ISpecializedAgent> {
    // ...existing code...
    
    switch (factoryConfig.type) {
      // ...existing cases...
      case 'research':
        agent = new ResearchAgent(agentConfig);
        break;
      default:
        throw new Error(`Unknown agent type: ${factoryConfig.type}`);
    }

    await agent.initialize();
    return agent;
  }
}
```

### **2. Update AgentRegistry**
Add matching criteria for your agent:

```typescript
// In coreagent/orchestrator/agentRegistry.ts

private initializeMatchingCriteria(): void {
  // ...existing criteria...
  
  this.matchingCriteria.set('research', {
    keywords: ['research', 'search', 'analyze', 'study', 'investigate', 'data', 'information', 'report'],
    requiredCapabilities: ['web_search'],
    priority: 1
  });
}

private determineAgentType(agent: ISpecializedAgent): AgentType {
  const capabilities = agent.config.capabilities;
  
  // ...existing checks...
  
  if (capabilities.includes('web_search') || capabilities.includes('data_analysis')) {
    return 'research';
  }
  
  return 'general';
}
```

---

## 🧪 **Testing Your Agent**

### **1. Create Test File**
```typescript
// tests/agents/ResearchAgent.test.ts

import { ResearchAgent } from '../../coreagent/agents/specialized/ResearchAgent';
import { AgentConfig, AgentContext } from '../../coreagent/agents/base/BaseAgent';
import { User } from '../../coreagent/types/user';

describe('ResearchAgent', () => {
  let agent: ResearchAgent;
  let mockContext: AgentContext;

  beforeEach(async () => {
    const config: AgentConfig = {
      id: 'test-research-agent',
      name: 'TestResearcher',
      description: 'Test research agent',
      capabilities: ['web_search', 'data_analysis'],
      memoryEnabled: false, // Disable for testing
      aiEnabled: false // Disable for testing
    };

    agent = new ResearchAgent(config);
    await agent.initialize();

    mockContext = {
      user: { id: 'test-user', name: 'Test User' } as User,
      sessionId: 'test-session',
      conversationHistory: [],
      memoryContext: []
    };
  });

  test('should initialize successfully', () => {
    expect(agent.getName()).toBe('TestResearcher');
    expect(agent.getStatus().isHealthy).toBe(true);
  });

  test('should have correct capabilities', () => {
    const capabilities = agent.config.capabilities;
    expect(capabilities).toContain('web_search');
    expect(capabilities).toContain('data_analysis');
  });

  test('should provide available actions', () => {
    const actions = agent.getAvailableActions();
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some(action => action.type === 'web_search')).toBe(true);
  });

  test('should process research messages', async () => {
    const response = await agent.processMessage(mockContext, 'Search for information about AI');
    expect(response.content).toBeDefined();
    expect(response.actions).toBeDefined();
  });

  test('should execute web search action', async () => {
    const action = {
      type: 'web_search',
      description: 'Test search',
      parameters: { query: 'test query' }
    };

    const result = await agent.executeAction(action, mockContext);
    expect(result.success).toBe(true);
    expect(result.searchId).toBeDefined();
  });
});
```

### **2. Integration Test**
```typescript
// tests/integration/agent-creation.test.ts

import { AgentFactory } from '../../coreagent/agents/base/AgentFactory';
import { AgentRegistry } from '../../coreagent/orchestrator/agentRegistry';

describe('Agent Creation Integration', () => {
  test('should create and register research agent', async () => {
    // Create agent using factory
    const agent = await AgentFactory.createAgent({
      type: 'research',
      id: 'integration-test-research',
      name: 'IntegrationTestResearcher',
      description: 'Research agent for integration testing'
    });

    expect(agent).toBeDefined();
    expect(agent.getName()).toBe('IntegrationTestResearcher');

    // Register agent
    const registry = new AgentRegistry();
    await registry.registerAgent(agent);

    // Verify registration
    const retrievedAgent = registry.getAgent('integration-test-research');
    expect(retrievedAgent).toBe(agent);

    // Test agent functionality
    const status = agent.getStatus();
    expect(status.isHealthy).toBe(true);
  });
});
```

---

## 📋 **Development Checklist**

### **Pre-Development**
- [ ] **Define agent purpose and domain**
- [ ] **Identify required capabilities and actions**
- [ ] **Plan integration with existing systems**
- [ ] **Review existing agents for patterns**

### **Implementation**
- [ ] **Create agent class extending BaseAgent**
- [ ] **Implement ISpecializedAgent interface**
- [ ] **Add domain-specific actions and logic**
- [ ] **Create custom prompt templates**
- [ ] **Handle errors gracefully**

### **Integration**
- [ ] **Update AgentFactory with new type**
- [ ] **Add AgentRegistry matching criteria**
- [ ] **Create comprehensive tests**
- [ ] **Add agent to type definitions**
- [ ] **Update documentation**

### **Validation**
- [ ] **Test agent initialization**
- [ ] **Verify message processing**
- [ ] **Test all available actions**
- [ ] **Check error handling**
- [ ] **Validate memory integration**
- [ ] **Test custom instructions support**

### **Deployment**
- [ ] **Run full test suite**
- [ ] **Update roadmap documentation**
- [ ] **Create usage examples**
- [ ] **Commit changes with clear messages**

---

## 💡 **Best Practices**

### **Code Quality**
```typescript
// ✅ Good: Clear, specific naming
export class MedicalDiagnosisAgent extends BaseAgent implements ISpecializedAgent

// ❌ Bad: Generic, unclear naming
export class Agent1 extends BaseAgent implements ISpecializedAgent

// ✅ Good: Comprehensive error handling
try {
  const result = await this.performComplexOperation();
  return this.createResponse(result.message, result.actions);
} catch (error) {
  this.errors.push(`Operation failed: ${error.message}`);
  return this.createResponse("I encountered an error. Please try again.", []);
}

// ✅ Good: Memory integration
const relevantMemories = await this.searchMemories(context.user.id, message, 5);
await this.addMemory(context.user.id, `${message} -> ${response}`, metadata);
```

### **Performance Considerations**
- **Memory Management**: Use pagination for large memory queries
- **Action Execution**: Implement timeouts for external API calls
- **Error Recovery**: Graceful degradation when services are unavailable
- **Caching**: Cache expensive operations when appropriate

### **Security Guidelines**
- **Input Validation**: Sanitize all user inputs before processing
- **API Keys**: Never log or expose sensitive configuration
- **User Data**: Respect privacy settings and data retention policies
- **Custom Instructions**: Validate and sanitize custom instructions

---

## 📚 **Advanced Patterns**

### **1. Multi-Modal Agent**
```typescript
export class MultiModalAgent extends BaseAgent implements ISpecializedAgent {
  private imageProcessor?: ImageProcessor;
  private audioProcessor?: AudioProcessor;
  
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    // Detect content type
    const contentType = this.detectContentType(message);
    
    switch (contentType) {
      case 'image':
        return await this.processImage(context, message);
      case 'audio':
        return await this.processAudio(context, message);
      default:
        return await this.processText(context, message);
    }
  }
}
```

### **2. Stateful Agent**
```typescript
export class StatefulAgent extends BaseAgent implements ISpecializedAgent {
  private conversationState: Map<string, ConversationState> = new Map();
  
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    const state = this.getOrCreateState(context.sessionId);
    
    // Update state based on message
    state.step = this.determineNextStep(state, message);
    state.context = { ...state.context, lastMessage: message };
    
    return await this.processWithState(context, message, state);
  }
}
```

### **3. Collaborative Agent**
```typescript
export class CollaborativeAgent extends BaseAgent implements ISpecializedAgent {
  private agentRegistry: AgentRegistry;
  
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    // Determine if collaboration is needed
    const collaborationNeeded = this.needsCollaboration(message);
    
    if (collaborationNeeded) {
      const collaborators = this.findCollaborators(message);
      return await this.coordinateWithAgents(context, message, collaborators);
    }
    
    return await this.processSolo(context, message);
  }
}
```

---

## 🚀 **Deployment Guide**

### **1. Local Testing**
```bash
# Run agent tests
npm test -- --testPathPattern=ResearchAgent

# Run integration tests
npm run test:integration

# Start development server with new agent
npm run dev
```

### **2. Production Deployment**
```typescript
// Register agent in production
const researchAgent = await AgentFactory.createAgent({
  type: 'research',
  id: 'production-research-agent',
  name: 'ResearchAssistant',
  description: 'Production research agent for information gathering'
});

await agentRegistry.registerAgent(researchAgent);
```

### **3. Monitoring**
```typescript
// Monitor agent health
const healthStatus = await agent.getHealthStatus();
console.log(`Agent health: ${healthStatus.status}`);
console.log(`Response time: ${healthStatus.responseTime}ms`);
console.log(`Error rate: ${healthStatus.errorRate}%`);
```

---

## 📖 **Resources**

### **Documentation**
- [OneAgent Architecture Overview](./ONEAGENT_COMPLETE_ROADMAP_2025.md)
- [TypeScript Guidelines](./DEVELOPMENT_GUIDELINES.md)
- [Testing Patterns](../tests/README.md)

### **Example Agents**
- [OfficeAgent](../coreagent/agents/specialized/OfficeAgent.ts) - Document and productivity tasks
- [FitnessAgent](../coreagent/agents/specialized/FitnessAgent.ts) - Health and wellness coaching

### **Core Interfaces**
- [BaseAgent](../coreagent/agents/base/BaseAgent.ts) - Foundation class
- [ISpecializedAgent](../coreagent/agents/base/ISpecializedAgent.ts) - Contract interface
- [AgentFactory](../coreagent/agents/base/AgentFactory.ts) - Creation patterns

---

## ✅ **Success Criteria**

Your agent is ready for production when:

- [ ] **All tests pass** (unit, integration, end-to-end)
- [ ] **Factory integration complete** (can be created via AgentFactory)
- [ ] **Registry integration working** (automatically routed based on capabilities)
- [ ] **Memory system functional** (stores and retrieves context)
- [ ] **Custom instructions supported** (respects user preferences)
- [ ] **Error handling robust** (graceful degradation)
- [ ] **Performance acceptable** (response times under acceptable thresholds)
- [ ] **Documentation complete** (usage examples and API docs)

---

*Agent Creation Template - Version 1.0*  
*Created for OneAgent Development - June 2025*
