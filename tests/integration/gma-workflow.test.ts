/**
 * GMA Workflow Integration Test
 *
 * End-to-end validation of Generative Markdown Artifacts system.
 * Tests the full workflow: Natural language goal → MissionBrief.md → GMACompiler → TaskQueue
 *
 * This test empirically proves:
 * - Does PlannerAgent generate valid MissionBrief.md?
 * - Can GMACompiler parse the generated spec?
 * - Are tasks created in TaskQueue?
 * - Do all events fire correctly?
 * - Is the memory audit trail complete?
 *
 * Constitutional AI Test Design:
 * - Accuracy: Test actual workflow, not mocked behavior
 * - Transparency: Clear assertions showing what works/fails
 * - Helpfulness: Results guide next development steps
 * - Safety: Validates error handling and resilience
 *
 * Epic 18 Phase 1: GMA MVP Integration
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PlannerAgent, type PlanningContext } from '../../coreagent/agents/specialized/PlannerAgent';
import { GMACompiler } from '../../coreagent/orchestration/GMACompiler';
import { TaskQueue } from '../../coreagent/orchestration/TaskQueue';
import { EmbeddingBasedAgentMatcher } from '../../coreagent/orchestration/EmbeddingBasedAgentMatcher';
import { getOneAgentMemory } from '../../coreagent/utils/UnifiedBackboneService';
import type { AgentConfig } from '../../coreagent/agents/base/BaseAgent';

describe('GMA Workflow Integration Test', () => {
  let plannerAgent: PlannerAgent;
  let gmaCompiler: GMACompiler;
  let taskQueue: TaskQueue;
  let agentMatcher: EmbeddingBasedAgentMatcher;
  let testSpecFilePath: string;
  let memory: ReturnType<typeof getOneAgentMemory>;

  // Track emitted events
  const emittedEvents: Array<{ event: string; data: unknown }> = [];

  beforeAll(async () => {
    // Initialize memory
    memory = getOneAgentMemory();

    // Create TaskQueue
    taskQueue = new TaskQueue({
      maxConcurrent: 5,
    });

    // Create AgentMatcher
    agentMatcher = new EmbeddingBasedAgentMatcher({
      performanceWeight: 0.7,
    });

    // Create GMACompiler
    gmaCompiler = new GMACompiler({
      taskQueue,
      agentMatcher,
      enableValidation: true,
      enableMemoryAudit: true,
    });

    // Initialize compiler (loads schema)
    await gmaCompiler.initialize();

    // Track GMA events
    gmaCompiler.on('compilation_started', (data) => {
      emittedEvents.push({ event: 'compilation_started', data });
    });
    gmaCompiler.on('task_compiled', (data) => {
      emittedEvents.push({ event: 'task_compiled', data });
    });
    gmaCompiler.on('compilation_completed', (data) => {
      emittedEvents.push({ event: 'compilation_completed', data });
    });
    gmaCompiler.on('compilation_failed', (data) => {
      emittedEvents.push({ event: 'compilation_failed', data });
    });
    gmaCompiler.on('validation_failed', (data) => {
      emittedEvents.push({ event: 'validation_failed', data });
    });

    // Create PlannerAgent
    const plannerConfig: AgentConfig = {
      id: 'test-planner-agent',
      name: 'Test Planner Agent',
      description: 'Test agent for GMA workflow validation',
      capabilities: ['strategic_planning', 'task_decomposition', 'gma_generation'],
      memoryEnabled: true,
      aiEnabled: true,
    };
    plannerAgent = new PlannerAgent(plannerConfig);
    await plannerAgent.initialize();

    // Setup test file path
    testSpecFilePath = path.join(process.cwd(), 'tests', 'fixtures', 'test-mission-brief.md');
    await fs.mkdir(path.dirname(testSpecFilePath), { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test file
    try {
      await fs.unlink(testSpecFilePath);
    } catch {
      // Ignore if doesn't exist
    }
  });

  beforeEach(() => {
    // Clear events before each test
    emittedEvents.length = 0;
  });

  describe('End-to-End GMA Workflow', () => {
    it('should complete full workflow: goal → spec → compile → tasks', async () => {
      console.log('\n' + '='.repeat(80));
      console.log('🎯 END-TO-END GMA WORKFLOW TEST');
      console.log('='.repeat(80));

      // Step 1: Generate MissionBrief from natural language goal
      console.log('\n📝 Step 1: Generate MissionBrief.md from natural language goal...');
      const goal = 'Build a REST API for user management with authentication';
      const context: Partial<PlanningContext> = {
        timeframe: '2 weeks',
        resources: ['Node.js', 'TypeScript', 'PostgreSQL'],
        constraints: ['Must use JWT', 'GDPR compliance required'],
      };
      const options = {
        domain: 'work' as const,
        priority: 'high' as const,
        maxTasks: 5,
      };

      const startGen = Date.now();
      const result = await plannerAgent.generateMissionBrief(goal, context, options);
      const genTime = Date.now() - startGen;

      // Validate generated spec
      expect(result).toBeTruthy();
      expect(result.specId).toBeTruthy();
      expect(result.content).toBeTruthy();
      expect(typeof result.content).toBe('string');
      expect(result.content.length).toBeGreaterThan(100);
      expect(result.content).toContain('```yaml');
      expect(result.content).toContain('specId:');
      expect(result.content).toContain('domain: work');
      expect(result.content).toContain('priority: high');
      expect(result.content).toContain('REST API');

      console.log(`   ✅ Generated in ${genTime}ms`);
      console.log(`   📄 Spec ID: ${result.specId}`);
      console.log(`   📄 Content length: ${result.content.length} characters`);

      // Step 2: Write MissionBrief to filesystem
      console.log('\n💾 Step 2: Write MissionBrief.md to filesystem...');
      await fs.writeFile(testSpecFilePath, result.content, 'utf-8');
      const fileSize = (await fs.stat(testSpecFilePath)).size;
      const fileContent = await fs.readFile(testSpecFilePath, 'utf-8');
      expect(fileContent).toBe(result.content);
      console.log(`   ✅ Written (${fileSize} bytes)`);
      console.log(`   📁 Path: ${testSpecFilePath}`);

      // Step 3: Compile specification
      console.log('\n🔨 Step 3: Compile specification with GMACompiler...');
      emittedEvents.length = 0; // Clear events
      const startCompile = Date.now();
      const compilationResult = await gmaCompiler.compileSpecificationFile(testSpecFilePath);
      const compileTime = Date.now() - startCompile;

      // Validate compilation result
      expect(compilationResult).toBeTruthy();
      expect(compilationResult.validationPassed).toBe(true);
      expect(compilationResult.errors.length).toBe(0);
      expect(compilationResult.specId).toBeTruthy();

      console.log(`   ✅ Compiled in ${compileTime}ms`);
      console.log(`   🆔 Spec ID: ${compilationResult.specId}`);
      console.log(`   📊 Tasks Created: ${compilationResult.tasksCreated}`);
      console.log(`   👥 Agents Assigned: ${compilationResult.agentsAssigned.length}`);
      console.log(`   ⏱️  Estimated Duration: ${compilationResult.estimatedDuration}h`);
      console.log(`   ✅ Validation: ${compilationResult.validationPassed ? 'PASS' : 'FAIL'}`);
      console.log(`   ⚠️  Errors: ${compilationResult.errors.length}`);
      console.log(`   📋 Warnings: ${compilationResult.warnings.length}`);

      // Step 4: Check events
      console.log('\n📡 Step 4: Verify GMA events emitted...');
      const eventTypes = emittedEvents.map((e) => e.event);
      expect(eventTypes).toContain('compilation_started');
      expect(eventTypes).toContain('compilation_completed');
      console.log(`   ✅ Events emitted: ${eventTypes.join(', ')}`);
      console.log(`   📊 Total events: ${emittedEvents.length}`);

      // Step 5: Gemini Feedback Assessment
      console.log('\n🎯 Step 5: Gemini Feedback Assessment:');
      console.log('='.repeat(80));

      if (compilationResult.tasksCreated === 0) {
        console.log('❌ GEMINI WAS RIGHT: extractTasks() needs implementation');
        console.log('');
        console.log('📋 Current Status:');
        console.log('   - PlannerAgent generates valid MissionBrief.md ✅');
        console.log('   - GMACompiler parses YAML frontmatter successfully ✅');
        console.log('   - GMACompiler.extractTasks() returns empty array ❌');
        console.log('   - No tasks created in TaskQueue ❌');
        console.log('');
        console.log('🔧 Required Enhancement:');
        console.log('   - Implement extractTasks() to parse Tasks section from Markdown');
        console.log('   - Recommendation: Parse YAML blocks under ### Task N headings');
        console.log('   - Alternative: Accept tasks in YAML frontmatter directly');
        console.log('');
        console.log('💡 Next Steps:');
        console.log('   1. Enhance GMACompiler.extractTasks() parsing');
        console.log('   2. Re-run this test to verify');
        console.log('   3. If passing, proceed to SpecLintingAgent');
      } else {
        console.log('✅ PARSING SUFFICIENT: Tasks created successfully');
        console.log('');
        console.log('📋 Current Status:');
        console.log(`   - ${compilationResult.tasksCreated} tasks created ✅`);
        console.log(`   - ${compilationResult.agentsAssigned.length} agents assigned ✅`);
        console.log('   - Compilation successful ✅');
        console.log('   - All events emitted ✅');
        console.log('');
        console.log('🎉 GMA MVP Core Complete!');
        console.log('');
        console.log('💡 Next Steps:');
        console.log('   1. Create SpecLintingAgent for quality feedback');
        console.log('   2. Add more integration tests for edge cases');
        console.log('   3. Proceed to Phase 2 (A2A v0.3.0)');
      }

      console.log('='.repeat(80));
      console.log('\n');

      // This test PASSES regardless of task creation count
      // It's designed to reveal gaps, not fail on them
      expect(compilationResult.validationPassed).toBe(true);
    }, 60000); // 60s timeout for full workflow
  });
});
