# OneAgent Monitoring & Health Endpoints

## Overview

OneAgent exposes canonical endpoints for production monitoring and health checks:

- **/metrics**: Prometheus-compatible metrics (text/plain)
- **/health**: System and memory health (JSON)

---

## /metrics (Prometheus)

- **Path**: `/metrics` (aliases `/api/v1/metrics/prometheus`)
- **Format**: Prometheus exposition (text/plain)
- **Includes**:
  - Latency (avg, p50, p95, p99, max)
  - Mission stats (active, completed, error, error rate)
  - SLO targets and error budget
  - Orchestrator and system metrics
- **Performance**: In-memory, negligible overhead at normal scrape intervals (15–60s)

### Example Prometheus Scrape Config

```yaml
scrape_configs:
  - job_name: 'oneagent'
    static_configs:
      - targets: ['localhost:8083']
    metrics_path: /metrics
    scrape_interval: 30s
```

---

## /health (System Health)

- **Path**: `/health`
- **Format**: JSON
- **Includes**:
  - Overall status: healthy, degraded, unhealthy, critical
  - Component health: registry, agents, orchestrator, API, memoryService
  - Memory backend health: status, latency, capabilities
  - Performance: CPU, memory, throughput, resource usage
  - Compliance, privacy, constitutional AI checks
  - Predictive alerts
- **Usage**: For liveness/readiness probes, dashboards, and alerting

### Example Output

```json
{
  "status": "healthy",
  "server": "OneAgent - Unified MCP Server",
  "version": "4.4.0",
  "initialized": true,
  "timestamp": "2025-10-04T14:00:00.000Z",
  "health": {
    "overall": { "status": "healthy", "score": 100 },
    "components": {
      "memoryService": {
        "status": "healthy",
        "responseTime": 42,
        "details": { "backend": "mem0+FastMCP", "healthy": true, ... }
      },
      ...
    },
    ...
  },
  "metrics": { ... }
}
```

---

## Operational Notes

- **No persistent logs or data growth**: Metrics and health are in-memory only.
- **Performance**: No measurable impact unless scraped at very high frequency.
- **Retention**: Metrics/health history is configurable (default: 5–60 min in memory).
- **Best Practice**: Use `/metrics` for Prometheus, `/health` for probes/dashboards.

---

## References

- See `coreagent/monitoring/HealthMonitoringService.ts` and `coreagent/api/metricsAPI.ts` for implementation details.
- For advanced monitoring, tune retention and alert thresholds in environment variables.
