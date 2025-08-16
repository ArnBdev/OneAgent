/**
 * Rate Limit Test for UnifiedAgentCommunicationService
 * Ensures RATE_LIMIT_MAX_MESSAGES per window is enforced.
 */
import { unifiedAgentCommunicationService } from '../../coreagent/utils/UnifiedAgentCommunicationService';
import { createUnifiedId } from '../../coreagent/utils/UnifiedBackboneService';

async function run() {
  const agentId = await unifiedAgentCommunicationService.registerAgent({
    id: createUnifiedId('agent','ratelimit'),
    name: 'RateLimitAgent',
    capabilities: ['ratelimit','test'],
    metadata: { purpose: 'rate-limit-test' }
  });
  const sessionId = await unifiedAgentCommunicationService.createSession({
    name: 'RateLimitSession',
    participants: [agentId],
    topic: 'Rate Limit Enforcement',
    mode: 'collaborative'
  });
  let lastError: Error | null = null;
  // We know internal limit is 30 in 60s window; send 31 messages rapidly
  for (let i=0;i<31;i++) {
    try {
      await unifiedAgentCommunicationService.sendMessage({
        sessionId,
        fromAgent: agentId,
        toAgent: undefined,
        content: `msg-${i}`,
        messageType: 'update'
      });
    } catch (err) {
      lastError = err as Error;
      break;
    }
  }
  if (!lastError) throw new Error('Expected rate limit error was not thrown');
  interface RateError { code?: string }
  const code = (lastError as RateError).code;
  if (!/RATE_LIMIT_EXCEEDED/.test(lastError.message) && !(code && code.includes('RATE_LIMIT_EXCEEDED'))) {
    throw new Error('Unexpected error instead of rate limit: ' + lastError.message);
  }
  console.log('[communication-rate-limit.test] PASS', { sessionId, agentId });
  // Force early exit to avoid any open handles in fast test mode
  process.exit(0);
}
run().catch(err => { console.error('[communication-rate-limit.test] FAIL', err); process.exit(1); });
