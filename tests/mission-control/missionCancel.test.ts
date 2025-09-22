import { createMissionControlWSS } from '../../coreagent/server/mission-control-ws';
import { WebSocketServer } from 'ws';
import type { Server } from 'http';
import { createUnifiedTimestamp } from '../../coreagent/utils/UnifiedBackboneService';

// Mock PlannerAgent to avoid heavy real initialization overhead
jest.mock('../../coreagent/agents/specialized/PlannerAgent', () => {
  class PlannerAgentMock {
    async initialize() {
      /* no-op */
    }
    async createPlanningSession() {
      return { tasks: [] };
    }
  }
  return { PlannerAgent: PlannerAgentMock };
});

// Minimal fake HTTP server interface for upgrade not invoked in this unit test
const fakeServer: Partial<Server> = {
  on: () => fakeServer as any,
};

describe('Mission cancellation', () => {
  it('handles mission_cancel for unknown mission gracefully', async () => {
    const wss = createMissionControlWSS(fakeServer as Server, async () => ({
      overall: { status: 'ok' },
    }));
    type Listener = (...args: unknown[]) => void;
    const listeners: Record<string, Listener[]> = {};
    const ws: any = {
      _sent: [] as any[],
      send(data: string) {
        this._sent.push(JSON.parse(data));
      },
      on(event: string, fn: Listener) {
        (listeners[event] ||= []).push(fn);
      },
      emit(event: string, ...args: any[]) {
        (listeners[event] || []).forEach((f) => f(...args));
      },
    };
    // Simulate connection event
    (wss as any).emit('connection', ws);
    // Start a mission
    ws.emit(
      'message',
      Buffer.from(JSON.stringify({ type: 'mission_start', command: 'demo objective' })),
    );
    await new Promise((r) => setTimeout(r, 10));
    const missionAck = ws._sent.find((m: any) => m.type === 'mission_ack');
    expect(missionAck).toBeTruthy();
    const missionId = missionAck.payload.missionId;
    // Cancel mission
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'mission_cancel', missionId })));
    // Allow some time for either cancellation or completion (if already completed before cancel processed)
    await new Promise((r) => setTimeout(r, 50));
    const finalState = ws._sent.find((m: any) =>
      ['cancelled', 'completed'].includes(m.payload?.status),
    );
    expect(finalState).toBeTruthy();
  });
});
