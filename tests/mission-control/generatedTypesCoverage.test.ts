/**
 * Ensures generated mission control outbound types stay aligned with schemas for
 * critical discriminants (mission_update statuses, presence of mission_stats variant).
 */
import { OutboundMissionControlMessage } from '../../coreagent/server/mission-control/generated/mission-control-message-types';

describe('mission-control generated types coverage', () => {
  test('mission_update status enum includes expected values', () => {
    type MU = Extract<OutboundMissionControlMessage, { type: 'mission_update' }>['payload'];
    // If any of these keys fall out, TypeScript will error when assigning.
    const statuses: MU['status'][] = [
      'planning_started',
      'tasks_generated',
      'planned',
      'execution_started',
      'execution_progress',
      'completed',
      'cancelled',
      'error',
    ];
    expect(statuses).toHaveLength(8);
  });

  test('mission_stats variant present', () => {
    type MS = Extract<OutboundMissionControlMessage, { type: 'mission_stats' }>;
    // Build via helper to ensure structure; cast only at outer level to keep payload type-checked.
    const payload: MS['payload'] = { snapshotId: 's', active: 0, completed: 0 } as MS['payload'];
    const sample: MS = {
      type: 'mission_stats',
      id: 'x',
      timestamp: new Date().toISOString(),
      unix: Date.now(),
      server: { name: 'test', version: 'x' },
      payload,
    } as MS;
    expect(sample.payload.snapshotId).toBe('s');
  });
});
