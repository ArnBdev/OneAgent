import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type MissionControlInbound =
  | { type: 'ping'; id?: string }
  | { type: 'whoami'; id?: string }
  | { type: 'subscribe'; channels?: string[]; id?: string }
  | { type: 'unsubscribe'; channels?: string[]; id?: string }
  | { type: 'mission_start'; command: string; id?: string };

export interface MissionControlOutbound<T = unknown> {
  type: string;
  id: string;
  timestamp: string;
  unix: number;
  server: { name: string; version: string };
  payload?: T;
  error?: { code: string; message: string };
}

export type MCConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

export interface UseMissionControlOptions {
  /**
   * WebSocket endpoint. If omitted, defaults to a relative path `/ws/mission-control` which
   * works with the Vite dev proxy (configured in vite.config.ts) and when UI is served by the same host.
   */
  url?: string;
  /** Auto-connect on hook mount */
  autoConnect?: boolean;
  /** Optional callback invoked for each decoded outbound message */
  onMessage?: (msg: MissionControlOutbound) => void;
  /** Optional callback when connection opens */
  onOpen?: (ws: WebSocket) => void;
  /** Optional callback when connection closes */
  onClose?: (ev: CloseEvent) => void;
  /** Optional callback on error */
  onError?: (ev: Event) => void;
}

export interface UseMissionControl {
  status: MCConnectionStatus;
  lastError: string | null;
  lastMessageAt: Date | null;
  messages: MissionControlOutbound[];
  connect: (overrideUrl?: string) => void;
  disconnect: () => void;
  send: (msg: MissionControlInbound) => boolean;
  ping: () => boolean;
  whoami: () => boolean;
  unsubscribe: (channels: string[]) => boolean;
  url: string;
  setUrl: (u: string) => void;
}

export function useMissionControlWS(options: UseMissionControlOptions = {}): UseMissionControl {
  const defaultUrl = useMemo(() => options.url || '/ws/mission-control', [options.url]);
  const [url, setUrl] = useState<string>(defaultUrl);
  const [status, setStatus] = useState<MCConnectionStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastMessageAt, setLastMessageAt] = useState<Date | null>(null);
  const [messages, setMessages] = useState<MissionControlOutbound[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const cleanup = useCallback(() => {
    try {
      wsRef.current?.close();
    } catch {
      // ignore
    }
    wsRef.current = null;
  }, []);

  const connect = useCallback(
    (overrideUrl?: string) => {
      const target = overrideUrl || url;
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return; // already connected/connecting
      }
      setStatus('connecting');
      setLastError(null);
      try {
        const ws = new WebSocket(target.replace(/^http/, 'ws'));
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus('open');
          try {
            options.onOpen?.(ws);
          } catch {
            /* ignore onOpen errors */
          }
        };

        ws.onmessage = (evt: MessageEvent) => {
          try {
            const data = typeof evt.data === 'string' ? evt.data : String(evt.data);
            const json = JSON.parse(data) as MissionControlOutbound;
            setMessages((prev) => {
              const next = [...prev, json];
              if (next.length > 200) next.shift();
              return next;
            });
            try {
              options.onMessage?.(json);
            } catch {
              /* swallow message handler errors */
            }
            setLastMessageAt(new Date());
          } catch (e) {
            setLastError(e instanceof Error ? e.message : 'Parse error');
          }
        };

        ws.onerror = (ev) => {
          setStatus('error');
          setLastError('WebSocket error');
          try {
            options.onError?.(ev);
          } catch {
            /* ignore */
          }
        };

        ws.onclose = (ev) => {
          setStatus('closed');
          try {
            options.onClose?.(ev);
          } catch {
            /* ignore */
          }
        };
      } catch (e) {
        setStatus('error');
        setLastError(e instanceof Error ? e.message : 'Connection error');
      }
    },
    [url, options.onMessage, options.onOpen, options.onClose, options.onError],
  );

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const send = useCallback((msg: MissionControlInbound): boolean => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(msg));
      return true;
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Send error');
      return false;
    }
  }, []);

  const ping = useCallback(() => send({ type: 'ping' }), [send]);
  const whoami = useCallback(() => send({ type: 'whoami' }), [send]);
  const unsubscribe = useCallback(
    (channels: string[]) => send({ type: 'unsubscribe', channels }),
    [send],
  );

  useEffect(() => {
    if (options.autoConnect) {
      connect();
    }
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    lastError,
    lastMessageAt,
    messages,
    connect,
    disconnect,
    send,
    ping,
    whoami,
    unsubscribe,
    url,
    setUrl,
  };
}
