# 🧪 Agent Discovery Testing Guide

**Date**: October 7, 2025  
**Purpose**: Verify agent discovery behavior and performance

## Current Status

**Agent Discovery**: ⚠️ Disabled for MCP session testing  
**Reason**: Prevents initialization blocking (~2+ minute startup delay)  
**Flag**: `ONEAGENT_DISABLE_AGENT_DISCOVERY=1`

## Test Scenarios

### Scenario 1: Discovery Disabled (CURRENT - WORKING)

**Command**:

```powershell
$env:ONEAGENT_DISABLE_AGENT_DISCOVERY='1'; npm run server:unified
```

**Expected Behavior**:

- ✅ Server starts in ~3 minutes
- ✅ Agent discovery warnings: `[AgentCommunication] ⚠️ Agent discovery disabled`
- ✅ All 23 tools registered
- ✅ MCP sessions working (8/8 tests passing)
- ✅ Memory operations functional

**Startup Timeline**:

```
19:17:36 - Module load start
19:17:38 - Memory client initialized
19:20:12 - Memory session initializing
19:20:47 - Memory session established (READY)
```

### Scenario 2: Discovery Enabled (NEEDS TESTING)

**Command**:

```powershell
# Remove the disable flag
npm run server:unified
```

**Possible Outcomes**:

**Outcome A: Works Correctly** ✅

- Server starts in ~3-5 minutes
- Agent discovery completes without blocking
- All 23 tools registered
- MCP sessions working

**Outcome B: Blocks Initialization** ❌

- Server hangs during initialization
- Discovery repeatedly fails/retries
- Memory search operations timeout
- Server never reaches "READY" state

**Outcome C: Partial Functionality** ⚠️

- Server starts but discovery fails silently
- Warning logs about discovery errors
- Core functionality works
- Agent-to-agent communication may be limited

### Scenario 3: Discovery with Monitoring (RECOMMENDED FIRST TEST)

**Command**:

```powershell
# Enable verbose logging to diagnose behavior
$env:DEBUG='oneagent:*'; npm run server:unified
```

**What to Watch**:

```
[AgentCommunication] Discovering agents...
[AgentCommunication] Memory search: discover all agents
[AgentCommunication] Discovery completed: N agents found
```

**Success Criteria**:

- Discovery completes in <10 seconds
- No repeated retry loops
- Memory search returns results (even if empty)
- Server reaches "READY" state

**Failure Indicators**:

- Discovery takes >30 seconds
- Repeated `[AgentCommunication] Discovery failed, retrying...`
- Memory search timeouts
- Server hangs before "READY"

## Manual Testing Procedure

### Step 1: Enable Discovery with Monitoring

```powershell
# Terminal 1: Start memory server (if not running)
npm run memory:server

# Terminal 2: Start OneAgent with discovery enabled
npm run server:unified
```

**Monitor Output**:

- Watch for `[AgentCommunication]` log lines
- Note timestamp when discovery starts
- Note timestamp when discovery completes
- Check if server reaches "READY" state

### Step 2: Test MCP Sessions

```powershell
# Terminal 3: Run session tests
.\scripts\test-mcp-sessions.ps1
```

**Expected**: 8/8 tests passing (if discovery works correctly)

### Step 3: Test Agent Discovery Directly

```powershell
# Use oneagent_system_health tool (includes discovery status)
curl http://localhost:8083/health | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

**Expected Response**:

```json
{
  "status": "healthy",
  "initialized": true,
  "agents": {
    "discovered": 0, // or actual count if agents registered
    "healthy": 0,
    "total": 0
  }
}
```

## Diagnostic Commands

### Check Memory Backend Connection

```powershell
# Should return MCP session info
curl http://localhost:8010/mcp | ConvertFrom-Json
```

### Check Agent Discovery Cache

```typescript
// In Node.js REPL or debug console:
const { OneAgentUnifiedBackbone } = require('./dist/utils/UnifiedBackboneService');
const cache = OneAgentUnifiedBackbone.getInstance().cache;
await cache.get('discovery:agents:{}'); // Should return cached agent list or null
```

### Profile Discovery Timing

Add instrumentation to `UnifiedAgentCommunicationService.ts`:

```typescript
async discoverAgents(filter: DiscoveryFilter): Promise<AgentCardWithHealth[]> {
  const startTime = Date.now();
  console.log('[Discovery] START', { timestamp: new Date().toISOString() });

  try {
    const result = await this.runSafely('discoverAgents', async () => {
      // ... existing discovery code ...
    });

    const duration = Date.now() - startTime;
    console.log('[Discovery] COMPLETE', { duration, count: result.length });

    return result;
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error('[Discovery] FAILED', { duration, error: err.message });
    throw err;
  }
}
```

## Performance Benchmarks

### Baseline (Discovery Disabled)

- **Startup**: 191 seconds (3 minutes 11 seconds)
- **Discovery Time**: 0 seconds (skipped)
- **Tests**: 8/8 passing

### Target (Discovery Enabled)

- **Startup**: <10 seconds
- **Discovery Time**: <5 seconds
- **Tests**: 8/8 passing

### Acceptable (Discovery Enabled, Not Optimized)

- **Startup**: <30 seconds
- **Discovery Time**: <20 seconds
- **Tests**: 8/8 passing

## Troubleshooting Guide

### Issue: Server Hangs During Initialization

**Symptoms**:

- Last log line: `[AgentCommunication] Discovering agents...`
- No progress for >1 minute
- CPU at 100% on Node.js process

**Solution**:

1. Kill server (Ctrl+C)
2. Re-enable disable flag: `$env:ONEAGENT_DISABLE_AGENT_DISCOVERY='1'`
3. Proceed with Phase 1 optimizations (see PERFORMANCE_OPTIMIZATION_PLAN.md)

### Issue: Discovery Fails with Errors

**Symptoms**:

- `[AgentCommunication] Discovery failed: <error>`
- Server continues but agent discovery unavailable

**Solution**:

1. Check memory backend connection: `curl http://localhost:8010/health`
2. Verify memory search works: Test with oneagent_memory_search tool
3. Check error logs for specific failure reason
4. May need to implement circuit breaker (Phase 1 optimization)

### Issue: Discovery Takes >30 Seconds

**Symptoms**:

- Discovery completes but takes 30-60 seconds
- Multiple retry attempts visible in logs

**Solution**:

1. Profile memory search performance
2. Check cache TTL settings (may be too short)
3. Implement localhost-optimized retry strategy (Phase 2 optimization)

## Next Steps Based on Test Results

### If Discovery Works (Outcome A): ✅

1. ✅ Mark agent discovery as production-ready
2. 🎯 Proceed to Phase 2: Memory connection optimization
3. 📊 Profile discovery timing for optimization opportunities
4. 📝 Update documentation to remove disable flag

### If Discovery Blocks (Outcome B): ❌

1. 🚨 Keep disable flag enabled for now
2. 🔧 Implement Phase 1 fixes (circuit breaker, deferred init)
3. ✅ Retest after each fix
4. 📊 Profile to confirm improvements

### If Discovery Partially Works (Outcome C): ⚠️

1. 📋 Document specific failure modes
2. 🔍 Add more granular error logging
3. 🔧 Implement error handling improvements
4. ✅ Test incremental fixes

## Test Checklist

Before testing discovery:

- [ ] Memory server running and healthy
- [ ] No other OneAgent processes running
- [ ] Clean cache state (optional: delete unified cache)
- [ ] Monitoring/profiling tools ready

During test:

- [ ] Note exact startup timestamps
- [ ] Watch for discovery log lines
- [ ] Monitor CPU/memory usage
- [ ] Check for timeout/retry patterns

After test:

- [ ] Run full test suite (8 tests)
- [ ] Verify tool registration (23 tools)
- [ ] Check health endpoint
- [ ] Document observed behavior

---

**Next Action**: Run Scenario 3 (Discovery with Monitoring) to determine which outcome occurs  
**Owner**: DevAgent (James)  
**Documentation**: PERFORMANCE_OPTIMIZATION_PLAN.md
