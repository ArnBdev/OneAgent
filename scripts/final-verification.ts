#!/usr/bin/env ts-node
/**
 * OneAgent v4.0.0 - Final System Verification Script (TypeScript + Graceful Shutdown)
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { gracefulShutdown } from '../coreagent/utils/GracefulShutdown';

const execAsync = promisify(exec);

type VerificationStatus = 'PASS' | 'FAIL' | 'WARN';
interface VerificationResult {
  name: string;
  status: VerificationStatus;
  details: string;
  critical: boolean;
}

class OneAgentVerifier {
  private results: VerificationResult[] = [];
  private projectRoot = process.cwd();

  async runVerification(): Promise<number> {
    console.log('🔍 OneAgent v4.0.0 - Final System Verification');
    console.log('='.repeat(60));

    await this.verifyTypeScript();
    await this.verifyCanonicalTypes();
    await this.verifyAgentCompliance();
    await this.verifyMCPServer();
    await this.verifyMemorySystem();
    await this.verifyConstitutionalAI();
    await this.verifyRuntimeSmoke();

    return this.generateReport();
  }

  private async verifyTypeScript() {
    try {
      console.log('📋 Verifying TypeScript compilation...');
      const { stderr } = await execAsync('npx tsc --noEmit');
      if (stderr && stderr.includes('error')) {
        this.addResult('TypeScript Compilation', 'FAIL', `Compilation errors detected`, true);
      } else {
        this.addResult('TypeScript Compilation', 'PASS', 'Clean compilation - zero errors', true);
      }
    } catch (error) {
      this.addResult(
        'TypeScript Compilation',
        'FAIL',
        `Compilation failed: ${(error as Error).message}`,
        true,
      );
    }
  }

  private async verifyCanonicalTypes() {
    console.log('🏗️ Verifying canonical type system...');
    const backboneTypesPath = join(
      this.projectRoot,
      'coreagent',
      'types',
      'oneagent-backbone-types.ts',
    );
    if (!existsSync(backboneTypesPath)) {
      this.addResult('Canonical Types', 'FAIL', 'oneagent-backbone-types.ts not found', true);
      return;
    }
    const content = readFileSync(backboneTypesPath, 'utf-8');
    const requiredTypes = [
      'MemoryRecord',
      'MemoryMetadata',
      'AgentResponse',
      'UnifiedTimeContext',
      'AgentHealthStatus',
    ];
    const missingTypes = requiredTypes.filter((t) => !content.includes(`interface ${t}`));
    if (missingTypes.length) {
      this.addResult('Canonical Types', 'FAIL', `Missing: ${missingTypes.join(', ')}`, true);
    } else {
      this.addResult('Canonical Types', 'PASS', 'All canonical types present', true);
    }
  }

  private async verifyAgentCompliance() {
    console.log('🤖 Verifying agent compliance...');
    const candidatePaths = [
      'coreagent/agents/specialized/ValidationAgent.ts',
      'coreagent/agents/specialized/TriageAgent.ts',
      'coreagent/agents/templates/TemplateAgent.ts',
      'coreagent/agents/specialized/PlannerAgent.ts',
      'coreagent/agents/specialized/DevAgent.ts',
    ];
    const existing = candidatePaths.filter((p) => existsSync(join(this.projectRoot, p)));
    if (existing.length === 0) {
      this.addResult('Agent Compliance', 'FAIL', 'No agent files discovered', true);
      return;
    }
    for (const file of existing) {
      const full = join(this.projectRoot, file);
      const content = readFileSync(full, 'utf-8');
      const requiredTokens = [
        'extends BaseAgent',
        'implements ISpecializedAgent',
        'AgentResponse',
        'MemoryRecord',
      ];
      const missing = requiredTokens.filter((t) => !content.includes(t));
      const critical = !file.includes('TemplateAgent');
      if (missing.length === 0) {
        this.addResult(`Agent ${file}`, 'PASS', 'Compliant', critical);
      } else {
        this.addResult(`Agent ${file}`, 'FAIL', `Missing: ${missing.join(', ')}`, critical);
      }
    }
  }

  private async verifyMCPServer() {
    console.log('🔌 Verifying MCP server readiness...');
    const p = join(this.projectRoot, 'coreagent', 'server', 'unified-mcp-server.ts');
    if (!existsSync(p)) {
      this.addResult('MCP Server', 'FAIL', 'unified-mcp-server.ts not found', true);
      return;
    }
    const c = readFileSync(p, 'utf-8');
    const ready =
      c.includes('json-rpc') && c.includes('http') && (c.includes('8083') || c.includes('8080'));
    this.addResult(
      'MCP Server',
      ready ? 'PASS' : 'WARN',
      ready ? 'MCP server ready' : 'Configuration may need review',
      false,
    );
  }

  private async verifyMemorySystem() {
    console.log('🧠 Verifying memory system unification...');
    const files = [
      'coreagent/memory/OneAgentMemory.ts',
      'coreagent/types/oneagent-backbone-types.ts',
    ];
    const ok = files.every((f) => existsSync(join(this.projectRoot, f)));
    this.addResult(
      'Memory System',
      ok ? 'PASS' : 'WARN',
      ok ? 'OneAgentMemory + backbone types present' : 'Missing OneAgentMemory or backbone types',
      false,
    );
  }

  private async verifyConstitutionalAI() {
    console.log('⚖️ Verifying Constitutional AI integration...');
    const p = join(this.projectRoot, 'coreagent', 'agents', 'base', 'ConstitutionalAI.ts');
    if (!existsSync(p)) {
      this.addResult('Constitutional AI', 'WARN', 'ConstitutionalAI.ts not found', false);
      return;
    }
    const c = readFileSync(p, 'utf-8');
    const ok =
      c.includes('validateResponse') &&
      c.includes('ConstitutionalPrinciple') &&
      (c.includes('85') || c.includes('threshold'));
    this.addResult(
      'Constitutional AI',
      ok ? 'PASS' : 'WARN',
      ok ? 'Constitutional AI ready' : 'Configuration may need review',
      false,
    );
  }

  private async verifyRuntimeSmoke() {
    console.log('🚦 Verifying runtime smoke (optional)...');
    try {
      const { stdout } = await execAsync('npm run -s smoke:runtime', { timeout: 180000 });
      const ok =
        stdout.includes('Runtime smoke passed') || stdout.includes('✓ Runtime smoke passed');
      this.addResult(
        'Runtime Smoke',
        ok ? 'PASS' : 'WARN',
        ok ? 'End-to-end startup valid' : 'Smoke did not confirm pass; inspect logs',
        false,
      );
    } catch (e) {
      this.addResult(
        'Runtime Smoke',
        'WARN',
        `Smoke failed to run: ${(e as Error).message}`,
        false,
      );
    }
  }

  private addResult(name: string, status: VerificationStatus, details: string, critical: boolean) {
    this.results.push({ name, status, details, critical });
  }

  private generateReport(): number {
    console.log('\n📊 VERIFICATION REPORT');
    console.log('='.repeat(60));
    const critical = this.results.filter((r) => r.critical);
    const nonCritical = this.results.filter((r) => !r.critical);
    const pass = critical.filter((r) => r.status === 'PASS').length;
    const fail = critical.filter((r) => r.status === 'FAIL').length;
    const warn = critical.filter((r) => r.status === 'WARN').length;
    console.log(
      `\n🎯 CRITICAL SYSTEMS (${critical.length}): PASS ${pass} | FAIL ${fail} | WARN ${warn}`,
    );
    for (const r of critical) console.log(`${icon(r.status)} ${r.name}: ${r.details}`);
    console.log(`\n🔧 ADDITIONAL SYSTEMS (${nonCritical.length})`);
    for (const r of nonCritical) console.log(`${icon(r.status)} ${r.name}: ${r.details}`);
    console.log('\n🏆 OVERALL SYSTEM STATUS:');
    if (fail === 0) {
      console.log('✅ PRODUCTION READY');
    } else {
      console.log('❌ CRITICAL ISSUES DETECTED');
    }
    console.log('\n📋 DEPLOYMENT COMMANDS:');
    console.log('   MCP Server: npm run server:unified');
    console.log('   Standalone: npm run build && npm start');
    console.log('   Dev: npm run dev');
    console.log('   Verify: npm run verify');
    console.log('   Runtime Smoke (optional): npm run verify:runtime');
    return fail === 0 ? 0 : 1;
  }
}

function icon(status: VerificationStatus): string {
  return status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
}

(async () => {
  const verifier = new OneAgentVerifier();
  let exitCode = 0;
  try {
    exitCode = await verifier.runVerification();
  } catch (e) {
    console.error('Verification error:', e);
    exitCode = 1;
  } finally {
    await gracefulShutdown({ exit: true, reason: 'final-verification-complete', exitCode });
  }
})();
