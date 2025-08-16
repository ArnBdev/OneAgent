#!/usr/bin/env node
/*
 Guardrails Scan: prevent parallel systems & regressions
 - Flags direct config imports in system code
 - Flags legacy communication classes usage
 - Flags Math.random/Date.now in core for IDs/timing (allowed only in perf timing and explicit comments)
 - Flags setInterval/setTimeout missing unref in coreagent
*/

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

function scan() {
  const files = walk(root).filter(f => /\.(ts|js|cjs|mjs)$/.test(f));
  const problems = [];

  for (const file of files) {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    const src = fs.readFileSync(file, 'utf8');

    // 1) Direct config imports in coreagent (system code)
    if (rel.startsWith('coreagent/') && /import\s*\{\s*oneAgentConfig\s*\}/.test(src)) {
      // Allowlist: canonical config modules and backbone may import base config
      const allowed = rel.startsWith('coreagent/config/') || rel === 'coreagent/utils/UnifiedBackboneService.ts';
      if (!allowed) problems.push({ file: rel, rule: 'no-direct-config', msg: 'Use UnifiedBackboneService.getResolvedConfig()' });
    }

    // 2) Legacy comm classes
    if (/(AgentCommunicationService|A2ACommunicationService|MultiAgentCommunicationService)\b/.test(src)) {
      problems.push({ file: rel, rule: 'legacy-comm', msg: 'Use unifiedAgentCommunicationService' });
    }

    // 3) Random/time usage for IDs (core only)
    if (rel.startsWith('coreagent/') && /(Math\.random\(|Date\.now\()/.test(src)) {
      // Allow in explicit perf timing comments and non-ID simulation code
      const allowedPerf = /Keep Date\.now\(\) for performance timing/.test(src);
      const idContexts = /(id|Id|ID|messageId|sessionId|requestId|error_)/;
      if (!allowedPerf && idContexts.test(src)) {
        problems.push({ file: rel, rule: 'non-canonical-time-id', msg: 'Use createUnifiedId()/UnifiedTimeService for IDs' });
      }
    }

    // 4) setInterval/Timeout without unref in coreagent
  if (rel.startsWith('coreagent/') && /(setInterval\(|setTimeout\()/.test(src)) {
      // Skip VS Code webview/extension UI (browser environment has no unref)
      const isVsCodeUi = rel.includes('coreagent/vscode-extension/src');
      if (isVsCodeUi) continue;
      const unrefCount = (src.match(/unref/g) || []).length;
      const intervalCount = (src.match(/setInterval\(/g) || []).length;
      const timeoutCount = (src.match(/setTimeout\(/g) || []).length;
      if ((intervalCount + timeoutCount) > 0 && unrefCount === 0) {
        problems.push({ file: rel, rule: 'timers-unref', msg: 'Call .unref() on background timers' });
      }
    }
  }

  if (problems.length) {
    console.error('❌ Guardrails scan found issues:');
    for (const p of problems) console.error(` - [${p.rule}] ${p.file}: ${p.msg}`);
    process.exit(1);
  } else {
    console.log('✅ Guardrails scan passed: no violations');
  }
}

if (require.main === module) scan();
module.exports = { scan };
