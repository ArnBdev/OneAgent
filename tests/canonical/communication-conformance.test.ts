/**
 * Communication Conformance Test
 * Validates canonical unifiedAgentCommunicationService and absence of legacy patterns.
 */
import { unifiedAgentCommunicationService } from '../../coreagent/utils/UnifiedAgentCommunicationService';
import { unifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';
import { assertOperationCoverage } from '../utils/monitoringTestUtils';
import { createUnifiedId } from '../../coreagent/utils/UnifiedBackboneService';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

async function run() {
  const agentId = await unifiedAgentCommunicationService.registerAgent({
    id: createUnifiedId('agent','conformance'),
    name: 'ConformanceAgent',
    capabilities: ['conformance','test'],
    metadata: { purpose: 'communication-conformance-test' }
  });

  const discovered = await unifiedAgentCommunicationService.discoverAgents({ capabilities: ['conformance'] });
  if (!discovered.some(a => a.id === agentId)) throw new Error('Agent not discovered');

  const sessionId = await unifiedAgentCommunicationService.createSession({
    name: 'CommConformanceSession',
    participants: [agentId],
    topic: 'Conformance Validation',
    mode: 'collaborative'
  });

  await unifiedAgentCommunicationService.sendMessage({
    sessionId,
    fromAgent: agentId,
    toAgent: undefined,
    content: 'Initial conformance message',
    messageType: 'update'
  });

  const history = await unifiedAgentCommunicationService.getMessageHistory(sessionId, 5);
  if (history.length === 0) throw new Error('History empty');

  const recent = unifiedMonitoringService.getRecentEvents(150);
  const requiredOps = ['registerAgent','discoverAgents','createSession','getSessionInfo','sendMessage','getMessageHistory'];
  assertOperationCoverage(recent, 'UnifiedAgentCommunicationService', requiredOps, { allowSkipOnDisabled: true });

  // Legacy identifiers that must not appear (exact identifier match, not as substring of canonical names)
  const forbidden = ['AgentCommunicationService','A2ACommunicationService','MultiAgentCommunicationService','createCommunicationService('];
  const root = join(process.cwd(), 'coreagent');
  const hits: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (full.includes('node_modules') || full.includes('dist')) continue;
      const st = statSync(full);
      if (st.isDirectory()) walk(full); else if (/\.tsx?$/.test(entry) && !full.endsWith('DeprecatedCommunication.ts')) {
        const txt = readFileSync(full, 'utf8');
        for (const token of forbidden) {
          // Use word boundary or '(' for function to prevent substring false positives like UnifiedAgentCommunicationService
          const pattern = token.endsWith('(')
            ? new RegExp(`\\b${token.replace('(', '\\(')}`,'g')
            : new RegExp(`(?<![A-Za-z0-9_])${token}(?![A-Za-z0-9_])`,'g');
          if (pattern.test(txt)) {
            if (!full.endsWith('DeprecatedCommunication.ts') && !full.endsWith('communication-conformance.test.ts')) {
              hits.push(`${token} -> ${full}`);
            }
          }
        }
      }
    }
  }
  walk(root);
  if (hits.length) throw new Error('Forbidden legacy communication pattern(s):\n' + hits.join('\n'));

  console.log('[communication-conformance.test] PASS', { sessionId, agentId, ops: requiredOps.length, monitoringAssertions: process.env.ONEAGENT_DISABLE_AUTO_MONITORING === '1' ? 'skipped' : 'enforced' });
  if (process.env.ONEAGENT_FAST_TEST_MODE === '1') {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('[communication-conformance.test] FAIL', err);
  process.exit(1);
});
