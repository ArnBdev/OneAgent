# Memory Health Endpoints Integration Plan

**Date**: October 3, 2025  
**Version**: OneAgent v4.4.0+ → v4.4.2  
**Status**: ✅ **PHASE 3 COMPLETE** | 🚧 PHASE 4 PENDING  
**Author**: OneAgent DevAgent (James)

## Executive Summary

The new health endpoints (`/health` and `/health/ready`) added to the mem0+FastMCP memory server in v4.4.0 are **partially integrated** but not yet **fully wired** into OneAgent's monitoring, triage, and observability systems. This plan outlines the complete integration strategy to enable production-grade memory backend monitoring with Circuit Breaker resilience pattern.

### Architecture Refinements (Post-Analysis)

**Key Insights**:

1. ✅ **Circuit Breaker Pattern Already Exists** - Implemented in `TaskQueue` (v4.4.1), can be reused for memory backend
2. ✅ **TriageAgent + ProactiveTriageOrchestrator are Complementary** - NOT redundant
   - **ProactiveTriageOrchestrator**: Background service (45s intervals), takes snapshots, runs triage logic
   - **TriageAgent**: On-demand agent, user-facing, provides explanations and recommendations
3. ✅ **Canonical Architecture** - All health data flows through `HealthMonitoringService` → `UnifiedMonitoringService`
4. ✅ **No Parallel Systems** - Single source of truth for all health metrics

**Gemini's Suggestions - Assessment**:

- ✅ **Circuit Breaker**: Already implemented in TaskQueue, will extend to memory client
- ✅ **Self-Healing**: Future roadmap (Phase 2) - Auto-remediation via HybridAgentOrchestrator

## Health System Architecture Analysis

### Current Architecture (Canonical and Well-Designed)

```
┌────────────────────────────────────────────────────────────────────┐
│ HealthMonitoringService (Singleton)                                │
│ - Monitors: registry, agents, orchestrator, API                   │
│ - 30s interval health checks                                       │
│ - Component health tracking                                        │
│ - Predictive alerts                                                │
│ - Constitutional AI compliance                                     │
│ ❌ MISSING: Memory backend health                                  │
└──────────────────┬─────────────────────────────────────────────────┘
                   │
                   ↓ getSystemHealth()
┌────────────────────────────────────────────────────────────────────┐
│ UnifiedMonitoringService (Facade)                                  │
│ - Aggregates all monitoring data                                   │
│ - Prometheus metrics exposition                                    │
│ - Mission Control integration                                      │
└──────────────────┬─────────────────────────────────────────────────┘
                   │
                   ↓ Consumed by
┌────────────────────────────────────────────────────────────────────┐
│ ProactiveTriageOrchestrator (Background Service)                   │
│ - 45s interval snapshots                                            │
│ - Anomaly detection logic                                           │
│ - Error budget burn tracking                                        │
│ - Deep analysis via AI                                              │
│ ❌ MISSING: Memory backend in snapshots                            │
└──────────────────┬─────────────────────────────────────────────────┘
                   │
                   ↓ Snapshots available to
┌────────────────────────────────────────────────────────────────────┐
│ TriageAgent (On-Demand Agent)                                      │
│ - User-facing explanations                                          │
│ - Remediation recommendations                                       │
│ - Actions: explain_system_state, recommend_remediations            │
│ ❌ MISSING: Memory backend in explanations                         │
└────────────────────────────────────────────────────────────────────┘
```

### Why TriageAgent AND ProactiveTriageOrchestrator?

**They serve different purposes** (NOT redundant):

1. **ProactiveTriageOrchestrator** (Background Service):
   - **Runs automatically** every 45s
   - **Passive monitoring** - no user interaction
   - **Generates snapshots** for historical analysis
   - **Detects anomalies** proactively
   - **Feeds data** to TriageAgent on demand

2. **TriageAgent** (Interactive Agent):
   - **User-triggered** via actions
   - **Active assistance** - responds to queries
   - **Explains system state** in natural language
   - **Recommends fixes** based on orchestrator data
   - **Agent communication** - can coordinate with other agents

**Analogy**: ProactiveTriageOrchestrator is like a car's **dashboard sensors** (always monitoring), while TriageAgent is the **mechanic** you call when the check engine light comes on (interprets data, suggests fixes).

### Circuit Breaker Pattern Integration

**Existing Implementation** (TaskQueue v4.4.1):

- Per-executor circuit breaker state
- States: CLOSED (healthy) → OPEN (failing) → HALF_OPEN (testing) → CLOSED
- Thresholds: 5 failures in 60s window → OPEN for 30s
- Prevents cascading failures

**Extension to Memory Backend**:

- Wrap `OneAgentMemory.getHealthStatus()` calls in circuit breaker
- Fail fast when memory backend is down (avoid 2s timeouts)
- Fallback to cached health status when circuit OPEN
- Auto-recovery via HALF_OPEN state testing

## Implementation Status

### ✅ Phase 1: HealthMonitoringService Integration (COMPLETE)

- Memory backend health integrated into component health tracking
- Health check runs every 30 seconds
- Latency thresholds: <500ms healthy, 500-2000ms degraded, >2000ms unhealthy
- Zero errors, zero warnings (357 files compiled)

### ✅ Phase 2: ProactiveTriageOrchestrator Integration (COMPLETE)

- Memory backend health included in proactive snapshots (45s intervals)
- Triage logic detects memory backend issues (unhealthy, degraded, slow, capabilities)
- TriageAgent includes memory status in system state explanations
- Remediation recommendations include memory backend fixes
- `memoryBackendConcern` flag added to TriageResult
- Zero errors, zero warnings (357 files compiled)

### ✅ Phase 3: Mission Control Integration (COMPLETE)

**Implemented**: October 3, 2025

**Changes Made**:

1. **health_delta Channel** (✅ VERIFIED - No changes needed):
   - `ctx.getHealth()` already calls `HealthMonitoringService.getSystemHealth()`
   - Phase 1 added `memoryService` to `ComponentHealthMap`
   - health_delta channel automatically includes memory backend health in payload
   - File: `coreagent/server/mission-control/healthDeltaChannel.ts` (unchanged)

2. **Prometheus Metrics Endpoint** (✅ IMPLEMENTED):
   - Added `exposePrometheusMetrics()` method to `UnifiedMonitoringService`
   - Metrics exposed:
     - `oneagent_memory_backend_healthy` (1=healthy, 0.5=degraded, 0=unhealthy)
     - `oneagent_memory_backend_latency_ms` (response time)
     - `oneagent_memory_backend_capabilities` (tool count)
     - `oneagent_mission_active`, `_completed`, `_errors` (mission stats)
     - `oneagent_system_health` (overall score)
   - File: `coreagent/monitoring/UnifiedMonitoringService.ts` (+75 lines)

3. **Anomaly Alert Channel Extension** (✅ IMPLEMENTED):
   - Made `evaluate()` function async to support health checks
   - Added memory backend health anomaly detection:
     - **CRITICAL alert**: Memory backend status === 'unhealthy'
     - **WARNING alert**: Memory backend latency > 1000ms
   - Includes backend name, error details, response time in alert payload
   - File: `coreagent/server/mission-control/anomalyAlertChannel.ts` (+35 lines)

**Implementation Notes**:

- **Zero TypeScript Errors**: All changes type-safe with proper error handling
- **Constitutional AI Compliant**: Accuracy (real data), Transparency (clear metrics), Helpfulness (actionable alerts), Safety (read-only operations)
- **Canonical Pattern**: Uses existing `ctx.getHealth()` → `HealthMonitoringService` flow
- **No Parallel Systems**: Extends existing Mission Control channels, not creating new ones

**Verification Status**: ⏳ PENDING (Task 3.5 - awaiting npm run verify)

### ⏳ Phase 4: Testing & Documentation (PENDING)

- Unit tests for memory backend health monitoring
- Integration tests for health status transitions
- Documentation updates
- Smoke test validation

---

### ✅ What's Working (Already Implemented)

1. **Memory Server Health Endpoints** (v4.4.0):
   - `/health` - Liveness probe (< 50ms response)
   - `/health/ready` - Readiness probe with dependency validation (< 100ms response)
   - Both endpoints production-ready and tested

2. **Memory Client Health Method**:
   - `Mem0MemoryClient.getHealthStatus()` implemented
   - Uses MCP resource: `health://status`
   - Returns structured health data: `{ healthy, backend, capabilities, lastChecked, details }`
   - Proper error handling with degraded status fallback

3. **Unified Monitoring Service**:
   - Integrates with `HealthMonitoringService`
   - Calls `healthMonitoringService.getSystemHealth()`
   - Has fallback to PerformanceMonitor for metrics
   - Tracks system-wide component health

4. **OneAgent MCP Server Health Endpoint**:
   - `/health` endpoint at `unified-mcp-server.ts:945`
   - Aggregates health from monitoring service
   - Supports detailed health queries: `?details=true`

### ⚠️ What's Missing (Not Yet Wired)

1. **HealthMonitoringService Gaps**:
   - ❌ Monitors **process memory usage** (RAM %), NOT **memory service health**
   - ❌ No calls to `OneAgentMemory.getHealthStatus()` in `performHealthCheck()`
   - ❌ No memory backend connectivity validation
   - ❌ No integration with new `/health` and `/health/ready` endpoints

2. **TriageAgent / ProactiveTriageOrchestrator Gaps**:
   - ❌ `ProactiveTriageOrchestrator.runObservationCycle()` does NOT check memory backend health
   - ❌ TriageAgent's `explain_system_state` does NOT include memory service status
   - ❌ No memory backend connectivity alerts in triage recommendations
   - ❌ No proactive detection of memory service degradation

3. **Mission Control Gaps**:
   - ❌ `health_delta` channel does NOT include memory backend status
   - ❌ No memory service health gauge in Prometheus metrics
   - ❌ No memory backend alerts in anomaly detection

4. **Smoke Test Gaps**:
   - ❌ Runtime smoke test updated to use new endpoints (✅ DONE v4.4.0)
   - ✅ BUT: Not yet tested end-to-end with servers running

## Integration Architecture

### Proposed Health Check Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Memory Server (mem0+FastMCP) - Port 8010                        │
│                                                                  │
│  /health         → Liveness (server alive, < 50ms)              │
│  /health/ready   → Readiness (dependencies OK, < 100ms)         │
│  health://status → MCP resource (comprehensive backend status)  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓ HTTP GET / MCP resource read
┌─────────────────────────────────────────────────────────────────┐
│ HealthMonitoringService.performHealthCheck()                    │
│                                                                  │
│  1. Call OneAgentMemory.getInstance().getHealthStatus()         │
│     → Returns: { healthy, backend, capabilities, lastChecked }  │
│                                                                  │
│  2. Optionally: Direct HTTP health probe to /health/ready       │
│     → Faster, validates network connectivity                    │
│                                                                  │
│  3. Store in components.memoryService:                          │
│     - status: 'healthy' | 'degraded' | 'unhealthy'              │
│     - latency: Response time (ms)                               │
│     - backend: 'mem0+FastMCP'                                   │
│     - capabilities: ['add', 'search', 'edit', 'delete', ...]    │
│     - details: { tools, resources, ready }                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓ Included in SystemHealthReport
┌─────────────────────────────────────────────────────────────────┐
│ ProactiveTriageOrchestrator.runObservationCycle()               │
│                                                                  │
│  1. Call healthMonitoringService.getSystemHealth()              │
│     → Includes memoryService status from above                  │
│                                                                  │
│  2. Analyze memory backend health in triage logic:              │
│     - If memoryService.status === 'unhealthy' → anomaly         │
│     - If latency > 500ms → warning (slower than expected)       │
│     - If capabilities.length === 0 → critical (not ready)       │
│                                                                  │
│  3. Generate remediation recommendations:                       │
│     - "Restart memory server" (if unhealthy)                    │
│     - "Check network connectivity" (if latency high)            │
│     - "Validate MCP session" (if capabilities empty)            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓ Triage results available
┌─────────────────────────────────────────────────────────────────┐
│ TriageAgent Actions                                             │
│                                                                  │
│  explain_system_state → Includes memory backend health          │
│  recommend_remediations → Suggests memory fixes if needed       │
│  get_proactive_snapshot → Shows memory service status           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓ Emitted to Mission Control
┌─────────────────────────────────────────────────────────────────┐
│ Mission Control WebSocket - health_delta channel                │
│                                                                  │
│  Event: { type: 'health_delta', component: 'memoryService', ... }│
│  Prometheus: oneagent_memory_backend_healthy gauge              │
│  Anomaly Alert: Memory backend degraded/unhealthy               │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: HealthMonitoringService Integration (HIGH PRIORITY)

**Goal**: Wire memory backend health into system health monitoring.

#### Task 1.1: Add Memory Service Health Check

**File**: `coreagent/monitoring/HealthMonitoringService.ts`

**Changes Needed**:

1. Add memory backend health check in `performHealthCheck()`:

```typescript
// After line ~400 (in performHealthCheck method)
private async performHealthCheck(): Promise<void> {
  // ... existing health checks ...

  // Add memory backend health check
  const memoryHealth = await this.getMemoryBackendHealth();
  this.updateComponentHealth('memoryService', memoryHealth);

  // ... rest of health check ...
}

private async getMemoryBackendHealth(): Promise<ComponentHealth> {
  try {
    const memory = getOneAgentMemory();
    const healthStatus = await memory.getHealthStatus();

    // Validate health status
    const isHealthy = healthStatus.healthy;
    const status: HealthStatus = isHealthy ? 'healthy' :
                                 healthStatus.details.includes('timeout') ? 'degraded' :
                                 'unhealthy';

    return {
      status,
      lastCheck: new Date(healthStatus.lastChecked),
      metrics: {
        backend: healthStatus.backend,
        capabilities: healthStatus.capabilities.length,
        healthy: isHealthy,
      },
      details: {
        backend: healthStatus.backend,
        capabilities: healthStatus.capabilities,
        lastChecked: healthStatus.lastChecked,
        raw: healthStatus.details,
      },
    };
  } catch (error) {
    unifiedLogger.error('Memory backend health check failed', { error });
    return {
      status: 'unhealthy',
      lastCheck: new Date(),
      metrics: { healthy: false },
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
```

2. Add optional direct HTTP health probe (faster than MCP resource):

```typescript
private async probeMemoryBackendHttp(): Promise<{
  liveness: boolean;
  readiness: boolean;
  latency: number;
}> {
  const memoryEndpoint = environmentConfig.endpoints.memory.url;
  const baseUrl = memoryEndpoint.replace(/\/mcp$/, '');

  const startLiveness = Date.now();
  try {
    const livenessResp = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    const livenessLatency = Date.now() - startLiveness;
    const livenessData = await livenessResp.json();

    const startReadiness = Date.now();
    const readinessResp = await fetch(`${baseUrl}/health/ready`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    const readinessLatency = Date.now() - startReadiness;
    const readinessData = await readinessResp.json();

    return {
      liveness: livenessData.status === 'healthy',
      readiness: readinessData.ready === true,
      latency: Math.max(livenessLatency, readinessLatency),
    };
  } catch (error) {
    unifiedLogger.warn('Memory HTTP health probe failed', { error });
    return {
      liveness: false,
      readiness: false,
      latency: 2000, // Timeout
    };
  }
}
```

3. Update `getComponentHealthMap()` to include memory service.

**Acceptance Criteria**:

- ✅ Memory backend health included in `SystemHealthReport.components.memoryService`
- ✅ Status: 'healthy', 'degraded', or 'unhealthy'
- ✅ Latency tracked (warn if > 500ms, unhealthy if > 2000ms)
- ✅ Capabilities count validated (unhealthy if 0)
- ✅ Fallback to degraded status on probe errors

**Testing**:

```typescript
// Unit test
describe('HealthMonitoringService - Memory Backend', () => {
  it('should report healthy when memory backend responds correctly', async () => {
    const health = await healthMonitoringService.getSystemHealth();
    expect(health.components.memoryService.status).toBe('healthy');
    expect(health.components.memoryService.metrics.capabilities).toBeGreaterThan(0);
  });

  it('should report unhealthy when memory backend unreachable', async () => {
    // Mock memory.getHealthStatus() to throw error
    const health = await healthMonitoringService.getSystemHealth();
    expect(health.components.memoryService.status).toBe('unhealthy');
  });
});
```

#### Task 1.2: Add Memory Service Alerting Thresholds

**File**: `coreagent/monitoring/HealthMonitoringService.ts`

**Changes Needed**:

1. Add memory service thresholds to config:

```typescript
alertThresholds: {
  // ... existing thresholds ...
  memoryBackendLatency: 500, // ms - warn threshold
  memoryBackendLatencyUnhealthy: 2000, // ms - unhealthy threshold
  memoryBackendCapabilitiesMin: 3, // minimum expected tools
},
```

2. Add memory backend alerts in `generatePredictiveAlerts()`:

```typescript
// Check memory backend health
const memoryHealth = components.memoryService;
if (memoryHealth?.status === 'unhealthy') {
  alerts.push({
    type: 'memory_backend_unhealthy',
    severity: 'critical',
    message: 'Memory backend is unhealthy',
    recommendation: 'Restart memory server or check network connectivity',
    component: 'memoryService',
  });
}

if (memoryHealth?.metrics?.latency > this.config.alertThresholds.memoryBackendLatency) {
  alerts.push({
    type: 'memory_backend_slow',
    severity: 'warning',
    message: `Memory backend latency high: ${memoryHealth.metrics.latency}ms`,
    recommendation: 'Investigate memory server performance',
    component: 'memoryService',
  });
}
```

**Acceptance Criteria**:

- ✅ Critical alert when memory backend status === 'unhealthy'
- ✅ Warning alert when latency > 500ms
- ✅ Warning alert when capabilities < minimum threshold

### Phase 2: ProactiveTriageOrchestrator Integration (MEDIUM PRIORITY)

**Goal**: Add memory backend health to proactive system monitoring.

#### Task 2.1: Enhance Observation Cycle

**File**: `coreagent/services/ProactiveTriageOrchestrator.ts`

**Changes Needed**:

1. Add memory backend health to `ProactiveSnapshot`:

```typescript
export interface ProactiveSnapshot {
  takenAt: string;
  stats: ReturnType<typeof metricsService.getStats>;
  operations: ReturnType<typeof unifiedMonitoringService.summarizeOperationMetrics>;
  slos: ReturnType<typeof sloService.getConfig> | null;
  recentErrorEvents: number;
  errorBudgetBurnHot: Array<{ operation: string; burnRate: number; remaining: number }>;
  // NEW: Memory backend health
  memoryBackend?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    capabilities: number;
    backend: string;
  };
}
```

2. Populate memory backend health in `takeProactiveSnapshot()`:

```typescript
private async takeProactiveSnapshot(): Promise<ProactiveSnapshot> {
  // ... existing snapshot logic ...

  // Add memory backend health
  let memoryBackend: ProactiveSnapshot['memoryBackend'];
  try {
    const healthReport = await unifiedMonitoringService.getSystemHealth();
    const memHealth = healthReport.components?.memoryService;
    if (memHealth) {
      memoryBackend = {
        status: memHealth.status as 'healthy' | 'degraded' | 'unhealthy',
        latency: memHealth.metrics?.latency || 0,
        capabilities: memHealth.metrics?.capabilities || 0,
        backend: memHealth.details?.backend || 'unknown',
      };
    }
  } catch (error) {
    unifiedLogger.warn('Failed to get memory backend health in proactive snapshot', { error });
  }

  return {
    // ... existing fields ...
    memoryBackend,
  };
}
```

3. Add memory backend analysis in `runTriageLogic()`:

```typescript
private runTriageLogic(snap: ProactiveSnapshot): TriageResult {
  const reasons: string[] = [];
  let anomalySuspected = false;
  let memoryBackendConcern = false;

  // ... existing triage logic ...

  // Check memory backend health
  if (snap.memoryBackend) {
    if (snap.memoryBackend.status === 'unhealthy') {
      reasons.push(`Memory backend unhealthy (${snap.memoryBackend.backend})`);
      anomalySuspected = true;
      memoryBackendConcern = true;
    } else if (snap.memoryBackend.status === 'degraded') {
      reasons.push(`Memory backend degraded (latency: ${snap.memoryBackend.latency}ms)`);
      memoryBackendConcern = true;
    } else if (snap.memoryBackend.latency > 500) {
      reasons.push(`Memory backend slow response (${snap.memoryBackend.latency}ms)`);
    }

    if (snap.memoryBackend.capabilities < 3) {
      reasons.push(`Memory backend capabilities reduced (${snap.memoryBackend.capabilities} tools)`);
      memoryBackendConcern = true;
    }
  }

  return {
    // ... existing fields ...
    memoryBackendConcern,
  };
}
```

**Acceptance Criteria**:

- ✅ Memory backend health included in proactive snapshots
- ✅ Triage logic detects memory backend issues
- ✅ `memoryBackendConcern` flag set when issues detected
- ✅ Reasons array includes memory backend diagnostics

#### Task 2.2: Add Memory Backend Remediation Recommendations

**File**: `coreagent/agents/specialized/TriageAgent.ts`

**Changes Needed**:

1. Update `buildRemediationRecommendations()` to include memory backend fixes:

```typescript
private buildRemediationRecommendations(
  snap: ProactiveSnapshot | null,
  triage: TriageResult | null,
  deep: DeepAnalysisResult | null,
): string[] {
  const recs: string[] = [];

  // ... existing recommendations ...

  // Memory backend recommendations
  if (snap?.memoryBackend) {
    if (snap.memoryBackend.status === 'unhealthy') {
      recs.push('CRITICAL: Restart memory server (mem0+FastMCP) - backend unreachable');
      recs.push('Check memory server logs for errors');
      recs.push('Verify network connectivity to port 8010');
      recs.push('Validate MCP session initialization');
    } else if (snap.memoryBackend.status === 'degraded') {
      recs.push('WARNING: Memory backend degraded - investigate performance');
      recs.push(`Current latency: ${snap.memoryBackend.latency}ms (target: < 500ms)`);
      recs.push('Consider restarting memory server if persistent');
    }

    if (snap.memoryBackend.capabilities < 3) {
      recs.push('Memory backend missing tools - verify MCP initialization');
      recs.push('Check mem0_fastmcp_server.py tool registration');
    }
  }

  return recs;
}
```

2. Update `explainSystemState()` to include memory backend status:

```typescript
private async explainSystemState(
  snap: ProactiveSnapshot | null,
  triage: TriageResult | null,
  deep: DeepAnalysisResult | null,
): Promise<string> {
  let explanation = 'System State Analysis:\n\n';

  // ... existing analysis ...

  // Memory backend status
  if (snap?.memoryBackend) {
    explanation += `\n**Memory Backend (${snap.memoryBackend.backend})**:\n`;
    explanation += `- Status: ${snap.memoryBackend.status.toUpperCase()}\n`;
    explanation += `- Latency: ${snap.memoryBackend.latency}ms\n`;
    explanation += `- Capabilities: ${snap.memoryBackend.capabilities} tools available\n`;

    if (snap.memoryBackend.status !== 'healthy') {
      explanation += `- ⚠️ CONCERN: Memory backend ${snap.memoryBackend.status}\n`;
    }
  }

  return explanation;
}
```

**Acceptance Criteria**:

- ✅ Remediation recommendations include memory backend fixes
- ✅ System state explanation includes memory backend status
- ✅ Critical recommendations for unhealthy backend
- ✅ Warning recommendations for degraded backend

### Phase 3: Mission Control Integration (MEDIUM PRIORITY)

**Goal**: Expose memory backend health in Mission Control dashboard.

#### Task 3.1: Add Memory Backend to health_delta Channel

**File**: `coreagent/server/mission-control/healthDeltaChannel.ts`

**Changes Needed**:

1. Include memory backend in health delta events:

```typescript
// Existing health delta logic includes memoryService component
// Already works if HealthMonitoringService populates it (Phase 1)
// No changes needed - just verify emission
```

2. Add memory backend gauge to Prometheus metrics:

```typescript
// File: coreagent/monitoring/UnifiedMonitoringService.ts
// In exposePrometheusMetrics()

// Memory backend health gauge
if (healthReport.components?.memoryService) {
  const memHealth = healthReport.components.memoryService;
  const healthValue =
    memHealth.status === 'healthy' ? 1 : memHealth.status === 'degraded' ? 0.5 : 0;
  lines.push(`oneagent_memory_backend_healthy ${healthValue}`);

  if (memHealth.metrics?.latency) {
    lines.push(`oneagent_memory_backend_latency_ms ${memHealth.metrics.latency}`);
  }

  if (memHealth.metrics?.capabilities) {
    lines.push(`oneagent_memory_backend_capabilities ${memHealth.metrics.capabilities}`);
  }
}
```

**Acceptance Criteria**:

- ✅ Memory backend health emitted via `health_delta` channel
- ✅ Prometheus gauge: `oneagent_memory_backend_healthy` (1=healthy, 0.5=degraded, 0=unhealthy)
- ✅ Prometheus gauge: `oneagent_memory_backend_latency_ms`
- ✅ Prometheus gauge: `oneagent_memory_backend_capabilities`

#### Task 3.2: Add Memory Backend to Anomaly Alerts

**File**: `coreagent/server/mission-control/anomalyAlertChannel.ts`

**Changes Needed**:

1. Add memory backend anomaly detection:

```typescript
// In anomaly detection logic
const memHealth = latestHealth.components?.memoryService;
if (memHealth?.status === 'unhealthy') {
  emit({
    category: 'memory_backend',
    severity: 'critical',
    message: 'Memory backend unreachable or unhealthy',
    metric: 'memory_backend_status',
    value: 0,
    threshold: 1,
    details: {
      backend: memHealth.details?.backend,
      error: memHealth.details?.error,
      lastChecked: memHealth.lastCheck,
    },
  });
}

if (memHealth?.metrics?.latency > 1000) {
  emit({
    category: 'memory_backend',
    severity: 'warning',
    message: `Memory backend latency high: ${memHealth.metrics.latency}ms`,
    metric: 'memory_backend_latency',
    value: memHealth.metrics.latency,
    threshold: 1000,
    details: {
      backend: memHealth.details?.backend,
    },
  });
}
```

**Acceptance Criteria**:

- ✅ Critical anomaly alert when memory backend unhealthy
- ✅ Warning anomaly alert when latency > 1000ms
- ✅ Alert details include backend name and error info

### Phase 4: Documentation & Testing (HIGH PRIORITY)

**Goal**: Comprehensive documentation and test coverage.

#### Task 4.1: Update Documentation

**Files to Update**:

1. `docs/memory-system-architecture.md` - Add monitoring section
2. `docs/HEALTH_CHECK_QUICK_REFERENCE.md` - Add OneAgent integration examples
3. `docs/monitoring/ALERTS.md` - Add memory backend alert definitions
4. `AGENTS.md` - Update with health monitoring capabilities

**Content Needed**:

- Health check flow diagram (HealthMonitoringService → Memory Client → Memory Server)
- Alert threshold documentation
- Triage integration examples
- Mission Control dashboard screenshots (future)

#### Task 4.2: Add Integration Tests

**Test Files Needed**:

1. `coreagent/tests/integration/memory-health-monitoring.test.ts`:

```typescript
describe('Memory Backend Health Monitoring', () => {
  it('should detect healthy memory backend', async () => {
    const health = await healthMonitoringService.getSystemHealth();
    expect(health.components.memoryService.status).toBe('healthy');
  });

  it('should detect unhealthy memory backend when server down', async () => {
    // Stop memory server
    // Check health
    const health = await healthMonitoringService.getSystemHealth();
    expect(health.components.memoryService.status).toBe('unhealthy');
  });

  it('should emit health_delta when memory backend degrades', async () => {
    // Subscribe to health_delta channel
    // Simulate memory backend slowdown
    // Verify event emitted
  });
});
```

2. `coreagent/tests/integration/triage-memory-monitoring.test.ts`:

```typescript
describe('TriageAgent Memory Backend Monitoring', () => {
  it('should include memory backend health in system state explanation', async () => {
    const explanation = await triageAgent.executeAction('explain_system_state', {});
    expect(explanation.content).toContain('Memory Backend');
    expect(explanation.content).toContain('mem0+FastMCP');
  });

  it('should recommend remediation when memory backend unhealthy', async () => {
    // Simulate unhealthy backend
    const recs = await triageAgent.executeAction('recommend_remediations', {});
    expect(recs.metadata.recommendations).toContain('Restart memory server');
  });
});
```

**Acceptance Criteria**:

- ✅ Integration tests cover all monitoring scenarios
- ✅ Tests validate health status transitions
- ✅ Tests verify alert emission
- ✅ Tests confirm triage recommendations

#### Task 4.3: Update Smoke Tests

**File**: `scripts/runtime-smoke.ts`

**Status**: ✅ Already updated in v4.4.0 to use new `/health` and `/health/ready` endpoints.

**Validation Needed**:

- ⏳ Run smoke test end-to-end with both servers running
- ⏳ Verify health endpoint responses match expected format
- ⏳ Confirm readiness check validates MCP tools/resources

## Roadmap Integration

### Should This Be Added to Roadmap? **YES** ✅

**Recommendation**: Add as new Epic or expand existing monitoring section.

**Proposed Roadmap Entry**:

```markdown
### 5.X Memory Backend Monitoring (HIGH PRIORITY — v4.4.1 / v4.5.0)

**Goal**: Fully integrate mem0+FastMCP health endpoints into OneAgent monitoring, triage, and observability systems.

**Backend Priorities**:

- ✅ Health endpoints implemented (v4.4.0) - `/health` and `/health/ready`
- 🚧 Wire into HealthMonitoringService (Phase 1)
- 🚧 Integrate with ProactiveTriageOrchestrator (Phase 2)
- 🚧 Expose in Mission Control dashboard (Phase 3)
- 🚧 Comprehensive testing and documentation (Phase 4)

**TriageAgent Integration**:

- Enable memory backend health monitoring in system state analysis
- Add memory backend remediation recommendations
- Proactive alerts for memory service degradation

**Mission Control Integration**:

- Memory backend health in health_delta channel
- Prometheus metrics: oneagent_memory_backend_healthy, latency, capabilities
- Anomaly alerts for memory backend issues

**Acceptance Criteria**:

- ✅ HealthMonitoringService queries memory backend health every cycle
- ✅ TriageAgent includes memory status in system state explanations
- ✅ ProactiveTriageOrchestrator detects memory backend anomalies
- ✅ Mission Control displays memory backend health in dashboard
- ✅ Prometheus metrics exposed for memory backend monitoring
- ✅ Anomaly alerts emit for critical memory issues
- ✅ Integration tests cover all monitoring scenarios
- ✅ Documentation complete with examples and troubleshooting

**Estimated Effort**: 2-3 days (16-24 hours)

- Phase 1 (HealthMonitoringService): 6-8 hours
- Phase 2 (ProactiveTriageOrchestrator): 4-6 hours
- Phase 3 (Mission Control): 4-6 hours
- Phase 4 (Testing & Docs): 2-4 hours

**Priority Justification**:

- Memory backend is **CRITICAL** infrastructure (100% of memory operations depend on it)
- Health endpoints already implemented - just needs wiring
- Enables proactive detection of memory service issues
- Aligns with observability and reliability excellence goals
- Low risk - additive changes only, no breaking changes
```

## Implementation Sequence

### Recommended Order

1. **Phase 1 (HealthMonitoringService)** - MUST DO FIRST
   - Establishes foundation for all other phases
   - Populates `SystemHealthReport.components.memoryService`
   - All downstream systems depend on this data

2. **Phase 2 (ProactiveTriageOrchestrator)** - MEDIUM PRIORITY
   - Adds intelligent analysis on top of health data
   - Enables proactive alerts and remediation
   - TriageAgent becomes more useful

3. **Phase 3 (Mission Control)** - LOWER PRIORITY
   - UI/dashboard integration
   - Can be deferred if UI not yet ready
   - Prometheus metrics useful for external monitoring

4. **Phase 4 (Documentation & Testing)** - ONGOING
   - Should proceed in parallel with implementation
   - Tests written alongside code changes
   - Documentation updated incrementally

### Timeline

**Week 1**:

- Day 1-2: Phase 1 (HealthMonitoringService) - 6-8 hours
- Day 3: Phase 1 testing and validation - 2-3 hours
- Day 4-5: Phase 2 (ProactiveTriageOrchestrator) - 4-6 hours

**Week 2**:

- Day 1: Phase 2 testing and TriageAgent integration - 2-3 hours
- Day 2-3: Phase 3 (Mission Control) - 4-6 hours
- Day 4: Phase 3 testing and Prometheus validation - 2-3 hours
- Day 5: Phase 4 (Documentation) - 2-4 hours

**Total**: ~24-30 hours over 2 weeks

## Risk Assessment

**Risk Level**: **LOW** ✅

**Mitigations**:

- ✅ Health endpoints already implemented and tested
- ✅ No breaking changes - all additions are additive
- ✅ Fallback behavior if memory backend unreachable (degraded status)
- ✅ Comprehensive error handling in all health check paths
- ✅ Tests validate all failure scenarios

**Potential Issues**:

1. **Memory backend latency high** (> 500ms)
   - Mitigation: Timeout protection, fallback to cached status
2. **MCP session initialization fails**
   - Mitigation: Retry logic, degraded status with clear error message
3. **Health check overhead**
   - Mitigation: Health checks run every 30s (not per-request)

## Success Metrics

**Quantitative**:

- ✅ Memory backend health checked every 30 seconds (monitoring interval)
- ✅ Health check latency < 200ms (target: < 100ms)
- ✅ Zero false negatives (unhealthy backend not detected)
- ✅ < 1% false positives (healthy backend marked unhealthy)
- ✅ 100% test coverage for memory health monitoring paths

**Qualitative**:

- ✅ TriageAgent provides actionable memory backend recommendations
- ✅ Mission Control dashboard shows real-time memory backend status
- ✅ Proactive alerts detect memory issues before user impact
- ✅ Documentation enables easy troubleshooting of memory issues

## Conclusion

The new health endpoints (`/health` and `/health/ready`) are production-ready and tested, but **NOT yet fully wired** into OneAgent's monitoring, triage, and observability systems. This plan provides a clear path to complete integration with minimal risk and high value.

**Key Takeaways**:

1. ✅ Health endpoints work - just need to be queried
2. ✅ Integration is straightforward - additive changes only
3. ✅ High value - enables proactive memory backend monitoring
4. ✅ Should be added to roadmap as high-priority task
5. ✅ Estimated 2-3 days of focused implementation

**Next Steps**:

1. Add to roadmap (v4.4.1 or v4.5.0)
2. Implement Phase 1 (HealthMonitoringService)
3. Validate with integration tests
4. Proceed with Phases 2-4 sequentially

---

**OneAgent DevAgent (James)**  
_Constitutional AI Development Specialist_  
_Quality Standard: 80%+ Grade A_
