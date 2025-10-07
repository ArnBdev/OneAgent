---
applyTo: 'coreagent/**/*.ts'
---

# TypeScript Development Instructions for OneAgent

> Canonicalization: This file complements, but does not override, the root-level `AGENTS.md`. If guidance conflicts, `AGENTS.md` is authoritative. Avoid parallel instructions and always use canonical systems.

## 🚨 Zero Tolerance Policy

**All violations (major or minor) must be fixed before marking a task, PR, or release as complete. No exceptions, no deferrals, no warnings left behind.**

## Canonical System Enforcement

All TypeScript code must use canonical OneAgent systems for time, ID, memory, cache, and communication. Creating parallel systems is strictly forbidden.

### Required Canonical Patterns

```typescript
// Time
const timestamp = createUnifiedTimestamp();
// IDs
const id = createUnifiedId('operation', 'context');
// Memory
const memory = OneAgentMemory.getInstance();
// Cache
const cache = OneAgentUnifiedBackbone.getInstance().cache;
// Communication
const comms = UnifiedAgentCommunicationService.getInstance();
```

### Forbidden Patterns (Zero Tolerance)

```typescript
// ❌ Forbidden time/ID/memory/cache/comm patterns
const timestamp = new Date();
const timestamp = Date.now();
const id = Math.random().toString(36);
const cache = new Map();
const memory = new CustomMemoryClass();
const bus = new CustomEventBus();
private memory: ...
```

### Agent Development

- All new agents must extend `BaseAgent` and implement `ISpecializedAgent`.
- All agent memory operations must use `BaseAgent.memoryClient`.
- All agent communication must use `UnifiedAgentCommunicationService`.

## PR Reviewer Checklist (Strict)

- [ ] No forbidden patterns (see above) anywhere in the diff
- [ ] All new files using time/ID/memory/cache/comm import canonical utilities
- [ ] All agents extend `BaseAgent` and implement `ISpecializedAgent`
- [ ] No warnings or errors in TypeScript or ESLint
- [ ] All tests for canonical compliance pass
- [ ] CHANGELOG, ROADMAP, and API_REFERENCE updated if relevant
- [ ] AGENTS.md referenced for any new architectural pattern

## Canonical Pattern Audit

- Run a grep/regex audit for forbidden patterns at least monthly and before every release:
  - `grep -r "new Date()|Date.now()|private memory:|new Map|Math.random|CustomMemoryClass|CustomEventBus" coreagent/`
- CI must fail if any forbidden pattern is found.

## Continuous Education

- All contributors must review AGENTS.md and canonical patterns quarterly.

## Green-Before-Done

- Never mark a task or PR complete with any known violation or warning. All must be fixed before completion.

## No Deferred Violations

- All violations must be fixed before closing a task, PR, or release. No exceptions.

## Canonical System Requirements

### Mandatory Imports and Usage

```typescript
// ✅ REQUIRED - Always use canonical systems
import { createUnifiedTimestamp, createUnifiedId } from '../utils/UnifiedBackboneService';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { OneAgentUnifiedBackbone } from '../OneAgentUnifiedBackbone';

// ✅ REQUIRED - Canonical usage patterns
const timestamp = createUnifiedTimestamp();
const id = createUnifiedId('operation', 'context');
const memory = OneAgentMemory.getInstance();
const cache = OneAgentUnifiedBackbone.getInstance().cache;
```

### Forbidden Patterns

```typescript
// ❌ FORBIDDEN - These create parallel systems
const timestamp = Date.now();
const id = Math.random().toString(36);
const cache = new Map();
const memory = new CustomMemoryClass();
```

## TypeScript Standards

### Strict Type Safety

- Use strict TypeScript configuration
- Implement comprehensive interfaces
- Apply proper generic constraints
- Use type guards for runtime safety

### Error Handling

```typescript
// ✅ REQUIRED - Use canonical error handling
import { UnifiedBackboneService } from '../utils/UnifiedBackboneService';

try {
  // Implementation
} catch (error) {
  UnifiedBackboneService.errorHandler(error, 'operation-context');
}
```

### Memory Integration

```typescript
// ✅ REQUIRED - Canonical memory operations
const memory = OneAgentMemory.getInstance();

// Store with structured metadata
await memory.addMemory({
  content: 'Implementation pattern',
  metadata: {
    type: 'code_pattern',
    technology: 'typescript',
    timestamp: createUnifiedTimestamp(),
    quality_score: 85,
  },
});
```

## Architecture Patterns

### Agent Implementation

```typescript
// ✅ REQUIRED - Extend BaseAgent
export class CustomAgent extends BaseAgent implements ISpecializedAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    // Use canonical timestamp
    this.metadata.initialized = createUnifiedTimestamp();
  }
}
```

### Service Integration

```typescript
// ✅ REQUIRED - Use UnifiedBackboneService
export class CustomService {
  private readonly backbone = UnifiedBackboneService.getInstance();

  async performOperation(): Promise<void> {
    const operationId = createUnifiedId('service', 'operation');
    // Implementation
  }
}
```

## Quality Standards

- Target 80%+ quality score (Grade A)
- Apply Constitutional AI validation for critical logic
- Use structured error handling with canonical systems
- Implement comprehensive documentation

## Pre-Implementation Checklist

1. Search for existing implementations using oneagent_memory_search
2. Check UnifiedBackboneService for canonical methods
3. Verify no parallel systems are being created
4. Apply Constitutional AI principles to design decisions
5. Ensure 80%+ quality score target

Remember: Always use canonical systems to prevent architectural fragmentation and maintain OneAgent's unified architecture.
