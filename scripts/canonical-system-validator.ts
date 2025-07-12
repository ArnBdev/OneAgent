#!/usr/bin/env node

/**
 * OneAgent Canonical System Validator
 * 
 * Validates the canonical system integrity including:
 * - Canonical type system compliance
 * - Agent architecture conformity
 * - Memory system consistency
 * - Constitutional AI integration
 * - MCP server functionality
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ValidationResult {
  category: string;
  checks: ValidationCheck[];
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

class CanonicalSystemValidator {
  private projectRoot: string;
  private results: ValidationResult[] = [];

  constructor() {
    this.projectRoot = process.cwd();
  }

  async validate(): Promise<void> {
    console.log('🔍 OneAgent Canonical System Validation');
    console.log('=' .repeat(60));

    // Core validation categories
    await this.validateCanonicalTypes();
    await this.validateAgentArchitecture();
    await this.validateMemorySystem();
    await this.validateConstitutionalAI();
    await this.validateMCPIntegration();
    await this.validateBuildSystem();

    // Generate report
    this.generateReport();
  }

  private async validateCanonicalTypes(): Promise<void> {
    const checks: ValidationCheck[] = [];
    const category = 'Canonical Type System';

    // Check backbone types file exists
    const backboneTypesPath = join(this.projectRoot, 'coreagent', 'types', 'oneagent-backbone-types.ts');
    if (existsSync(backboneTypesPath)) {
      const content = readFileSync(backboneTypesPath, 'utf-8');
      
      // Check for required interfaces
      const requiredInterfaces = [
        'MemoryRecord',
        'MemoryMetadata', 
        'AgentResponse',
        'AgentHealthStatus'
      ];

      for (const interface_name of requiredInterfaces) {
        const hasInterface = content.includes(`interface ${interface_name}`) || content.includes(`export interface ${interface_name}`);
        checks.push({
          name: `${interface_name} interface present`,
          passed: hasInterface,
          message: hasInterface ? `✅ ${interface_name} defined` : `❌ ${interface_name} missing`,
          severity: 'critical' as const
        });
      }

      checks.push({
        name: 'Canonical types file exists',
        passed: true,
        message: '✅ oneagent-backbone-types.ts found',
        severity: 'critical' as const
      });
    } else {
      checks.push({
        name: 'Canonical types file exists',
        passed: false,
        message: '❌ oneagent-backbone-types.ts missing',
        severity: 'critical' as const
      });
    }

    this.results.push({ category, checks });
  }

  private async validateAgentArchitecture(): Promise<void> {
    const checks: ValidationCheck[] = [];
    const category = 'Agent Architecture';

    // Check BaseAgent exists
    const baseAgentPath = join(this.projectRoot, 'coreagent', 'agents', 'base', 'BaseAgent.ts');
    const baseAgentExists = existsSync(baseAgentPath);
    checks.push({
      name: 'BaseAgent foundation',
      passed: baseAgentExists,
      message: baseAgentExists ? '✅ BaseAgent.ts found' : '❌ BaseAgent.ts missing',
      severity: 'critical' as const
    });

    // Check ISpecializedAgent interface
    const specializedAgentPath = join(this.projectRoot, 'coreagent', 'agents', 'base', 'ISpecializedAgent.ts');
    const specializedAgentExists = existsSync(specializedAgentPath);
    checks.push({
      name: 'ISpecializedAgent interface',
      passed: specializedAgentExists,
      message: specializedAgentExists ? '✅ ISpecializedAgent.ts found' : '❌ ISpecializedAgent.ts missing',
      severity: 'critical' as const
    });

    // Check core agents
    const coreAgents = [
      'TriageAgent.ts',
      'ValidationAgent.ts'
    ];

    for (const agentFile of coreAgents) {
      const agentPath = join(this.projectRoot, 'coreagent', 'agents', 'specialized', agentFile);
      const agentExists = existsSync(agentPath);
      
      if (agentExists) {
        const content = readFileSync(agentPath, 'utf-8');
        const extendsBaseAgent = content.includes('extends BaseAgent');
        const implementsSpecialized = content.includes('implements ISpecializedAgent');
        
        checks.push({
          name: `${agentFile} architecture compliance`,
          passed: extendsBaseAgent && implementsSpecialized,
          message: extendsBaseAgent && implementsSpecialized ? 
            `✅ ${agentFile} follows canonical architecture` : 
            `⚠️ ${agentFile} architecture needs review`,
          severity: 'warning' as const
        });
      } else {
        checks.push({
          name: `${agentFile} exists`,
          passed: false,
          message: `❌ ${agentFile} missing`,
          severity: 'critical' as const
        });
      }
    }

    this.results.push({ category, checks });
  }

  private async validateMemorySystem(): Promise<void> {
    const checks: ValidationCheck[] = [];
    const category = 'Memory System';

    // Check for actual memory integration (your real system)
    const memoryFiles = [
      'coreagent/memory/OneAgentMemory.ts',
      'coreagent/agents/communication/MemoryDrivenAgentCommunication.ts',
      'coreagent/memory/BatchMemoryOperations.ts'
    ];

    for (const memoryFile of memoryFiles) {
      const memoryPath = join(this.projectRoot, memoryFile);
      const memoryExists = existsSync(memoryPath);
      checks.push({
        name: `${memoryFile.split('/').pop()} exists`,
        passed: memoryExists,
        message: memoryExists ? `✅ ${memoryFile} found` : `❌ ${memoryFile} missing`,
        severity: memoryExists ? 'info' : 'critical'
      });
    }

    // Check MemoryRecord usage in agents (canonical compliance)
    const triageAgentPath = join(this.projectRoot, 'coreagent', 'agents', 'specialized', 'TriageAgent.ts');
    if (existsSync(triageAgentPath)) {
      const content = readFileSync(triageAgentPath, 'utf-8');
      const usesMemoryRecord = content.includes('MemoryRecord');
      checks.push({
        name: 'Canonical MemoryRecord integration',
        passed: usesMemoryRecord,
        message: usesMemoryRecord ? '✅ MemoryRecord used in agents' : '⚠️ MemoryRecord integration needed',
        severity: 'info'
      });
    }

    // Check for memory tools (MCP integration)
    const memoryTools = [
      'coreagent/tools/OneAgentMemorySearchTool.ts',
      'coreagent/tools/OneAgentMemoryAddTool.ts'
    ];

    for (const toolFile of memoryTools) {
      const toolPath = join(this.projectRoot, toolFile);
      const toolExists = existsSync(toolPath);
      checks.push({
        name: `${toolFile.split('/').pop()} exists`,
        passed: toolExists,
        message: toolExists ? `✅ ${toolFile} found` : `⚠️ ${toolFile} missing`,
        severity: 'info'
      });
    }

    this.results.push({ category, checks });
  }

  private async validateConstitutionalAI(): Promise<void> {
    const checks: ValidationCheck[] = [];
    const category = 'Constitutional AI';

    // Check Constitutional AI components
    const constitutionalFiles = [
      'coreagent/agents/base/ConstitutionalAI.ts',
      'coreagent/validation/ConstitutionalValidator.ts'
    ];

    for (const constitutionalFile of constitutionalFiles) {
      const constitutionalPath = join(this.projectRoot, constitutionalFile);
      const constitutionalExists = existsSync(constitutionalPath);
      checks.push({
        name: `${constitutionalFile.split('/').pop()} exists`,
        passed: constitutionalExists,
        message: constitutionalExists ? `✅ ${constitutionalFile} found` : `⚠️ ${constitutionalFile} missing`,
        severity: 'warning' as const
      });
    }

    this.results.push({ category, checks });
  }

  private async validateMCPIntegration(): Promise<void> {
    const checks: ValidationCheck[] = [];
    const category = 'MCP Server Integration';

    // Check MCP server
    const mcpServerPath = join(this.projectRoot, 'coreagent', 'server', 'unified-mcp-server.ts');
    const mcpServerExists = existsSync(mcpServerPath);
    checks.push({
      name: 'Unified MCP Server',
      passed: mcpServerExists,
      message: mcpServerExists ? '✅ unified-mcp-server.ts found' : '❌ unified-mcp-server.ts missing',
      severity: 'critical' as const
    });

    // Check OneAgent Engine
    const enginePath = join(this.projectRoot, 'coreagent', 'OneAgentEngine.ts');
    const engineExists = existsSync(enginePath);
    checks.push({
      name: 'OneAgent Engine',
      passed: engineExists,
      message: engineExists ? '✅ OneAgentEngine.ts found' : '❌ OneAgentEngine.ts missing',
      severity: 'critical' as const
    });

    this.results.push({ category, checks });
  }

  private async validateBuildSystem(): Promise<void> {
    const checks: ValidationCheck[] = [];
    const category = 'Build System';

    try {
      // Check TypeScript compilation
      await execAsync('npx tsc --noEmit');
      checks.push({
        name: 'TypeScript compilation',
        passed: true,
        message: '✅ TypeScript compilation clean',
        severity: 'critical'
      });
    } catch {
      checks.push({
        name: 'TypeScript compilation',
        passed: false,
        message: '❌ TypeScript compilation errors',
        severity: 'critical'
      });
    }

    // Check package.json scripts
    const packageJsonPath = join(this.projectRoot, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const requiredScripts = ['server:unified', 'build', 'dev'];
      
      for (const script of requiredScripts) {
        const hasScript = packageJson.scripts && packageJson.scripts[script];
        checks.push({
          name: `${script} script`,
          passed: !!hasScript,
          message: hasScript ? `✅ ${script} script configured` : `⚠️ ${script} script missing`,
          severity: 'warning' as const
        });
      }
    }

    this.results.push({ category, checks });
  }

  private generateReport(): void {
    console.log('\n📊 Canonical System Validation Report');
    console.log('=' .repeat(60));

    let totalChecks = 0;
    let passedChecks = 0;
    let criticalIssues = 0;
    let warnings = 0;

    for (const result of this.results) {
      console.log(`\n📋 ${result.category}`);
      console.log('-'.repeat(40));

      for (const check of result.checks) {
        totalChecks++;
        if (check.passed) {
          passedChecks++;
        } else {
          if (check.severity === 'critical') {
            criticalIssues++;
          } else {
            warnings++;
          }
        }
        console.log(`  ${check.message}`);
      }
    }

    console.log('\n🏆 Summary');
    console.log('=' .repeat(60));
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Critical Issues: ${criticalIssues}`);
    console.log(`Warnings: ${warnings}`);
    console.log(`Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%`);

    if (criticalIssues === 0) {
      console.log('\n🎉 CANONICAL SYSTEM READY');
      console.log('OneAgent v4.0.0 canonical system is operational!');
    } else {
      console.log('\n⚠️ CRITICAL ISSUES FOUND');
      console.log('Please address critical issues before deployment.');
    }
  }
}

// Run validation
const validator = new CanonicalSystemValidator();
validator.validate().catch(console.error);
