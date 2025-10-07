# OneAgent Model Selection Architecture

> **Status**: Production-ready (Epic 15 Implementation Complete)  
> **Last Updated**: 2025-10-01  
> **Owner**: Lead Developer Team

## Executive Summary

OneAgent uses a **capability-based, provider-agnostic** model selection system that automatically routes requests to the most appropriate AI model based on the task requirements, cost constraints, and quality needs.

### Key Features

- **🎯 Capability-Based Routing**: Select models by what you need, not by provider
- **💰 Cost Optimization**: Automatically use cheaper models for simple tasks
- **🔄 Provider Flexibility**: Easy switching between Google, OpenAI, Claude (future)
- **🚀 Auto-Updates**: `-latest` aliases get improvements without code changes
- **⚖️ Quality Tiers**: Three tiers matching task complexity

---

## Architecture Overview

### The Three-Tier System (Epic 15)

```typescript
// OneAgent Capability Tiers
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  UTILITY            → Flash Lite / GPT-4o-mini               │
│  (High-throughput)    $0.10/1M tokens, ~200ms                │
│                       • Triage, routing, logging             │
│                       • Simple classifications               │
│                                                               │
│  AGENTIC_REASONING  → Flash / GPT-4o                         │
│  (Main agent work)    $0.35/1M tokens, ~400ms                │
│                       • Agent execution, tool calls          │
│                       • Code analysis, planning              │
│                                                               │
│  DEEP_ANALYSIS      → Pro / o1-preview                       │
│  (Complex reasoning)  $1.00/1M tokens, ~2s                   │
│                       • BMAD framework analysis              │
│                       • Constitutional AI validation         │
│                       • Multi-step problem solving           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Provider Selection Logic

The system defaults to **Google Gemini** models with automatic fallback to OpenAI:

```typescript
// Default: Google Gemini (preferred for cost/performance)
const model = getModelFor('agentic_reasoning');
// → Returns: SmartGeminiClient with gemini-flash-latest

// Override via environment variable
process.env.ONEAGENT_PREFER_OPENAI = '1';
const model = getModelFor('agentic_reasoning');
// → Returns: SmartOpenAIClient with gpt-4o
```

---

## Configuration System

### Environment Variables (`.env`)

OneAgent uses `.env` as the canonical configuration system:

```bash
# === Provider Selection ===
# Default: Use Google Gemini models
# Set to '1' to prefer OpenAI models instead
ONEAGENT_PREFER_OPENAI=0

# API Keys (both optional, system picks best available)
GOOGLE_API_KEY=your_google_key_here
GEMINI_API_KEY=your_gemini_key_here  # Alias for GOOGLE_API_KEY
OPENAI_API_KEY=your_openai_key_here

# === Embeddings Configuration ===
# Controls which provider to use for embeddings specifically
# Values: 'gemini' (default) | 'openai'
ONEAGENT_EMBEDDINGS_SOURCE=gemini

# Embedding model override (optional)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # If using OpenAI embeddings
```

### Provider Selection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   getModelFor(capability)                     │
└────────────────────────────┬────────────────────────────────┘
                             ↓
                    Check ONEAGENT_PREFER_OPENAI
                             ↓
                    ┌────────┴────────┐
                    │                 │
              OPENAI=1          OPENAI=0 (default)
                    │                 │
                    ↓                 ↓
            ┌───────────────┐  ┌──────────────┐
            │  OpenAI Path  │  │ Gemini Path  │
            └───────────────┘  └──────────────┘
                    │                 │
                    ↓                 ↓
        ┌───────────────────────────────────────┐
        │  Capability → Model Mapping           │
        │  • utility → gpt-4o-mini / flash-lite │
        │  • agentic → gpt-4o / flash           │
        │  • deep → o1-preview / pro            │
        └───────────────────────────────────────┘
```

---

## Usage Examples

### Basic Usage (Code)

```typescript
import { getModelFor } from './config/UnifiedModelPicker';

// Example 1: Simple triage task
const triageModel = getModelFor('utility');
const result = await triageModel.chat('Is this a bug or feature request?');
// → Uses gemini-flash-lite-latest (cheapest option)

// Example 2: Agent execution
const agentModel = getModelFor('agentic_reasoning');
const plan = await agentModel.chat('Create a plan to implement this feature');
// → Uses gemini-flash-latest (balanced cost/quality)

// Example 3: Complex analysis
const analysisModel = getModelFor('deep_analysis');
const bmad = await analysisModel.chat('Perform BMAD framework analysis on...');
// → Uses gemini-pro-latest (highest quality)
```

### Embeddings Configuration

```typescript
import { getEmbeddingClient, getEmbeddingModel } from './config/UnifiedModelPicker';

// Get embedding client (respects ONEAGENT_EMBEDDINGS_SOURCE)
const embedClient = getEmbeddingClient();
const embedding = await embedClient.generateEmbedding('Some text to embed');

// Get embedding model name
const modelName = getEmbeddingModel();
// → Returns: 'gemini-embedding-001' (default) or 'text-embedding-3-small' (if OPENAI)
```

### Task-Type Optimization (Recommended)

**For production use, prefer `EnhancedEmbeddingService`** which provides task-specific optimization:

```typescript
import {
  embedDocument,
  embedQuery,
  embedForSimilarity,
  embedCodeQuery,
} from './coreagent/services/EnhancedEmbeddingService';

// Optimized for indexing (uses RETRIEVAL_DOCUMENT task type)
const docEmbedding = await embedDocument('Content to index');

// Optimized for search (uses RETRIEVAL_QUERY task type)
const queryEmbedding = await embedQuery('Search query');

// Optimized for similarity comparison (uses SEMANTIC_SIMILARITY task type)
const simEmbedding = await embedForSimilarity('Compare this text');

// Optimized for code search (uses CODE_RETRIEVAL_QUERY task type)
const codeEmbedding = await embedCodeQuery('async function example()');
```

**Benefits:**

- 5-15% accuracy improvement via asymmetric optimization
- Automatic dimension control (768 default, benchmarked optimal)
- Task-specific semantic tuning (8 Gemini task types)
- See [EMBEDDING_OPTIMIZATION_GUIDE.md](./EMBEDDING_OPTIMIZATION_GUIDE.md) for details

### Switching Providers

```bash
# Development: Use Gemini (default, cost-effective)
ONEAGENT_PREFER_OPENAI=0

# Production: Force OpenAI for specific deployment
ONEAGENT_PREFER_OPENAI=1

# Hybrid: Gemini for text, OpenAI for embeddings
ONEAGENT_PREFER_OPENAI=0
ONEAGENT_EMBEDDINGS_SOURCE=openai
```

---

## Model Registry

### Google Gemini Models (Default Provider)

| Capability          | Model                    | Context | Cost/1M | Latency | Use Cases                                  |
| ------------------- | ------------------------ | ------- | ------- | ------- | ------------------------------------------ |
| `utility`           | gemini-flash-lite-latest | 128K    | $0.10   | ~200ms  | Triage, routing, simple tasks              |
| `agentic_reasoning` | gemini-flash-latest      | 1M      | $0.35   | ~400ms  | Agent work, tool calls, planning           |
| `deep_analysis`     | gemini-pro-latest        | 2M      | $1.00   | ~2s     | BMAD, Constitutional AI, complex reasoning |
| `embedding_text`    | gemini-embedding-001     | 2K      | $0.13   | ~100ms  | Memory, search, semantic vectors           |

### OpenAI Models (Optional Provider)

| Capability          | Model                  | Context | Cost/1M | Latency | Use Cases                        |
| ------------------- | ---------------------- | ------- | ------- | ------- | -------------------------------- |
| `utility`           | gpt-4o-mini            | 128K    | $0.15   | ~300ms  | Triage, routing, simple tasks    |
| `agentic_reasoning` | gpt-4o                 | 128K    | $0.60   | ~500ms  | Agent work, tool calls, planning |
| `deep_analysis`     | o1-preview             | 128K    | $1.50   | ~3s     | Complex reasoning, deep analysis |
| `embedding_text`    | text-embedding-3-small | 8K      | $0.02   | ~50ms   | Memory, search, semantic vectors |

### Legacy Compatibility Mapping

```typescript
// Old API (still supported)
getModelFor('fast_text')      → routes to 'agentic_reasoning'
getModelFor('advanced_text')  → routes to 'deep_analysis'

// New API (Epic 15)
getModelFor('utility')           → optimized routing
getModelFor('agentic_reasoning') → optimized routing
getModelFor('deep_analysis')     → optimized routing
```

---

## Cost Optimization Strategy

### Automatic Cost Reduction

OneAgent **automatically selects cheaper models** for appropriate tasks:

```typescript
// ❌ Old approach: Everything uses expensive model
const model = new GeminiClient({ model: 'gemini-pro' });
await model.chat('Simple yes/no question'); // Wastes $$$

// ✅ New approach: Capability-based routing
const model = getModelFor('utility'); // Auto-selects flash-lite
await model.chat('Simple yes/no question'); // 70% cost reduction!
```

### Cost Comparison (per 1M tokens)

```
Task Type              Old Cost    New Cost    Savings
─────────────────────────────────────────────────────
Triage/Routing         $1.00       $0.10       90%
Agent Execution        $1.00       $0.35       65%
Complex Analysis       $1.00       $1.00       0%
─────────────────────────────────────────────────────
Average Savings                                75%
```

---

## Agent Integration

### AgentFactory Defaults (Automatic)

The `AgentFactory` automatically maps agent types to capabilities:

```typescript
// No manual configuration needed!

// Office/Fitness/General agents → utility
const officeAgent = await AgentFactory.createAgent({ type: 'office' });
// → Automatically uses gemini-flash-lite-latest

// Core/Development/Triage agents → agentic_reasoning
const devAgent = await AgentFactory.createAgent({ type: 'development' });
// → Automatically uses gemini-flash-latest

// Validator/Complex agents → can request deep_analysis explicitly
const validator = await AgentFactory.createAgent({
  type: 'core',
  capability: 'deep_analysis', // Optional override
});
```

### Manual Capability Override

```typescript
import { BaseAgent } from './agents/base/BaseAgent';
import { getModelFor } from './config/UnifiedModelPicker';

class CustomAgent extends BaseAgent {
  async performComplexAnalysis(data: string): Promise<string> {
    // Override to use deep analysis model for this specific operation
    const deepModel = getModelFor('deep_analysis');
    return await deepModel.chat(`Analyze deeply: ${data}`);
  }

  async performSimpleTriage(data: string): Promise<string> {
    // Use utility model for simple operations
    const utilityModel = getModelFor('utility');
    return await utilityModel.chat(`Quick check: ${data}`);
  }
}
```

---

## Memory Server Integration

The mem0 FastMCP memory server uses Google Gemini by default:

```python
# servers/mem0_fastmcp_server.py
config = {
    "llm": {
        "provider": "gemini",  # mem0 provider key for Gemini
        "config": {
            "model": "gemini-1.5-flash-latest",
            "api_key": google_api_key,
        }
    },
    "embedder": {
        "provider": "gemini",
        "config": {
            "model": "gemini-embedding-001",  # Current Gemini embedding (768 dims default, supports 128-3072)
        }
    }
}
```

**Important**: Use `gemini-embedding-001` (current Gemini model), NOT the deprecated `text-embedding-004` or `embedding-001` (legacy Google models being phased out in October 2025).

This ensures **consistent provider usage** across the entire OneAgent ecosystem.

---

## Future Extensibility

### Adding New Providers

The architecture is designed for easy extension:

```typescript
// Future: Claude support
if (process.env.ONEAGENT_PREFER_CLAUDE === '1') {
  return new SmartClaudeClient({
    model: 'claude-3-opus-latest',
  });
}

// Future: Local models
if (process.env.ONEAGENT_PREFER_LOCAL === '1') {
  return new LocalModelClient({
    endpoint: process.env.LOCAL_MODEL_ENDPOINT,
  });
}
```

### Settings UI (Roadmap)

Future enhancement will surface provider selection in a settings UI:

```typescript
// Planned: Settings API
await oneAgent.settings.setProvider('openai');
await oneAgent.settings.setCapabilityModel('deep_analysis', 'o1-preview');
```

---

## Best Practices

### ✅ Do This

```typescript
// Use capability-based selection
const model = getModelFor('agentic_reasoning');

// Let AgentFactory handle defaults
const agent = await AgentFactory.createAgent({ type: 'development' });

// Override only when needed
const deepModel = getModelFor('deep_analysis');
```

### ❌ Don't Do This

```typescript
// Don't hardcode models
const client = new GeminiClient({ model: 'gemini-pro' });

// Don't bypass capability system
const model = process.env.ONEAGENT_PREFER_OPENAI ? new OpenAIClient() : new GeminiClient();
```

---

## Monitoring & Observability

### Cost Tracking (Planned)

```typescript
// Future: Automatic cost tracking
const metrics = await oneAgent.metrics.getCostBreakdown();
// → { utility: $0.50, agentic: $2.10, deep: $1.20 }
```

### Provider Health

```typescript
// Current: Monitor via system health
const health = await oneAgent.systemHealth();
// → { gemini: 'operational', openai: 'degraded' }
```

---

## Troubleshooting

### Issue: Models not switching providers

**Check:**

1. Is `ONEAGENT_PREFER_OPENAI` set correctly in `.env`?
2. Are both API keys available?
3. Restart the server after changing `.env`

**Fix:**

```bash
# Verify environment
echo $ONEAGENT_PREFER_OPENAI

# Reload configuration
npm run server:unified  # Restart MCP server
```

### Issue: High costs

**Check:**

1. Are you using `deep_analysis` for simple tasks?
2. Is `utility` tier being used for triage/routing?

**Fix:**

```typescript
// Audit capability usage
const model = getModelFor('utility'); // Change from 'deep_analysis'
```

---

## References

- [UnifiedModelPicker.ts](../coreagent/config/UnifiedModelPicker.ts) - Implementation
- [AgentFactory.ts](../coreagent/agents/base/AgentFactory.ts) - Agent defaults
- [MODEL_PICKER_ARCHITECTURE.md](./MODEL_PICKER_ARCHITECTURE.md) - Technical details
- [EMBEDDING_OPTIMIZATION_GUIDE.md](./EMBEDDING_OPTIMIZATION_GUIDE.md) - Task-type optimization and dimension benchmarks
- [EMBEDDING_MODELS_CLARIFICATION.md](./EMBEDDING_MODELS_CLARIFICATION.md) - Model details
- [AGENTS.md](../AGENTS.md) - Canonical agent instructions

---

## Summary

**Key Takeaways:**

1. **Use capabilities, not providers**: `getModelFor('agentic_reasoning')` not `new GeminiClient()`
2. **Default is Gemini**: Cost-effective and performant
3. **Override via `.env`**: `ONEAGENT_PREFER_OPENAI=1` to switch
4. **Three tiers**: utility (cheap) → agentic (balanced) → deep (expensive)
5. **AgentFactory handles defaults**: No manual configuration needed

**Next Steps:**

- Review your agent implementations for hardcoded models
- Set `ONEAGENT_PREFER_OPENAI` if you prefer OpenAI
- Monitor costs and adjust capability usage as needed
- Consider future Settings UI for runtime configuration

---

_This architecture ensures OneAgent remains **cost-effective**, **provider-agnostic**, and **future-ready** while maintaining the highest quality standards._
