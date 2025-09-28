# OneAgent Canonical Memory System (v4.2.3)

## Overview

The OneAgent memory system is now fully canonical, pluggable, and MCP/JSON-RPC-compliant. All memory operations are routed through the `OneAgentMemory` singleton, which delegates to a backend-specific `IMemoryClient` implementation (e.g., `Mem0MemoryClient`, `MemgraphMemoryClient`).

## Key Features

- **Pluggable Backends:** Select between `mem0`, `memgraph`, or future backends via config/env (`provider` field or `ONEAGENT_MEMORY_PROVIDER`).
- **Strict Interface:** All backends implement the `IMemoryClient` interface, ensuring consistent method signatures and error handling.
- **Canonical Operations:**
  - `addMemory`
  - `editMemory`
  - `deleteMemory`
  - `searchMemory`
  - `getHealthStatus`
  - `getCapabilities`
  - `subscribeEvents` / `unsubscribeEvents`
- **Event-Driven:** Supports event subscription for memory changes and health updates.
- **No Parallel Systems:** All memory, cache, and ID/time operations use canonical services only.

## Usage Example

```typescript
import { OneAgentMemory } from './coreagent/memory/OneAgentMemory';

const memory = OneAgentMemory.getInstance({ provider: 'memgraph', apiKey: '...' });
await memory.addMemory('User preference: dark mode', { category: 'preferences' }, 'user-123');
const results = await memory.searchMemory({ query: 'dark mode', userId: 'user-123', limit: 5 });
```

## Configuration

- **Provider selection:**
  - `provider: 'mem0' | 'memgraph'` (default: 'mem0')
  - Or set `ONEAGENT_MEMORY_PROVIDER` env var
- **API keys and endpoints:**
  - `apiKey`, `apiUrl`, `endpoint` as needed by backend

## Implementation Notes

- All memory operations are validated and documented per OneAgent/ALITA standards.
- No legacy/parallel code remains; all logic is routed through the canonical interface.
- See `coreagent/memory/clients/IMemoryClient.ts` for the strict interface contract.
- See `coreagent/memory/OneAgentMemory.ts` for the singleton and backend selection logic.

## Migration Guidance

- Remove any direct REST calls or legacy helpers; use only `OneAgentMemory` and canonical types.
- For new backends, implement `IMemoryClient` and register via provider selection.

## References

- [AGENTS.md](../AGENTS.md)
- [ONEAGENT_ARCHITECTURE.md](./ONEAGENT_ARCHITECTURE.md)
- [CHANGELOG.md](../CHANGELOG.md)
