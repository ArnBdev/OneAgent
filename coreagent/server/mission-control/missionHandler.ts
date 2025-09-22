import { createUnifiedId, createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';
import { unifiedMonitoringService } from '../../monitoring/UnifiedMonitoringService';
import { SERVER_NAME, SERVER_VERSION } from './constants';
import { getErrorCodeLabel } from '../../monitoring/errorTaxonomy';
import type { ChannelContext } from './types';
import { ExecutionEngine } from './ExecutionEngine';
import { recordMissionStart, recordMissionStatus } from './missionRegistry';

export async function handleMissionStart(
  ws: import('ws').WebSocket,
  ctx: ChannelContext,
  rawCommand: string,
): Promise<{ missionId: string; cancel: () => void } | void> {
  const ts = createUnifiedTimestamp();
  const missionId = createUnifiedId('task', 'mission');
  ctx.send(ws, {
    type: 'mission_ack',
    id: createUnifiedId('system', 'mission_ack'),
    timestamp: ts.iso,
    unix: ts.unix,
    server: { name: SERVER_NAME, version: SERVER_VERSION },
    payload: { missionId, status: 'accepted' },
  });
  const missionStartTime = ts.unix;
  // Register mission start in registry
  recordMissionStart(missionId, missionStartTime);
  const engineRef: { missionId: string; cancel: () => void } = { missionId, cancel: () => void 0 };
  (async () => {
    let objective = rawCommand.trim();
    if (objective.startsWith('/mission')) {
      const rest = objective.slice('/mission'.length).trim();
      try {
        if (rest.startsWith('{')) {
          const parsed = JSON.parse(rest);
          if (typeof parsed.objective === 'string') objective = parsed.objective;
        } else if (rest.length > 0) {
          objective = rest;
        }
      } catch {
        /* ignore */
      }
    }
    try {
      unifiedMonitoringService.trackOperation('Mission', 'start', 'success', { missionId });
      // Phase: planning_started
      recordMissionStatus(missionId, 'planning_started');
      ctx.send(ws, {
        type: 'mission_update',
        id: createUnifiedId('system', 'mission_update'),
        timestamp: createUnifiedTimestamp().iso,
        unix: Date.now(),
        server: { name: SERVER_NAME, version: SERVER_VERSION },
        payload: { missionId, status: 'planning_started' },
      });
      const { PlannerAgent } = await import('../../agents/specialized/PlannerAgent');
      const planner = new PlannerAgent({
        id: 'planner-mc',
        name: 'PlannerAgent',
        description: 'Mission Control Planner',
        capabilities: ['planning', 'decomposition'],
        memoryEnabled: true,
        aiEnabled: true,
      });
      if (
        typeof (planner as unknown as { initialize?: () => Promise<void> }).initialize ===
        'function'
      ) {
        await (planner as unknown as { initialize: () => Promise<void> }).initialize();
      }
      const planningSession = await (
        planner as unknown as { createPlanningSession: (c: unknown) => Promise<unknown> }
      ).createPlanningSession({
        projectId: 'mission-control',
        objective,
        constraints: [],
        resources: [],
        timeframe: 'unspecified',
        stakeholders: [],
        riskTolerance: 'medium',
        qualityRequirements: [],
        successCriteria: [],
        constitutionalRequirements: [],
      });
      unifiedMonitoringService.trackOperation('Mission', 'plan_create', 'success', {
        missionId,
        hasPlan: !!planningSession,
      });
      type PlanningSessionLike = { tasks?: unknown[] } & Record<string, unknown>;
      const ps = planningSession as unknown as PlanningSessionLike;
      const plannedTasks: unknown[] = Array.isArray(ps.tasks) ? ps.tasks : [];
      if (plannedTasks.length > 0) {
        recordMissionStatus(missionId, 'tasks_generated');
        ctx.send(ws, {
          type: 'mission_update',
          id: createUnifiedId('system', 'mission_update'),
          timestamp: createUnifiedTimestamp().iso,
          unix: Date.now(),
          server: { name: SERVER_NAME, version: SERVER_VERSION },
          payload: { missionId, status: 'tasks_generated', tasksSummary: plannedTasks.slice(0, 5) },
        });
      }
      recordMissionStatus(missionId, 'planned');
      ctx.send(ws, {
        type: 'mission_update',
        id: createUnifiedId('system', 'mission_update'),
        timestamp: createUnifiedTimestamp().iso,
        unix: Date.now(),
        server: { name: SERVER_NAME, version: SERVER_VERSION },
        payload: { missionId, status: 'planned', planningSession },
      });
      // Launch execution engine asynchronously
      const engine = new ExecutionEngine({ missionId, tasks: plannedTasks, ws, ctx });
      engineRef.cancel = () => engine.cancel();
      unifiedMonitoringService.trackOperation('Mission', 'execution_start', 'success', {
        missionId,
      });
      void engine.run();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      unifiedMonitoringService.trackOperation('Mission', 'plan_execute', 'error', {
        missionId,
        error: msg,
        taxonomyCode: getErrorCodeLabel(msg),
      });
      recordMissionStatus(missionId, 'error', { error: msg });
      ctx.send(ws, {
        type: 'mission_update',
        id: createUnifiedId('system', 'mission_update'),
        timestamp: createUnifiedTimestamp().iso,
        unix: Date.now(),
        server: { name: SERVER_NAME, version: SERVER_VERSION },
        payload: { missionId, status: 'error', error: e instanceof Error ? e.message : String(e) },
      });
    }
  })();
  // Attach a completion listener via monkey patch of send for mission completion metrics (lightweight)
  const originalSend = ctx.send;
  ctx.send = (socket, payload) => {
    const isMissionUpdate = (
      p: Record<string, unknown>,
    ): p is { type: 'mission_update'; payload: { missionId: string; status: string } } => {
      if (p.type !== 'mission_update') return false;
      const pl = (p as Record<string, unknown>).payload as unknown;
      return !!pl && typeof (pl as Record<string, unknown>).status === 'string';
    };
    if (payload && isMissionUpdate(payload)) {
      const status = payload.payload.status;
      if (status === 'completed' || status === 'cancelled' || status === 'error') {
        const durationMs = createUnifiedTimestamp().unix - missionStartTime;
        unifiedMonitoringService.trackOperation('Mission', status, 'success', {
          missionId,
          durationMs,
        });
        recordMissionStatus(missionId, status as 'completed' | 'cancelled' | 'error');
      } else if (
        status === 'execution_started' ||
        status === 'execution_progress' ||
        status === 'planning_started' ||
        status === 'planned' ||
        status === 'tasks_generated'
      ) {
        // Narrow to MissionStatus union without using any
        recordMissionStatus(
          missionId,
          status as
            | 'execution_started'
            | 'execution_progress'
            | 'planning_started'
            | 'planned'
            | 'tasks_generated',
        );
      }
    }
    return originalSend(socket, payload);
  };
  return engineRef;
}
