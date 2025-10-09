---
applyTo: 'coreagent/**/*.ts'
---

# Agent Instantiation Instructions for OneAgent

> **Authority**: This file complements and does not override the root-level `AGENTS.md`. If guidance conflicts, `AGENTS.md` is authoritative.

## 🚨 Zero Tolerance Policy

**All violations (major or minor) must be fixed before marking a task, PR, or release as complete. No exceptions, no deferrals, no warnings left behind.**

## Canonical Agent Creation Pattern

### ✅ PREFERRED: AgentFactory.createAgent()

```typescript
import { AgentFactory } from '../agents/base/AgentFactory';

// Canonical pattern with full config
const agent = await AgentFactory.createAgent({
  id: 'my-agent-123',
  name: 'My Agent',
  type: 'core', // or 'validator', 'triage', 'dev', 'office', 'fitness', 'planner'
  description: 'Agent description',
  memoryEnabled: true,
  aiEnabled: true,
  sessionId: 'optional-session-id',
  userId: 'optional-user-id',
  customCapabilities: ['capability1', 'capability2'], // optional
  customModel: 'gemini-2.5-pro', // optional
  nlacsEnabled: true, // optional, default true
});
```

**Benefits**:

- ✅ Automatic AgentConfig + PromptConfig creation
- ✅ Unified context injection (time, metadata, session)
- ✅ NLACS enablement by default
- ✅ Proper initialization sequence
- ✅ Consistent across all agent types
- ✅ Constitutional AI integration
- ✅ Memory client setup
- ✅ Model selection via UnifiedModelPicker

### ⚠️ ACCEPTABLE (Legacy): Direct Instantiation with Config

```typescript
import { CoreAgent } from '../agents/specialized/CoreAgent';
import { AgentConfig } from '../agents/base/BaseAgent';
import { PromptConfig } from '../agents/base/PromptEngine';

// Acceptable when you have explicit config and don't need AgentFactory benefits
const config: AgentConfig = {
  id: 'agent-id',
  name: 'Agent Name',
  description: 'Description',
  capabilities: ['capability1'],
  memoryEnabled: true,
  aiEnabled: true,
};

const promptConfig: PromptConfig = {
  // ... prompt configuration
};

const agent = new CoreAgent(config, promptConfig);
await agent.initialize(); // MUST call initialize()
```

**Use Cases**:

- Legacy code that hasn't been migrated yet
- Test code that needs specific configurations
- Singleton exports for convenience (e.g., `export const coreAgent = new CoreAgent()`)

**Requirements**:

- ✅ MUST pass AgentConfig (not undefined, unless constructor has defaults)
- ✅ MUST pass PromptConfig if agent needs prompt engineering
- ✅ MUST call `await agent.initialize()` after construction
- ❌ NEVER skip initialization
- ❌ NEVER pass non-config objects (like system instances) as config

### ❌ FORBIDDEN: Direct Instantiation Without Config

```typescript
// ❌ FORBIDDEN - No config, no initialization
const agent = new CoreAgent();

// ❌ FORBIDDEN - No initialization
const agent = new CoreAgent(config);
// ... (no await agent.initialize())

// ❌ FORBIDDEN - Passing non-config objects
const agent = new CoreAgent(this); // 'this' is not AgentConfig!
```

**Why Forbidden**:

- Missing AgentConfig leads to undefined behavior
- Missing PromptConfig disables prompt engineering
- Missing initialization means no memory, no AI, no capabilities
- Non-config objects cause type mismatches

## Agent Constructor Signatures

All specialized agents MUST have constructor signature matching BaseAgent:

```typescript
constructor(
  config: AgentConfig,           // Required
  promptConfig?: PromptConfig,   // Optional
  memoryClient?: OneAgentMemory  // Optional (FitnessAgent, TriageAgent only)
)
```

### ✅ Verified Agent Signatures

- **CoreAgent**: `constructor(config?: AgentConfig, promptConfig?: PromptConfig)` - config has defaults
- **ValidationAgent**: `constructor(config: AgentConfig, promptConfig?: PromptConfig, memory?: OneAgentMemory)` ✅ Fixed v4.7.2
- **TriageAgent**: `constructor(config: AgentConfig, promptConfig?: PromptConfig, memory?: OneAgentMemory)`
- **DevAgent**: `constructor(config: AgentConfig, promptConfig?: PromptConfig)`
- **OfficeAgent**: `constructor(config: AgentConfig, promptConfig?: PromptConfig)`
- **FitnessAgent**: `constructor(config: AgentConfig, promptConfig?: PromptConfig, memory?: OneAgentMemory)`
- **PlannerAgent**: `constructor(config: AgentConfig, promptConfig?: PromptConfig)`
- **AlitaAgent**: `constructor(config?: Partial<AgentConfig>, promptConfig?: PromptConfig, opts: { memory?: OneAgentMemory })`

## Legacy Patterns (Documented for Migration)

### OneAgentSystem Local CoreAgent (Line 544)

```typescript
// OneAgentSystem.ts has LOCAL CoreAgent class implementing SpecialistAgent interface
class CoreAgent implements SpecialistAgent {
  constructor(oneAgentSystem: OneAgentSystem) {
    this.oneAgentSystem = oneAgentSystem;
    this.existingCoreAgent = new ExistingCoreAgent(); // Uses canonical agent internally
  }
}

// This is a wrapper/adapter pattern for legacy OneAgentSystem routing
// NOT the canonical CoreAgent from agents/specialized/CoreAgent.ts
```

**Status**: Legacy architecture, intentional for backward compatibility. Will be migrated to AgentFactory pattern in future refactoring (Epic TBD).

### Singleton Exports

```typescript
// agents/specialized/CoreAgent.ts line 119
export const coreAgent = new CoreAgent();
```

**Status**: Acceptable for convenience exports. Provides pre-initialized instance for server usage. Secondary pattern to AgentFactory.

### MissionHandler Direct Instantiation

```typescript
// server/mission-control/missionHandler.ts line 56
const planner = new PlannerAgent({
  id: 'planner-mc',
  name: 'PlannerAgent',
  description: 'Mission Control Planner',
  capabilities: ['planning', 'decomposition'],
  memoryEnabled: true,
  aiEnabled: true,
});
await planner.initialize();
```

**Status**: Acceptable (passes explicit config + calls initialize), but SHOULD be migrated to AgentFactory for consistency.

## Migration Guide

### From Direct Instantiation to AgentFactory

**Before**:

```typescript
const coreAgent = new CoreAgent();
await coreAgent.initialize();
```

**After**:

```typescript
import { AgentFactory } from '../agents/base/AgentFactory';

const coreAgent = await AgentFactory.createAgent({
  id: 'core-agent',
  name: 'Core Agent',
  type: 'core',
  description: 'Core orchestrator agent',
  memoryEnabled: true,
  aiEnabled: true,
});
// No need to call initialize() - AgentFactory does it
```

### Lazy Initialization Pattern (ChatAPI Example)

**Before**:

```typescript
export class ChatAPI {
  private coreAgent: CoreAgent;

  constructor() {
    this.coreAgent = new CoreAgent();
    void this.coreAgent.initialize().catch((err) => {
      console.error('[ChatAPI] Failed to initialize CoreAgent:', err);
    });
  }
}
```

**After** (v4.7.2):

```typescript
import { AgentFactory } from '../agents/base/AgentFactory';
import type { ISpecializedAgent } from '../agents/base/ISpecializedAgent';

export class ChatAPI {
  private coreAgent?: ISpecializedAgent; // Use interface, lazy-initialized

  constructor() {
    void this.initializeCoreAgent();
  }

  private async initializeCoreAgent(): Promise<void> {
    try {
      this.coreAgent = await AgentFactory.createAgent({
        id: 'chatapi-core-agent',
        name: 'ChatAPI Core Agent',
        type: 'core',
        description: 'Core orchestrator agent for ChatAPI',
        memoryEnabled: true,
        aiEnabled: true,
      });
    } catch (err) {
      console.error('[ChatAPI] Failed to initialize CoreAgent via AgentFactory:', err);
    }
  }

  async handleChatMessage(req: Request, res: Response): Promise<void> {
    // Ensure agent is initialized before use
    if (!this.coreAgent) {
      await this.initializeCoreAgent();
      if (!this.coreAgent) {
        throw new Error('Failed to initialize CoreAgent');
      }
    }

    const agentResponse = await this.coreAgent.processMessage(agentContext, message);
    // ...
  }
}
```

## PR Reviewer Checklist

When reviewing agent-related PRs, verify:

- [ ] All new agents created via `AgentFactory.createAgent()`
- [ ] No direct `new Agent()` without AgentConfig
- [ ] No direct `new Agent()` without `await initialize()`
- [ ] All agent constructors match BaseAgent signature: `constructor(config, promptConfig?, memory?)`
- [ ] Test files can use direct instantiation (acceptable exception)
- [ ] Legacy patterns (OneAgentSystem, singletons) documented if added
- [ ] Migration path documented if adding new legacy pattern

## Reference

- **BaseAgent Constructor**: `constructor(config: AgentConfig, promptConfig?: PromptConfig, memoryClient?: OneAgentMemory)`
- **AgentFactory**: `coreagent/agents/base/AgentFactory.ts`
- **Agent Interfaces**: `coreagent/agents/base/ISpecializedAgent.ts`
- **Canonical Patterns**: `AGENTS.md` at repository root

## Continuous Education

- All contributors must review this file and `AGENTS.md` before creating new agents
- Run canonical pattern audit monthly: `grep -r "new.*Agent\(" coreagent/ | grep -v test | grep -v AgentFactory`
- CI must enforce: no direct agent instantiation outside AgentFactory (except documented exceptions)

---

**Last Updated**: 2025-10-09 (v4.7.2)
**Canonical Authority**: AGENTS.md
**Zero Tolerance**: All violations must be fixed before PR merge
