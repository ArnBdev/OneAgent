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

## Health Check Endpoints (v4.4.0+)

The mem0+FastMCP server now provides production-grade health check endpoints for monitoring and orchestration:

### Liveness Probe: `/health`

Simple endpoint to verify the server process is alive and responding.

**Request:**

```bash
curl http://localhost:8010/health
```

**Response (HTTP 200):**

```json
{
  "status": "healthy",
  "service": "oneagent-memory-server",
  "backend": "mem0+FastMCP",
  "version": "4.4.0",
  "protocol": "MCP HTTP JSON-RPC 2.0"
}
```

**Use Cases:**

- Kubernetes liveness probes
- Load balancer health checks
- Simple "server alive" verification
- Startup script validation

### Readiness Probe: `/health/ready`

Comprehensive endpoint that validates all dependencies are initialized and ready.

**Request:**

```bash
curl http://localhost:8010/health/ready
```

**Response (HTTP 200 when ready):**

```json
{
  "ready": true,
  "checks": {
    "mcp_initialized": true,
    "tools_available": true,
    "resources_available": true,
    "tool_count": 5,
    "resource_count": 2
  },
  "service": "oneagent-memory-server",
  "version": "4.4.0"
}
```

**Response (HTTP 503 when not ready):**

```json
{
  "ready": false,
  "checks": {
    "mcp_initialized": true,
    "tools_available": false,
    "resources_available": false,
    "tool_count": 0,
    "resource_count": 0
  },
  "service": "oneagent-memory-server",
  "version": "4.4.0"
}
```

**Use Cases:**

- Kubernetes readiness probes
- Load balancer traffic routing decisions
- Automated service recovery
- Smoke test validation
- Production monitoring dashboards

### Implementation Details

Health endpoints are implemented using FastMCP's custom route decorator:

```python
@mcp.custom_route("/health", methods=["GET"])
async def health_check(request):
    return JSONResponse({"status": "healthy", ...})

@mcp.custom_route("/health/ready", methods=["GET"])
async def readiness_check(request):
    # Validate dependencies
    ready = len(mcp._tools) > 0 and len(mcp._resources) > 0
    return JSONResponse(
        {"ready": ready, "checks": {...}},
        status_code=200 if ready else 503
    )
```

**Key Features:**

- ✅ Coexists with `/mcp` MCP protocol endpoint
- ✅ No authentication required (public health checks)
- ✅ Fast response times (< 50ms typical)
- ✅ Kubernetes/Docker compatible
- ✅ Proper HTTP status codes (200/503)

### Production Deployment

**Kubernetes Configuration:**

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8010
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 5

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8010
  initialDelaySeconds: 15
  periodSeconds: 10
  timeoutSeconds: 5
```

**Docker Compose Health Check:**

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:8010/health/ready']
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 40s
```

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

## Embeddings Cohesion & Canonical Flow (v4.4.2+)

### Canonical Embeddings Architecture

- **Single Source of Truth:** All embeddings for both OneAgent and mem0 are generated via the OneAgent `/api/v1/embeddings` endpoint.
- **Configuration:**
  - `.env` sets `ONEAGENT_EMBEDDINGS_URL` (used by mem0 and OneAgent)
  - `ONEAGENT_EMBEDDINGS_SOURCE=node` ensures mem0 uses the OneAgent endpoint
  - `OPENAI_API_KEY` and `GEMINI_API_KEY` are used for provider fallback
- **mem0 Configuration:**
  - `servers/mem0_fastmcp_server.py` loads `.env` and configures its embedder to use the OneAgent endpoint if available
  - Fallback to OpenAI only if Gemini is disabled and OneAgent endpoint is not available
- **TypeScript Configuration:**
  - `coreagent/config/index.ts` and `UnifiedBackboneService` use env-driven config for embeddings provider/model
  - All memory and embeddings operations route through canonical services

### Startup Order

- **Best Practice:** Start the MCP server (OneAgent) before the memory server (mem0) to ensure the embeddings endpoint is available for mem0 at startup.
- **Script:** Use `./scripts/start-oneagent-system.ps1` for correct order.

### Troubleshooting Embeddings Mismatches

- **Symptoms:** Semantic search or memory creation fails, or embeddings are inconsistent between systems.
- **Checklist:**
  1. Ensure both servers are running and `.env` is consistent
  2. Confirm `ONEAGENT_EMBEDDINGS_URL` is set and reachable from mem0
  3. Check logs for errors about missing or fallback embeddings provider
  4. Validate that both systems use the same model (e.g., `text-embedding-3-small`)
  5. Restart both servers after config changes

**References:**

- `.env` (ONEAGENT_EMBEDDINGS_URL, ONEAGENT_EMBEDDINGS_SOURCE, OPENAI_API_KEY, GEMINI_API_KEY)
- `servers/mem0_fastmcp_server.py` (embedder config)
- `coreagent/config/index.ts` (TypeScript config)
