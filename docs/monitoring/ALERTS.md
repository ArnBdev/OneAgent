# OneAgent Baseline Alert Pack (v4.1 Draft)

> Purpose: Provide an initial, opinionated set of Prometheus (or compatible) alerting rules aligned with roadmap SLO foundations. Refine post-histogram and taxonomy stabilization.

## 1. Principles

- Low Noise: Each alert must be actionable with clear runbook step.
- Fast MTTA: Favor early detection with short evaluation windows + sustained triggers.
- Cardinality Control: Use stable labels (component, operation, errorCode) only.
- Derivational: Alerts operate solely on canonical metrics (no ad-hoc exporters).

## 2. Core SLO Targets (Initial)

| Domain       | Indicator                         | Target             |
| ------------ | --------------------------------- | ------------------ |
| Latency      | p95 operation latency             | < 3000ms (initial) |
| Latency      | p99 operation latency             | < 5000ms           |
| Errors       | Operation error rate              | < 5% sustained     |
| Availability | Scrape success (metrics endpoint) | 99%                |

## 3. Example Prometheus Rules

```yaml
# High p95 latency sustained 5m
- alert: OneAgentHighP95Latency
  expr: oneagent_operation_latency_p95_ms > 3000
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: 'High p95 latency for an operation'
    description: 'Operation p95 above 3000ms for >5m. Investigate dependency latency or load.'

# Elevated error rate sustained 10m
- alert: OneAgentHighErrorRate
  expr: oneagent_operation_error_rate > 0.10
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: 'High error rate'
    description: 'Error rate >10% for >10m. Check recent deploys and upstream availability.'

# Critical error budget burn (short window spike)
- alert: OneAgentCriticalErrorSpike
  expr: increase(oneagent_operation_errors_total[5m]) / increase(oneagent_operation_component_total[5m]) > 0.25
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: 'Critical error spike'
    description: '>25% errors over last 5m window. Immediate triage required.'

# Missing metrics (possible outage)
- alert: OneAgentMetricsStale
  expr: time() - oneagent_build_info > 300
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: 'Metrics stale'
    description: 'No fresh scrape of build info metric in 5+ minutes. Check service health.'

# Specific error code surge (validation issues)
- alert: OneAgentValidationErrorSurge
  expr: increase(oneagent_operation_errors_total{errorCode="validation"}[10m]) > 100
  for: 0m
  labels:
    severity: warning
  annotations:
    summary: 'Validation error surge'
    description: ' >100 validation errors in 10m. Potential API contract or client misuse.'
```

## 4. Runbook Starters

| Alert                | First Checks                      | Deep Dive                               |
| -------------------- | --------------------------------- | --------------------------------------- |
| HighP95Latency       | Identify top offenders (sort p95) | Dependency trace, GC pauses, saturation |
| HighErrorRate        | Inspect errorCode distribution    | Recent deploy diff, upstream health     |
| MetricsStale         | Service up? network?              | Process logs, resource limits           |
| ValidationErrorSurge | Contract changes? payload samples | Schema validation logic regression      |

## 5. Future Additions

- Burn Rate Alerts (multi-window fast+slow burn detection)
- Anomaly-based Latency Spikes (statistical baseline)
- SLO Budget Exhaustion Prediction (projected depletion)
- Tail Latency Degradation (p99 delta vs 24h baseline)

## 6. Change Control

All new alerts require:

1. Defined runbook step.
2. Evidence it caught an issue in staging or simulation OR clear risk hypothesis.
3. Review for label cardinality impact.

---

Maintainer: Monitoring Lead (OneAgent)
Status: Draft until v4.1 release.
