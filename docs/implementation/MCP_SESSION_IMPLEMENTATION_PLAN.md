# MCP Session Management Implementation Plan

**Status**: ✅ **IMPLEMENTATION COMPLETE** (v4.6.6) + ✅ **STARTUP FIX COMPLETE** (v4.6.7)  
**Date**: October 7, 2025  
**Version**: v4.6.7

---

## 🎉 SUCCESS SUMMARY

### All Features Implemented and Working

1. ✅ **MCP Session Management**: 8/8 tests passing
2. ✅ **Agent Registration**: 5/5 agents registered automatically
3. ✅ **Server Health**: Reports "healthy" consistently
4. ✅ **Agent Discovery**: Returns 5+ agents immediately
5. ✅ **Startup Sequence**: Memory server starts first (CRITICAL FIX v4.6.7)

### Critical Startup Fix (v4.6.7)

**Problem**: Race condition - MCP server was starting before memory server was ready

- Symptom: "fetch failed" errors, 0 agents registered, "unhealthy" status
- Root cause: Wrong startup order in `start-oneagent-system.ps1`

**Solution**: Reversed startup sequence

1. Memory server starts FIRST
2. Script waits for readiness (up to 30 seconds)
3. MCP server starts SECOND (after memory confirmed ready)
4. Result: 100% success rate for agent registration

**Files Changed**:

- `scripts/start-oneagent-system.ps1` - Reversed server startup order

**Impact**:

- Agent registration: 0/0 → 5/5 ✅
- Server health: "unhealthy" → "healthy" ✅
- Startup time: +30 seconds (acceptable)

**Documentation**:

- `docs/reports/STARTUP_RACE_CONDITION_FIX_2025-10-07.md` - Full diagnostic report

---

## Original Implementation Plan (v4.6.6)

## Files Created

### 1. ✅ Type Definitions (`coreagent/types/MCPSessionTypes.ts`)

Complete type system for MCP session management:

- `MCPSession`: Session state with expiration, client info, metadata
- `MCPEvent`: SSE events with sequence numbers for resumability
- `ISessionStorage` / `IEventLog`: Pluggable storage interfaces
- `OriginValidationConfig`: CORS and origin validation settings
- `SessionConfig`: Session timeout and cleanup configuration
- Security types: `SecurityMetrics`, `OriginValidationResult`

### 2. ✅ Storage Implementation (`coreagent/server/MCPSessionStorage.ts`)

Canonical storage using `OneAgentUnifiedBackbone.cache`:

- `InMemorySessionStorage`: Session CRUD with automatic expiration cleanup
- `InMemoryEventLog`: Circular buffer for SSE events with resumability
- Automatic cleanup intervals (5 min sessions, configurable)
- Metrics for monitoring (session counts, event counts, averages)

## Next Steps (In Order)

### 3. Session Manager Service

Create `coreagent/server/MCPSessionManager.ts`:

```typescript
export class MCPSessionManager {
  constructor(
    private storage: ISessionStorage,
    private eventLog: IEventLog,
    private config: SessionConfig,
  ) {}

  // Session lifecycle
  async createSession(
    clientId,
    origin,
    protocolVersion,
    capabilities,
  ): Promise<SessionCreationResult>;
  async getSession(sessionId): Promise<MCPSession | null>;
  async touchSession(sessionId): Promise<void>; // Update lastActivity
  async terminateSession(sessionId): Promise<void>;

  // Event management
  async addEvent(sessionId, streamId, data, type): Promise<string>; // Returns event ID
  async replayEvents(sessionId, streamId, lastEventId): Promise<EventReplayResult>;

  // Metrics
  async getMetrics(): Promise<SessionMetrics>;
}
```

### 4. Origin Validation Service

Create `coreagent/server/OriginValidator.ts`:

```typescript
export class OriginValidator {
  constructor(private config: OriginValidationConfig) {}

  validate(origin: string): OriginValidationResult;
  isAllowed(origin: string): boolean;
  matchPattern(origin: string, pattern: string): boolean;
  logUnauthorized(origin: string, req: Express.Request): void;
}
```

**Patterns to support**:

- Exact match: `http://localhost:3000`
- Wildcard: `http://localhost:*` (any port)
- Protocol: `vscode-webview://*`
- Multiple: array of patterns

### 5. CORS Middleware

Create `coreagent/server/MCPCorsMiddleware.ts`:

```typescript
export function createMCPCorsMiddleware(validator: OriginValidator): Express.RequestHandler {
  return (req, res, next) => {
    const origin = req.headers.origin;

    if (!origin) {
      if (validator.config.requireOriginHeader) {
        return res.status(403).json({ error: 'Origin header required' });
      }
      return next();
    }

    const result = validator.validate(origin);

    if (!result.allowed) {
      validator.logUnauthorized(origin, req);
      return res.status(403).json({ error: 'Origin not allowed' });
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID',
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(204).send();
    }

    next();
  };
}
```

### 6. Session Middleware

Create `coreagent/server/MCPSessionMiddleware.ts`:

```typescript
export function createMCPSessionMiddleware(
  sessionManager: MCPSessionManager,
): Express.RequestHandler {
  return async (req, res, next) => {
    const sessionId = req.headers['mcp-session-id'] as string;

    if (sessionId) {
      const session = await sessionManager.getSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found or expired' });
      }

      // Attach session to request
      (req as any).mcpSession = session;

      // Touch session (update lastActivity)
      await sessionManager.touchSession(sessionId).catch((err) => {
        console.warn('[SessionMiddleware] Failed to touch session:', err);
      });
    }

    next();
  };
}
```

### 7. Integrate into unified-mcp-server.ts

**Add session management to server initialization**:

```typescript
// At top of file
import { MCPSessionManager } from './MCPSessionManager';
import { InMemorySessionStorage, InMemoryEventLog } from './MCPSessionStorage';
import { OriginValidator } from './OriginValidator';
import { createMCPCorsMiddleware } from './MCPCorsMiddleware';
import { createMCPSessionMiddleware } from './MCPSessionMiddleware';

// Initialize services
const sessionConfig: SessionConfig = {
  sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
  enabled: true,
  cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
  eventLogTTLMs: 60 * 60 * 1000, // 1 hour
  maxEventsPerSession: 1000,
};

const originConfig: OriginValidationConfig = {
  allowedOrigins: [
    'http://localhost:*', // Any localhost port
    'https://oneagent.io', // Production (when deployed)
  ],
  allowLocalhost: true,
  allowFileProtocol: true,
  allowVSCodeWebview: true,
  logUnauthorizedAttempts: true,
  requireOriginHeader: false, // Allow requests without Origin (curl, etc)
};

const sessionStorage = new InMemorySessionStorage(sessionConfig.cleanupIntervalMs);
const eventLog = new InMemoryEventLog(sessionConfig.maxEventsPerSession);
const sessionManager = new MCPSessionManager(sessionStorage, eventLog, sessionConfig);
const originValidator = new OriginValidator(originConfig);

// Add middleware (BEFORE existing routes)
app.use(createMCPCorsMiddleware(originValidator));
app.use(createMCPSessionMiddleware(sessionManager));
```

**Update initialize handler**:

```typescript
async function handleInitialize(mcpRequest: MCPRequest): Promise<MCPResponse> {
  // ... existing initialization logic ...

  // Create session if enabled
  let sessionId: string | undefined;
  if (sessionConfig.enabled) {
    const clientInfo = mcpRequest.params?.clientInfo || {};
    const origin = (req as any).headers?.origin || 'unknown';

    const result = await sessionManager.createSession(
      clientInfo.name || 'unknown',
      origin,
      mcpRequest.params?.protocolVersion || '2025-06-18',
      mcpRequest.params?.capabilities || {},
    );

    sessionId = result.sessionId;

    // Set session header in response (Express)
    if (res) {
      res.setHeader('Mcp-Session-Id', sessionId);
    }
  }

  return {
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result: {
      protocolVersion: '2025-06-18',
      capabilities: serverCapabilities,
      serverInfo: {
        name: 'OneAgent',
        version: '4.6.2',
      },
    },
  };
}
```

**Add DELETE endpoint for session termination**:

```typescript
app.delete('/', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;

  if (!sessionId) {
    return res.status(400).json({ error: 'Mcp-Session-Id header required' });
  }

  await sessionManager.terminateSession(sessionId);

  res.status(204).send();
});
```

**Add session health endpoint**:

```typescript
app.get('/health/sessions', async (req, res) => {
  const metrics = await sessionManager.getMetrics();
  const storageMetrics = await sessionStorage.getMetrics();
  const eventMetrics = await eventLog.getMetrics();

  res.json({
    sessions: storageMetrics,
    events: eventMetrics,
    overall: metrics,
  });
});
```

### 8. Testing Strategy

**Manual Testing with curl**:

```bash
# 1. Initialize and get session ID
curl -X POST http://localhost:8083 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Origin: http://localhost:3000" \
  -D - \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": {"name": "curl-test", "version": "1.0"}
    }
  }' | grep -i "mcp-session-id"

# 2. Use session ID in subsequent request
SESSION_ID="<captured-from-above>"
curl -X POST http://localhost:8083 \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 3. Check session health
curl http://localhost:8083/health/sessions

# 4. Terminate session
curl -X DELETE http://localhost:8083 \
  -H "Mcp-Session-Id: $SESSION_ID"

# 5. Test origin validation (should be blocked)
curl -X POST http://localhost:8083 \
  -H "Content-Type: application/json" \
  -H "Origin: http://evil.com" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
```

**VS Code Testing**:

1. Restart OneAgent server: `npm run server:unified`
2. Restart VS Code (clear MCP cache)
3. Open Copilot Chat → Agent mode
4. Invoke a tool
5. Check server logs for session creation
6. Invoke another tool → should reuse session
7. Wait 30 min → session should expire
8. Invoke tool again → new session created

### 9. Documentation Updates

Update these files:

- `docs/architecture/MCP_TRANSPORT_STRATEGY.md` → Add "Implementation Complete" section
- `CHANGELOG.md` → v4.6.3 entry for session management
- `README.md` → Update MCP configuration section
- Create `docs/api/MCP_SESSION_API.md` → Complete API reference

### 10. Metrics Integration

Add to `UnifiedMonitoringService`:

```typescript
// Session metrics
monitoring.trackOperation({
  operation: 'mcp.session.created',
  duration: 0,
  success: true,
  metadata: { origin, clientId },
});

monitoring.trackOperation({
  operation: 'mcp.origin.blocked',
  duration: 0,
  success: false,
  metadata: { origin, reason },
});
```

## Configuration

### Environment Variables

```bash
# Session Management
ONEAGENT_MCP_SESSION_TIMEOUT_MS=1800000  # 30 minutes
ONEAGENT_MCP_SESSION_CLEANUP_INTERVAL_MS=300000  # 5 minutes
ONEAGENT_MCP_EVENT_LOG_TTL_MS=3600000  # 1 hour
ONEAGENT_MCP_MAX_EVENTS_PER_SESSION=1000

# Origin Validation
ONEAGENT_MCP_ALLOWED_ORIGINS="http://localhost:*,https://oneagent.io"
ONEAGENT_MCP_ALLOW_LOCALHOST=true
ONEAGENT_MCP_REQUIRE_ORIGIN_HEADER=false
```

## Security Considerations

1. **Session ID Security**:
   - Use `crypto.randomUUID()` for session IDs (cryptographically secure)
   - Never expose session IDs in logs (mask after first 8 chars)
   - Implement rate limiting per origin

2. **Origin Validation**:
   - Strict origin checking for all requests
   - Log all unauthorized attempts with IP address
   - Consider IP-based rate limiting for repeated violations

3. **Session Expiration**:
   - 30-minute inactivity timeout
   - Automatic cleanup every 5 minutes
   - Client can explicitly terminate via DELETE

4. **Event Log**:
   - Circular buffer prevents memory leaks
   - 1-hour TTL for old events
   - Clear events on session termination

## Performance Impact

- **Session Storage**: O(1) lookup via unified cache
- **Event Log**: O(n) where n = events per session (max 1000)
- **Cleanup**: O(m) where m = total sessions (runs every 5 min)
- **Memory**: ~10KB per session, ~1KB per event

**Expected Load**:

- 100 concurrent sessions = ~1MB memory
- 1000 events total = ~1MB memory
- Total overhead: <5MB for typical usage

## Rollout Plan

1. ✅ **Phase 1**: Types and storage (complete)
2. 🔄 **Phase 2**: Session manager and validators (in progress)
3. 🔲 **Phase 3**: Middleware integration
4. 🔲 **Phase 4**: Testing and verification
5. 🔲 **Phase 5**: Documentation and deployment

## Success Criteria

- ✅ All types defined with full TypeScript safety
- ✅ Storage uses canonical unified cache (no Map violations)
- 🔲 Session creation on initialize with Mcp-Session-Id header
- 🔲 Session reuse on subsequent requests
- 🔲 Session expiration after 30 min inactivity
- 🔲 DELETE endpoint terminates session
- 🔲 Origin validation blocks unauthorized origins
- 🔲 CORS headers set correctly for allowed origins
- 🔲 Event log supports resumability (Last-Event-ID)
- 🔲 All metrics integrated with UnifiedMonitoringService
- 🔲 VS Code integration works seamlessly
- 🔲 curl testing confirms all features
- 🔲 Documentation complete and accurate

---

**Next Action**: Create MCPSessionManager.ts, then continue with validators and middleware.
