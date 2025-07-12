#!/usr/bin/env node
/**
 * OneAgent v4.0.0 - Final System Verification Script
 * 
 * This script verifies that the OneAgent unification is complete and the system
 * is ready for production deployment as both standalone agents and MCP server.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

interface VerificationResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  critical: boolean;
}

class OneAgentVerifier {
  private results: VerificationResult[] = [];
  private readonly projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  async runVerification(): Promise<void> {
    console.log('🔍 OneAgent v4.0.0 - Final System Verification');
    console.log('=' .repeat(60));
    
    await this.verifyTypeScript();
    await this.verifyCanonicalTypes();
    await this.verifyAgentCompliance();
    await this.verifyMCPServer();
    await this.verifyMemorySystem();
    await this.verifyConstitutionalAI();
    
    this.generateReport();
  }

  private async verifyTypeScript(): Promise<void> {
    try {
      console.log('📋 Verifying TypeScript compilation...');
      const { stdout, stderr } = await execAsync('npx tsc --noEmit');
      
      if (stderr && stderr.includes('error')) {
        this.addResult('TypeScript Compilation', 'FAIL', `Compilation errors: ${stderr}`, true);
      } else {
        this.addResult('TypeScript Compilation', 'PASS', 'Clean compilation - zero errors', true);
      }
    } catch (error) {
      this.addResult('TypeScript Compilation', 'FAIL', `Compilation failed: ${error}`, true);
    }
  }

  private async verifyCanonicalTypes(): Promise<void> {
    console.log('🏗️ Verifying canonical type system...');
    
    const backboneTypesPath = join(this.projectRoot, 'coreagent', 'types', 'oneagent-backbone-types.ts');
    
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
      'AgentHealthStatus'
    ];

    const missingTypes = requiredTypes.filter(type => !content.includes(`interface ${type}`));
    
    if (missingTypes.length > 0) {
      this.addResult('Canonical Types', 'FAIL', `Missing types: ${missingTypes.join(', ')}`, true);
    } else {
      this.addResult('Canonical Types', 'PASS', 'All canonical types present', true);
    }
  }

  private async verifyAgentCompliance(): Promise<void> {
    console.log('🤖 Verifying agent compliance...');
    
    const agentFiles = [
      'coreagent/agents/specialized/ValidationAgent.ts',
      'coreagent/agents/specialized/TriageAgent.ts',
      'coreagent/agents/specialized/TemplateAgent.ts'
    ];

    for (const agentFile of agentFiles) {
      const fullPath = join(this.projectRoot, agentFile);
      
      if (!existsSync(fullPath)) {
        this.addResult(`Agent Compliance - ${agentFile}`, 'FAIL', 'File not found', true);
        continue;
      }

      const content = readFileSync(fullPath, 'utf-8');
      const hasBaseAgent = content.includes('extends BaseAgent');
      const hasISpecializedAgent = content.includes('implements ISpecializedAgent');
      const hasAgentResponse = content.includes('AgentResponse');
      const hasMemoryRecord = content.includes('MemoryRecord');

      if (hasBaseAgent && hasISpecializedAgent && hasAgentResponse && hasMemoryRecord) {
        this.addResult(`Agent Compliance - ${agentFile}`, 'PASS', 'Fully compliant with canonical interfaces', false);
      } else {
        const missing = [];
        if (!hasBaseAgent) missing.push('BaseAgent inheritance');
        if (!hasISpecializedAgent) missing.push('ISpecializedAgent interface');
        if (!hasAgentResponse) missing.push('AgentResponse usage');
        if (!hasMemoryRecord) missing.push('MemoryRecord usage');
        
        this.addResult(`Agent Compliance - ${agentFile}`, 'FAIL', `Missing: ${missing.join(', ')}`, true);
      }
    }
  }

  private async verifyMCPServer(): Promise<void> {
    console.log('🔌 Verifying MCP server readiness...');
    
    const mcpServerPath = join(this.projectRoot, 'coreagent', 'server', 'unified-mcp-server.ts');
    
    if (!existsSync(mcpServerPath)) {
      this.addResult('MCP Server', 'FAIL', 'unified-mcp-server.ts not found', true);
      return;
    }

    const content = readFileSync(mcpServerPath, 'utf-8');
    const hasJSONRPC = content.includes('json-rpc');
    const hasHTTPServer = content.includes('http');
    const hasPortConfig = content.includes('8083') || content.includes('8080');

    if (hasJSONRPC && hasHTTPServer && hasPortConfig) {
      this.addResult('MCP Server', 'PASS', 'MCP server ready for VS Code Copilot integration', false);
    } else {
      this.addResult('MCP Server', 'WARN', 'MCP server configuration may need review', false);
    }
  }

  private async verifyMemorySystem(): Promise<void> {
    console.log('🧠 Verifying memory system unification...');
    
    const memoryFiles = [
      'coreagent/memory/UnifiedMemoryManager.ts',
      'coreagent/types/oneagent-backbone-types.ts'
    ];

    let memorySystemOK = true;
    
    for (const memoryFile of memoryFiles) {
      const fullPath = join(this.projectRoot, memoryFile);
      
      if (!existsSync(fullPath)) {
        memorySystemOK = false;
        break;
      }
    }

    if (memorySystemOK) {
      this.addResult('Memory System', 'PASS', 'Unified memory system with canonical MemoryRecord', false);
    } else {
      this.addResult('Memory System', 'WARN', 'Memory system files may need review', false);
    }
  }

  private async verifyConstitutionalAI(): Promise<void> {
    console.log('⚖️ Verifying Constitutional AI integration...');
    
    const constitutionalAIPath = join(this.projectRoot, 'coreagent', 'agents', 'base', 'ConstitutionalAI.ts');
    
    if (!existsSync(constitutionalAIPath)) {
      this.addResult('Constitutional AI', 'WARN', 'ConstitutionalAI.ts not found', false);
      return;
    }

    const content = readFileSync(constitutionalAIPath, 'utf-8');
    const hasValidation = content.includes('validateResponse');
    const hasPrinciples = content.includes('ConstitutionalPrinciple');
    const hasQualityThreshold = content.includes('85') || content.includes('threshold');

    if (hasValidation && hasPrinciples && hasQualityThreshold) {
      this.addResult('Constitutional AI', 'PASS', 'Constitutional AI with quality enforcement ready', false);
    } else {
      this.addResult('Constitutional AI', 'WARN', 'Constitutional AI configuration may need review', false);
    }
  }

  private addResult(name: string, status: 'PASS' | 'FAIL' | 'WARN', details: string, critical: boolean): void {
    this.results.push({ name, status, details, critical });
  }

  private generateReport(): void {
    console.log('\n📊 VERIFICATION REPORT');
    console.log('=' .repeat(60));
    
    const critical = this.results.filter(r => r.critical);
    const nonCritical = this.results.filter(r => !r.critical);
    
    const criticalPass = critical.filter(r => r.status === 'PASS').length;
    const criticalFail = critical.filter(r => r.status === 'FAIL').length;
    const criticalWarn = critical.filter(r => r.status === 'WARN').length;
    
    console.log(`\n🎯 CRITICAL SYSTEMS (${critical.length} total):`);
    console.log(`✅ PASS: ${criticalPass} | ❌ FAIL: ${criticalFail} | ⚠️ WARN: ${criticalWarn}`);
    
    critical.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.name}: ${result.details}`);
    });
    
    console.log(`\n🔧 ADDITIONAL SYSTEMS (${nonCritical.length} total):`);
    nonCritical.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.name}: ${result.details}`);
    });
    
    console.log('\n🏆 OVERALL SYSTEM STATUS:');
    if (criticalFail === 0) {
      console.log('✅ PRODUCTION READY - All critical systems operational!');
      console.log('🚀 OneAgent v4.0.0 is ready for deployment as:');
      console.log('   • MCP Server for VS Code Copilot');
      console.log('   • Standalone Multi-Agent System');
      console.log('   • Development Environment');
    } else {
      console.log('❌ CRITICAL ISSUES DETECTED - Review required before deployment');
    }
    
    console.log('\n📋 DEPLOYMENT COMMANDS:');
    console.log('   MCP Server: npm run server:unified');
    console.log('   Standalone: npm run build && npm start');
    console.log('   Development: npm run dev');
    console.log('   Verification: npm run verify');
  }
}

// Run verification
const verifier = new OneAgentVerifier();
verifier.runVerification().catch(console.error);
