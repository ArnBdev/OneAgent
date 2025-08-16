#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * OneAgent Build Verification Script
 * Quick verification that the unified system builds correctly
 */

const { spawn } = require('child_process'); // CommonJS needed for Node script runtime

async function runTscNoEmit() {
  return new Promise((resolve, reject) => {
    // Prefer direct binary path to avoid npx overhead / prompts on Windows
    const path = require('path');
    const bin = path.join(__dirname, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
    const cmd = `${bin} --noEmit`;
    const tsc = spawn(cmd, { stdio: ['ignore', 'pipe', 'pipe'], shell: true });
    let stdout = '';
    let stderr = '';
    const timeoutMs = 90_000; // safeguard against hung compilations
    const timeout = setTimeout(() => {
      try { tsc.kill('SIGKILL'); } catch { /* ignore */ }
      reject(new Error(`tsc timeout after ${timeoutMs/1000}s`));
    }, timeoutMs);
    // Progress ping if slow
    const progressPing = setInterval(() => {
      process.stdout.write('.');
    }, 5000);
    tsc.stdout.on('data', d => { stdout += d.toString(); });
    tsc.stderr.on('data', d => { stderr += d.toString(); });
    tsc.on('close', code => {
      clearTimeout(timeout);
      clearInterval(progressPing);
      if (code === 0) resolve({ stdout, stderr }); else reject(Object.assign(new Error('tsc failed'), { stdout, stderr, code }));
    });
    tsc.on('error', err => { clearTimeout(timeout); clearInterval(progressPing); reject(err); });
  });
}

async function verifyBuild() {
  console.log('🔧 Verifying OneAgent build...\n');
  // Ensure fast test mode for any in-process module loads (child tests set this independently)
  if (process.env.ONEAGENT_FAST_TEST_MODE !== '1') {
    process.env.ONEAGENT_FAST_TEST_MODE = '1';
  }
  
  try {
    // Check TypeScript compilation
    console.log('📋 Checking TypeScript compilation...');
    let tscResult;
    try {
      tscResult = await runTscNoEmit();
    } catch (e) {
      console.log('❌ TypeScript compilation failed');
      console.log(e.stdout || '');
      console.log(e.stderr || e.message);
      return false;
    }
    const { stdout } = tscResult;
    
    if (stdout) {
      // Provide brief feedback (avoid unused var) while keeping logs concise
      const preview = stdout.split('\n').slice(0, 3).join('\n');
      if (preview.trim()) {
        console.log('ℹ️  tsc output (truncated):');
        console.log(preview);
      }
    }
    console.log('✅ TypeScript compilation successful');
    
    // Project-level compile already validates all agents. (Per-file compilation was removed because it ignored tsconfig flags like downlevelIteration and produced false positives.)
    ['coreagent/agents/specialized/TriageAgent.ts','coreagent/agents/specialized/ValidationAgent.ts','coreagent/agents/templates/TemplateAgent.ts']
      .forEach(f=>console.log(`ℹ️  Verified via project compile: ${f}`));
    
    // Run canonical tests (helper uses ts-node transpile-only for speed)
    async function runTsTest(file, extraEnv = {}) {
      const isWin = process.platform === 'win32';
      const cmd = isWin ? `ts-node --transpile-only ${file}` : `npx ts-node --transpile-only ${file}`;
      return new Promise((resolve, reject) => {
        const child = spawn(cmd, {
          env: { ...process.env, ONEAGENT_FAST_TEST_MODE: '1', ONEAGENT_SILENCE_COMM_LOGS: '1', ...extraEnv },
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true
        });
        let stderr = '';
        child.stderr.on('data', d => { stderr += d.toString(); });
        const timeout = setTimeout(() => {
          try { child.kill('SIGKILL'); } catch { /* ignore */ }
          reject(new Error(`Test timeout: ${file}`));
        }, 45_000);
        child.on('close', code => {
          clearTimeout(timeout);
          if (code === 0) resolve(true); else reject(new Error(`Test failed (${code}): ${file}\n${stderr}`));
        });
        child.on('error', err => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }

  console.log('\n🧪 Running communication conformance test (monitoring disabled)...');
  await runTsTest('tests/canonical/communication-conformance.test.ts', { ONEAGENT_DISABLE_AUTO_MONITORING: '1' });
  console.log('✅ Conformance (monitoring disabled) passed (operation assertions skipped)');

  console.log('🧪 Running communication conformance test (monitoring enabled)...');
  await runTsTest('tests/canonical/communication-conformance.test.ts', { ONEAGENT_DISABLE_AUTO_MONITORING: '' });
  console.log('✅ Conformance (monitoring enabled) passed with operation assertions');

  console.log('🧪 Running communication rate limit test (ts-node)...');
  await runTsTest('tests/canonical/communication-rate-limit.test.ts');
  console.log('✅ Communication rate limit test passed');

  console.log('🧪 Running unified config provider basic test...');
  await runTsTest('tests/canonical/config-provider-basic.test.ts', { ONEAGENT_DISABLE_AUTO_MONITORING: '' });
  console.log('✅ Unified config provider test passed');

  console.log('🧪 Running unified config provider advanced test...');
  await runTsTest('tests/canonical/config-provider-advanced.test.ts', { ONEAGENT_DISABLE_AUTO_MONITORING: '' });
  console.log('✅ Unified config provider advanced test passed');

    console.log('🔍 Verifying monitoring operation coverage in-process...');
  const requiredOps = ['registerAgent','discoverAgents','createSession','getSessionInfo','sendMessage','getMessageHistory'];
    try {
      process.env.ONEAGENT_DISABLE_AUTO_MONITORING = '';
      process.env.ONEAGENT_SILENCE_COMM_LOGS = '1';
  process.env.ONEAGENT_FAST_TEST_MODE = '1'; // critical: force in-memory registries & skip remote memory writes
      // Enable TypeScript requires for in-process verification (avoid separate spawn)
      let tsNodeRegistered = false;
      try {
        // Avoid double registration
        if (!require.extensions['.ts']) {
          require('ts-node').register({ transpileOnly: true });
          tsNodeRegistered = true;
        }
      } catch (e) {
        throw new Error('ts-node registration failed for in-process verification: ' + (e instanceof Error ? e.message : String(e)));
      }
      const { unifiedAgentCommunicationService } = require('../coreagent/utils/UnifiedAgentCommunicationService');
      const { unifiedMonitoringService } = require('../coreagent/monitoring/UnifiedMonitoringService');
      const { createUnifiedId } = require('../coreagent/utils/UnifiedBackboneService');
      const agentId = await unifiedAgentCommunicationService.registerAgent({
        id: createUnifiedId('agent','verify'),
        name: 'VerifyBuildAgent',
        capabilities: ['verify','test'],
        metadata: { purpose: 'verify-build-dual-mode' }
      });
      await unifiedAgentCommunicationService.discoverAgents({ capabilities: ['verify'] });
      const sessionId = await unifiedAgentCommunicationService.createSession({
        name: 'VerifyBuildSession',
        participants: [agentId],
        topic: 'Verify Coverage',
        mode: 'collaborative'
      });
      await unifiedAgentCommunicationService.sendMessage({
        sessionId,
        fromAgent: agentId,
        toAgent: undefined,
        content: 'verification message',
        messageType: 'update'
      });
      await unifiedAgentCommunicationService.getMessageHistory(sessionId, 5);
      const events = unifiedMonitoringService.getRecentEvents(200).filter(e => e.component === 'UnifiedAgentCommunicationService');
      const presentOps = Array.from(new Set(events.map(e => e.operation).filter(Boolean)));
      const missing = requiredOps.filter(op => !presentOps.includes(op));
      if (missing.length) throw new Error('Missing required monitoring operations: ' + missing.join(', '));
      console.log('✅ Monitoring operation coverage verified in-process:', presentOps.join(', '));
      if (tsNodeRegistered) {
        // Optional: cleanup could occur here if needed
      }
    } catch (err) {
      throw new Error('Monitoring operation coverage verification failed: ' + (err instanceof Error ? err.message : String(err)));
    }

    // Summarize monitored operations (best-effort)
  const { unifiedMonitoringService } = require('../coreagent/monitoring/UnifiedMonitoringService');
  const ops = unifiedMonitoringService.getRecentEvents(300).filter(e => e.component === 'UnifiedAgentCommunicationService');
  const opSet = Array.from(new Set(ops.map(e => e.operation || 'unknown'))).sort();
  console.log('📊 Observed communication operations (post verification):', opSet.join(', '));

    console.log('\n🎉 All verifications passed! OneAgent is ready for deployment.');
    return true;
    
  } catch (error) {
    console.error('❌ Build verification failed:', error.message);
    return false;
  }
}

verifyBuild().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
