# OneAgent Memory System Transition Plan: mem0 Canonical Integration

## Purpose
This document outlines the transition of OneAgent's memory system to use the canonical mem0 implementation, ensuring production-grade, research-backed, and future-proof memory operations across all agents, tools, and services.

## Why This Transition?
- **Eliminate legacy/bridge code:** Remove all custom bridges and wrappers. Use mem0's official API and methods directly.
- **Canonical best practices:** Adopt mem0's proven, research-backed architecture for memory add/search/update/delete, fact extraction, and graph/multimodal support.
- **Single source of truth:** All memory operations in OneAgent will use the same canonical mem0 methods, ensuring consistency, maintainability, and reliability.
- **Future-proofing:** mem0 is actively maintained and rapidly evolving, with support for new LLMs, embedders, and features.

## Transition Steps

### 1. Remove All Legacy and Bridge Code
- Delete all custom memory bridges, wrappers, and adapters (e.g., `OneAgentMem0Bridge`, `EnhancedMem0Client`).
- Remove any code that attempts to abstract or wrap mem0's API.

### 2. Install mem0 Canonically
- For Node.js/TypeScript: `npm install mem0ai`
- For Python (if REST API or advanced features needed): `pip install "mem0ai[graph]"`
- Configure `.env` with all required API keys (OpenAI, Gemini, etc.) and storage settings.

### 3. Refactor All Memory Operations
- Replace all memory add/search/update/delete logic with direct calls to mem0's API (Node or Python, as appropriate).
- Use mem0's canonical methods for:
  - Adding memories (with fact extraction, custom prompts if needed)
  - Searching memories (semantic, literal, graph, multimodal)
  - Updating and deleting memories
  - Graph memory and agent/user isolation
  - Multimodal (text, image) support
- Ensure all agents, tools, and services use the same mem0 instance/config.

### 4. Configuration and Initialization
- Centralize all mem0 config in a single location (e.g., `config/mem0.ts` or `.env`).
- Use environment variables for all secrets and model keys.
- Document all config options and their precedence (explicit > env > default).

### 5. Testing and Validation
- Run all OneAgent integration and regression tests using the new canonical memory system.
- Validate semantic search, literal match, user/agent isolation, and multimodal support.
- Test with both OpenAI and Gemini embedders (via REST API if needed).

### 6. Documentation and Training
- Update all developer docs to reference mem0's official API and methods.
- Remove references to legacy bridges/wrappers.
- Provide examples for common memory operations in both Node and Python.

## Should We Use mem0 Methods Directly?
**YES.**
- Using mem0's canonical methods directly (instead of a custom bridge) ensures:
  - Consistency across all agents and tools
  - Immediate access to new features and bugfixes
  - Elimination of technical debt and duplicated logic
  - Alignment with industry best practices and mem0's research
- All memory operations should be refactored to use mem0's API as the single source of truth.

## Example: Node.js Canonical Usage
```js
import { Memory } from 'mem0ai/oss';
const memory = new Memory();
await memory.add(messages, { userId: "alice" });
const results = await memory.search('What do you know about me?', { userId: "alice" });
```

## Example: Python Canonical Usage (REST API or Advanced)
```python
from mem0 import Memory
config = { ... }
m = Memory.from_config(config)
m.add("text", user_id="user")
results = m.search("query", user_id="user")
```

## Canonical OneAgent Memory Architecture (Post-Transition)

### 1. High-Level Overview
- **All memory operations (add, search, update, delete, graph, multimodal) use mem0 canonical API directly.**
- **No custom bridges, wrappers, or legacy servers/scripts.**
- **Single source of truth for all agents, tools, and services.**
- **Graph memory and vector memory are unified via mem0’s API/config.**
- **All configuration is centralized and environment-driven.**

### 2. Core Classes and Methods (Node.js Example)

#### Main Class
- `Memory` (from `mem0ai/oss`)
  - `.add(messages, { userId, agentId?, metadata? })`
  - `.search(query, { userId, agentId?, filters? })`
  - `.update(memoryId, newContent)`
  - `.delete(memoryId)`
  - `.deleteAll({ userId, agentId? })`
  - `.getAll({ userId, agentId? })`
  - `.history(memoryId)`
  - `.reset()`

#### Graph Memory
- Graph memory is enabled/configured via the mem0 config object.
- Supports Neo4j and Memgraph as graph backends.
- Example config:
  ```js
  const memory = new Memory({
    graphStore: {
      provider: 'memgraph',
      config: {
        url: 'bolt://localhost:7687',
        username: 'memgraph',
        password: 'yourpassword',
      },
    },
  });
  ```

#### Multimodal Support
- `.add()` and `.search()` support text, images, and other modalities.

#### Fact Extraction and Update Prompts
- Custom prompts are set in config for domain-specific extraction/update logic.

### 3. Implementation Plan (Step-by-Step)

#### **A. Remove All Legacy Code and Servers**
- Delete all custom memory bridges, wrappers, adapters (e.g., `OneAgentMem0Bridge`, `EnhancedMem0Client`).
- Remove all legacy memory servers, scripts, and related config.
- Clean up all references in agents, tools, and tests.
- Remove any custom ChromaDB, FastAPI, or Python memory server code.

#### **B. Install mem0 Canonically**
- For Node.js/TypeScript: `npm install mem0ai`
- For Python (if REST API or advanced features needed): `pip install "mem0ai[graph]"`
- Configure `.env` with all required API keys (OpenAI, Gemini, etc.), vector/graph DB settings.

#### **C. Refactor All Memory Operations**
- Replace all memory logic in agents, tools, and services with direct calls to mem0’s API.
- Use only the canonical `Memory` class and its methods.
- Ensure all memory operations (add, search, update, delete, graph, multimodal) use the same instance/config.
- Centralize config in `config/mem0.ts` or equivalent.

#### **D. Graph Database Selection and Integration**
- **Evaluate Memgraph:**
  - Memgraph is a high-performance, in-memory-first, ACID-compliant graph DB with Cypher/Bolt compatibility.
  - Used by NASA, Cedars-Sinai, and others for real-time analytics and AI.
  - Supports vector search, streaming, and advanced graph algorithms (via MAGE library).
  - Easy integration with mem0 (official support).
  - Pros: Real-time, scalable, open source, strong community, Python/Node.js support, production-proven.
  - Cons: Commercial support/pricing for large deployments, less mature than Neo4j in some enterprise features.
- **Alternatives:**
  - **Neo4j:** Most mature, broadest ecosystem, but commercial for advanced features.
  - **ArangoDB, TigerGraph, Dgraph:** Each has strengths, but mem0 and most AI graph memory frameworks natively support Memgraph/Neo4j.
- **Recommendation:**
  - **Use Memgraph if you want open source, high performance, and seamless mem0 integration.**
  - **If you need maximum enterprise features or are already invested in Neo4j, use Neo4j.**
  - **For most OneAgent use cases, Memgraph is the best fit.**

#### **E. Testing and Validation**
- Run all integration and regression tests with the new canonical memory system.
- Validate semantic search, literal match, user/agent isolation, graph queries, and multimodal support.
- Test with both OpenAI and Gemini embedders (via REST API if needed).

#### **F. Documentation and Training**
- Update all developer docs to reference mem0’s official API and methods.
- Remove all references to legacy bridges/wrappers/servers.
- Provide code examples for all common operations.

### 4. Requirements
- Node.js >= 18.x (for mem0ai/oss)
- Python >= 3.9 (if using REST API or advanced features)
- Memgraph (or Neo4j) running and accessible for graph memory
- All API keys and config in `.env`
- All agents/tools refactored to use canonical mem0 methods
- All legacy code, servers, and scripts removed before new install

### 5. Example: Canonical Node.js Memory Integration
```js
import { Memory } from 'mem0ai/oss';
const memory = new Memory({
  graphStore: {
    provider: 'memgraph',
    config: {
      url: 'bolt://localhost:7687',
      username: 'memgraph',
      password: process.env.MEMGRAPH_PASSWORD,
    },
  },
});
await memory.add(messages, { userId: "alice" });
const results = await memory.search('What do you know about me?', { userId: "alice" });
```

### 6. Example: Canonical Python Memory Integration (REST API)
```python
from mem0 import Memory
config = {
    "graph_store": {
        "provider": "memgraph",
        "config": {
            "url": "bolt://localhost:7687",
            "username": "memgraph",
            "password": "yourpassword",
        },
    },
}
m = Memory.from_config(config)
m.add("text", user_id="user")
results = m.search("query", user_id="user")
```

## Memgraph vs. Alternatives: Production-Grade Graph Backend Evaluation

### Memgraph
- **Performance:** In-memory-first, ACID-compliant, real-time analytics, supports >1,000 TPS, graph sizes 100GB–4TB.
- **Compatibility:** Cypher/Bolt protocol, drop-in replacement for Neo4j in most cases, native support in mem0.
- **Features:** Vector search, streaming, advanced graph algorithms (MAGE), multi-tenancy, high availability, role-based access, monitoring, Python/Node.js drivers.
- **Production Use:** Used by NASA, Cedars-Sinai, Capitec Bank, and others for AI and analytics.
- **Open Source:** BSL license (Community), MEL (Enterprise); strong community, rapid development.
- **Support:** Direct Slack/Discord access to engineers, clear pricing for enterprise.
- **Cloud:** Fully managed Memgraph Cloud available.
- **Cons:** Some advanced enterprise features (e.g., clustering) require commercial license; smaller ecosystem than Neo4j.

### Neo4j
- **Performance:** Mature, highly scalable, ACID-compliant, proven in large enterprise deployments.
- **Compatibility:** Cypher/Bolt protocol, industry standard, broadest ecosystem.
- **Features:** Advanced clustering, security, monitoring, analytics, and integrations.
- **Production Use:** Widely adopted in Fortune 500, strong enterprise support.
- **Open Source:** Community edition is limited; most advanced features require commercial license.
- **Cons:** Commercial for advanced features, less open than Memgraph, slower release cycle.

### ChromaDB
- **Type:** Vector database, not a full graph DB.
- **Use Case:** Best for pure vector search, not for complex graph queries or relationships.
- **Integration:** Supported by mem0 for vector memory, but not for graph memory.
- **Cons:** Not a replacement for graph DBs in agent/knowledge graph scenarios.

### Recommendation
- **Memgraph** is the best fit for most LLM/embedding memory use cases in OneAgent: open source, high performance, seamless mem0 integration, and strong production track record.
- **Neo4j** is preferred only if you require maximum enterprise features or are already invested in its ecosystem.
- **ChromaDB** is suitable for pure vector search, not for graph memory.

## Canonical Memory Architecture: Key Points
- **All memory operations (add, search, update, delete, graph, multimodal) use mem0 canonical API directly.**
- **No custom bridges, wrappers, or legacy servers/scripts.**
- **Single source of truth for all agents, tools, and services.**
- **Graph memory and vector memory unified via mem0’s API/config.**
- **All configuration centralized and environment-driven.**
- **Memgraph is the default graph backend unless a strong case for Neo4j exists.**

## Implementation Plan: Step-by-Step (Expanded)
1. **Remove all legacy/bridge code and servers.**
2. **Install mem0 canonically (`npm install mem0ai` for Node.js, `pip install "mem0ai[graph]"` for Python).**
3. **Centralize all configuration in `config/mem0.ts` or equivalent, using environment variables for secrets.**
4. **Refactor all agents, tools, and services to use the canonical mem0 API directly.**
5. **Integrate Memgraph as the default graph backend (unless Neo4j is required).**
6. **Run full integration and regression tests to validate the new memory system.**
7. **Update all developer documentation and provide training/examples for the new architecture.**
8. **Finalize production rollout after thorough validation.**

---

## Summary & Final Recommendations
- **Remove all legacy/bridge code and servers before installing new mem0.**
- **Adopt mem0 canonical methods as the single source of truth for all memory operations.**
- **Use Memgraph as the default graph DB unless you have a strong reason to use Neo4j.**
- **Centralize all config and document every architectural decision.**
- **Test and validate thoroughly before production rollout.**

---

_Last updated: 2025-06-24_
