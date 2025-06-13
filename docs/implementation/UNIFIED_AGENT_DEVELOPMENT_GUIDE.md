# OneAgent Unified Development Guide

**Version:** 4.0.0 Professional  
**Status:** Complete Implementation  
**Updated:** June 13, 2025  

## Overview

This guide establishes professional standards for developing new OneAgent specialized agents using the unified memory system, Constitutional AI validation, and multi-agent coordination patterns.

## 🎯 Core Principles

### 1. Template-First Approach
- **Always start with `TemplateAgent.ts`** - it showcases all modern patterns
- Copy and customize rather than building from scratch
- Follow established conventions for consistency

### 2. Unified Memory Integration
- **All agents MUST use `UnifiedMemoryClient`** for memory operations
- Store conversations, learnings, and interactions persistently
- Implement graceful fallbacks when memory system is unavailable

### 3. Constitutional AI Validation
- Apply accuracy, transparency, helpfulness, and safety principles
- Validate critical responses before returning to users
- Implement quality threshold enforcement (minimum 85%)

### 4. Multi-Agent Coordination
- Use OneAgent's 6 MCP coordination tools when appropriate
- Store agent-to-agent messages and meeting context persistently
- Enable cross-agent learning and context sharing

## 📋 Development Checklist

### Phase 1: Initial Setup
- [ ] Copy `coreagent/agents/templates/TemplateAgent.ts` to your new agent file
- [ ] Replace "Template" with your agent name throughout the file
- [ ] Replace "template" with your domain (e.g., "research", "medical", "finance")
- [ ] Update imports and dependencies as needed

### Phase 2: Domain Customization
- [ ] Update `constitutionalPrinciples` for your domain
- [ ] Define domain-specific actions in `getAvailableActions()`
- [ ] Implement domain logic in action handler methods
- [ ] Customize the AI prompt in `buildTemplatePrompt()`

### Phase 3: Advanced Integration
- [ ] Add multi-agent coordination patterns if needed
- [ ] Implement domain-specific error handling
- [ ] Add quality metrics collection for your domain
- [ ] Create comprehensive unit tests

### Phase 4: System Integration
- [ ] Add agent to `AgentFactory.ts` imports and switch statement
- [ ] Update `AgentRegistry.ts` matching criteria
- [ ] Add to capability detection logic
- [ ] Update project documentation

### Phase 5: Validation & Deployment
- [ ] Test with unified memory system enabled
- [ ] Verify Constitutional AI integration
- [ ] Test multi-agent coordination if applicable
- [ ] Conduct quality threshold testing
- [ ] Deploy and monitor

## 🔧 Implementation Patterns

### Memory Integration Pattern

```typescript
// CORRECT: Store with comprehensive metadata
await this.addMemory(context.user.id, message, {
  agentType: 'your_domain',
  sessionId: context.sessionId,
  timestamp: new Date().toISOString(),
  timeZone: this.timeZone,
  messageType: 'user_input',
  processingId: `proc_${Date.now()}`
});

// CORRECT: Search with fallback handling
try {
  const memories = await this.searchMemories(context.user.id, query, 5);
  console.log(`🧠 Retrieved ${memories.length} relevant memories`);
} catch (memoryError) {
  console.warn(`⚠️ Memory operation failed: ${memoryError}`);
  memories = []; // Graceful fallback
}
```

### Constitutional AI Pattern

```typescript
// PLACEHOLDER: Use this pattern when Constitutional AI is available
private readonly constitutionalPrinciples = {
  accuracy: 'Prefer "I don\'t know" to speculation in your domain',
  transparency: 'Explain your reasoning and acknowledge limitations',
  helpfulness: 'Provide actionable guidance with clear next steps',
  safety: 'Avoid harmful recommendations, consider security implications'
};

// TODO: Implement when Constitutional AI client is integrated
const validatedResponse = await this.applyConstitutionalValidation(
  preliminaryResponse, 
  userMessage, 
  context
);
```

### Multi-Agent Coordination Pattern

```typescript
// Example: Coordinate with other agents for complex tasks
private async coordinateWithOtherAgents(task: string, context: AgentContext): Promise<any> {
  try {
    console.log(`🤝 ${this.getName()} coordinating with other agents for: ${task}`);
    
    // Use MCP coordinate_agents tool when available
    const coordinationResult = {
      agentsFound: [],
      taskDelegated: false,
      reason: 'Implement MCP client integration',
      note: 'Use this pattern to coordinate with DevAgent, OfficeAgent, etc.'
    };
    
    // Store coordination attempt in memory
    await this.addMemory(context.user.id, 
      `Multi-agent coordination attempted: ${task}. Result: ${coordinationResult.reason}`,
      {
        coordinationType: 'multi_agent_task',
        task: task,
        timestamp: new Date().toISOString()
      }
    );
    
    return coordinationResult;
  } catch (error) {
    console.warn(`⚠️ Multi-agent coordination failed: ${error}`);
    return { success: false, error: `Coordination failed: ${error}` };
  }
}
```

### Error Handling Pattern

```typescript
// Professional error handling with learning integration
private async handleErrorWithLearning(error: Error, context: AgentContext, operation: string): Promise<void> {
  try {
    // Store error for learning and improvement
    await this.addMemory(context.user.id, 
      `Error in ${operation}: ${error.message}. Recovery protocols applied.`,
      {
        errorType: 'operational_error',
        operation: operation,
        errorMessage: error.message,
        errorStack: error.stack?.substring(0, 500),
        recoveryTimestamp: new Date().toISOString(),
        learningValue: 'high'
      }
    );
    
    console.log(`📝 Error recorded for learning improvement in operation: ${operation}`);
  } catch (memoryError) {
    console.error(`❌ Critical: Error recording failed in ${operation}:`, {
      originalError: error.message,
      memoryError: memoryError
    });
  }
}
```

### Time Awareness Pattern

```typescript
// Proper time handling with timezone awareness
private getCurrentTimeStamp(): { iso: string; unix: number; timezone: string; readable: string } {
  const now = new Date();
  return {
    iso: now.toISOString(),
    unix: now.getTime(),
    timezone: this.timeZone,
    readable: now.toLocaleString('en-US', { 
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };
}
```

## 📊 Quality Standards

### Minimum Requirements

| Aspect | Requirement | Validation Method |
|--------|-------------|-------------------|
| Quality Score | 85% minimum | `oneagent_quality_score` MCP tool |
| Constitutional Compliance | 100% | `oneagent_constitutional_validate` MCP tool |
| Memory Integration | Required | Unit tests with mock memory client |
| Error Handling | Comprehensive | Error injection testing |
| Documentation | Complete | Code review checklist |

### Professional Enhancement Metrics

- **Response Quality:** Target 90%+ quality scores consistently
- **Memory Efficiency:** Optimize memory usage patterns
- **Processing Speed:** < 5 seconds for standard operations
- **Error Recovery:** Graceful fallbacks for all failure modes
- **Learning Integration:** Store meaningful context for improvement

## 🧪 Testing Strategy

### Unit Testing Pattern

```typescript
describe('YourAgent', () => {
  let agent: YourAgent;
  let mockMemoryClient: jest.Mocked<UnifiedMemoryClient>;

  beforeEach(() => {
    mockMemoryClient = createMockMemoryClient();
    agent = new YourAgent({
      id: 'test-agent',
      name: 'Test Agent',
      memoryEnabled: true
    });
    agent['memoryClient'] = mockMemoryClient;
  });

  it('should store messages in unified memory', async () => {
    const context = createTestContext();
    const response = await agent.processMessage(context, 'test message');
    
    expect(mockMemoryClient.storeConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'test message',
        agentId: 'test-agent'
      })
    );
  });

  it('should handle memory failures gracefully', async () => {
    mockMemoryClient.storeConversation.mockRejectedValue(new Error('Memory error'));
    const context = createTestContext();
    
    const response = await agent.processMessage(context, 'test message');
    
    expect(response.content).toBeDefined();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Memory operation failed')
    );
  });
});
```

## 🚀 Best Practices

### Do's ✅

- **Use TemplateAgent.ts** as your starting point
- **Implement graceful fallbacks** for all external dependencies
- **Store comprehensive metadata** in memory operations
- **Apply Constitutional AI principles** to domain-specific content
- **Use proper TypeScript typing** throughout your implementation
- **Include meaningful console logging** for debugging and monitoring
- **Test with memory system enabled and disabled**
- **Document domain-specific patterns and decisions**

### Don'ts ❌

- **Don't skip unified memory integration** - it's required for all agents
- **Don't ignore error handling** - implement comprehensive recovery
- **Don't hard-code values** that should be configurable
- **Don't bypass quality thresholds** without justification
- **Don't forget to update AgentFactory and AgentRegistry**
- **Don't skip testing with realistic scenarios**
- **Don't implement custom memory patterns** - use UnifiedMemoryClient

## 🔄 Integration Points

### AgentFactory Integration

```typescript
// 1. Add import
import { YourAgent } from '../specialized/YourAgent';

// 2. Add to AgentType
export type AgentType = 'dev' | 'office' | 'context7' | 'template' | 'your_domain';

// 3. Add capabilities
const DEFAULT_CAPABILITIES = {
  // ...existing capabilities...
  your_domain: ['capability1', 'capability2', 'capability3']
};

// 4. Add to createAgent switch
case 'your_domain':
  agent = new YourAgent(agentConfig);
  break;
```

### AgentRegistry Integration

```typescript
// Add to initializeMatchingCriteria
this.matchingCriteria.set('your_domain', {
  keywords: ['keyword1', 'keyword2', 'keyword3'],
  requiredCapabilities: ['capability1', 'capability2'],
  priority: 70 // Adjust based on specialization
});

// Add to determineAgentType capability detection
if (message.includes('domain_specific_keyword')) {
  return 'your_domain';
}
```

## 📚 Resources

### Essential Files
- `coreagent/agents/templates/TemplateAgent.ts` - Your starting template
- `coreagent/agents/base/BaseAgent.ts` - Base functionality
- `coreagent/memory/UnifiedMemoryClient.ts` - Memory integration
- `coreagent/agents/communication/MultiAgentMCPServer.ts` - Multi-agent coordination

### Testing Resources
- `tests/agents/` - Agent-specific test patterns
- `tests/memory/` - Memory integration testing
- `tests/integration/` - End-to-end testing patterns

### Documentation
- `docs/implementation/UNIFIED_MEMORY_IMPLEMENTATION_STATUS.md` - Memory system status
- `docs/technical/agent_architecture.md` - Technical architecture
- `docs/API_REFERENCE.md` - API documentation

## 🎉 Success Indicators

Your agent implementation is complete when:

1. **All tests pass** with 85%+ quality scores
2. **Memory integration works** with both real and mock clients
3. **Error handling is comprehensive** with graceful fallbacks
4. **Multi-agent coordination** patterns are implemented where applicable
5. **Constitutional AI patterns** are integrated appropriately
6. **Documentation is complete** and up-to-date
7. **AgentFactory and AgentRegistry** are properly updated
8. **Performance meets standards** (< 5s response time)

---

**Remember:** OneAgent's strength comes from consistency and quality. Follow these patterns, and your agent will integrate seamlessly with the unified system while providing exceptional user experience.
