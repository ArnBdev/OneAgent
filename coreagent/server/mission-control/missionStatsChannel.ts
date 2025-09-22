import { createUnifiedId, createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';
import { SERVER_NAME, SERVER_VERSION } from './constants';
import type { MissionControlChannel } from './types';
import { unifiedMonitoringService } from '../../monitoring/UnifiedMonitoringService';
import { getMissionStatsSnapshot } from './missionRegistry';

// Aggregates mission metrics periodically; lightweight snapshot channel.
export function createMissionStatsChannel(): MissionControlChannel {
  return {
    name: 'mission_stats',
    onSubscribe: (ws, ctx) => {
      const emit = () => {
        try {
          const ts = createUnifiedTimestamp();
          // Use registry snapshot (authoritative ephemeral aggregate)
          const { active, completed, cancelled, errors, avgDurationMs } = getMissionStatsSnapshot();
          ctx.send(ws, {
            type: 'mission_stats',
            id: createUnifiedId('system', 'stats'),
            timestamp: ts.iso,
            unix: ts.unix,
            server: { name: SERVER_NAME, version: SERVER_VERSION },
            payload: {
              snapshotId: createUnifiedId('operation', 'mission-stats-snapshot'),
              active,
              completed,
              cancelled,
              errors,
              avgDurationMs,
            },
          });
          unifiedMonitoringService.trackOperation('MissionStats', 'emit', 'success', {
            active,
            completed,
          });
        } catch {
          /* ignore */
        }
      };
      emit();
      const intervalRef = setInterval(
        emit,
        Number(process.env.ONEAGENT_MISSION_STATS_INTERVAL_MS || 10000),
      );
      ctx.connectionState.set(ws, {
        ...(ctx.connectionState.get(ws) || {}),
        missionStatsInterval: intervalRef,
      });
    },
    onUnsubscribe: (ws, ctx) => {
      const state = ctx.connectionState.get(ws);
      const intv = state?.missionStatsInterval as NodeJS.Timeout | undefined;
      if (intv) clearInterval(intv);
      if (state?.missionStatsInterval) delete state.missionStatsInterval;
    },
    disposeConnection: (ws, ctx) => {
      const state = ctx.connectionState.get(ws);
      const intv = state?.missionStatsInterval as NodeJS.Timeout | undefined;
      if (intv) clearInterval(intv);
    },
  };
}
