/**
 * PlannerAgent Core Functionality Test (Manual CLI Execution)
 *
 * Validates critical planning workflow operations using stubbed AI and Constitutional AI
 * to avoid external network dependencies.
 *
 * Steps:
 * 1. Initialize PlannerAgent with stubs
 * 2. Create planning session
 * 3. Decompose objective (AI stub returns JSON tasks)
 * 4. Assign tasks to agents
 * 5. Track progress & generate report
 * 6. Perform constitutional validation of session context
 *
 * Run with:
 *   npx ts-node c:/Users/arne/.cline/mcps/OneAgent/coreagent/tests/planner-agent.test.ts
 */

import { PlannerAgent, PlanningProgressResponse, PlanningReportResponse } from '../agents/specialized/PlannerAgent';
import type { AgentConfig } from '../agents/base/BaseAgent';

// Minimal stub types for clarity
interface ValidateResult { isValid: boolean; score: number; violations: unknown[] }
// Minimal private shape to safely access stubs without using 'any'
interface PlannerAgentPrivate {
  constitutionalAI?: { validateResponse: (...args: unknown[]) => Promise<ValidateResult> };
  aiClient?: { generateContent: (prompt: string) => Promise<string> };
  activePlanningSession?: { tasks: unknown[] };
}

async function runPlannerAgentTest() {
  console.log('🚀 Starting PlannerAgent core workflow test');

  const agentConfig: AgentConfig = {
    id: 'planner_test_agent',
    name: 'Planner Test Agent',
    description: 'Test agent for planning workflows',
    capabilities: ['planning','decomposition','assignment'],
  memoryEnabled: false, // disabled for isolated test (avoid external memory server)
  aiEnabled: false // prevent real SmartGemini initialization
  };

  const planner = new PlannerAgent(agentConfig);

  // Stub Constitutional AI (required or createPlanningSession will throw)
  (planner as unknown as PlannerAgentPrivate).constitutionalAI = {
    // Accept flexible args to satisfy loosened private type contract
    validateResponse: async (..._args: unknown[]): Promise<ValidateResult> => ({
      isValid: true,
      score: 0.95,
      violations: []
    })
  };

  // Stub AI client for deterministic decomposition BEFORE initialize
  (planner as unknown as PlannerAgentPrivate).aiClient = {
    generateContent: async (_prompt: string) => JSON.stringify([
      { title: 'Analyze Requirements', description: 'Gather and clarify project requirements', priority: 'high', complexity: 'moderate', estimatedEffort: 4, dependencies: [], requiredSkills: ['analysis'] },
      { title: 'Design Architecture', description: 'Create system design and architecture docs', priority: 'critical', complexity: 'complex', estimatedEffort: 8, dependencies: ['Analyze Requirements'], requiredSkills: ['architecture'] },
      { title: 'Implement Core Modules', description: 'Develop core system components', priority: 'high', complexity: 'complex', estimatedEffort: 16, dependencies: ['Design Architecture'], requiredSkills: ['coding'] }
    ])
  };

  await planner.initialize();

  // 1. Create planning session
  const sessionContext = {
    projectId: 'proj_demo',
    objective: 'Deliver MVP of planning system',
    constraints: ['timeboxed 2 weeks'],
    resources: ['dev_team','docs'],
    timeframe: '2 weeks',
    stakeholders: ['product','engineering'],
    riskTolerance: 'medium' as const,
    qualityRequirements: ['reliability','clarity'],
    successCriteria: ['MVP delivered','tests passing'],
    constitutionalRequirements: ['accuracy','transparency']
  };
  const session = await planner.createPlanningSession(sessionContext);
  console.assert(session.id.startsWith('planning_'), '❌ Session ID format mismatch');
  console.log('✅ Created planning session:', session.id);

  // 2. Decompose objective
  const tasks = await planner.decomposeObjective(sessionContext.objective, sessionContext, 5);
  console.assert(tasks.length === 3, '❌ Expected 3 tasks from stub decomposition');
  console.log('✅ Decomposed objective into tasks:', tasks.map(t => t.title));

  // 3. Assign tasks
  // Provide custom agents list (mirrors internal capability examples)
  const availableAgents = [
    {
      agentId: 'dev_agent',
      agentType: 'development',
      capabilities: ['coding','architecture','testing'],
      specializations: ['typescript','node.js'],
      performanceMetrics: { taskSuccessRate: 0.9, averageResponseTime: 1.0, qualityScore: 0.9, collaborationRating: 0.85 },
      availability: 'available' as const,
      workloadCapacity: 10,
      currentTasks: [] as string[]
    },
    {
      agentId: 'core_agent',
      agentType: 'core',
      capabilities: ['analysis','synthesis'],
      specializations: ['strategic_thinking'],
      performanceMetrics: { taskSuccessRate: 0.88, averageResponseTime: 1.5, qualityScore: 0.92, collaborationRating: 0.88 },
      availability: 'available' as const,
      workloadCapacity: 5,
      currentTasks: [] as string[]
    }
  ];
  // Cast through unknown to satisfy structural typing without 'any'
  const assignments = await planner.assignTasksToAgents(tasks, availableAgents as unknown as Parameters<typeof planner.assignTasksToAgents>[1]);
  console.assert(assignments.size > 0, '❌ No assignments produced');
  console.log('✅ Task assignments:', Object.fromEntries(assignments));

  // 4. Track progress
  (planner as unknown as PlannerAgentPrivate).activePlanningSession!.tasks = tasks; // attach tasks to session for progress tracking
  const progressResponse = await planner.executeAction('track_progress', {});
  const progressMeta = progressResponse.metadata?.result as PlanningProgressResponse | undefined;
  console.assert(progressMeta?.totalTasks === 3, '❌ Progress totalTasks mismatch');
  console.log('✅ Progress tracking metadata:', progressMeta);

  // 5. Generate report
  const report = await planner.executeAction('generate_report', {});
  const reportMeta = report.metadata?.result as PlanningReportResponse | undefined;
  console.assert(reportMeta?.sessionId === session.id, '❌ Report session mismatch');
  console.log('✅ Generated report');

  // 6. Constitutional validation of session context artifact
  const validation = await planner.executeAction('validate_constitutionally', { content: JSON.stringify(sessionContext) });
  const validationMeta = validation.metadata?.result as ValidateResult | undefined;
  console.assert(validationMeta?.isValid === true, '❌ Validation expected to be true');
  console.log('✅ Constitutional validation passed');

  console.log('\n🎉 PlannerAgent core workflow test completed successfully');
}

runPlannerAgentTest().catch(err => {
  console.error('🔥 PlannerAgent test failed:', err);
  process.exit(1);
});
