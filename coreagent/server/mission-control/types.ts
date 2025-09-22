// Mission Control WebSocket modular type definitions
// Canonical: no parallel time/id systems; use UnifiedBackboneService helpers only in implementation layers.
import type { WebSocket } from 'ws';
// Generated message envelope unions (inbound/outbound) - kept separate from ergonomic
// domain-specific payload helpers below. Always regenerate after schema edits:
//   npm run codegen:mission-control
import type {
  InboundMissionControlMessage,
  OutboundMissionControlMessage,
} from './generated/mission-control-message-types';

export interface HealthWithStatus {
  overall?: { status?: string };
  // Allow pass-through of additional health fields without forcing parallel typing
  [k: string]: unknown;
}

export interface ChannelContext {
  getHealth: () => Promise<HealthWithStatus>;
  send: (ws: WebSocket, msg: Record<string, unknown>) => void;
  connectionState: WeakMap<WebSocket, Record<string, unknown>>;
}

export interface MissionControlChannel {
  name: string;
  onSubscribe: (ws: WebSocket, ctx: ChannelContext) => void;
  onUnsubscribe?: (ws: WebSocket, ctx: ChannelContext) => void;
  disposeConnection?: (ws: WebSocket, ctx: ChannelContext) => void;
}

export interface MissionStartMessage {
  type: 'mission_start';
  command: string; // objective string or /mission {...}
}

// Backwards compatible alias for existing implementation imports.
// Prefer the generated union moving forward.
export type InboundClientMessage = InboundMissionControlMessage;

export interface SubscriptionAckPayload {
  channel: string;
  status: 'subscribed' | 'unsubscribed';
}

export interface MissionAckPayload {
  missionId: string;
  status: 'accepted';
}

// MissionUpdatePayload interface previously manually maintained; replaced by
// generated OutboundMissionControlMessage mission_update variant. Provide a
// narrow helper type for convenience in implementation layers.
export type MissionUpdatePayload =
  Extract<OutboundMissionControlMessage, { type: 'mission_update' }> extends { payload: infer P }
    ? P
    : never;
