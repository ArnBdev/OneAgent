# OneAgent Server Health Guide

**Version**: OneAgent v4.4.0+  
**Date**: October 3, 2025  
**Purpose**: Understanding server behavior, health monitoring, and troubleshooting

---

## Executive Summary

This guide explains normal OneAgent server behavior that may initially appear as errors but is actually correct operation. Understanding these patterns prevents unnecessary troubleshooting and builds confidence in the system.

---

## Table of Contents

1. [Quick Health Check](#quick-health-check)
2. [Understanding "Cannot GET" Messages](#understanding-cannot-get-messages)
3. [Browser-Accessible vs Protocol Endpoints](#browser-accessible-vs-protocol-endpoints)
4. [Memory Server Behavior](#memory-server-behavior)
5. [Health Status Interpretation](#health-status-interpretation)
6. [Transient Errors During Startup](#transient-errors-during-startup)
7. [Troubleshooting Checklist](#troubleshooting-checklist)

---

## Quick Health Check

### Are Both Servers Running?

**Memory Server (Port 8010):**

```powershell
curl http://127.0.0.1:8010/health
```

**Expected**: `{"status":"healthy","service":"oneagent-memory-server",...}`

**MCP Server (Port 8083):**

```powershell
curl http://127.0.0.1:8083/health
```

**Expected**: `{"status":"unhealthy","initialized":false,...}` (until VS Code connects)

**Detailed Health:**

```powershell
curl 'http://127.0.0.1:8083/health?details=true'
```

### All Systems Operational?

✅ Memory server returns `"status":"healthy"`  
✅ MCP server health endpoint responds (even if `"initialized":false`)  
✅ MCP server shows component statuses  
✅ No connection errors in terminal logs

**If all checks pass**: Servers are working correctly! 🎉

---

## Understanding "Cannot GET" Messages

### What Are These Messages?

When accessing certain URLs in a browser, you see:

```
Cannot GET /mcp
Cannot GET /ws/mission-control
```

### Why This Happens

These endpoints are **protocol-specific** and **NOT designed for browser GET requests**:

| Endpoint              | Type         | Accepts           | Purpose                     |
| --------------------- | ------------ | ----------------- | --------------------------- |
| `/mcp`                | JSON-RPC 2.0 | POST only         | MCP protocol communication  |
| `/ws/mission-control` | WebSocket    | WebSocket upgrade | Real-time dashboard updates |

### Analogy

Think of it like trying to open a telephone conversation in a web browser:

- The phone line works perfectly
- But you can't "browse" to a phone conversation
- You need the right client (phone) to use it

### The Fix

**There is no fix needed!** These messages are **EXPECTED** and indicate the endpoints are working correctly.

**For browser testing, use these instead:**

- `/health` - Shows server health
- `/info` - Shows server capabilities
- `/health?details=true` - Detailed health report

---

## Browser-Accessible vs Protocol Endpoints

### Browser-Accessible (HTTP GET)

These work in any web browser:

| URL                                                 | Purpose              | What You See                   |
| --------------------------------------------------- | -------------------- | ------------------------------ |
| `http://127.0.0.1:8010/health`                      | Memory server health | JSON health status             |
| `http://127.0.0.1:8083/health`                      | MCP server health    | JSON health + initialized flag |
| `http://127.0.0.1:8083/health?details=true`         | Detailed health      | Full component health map      |
| `http://127.0.0.1:8083/info`                        | Server information   | Features, endpoints, versions  |
| `http://127.0.0.1:8083/.well-known/agent-card.json` | Agent card (A2A)     | OneAgent identity metadata     |

### Protocol Endpoints (NOT Browser-Accessible)

These require specific protocols and clients:

| URL                                        | Protocol     | Client Required    | Shows "Cannot GET" |
| ------------------------------------------ | ------------ | ------------------ | ------------------ |
| `http://127.0.0.1:8010/mcp`                | JSON-RPC 2.0 | MCP client         | ✅ YES (expected)  |
| `http://127.0.0.1:8083/mcp`                | JSON-RPC 2.0 | VS Code Copilot    | ✅ YES (expected)  |
| `http://127.0.0.1:8083/ws/mission-control` | WebSocket    | Mission Control UI | ✅ YES (expected)  |

---

## Memory Server Behavior

### "0 memories" in Logs

**Symptom**: Memory server logs show:

```
Total existing memories: 0
```

**Explanation**: This is **CORRECT BEHAVIOR**, not a bug!

**Why It Happens**:

mem0 (the memory backend) uses **AI filtering** to reject non-meaningful content:

- ✅ **Accepted**: Structured, meaningful data like `"Agent Registration: Development Agent"`
- ❌ **Rejected**: Test data like `"test"`, `"hello"`, `"broadcast"`

**Example from logs:**

```python
2025-10-03 16:02:38,197 - __main__ - INFO - search_memories: user_id=system_discovery, query=discover all agents...
2025-10-03 16:02:41,089 - __main__ - INFO - ✅ Found 0 memories for user system_discovery
```

This means:

1. The search query worked correctly ✅
2. No meaningful memories exist yet (normal at startup) ✅
3. The AI filter is protecting data quality ✅

**When to worry**: Only if meaningful data (agent registrations, user interactions) also returns 0 results.

### Memory Search Pattern

Normal memory server activity looks like:

```
2025-10-03 16:02:38,142 - mcp.server.lowlevel.server - INFO - Processing request of type ReadResourceRequest
2025-10-03 16:02:38,165 - mcp.server.lowlevel.server - INFO - Processing request of type CallToolRequest
2025-10-03 16:02:38,197 - __main__ - INFO - search_memories: user_id=system_discovery, query=discover all agents...
2025-10-03 16:02:41,089 - __main__ - INFO - ✅ Found 0 memories for user system_discovery
INFO:     127.0.0.1:51608 - "POST /mcp HTTP/1.1" 200 OK
```

**What this shows:**

- ✅ MCP requests being processed
- ✅ Memory searches executing successfully
- ✅ HTTP 200 OK responses
- ✅ Embeddings API working (calls to OpenAI)

---

## Health Status Interpretation

### MCP Server Health Responses

#### Before VS Code Connects

```json
{
  "status": "unhealthy",
  "initialized": false,
  ...
}
```

**Meaning**:

- Server is running and waiting for MCP client
- Not yet initialized (VS Code hasn't connected)
- This is **EXPECTED** and not an error

#### After VS Code Connects

```json
{
  "status": "healthy",
  "initialized": true,
  ...
}
```

**Meaning**:

- MCP client (VS Code Copilot) has completed handshake
- Server is fully operational
- Tools are available to Copilot

### Component Health Map

```json
{
  "components": {
    "timeService": {"status": "healthy", ...},
    "metadataService": {"status": "healthy", ...},
    "memoryService": {"status": "healthy", "storageHealth": 95, ...},
    "constitutionalAI": {"status": "healthy", ...}
  }
}
```

**What to check:**

- ✅ All components show `"status": "healthy"`
- ✅ `memoryService` shows `storageHealth` > 80
- ⚠️ Any component showing `"status": "degraded"` or `"unhealthy"`

### Overall Status vs Component Status

Sometimes you'll see:

```json
{
  "status": "unhealthy",
  "components": {
    "timeService": {"status": "healthy"},
    "memoryService": {"status": "healthy"},
    ...
  }
}
```

**Why?**: The overall status checks additional components not shown in the simplified response:

- `registry` (agent discovery)
- `agents` (agent pool health)
- `orchestrator` (task delegation)
- `api` (API endpoint health)

These components may be degraded at startup before agents are registered.

---

## Transient Errors During Startup

### MCP Resource Read Failed

**Log Message:**

```
[ERROR] 2025-10-03T14:03:25.248Z MCP resource read failed: health://status { error: {} }
[ERROR] 2025-10-03T14:03:26.307Z Failed to get health status { error: {} }
```

**When it happens**: 48-60 seconds after MCP session establishment

**Why it happens**:

1. MCP server starts and establishes session with memory server
2. Health monitoring tries to read `health://status` resource
3. Timing race condition during initialization
4. Empty error object `{ error: {} }` indicates network/timeout, not code error

**Impact**: **NONE** - transient error that resolves automatically

**Resolution**: System recovers within next health check cycle (30 seconds)

**When to worry**: Only if error persists for >2 minutes

### Session Initialization Timing

**Normal startup sequence:**

```
[INFO] 2025-10-03T14:02:16.706Z Initializing MCP session
[INFO] 2025-10-03T14:02:37.019Z MCP session established (21 seconds)
[INFO] 2025-10-03T14:02:56.344Z Search completed successfully (first search)
[ERROR] 2025-10-03T14:03:25.248Z MCP resource read failed (48 seconds after establish)
[INFO] 2025-10-03T14:03:46.327Z Search completed successfully (system recovered)
```

**Pattern**: Error occurs once during initialization, then system stabilizes.

---

## Troubleshooting Checklist

### Level 1: Basic Checks

- [ ] Memory server running on port 8010
- [ ] MCP server running on port 8083
- [ ] Both servers show startup banners in terminals
- [ ] No EADDRINUSE errors
- [ ] `/health` endpoints respond

**Commands:**

```powershell
# Check memory server
curl http://127.0.0.1:8010/health

# Check MCP server
curl http://127.0.0.1:8083/health

# Check server info
curl http://127.0.0.1:8083/info
```

### Level 2: Connection Verification

- [ ] Memory server logs show MCP session established
- [ ] MCP server logs show tool registration complete
- [ ] Search operations returning results (even if 0 memories)
- [ ] HTTP 200 OK responses in memory server logs

**What to look for:**

```
[INFO] MCP session established { sessionId: '...', protocolVersion: '2025-06-18' }
✅ Standard tools initialized.
✅ Memory tools registered
```

### Level 3: Health Monitoring

- [ ] Get detailed health report: `curl 'http://127.0.0.1:8083/health?details=true'`
- [ ] Check component statuses (all should be healthy or degraded, not critical)
- [ ] Verify `memoryService.storageHealth` > 80
- [ ] Check logs for persistent errors (ignore transient startup errors)

### Level 4: VS Code Integration

- [ ] `.vscode/mcp.json` exists and contains correct URL
- [ ] URL uses `127.0.0.1` (not `0.0.0.0` or `localhost`)
- [ ] VS Code reloaded after config changes
- [ ] No MCP errors in VS Code Developer Tools
- [ ] Copilot Chat shows OneAgent tools

**Commands:**

```powershell
# Regenerate VS Code config from .env
npm run mcp:config

# Verify config
cat .vscode\mcp.json
```

---

## Common Scenarios

### Scenario 1: "Cannot GET /mcp" in Browser

**Status**: ✅ NORMAL - Not an error

**Explanation**: `/mcp` is a JSON-RPC endpoint, not browseable

**Action**: Use `/health` or `/info` instead for browser testing

---

### Scenario 2: Memory Server Shows 0 Memories

**Status**: ✅ NORMAL - mem0 AI filter working correctly

**Explanation**: Only meaningful data is stored; test data rejected

**Action**: None - this is correct behavior

---

### Scenario 3: "initialized": false After Startup

**Status**: ✅ NORMAL - Waiting for VS Code to connect

**Explanation**: Server needs MCP client to call `initialize` method

**Action**: Connect VS Code Copilot Chat to complete initialization

---

### Scenario 4: Transient "MCP resource read failed" Error

**Status**: ✅ NORMAL - Startup timing race condition

**Explanation**: Health check runs before resource fully available

**Action**: None - resolves automatically within 30 seconds

---

### Scenario 5: Overall "unhealthy" But All Components "healthy"

**Status**: ⚠️ EXPECTED at startup

**Explanation**: Real components (registry, agents, orchestrator) not yet populated

**Action**: Wait for agents to register; check detailed health

---

## Best Practices

### Starting Servers

1. **Memory server first**: `npm run memory:server`
2. Wait for "Uvicorn running" message
3. **MCP server second**: `npm run server:unified`
4. Wait for "Ready for VS Code Copilot Chat!" message
5. Keep both terminals open

### Verifying Health

1. Check memory server: `curl http://127.0.0.1:8010/health`
2. Check MCP server: `curl http://127.0.0.1:8083/info`
3. Get detailed health: `curl 'http://127.0.0.1:8083/health?details=true'`
4. Review logs for persistent errors (ignore transient startup errors)

### Connecting VS Code

1. Ensure `.vscode/mcp.json` has correct URL (`127.0.0.1`)
2. Regenerate if needed: `npm run mcp:config`
3. Reload VS Code window
4. Open Copilot Chat
5. Verify OneAgent tools appear in tool list
6. Use "MCP: Reset Cached Tools" if tools don't appear

---

## Reference

### Port Configuration

| Service       | Default Port | Environment Variable   |
| ------------- | ------------ | ---------------------- |
| Memory Server | 8010         | `ONEAGENT_MEMORY_PORT` |
| MCP Server    | 8083         | `ONEAGENT_MCP_PORT`    |
| UI Dashboard  | 8080         | `ONEAGENT_UI_PORT`     |

### Key Configuration Files

- `.env` - Server ports, API keys, feature flags
- `.vscode/mcp.json` - VS Code Copilot Chat MCP configuration
- `coreagent/config/index.ts` - Server configuration defaults

### Key Environment Variables

```bash
# Server binding (0.0.0.0 = all interfaces)
ONEAGENT_HOST=0.0.0.0

# Client connection URL (must be specific hostname)
ONEAGENT_MCP_URL=http://127.0.0.1:8083

# Ports
ONEAGENT_MCP_PORT=8083
ONEAGENT_MEMORY_PORT=8010

# Startup behavior
ONEAGENT_FORCE_AUTOSTART=1
ONEAGENT_DISABLE_AUTO_MONITORING=1
ONEAGENT_SKIP_MEMORY_PROBE=1
```

---

## Summary

**Key Takeaways:**

1. ✅ "Cannot GET" messages are **EXPECTED** for protocol endpoints
2. ✅ Memory showing "0 memories" is **NORMAL** (AI filtering working)
3. ✅ "initialized": false is **EXPECTED** before VS Code connects
4. ✅ Transient startup errors are **NORMAL** (resolve automatically)
5. ✅ Use `/health` and `/info` for browser testing, not `/mcp`

**When to seek help:**

- Persistent errors lasting >2 minutes
- Connection failures preventing server startup
- Health endpoints returning errors (not just "unhealthy" status)
- VS Code integration failing after correct configuration

**Remember**: Most "errors" you see are actually correct operation! Understanding normal behavior builds confidence and prevents unnecessary troubleshooting.

---

**Document Version**: 1.0  
**Last Updated**: October 3, 2025  
**Maintained by**: OneAgent Development Team
