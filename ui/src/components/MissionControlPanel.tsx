import React, { useState } from 'react';
import { useMissionControlWS } from '../hooks/useMissionControlWS';

export const MissionControlPanel: React.FC = () => {
  const {
    status,
    lastError,
    lastMessageAt,
    messages,
    connect,
    disconnect,
    ping,
    whoami,
    url,
    setUrl,
    send,
  } = useMissionControlWS({ autoConnect: true });
  const [channels, setChannels] = useState<string>('');
  const [missionCommand, setMissionCommand] = useState<string>('');

  return (
    <div className="w-full max-w-5xl mx-auto p-4 mt-8 border rounded-lg bg-card shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold tracking-tight">Mission Control WebSocket</h2>
        <div className="text-xs text-muted-foreground">Status: {status}</div>
      </div>
      <div className="flex flex-wrap gap-2 items-center mb-3 text-sm">
        <input
          className="border rounded px-2 py-1 min-w-[280px]"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ws://localhost:8083/ws/mission-control"
        />
        <button className="border rounded px-3 py-1 hover:bg-accent" onClick={() => connect()}>
          Connect
        </button>
        <button className="border rounded px-3 py-1 hover:bg-accent" onClick={disconnect}>
          Disconnect
        </button>
        <button
          className="border rounded px-3 py-1 hover:bg-accent"
          onClick={ping}
          disabled={status !== 'open'}
        >
          Ping
        </button>
        <button
          className="border rounded px-3 py-1 hover:bg-accent"
          onClick={whoami}
          disabled={status !== 'open'}
        >
          Who am I
        </button>
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 min-w-[220px]"
            value={channels}
            onChange={(e) => setChannels(e.target.value)}
            placeholder="channels (comma-separated)"
          />
          <button
            className="border rounded px-3 py-1 hover:bg-accent"
            disabled={status !== 'open'}
            onClick={() => {
              const chans = channels
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
              if (chans.length > 0) {
                const ok = send({ type: 'subscribe', channels: chans });
                if (!ok) {
                  // no-op UI feedback for now
                }
              }
            }}
          >
            Subscribe
          </button>
        </div>
        <div className="ml-auto text-[10px] text-muted-foreground">
          Last message:{' '}
          {lastMessageAt ? lastMessageAt.toLocaleTimeString(undefined, { hour12: false }) : '—'}
        </div>
      </div>

      {lastError && (
        <div className="p-2 mb-3 text-xs text-destructive border rounded">Error: {lastError}</div>
      )}

      <div className="border rounded h-64 overflow-auto bg-background">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 sticky top-0">
            <tr className="text-left">
              <th className="px-2 py-1">Time</th>
              <th className="px-2 py-1">Type</th>
              <th className="px-2 py-1">ID</th>
              <th className="px-2 py-1">Payload</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-2 text-muted-foreground text-center">
                  No messages yet. Connect to start receiving heartbeats.
                </td>
              </tr>
            )}
            {messages.map((m, i) => (
              <tr key={`${m.id}_${i}`} className="border-t border-border/60">
                <td className="px-2 py-1 tabular-nums">{formatTime(m.timestamp)}</td>
                <td className="px-2 py-1 font-mono">{m.type}</td>
                <td className="px-2 py-1 font-mono max-w-[220px] truncate" title={m.id}>
                  {m.id}
                </td>
                <td className="px-2 py-1 font-mono text-[11px]">
                  {m.payload
                    ? jsonPreview(m.payload)
                    : m.error
                      ? `${m.error.code}: ${m.error.message}`
                      : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mission Command Console */}
      <div className="mt-4 p-3 border rounded bg-muted/30 flex flex-col gap-2">
        <div className="text-sm font-medium">Mission Console</div>
        <div className="flex gap-2 items-center">
          <input
            className="flex-1 border rounded px-2 py-1 font-mono text-xs"
            placeholder={'/mission { "objective": "Analyze repo health" }'}
            value={missionCommand}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMissionCommand(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && missionCommand.trim().length > 0) {
                send({ type: 'mission_start', command: missionCommand.trim() });
                setMissionCommand('');
              }
            }}
            disabled={status !== 'open'}
          />
          <button
            className="border rounded px-3 py-1 hover:bg-accent text-sm"
            disabled={status !== 'open' || missionCommand.trim().length === 0}
            onClick={() => {
              if (missionCommand.trim().length === 0) return;
              send({ type: 'mission_start', command: missionCommand.trim() });
              setMissionCommand('');
            }}
          >
            Send Mission
          </button>
        </div>
        <div className="text-[10px] text-muted-foreground">
          Enter a strategic objective. Supports plain text or /mission JSON form.
        </div>
      </div>
    </div>
  );
};
function jsonPreview(obj: unknown): string {
  try {
    const s = JSON.stringify(obj);
    return s.length > 160 ? s.slice(0, 157) + '…' : s;
  } catch {
    return String(obj);
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour12: false });
  } catch {
    return iso;
  }
}
