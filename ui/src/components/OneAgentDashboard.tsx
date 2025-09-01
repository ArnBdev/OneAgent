import React from 'react';
import { useMetricsPolling } from '../hooks/useMetricsPolling';
import { useMetricsSummary } from '../hooks/useMetricsSummary';

// Keep TS interface aligned with backend MetricLog (coreagent/services/MetricsService.ts)
export interface MetricLog {
  taskId: string;
  timestampIso: string;
  userId: string;
  agentId: string;
  query: string;
  latencyMs: number;
  vectorResultsCount: number;
  graphResultsCount: number;
  finalContextSize: number;
  finalAnswer?: string;
}

export const OneAgentDashboard: React.FC = () => {
  const {
    data: metrics,
    loading,
    error,
    refresh,
    pollingIntervalMs,
    setPollingIntervalMs,
    lastUpdated,
    failureCount,
  } = useMetricsPolling({ count: 8, intervalMs: 3000 });
  const { summary } = useMetricsSummary(15000);

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight">OneAgent Live Metrics</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Interval:</span>
          <select
            className="bg-background border px-2 py-1 rounded"
            value={pollingIntervalMs}
            onChange={(e) => setPollingIntervalMs(Number(e.target.value))}
          >
            <option value={0}>Paused</option>
            <option value={3000}>3s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
          </select>
          <button onClick={refresh} className="border rounded px-3 py-1 hover:bg-accent transition">
            Refresh
          </button>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden shadow-sm bg-card mb-6">
        <div className="p-3 flex flex-wrap gap-6 text-xs">
          <div>
            <div className="font-semibold">Recent Total</div>
            <div>{summary?.stats.total ?? 0}</div>
          </div>
          <div>
            <div className="font-semibold">Avg Latency</div>
            <div>{summary ? `${summary.stats.latency.average}ms` : '—'}</div>
          </div>
          <div>
            <div className="font-semibold">P95 Latency</div>
            <div>{summary ? `${summary.stats.latency.p95}ms` : '—'}</div>
          </div>
          <div>
            <div className="font-semibold">Ops (5m)</div>
            <div>{summary?.opSummary.totalOperations ?? 0}</div>
          </div>
          <div>
            <div className="font-semibold">Error Rate Top</div>
            <div>{formatTopError(summary)}</div>
          </div>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <Th>Time</Th>
              <Th>Task</Th>
              <Th>User</Th>
              <Th>Agent</Th>
              <Th>Query</Th>
              <Th className="text-right">Latency</Th>
              <Th className="text-right">Vector</Th>
              <Th className="text-right">Graph</Th>
              <Th className="text-right">Context</Th>
            </tr>
          </thead>
          <tbody>
            {metrics.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-muted-foreground">
                  No metrics yet.
                </td>
              </tr>
            )}
            {metrics.map((m: MetricLog) => (
              <tr key={m.taskId} className="border-t border-border/60 hover:bg-muted/30">
                <Td>{formatTime(m.timestampIso)}</Td>
                <Td className="font-mono max-w-[120px] truncate">
                  <span title={m.taskId}>{m.taskId.split('-').slice(-2).join('-')}</span>
                </Td>
                <Td className="font-mono">
                  <span title={m.userId}>{m.userId}</span>
                </Td>
                <Td className="font-mono">
                  <span title={m.agentId}>{m.agentId}</span>
                </Td>
                <Td className="max-w-[280px] truncate">
                  <span title={m.query}>{m.query}</span>
                </Td>
                <Td className="text-right tabular-nums">{m.latencyMs}ms</Td>
                <Td className="text-right tabular-nums">{m.vectorResultsCount}</Td>
                <Td className="text-right tabular-nums">{m.graphResultsCount}</Td>
                <Td className="text-right tabular-nums">{m.finalContextSize}</Td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && (
          <div className="p-3 text-xs text-muted-foreground border-t animate-pulse">Loading...</div>
        )}
        {error && (
          <div className="p-3 text-xs text-destructive border-t">
            Fetch error (attempts: {failureCount}): {error.message}
          </div>
        )}
        <div className="p-2 text-[10px] text-muted-foreground flex justify-between border-t">
          <span>Updated: {lastUpdated ? formatRelative(lastUpdated) : '—'}</span>
          <span>Records: {metrics.length}</span>
        </div>
      </div>
    </div>
  );
};

function Th({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th
      className={`px-3 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour12: false });
  } catch {
    return iso;
  }
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 2000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default OneAgentDashboard;

function formatTopError(summary: ReturnType<typeof useMetricsSummary>['summary']): string {
  if (!summary) return '—';
  let max = 0;
  let comp = '';
  for (const [k, v] of Object.entries(summary.opSummary.components)) {
    if (v.totals.errorRate > max) {
      max = v.totals.errorRate;
      comp = k;
    }
  }
  return comp ? `${comp} ${(max * 100).toFixed(1)}%` : '0%';
}
