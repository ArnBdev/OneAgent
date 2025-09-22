import { unifiedMonitoringService } from '../../monitoring/UnifiedMonitoringService';
import { createUnifiedId, createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';
import { SERVER_NAME, SERVER_VERSION } from './constants';
import type { MissionControlChannel } from './types';

export function createHealthDeltaChannel(): MissionControlChannel {
  return {
    name: 'health_delta',
    onSubscribe: (ws, ctx) => {
      let last: string | undefined;
      const emitStatus = async (explicit?: string) => {
        try {
          const health = await ctx.getHealth();
          const status = explicit || health?.overall?.status || 'unknown';
          if (status !== last) {
            const ts = createUnifiedTimestamp();
            ctx.send(ws, {
              type: 'health_delta',
              id: createUnifiedId('system', 'health_delta'),
              timestamp: ts.iso,
              unix: ts.unix,
              server: { name: SERVER_NAME, version: SERVER_VERSION },
              payload: { status, health },
            });
            last = status;
          }
        } catch {
          /* ignore */
        }
      };
      void emitStatus();
      const criticalHandler = () => emitStatus('critical');
      const degradedHandler = () => emitStatus('degraded');
      const recoveryHandler = () => emitStatus('healthy');
      unifiedMonitoringService.on('health_critical', criticalHandler);
      unifiedMonitoringService.on('health_degraded', degradedHandler);
      unifiedMonitoringService.on('system_recovery', recoveryHandler);
      ctx.connectionState.set(ws, {
        ...(ctx.connectionState.get(ws) || {}),
        healthHandlers: { criticalHandler, degradedHandler, recoveryHandler },
      });
    },
    onUnsubscribe: (ws, ctx) => {
      const state = ctx.connectionState.get(ws);
      const handlers = state?.healthHandlers as
        | { criticalHandler: () => void; degradedHandler: () => void; recoveryHandler: () => void }
        | undefined;
      if (handlers) {
        unifiedMonitoringService.off('health_critical', handlers.criticalHandler);
        unifiedMonitoringService.off('health_degraded', handlers.degradedHandler);
        unifiedMonitoringService.off('system_recovery', handlers.recoveryHandler);
        delete (state as Record<string, unknown>).healthHandlers;
      }
    },
    disposeConnection: (ws, ctx) => {
      const state = ctx.connectionState.get(ws);
      const handlers = state?.healthHandlers as
        | { criticalHandler: () => void; degradedHandler: () => void; recoveryHandler: () => void }
        | undefined;
      if (handlers) {
        unifiedMonitoringService.off('health_critical', handlers.criticalHandler);
        unifiedMonitoringService.off('health_degraded', handlers.degradedHandler);
        unifiedMonitoringService.off('system_recovery', handlers.recoveryHandler);
      }
    },
  };
}
