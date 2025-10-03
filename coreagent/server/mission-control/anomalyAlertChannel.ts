import { createUnifiedId, createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';
import { SERVER_NAME, SERVER_VERSION } from './constants';
import type { MissionControlChannel } from './types';
import { unifiedMonitoringService } from '../../monitoring/UnifiedMonitoringService';
import { getMissionStatsSnapshot } from './missionRegistry';

/**
 * anomaly_alert channel
 * Emits lightweight anomaly alerts derived from existing monitoring + mission stats without creating a parallel metrics store.
 * Categories: mission | performance | health | monitoring
 * Severity: info | warning | critical
 */
export function createAnomalyAlertChannel(): MissionControlChannel {
  return {
    name: 'anomaly_alert',
    onSubscribe: (ws, ctx) => {
      // Simple periodic evaluator – can be extended with adaptive thresholds.
      // Phase 3: Made async to support memory backend health checks
      const evaluate = async () => {
        try {
          const ts = createUnifiedTimestamp();
          const stats = getMissionStatsSnapshot();
          // Example heuristic anomalies (placeholder – low risk, transparent rules):
          const alerts: Array<{
            category: 'mission' | 'performance' | 'health' | 'monitoring';
            severity: 'info' | 'warning' | 'critical';
            message: string;
            details?: Record<string, unknown>;
            metric?: string;
            value?: number;
            threshold?: number;
          }> = [];

          // Mission backlog pressure: high active missions
          if (stats.active > 10) {
            alerts.push({
              category: 'mission',
              severity: stats.active > 25 ? 'critical' : 'warning',
              message: `High active mission count: ${stats.active}`,
              metric: 'missions.active',
              value: stats.active,
              threshold: 10,
              details: {
                active: stats.active,
                completed: stats.completed,
                cancelled: stats.cancelled,
                errors: stats.errors,
                total: stats.total,
                avgDurationMs: stats.avgDurationMs,
              },
            });
          }
          // Error ratio warning
          const totalTerminated = stats.completed + stats.cancelled + stats.errors;
          if (totalTerminated >= 5) {
            const errorRate = stats.errors / Math.max(totalTerminated, 1);
            if (errorRate > 0.3) {
              alerts.push({
                category: 'mission',
                severity: errorRate > 0.5 ? 'critical' : 'warning',
                message: `Elevated mission error rate ${(errorRate * 100).toFixed(1)}%`,
                metric: 'missions.error_rate',
                value: Number((errorRate * 100).toFixed(2)),
                threshold: 30,
                details: {
                  totalTerminated,
                  active: stats.active,
                  completed: stats.completed,
                  cancelled: stats.cancelled,
                  errors: stats.errors,
                  avgDurationMs: stats.avgDurationMs,
                },
              });
            }
          }

          // Memory backend health anomaly (Phase 3: v4.4.2)
          const latestHealth = await ctx.getHealth();
          const memHealth = (latestHealth.components as Record<string, unknown> | undefined)
            ?.memoryService as
            | {
                status?: string;
                responseTime?: number;
                lastCheck?: string;
                details?: { backend?: string; error?: string; capabilitiesCount?: number };
              }
            | undefined;

          if (memHealth?.status === 'unhealthy') {
            alerts.push({
              category: 'health',
              severity: 'critical',
              message: 'Memory backend unreachable or unhealthy',
              metric: 'memory_backend_status',
              value: 0,
              threshold: 1,
              details: {
                backend: memHealth.details?.backend,
                error: memHealth.details?.error,
                lastChecked: memHealth.lastCheck,
                responseTime: memHealth.responseTime,
              },
            });
          }

          if (memHealth?.responseTime && memHealth.responseTime > 1000) {
            alerts.push({
              category: 'health',
              severity: 'warning',
              message: `Memory backend latency high: ${memHealth.responseTime}ms`,
              metric: 'memory_backend_latency',
              value: memHealth.responseTime,
              threshold: 1000,
              details: {
                backend: memHealth.details?.backend,
                capabilities: memHealth.details?.capabilitiesCount,
              },
            });
          }

          for (const a of alerts) {
            ctx.send(ws, {
              type: 'anomaly_alert',
              id: createUnifiedId('system', 'anomaly'),
              timestamp: ts.iso,
              unix: ts.unix,
              server: { name: SERVER_NAME, version: SERVER_VERSION },
              payload: {
                category: a.category,
                severity: a.severity,
                message: a.message,
                details: a.details || null,
                metric: a.metric || null,
                value: typeof a.value === 'number' ? a.value : null,
                threshold: typeof a.threshold === 'number' ? a.threshold : null,
              },
            });
            unifiedMonitoringService.trackOperation('AnomalyAlert', 'emit', 'success', {
              category: a.category,
              severity: a.severity,
              metric: a.metric,
            });
          }
        } catch (err) {
          unifiedMonitoringService.trackOperation('AnomalyAlert', 'emit', 'error', {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      };
      void evaluate(); // Initial evaluation (async)
      const intervalRef = setInterval(
        () => void evaluate(), // Periodic evaluations (async)
        Number(process.env.ONEAGENT_ANOMALY_ALERT_INTERVAL_MS || 15000),
      );
      ctx.connectionState.set(ws, {
        ...(ctx.connectionState.get(ws) || {}),
        anomalyAlertInterval: intervalRef,
      });
    },
    onUnsubscribe: (ws, ctx) => {
      const state = ctx.connectionState.get(ws);
      const intv = state?.anomalyAlertInterval as NodeJS.Timeout | undefined;
      if (intv) clearInterval(intv);
      if (state?.anomalyAlertInterval) delete state.anomalyAlertInterval;
    },
    disposeConnection: (ws, ctx) => {
      const state = ctx.connectionState.get(ws);
      const intv = state?.anomalyAlertInterval as NodeJS.Timeout | undefined;
      if (intv) clearInterval(intv);
    },
  };
}
