import { useCallback, useEffect, useRef, useState } from 'react';

export interface MetricsJsonResponse {
  success: boolean;
  timestamp: string;
  data: {
    stats: {
      total: number;
      windowSize: number;
      earliestTimestamp?: string;
      latestTimestamp?: string;
      latency: { average: number; max: number; p50: number; p95: number; p99: number };
    };
    operations: {
      generatedAt: string;
      totalOperations: number;
      components: Record<
        string,
        {
          operations: Record<
            string,
            { success: number; error: number; total: number; errorRate: number }
          >;
          totals: { success: number; error: number; total: number; errorRate: number };
        }
      >;
    };
    slos: unknown | null;
    errors: Array<{ component: string; operation: string; errorCode: string; count: number }>;
    errorBudgets: Array<{
      operation: string;
      targetErrorRate: number;
      observedErrorRate: number;
      burnRate: number;
      remainingBudget: number;
      windowMs: number;
    }>;
    orchestrator: null | {
      totalOperations: number;
      successRate: number;
      agentUtilization: Record<string, number>;
      recentActivity: string[];
    };
  };
}

export function useMetricsJson(opts?: { intervalMs?: number }) {
  const intervalMs = opts?.intervalMs ?? 5000;
  const [data, setData] = useState<MetricsJsonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchOnce = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/v1/metrics/json', { signal: ac.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = (await resp.json()) as MetricsJsonResponse;
      setData(json);
      setLastUpdated(Date.now());
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOnce();
    const timer = window.setInterval(() => {
      void fetchOnce();
    }, intervalMs);
    return () => {
      window.clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [fetchOnce, intervalMs]);

  return { data, error, loading, lastUpdated, refresh: fetchOnce } as const;
}
