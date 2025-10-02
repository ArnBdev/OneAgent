# OneAgent Health Check Endpoints - Quick Reference

**Version**: 4.4.0  
**Date**: October 2, 2025

## Endpoints

### Liveness Probe: `/health`

**Purpose**: Verify server process is alive  
**Method**: GET  
**URL**: `http://localhost:8010/health`

**Response (200 OK)**:

```json
{
  "status": "healthy",
  "service": "oneagent-memory-server",
  "backend": "mem0+FastMCP",
  "version": "4.4.0",
  "protocol": "MCP HTTP JSON-RPC 2.0"
}
```

**curl Example**:

```bash
curl http://localhost:8010/health
```

---

### Readiness Probe: `/health/ready`

**Purpose**: Verify server can handle production traffic  
**Method**: GET  
**URL**: `http://localhost:8010/health/ready`

**Response (200 OK - Ready)**:

```json
{
  "ready": true,
  "checks": {
    "mcp_initialized": true,
    "tools_available": true,
    "resources_available": true,
    "tool_count": 5,
    "resource_count": 2
  },
  "service": "oneagent-memory-server",
  "version": "4.4.0"
}
```

**Response (503 Service Unavailable - Not Ready)**:

```json
{
  "ready": false,
  "checks": {
    "mcp_initialized": true,
    "tools_available": false,
    "resources_available": false,
    "tool_count": 0,
    "resource_count": 0
  },
  "service": "oneagent-memory-server",
  "version": "4.4.0"
}
```

**curl Example**:

```bash
curl http://localhost:8010/health/ready
```

---

## Kubernetes Configuration

### Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8010
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3
```

### Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8010
  initialDelaySeconds: 15
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

---

## Docker Compose Health Check

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:8010/health/ready']
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 40s
```

---

## Common Use Cases

### 1. Smoke Test Validation

```bash
# Wait for server startup
while ! curl -sf http://localhost:8010/health/ready > /dev/null; do
  echo "Waiting for server..."
  sleep 1
done
echo "Server ready!"
```

### 2. Load Balancer Health Check

- **Path**: `/health/ready`
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy Threshold**: 2 consecutive successes
- **Unhealthy Threshold**: 3 consecutive failures

### 3. Production Monitoring

```bash
# Check server health
STATUS=$(curl -s http://localhost:8010/health | jq -r '.status')
if [ "$STATUS" != "healthy" ]; then
  echo "ALERT: Server unhealthy!"
  # Trigger alert/notification
fi

# Check readiness with details
READY=$(curl -s http://localhost:8010/health/ready | jq -r '.ready')
if [ "$READY" != "true" ]; then
  echo "WARNING: Server not ready for traffic"
  curl -s http://localhost:8010/health/ready | jq '.checks'
fi
```

### 4. CI/CD Pipeline Integration

```yaml
steps:
  - name: Start OneAgent
    run: ./scripts/start-oneagent-system.ps1 &

  - name: Wait for readiness
    run: |
      timeout 60 sh -c 'until curl -sf http://localhost:8010/health/ready; do sleep 2; done'

  - name: Run integration tests
    run: npm run test:integration
```

---

## Response Time Benchmarks

| Endpoint        | Typical Response Time | Purpose               |
| --------------- | --------------------- | --------------------- |
| `/health`       | < 50ms                | Quick liveness check  |
| `/health/ready` | < 100ms               | Dependency validation |

---

## Status Codes

| Code                    | Meaning            | Action                     |
| ----------------------- | ------------------ | -------------------------- |
| 200 OK                  | Healthy/Ready      | Route traffic normally     |
| 503 Service Unavailable | Not ready          | Wait, do not route traffic |
| Connection refused      | Server not running | Start server               |
| Timeout                 | Server overloaded  | Investigate performance    |

---

## Validation Checks (`/health/ready`)

| Check                 | Description              | Failure Impact                |
| --------------------- | ------------------------ | ----------------------------- |
| `mcp_initialized`     | FastMCP server running   | Cannot handle any requests    |
| `tools_available`     | MCP tools registered     | Memory operations unavailable |
| `resources_available` | MCP resources registered | Capabilities not exposed      |

---

## Quick Troubleshooting

### Problem: `/health` returns connection refused

**Solution**: Server not running. Start with:

```bash
python servers/mem0_fastmcp_server.py
```

### Problem: `/health/ready` returns 503

**Solution**: Dependencies not initialized. Check:

```bash
curl -s http://localhost:8010/health/ready | jq '.checks'
```

Look for `false` values and investigate root cause.

### Problem: Slow response times (> 1s)

**Solution**: Server overloaded. Check:

- CPU/memory usage
- Database connection pool
- Network latency
- Concurrent request count

### Problem: Intermittent 503 responses

**Solution**: Flapping health checks. Add stability:

```yaml
readinessProbe:
  successThreshold: 2 # Require 2 consecutive successes
  failureThreshold: 3 # Allow 3 consecutive failures
```

---

## See Also

- [Memory System Architecture](../memory-system-architecture.md)
- [Health Check Implementation Report](./HEALTH_CHECK_ENDPOINTS_IMPLEMENTATION_2025-10-02.md)
- [FastMCP Documentation](https://gofastmcp.com/deployment/self-hosted)
- [Kubernetes Health Checks](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

---

**OneAgent v4.4.0**  
_Production-Grade Health Monitoring_
