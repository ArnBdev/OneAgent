import {
  recordMissionStart,
  recordMissionStatus,
  getMissionStatsSnapshot,
  resetMissionRegistry,
} from '../../coreagent/server/mission-control/missionRegistry';

describe('missionRegistry aggregation', () => {
  beforeEach(() => {
    resetMissionRegistry();
  });
  test('tracks lifecycle transitions and computes aggregate stats', () => {
    const base = Date.now();
    recordMissionStart('m1', base);
    recordMissionStatus('m1', 'planning_started');
    recordMissionStatus('m1', 'planned');
    recordMissionStatus('m1', 'execution_started');
    recordMissionStatus('m1', 'execution_progress');
    recordMissionStatus('m1', 'completed');

    recordMissionStart('m2', base + 5);
    recordMissionStatus('m2', 'planning_started');
    recordMissionStatus('m2', 'planned');
    recordMissionStatus('m2', 'execution_started');
    recordMissionStatus('m2', 'execution_progress');
    recordMissionStatus('m2', 'cancelled');

    recordMissionStart('m3', base + 10);
    recordMissionStatus('m3', 'planning_started');
    recordMissionStatus('m3', 'error', { error: 'boom' });

    const snap = getMissionStatsSnapshot();
    // m1 + m2 + m3 terminal => active 0
    expect(snap.active).toBe(0);
    expect(snap.completed).toBe(1);
    expect(snap.cancelled).toBe(1);
    expect(snap.errors).toBe(1);
    expect(snap.total).toBe(3);
    // avgDurationMs may be very small but should be number or null if durations recorded
    if (snap.avgDurationMs !== null) {
      expect(typeof snap.avgDurationMs).toBe('number');
    }
  });
});
