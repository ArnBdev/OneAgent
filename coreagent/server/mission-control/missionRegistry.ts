import { createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';

/**
 * Mission registry tracks lifecycle state for missions so that the mission_stats channel
 * can emit accurate real-time aggregate metrics without depending on ad-hoc cache keys.
 *
 * Canonical design goals:
 * - No parallel time system (uses createUnifiedTimestamp)
 * - Pure in-memory ephemeral tracking (NOT a persistence layer)
 * - O(1) updates per lifecycle event
 * - Aggregates computed on demand (cheap for expected mission counts)
 */

export type MissionTerminalStatus = 'completed' | 'cancelled' | 'error';
export type MissionNonTerminalStatus =
  | 'planning_started'
  | 'tasks_generated'
  | 'planned'
  | 'execution_started'
  | 'execution_progress';
export type MissionStatus = MissionTerminalStatus | MissionNonTerminalStatus;

interface MissionRecord {
  id: string;
  startUnix: number;
  lastStatus: MissionStatus;
  terminalStatus?: MissionTerminalStatus;
  endUnix?: number; // unix ms when terminal
  durationMs?: number; // filled for terminal statuses
  errorMessage?: string;
  completedCount?: number; // number of progress cycles reaching done
}

class MissionRegistry {
  /**
   * ARCHITECTURAL EXCEPTION: This Map stores active mission records by ID.
   * It is used for runtime mission state tracking, not persistent state.
   * This usage is allowed for mission management infrastructure.
   */
  // eslint-disable-next-line oneagent/no-parallel-cache
  private readonly missions = new Map<string, MissionRecord>();

  /** Test-only: clear all missions (exposed via wrapper). */
  clearAll(): void {
    this.missions.clear();
  }

  recordMissionStart(id: string, startUnix?: number): void {
    if (this.missions.has(id)) return; // idempotent
    const ts = startUnix ?? createUnifiedTimestamp().unix;
    this.missions.set(id, {
      id,
      startUnix: ts,
      lastStatus: 'planning_started',
    });
  }

  recordStatus(id: string, status: MissionStatus, meta?: { error?: string }): void {
    const rec = this.missions.get(id);
    if (!rec) {
      // Late start registration (should be rare)
      this.recordMissionStart(id);
      return this.recordStatus(id, status, meta);
    }
    rec.lastStatus = status;
    if (status === 'execution_progress') {
      // track progress counts (lightweight)
      rec.completedCount = (rec.completedCount ?? 0) + 1;
    }
    if (status === 'error') {
      rec.terminalStatus = 'error';
      rec.errorMessage = meta?.error;
      rec.endUnix = createUnifiedTimestamp().unix;
      rec.durationMs = rec.endUnix - rec.startUnix;
    } else if (status === 'completed') {
      rec.terminalStatus = 'completed';
      rec.endUnix = createUnifiedTimestamp().unix;
      rec.durationMs = rec.endUnix - rec.startUnix;
    } else if (status === 'cancelled') {
      rec.terminalStatus = 'cancelled';
      rec.endUnix = createUnifiedTimestamp().unix;
      rec.durationMs = rec.endUnix - rec.startUnix;
    }
  }

  getStatsSnapshot(): {
    active: number;
    completed: number;
    cancelled: number;
    errors: number;
    avgDurationMs: number | null;
    total: number;
  } {
    let active = 0;
    let completed = 0;
    let cancelled = 0;
    let errors = 0;
    let totalDuration = 0;
    let durationCount = 0;
    for (const rec of this.missions.values()) {
      if (!rec.terminalStatus) {
        active += 1;
      } else if (rec.terminalStatus === 'completed') {
        completed += 1;
        if (typeof rec.durationMs === 'number') {
          totalDuration += rec.durationMs;
          durationCount += 1;
        }
      } else if (rec.terminalStatus === 'cancelled') {
        cancelled += 1;
        if (typeof rec.durationMs === 'number') {
          totalDuration += rec.durationMs;
          durationCount += 1;
        }
      } else if (rec.terminalStatus === 'error') {
        errors += 1;
        if (typeof rec.durationMs === 'number') {
          totalDuration += rec.durationMs;
          durationCount += 1;
        }
      }
    }
    return {
      active,
      completed,
      cancelled,
      errors,
      avgDurationMs: durationCount === 0 ? null : Math.round(totalDuration / durationCount),
      total: this.missions.size,
    };
  }
}

export const missionRegistry = new MissionRegistry();

// Convenience re-exports for external usage
export const recordMissionStart = (id: string, startUnix?: number) =>
  missionRegistry.recordMissionStart(id, startUnix);
export const recordMissionStatus = (id: string, status: MissionStatus, meta?: { error?: string }) =>
  missionRegistry.recordStatus(id, status, meta);
export const getMissionStatsSnapshot = () => missionRegistry.getStatsSnapshot();
export const resetMissionRegistry = () => missionRegistry.clearAll(); // test-only helper
