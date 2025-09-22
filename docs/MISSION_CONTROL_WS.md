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

## Outbound Message Types

| Type                 | Origin | Notes                                                                                                                                                                                            |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `metrics_tick`       | Server | Includes `payload.p95`, `payload.p99`, `payload.tISO`                                                                                                                                            |
| `health_delta`       | Server | Includes `payload.status` and echo of health object                                                                                                                                              |
| `mission_update`     | Server | `payload.status` ∈ {planning_started,tasks_generated,planned,execution_started,execution_progress,completed,cancelled,error}; may include `tasksSummary`, `planningSession`, `progress`, `error` |
| `mission_stats`      | Server | Snapshot: `active`, `completed`, `cancelled`, `errors`, `avgDurationMs`, `snapshotId`                                                                                                            |
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

## Canonical Patterns Used

- Time & IDs via `createUnifiedTimestamp()` / `createUnifiedId()`
- Event-driven health via `unifiedMonitoringService` (no polling parallel system)
- Throttled metrics emission using monitoring events (`operation_metric`)

## Future Enhancements (Planned)

- `anomaly_alert` channel (statistical deviation detection)
- Backpressure / compression negotiation
- AuthZ integration for channels (multi-tenant scenarios)
- Structured latency bins / histogram export
- Prometheus mission metrics derivation (no parallel store; scrape-time computation from registry)

---

This document is the authoritative protocol reference for the current streaming phase. Update it alongside any public contract changes and extend the JSON Schema + tests accordingly.
