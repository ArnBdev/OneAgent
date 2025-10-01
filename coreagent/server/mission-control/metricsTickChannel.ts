import { unifiedMonitoringService } from '../../monitoring/UnifiedMonitoringService';
import { createUnifiedId, createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';
import { SERVER_NAME, SERVER_VERSION } from './constants';
import type { MissionControlChannel } from './types';

export function createMetricsTickChannel(): MissionControlChannel {
  return {
    name: 'metrics_tick',
    onSubscribe: (ws, ctx) => {
      let lastSent = 0;
      const minInterval = Number(process.env.ONEAGENT_METRICS_TICK_MIN_INTERVAL_MS || 2500);
      const handler = (ev: unknown) => {
        try {
          const event = ev as { type?: string };
          if (event?.type !== 'operation_metric') return;
          const now = createUnifiedTimestamp().unix;
          if (now - lastSent < minInterval) return;
          lastSent = now;
          unifiedMonitoringService.getGlobalPerformanceReport().then((report) => {
            const ts = createUnifiedTimestamp();
            ctx.send(ws, {
              type: 'metrics_tick',
              id: createUnifiedId('system', 'metrics_tick'),
              timestamp: ts.iso,
              unix: ts.unix,
              server: { name: SERVER_NAME, version: SERVER_VERSION },
              payload: {
                tISO: ts.iso,
                p95: report.p95Latency,
                p99: report.p99Latency,
              },
            });
          });
        } catch {
          /* ignore */
        }
      };
      unifiedMonitoringService.on('monitoring_event', handler);
      ctx.connectionState.set(ws, {
        ...(ctx.connectionState.get(ws) || {}),
        metricsHandler: handler,
      });
    },
    onUnsubscribe: (ws, ctx) => {
      const state = ctx.connectionState.get(ws);
      if (state?.metricsHandler) {
        unifiedMonitoringService.off(
          'monitoring_event',
          state.metricsHandler as (ev: unknown) => void,
        );
        delete state.metricsHandler;
      }
    },
    disposeConnection: (ws, ctx) => {
      const state = ctx.connectionState.get(ws);
      if (state?.metricsHandler) {
        unifiedMonitoringService.off(
          'monitoring_event',
          state.metricsHandler as (ev: unknown) => void,
        );
      }
    },
  };
}
