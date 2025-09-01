import { useCallback, useEffect, useState } from 'react';

interface MetricsSummaryApiResponse {
  success: boolean;
  data?: {
    stats: {
      total: number;
      windowSize: number;
      earliestTimestamp?: string;
      latestTimestamp?: string;
      latency: { average: number; max: number; p95: number };
    };
    opSummary: {
      totalOperations: number;
      components: Record<string, { totals: { total: number; errorRate: number } }>;
    };
  };
  timestamp?: string;
}

export function useMetricsSummary(intervalMs = 10000) {
  const [summary, setSummary] = useState<MetricsSummaryApiResponse['data'] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/metrics/summary');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MetricsSummaryApiResponse = await res.json();
      if (!json.success) throw new Error('Summary request failed');
      setSummary(json.data || null);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    if (intervalMs > 0) {
      const t = setInterval(fetchSummary, intervalMs);
      return () => clearInterval(t);
    }
  }, [fetchSummary, intervalMs]);

  return { summary, error, loading, lastUpdated, refresh: fetchSummary };
}
