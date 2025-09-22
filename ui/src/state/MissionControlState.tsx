import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { MissionControlOutbound } from '@/hooks/useMissionControlWS';
import { useMissionControlWS } from '@/hooks/useMissionControlWS';

export interface LatencyPoint {
  t: string;
  p95: number;
  p99: number;
}
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown' | 'error';

interface MissionControlContextShape {
  latency: LatencyPoint[];
  healthStatus: HealthStatus;
  lastHealthAt: number | null;
  healthHistory: Array<{ status: HealthStatus; ts: number }>;
  windowMs: number;
  connectionStatus: string;
  wsState: string; // derived connection + heartbeat assessment
  connect: () => void;
  manualReconnect: () => void;
  wsUrl: string;
  setWsUrl: (u: string) => void;
  rawMessages: MissionControlOutbound[];
}

const MissionControlContext = createContext<MissionControlContextShape | undefined>(undefined);

// Rolling window defaults (aligned with backend default 5m window, 30s buckets)
const DEFAULT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const BUCKET_MS = 30 * 1000; // canonical bucket size
// (Max points implied by windowMsRef + BUCKET_MS; no explicit constant required)
const HEALTH_HISTORY_MAX = 50;
// Heartbeat stale threshold (if no metrics_tick within this multiple -> mark reconnecting intent)
const HEARTBEAT_STALE_FACTOR = 2.2; // > 2x interval considered stale

// Backoff base and jitter (exponential style 1.5^n with cap expressed in BACKOFF_STEPS for determinism)

// Exponential backoff sequence (ms)
const BACKOFF_STEPS = [1000, 2000, 5000, 8000, 13000, 21000, 34000];
const BACKOFF_JITTER_PCT = 0.2; // +/-20% jitter
const FALLBACK_POLL_THRESHOLD = 3; // after N failed reconnect attempts start REST health polling
const FALLBACK_POLL_INTERVAL = 10_000; // 10s

export const MissionControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [latency, setLatency] = useState<LatencyPoint[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('unknown');
  const [lastHealthAt, setLastHealthAt] = useState<number | null>(null);
  const [healthHistory, setHealthHistory] = useState<Array<{ status: HealthStatus; ts: number }>>(
    [],
  );
  const windowMsRef = useRef<number>(DEFAULT_WINDOW_MS);
  const lastTickAtRef = useRef<number | null>(null);
  const backoffIndexRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const fallbackPollTimerRef = useRef<number | null>(null);
  const [wsUrl, setWsUrl] = useState('/ws/mission-control');
  const [wsState, setWsState] = useState<string>('idle');

  const connectRef = useRef<(() => void) | null>(null);
  const scheduleReconnect = useCallback(() => {
    const base = BACKOFF_STEPS[Math.min(backoffIndexRef.current, BACKOFF_STEPS.length - 1)];
    const jitterSpan = base * BACKOFF_JITTER_PCT;
    const delay = Math.max(400, Math.round(base + (Math.random() * 2 - 1) * jitterSpan));
    if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = window.setTimeout(() => {
      connectRef.current?.();
    }, delay) as unknown as number;
    backoffIndexRef.current += 1;
  }, []);

  const onMessage = useCallback((msg: MissionControlOutbound) => {
    if (msg.type === 'metrics_tick' && msg.payload) {
      const p = msg.payload as {
        p95: number;
        p99: number;
        tISO?: string;
        tUnix?: number;
        bucketStart?: string; // forward compatible
      };
      const iso = p.tISO || (p.tUnix ? new Date(p.tUnix).toISOString() : msg.timestamp);
      const ts = Date.parse(iso);
      lastTickAtRef.current = ts;
      const label = new Date(iso).toLocaleTimeString(undefined, { hour12: false });
      setLatency((prev) => {
        let replaced = false;
        const next = prev.map((pt) => {
          if (pt.t === label) {
            replaced = true;
            return { t: label, p95: p.p95, p99: p.p99 };
          }
          return pt;
        });
        if (!replaced) next.push({ t: label, p95: p.p95, p99: p.p99 });
        // Trim by time window (approx using count if timestamp reconstruction not stored per bucket)
        // We rely on bucket ordering and fixed bucket size; enforce max length matching window
        const maxByWindow = Math.ceil(windowMsRef.current / BUCKET_MS) + 2;
        while (next.length > maxByWindow) next.shift();
        return next;
      });
    }
    if (msg.type === 'health_delta' && msg.payload) {
      const payload = msg.payload as { status?: string };
      const newStatus = (payload.status as HealthStatus) || 'unknown';
      setHealthStatus((prev) => {
        if (prev !== newStatus) {
          const ts = Date.now();
          setHealthHistory((hist) => {
            const updated = [...hist, { status: newStatus, ts }];
            if (updated.length > HEALTH_HISTORY_MAX) updated.shift();
            return updated;
          });
          setLastHealthAt(ts);
        }
        return newStatus;
      });
    }
  }, []);

  const {
    status: connectionStatus,
    connect,
    send,
    messages: rawMessages,
  } = useMissionControlWS({
    url: wsUrl,
    autoConnect: true,
    onMessage,
    onOpen: () => {
      backoffIndexRef.current = 0; // reset backoff on success
      if (fallbackPollTimerRef.current) {
        window.clearInterval(fallbackPollTimerRef.current);
        fallbackPollTimerRef.current = null;
      }
      setWsState('open');
      // subscribe to required channels
      send({ type: 'subscribe', channels: ['metrics_tick', 'health_delta'] });
    },
    onClose: () => {
      setWsState('closed');
      scheduleReconnect();
    },
    onError: () => {
      setWsState('error');
      scheduleReconnect();
    },
  });

  connectRef.current = connect; // always keep latest

  const manualReconnect = useCallback(() => {
    backoffIndexRef.current = 0;
    if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
    if (fallbackPollTimerRef.current) {
      window.clearInterval(fallbackPollTimerRef.current);
      fallbackPollTimerRef.current = null;
    }
    connectRef.current?.();
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (fallbackPollTimerRef.current) window.clearInterval(fallbackPollTimerRef.current);
    };
  }, []);

  // Heartbeat watchdog: mark wsState as reconnecting if stale
  useEffect(() => {
    const interval = window.setInterval(() => {
      const last = lastTickAtRef.current;
      if (connectionStatus === 'open') {
        const now = Date.now();
        const staleThreshold = BUCKET_MS * HEARTBEAT_STALE_FACTOR;
        if (!last || now - last > staleThreshold) {
          setWsState('reconnecting');
        } else if (wsState !== 'open') {
          setWsState('open');
        }
      } else if (wsState !== connectionStatus) {
        setWsState(connectionStatus);
      }
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [connectionStatus, wsState]);

  // Fallback REST polling if repeated reconnect failures (degraded experience)
  useEffect(() => {
    const degraded = backoffIndexRef.current >= FALLBACK_POLL_THRESHOLD && wsState !== 'open';
    if (degraded && !fallbackPollTimerRef.current) {
      const poll = async () => {
        try {
          const res = await fetch('/health?details=true');
          if (!res.ok) return;
          const json = await res.json();
          const status: HealthStatus =
            (json?.health?.overall?.status as HealthStatus) ||
            (json?.status as HealthStatus) ||
            'unknown';
          setHealthStatus((prev) => {
            if (prev !== status) {
              const ts = Date.now();
              setHealthHistory((hist) => {
                const updated = [...hist, { status, ts }];
                if (updated.length > HEALTH_HISTORY_MAX) updated.shift();
                return updated;
              });
              setLastHealthAt(ts);
            }
            return status;
          });
        } catch {
          // ignore errors silently for fallback path
        }
      };
      void poll();
      fallbackPollTimerRef.current = window.setInterval(
        poll,
        FALLBACK_POLL_INTERVAL,
      ) as unknown as number;
    }
    if (!degraded && fallbackPollTimerRef.current) {
      window.clearInterval(fallbackPollTimerRef.current);
      fallbackPollTimerRef.current = null;
    }
  }, [wsState]);

  const value = useMemo(
    () => ({
      latency,
      healthStatus,
      lastHealthAt,
      healthHistory,
      windowMs: windowMsRef.current,
      connectionStatus,
      wsState,
      connect: manualReconnect,
      manualReconnect,
      wsUrl,
      setWsUrl,
      rawMessages,
    }),
    [
      latency,
      healthStatus,
      lastHealthAt,
      healthHistory,
      connectionStatus,
      wsState,
      manualReconnect,
      wsUrl,
      rawMessages,
    ],
  );

  return <MissionControlContext.Provider value={value}>{children}</MissionControlContext.Provider>;
};

// eslint-disable-next-line
export function useMissionControlState(): MissionControlContextShape {
  const ctx = useContext(MissionControlContext);
  if (!ctx) throw new Error('useMissionControlState must be used within MissionControlProvider');
  return ctx;
}

export default MissionControlProvider;
