---
applyTo: 'coreagent/**/*.ts'
---

# TypeScript Development Instructions for OneAgent

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
