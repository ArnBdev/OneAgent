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
      getHealth: async () => ({ components: {}, overall: { status: 'healthy' } }),
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

  // Phase 3 (v4.4.2): Memory backend health anomaly detection tests
  describe('Memory Backend Health Anomalies', () => {
    it('emits CRITICAL alert when memory backend is unhealthy', (done) => {
      const ws = new MockWS();
      const channel = createAnomalyAlertChannel();
      const ctx = {
        send: (w: MockWS, payload: Record<string, unknown>) =>
          w.send(JSON.stringify({ protocolVersion: 'test', ...payload })),
        connectionState: new WeakMap(),
        getHealth: async () => ({
          components: {
            memoryService: {
              status: 'unhealthy',
              responseTime: 5000,
              lastCheck: new Date().toISOString(),
              details: {
                backend: 'mem0',
                error: 'Connection refused',
                capabilitiesCount: 0,
              },
            },
          },
          overall: { status: 'critical' },
        }),
      } as unknown as import('../../coreagent/server/mission-control/types').ChannelContext;

      channel.onSubscribe(ws as unknown as any, ctx);

      setTimeout(() => {
        const anomalies = ws.sent.filter((m: any) => m.type === 'anomaly_alert');
        expect(anomalies.length).toBeGreaterThanOrEqual(1);

        const memoryAlert = anomalies.find(
          (a: any) =>
            a.payload?.category === 'health' &&
            a.payload?.severity === 'critical' &&
            /Memory backend unreachable or unhealthy/i.test(a.payload?.message),
        );

        expect(memoryAlert).toBeDefined();
        if (memoryAlert) {
          expect((memoryAlert as any).payload?.metric).toBe('memory_backend_status');
          expect((memoryAlert as any).payload?.value).toBe(0);
          expect((memoryAlert as any).payload?.threshold).toBe(1);
          expect((memoryAlert as any).payload?.details?.backend).toBe('mem0');
          expect((memoryAlert as any).payload?.details?.error).toBe('Connection refused');
        }

        channel.onUnsubscribe?.(ws as unknown as any, ctx);
        done();
      }, 100);
    });

    it('emits WARNING alert when memory backend latency exceeds threshold', (done) => {
      const ws = new MockWS();
      const channel = createAnomalyAlertChannel();
      const ctx = {
        send: (w: MockWS, payload: Record<string, unknown>) =>
          w.send(JSON.stringify({ protocolVersion: 'test', ...payload })),
        connectionState: new WeakMap(),
        getHealth: async () => ({
          components: {
            memoryService: {
              status: 'degraded',
              responseTime: 1500,
              lastCheck: new Date().toISOString(),
              details: {
                backend: 'mem0',
                capabilitiesCount: 7,
              },
            },
          },
          overall: { status: 'degraded' },
        }),
      } as unknown as import('../../coreagent/server/mission-control/types').ChannelContext;

      channel.onSubscribe(ws as unknown as any, ctx);

      setTimeout(() => {
        const anomalies = ws.sent.filter((m: any) => m.type === 'anomaly_alert');
        expect(anomalies.length).toBeGreaterThanOrEqual(1);

        const latencyAlert = anomalies.find(
          (a: any) =>
            a.payload?.category === 'health' &&
            a.payload?.severity === 'warning' &&
            /Memory backend latency high/i.test(a.payload?.message),
        );

        expect(latencyAlert).toBeDefined();
        if (latencyAlert) {
          expect((latencyAlert as any).payload?.metric).toBe('memory_backend_latency');
          expect((latencyAlert as any).payload?.value).toBe(1500);
          expect((latencyAlert as any).payload?.threshold).toBe(1000);
          expect((latencyAlert as any).payload?.details?.backend).toBe('mem0');
          expect((latencyAlert as any).payload?.details?.capabilities).toBe(7);
        }

        channel.onUnsubscribe?.(ws as unknown as any, ctx);
        done();
      }, 100);
    });

    it('does not emit memory backend alerts when healthy', (done) => {
      const ws = new MockWS();
      const channel = createAnomalyAlertChannel();
      const ctx = {
        send: (w: MockWS, payload: Record<string, unknown>) =>
          w.send(JSON.stringify({ protocolVersion: 'test', ...payload })),
        connectionState: new WeakMap(),
        getHealth: async () => ({
          components: {
            memoryService: {
              status: 'healthy',
              responseTime: 42,
              lastCheck: new Date().toISOString(),
              details: {
                backend: 'mem0',
                capabilitiesCount: 7,
              },
            },
          },
          overall: { status: 'healthy' },
        }),
      } as unknown as import('../../coreagent/server/mission-control/types').ChannelContext;

      channel.onSubscribe(ws as unknown as any, ctx);

      setTimeout(() => {
        const anomalies = ws.sent.filter((m: any) => m.type === 'anomaly_alert');
        
        const memoryAlerts = anomalies.filter(
          (a: any) =>
            a.payload?.category === 'health' &&
            /Memory backend/i.test(a.payload?.message),
        );

        // Should not emit memory backend alerts when healthy
        expect(memoryAlerts.length).toBe(0);

        channel.onUnsubscribe?.(ws as unknown as any, ctx);
        done();
      }, 100);
    });

    it('handles missing memory backend component gracefully', (done) => {
      const ws = new MockWS();
      const channel = createAnomalyAlertChannel();
      const ctx = {
        send: (w: MockWS, payload: Record<string, unknown>) =>
          w.send(JSON.stringify({ protocolVersion: 'test', ...payload })),
        connectionState: new WeakMap(),
        getHealth: async () => ({
          components: {
            // No memoryService component
          },
          overall: { status: 'healthy' },
        }),
      } as unknown as import('../../coreagent/server/mission-control/types').ChannelContext;

      channel.onSubscribe(ws as unknown as any, ctx);

      setTimeout(() => {
        // Should not throw, just no memory alerts
        const anomalies = ws.sent.filter((m: any) => m.type === 'anomaly_alert');
        const memoryAlerts = anomalies.filter(
          (a: any) =>
            a.payload?.category === 'health' &&
            /Memory backend/i.test(a.payload?.message),
        );

        expect(memoryAlerts.length).toBe(0);

        channel.onUnsubscribe?.(ws as unknown as any, ctx);
        done();
      }, 100);
    });
  });
});
