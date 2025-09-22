/**
 * Metrics API - exposes recent operational metric logs for UI dashboard.
 * GET /api/v1/metrics/latest -> { success, data: MetricLog[] }
 */
import { Router, Request, Response } from 'express';
import { createUnifiedTimestamp, getUnifiedErrorHandler } from '../utils/UnifiedBackboneService';
import { metricsService } from '../services/MetricsService';
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';
import { HybridAgentOrchestrator } from '../agents/orchestration/HybridAgentOrchestrator';
import { getErrorCodeLabel } from '../monitoring/errorTaxonomy';
import { COMM_OPERATION } from '../types/communication-constants';
import { sloService } from '../monitoring/SLOService';
import pkg from '../../package.json';

export function createMetricsRouter(): Router {
  const router = Router();
  const errorHandler = getUnifiedErrorHandler();
  const component = 'MetricsAPI';

  router.get('/api/v1/metrics/latest', async (req: Request, res: Response) => {
    const ts = createUnifiedTimestamp();
    try {
      const countParam = req.query.count as string | undefined;
      const count = Math.min(10, Math.max(1, countParam ? parseInt(countParam, 10) : 5));
      const logs = metricsService.getRecent(count);
      res.json({ success: true, data: logs, timestamp: ts.utc });
    } catch (error) {
      const entry = await errorHandler.handleError(error as Error, {
        component,
        operation: 'get_latest_metrics',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: ts.utc,
      });
    }
  });

  // High-level summary (recent stats + derived operation metrics)
  router.get('/api/v1/metrics/summary', async (req: Request, res: Response) => {
    const ts = createUnifiedTimestamp();
    try {
      const stats = metricsService.getStats();
      const opSummary = unifiedMonitoringService.summarizeOperationMetrics({
        window: 5 * 60 * 1000,
      });
      res.json({ success: true, data: { stats, opSummary }, timestamp: ts.utc });
    } catch (error) {
      const entry = await errorHandler.handleError(error as Error, {
        component,
        operation: 'metrics_summary',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to compute metrics summary',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: ts.utc,
      });
    }
  });

  // Minimal Prometheus-style exposition (no external dependency, text/plain)
  router.get('/api/v1/metrics/prometheus', async (req: Request, res: Response) => {
    try {
      // Escape helper declared once per handler
      const esc = (v: string) => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const stats = metricsService.getStats();
      const windowMs = Math.min(
        60 * 60 * 1000,
        Math.max(60 * 1000, parseInt(String(req.query.windowMs || '300000'), 10) || 300000),
      );
      const opSummary = unifiedMonitoringService.summarizeOperationMetrics({ window: windowMs });
      const lines: string[] = [];
      lines.push('# HELP oneagent_metrics_recent_total Number of recent metric logs retained');
      lines.push('# TYPE oneagent_metrics_recent_total gauge');
      lines.push(`oneagent_metrics_recent_total ${stats.total}`);
      // Build info metric
      lines.push('# HELP oneagent_build_info Build / version information (value always 1)');
      lines.push('# TYPE oneagent_build_info gauge');
      lines.push(`oneagent_build_info{version="${pkg.version}"} 1`);
      if (stats.latency) {
        lines.push(
          '# HELP oneagent_metrics_latency_average_ms Average latency (ms) across recent logs',
        );
        lines.push('# TYPE oneagent_metrics_latency_average_ms gauge');
        lines.push(`oneagent_metrics_latency_average_ms ${stats.latency.average}`);
        lines.push('# HELP oneagent_metrics_latency_max_ms Max latency (ms) across recent logs');
        lines.push('# TYPE oneagent_metrics_latency_max_ms gauge');
        lines.push(`oneagent_metrics_latency_max_ms ${stats.latency.max}`);
        lines.push(
          '# HELP oneagent_metrics_latency_p50_ms 50th percentile latency (ms) across recent logs',
        );
        lines.push('# TYPE oneagent_metrics_latency_p50_ms gauge');
        lines.push(`oneagent_metrics_latency_p50_ms ${stats.latency.p50}`);
        lines.push(
          '# HELP oneagent_metrics_latency_p95_ms 95th percentile latency (ms) across recent logs',
        );
        lines.push('# TYPE oneagent_metrics_latency_p95_ms gauge');
        lines.push(`oneagent_metrics_latency_p95_ms ${stats.latency.p95}`);
        lines.push(
          '# HELP oneagent_metrics_latency_p99_ms 99th percentile latency (ms) across recent logs',
        );
        lines.push('# TYPE oneagent_metrics_latency_p99_ms gauge');
        lines.push(`oneagent_metrics_latency_p99_ms ${stats.latency.p99}`);
      }
      // SLO targets exposition (static gauges per operation objective) + derived error budget burn
      try {
        if (!sloService.getConfig()) sloService.load();
        const cfg = sloService.getConfig();
        if (cfg) {
          lines.push(
            '# HELP oneagent_slo_target_latency_ms SLO target latency (ms) per operation (p95)',
          );
          lines.push('# TYPE oneagent_slo_target_latency_ms gauge');
          lines.push(
            '# HELP oneagent_slo_target_error_rate SLO target error rate (0-1) per operation',
          );
          lines.push('# TYPE oneagent_slo_target_error_rate gauge');
          lines.push(
            '# HELP oneagent_slo_error_budget_burn Current error budget burn ratio (observed_error_rate / target_error_rate) per operation',
          );
          lines.push('# TYPE oneagent_slo_error_budget_burn gauge');
          lines.push(
            '# HELP oneagent_slo_error_budget_remaining Remaining error budget (1 - burn ratio, clamped to 0) per operation',
          );
          lines.push('# TYPE oneagent_slo_error_budget_remaining gauge');

          // Build aggregated observed error rates per operation across all components (single source of truth: opSummary)
          const observedErrorByOp: Record<string, { error: number; total: number }> = {};
          Object.values(opSummary.components).forEach((comp) => {
            Object.entries(comp.operations).forEach(([operation, rec]) => {
              if (!observedErrorByOp[operation])
                observedErrorByOp[operation] = { error: 0, total: 0 };
              observedErrorByOp[operation].error += rec.error;
              observedErrorByOp[operation].total += rec.total;
            });
          });

          for (const svc of cfg.services) {
            for (const obj of svc.objectives) {
              const opEsc = esc(obj.operation);
              if (obj.target.p95LatencyMs !== undefined) {
                lines.push(
                  `oneagent_slo_target_latency_ms{operation="${opEsc}"} ${obj.target.p95LatencyMs}`,
                );
              }
              if (obj.target.errorRate !== undefined) {
                lines.push(
                  `oneagent_slo_target_error_rate{operation="${opEsc}"} ${obj.target.errorRate}`,
                );
                // Derive burn + remaining if we have observed data
                const observed = observedErrorByOp[obj.operation];
                if (observed && observed.total > 0 && obj.target.errorRate > 0) {
                  const observedRate = observed.error / observed.total;
                  const burn = observedRate / obj.target.errorRate; // can exceed 1
                  const remaining = Math.max(0, 1 - burn);
                  lines.push(
                    `oneagent_slo_error_budget_burn{operation="${opEsc}"} ${burn.toFixed(4)}`,
                  );
                  lines.push(
                    `oneagent_slo_error_budget_remaining{operation="${opEsc}"} ${remaining.toFixed(4)}`,
                  );
                }
              }
            }
          }
        }
      } catch {
        // ignore SLO load errors in metrics path
      }

      // Orchestrator metrics (lightweight gauges/counters)
      try {
        const orch = await HybridAgentOrchestrator.getInstance().getOrchestrationMetrics();
        lines.push(
          '# HELP oneagent_orchestrator_operations_total Total orchestrator operations observed',
        );
        lines.push('# TYPE oneagent_orchestrator_operations_total counter');
        lines.push(`oneagent_orchestrator_operations_total ${orch.totalOperations}`);
        lines.push(
          '# HELP oneagent_orchestrator_success_rate_percent Orchestrator success rate percent',
        );
        lines.push('# TYPE oneagent_orchestrator_success_rate_percent gauge');
        lines.push(`oneagent_orchestrator_success_rate_percent ${orch.successRate}`);
        if (orch.agentUtilization) {
          lines.push(
            '# HELP oneagent_orchestrator_agent_utilization_total Count of orchestrator interactions per agent',
          );
          lines.push('# TYPE oneagent_orchestrator_agent_utilization_total counter');
          for (const [agent, countVal] of Object.entries(orch.agentUtilization)) {
            lines.push(
              `oneagent_orchestrator_agent_utilization_total{agent="${esc(agent)}"} ${countVal}`,
            );
          }
        }
      } catch {
        // omit orchestrator metrics on failure
      }

      // Histogram exposition (bucket counts per operation) from canonical PerformanceMonitor
      lines.push('# HELP oneagent_operation_latency_histogram Operation latency histogram buckets');
      lines.push('# TYPE oneagent_operation_latency_histogram histogram');
      for (const op of Object.values(COMM_OPERATION)) {
        try {
          const detail = await unifiedMonitoringService.getDetailedOperationMetrics(op);
          const perf = (
            unifiedMonitoringService as unknown as {
              performanceMonitor?: {
                getHistogram?: (o: string) => Record<string, number> | undefined;
              };
            }
          ).performanceMonitor;
          const hist = perf?.getHistogram ? perf.getHistogram(op) : undefined;
          if (hist && detail) {
            let cumulative = 0;
            const bucketBounds: Array<[string, number]> = [
              ['lt_10', 10],
              ['10_50', 50],
              ['50_100', 100],
              ['100_500', 500],
              ['500_1000', 1000],
            ];
            for (const [key, le] of bucketBounds) {
              cumulative += hist[key] || 0;
              lines.push(
                `oneagent_operation_latency_histogram_bucket{operation="${esc(op)}",le="${le}"} ${cumulative}`,
              );
            }
            cumulative += hist.gte_1000 || 0;
            lines.push(
              `oneagent_operation_latency_histogram_bucket{operation="${esc(op)}",le="+Inf"} ${cumulative}`,
            );
            lines.push(
              `oneagent_operation_latency_histogram_sum{operation="${esc(op)}"} ${(detail.avgLatency * detail.count).toFixed(2)}`,
            );
            lines.push(
              `oneagent_operation_latency_histogram_count{operation="${esc(op)}"} ${detail.count}`,
            );
          }
        } catch {
          // skip missing op metrics
        }
      }
      lines.push('# HELP oneagent_operation_total Total operations observed in window');
      lines.push('# TYPE oneagent_operation_total counter');
      lines.push(`oneagent_operation_total ${opSummary.totalOperations}`);
      lines.push(
        '# HELP oneagent_operation_component_total Operations per component/operation (success/error counts)',
      );
      lines.push('# TYPE oneagent_operation_component_total counter');
      // esc already declared above
      lines.push('# HELP oneagent_operation_error_rate Error rate per component/operation');
      lines.push('# TYPE oneagent_operation_error_rate gauge');
      Object.entries(opSummary.components).forEach(([comp, compData]) => {
        Object.entries(compData.operations).forEach(([op, rec]) => {
          lines.push(
            `oneagent_operation_component_total{component="${esc(comp)}",operation="${esc(op)}",status="success"} ${rec.success}`,
          );
          lines.push(
            `oneagent_operation_component_total{component="${esc(comp)}",operation="${esc(op)}",status="error"} ${rec.error}`,
          );
          lines.push(
            `oneagent_operation_error_rate{component="${esc(comp)}",operation="${esc(op)}"} ${rec.errorRate}`,
          );
        });
      });
      const latencyValues = stats.total
        ? metricsService.getRecent(Math.min(stats.total, 100)).map((l) => l.latencyMs)
        : [];
      const buckets = [50, 100, 250, 500, 1000, 2000, 5000];
      const counts: number[] = buckets.map((b) => latencyValues.filter((v) => v <= b).length);
      const sum = latencyValues.reduce((a, b) => a + b, 0);
      const count = latencyValues.length;
      lines.push(
        '# HELP oneagent_memory_search_latency_ms Latency histogram for memory_search (recent logs)',
      );
      lines.push('# TYPE oneagent_memory_search_latency_ms histogram');
      buckets.forEach((b, idx) => {
        lines.push(`oneagent_memory_search_latency_ms_bucket{le="${b}"} ${counts[idx]}`);
      });
      lines.push(`oneagent_memory_search_latency_ms_bucket{le="+Inf"} ${count}`);
      lines.push(`oneagent_memory_search_latency_ms_sum ${sum}`);
      lines.push(`oneagent_memory_search_latency_ms_count ${count}`);

      // Communication operation latency gauges (avg, p95, p99) for canonical COMM_OPERATION set (parallelized)
      const commOps = Object.values(COMM_OPERATION);
      // Extend latency gauge coverage with additional recorded operations that are explicitly allowlisted.
      // Current allowlist: TaskDelegation.execute (execution latency ingestion path) – avoids metric cardinality explosion.
      let extendedOps: string[] = [];
      try {
        const perf = (
          unifiedMonitoringService as unknown as {
            performanceMonitor?: { getRecordedOperations?: () => string[] };
          }
        ).performanceMonitor;
        if (perf && typeof perf.getRecordedOperations === 'function') {
          const recorded = perf.getRecordedOperations();
          // allowlist filter
          extendedOps = recorded.filter((op) => op === 'execute');
        }
      } catch {
        // ignore extension failures
      }
      const allOps = [...new Set([...commOps, ...extendedOps])];
      if (allOps.length) {
        lines.push('# HELP oneagent_operation_latency_avg_ms Average latency per operation (ms)');
        lines.push('# TYPE oneagent_operation_latency_avg_ms gauge');
        lines.push(
          '# HELP oneagent_operation_latency_p95_ms 95th percentile latency per operation (ms)',
        );
        lines.push('# TYPE oneagent_operation_latency_p95_ms gauge');
        lines.push(
          '# HELP oneagent_operation_latency_p99_ms 99th percentile latency per operation (ms)',
        );
        lines.push('# TYPE oneagent_operation_latency_p99_ms gauge');
        const detailResults = await Promise.all(
          allOps.map(async (op) => {
            try {
              const d = await unifiedMonitoringService.getDetailedOperationMetrics(op);
              return { op, detail: d };
            } catch {
              return { op, detail: null };
            }
          }),
        );
        for (const { op, detail } of detailResults) {
          if (!detail) continue;
          lines.push(
            `oneagent_operation_latency_avg_ms{operation="${esc(op)}"} ${detail.avgLatency.toFixed(2)}`,
          );
          lines.push(`oneagent_operation_latency_p95_ms{operation="${esc(op)}"} ${detail.p95}`);
          lines.push(`oneagent_operation_latency_p99_ms{operation="${esc(op)}"} ${detail.p99}`);
        }
      }

      // Derive per-operation error counters with canonical taxonomy labels from recent monitoring events
      const recentEvents = unifiedMonitoringService.getRecentEvents(500);
      const errorEvents = recentEvents.filter(
        (e) =>
          (e.data.status === 'error' || e.severity === 'error' || e.severity === 'critical') &&
          (e.data.operation || e.data.op),
      );
      if (errorEvents.length) {
        lines.push(
          '# HELP oneagent_operation_errors_total Total error events per component/operation/errorCode',
        );
        lines.push('# TYPE oneagent_operation_errors_total counter');
        const errorAgg = new Map<string, number>();
        for (const ev of errorEvents) {
          const comp = esc(ev.component || 'unknown');
          const op = esc((ev.data.operation as string) || (ev.data.op as string) || 'unknown');
          // Prefer explicit errorCode field; otherwise derive via taxonomy mapping on available error/message
          const rawCandidate =
            (ev.data.errorCode as string) ||
            (ev.data.error as string) ||
            (ev.data.message as string) ||
            (ev as unknown as { message?: string })?.message ||
            'internal';
          const mapped = getErrorCodeLabel(rawCandidate);
          const code = esc(
            String(mapped)
              .toLowerCase()
              .replace(/[^a-z0-9_-]/g, '_'),
          );
          const key = `${comp}||${op}||${code}`;
          errorAgg.set(key, (errorAgg.get(key) || 0) + 1);
        }
        for (const [key, countVal] of errorAgg.entries()) {
          const [comp, op, code] = key.split('||');
          lines.push(
            `oneagent_operation_errors_total{component="${comp}",operation="${op}",errorCode="${code}"} ${countVal}`,
          );
        }
      }

      // Task Delegation status gauges (derived; single source = in-memory queue)
      try {
        const { taskDelegationService } = await import('../services/TaskDelegationService');
        const tasks = taskDelegationService.getAllTasks();
        if (tasks.length) {
          const statusCounts: Record<string, number> = {};
          for (const t of tasks) statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
          lines.push(
            '# HELP oneagent_task_delegation_status_total Current number of tasks per delegation status',
          );
          lines.push('# TYPE oneagent_task_delegation_status_total gauge');
          for (const [status, countVal] of Object.entries(statusCounts)) {
            lines.push(
              `oneagent_task_delegation_status_total{status="${esc(status)}"} ${countVal}`,
            );
          }
          // Backoff pending tasks (queued but not yet eligible)
          const nowUnix = Date.now();
          const inBackoff = tasks.filter(
            (t) => t.status === 'queued' && t.nextAttemptUnix && t.nextAttemptUnix > nowUnix,
          ).length;
          lines.push(
            '# HELP oneagent_task_delegation_backoff_pending Number of queued tasks currently waiting for backoff delay',
          );
          lines.push('# TYPE oneagent_task_delegation_backoff_pending gauge');
          lines.push(`oneagent_task_delegation_backoff_pending ${inBackoff}`);
        }
      } catch {
        // Ignore delegation import errors in metrics exposition path
      }
      res.setHeader('Content-Type', 'text/plain; version=0.0.4');
      res.send(lines.join('\n'));
    } catch (error) {
      res.status(500).send(`# oneagent metrics export failed: ${(error as Error).message}`);
    }
  });

  // JSON metrics endpoint for UI consumption (stable canonical shape, no parallel aggregation)
  router.get('/api/v1/metrics/json', async (_req: Request, res: Response) => {
    const ts = createUnifiedTimestamp();
    try {
      const stats = metricsService.getStats();
      const opSummary = unifiedMonitoringService.summarizeOperationMetrics({
        window: 5 * 60 * 1000,
      });
      if (!sloService.getConfig()) {
        try {
          sloService.load();
        } catch {
          /* ignore */
        }
      }
      const sloCfg = sloService.getConfig();
      const recentEvents = unifiedMonitoringService.getRecentEvents(100);
      // Transform error events with taxonomy mapping
      const errorEvents = recentEvents.filter(
        (e) =>
          (e.data.status === 'error' || e.severity === 'error' || e.severity === 'critical') &&
          (e.data.operation || e.data.op),
      );
      const errorCounts: Record<string, number> = {};
      for (const ev of errorEvents) {
        const comp = ev.component || 'unknown';
        const op = (ev.data.operation as string) || (ev.data.op as string) || 'unknown';
        const rawCandidate =
          (ev.data.errorCode as string) ||
          (ev.data.error as string) ||
          (ev.data.message as string) ||
          (ev as unknown as { message?: string })?.message ||
          'internal';
        const code = String(getErrorCodeLabel(rawCandidate));
        const key = `${comp}::${op}::${code}`;
        errorCounts[key] = (errorCounts[key] || 0) + 1;
      }
      const errors = Object.entries(errorCounts).map(([k, count]) => {
        const [component, operation, errorCode] = k.split('::');
        return { component, operation, errorCode, count };
      });
      // Compute error budget summaries (window aligned with opSummary window: 5m)
      const errorBudgets: Array<{
        operation: string;
        targetErrorRate: number;
        observedErrorRate: number;
        burnRate: number;
        remainingBudget: number;
        windowMs: number;
      }> = [];
      if (sloCfg) {
        // Aggregate observed error counts per operation across components
        const observedErrorByOp: Record<string, { error: number; total: number }> = {};
        Object.values(opSummary.components).forEach((comp) => {
          Object.entries(comp.operations).forEach(([operation, rec]) => {
            if (!observedErrorByOp[operation])
              observedErrorByOp[operation] = { error: 0, total: 0 };
            observedErrorByOp[operation].error += rec.error;
            observedErrorByOp[operation].total += rec.total;
          });
        });
        for (const svc of sloCfg.services) {
          for (const obj of svc.objectives) {
            if (obj.target.errorRate !== undefined && obj.target.errorRate > 0) {
              const observed = observedErrorByOp[obj.operation];
              if (observed && observed.total > 0) {
                const observedRate = observed.error / observed.total;
                const burnRate = observedRate / obj.target.errorRate;
                errorBudgets.push({
                  operation: obj.operation,
                  targetErrorRate: obj.target.errorRate,
                  observedErrorRate: parseFloat(observedRate.toFixed(6)),
                  burnRate: parseFloat(burnRate.toFixed(6)),
                  remainingBudget: parseFloat(Math.max(0, 1 - burnRate).toFixed(6)),
                  windowMs: 5 * 60 * 1000,
                });
              }
            }
          }
        }
      }

      // Orchestrator metrics (canonical, programmatic source). Avoid parallel instances: use singleton.
      let orchestratorMetrics: {
        totalOperations: number;
        successRate: number;
        agentUtilization: Record<string, number>;
        recentActivity: string[];
      } | null = null;
      try {
        orchestratorMetrics = await HybridAgentOrchestrator.getInstance().getOrchestrationMetrics();
      } catch {
        orchestratorMetrics = null;
      }

      res.json({
        success: true,
        timestamp: ts.utc,
        data: {
          stats,
          operations: opSummary,
          slos: sloCfg || null,
          errors,
          errorBudgets,
          orchestrator: orchestratorMetrics,
        },
      });
    } catch (error) {
      const entry = await errorHandler.handleError(error as Error, {
        component,
        operation: 'metrics_json',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to produce metrics JSON',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: ts.utc,
      });
    }
  });

  // Historical latency time series derived from canonical monitoring events (no parallel store)
  // GET /api/v1/metrics/latency-series?windowMs=300000&bucketMs=30000&operation=execute
  router.get('/api/v1/metrics/latency-series', async (req: Request, res: Response) => {
    const ts = createUnifiedTimestamp();
    try {
      const windowMs = Math.min(
        60 * 60 * 1000,
        Math.max(10_000, parseInt(String(req.query.windowMs || '300000'), 10) || 300000),
      );
      const bucketMs = Math.min(
        5 * 60 * 1000,
        Math.max(1000, parseInt(String(req.query.bucketMs || '30000'), 10) || 30000),
      );
      const operation = typeof req.query.operation === 'string' ? req.query.operation : undefined;
      const { buildLatencySeriesFromRecent } = await import('../monitoring/LatencySeries');
      const series = buildLatencySeriesFromRecent(windowMs, bucketMs, operation);
      res.json({ success: true, timestamp: ts.utc, data: series });
    } catch (error) {
      const entry = await errorHandler.handleError(error as Error, {
        component,
        operation: 'metrics_latency_series',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to compute latency series',
        errorDetails: {
          id: entry.id,
          type: entry.type,
          severity: entry.severity,
          message: entry.message,
          timestamp: entry.timestamp.utc,
        },
        timestamp: ts.utc,
      });
    }
  });
  return router;
}
