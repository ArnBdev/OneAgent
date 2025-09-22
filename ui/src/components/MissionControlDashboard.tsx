import { useEffect, useMemo, useState } from 'react';
import { useMetricsJson } from '@/hooks/useMetricsJson';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useMissionControlState } from '@/state/MissionControlState';

type LatencyAPIPoint =
  | { tISO: string; p95: number; p99: number }
  | { t: string; p95: number; p99: number };

function StatCard(props: { title: string; value: string; subtitle?: string }) {
  const { title, value, subtitle } = props;
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-gray-100">
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {subtitle ? <div className="text-xs opacity-70 mt-1">{subtitle}</div> : null}
    </div>
  );
}

export function MissionControlDashboard() {
  const { data, error, loading, lastUpdated } = useMetricsJson({ intervalMs: 5000 });
  // Local series stores initial REST bootstrap; then we merge with streaming context latency.
  const [latencySeries, setLatencySeries] = useState<
    Array<{ t: string; p95: number; p99: number }>
  >([]);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const {
    latency: streamingLatency,
    healthStatus,
    wsState,
    healthHistory,
  } = useMissionControlState();

  useEffect(() => {
    // fetch real latency series (default window 5m, bucket 30s)
    let cancelled = false;
    const fetchSeries = async () => {
      try {
        const q = new URLSearchParams({ windowMs: '300000', bucketMs: '30000' });
        if (selectedOperation) q.set('operation', selectedOperation);
        const resp = await fetch(`/api/v1/metrics/latency-series?${q.toString()}`);
        if (!resp.ok) return;
        const json = (await resp.json()) as {
          success: boolean;
          data: { points: LatencyAPIPoint[] };
        };
        if (!cancelled && json.success) {
          setLatencySeries(
            json.data.points.map((p: LatencyAPIPoint) => {
              const tISO = 'tISO' in p ? p.tISO : (p as { t: string }).t;
              return {
                t: new Date(tISO).toLocaleTimeString(),
                p95: p.p95,
                p99: p.p99,
              };
            }),
          );
        }
      } catch {
        // ignore transient failures
      }
    };
    void fetchSeries();
    const id = window.setInterval(fetchSeries, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [selectedOperation]);

  const componentOps = useMemo(() => {
    const entries: Array<{ component: string; operation: string; success: number; error: number }> =
      [];
    const comps = data?.data.operations.components ?? {};
    for (const [component, compData] of Object.entries(comps)) {
      for (const [operation, rec] of Object.entries(compData.operations)) {
        entries.push({ component, operation, success: rec.success, error: rec.error });
      }
    }
    // limit to top 8 by total
    return entries.sort((a, b) => b.success + b.error - (a.success + a.error)).slice(0, 8);
  }, [data]);

  const errorBudgetData = useMemo(() => {
    return (data?.data.errorBudgets ?? []).map((e) => ({
      operation: e.operation,
      burnRate: Number(e.burnRate.toFixed(3)),
      remaining: Number(e.remainingBudget.toFixed(3)),
    }));
  }, [data]);

  const latencySummary = useMemo(() => {
    const lat = data?.data.stats.latency;
    if (!lat) return null;
    return {
      p50: lat.p50,
      p95: lat.p95,
      p99: lat.p99,
      average: lat.average,
      max: lat.max,
    };
  }, [data]);

  // latencySeries is now real data populated via the effect above
  const operationsList = useMemo(() => {
    const set = new Set<string>();
    const comps = (data?.data.operations.components ?? {}) as Record<
      string,
      { operations: Record<string, unknown> }
    >;
    for (const comp of Object.values(comps)) {
      for (const op of Object.keys(comp.operations)) set.add(op);
    }
    return Array.from(set).sort();
  }, [data]);

  // Sync provider streaming latency if longer/newer than local (post-bootstrap).
  useEffect(() => {
    if (!streamingLatency.length) return;
    setLatencySeries((prev) => {
      if (!prev.length) return streamingLatency;
      // Merge by replacing any overlapping tail buckets and appending new ones.
      const map = new Map(prev.map((p) => [p.t, p]));
      for (const p of streamingLatency) map.set(p.t, p);
      // Preserve chronological order based on label appearance order from combined sets.
      const merged = Array.from(map.values());
      // Sort by time label lexically (HH:MM:SS 24h locale assumption). For robustness could parse Date again if locale differs.
      merged.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
      // Trim to ~5m window (max ~12 buckets + buffer)
      const MAX_BUCKETS = 14;
      while (merged.length > MAX_BUCKETS) merged.shift();
      return merged;
    });
  }, [streamingLatency]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-gray-100">
          Mission Control • Health & Observability
        </h2>
        <div className="text-xs text-gray-400 flex items-center gap-3">
          {loading
            ? 'Loading…'
            : error
              ? `Error: ${error}`
              : `Updated: ${lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}`}
          <span
            className={`px-2 py-0.5 rounded border text-[10px] tracking-wide ${
              wsState === 'open'
                ? 'border-green-700 text-green-400'
                : wsState === 'reconnecting'
                  ? 'border-amber-600 text-amber-400'
                  : wsState === 'error' || wsState === 'closed'
                    ? 'border-red-700 text-red-400'
                    : 'border-gray-600 text-gray-400'
            }`}
            title={`WebSocket state: ${wsState}`}
            aria-label={`WebSocket state ${wsState}`}
          >
            {wsState === 'open' ? 'LIVE' : wsState.toUpperCase()}
          </span>
        </div>
      </div>
      <HealthBanner status={healthStatus} />
      {/* Health timeline (recent transitions) */}
      {healthHistory.length ? (
        <div
          className="text-xs text-gray-400 flex flex-wrap gap-2"
          aria-label="Health status history"
        >
          {healthHistory.slice(-8).map((h) => (
            <span
              key={h.ts + h.status}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800 border border-gray-700"
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-current opacity-80"
                data-health={h.status}
              />
              <span className="capitalize">{h.status}</span>
              <span className="opacity-60">{new Date(h.ts).toLocaleTimeString()}</span>
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Recent Ops (5m)"
          value={String(data?.data.operations.totalOperations ?? 0)}
        />
        <StatCard
          title="Metrics Logs"
          value={String(data?.data.stats.total ?? 0)}
          subtitle={`Window ${data?.data.stats.windowSize ?? 0}`}
        />
        <StatCard title="Latency p95" value={`${latencySummary?.p95 ?? 0} ms`} />
        <StatCard title="Latency p99" value={`${latencySummary?.p99 ?? 0} ms`} />
        <StatCard title="Avg Latency" value={`${latencySummary?.average ?? 0} ms`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-300">Latency (p95/p99) – recent trend</div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Operation:</label>
              <select
                className="bg-gray-800 text-gray-100 text-xs rounded px-2 py-1 border border-gray-700"
                value={selectedOperation}
                onChange={(e) => setSelectedOperation(e.target.value)}
              >
                <option value="">All</option>
                {operationsList.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencySeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="t" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="p95"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  dot={false}
                  name="p95 ms"
                />
                <Line
                  type="monotone"
                  dataKey="p99"
                  stroke="#F472B6"
                  strokeWidth={2}
                  dot={false}
                  name="p99 ms"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="text-sm mb-2 text-gray-300">
            Top operations by volume (success vs error)
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={componentOps} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="operation" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937' }} />
                <Legend />
                <Bar dataKey="success" stackId="a" fill="#34D399" name="success" />
                <Bar dataKey="error" stackId="a" fill="#F87171" name="error" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <div className="text-sm mb-2 text-gray-300">Error budget burn (per operation)</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={errorBudgetData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="operation" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937' }} />
              <Legend />
              <Bar dataKey="burnRate" fill="#F59E0B" name="burn rate" />
              <Bar dataKey="remaining" fill="#10B981" name="remaining" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orchestrator Utilization and Recent Activity */}
      {data?.data.orchestrator ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <div className="text-sm mb-2 text-gray-300">Orchestrator • Agent utilization</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(data.data.orchestrator.agentUtilization).map(
                    ([agent, n]) => ({ agent, count: n }),
                  )}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="agent"
                    stroke="#9CA3AF"
                    interval={0}
                    angle={-20}
                    height={60}
                    textAnchor="end"
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937' }} />
                  <Bar dataKey="count" fill="#93C5FD" name="interactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <div className="text-sm mb-2 text-gray-300">Orchestrator • Recent activity</div>
            <div className="max-h-64 overflow-auto text-sm text-gray-200 space-y-1">
              {(data.data.orchestrator.recentActivity || [])
                .slice(-20)
                .reverse()
                .map((line: string, idx: number) => (
                  <div key={idx} className="truncate">
                    • {line}
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HealthBanner({ status }: { status: string }) {
  const color =
    status === 'healthy'
      ? 'bg-green-600'
      : status === 'degraded'
        ? 'bg-amber-500'
        : status === 'unhealthy'
          ? 'bg-red-600'
          : 'bg-gray-600';

  const accessibleLabelMap: Record<string, string> = {
    healthy: 'System health is healthy',
    degraded: 'System health degraded. Some components impaired',
    unhealthy: 'System health critical. Immediate attention required',
    unknown: 'System health unknown',
    error: 'System health error state',
  };

  const liveMessage = accessibleLabelMap[status] || `System health ${status}`;

  return (
    <div
      className="flex items-center gap-2 text-xs"
      role="status"
      aria-live={status === 'healthy' ? 'polite' : 'assertive'}
      aria-atomic="true"
      title={liveMessage}
    >
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${color}`}
        aria-hidden="true"
        data-health-indicator={status}
      />
      <span className="uppercase tracking-wide text-gray-300">Health: {status}</span>
      {/* Visually hidden expanded message for screen readers */}
      <span className="sr-only">{liveMessage}</span>
    </div>
  );
}
