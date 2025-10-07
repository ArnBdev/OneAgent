# 🚀 OneAgent Performance Optimization Plan

**Date**: October 7, 2025  
**Status**: Ready for Implementation  
**Priority**: HIGH (Production Blocker)

## Executive Summary

**Current State**: OneAgent system fully functional but startup takes ~3 minutes
**Target State**: <10 seconds startup time (stretch goal: <5 seconds)
**Impact**: 95%+ reduction in startup time, production-ready deployment

## Baseline Metrics (October 7, 2025)

### Memory Server: ✅ EXCELLENT

- **Startup**: 2.0 seconds (production-ready)
- **Connection Negotiation**: 10.6 seconds (406 retry cycles)
- **Total**: 12.6 seconds to first successful request
- **Post-Startup**: All 200 OK, excellent performance

### OneAgent Server: ⚠️ NEEDS OPTIMIZATION

- **Core Initialization**: 2 minutes 36 seconds
- **Memory Connection**: +35 seconds
- **Total**: 3 minutes 11 seconds
- **Breakdown**:
  - Module loading: 2s ✅
  - Engine initialization: 1s ✅
  - Agent discovery: 153s ❌ (CRITICAL PATH)
  - Memory session: 35s ⚠️

## Root Cause Analysis

### Issue #1: Agent Discovery Blocking (CRITICAL)

**Symptom**: 2+ minute startup delay, tests hang on initialization  
**Root Cause**: Synchronous `memory.searchMemory()` during initialization before memory backend ready

**Code Path**:

```typescript
// UnifiedAgentCommunicationService.ts:440-450
const searchResults = await this.memory.searchMemory({
  query: filter.capabilities
    ? `agent with capabilities: ${filter.capabilities.join(', ')}`
    : 'discover all agents',
  userId: 'system_discovery',
  limit: filter.limit || 100,
  filters,
});
```

**Why It Blocks**:

1. Discovery called during OneAgentEngine initialization
2. Memory backend not connected yet (session negotiation in progress)
3. Search operation retries/blocks waiting for backend
4. No timeout or circuit breaker protection

**Impact**: Server unusable for 2+ minutes during startup

### Issue #2: MCP Session Negotiation (MEDIUM)

**Symptom**: 10-35 seconds of 406 "Not Acceptable" retry cycles  
**Root Cause**: HTTP content negotiation for StreamableHTTP transport

**Observed Pattern**:

```
2025-10-07 19:00:58,459 - INFO - Created transport session: bf5cd...
INFO: 127.0.0.1:60951 - "GET /mcp HTTP/1.1" 406 Not Acceptable
[repeated 20 times over 10.6 seconds]
```

**Why It Happens**:

1. Client sends GET request expecting SSE/StreamableHTTP
2. Server responds with 406 if session not ready
3. Client retries with exponential backoff
4. Eventually succeeds with POST → 200 OK

**Impact**: Adds 10-35 seconds to connection establishment

## Optimization Strategy

### Phase 1: Agent Discovery (CRITICAL - Week 1)

**Objective**: Make discovery fully async, non-blocking, deferred

**Changes Required**:

1. **Defer Discovery Until Memory Ready** (Priority: CRITICAL)

   ```typescript
   // In OneAgentEngine initialization:
   async initialize(): Promise<void> {
     // ... existing initialization ...

     // BEFORE: Discovery runs immediately (blocks on memory)
     // await this.agentComm.initialize();

     // AFTER: Discovery deferred until memory ready
     this.agentComm.initializeAsync().catch(err => {
       console.warn('[Engine] Agent discovery deferred:', err);
     });
   }
   ```

2. **Add Circuit Breaker** (Priority: HIGH)

   ```typescript
   // In UnifiedAgentCommunicationService:
   private async searchWithCircuitBreaker(): Promise<MemorySearchResult[]> {
     const MAX_RETRIES = 3;
     const TIMEOUT_MS = 5000;

     for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
       try {
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

         const results = await this.memory.searchMemory({
           query: '...',
           userId: 'system_discovery',
           signal: controller.signal,
         });

         clearTimeout(timeoutId);
         return results;
       } catch (err) {
         if (attempt === MAX_RETRIES - 1) {
           console.warn('[Discovery] Circuit open, returning empty');
           return [];
         }
       }
     }
   }
   ```

3. **Lazy Discovery on First Use** (Priority: MEDIUM)
   ```typescript
   async discoverAgents(filter: DiscoveryFilter): Promise<AgentCardWithHealth[]> {
     // Check if memory backend is ready before searching
     if (!this.isMemoryReady()) {
       console.warn('[Discovery] Memory not ready, using cache/empty');
       return this.getCachedAgents(filter) || [];
     }

     // Proceed with normal discovery
     // ...
   }
   ```

**Expected Improvement**: 153 seconds → <5 seconds (97% reduction)

### Phase 2: Memory Connection (MEDIUM - Week 2)

**Objective**: Reduce 406 retry cycles for local connections

**Changes Required**:

1. **Optimize Retry Strategy for Localhost**

   ```typescript
   // In Mem0MemoryClient or connection layer:
   private getRetryConfig(baseUrl: string) {
     const isLocalhost = baseUrl.includes('127.0.0.1') || baseUrl.includes('localhost');

     return {
       maxRetries: isLocalhost ? 5 : 20,
       initialDelay: isLocalhost ? 100 : 500,
       maxDelay: isLocalhost ? 2000 : 10000,
       backoffMultiplier: isLocalhost ? 1.5 : 2.0,
     };
   }
   ```

2. **Persistent Session Token**

   ```typescript
   // Cache MCP session ID across restarts (dev mode only)
   const SESSION_CACHE_FILE = '.oneagent-dev-session';

   async establishSession(): Promise<string> {
     if (process.env.NODE_ENV === 'development') {
       const cached = await this.loadCachedSession();
       if (cached && await this.validateSession(cached)) {
         return cached;
       }
     }

     // Fall back to full negotiation
     return this.negotiateNewSession();
   }
   ```

3. **Parallel Connection Initialization**
   ```typescript
   // Start memory connection during engine initialization (don't await)
   async initialize(): Promise<void> {
     // Start memory connection in background
     const memoryPromise = this.memory.connect();

     // Do other initialization work
     await this.initializeConstitutionalAI();
     await this.initializeBMAD();
     await this.registerTools();

     // By now, memory should be connected
     await memoryPromise;
   }
   ```

**Expected Improvement**: 35 seconds → <5 seconds (86% reduction)

### Phase 3: Module Loading (LOW - Week 3)

**Objective**: Lazy-load non-critical modules

**Current**: All modules loaded upfront (~2 seconds)  
**Target**: Critical path only, lazy-load on demand

**Candidates for Lazy Loading**:

- BMAD Framework (load on first analysis request)
- Web Search Tools (load on first search request)
- Specialized agents (load on first usage)

**Expected Improvement**: 2 seconds → <1 second (50% reduction)

## Implementation Roadmap

### Week 1: Agent Discovery (CRITICAL)

- [ ] Add circuit breaker to discovery memory search
- [ ] Implement `isMemoryReady()` health check
- [ ] Defer discovery initialization (non-blocking)
- [ ] Add cached agent fallback for startup
- [ ] Test with `ONEAGENT_DISABLE_AGENT_DISCOVERY` removed
- [ ] Verify 8/8 tests still passing
- [ ] **Target**: Startup <30 seconds

### Week 2: Memory Connection (MEDIUM)

- [ ] Implement localhost-optimized retry strategy
- [ ] Add persistent session token (dev mode)
- [ ] Parallelize memory connection with other init
- [ ] Profile connection timing improvements
- [ ] **Target**: Startup <15 seconds

### Week 3: Module Loading (LOW)

- [ ] Identify lazy-load candidates
- [ ] Implement dynamic imports for non-critical modules
- [ ] Update tool registry for lazy registration
- [ ] Test cold start vs warm start performance
- [ ] **Target**: Startup <10 seconds

### Week 4: Validation & Documentation

- [ ] End-to-end performance testing
- [ ] Load testing (concurrent connections)
- [ ] Update all documentation with new timings
- [ ] Create performance regression tests
- [ ] **Target**: Production-ready deployment

## Success Metrics

| Metric                | Baseline | Week 1 | Week 2 | Week 3 | Week 4 |
| --------------------- | -------- | ------ | ------ | ------ | ------ |
| **Total Startup**     | 191s     | <30s   | <15s   | <10s   | <10s   |
| **Agent Discovery**   | 153s     | <5s    | <5s    | <5s    | <5s    |
| **Memory Connection** | 35s      | 35s    | <5s    | <5s    | <5s    |
| **Module Loading**    | 2s       | 2s     | 2s     | <1s    | <1s    |
| **Tests Passing**     | 8/8      | 8/8    | 8/8    | 8/8    | 8/8    |

## Risk Mitigation

### Risk #1: Breaking Agent Discovery

**Mitigation**: Keep `ONEAGENT_DISABLE_AGENT_DISCOVERY` flag as emergency fallback

### Risk #2: Memory Connection Instability

**Mitigation**: Maintain existing retry logic as fallback for remote connections

### Risk #3: Lazy Loading Failures

**Mitigation**: Comprehensive error handling with fallbacks to eager loading

## Validation Checklist

After each optimization phase:

- [ ] Run full test suite (`.\scripts\test-mcp-sessions.ps1`)
- [ ] Verify 8/8 tests passing
- [ ] Check startup time with timestamps
- [ ] Test agent discovery functionality
- [ ] Verify all 23 tools registered
- [ ] Run Constitutional AI validation checks
- [ ] Profile memory usage (no leaks)
- [ ] Test cold start vs warm start

## Next Steps (Immediate)

1. **Enable Agent Discovery with Monitoring**

   ```powershell
   # Remove ONEAGENT_DISABLE_AGENT_DISCOVERY flag
   npm run server:unified

   # Monitor startup time and behavior
   # If blocking occurs, proceed with Phase 1 fixes
   ```

2. **Profile Discovery Initialization**

   ```typescript
   // Add timing instrumentation
   const start = Date.now();
   await this.agentComm.initialize();
   console.log(`[Profile] Discovery took ${Date.now() - start}ms`);
   ```

3. **Create Performance Regression Test**
   ```powershell
   # New test script: scripts/test-startup-performance.ps1
   # Fails if startup > 15 seconds (after optimizations)
   ```

## Questions to Answer

1. **Does agent discovery work without the disable flag?**
   - Test: Remove `ONEAGENT_DISABLE_AGENT_DISCOVERY=1` and monitor
   - Expected: Either works (unlikely) or blocks again (proceed with fixes)

2. **Is the 406 cycle necessary or can we skip it?**
   - Research: MCP 2025-06-18 spec for persistent sessions
   - Test: Persistent session token approach

3. **Can we precompute agent discovery results?**
   - Option: Static agent registry file for dev/test environments
   - Benefit: Zero discovery time during startup

---

**Status**: Ready for Implementation  
**Owner**: DevAgent (James)  
**Next Review**: After Week 1 completion  
**Quality Standard**: 80%+ Grade A (Professional Excellence)
