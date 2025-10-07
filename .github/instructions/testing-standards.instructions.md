---
applyTo: 'tests/**/*.ts'
---

# Testing Instructions for OneAgent

> Canonicalization: This file complements, but does not override, the root-level `AGENTS.md`. If guidance conflicts, `AGENTS.md` is authoritative. Avoid duplicating rules; reference canonical systems and patterns.

## 🚨 Zero Tolerance Policy

**All violations (major or minor) must be fixed before marking a task, PR, or release as complete. No exceptions, no deferrals, no warnings left behind.**

## Canonical Compliance Testing

All tests must verify that agents and infrastructure use canonical OneAgent systems for time, ID, memory, cache, and communication. Tests must actively detect and reject any parallel system usage.

### Required Canonical Compliance Tests

- Unit tests must verify use of `createUnifiedTimestamp()`, `createUnifiedId()`, `BaseAgent.memoryClient`, and `UnifiedAgentCommunicationService`.
- Integration tests must verify A2A + NLACS flows use canonical systems.
- Smoke tests must verify canonical event flows.
- Violation detection tests (e.g., grep/regex) must be run in CI and before every release.

### Example Violation Detection Test

```typescript
import { execSync } from 'child_process';
const output = execSync(
  'grep -r "new Date()|Date.now()|private memory:|new Map|Math.random|CustomMemoryClass|CustomEventBus" coreagent/ || true',
  { encoding: 'utf-8' },
);
expect(output.trim()).toBe('');
```

## PR Reviewer Checklist (Strict)

- [ ] All tests for canonical compliance pass
- [ ] Violation detection tests pass (no forbidden patterns)
- [ ] No warnings or errors in test output
- [ ] CHANGELOG, ROADMAP, and API_REFERENCE updated if relevant
- [ ] AGENTS.md referenced for any new test pattern

## Green-Before-Done

- Never mark a task or PR complete with any known violation or warning. All must be fixed before completion.

## No Deferred Violations

- All violations must be fixed before closing a task, PR, or release. No exceptions.

## Canonical System Testing

### Required Test Patterns

```typescript
// ✅ REQUIRED - Test with canonical systems
import { createUnifiedTimestamp, createUnifiedId } from '../coreagent/utils/UnifiedBackboneService';
import { OneAgentMemory } from '../coreagent/memory/OneAgentMemory';

describe('Feature Tests', () => {
  beforeEach(() => {
    // Use canonical timestamp for test timing
    const testStart = createUnifiedTimestamp();
  });

  it('should use canonical ID generation', () => {
    const id = createUnifiedId('test', 'scenario');
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });
});
```

### Forbidden Test Patterns

```typescript
// ❌ FORBIDDEN - These create parallel systems in tests
const timestamp = Date.now();
const id = Math.random().toString(36);
const mockMemory = new Map();
```

## Test Quality Standards

### Constitutional AI Testing

- **Accuracy**: Test actual behavior, not assumed behavior
- **Transparency**: Clear test descriptions and expected outcomes
- **Helpfulness**: Tests that help developers understand functionality
- **Safety**: Tests that prevent harmful implementations

### Quality Metrics

- Target 80%+ test coverage
- All tests must pass Constitutional AI validation
- Use canonical systems exclusively
- Document test reasoning and expected behavior

## Agent Testing Patterns

### Agent Factory Testing

```typescript
// ✅ REQUIRED - Test agent creation with canonical systems
import { AgentFactory } from '../coreagent/agents/base/AgentFactory';

describe('Agent Factory', () => {
  it('should create agents with canonical systems', async () => {
    const agent = await AgentFactory.createAgent({
      type: 'test',
      id: createUnifiedId('test', 'agent'),
      name: 'Test Agent',
      memoryEnabled: true,
      aiEnabled: true,
    });

    expect(agent.id).toBeDefined();
    expect(agent.metadata.timestamp).toBeDefined();
  });
});
```

### Memory Testing

```typescript
// ✅ REQUIRED - Test memory operations with canonical system
describe('Memory Operations', () => {
  it('should store and retrieve with canonical memory', async () => {
    const memory = OneAgentMemory.getInstance();

    const testData = {
      content: 'Test memory content',
      metadata: {
        type: 'test_data',
        timestamp: createUnifiedTimestamp(),
      },
    };

    await memory.addMemory(testData);
    // Verify retrieval
  });
});
```

## Test Organization

### File Structure

- `tests/unit/` - Unit tests for individual components
- `tests/integration/` - Integration tests for system interactions
- `tests/e2e/` - End-to-end tests for complete workflows

### Test Naming

- Use descriptive test names that explain behavior
- Include context about canonical system usage
- Document expected outcomes clearly

## Parallel System Detection in Tests

### Watch for These Patterns

```typescript
// ❌ FORBIDDEN - Parallel system usage in tests
const timestamp = Date.now();
const id = Math.random().toString(36);
const cache = new Map();
const memory = {};
```

### Canonical Alternatives

```typescript
// ✅ REQUIRED - Use canonical systems in tests
const timestamp = createUnifiedTimestamp();
const id = createUnifiedId('test', 'context');
const cache = OneAgentUnifiedBackbone.getInstance().cache;
const memory = OneAgentMemory.getInstance();
```

## Quality Assurance

### Pre-Test Checklist

1. Verify canonical system usage throughout tests
2. Check for parallel system patterns
3. Apply Constitutional AI principles to test design
4. Ensure test quality meets 80%+ standard

### Test Validation

- All tests must use canonical systems exclusively
- Test descriptions must be clear and transparent
- Tests must validate actual functionality (accuracy)
- Tests must be helpful for understanding system behavior

Remember: Tests are documentation of how OneAgent systems should work. Use canonical systems exclusively to prevent parallel implementations and maintain architectural integrity.
