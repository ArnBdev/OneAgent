import { parseAndValidateInbound } from '../../coreagent/server/mission-control/validateInboundMessage';
import { validateOutboundMessage } from '../../coreagent/server/mission-control/validateOutboundMessage';

function bench(label: string, fn: () => void, iterations: number) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const end = performance.now();
  return { label, ms: end - start, perOp: (end - start) / iterations };
}

async function main() {
  const inboundSample = JSON.stringify({ type: 'mission_start', command: 'objective' });
  const outboundSample = {
    type: 'mission_update',
    id: 'id',
    timestamp: new Date().toISOString(),
    server: { name: 'x', version: 'y' },
    payload: { missionId: 'm1', status: 'planned' },
  };
  const results = [
    bench('inbound-validate-1k', () => parseAndValidateInbound(inboundSample), 1000),
    bench('outbound-validate-1k', () => validateOutboundMessage(outboundSample), 1000),
  ];
  console.table(
    results.map((r) => ({ label: r.label, totalMs: r.ms.toFixed(2), perOpMs: r.perOp.toFixed(4) })),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
