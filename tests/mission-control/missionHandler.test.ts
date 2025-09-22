import { handleMissionStart } from '../../coreagent/server/mission-control/missionHandler';
import { createUnifiedTimestamp } from '../../coreagent/utils/UnifiedBackboneService';

// Mock PlannerAgent dynamic import path used in missionHandler
jest.mock('../../coreagent/agents/specialized/PlannerAgent', () => {
  class PlannerAgentMock {
    async initialize() {
      /* no-op */
    }
    async createPlanningSession(input: unknown) {
      return { session: 'ok', input };
    }
  }
  return { PlannerAgent: PlannerAgentMock };
});

function createMockWs() {
  const sent: any[] = [];
  return {
    send: (data: string) => {
      sent.push(JSON.parse(data));
    },
    _sent: sent,
  } as any;
}

describe('handleMissionStart', () => {
  it('sends ack, planning + execution phases and completion update', async () => {
    const ws = createMockWs();
    const ctx = {
      getHealth: async () => ({ overall: { status: 'healthy' } }),
      send: (w: any, payload: any) => w.send(JSON.stringify(payload)),
      connectionState: new WeakMap(),
    };
    await handleMissionStart(ws, ctx as any, 'test objective');
    // Poll for execution lifecycle
    const deadline = Date.now() + 500; // 0.5s
    let executionStarted, completed;
    while (Date.now() < deadline) {
      executionStarted = ws._sent.find((m: any) => m.payload?.status === 'execution_started');
      completed = ws._sent.find((m: any) => m.payload?.status === 'completed');
      if (executionStarted && completed) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    const types = ws._sent.map((m: any) => m.type);
    expect(types[0]).toBe('mission_ack');
    expect(types).toContain('mission_update');
    expect(ws._sent.find((m: any) => m.payload?.status === 'planning_started')).toBeTruthy();
    expect(ws._sent.find((m: any) => m.payload?.status === 'planned')).toBeTruthy();
    expect(executionStarted).toBeTruthy();
    expect(completed).toBeTruthy();
  });
});
