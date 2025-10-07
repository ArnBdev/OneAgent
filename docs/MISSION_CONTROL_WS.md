# Mission Control WebSocket Protocol

> Canonical reference for the OneAgent Mission Control real-time channel (Phase 4.2.0 streaming foundations).

## Endpoint

- WebSocket URL: `/ws/mission-control`
- Metrics endpoint: `GET /mission-control/ws-metrics` (JSON snapshot)
- Health (detailed + embedded WS metrics): `GET /health?details=true`

## Subscription Model

Client first connects, then sends a JSON message:

```json
{ "type": "subscribe", "channels": ["metrics_tick", "health_delta"] }
```

Channels can be unsubscribed similarly:

```json
{ "type": "unsubscribe", "channels": ["metrics_tick"] }
```

## Supported Channels

| Channel          | Purpose                                         | Emission Mode            | Cadence / Trigger                                                                                 |
| ---------------- | ----------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `metrics_tick`   | Aggregated latency snapshot (p95/p99)           | Event-driven (throttled) | First qualifying operation metric after min interval (default 2500ms)                             |
| `health_delta`   | Health status transitions                       | Event-driven             | On `health_degraded`, `health_critical`, `system_recovery` monitoring events                      |
| `mission_stats`  | Ephemeral aggregate mission metrics snapshot    | Interval (configurable)  | Default 10s (env `ONEAGENT_MISSION_STATS_INTERVAL_MS`); on subscribe emits immediately            |
| `mission_update` | Per-mission lifecycle status & execution events | Event-driven             | Planning start, task generation, planning complete, execution start/progress/terminal transitions |
| `anomaly_alert`  | Derived anomaly signals (mission/perf/health)   | Interval (configurable)  | Default 15s (env `ONEAGENT_ANOMALY_ALERT_INTERVAL_MS`) – emits only when heuristics trigger       |

## Outbound Message Types

| Type                 | Origin | Notes                                                                                                                                                                                            |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `metrics_tick`       | Server | Includes `payload.p95`, `payload.p99`, `payload.tISO`                                                                                                                                            |
| `health_delta`       | Server | Includes `payload.status` and echo of health object                                                                                                                                              |
| `mission_update`     | Server | `payload.status` ∈ {planning_started,tasks_generated,planned,execution_started,execution_progress,completed,cancelled,error}; may include `tasksSummary`, `planningSession`, `progress`, `error` |
| `mission_stats`      | Server | Snapshot: `active`, `completed`, `cancelled`, `errors`, `avgDurationMs`, `snapshotId`                                                                                                            |
| `anomaly_alert`      | Server | Emits anomaly payload: `category`, `severity`, `message`, optional `metric`, `value`, `threshold`, `details`                                                                                     |
| `subscription_ack`   | Server | Acknowledges subscribe/unsubscribe with `payload.channel`, `payload.status`                                                                                                                      |
| `subscription_error` | Server | Unknown channel error with `error.code` & `error.message`                                                                                                                                        |
| `heartbeat`          | Server | 30s interval liveness ping (no payload)                                                                                                                                                          |
| `pong`               | Server | Reply to client `ping`                                                                                                                                                                           |
| `whoami`             | Server | Server identity + available channels                                                                                                                                                             |
| `protocol_error`     | Server | Malformed / unparseable JSON frame                                                                                                                                                               |

## Schema Validation

Outbound schemas: `coreagent/server/mission-control/schemas/mission-control-outbound-messages.schema.json`.

Generated TypeScript unions via `npm run codegen:mission-control` ensure compile-time drift detection (`codegen:mission-control:check`).

Tests:

- `generatedTypesCoverage.test.ts` – status & variant coverage
- Lifecycle validation & cancellation tests
- Schema conformance tests (runtime Ajv validation)

## Heartbeats & Client State

- Server emits `heartbeat` every 30s.
- Client SHOULD track last heartbeat and classify connection health (e.g., stale threshold = 2 \* interval).
- Client MAY send `ping` at its own cadence for RTT metrics; server responds `pong`.

## Error Handling

| Error Scenario               | Server Response                                            |
| ---------------------------- | ---------------------------------------------------------- |
| Unknown channel on subscribe | `subscription_error` with `error.code = "unknown_channel"` |
| Invalid JSON frame           | `protocol_error` with `error.code = "invalid_json"`        |

## Metrics Exposure

`GET /mission-control/ws-metrics` returns:

```json
{
  "timestamp": "2025-09-22T12:34:56.789Z",
  "metrics": {
    "connectionsOpen": 1,
    "connectionsTotal": 12,
    "messagesSentTotal": 324,
    "subscriptionsTotal": 57,
    "channels": [{ "channel": "metrics_tick", "count": 1 }]
  }
}
```

## Mission Metrics (Prometheus)

The Prometheus exposition endpoint (`GET /api/v1/metrics/prometheus`) now includes derived mission gauges. These are computed on-demand from the in-memory mission registry (no parallel counters stored):

| Metric                             | Type  | Description                                                |
| ---------------------------------- | ----- | ---------------------------------------------------------- |
| `oneagent_mission_active`          | gauge | Currently active (non-terminal) missions                   |
| `oneagent_mission_completed`       | gauge | Missions completed successfully                            |
| `oneagent_mission_cancelled`       | gauge | Missions cancelled by request or timeout                   |
| `oneagent_mission_errors`          | gauge | Missions ended in error state                              |
| `oneagent_mission_total`           | gauge | Total missions tracked (active + terminal)                 |
| `oneagent_mission_avg_duration_ms` | gauge | Average duration (ms) across terminal missions (0 if none) |
| `oneagent_mission_error_rate`      | gauge | Error rate among terminal missions (0–1)                   |

All values are recomputed at scrape time ensuring canonical single source (registry snapshot). No accumulation drift is possible because no counters are incremented outside the registry lifecycle updates.

These metrics support external dashboards & alerting (e.g., high active backlog, rising error rate). Combine with anomaly alerts channel for proactive streaming signals.

## Memory Backend Health Monitoring (Phase 3 v4.4.2)

**Added**: October 3, 2025

### health_delta Channel Enhancement

The `health_delta` channel now automatically includes memory backend health status in its payload. No changes were needed to the channel implementation—Phase 1 integration made memory backend health available via `HealthMonitoringService`, which `health_delta` already consumes.

**Example Payload**:

```json
{
  "type": "health_delta",
  "id": "system_health_delta_1759477440000_abc123",
  "timestamp": "2025-10-03T07:44:00.000Z",
  "unix": 1759477440000,
  "server": { "name": "OneAgent-MCP-Server", "version": "4.4.2" },
  "payload": {
    "status": "healthy",
    "health": {
      "overall": {
        "status": "healthy"
      },
      "components": {
        "memoryService": {
          "status": "healthy",
          "responseTime": 42,
          "lastCheck": "2025-10-03T07:43:55.000Z",
          "details": {
            "backend": "mem0",
            "capabilitiesCount": 7
          }
        }
      }
    }
  }
}
```

**Status Values**:

- `healthy`: Backend responsive, all capabilities available
- `degraded`: Backend responsive but slow (>500ms latency)
- `unhealthy`: Backend unreachable or returning errors

### anomaly_alert Channel Enhancement

The `anomaly_alert` channel now includes memory backend health anomaly detection with two alert rules:

**1. CRITICAL Alert**: Unhealthy Status

Triggers when memory backend status is `unhealthy` (unreachable or returning errors).

```json
{
  "type": "anomaly_alert",
  "id": "system_anomaly_1759477440000_xyz789",
  "timestamp": "2025-10-03T07:44:00.000Z",
  "unix": 1759477440000,
  "server": { "name": "OneAgent-MCP-Server", "version": "4.4.2" },
  "payload": {
    "category": "health",
    "severity": "critical",
    "message": "Memory backend unreachable or unhealthy",
    "metric": "memory_backend_status",
    "value": 0,
    "threshold": 1,
    "details": {
      "backend": "mem0",
      "error": "Connection refused",
      "lastChecked": "2025-10-03T07:43:55.000Z",
      "responseTime": 5000
    }
  }
}
```

**2. WARNING Alert**: High Latency

Triggers when memory backend response time exceeds 1000ms.

```json
{
  "type": "anomaly_alert",
  "id": "system_anomaly_1759477440000_def456",
  "timestamp": "2025-10-03T07:44:00.000Z",
  "unix": 1759477440000,
  "server": { "name": "OneAgent-MCP-Server", "version": "4.4.2" },
  "payload": {
    "category": "health",
    "severity": "warning",
    "message": "Memory backend latency high: 1500ms",
    "metric": "memory_backend_latency",
    "value": 1500,
    "threshold": 1000,
    "details": {
      "backend": "mem0",
      "capabilities": 7
    }
  }
}
```

### Prometheus Memory Backend Metrics

New metrics exposed via `exposePrometheusMetrics()` method in `UnifiedMonitoringService`:

| Metric                                 | Type  | Labels    | Description                                          | Example Value |
| -------------------------------------- | ----- | --------- | ---------------------------------------------------- | ------------- |
| `oneagent_memory_backend_healthy`      | gauge | `backend` | Health status (1=healthy, 0.5=degraded, 0=unhealthy) | `1`           |
| `oneagent_memory_backend_latency_ms`   | gauge | `backend` | Response time in milliseconds                        | `42`          |
| `oneagent_memory_backend_capabilities` | gauge | `backend` | Available tool count                                 | `7`           |
| `oneagent_system_health`               | gauge | (none)    | Overall system health score (0-100)                  | `95`          |

**Example Prometheus Exposition**:

```
# HELP oneagent_memory_backend_healthy Memory backend health status (1=healthy, 0.5=degraded, 0=unhealthy)
# TYPE oneagent_memory_backend_healthy gauge
oneagent_memory_backend_healthy{backend="mem0"} 1

# HELP oneagent_memory_backend_latency_ms Memory backend response time in milliseconds
# TYPE oneagent_memory_backend_latency_ms gauge
oneagent_memory_backend_latency_ms{backend="mem0"} 42

# HELP oneagent_memory_backend_capabilities Memory backend available tool count
# TYPE oneagent_memory_backend_capabilities gauge
oneagent_memory_backend_capabilities{backend="mem0"} 7

# HELP oneagent_system_health Overall system health score (0-100)
# TYPE oneagent_system_health gauge
oneagent_system_health 95
```

**Grafana Alert Examples**:

```yaml
# Alert: Memory Backend Down
- alert: MemoryBackendDown
  expr: oneagent_memory_backend_healthy < 1
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: 'Memory backend {{ $labels.backend }} is unhealthy'
    description: 'Health value: {{ $value }} (should be 1 for healthy)'

# Alert: Memory Backend Slow
- alert: MemoryBackendSlow
  expr: oneagent_memory_backend_latency_ms > 1000
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: 'Memory backend {{ $labels.backend }} latency high'
    description: 'Latency: {{ $value }}ms (threshold: 1000ms)'

# Alert: Memory Backend No Capabilities
- alert: MemoryBackendNoCapabilities
  expr: oneagent_memory_backend_capabilities == 0
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: 'Memory backend {{ $labels.backend }} has no capabilities'
    description: 'Backend may be partially initialized or misconfigured'
```

### Testing Memory Backend Monitoring

**1. Unit Tests**:

- `tests/monitoring/prometheus-memory-backend.test.ts`: Prometheus metrics exposition
- `tests/mission-control/anomalyAlertChannel.test.ts`: Anomaly detection rules

**2. Integration Tests**:

- Verify `health_delta` payload includes `memoryService` component
- Verify `anomaly_alert` emits CRITICAL/WARNING for memory backend issues
- Verify Prometheus metrics endpoint returns memory backend gauges

**3. Manual Testing**:

```bash
# Start both servers
./scripts/start-oneagent-system.ps1

# Subscribe to health_delta channel
wscat -c ws://localhost:8083/ws/mission-control
> {"type":"subscribe","channels":["health_delta"]}

# Subscribe to anomaly_alert channel
> {"type":"subscribe","channels":["anomaly_alert"]}

# Query Prometheus metrics
curl http://localhost:8083/api/v1/metrics/prometheus | grep memory_backend
```

### Constitutional AI Compliance

- ✅ **Accuracy**: Reports real health data from `HealthMonitoringService`
- ✅ **Transparency**: Clear metric names, alert messages, and Prometheus labels
- ✅ **Helpfulness**: Actionable alerts with backend details for remediation
- ✅ **Safety**: Read-only operations, comprehensive error handling, fallback metrics

## Canonical Patterns Used

- Time & IDs via `createUnifiedTimestamp()` / `createUnifiedId()`
- Event-driven health via `unifiedMonitoringService` (no polling parallel system)
- Throttled metrics emission using monitoring events (`operation_metric`)

## Future Enhancements (Planned)

- Adaptive anomaly thresholds (EWMA / z-score vs static)
- Backpressure / compression negotiation
- AuthZ integration for channels (multi-tenant scenarios)
- Structured latency bins / histogram export
- Prometheus mission metrics derivation (no parallel store; scrape-time computation from registry)

---

This document is the authoritative protocol reference for the current streaming phase. Update it alongside any public contract changes and extend the JSON Schema + tests accordingly.
