/**
 * Rate Limit Test for UnifiedAgentCommunicationService
 * Ensures RATE_LIMIT_MAX_MESSAGES per window is enforced.
 */
import { unifiedAgentCommunicationService } from '../../coreagent/utils/UnifiedAgentCommunicationService';
import { createUnifiedId } from '../../coreagent/utils/UnifiedBackboneService';

describe('communication rate limiting', () => {
  it('enforces max messages per window', async () => {
    const agentId = await unifiedAgentCommunicationService.registerAgent({
      id: createUnifiedId('agent', 'ratelimit'),
      name: 'RateLimitAgent',
      capabilities: ['ratelimit', 'test'],
      metadata: { purpose: 'rate-limit-test' },
    });
    const sessionId = await unifiedAgentCommunicationService.createSession({
      name: 'RateLimitSession',
      participants: [agentId],
      topic: 'Rate Limit Enforcement',
      mode: 'collaborative',
    });
    let lastError: Error | null = null;
    for (let i = 0; i < 31; i++) {
      try {
        await unifiedAgentCommunicationService.sendMessage({
          sessionId,
          fromAgent: agentId,
          toAgent: undefined,
          content: `msg-${i}`,
          messageType: 'update',
        });
      } catch (err) {
        lastError = err as Error;
        break;
      }
    }
    expect(lastError).toBeTruthy();
    const message = (lastError as Error).message;
    const code = (lastError as any).code;
    expect(
      /RATE_LIMIT_EXCEEDED/.test(message) || (code && String(code).includes('RATE_LIMIT_EXCEEDED')),
    ).toBe(true);
    expect(sessionId).toBeTruthy();
  });
});
