// Mission Control WebSocket server (modular version)
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage, Server } from 'http';
import type { Duplex } from 'stream';
import { createUnifiedTimestamp, createUnifiedId } from '../utils/UnifiedBackboneService';
import { ChannelRegistry } from './mission-control/ChannelRegistry';
import { createHealthDeltaChannel } from './mission-control/healthDeltaChannel';
import { createMetricsTickChannel } from './mission-control/metricsTickChannel';
import { createMissionStatsChannel } from './mission-control/missionStatsChannel';
import { handleMissionStart } from './mission-control/missionHandler';
import {
  MISSION_CONTROL_WS_PATH,
  SERVER_NAME,
  SERVER_VERSION,
  MISSION_CONTROL_PROTOCOL_VERSION,
} from './mission-control/constants';
import { parseAndValidateInbound } from './mission-control/validateInboundMessage';
import { validateOutboundMessage } from './mission-control/validateOutboundMessage';
import type { ChannelContext, HealthWithStatus } from './mission-control/types';
import { getErrorCodeLabel } from '../monitoring/errorTaxonomy';

// Lightweight metrics state (no parallel metrics store) - kept identical API
export const missionControlWsMetrics = {
  connectionsOpen: 0,
  connectionsTotal: 0,
  messagesSentTotal: 0,
  subscriptionsTotal: 0,
  channelSubscriptions: new Map<string, number>(),
};

export function createMissionControlWSS(
  server: Server,
  getHealth: () => Promise<HealthWithStatus>,
  onConnectionCountChange?: (count: number) => void,
) {
  const wssMissionControl = new WebSocketServer({ noServer: true });
  const registry = new ChannelRegistry();
  const subscriptions = new WeakMap<WebSocket, Set<string>>();
  const connectionState = new WeakMap<WebSocket, Record<string, unknown>>();
  // Track mission execution engines per connection
  const missionEngines = new WeakMap<WebSocket, Map<string, { cancel: () => void }>>();

  const ctx: ChannelContext = {
    getHealth,
    send: (ws, payload: Record<string, unknown>) => {
      // Validate outbound (best effort, non-fatal)
      const validation = validateOutboundMessage(payload);
      if (validation.ok === false) {
        if (process.env.ONEAGENT_DEBUG_MISSION_CONTROL) {
          console.warn(
            '[mission-control] outbound validation failure',
            validation.errors.slice(0, 3),
          );
        }
      }
      try {
        ws.send(JSON.stringify({ protocolVersion: MISSION_CONTROL_PROTOCOL_VERSION, ...payload }));
      } catch {
        /* ignore send errors */
      }
    },
    connectionState,
  };

  // Register modular channels
  registry.register(createHealthDeltaChannel());
  registry.register(createMetricsTickChannel());
  registry.register(createMissionStatsChannel());

  // Upgrade handling
  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    try {
      const url = new URL(request.url || '/', 'http://localhost');
      if (url.pathname === MISSION_CONTROL_WS_PATH) {
        wssMissionControl.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          wssMissionControl.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    } catch {
      socket.destroy();
    }
  });

  // Connection lifecycle
  wssMissionControl.on('connection', (ws: WebSocket) => {
    missionControlWsMetrics.connectionsOpen = wssMissionControl.clients.size;
    missionControlWsMetrics.connectionsTotal += 1;
    onConnectionCountChange?.(missionControlWsMetrics.connectionsOpen);
    const heartbeat = setInterval(() => {
      const ts = createUnifiedTimestamp();
      ctx.send(ws, {
        type: 'heartbeat',
        id: createUnifiedId('system', 'heartbeat'),
        timestamp: ts.iso,
        unix: ts.unix,
        server: { name: SERVER_NAME, version: SERVER_VERSION },
      });
    }, 30000);
    (heartbeat as unknown as { unref?: () => void }).unref?.();

    ws.on('message', (data: Buffer | ArrayBuffer | ArrayBufferView) => {
      const raw = data.toString('utf8');
      const validated = parseAndValidateInbound(raw);
      if (!validated.ok) {
        ctx.send(ws, {
          type: 'protocol_error',
          id: createUnifiedId('system', 'protocol_error'),
          timestamp: createUnifiedTimestamp().iso,
          unix: Date.now(),
          server: { name: SERVER_NAME, version: SERVER_VERSION },
          error: { code: 'invalid_message', detail: validated.errors.slice(0, 3) },
        });
        return;
      }
      // Narrow validated message to known inbound client message shape while allowing
      // pass-through of benign extra fields without resorting to 'any'.
      type ExtraInboundFields = { [k: string]: unknown };
      const msg = validated.msg as import('./mission-control/types').InboundClientMessage &
        ExtraInboundFields;
      try {
        if (msg.type === 'subscribe' && Array.isArray(msg.channels)) {
          let current = subscriptions.get(ws);
          if (!current) {
            current = new Set<string>();
            subscriptions.set(ws, current);
          }
          const channelValues: string[] = (msg.channels as unknown[]).map((v) =>
            typeof v === 'string' ? v : String(v),
          );
          channelValues.forEach((c) => {
            if (current!.has(c)) return; // already subscribed
            const ch = registry.get(c);
            if (ch) {
              current!.add(c);
              ch.onSubscribe(ws, ctx);
              missionControlWsMetrics.subscriptionsTotal += 1;
              missionControlWsMetrics.channelSubscriptions.set(
                c,
                (missionControlWsMetrics.channelSubscriptions.get(c) || 0) + 1,
              );
              ctx.send(ws, {
                type: 'subscription_ack',
                id: createUnifiedId('system', 'sub_ack'),
                timestamp: createUnifiedTimestamp().iso,
                unix: Date.now(),
                server: { name: SERVER_NAME, version: SERVER_VERSION },
                payload: { channel: c, status: 'subscribed' },
              });
            } else {
              ctx.send(ws, {
                type: 'subscription_error',
                id: createUnifiedId('system', 'sub_err'),
                timestamp: createUnifiedTimestamp().iso,
                unix: Date.now(),
                server: { name: SERVER_NAME, version: SERVER_VERSION },
                error: {
                  code: 'unknown_channel',
                  message: `Channel '${c}' not found`,
                  taxonomy: getErrorCodeLabel('unknown_channel'),
                },
              });
            }
          });
        }
        if (msg.type === 'unsubscribe' && Array.isArray(msg.channels)) {
          const current = subscriptions.get(ws);
          if (current) {
            const channelValues: string[] = (msg.channels as unknown[]).map((v) =>
              typeof v === 'string' ? v : String(v),
            );
            channelValues.forEach((c) => {
              if (!current.has(c)) return;
              const ch = registry.get(c);
              current.delete(c);
              ch?.onUnsubscribe?.(ws, ctx);
              ctx.send(ws, {
                type: 'subscription_ack',
                id: createUnifiedId('system', 'unsub_ack'),
                timestamp: createUnifiedTimestamp().iso,
                unix: Date.now(),
                server: { name: SERVER_NAME, version: SERVER_VERSION },
                payload: { channel: c, status: 'unsubscribed' },
              });
            });
          }
        }
        if (msg.type === 'ping') {
          ctx.send(ws, {
            type: 'pong',
            id: createUnifiedId('system', 'pong'),
            timestamp: createUnifiedTimestamp().iso,
            unix: Date.now(),
            server: { name: SERVER_NAME, version: SERVER_VERSION },
          });
        }
        if (msg.type === 'whoami') {
          ctx.send(ws, {
            type: 'whoami',
            id: createUnifiedId('system', 'whoami'),
            timestamp: createUnifiedTimestamp().iso,
            unix: Date.now(),
            server: { name: SERVER_NAME, version: SERVER_VERSION },
            payload: { server: SERVER_NAME, version: SERVER_VERSION, channels: registry.list() },
          });
        }
        // mission_start: { type: 'mission_start', command: '/mission {..}' | plain objective }
        if (msg.type === 'mission_start' && typeof msg.command === 'string') {
          void handleMissionStart(ws, ctx, msg.command).then((engineRef) => {
            if (engineRef) {
              let map = missionEngines.get(ws);
              if (!map) {
                map = new Map();
                missionEngines.set(ws, map);
              }
              map.set(engineRef.missionId, engineRef);
            }
          });
        }
        if (msg.type === 'mission_cancel') {
          const map = missionEngines.get(ws);
          const engineRef = map?.get(msg.missionId);
          if (engineRef) {
            engineRef.cancel();
          } else {
            ctx.send(ws, {
              type: 'protocol_error',
              id: createUnifiedId('system', 'protocol_error'),
              timestamp: createUnifiedTimestamp().iso,
              unix: Date.now(),
              server: { name: SERVER_NAME, version: SERVER_VERSION },
              error: {
                code: 'unknown_mission',
                message: `Mission '${msg.missionId}' not found`,
                taxonomy: getErrorCodeLabel('unknown_mission'),
              },
            });
          }
        }
      } catch {
        ctx.send(ws, {
          type: 'protocol_error',
          id: createUnifiedId('system', 'protocol_error'),
          timestamp: createUnifiedTimestamp().iso,
          unix: createUnifiedTimestamp().unix,
          server: { name: SERVER_NAME, version: SERVER_VERSION },
          error: { code: 'invalid_json', message: 'Failed to parse message' },
        });
      }
    });

    ws.on('close', () => {
      clearInterval(heartbeat);
      // Dispose channel resources
      const current = subscriptions.get(ws);
      if (current) {
        current.forEach((c) => registry.get(c)?.disposeConnection?.(ws, ctx));
        subscriptions.delete(ws);
      }
      missionControlWsMetrics.connectionsOpen = wssMissionControl.clients.size;
      onConnectionCountChange?.(missionControlWsMetrics.connectionsOpen);
    });
  });
  return wssMissionControl;
}
