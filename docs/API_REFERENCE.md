# OneAgent v4.4.2 Professional - API Reference

## Canonical Agent Systems

### Overview

All OneAgent specialized agents use **canonical systems** exclusively to prevent parallel implementations and ensure architectural consistency. The canonical patterns are:

1. **Time**: `createUnifiedTimestamp()` via `UnifiedBackboneService`
2. **IDs**: `createUnifiedId('operation', 'context')` via `UnifiedBackboneService`
3. **Memory**: `BaseAgent.memoryClient` (OneAgentMemory singleton)
4. **Communication**: `UnifiedAgentCommunicationService` (A2A + NLACS + memory audit)

### Canonical Time Pattern

```typescript
import { createUnifiedTimestamp } from './UnifiedBackboneService';

// ✅ CORRECT - Use canonical timestamp
const timestamp = createUnifiedTimestamp();
console.log(timestamp.iso); // ISO 8601 string
console.log(timestamp.unix); // Unix milliseconds
console.log(timestamp.utc); // UTC string

// ❌ FORBIDDEN - Parallel time systems
const timestamp = new Date();
const timestamp = Date.now();
const timestamp = new Date().toISOString();
```

### Canonical ID Generation Pattern

```typescript
import { createUnifiedId } from './UnifiedBackboneService';

// ✅ CORRECT - Use canonical ID generation
const messageId = createUnifiedId('message', fromAgent);
const sessionId = createUnifiedId('session', 'agent-coordination');
const taskId = createUnifiedId('task', 'planner-decomposition');

// ❌ FORBIDDEN - Parallel ID systems
const id = Math.random().toString(36);
const id = uuid.v4();
const id = `custom-${Date.now()}`;
```

### Canonical Memory Pattern

```typescript
import { BaseAgent } from './agents/base/BaseAgent';

// ✅ CORRECT - Use BaseAgent.memoryClient
export class CustomAgent extends BaseAgent implements ISpecializedAgent {
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    // Store in canonical memory
    await this.memoryClient?.addMemory({
      content: 'Agent processed message',
      metadata: {
        agentId: this.config.id,
        timestamp: createUnifiedTimestamp().iso,
        category: 'agent_processing',
      },
    });

    // Search canonical memory
    const results = await this.memoryClient?.searchMemory({
      query: 'previous interactions',
      userId: context.user.id,
      limit: 5,
    });
  }
}

// ❌ FORBIDDEN - Parallel memory systems
private memory: CustomMemoryClass;
this.memory.add({ ... });
```

### Canonical Agent Communication Pattern

```typescript
import { UnifiedAgentCommunicationService } from './utils/UnifiedAgentCommunicationService';

// ✅ CORRECT - Use UnifiedAgentCommunicationService
const unifiedComms = UnifiedAgentCommunicationService.getInstance();

// Register agent
const agentId = await unifiedComms.registerAgent({
  id: 'my-agent',
  name: 'MyAgent',
  capabilities: ['analysis', 'triage'],
  health: await getHealthStatus(),
});

// Create session
const sessionId = await unifiedComms.createSession({
  name: 'coordination-session',
  participants: ['agent1', 'agent2'],
  topic: 'collaborative-task',
});

// Send message
const messageId = await unifiedComms.sendMessage({
  fromAgent: 'agent1',
  toAgent: 'agent2',
  content: 'Task completed',
  sessionId: sessionId,
  messageType: 'direct',
});

// ❌ FORBIDDEN - Parallel communication systems
class CustomEventBus { ... }
const bus = new CustomEventBus();
```

### TemplateAgent - Canonical Reference Implementation

The `TemplateAgent` (`coreagent/agents/templates/TemplateAgent.ts`) provides a **100% canonical compliant** template for creating new specialized agents:

```typescript
import { BaseAgent } from '../base/BaseAgent';
import { ISpecializedAgent } from '../base/ISpecializedAgent';
import { createUnifiedTimestamp, createUnifiedId } from '../../utils/UnifiedBackboneService';

export class TemplateAgent extends BaseAgent implements ISpecializedAgent {
  private lastActivity: Date = new Date(createUnifiedTimestamp().utc);

  async initialize(): Promise<void> {
    await this.memoryClient?.addMemory({
      content: 'TemplateAgent initialized',
      metadata: {
        agentId: this.config.id,
        timestamp: createUnifiedTimestamp().iso,
        category: 'agent_lifecycle',
      },
    });
  }

  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    const operationId = createUnifiedId('operation', 'template_process');

    // All memory via BaseAgent.memoryClient
    await this.addMemory({
      content: `Processed: ${message}`,
      metadata: {
        operationId,
        timestamp: createUnifiedTimestamp().iso,
      },
    });

    return {
      content: 'Response',
      metadata: {
        agentId: this.config.id,
        operationId,
        timestamp: createUnifiedTimestamp().iso,
      },
    };
  }
}
```

**Key Patterns**:

- Extends `BaseAgent` (inherits `memoryClient`)
- Implements `ISpecializedAgent` interface
- Uses `createUnifiedTimestamp()` for all timestamps
- Uses `createUnifiedId()` for operation IDs
- Uses `this.addMemory()` for memory operations (delegates to `BaseAgent.memoryClient`)

### Agent Lifecycle & Factory Pattern

```typescript
import { AgentFactory } from './agents/base/AgentFactory';

// ✅ CORRECT - Use AgentFactory for agent creation
const devAgent = await AgentFactory.createDevAgent({
  memory: OneAgentMemory.getInstance(),
  enableNLACS: true,
});

const triageAgent = await AgentFactory.createTriageAgent({
  memory: OneAgentMemory.getInstance(),
  enableNLACS: true,
});

// Factory ensures canonical patterns:
// - Session IDs via createUnifiedId
// - Metadata via UnifiedBackboneService
// - Memory injection (no parallel memory systems)
// - NLACS enablement with canonical metadata
```

### NLACS (Natural Language Agent Coordination) Pattern

```typescript
// ✅ CORRECT - NLACS via BaseAgent
export class MyAgent extends BaseAgent implements ISpecializedAgent {
  constructor(config: AgentConfig, memory?: OneAgentMemory) {
    super(config, promptConfig, memory);

    // Enable NLACS with canonical metadata
    this.enableNLACS([
      { type: 'discussion', enabled: true },
      { type: 'entity_extraction', enabled: true },
    ]);
  }

  // NLACS automatically uses:
  // - BaseAgent.memoryClient for entity storage
  // - createUnifiedTimestamp() for coordination metadata
  // - UnifiedAgentCommunicationService for enhanced sessions
}
```

### Agent Discovery & Health Pattern

```typescript
// ✅ CORRECT - Discovery via UnifiedAgentCommunicationService
const unifiedComms = UnifiedAgentCommunicationService.getInstance();

// Discover agents with health status
const agents = await unifiedComms.discoverAgents({
  capabilities: ['triage', 'analysis'],
  status: 'online',
  limit: 10,
});

// Each agent card includes:
// - id, name, capabilities (from registration)
// - lastActive (createUnifiedTimestamp())
// - health status (healthy/degraded/unhealthy)
// - uptime calculation (canonical timestamps)
```

---

## Constitutional AI Tools

### `oneagent_constitutional_validate`

Validate responses against Constitutional AI principles.

```typescript
interface ConstitutionalValidateRequest {
  response: string;
  userMessage: string;
  context?: object;
}

interface ConstitutionalValidateResponse {
  isValid: boolean;
  score: number; // 0-100
  violations: Violation[];
  suggestions: string[];
  refinedResponse: string;
  qualityMetrics: {
    accuracy: boolean;
    transparency: boolean;
    helpfulness: boolean;
    safety: boolean;
  };
}
```

### `oneagent_bmad_analyze`

Apply BMAD 9-point elicitation framework for complex reasoning.

```typescript
interface BMADAnalyzeRequest {
  task: string;
}

interface BMADAnalyzeResponse {
  task: string;
  analysis: {
    selectedPoints: BMADPoint[];
    enhancedMessage: string;
    qualityFramework: string;
    complexity: 'simple' | 'complex';
    confidence: number;
  };
  framework: 'BMAD 9-Point Elicitation';
  complexity: 'simple' | 'complex';
  confidence: number;
}
```

### `oneagent_quality_score`

Generate quality scoring with professional grading.

```typescript
interface QualityScoreRequest {
  content: string;
  criteria?: string[];
}

interface QualityScoreResponse {
  content: string;
  qualityScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  criteria: string[];
  professionalGrade: 'A' | 'B' | 'C' | 'D';
}
```

## Memory Management Tools

### `oneagent_memory_context`

Retrieve relevant memory context for enhanced responses.

```typescript
interface MemoryContextRequest {
  query: string;
  userId: string;
  limit?: number;
}

interface MemoryContextResponse {
  query: string;
  userId: string;
  memories: Memory[];
  totalFound: number;
  contextEnhancement: {
    semantic: boolean;
    temporal: boolean;
    relevanceScoring: boolean;
  };
}
```

### `oneagent_memory_create`

Create new memory with real-time learning capability.

```typescript
interface MemoryCreateRequest {
  content: string;
  userId: string;
  memoryType?: 'short_term' | 'long_term' | 'workflow' | 'session';
  metadata?: object;
}
```

## Enhanced Development Tools

### `oneagent_ai_assistant`

AI assistance with Constitutional AI validation.

```typescript
interface AIAssistantRequest {
  message: string;
  applyConstitutional?: boolean;
  qualityThreshold?: number; // 0-100
}
```

### `oneagent_enhanced_search`

Enhanced web search with quality filtering.

```typescript
interface EnhancedSearchRequest {
  query: string;
  filterCriteria?: string[];
  includeQualityScore?: boolean;
}
```

### `oneagent_semantic_analysis`

Advanced semantic analysis with 768-dimensional embeddings.

```typescript
interface SemanticAnalysisRequest {
  text: string;
  analysisType: 'similarity' | 'classification' | 'clustering';
}
```

### `oneagent_system_health`

Comprehensive system health and performance metrics derived from canonical services.

```typescript
interface SystemHealthResponse {
  success: boolean;
  healthMetrics: {
    overall: {
      status: 'healthy' | 'degraded' | 'error';
      uptime: number; // process.uptime()
      timestamp: number | string; // unified timestamp
      version: string; // from getAppVersion()
    };
    components: Record<
      string,
      {
        status: string;
        // Additional component-specific fields (canonical):
        // memory: process memoryUsage, connection status, ops summary
        // mcp: protocol, port, avg response time, error rate, active connections, servers, cache hit rate
        // performance: cpu/memory usage, response time (avg/p95/p99), throughput, quality/compliance
      }
    >;
  };
  operationSummary: {
    generatedAt: string;
    totalOperations: number;
    components: Record<
      string,
      {
        operations: Record<
          string,
          { success: number; error: number; total: number; errorRate: number }
        >;
        totals: { success: number; error: number; total: number; errorRate: number };
      }
    >;
  };
  includeDetails: boolean;
  components: string[]; // requested components
  capabilities: string[];
  toolName: 'oneagent_system_health';
  constitutionalCompliant: true;
  qualityScore: number; // informational
  timestamp: number | string;
  metadata: Record<string, unknown> & { operationId: string };
}
```

Notes:

- All metrics are sourced from canonical systems: UnifiedMonitoringService, UnifiedBackboneService, and the unified MCP client; no parallel counters or stores are introduced.
- The `operationSummary` shape matches `docs/monitoring/OPERATION_METRICS.md`.

## Life Companion Frameworks

### Work Productivity (P-R-O-D-U-C-E)

- **P**lan: Strategic task prioritization and goal alignment
- **R**ecognize: Pattern recognition for productivity optimization
- **O**rganize: Systematic workflow and resource management
- **D**eliver: Quality execution with milestone tracking
- **U**nderstand: Context awareness and stakeholder needs
- **C**onnect: Cross-project knowledge transfer and collaboration
- **E**volve: Continuous improvement and skill development

### Family Relationships (F-A-M-I-L-Y)

- **F**eel: Emotional intelligence and empathy development
- **A**ttend: Active listening and presence cultivation
- **M**emory: Shared experience and milestone tracking
- **I**ntegrate: Harmony between family and other life domains
- **L**ove: Unconditional support and appreciation expression
- **Y**ield: Growth through compromise and understanding

### Personal Growth (G-R-O-W-T-H)

- **G**oals: Clear vision setting and milestone definition
- **R**eflect: Self-awareness and pattern recognition
- **O**ptimize: Continuous improvement and skill development
- **W**isdom: Learning integration and insight application
- **T**ransform: Sustainable change and habit formation
- **H**armony: Balanced integration across all life domains

### Cross-Domain Learning (L-I-N-K)

- **L**earn: Pattern recognition across all life domains
- **I**ntegrate: Knowledge transfer between contexts
- **N**etwork: Connection mapping between insights
- **K**nowledge: Wisdom accumulation and application

## Usage Examples

### Constitutional AI Validation

```javascript
const validation = await oneagent_constitutional_validate({
  response: 'Your implementation approach',
  userMessage: "User's original request",
  context: { projectType: 'life-companion' },
});

if (validation.score >= 85) {
  console.log('High-quality response validated');
}
```

## MCP Methods (HTTP JSON-RPC)

### tools/sets

List available tool sets and the currently active set IDs.

Request:

```json
{ "jsonrpc": "2.0", "id": 1, "method": "tools/sets" }
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "toolSets": [
      {
        "id": "constitutional-ai",
        "name": "Constitutional AI",
        "tools": ["oneagent_constitutional_validate", "oneagent_quality_score"]
      },
      {
        "id": "memory-context",
        "name": "Memory Context",
        "tools": [
          "oneagent_memory_search",
          "oneagent_memory_add",
          "oneagent_memory_edit",
          "oneagent_memory_delete"
        ]
      }
      // ...
    ],
    "active": ["system-management"]
  }
}
```

Headers: The server adds `X-OneAgent-Tool-Count` to show the count after filtering.

### tools/sets/activate

Activate a specific set of tool sets by ID.

Request:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/sets/activate",
  "params": { "setIds": ["system-management", "research-analysis"] }
}
```

Response:

```json
{ "jsonrpc": "2.0", "id": 2, "result": { "active": ["system-management", "research-analysis"] } }
```

Notes:

- Some tools are always allowed (e.g., `oneagent_system_health`) and A2A-prefixed tools remain available regardless of set activation.
- You can also toggle from inside the engine using the tool `oneagent_toolsets_toggle` with the same `setIds` parameter.

### BMAD Analysis for Complex Tasks

```javascript
const analysis = await oneagent_bmad_analyze({
  task: 'Implement cross-domain learning for work-family integration',
});

console.log(`Complexity: ${analysis.complexity}`);
console.log(`Confidence: ${analysis.confidence}`);
```

### Quality Assessment

```javascript
const quality = await oneagent_quality_score({
  content: 'Your response content',
  criteria: ['accuracy', 'helpfulness', 'clarity'],
});

console.log(`Grade: ${quality.professionalGrade}`);
console.log(`Score: ${quality.qualityScore}/100`);
```
