import { createAnomalyAlertChannel } from '../../coreagent/server/mission-control/anomalyAlertChannel';
import {
  resetMissionRegistry,
  recordMissionStart,
  recordMissionStatus,
} from '../../coreagent/server/mission-control/missionRegistry';
import { createUnifiedTimestamp } from '../../coreagent/utils/UnifiedBackboneService';

// Lightweight mock WebSocket + ctx
class MockWS {
  public sent: unknown[] = [];
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
}

describe('anomalyAlertChannel', () => {
  beforeEach(() => {
    resetMissionRegistry();
  });
  it('emits anomaly_alert when active missions threshold exceeded', (done) => {
    // Arrange: create >10 active missions
    const now = createUnifiedTimestamp().unix;
    for (let i = 0; i < 11; i++) {
      const id = `m-${i}`;
      recordMissionStart(id, now - i * 1000);
      recordMissionStatus(id, 'planning_started');
    }
    const ws = new MockWS();
    const channel = createAnomalyAlertChannel();
    const ctx = {
      send: (w: MockWS, payload: Record<string, unknown>) =>
        w.send(JSON.stringify({ protocolVersion: 'test', ...payload })),
      connectionState: new WeakMap(),
    } as unknown as import('../../coreagent/server/mission-control/types').ChannelContext;

    channel.onSubscribe(ws as unknown as any, ctx);

    setTimeout(() => {
      // Assert: at least one anomaly_alert frame present
      const anomalies = ws.sent.filter((m: any) => m.type === 'anomaly_alert');
      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      const highActive = anomalies.find((a: any) =>
        /High active mission count/i.test(a.payload?.message),
      );
      expect(highActive).toBeDefined();
      // cleanup: simulate unsubscribe to clear interval
      channel.onUnsubscribe?.(ws as unknown as any, ctx);
      done();
    }, 100); // Allow evaluation loop to run
  });
});
