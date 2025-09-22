import { parseAndValidateInbound } from '../../coreagent/server/mission-control/validateInboundMessage';

describe('parseAndValidateInbound', () => {
  it('rejects invalid JSON', () => {
    const res = parseAndValidateInbound('{oops');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors[0]).toContain('invalid_json');
  });

  it('accepts subscribe message', () => {
    const res = parseAndValidateInbound(JSON.stringify({ type: 'subscribe', channels: ['x'] }));
    expect(res.ok).toBe(true);
  });

  it('rejects subscribe without channels', () => {
    const res = parseAndValidateInbound(JSON.stringify({ type: 'subscribe' }));
    expect(res.ok).toBe(false);
  });

  it('accepts mission_start', () => {
    const res = parseAndValidateInbound(JSON.stringify({ type: 'mission_start', command: 'do X' }));
    expect(res.ok).toBe(true);
  });
});
