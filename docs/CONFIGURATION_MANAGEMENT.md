# OneAgent Configuration Management - Architecture & Best Practices

## Executive Summary

**Single Source of Truth**: All configuration MUST be driven by `.env` → `config/index.ts` → `UnifiedBackboneService.config`

**Constitutional Principles Applied**:

- **Accuracy**: No configuration ambiguity, explicit precedence order
- **Transparency**: Clear documentation of all config sources and overrides
- **Helpfulness**: Canonical patterns prevent configuration drift
- **Safety**: No hardcoded credentials, DLP-compliant defaults

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        .env (Environment)                        │
│  ONEAGENT_MCP_PORT=8083                                         │
│  ONEAGENT_MEMORY_PORT=8010                                      │
│  MEMORY_HOST=127.0.0.1                                          │
│  MEMGRAPH_URL=bolt://localhost:7687                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  config/index.ts (Canonical Config)              │
│  export const oneAgentConfig: ServerConfig = {                  │
│    memoryPort: parseInt(process.env.ONEAGENT_MEMORY_PORT...)    │
│    memoryUrl: `http://${MEMORY_HOST}:${PORT}/mcp`              │
│    mcpPort: parseInt(process.env.ONEAGENT_MCP_PORT...)         │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│        UnifiedBackboneService (Single Source of Truth)           │
│  static config: ServerConfig = oneAgentConfig;                  │
│  static getResolvedConfig(): ServerConfig                        │
│  static getEndpoint(name): { url, port, path }                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    All OneAgent Systems                          │
│  ✅ Mem0MemoryClient → UnifiedBackboneService.config.memoryUrl  │
│  ✅ unified-mcp-server → config.mcpPort                         │
│  ✅ MemgraphService → config.memgraph.url                       │
│  ❌ FORBIDDEN: Direct process.env access                        │
│  ❌ FORBIDDEN: Hardcoded localhost:8010                         │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration Hierarchy

### 1. Environment Variables (.env)

**Primary Source**: All runtime configuration starts here.

**Port Allocation**:

```bash
# MCP Server (OneAgent main API)
ONEAGENT_MCP_PORT=8083              # Professional grade (production)
ONEAGENT_MCP_URL=http://127.0.0.1:8083  # Optional override

# Memory Server (mem0+FastMCP backend)
ONEAGENT_MEMORY_PORT=8010
MEMORY_HOST=127.0.0.1
# Note: URL auto-constructed as ${MEMORY_HOST}:${PORT}/mcp

# UI Server (Mission Control dashboard)
ONEAGENT_UI_PORT=8080

# Memgraph (Graph database)
MEMGRAPH_URL=bolt://localhost:7687
MEMGRAPH_USER=memgraph
MEMGRAPH_PASSWORD=mem0graph
```

**API Keys** (DLP-compliant storage):

```bash
OPENAI_API_KEY=sk-proj-...          # Required for LLM + embeddings
GEMINI_API_KEY=AIzaSy...            # Optional for Gemini provider
BRAVE_API_KEY=BSA...                # Optional for web search
GITHUB_TOKEN=ghp_...                # Optional for code search
```

**Feature Flags**:

```bash
ONEAGENT_DISABLE_GEMINI=1           # Force OpenAI fallback
ONEAGENT_FAST_TEST_MODE=1           # Speed up tests
ONEAGENT_DISABLE_AUTO_MONITORING=1  # Disable health checks
```

### 2. Canonical Config (config/index.ts)

**Purpose**: Transform environment variables into strongly-typed configuration.

**Key Principles**:

1. **Defaults**: Provide sensible defaults for all settings
2. **Type Safety**: Parse strings to numbers, booleans
3. **URL Construction**: Build URLs from host+port (single source)
4. **Validation**: Ensure required values present

**Example**:

```typescript
export const oneAgentConfig: ServerConfig = {
  // ✅ CORRECT: Read from env with default
  memoryPort: parseInt(process.env.ONEAGENT_MEMORY_PORT || '8010', 10),

  // ✅ CORRECT: Construct URL from components
  memoryUrl:
    process.env.ONEAGENT_MEMORY_URL || // Allow explicit override
    `http://${process.env.MEMORY_HOST || '127.0.0.1'}:${memoryPort}/mcp`,

  // ❌ FORBIDDEN: Hardcoded values
  // memoryPort: 8010,  // NO!
  // memoryUrl: 'http://localhost:8010',  // NO!
};
```

### 3. UnifiedBackboneService (Runtime Access)

**Purpose**: Single source of truth for ALL runtime configuration access.

**Usage Pattern** (Canonical):

```typescript
// ✅ CORRECT: Import from UnifiedBackboneService
import { UnifiedBackboneService } from '../utils/UnifiedBackboneService';

const config = UnifiedBackboneService.config;
const memoryUrl = config.memoryUrl; // http://127.0.0.1:8010/mcp
const memoryPort = config.memoryPort; // 8010

// Or use typed endpoint accessor
const memoryEndpoint = UnifiedBackboneService.getEndpoint('memory');
// { url: 'http://127.0.0.1:8010/mcp', port: 8010 }
```

**Anti-Patterns** (FORBIDDEN):

```typescript
// ❌ FORBIDDEN: Direct process.env access in application code
const port = process.env.ONEAGENT_MEMORY_PORT; // NO!

// ❌ FORBIDDEN: Hardcoded localhost
const url = 'http://localhost:8010'; // NO!

// ❌ FORBIDDEN: Direct config import (bypass UnifiedBackboneService)
import { oneAgentConfig } from '../config/index'; // NO!
```

## Service-Specific Configuration

### Memory Server (mem0+FastMCP)

**Server Side** (servers/mem0_fastmcp_server.py):

```python
# ✅ CORRECT: Read from environment
port = int(os.getenv("ONEAGENT_MEMORY_PORT", "8010"))
host = os.getenv("MEMORY_HOST", "0.0.0.0")

# Start FastMCP with HTTP transport
mcp.run(transport="http", host=host, port=port)
```

**Client Side** (Mem0MemoryClient.ts):

```typescript
// ✅ CORRECT: Use canonical config
const canonicalUrl = UnifiedBackboneService.config.memoryUrl;
this.baseUrl = config.apiUrl || canonicalUrl;

// ✅ CORRECT: FastMCP HTTP requires dual Accept headers
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/event-stream',  // CRITICAL!
  'MCP-Protocol-Version': '2025-06-18',
}
```

**Key Lesson**: FastMCP's HTTP transport uses SSE (Server-Sent Events) for streaming responses. Clients MUST accept both `application/json` (for immediate responses) and `text/event-stream` (for streaming). Without both, server returns **HTTP 406 Not Acceptable**.

### MCP Server (OneAgent API)

**Server Side** (unified-mcp-server.ts):

```typescript
// ✅ CORRECT: Read from canonical config
import { UnifiedBackboneService } from '../utils/UnifiedBackboneService';

const port = UnifiedBackboneService.config.mcpPort; // 8083
const host = UnifiedBackboneService.config.host; // 127.0.0.1

app.listen(port, host, () => {
  console.log(`MCP server listening on ${host}:${port}`);
});
```

### Memgraph (Graph Database)

**Configuration**:

```typescript
// ✅ CORRECT: Read from canonical config
const memgraphConfig = UnifiedBackboneService.config.memgraph;

if (memgraphConfig?.enabled) {
  const driver = neo4j.driver(
    memgraphConfig.url, // bolt://localhost:7687
    neo4j.auth.basic(memgraphConfig.username || 'memgraph', memgraphConfig.password || 'mem0graph'),
  );
}
```

## Configuration Best Practices

### 1. Precedence Order

Configuration precedence (highest to lowest):

1. **Explicit Config Parameter**: Function/constructor argument
2. **Environment Variable**: .env file or process environment
3. **Canonical Config Default**: config/index.ts default value
4. **Hardcoded Fallback**: ONLY in config/index.ts, never in application code

### 2. URL Construction

**DO**:

- Construct URLs from host + port components
- Store only base URL, add paths at call site
- Use environment for overrides (dev/staging/prod)

**DON'T**:

- Hardcode `localhost` or `127.0.0.1` in application code
- Mix URL parts across multiple config sources
- Assume default ports without env fallback

### 3. Service Discovery

**Current** (Static Configuration):

```typescript
// Services discover each other via canonical config
const memoryUrl = UnifiedBackboneService.config.memoryUrl;
```

**Future** (Dynamic Service Registry):

```typescript
// Phase 2: Service registry with health checks
const memoryService = await ServiceRegistry.discover('memory');
const url = memoryService.url; // Includes failover/load balancing
```

### 4. Configuration Validation

**Startup Checks** (recommended):

```typescript
function validateConfig() {
  const config = UnifiedBackboneService.config;

  // Check required API keys
  if (!config.geminiApiKey && !process.env.OPENAI_API_KEY) {
    throw new Error('Either GEMINI_API_KEY or OPENAI_API_KEY required');
  }

  // Check port availability
  if (config.mcpPort === config.memoryPort) {
    throw new Error('MCP and Memory ports must differ');
  }

  // Validate URLs
  if (!config.memoryUrl.startsWith('http')) {
    throw new Error('Invalid memoryUrl format');
  }
}
```

### 5. Testing Configuration

**Test Isolation**:

```typescript
// ✅ CORRECT: Override config for tests
beforeEach(() => {
  process.env.ONEAGENT_FAST_TEST_MODE = '1';
  process.env.ONEAGENT_MEMORY_PORT = '9010'; // Non-conflicting port
  UnifiedBackboneService.refreshConfigSnapshot();
});

afterEach(() => {
  delete process.env.ONEAGENT_FAST_TEST_MODE;
  delete process.env.ONEAGENT_MEMORY_PORT;
  UnifiedBackboneService.refreshConfigSnapshot();
});
```

## Configuration Migration Guide

### Step 1: Identify Hardcoded Values

**Search for anti-patterns**:

```bash
# Find hardcoded ports
rg "808[0-3]|8010|7687" --type ts --type py

# Find hardcoded localhost
rg "localhost|127\.0\.0\.1" --type ts --type py

# Find direct process.env access
rg "process\.env\.(ONEAGENT|MEMORY|MEMGRAPH)" --type ts
```

### Step 2: Update to Canonical Pattern

**Before** (Anti-pattern):

```typescript
const memoryUrl = 'http://localhost:8010'; // ❌ FORBIDDEN
```

**After** (Canonical):

```typescript
import { UnifiedBackboneService } from '../utils/UnifiedBackboneService';
const memoryUrl = UnifiedBackboneService.config.memoryUrl; // ✅ CORRECT
```

### Step 3: Add Configuration Test

```typescript
describe('Configuration Compliance', () => {
  it('should not use hardcoded ports', () => {
    const config = UnifiedBackboneService.config;
    expect(config.memoryPort).toBe(parseInt(process.env.ONEAGENT_MEMORY_PORT || '8010'));
  });

  it('should construct URLs from components', () => {
    const config = UnifiedBackboneService.config;
    expect(config.memoryUrl).toContain(`${config.memoryPort}`);
    expect(config.memoryUrl).toContain('/mcp');
  });
});
```

## Troubleshooting

### Issue: "HTTP 406 Not Acceptable" from Memory Server

**Cause**: FastMCP HTTP transport requires dual Accept headers.

**Solution**: Add both `application/json` and `text/event-stream`:

```typescript
headers: {
  'Accept': 'application/json, text/event-stream',  // Both required!
}
```

### Issue: "Connection refused" to Memory Server

**Diagnosis**:

```bash
# Check if memory server running
curl http://localhost:8010/mcp

# Check configured port
echo $ONEAGENT_MEMORY_PORT

# Check canonical config
node -e "const {UnifiedBackboneService} = require('./dist/coreagent/utils/UnifiedBackboneService'); console.log(UnifiedBackboneService.config.memoryUrl)"
```

**Common Causes**:

1. Memory server not started: `npm run memory:server`
2. Port mismatch: Check `.env` vs `config/index.ts` default
3. Wrong endpoint: Should be `/mcp` not `/`

### Issue: Configuration Changes Not Applied

**Solution**: Rebuild TypeScript after config changes:

```bash
npm run build
# Or for development
npm run dev
```

**Why**: TypeScript compiles config at build time. Runtime changes to `.env` require rebuild if config is imported statically.

## Configuration Security

### API Key Management

**DO**:

- Store API keys in `.env` (gitignored)
- Use environment variables in production
- Rotate keys regularly
- Apply principle of least privilege

**DON'T**:

- Commit keys to git
- Log keys in application logs
- Share keys across environments
- Hardcode keys in source code

### DLP (Data Loss Prevention)

**Canonical Logger Integration**:

```typescript
import { unifiedLogger } from '../utils/UnifiedLogger';

// ✅ CORRECT: Logger auto-redacts API keys
unifiedLogger.info('Memory client initialized', {
  url: config.memoryUrl, // Logged
  apiKey: config.apiKey, // AUTO-REDACTED: ***
});
```

## Summary: Configuration Checklist

- [ ] All configuration in `.env` or `config/index.ts`
- [ ] No hardcoded `localhost`, `127.0.0.1`, or ports in application code
- [ ] All services use `UnifiedBackboneService.config`
- [ ] URLs constructed from host + port components
- [ ] API keys stored in `.env` (gitignored)
- [ ] FastMCP clients use dual Accept headers
- [ ] Configuration validated at startup
- [ ] Tests override config safely
- [ ] Documentation updated for new config options

## Related Documentation

- [UnifiedBackboneService Architecture](./ONEAGENT_ARCHITECTURE.md)
- [Memory System Architecture](./memory-system-architecture.md)
- [MCP Protocol Implementation](./A2A_PROTOCOL_IMPLEMENTATION.md)
- [Testing Standards](./.github/instructions/testing-standards.instructions.md)

---

**Version**: 4.5.0  
**Last Updated**: 2025-10-02  
**Author**: James (OneAgent DevAgent)  
**Constitutional AI Compliance**: ✅ Accuracy, Transparency, Helpfulness, Safety
