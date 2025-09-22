import { validateOutboundMessage } from '../../coreagent/server/mission-control/validateOutboundMessage';
import {
  createUnifiedTimestamp,
  createUnifiedId,
} from '../../coreagent/utils/UnifiedBackboneService';

function base() {
  const ts = createUnifiedTimestamp();
  return {
    id: createUnifiedId('system', 'test'),
    timestamp: ts.iso,
    server: { name: 'Test', version: '0.0.0' },
  };
}

describe('Outbound schema conformance (sample set)', () => {
  const samples: any[] = [
    { type: 'heartbeat', ...base() },
    { type: 'pong', ...base() },
    {
      type: 'whoami',
      ...base(),
      payload: { server: 'Test', version: '0.0.0', channels: ['health_delta'] },
    },
    {
      type: 'subscription_ack',
      ...base(),
      payload: { channel: 'health_delta', status: 'subscribed' },
    },
    { type: 'subscription_error', ...base(), error: { code: 'x', message: 'fail' } },
    { type: 'health_delta', ...base(), payload: { status: 'healthy' } },
    { type: 'metrics_tick', ...base(), payload: { p95: 123, p99: 456 } },
    { type: 'mission_ack', ...base(), payload: { missionId: 'm1', status: 'accepted' } },
    { type: 'mission_update', ...base(), payload: { missionId: 'm1', status: 'planning_started' } },
    { type: 'mission_update', ...base(), payload: { missionId: 'm1', status: 'planned' } },
    {
      type: 'mission_update',
      ...base(),
      payload: { missionId: 'm1', status: 'execution_started' },
    },
    {
      type: 'mission_update',
      ...base(),
      payload: {
        missionId: 'm1',
        status: 'execution_progress',
        progress: { taskId: 't1', index: 1, total: 3, status: 'in_progress' },
      },
    },
    { type: 'mission_update', ...base(), payload: { missionId: 'm1', status: 'completed' } },
    { type: 'mission_update', ...base(), payload: { missionId: 'm1', status: 'cancelled' } },
    {
      type: 'mission_update',
      ...base(),
      payload: { missionId: 'm1', status: 'error', error: 'bad' },
    },
  ];
  for (const sample of samples) {
    it(`validates outbound sample type=${sample.type}`, () => {
      const res = validateOutboundMessage(sample);
      if (!res.ok) throw new Error('Schema validation failed: ' + res.errors.join('; '));
      expect(res.ok).toBe(true);
    });
  }
});
