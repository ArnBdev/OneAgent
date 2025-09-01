import { useCallback, useEffect, useRef, useState } from 'react';
import type { MetricLog } from '../components/OneAgentDashboard';

interface UseMetricsPollingOptions {
  count?: number;
  intervalMs?: number; // 0 = paused
  endpoint?: string; // override for tests
}

interface MetricsApiResponse {
  success: boolean;
  data?: MetricLog[];
  error?: { message?: string };
  timestamp?: string;
}

export function useMetricsPolling(options: UseMetricsPollingOptions = {}) {
  const { count = 8, intervalMs = 3000 } = options;
  const [data, setData] = useState<MetricLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pollingIntervalMs, setPollingIntervalMs] = useState(intervalMs);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [failureCount, setFailureCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  const endpoint = options.endpoint || '/api/v1/metrics/latest';

  const fetchOnce = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const url = `${endpoint}?count=${encodeURIComponent(count)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MetricsApiResponse = await res.json();
      if (!json.success) throw new Error(json?.error?.message || 'Unknown metrics error');
      setData(Array.isArray(json.data) ? json.data : []);
      setError(null);
      setLastUpdated(new Date());
      setFailureCount(0);
    } catch (e: unknown) {
      if (isAbortError(e)) return; // ignore abort
      setError(e instanceof Error ? e : new Error('Unknown error'));
      setFailureCount((c) => c + 1);
    } finally {
      setLoading(false);
    }
  }, [count, endpoint]);

  const refresh = useCallback(() => {
    fetchOnce();
  }, [fetchOnce]);

  useEffect(() => {
    // initial fetch
    fetchOnce();
  }, [fetchOnce]);

  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (pollingIntervalMs > 0) {
      timerRef.current = window.setInterval(() => {
        fetchOnce();
      }, pollingIntervalMs);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [pollingIntervalMs, fetchOnce]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    data,
    loading,
    error,
    refresh,
    pollingIntervalMs,
    setPollingIntervalMs,
    lastUpdated,
    failureCount,
  };
}

function isAbortError(err: unknown): boolean {
  return !!(
    err &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name?: string }).name === 'AbortError'
  );
}
