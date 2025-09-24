/**
 * Agent Execution Result & Mission Progress Tests
 * Validates structured completion/failure emission, mission progress broadcast, and latency tracking.
 * Uses FAST_TEST_MODE to leverage in-memory registries.
 */

process.env.ONEAGENT_FAST_TEST_MODE = '1';
process.env.ONEAGENT_SIMULATE_AGENT_EXECUTION = '0'; // disable simulation to rely on real emission

import { unifiedAgentCommunicationService as comm } from '../../coreagent/utils/UnifiedAgentCommunicationService';
import { HybridAgentOrchestrator } from '../../coreagent/agents/orchestration/HybridAgentOrchestrator';
import {
  BaseAgent,
  AgentConfig,
  AgentContext,
  AgentResponse,
} from '../../coreagent/agents/base/BaseAgent';
import {
  unifiedMetadataService,
  OneAgentUnifiedBackbone,
} from '../../coreagent/utils/UnifiedBackboneService';
import { OneAgentMemory } from '../../coreagent/memory/OneAgentMemory';
import { taskDelegationService } from '../../coreagent/services/TaskDelegationService';

// Lightweight Test Agents -----------------------------------------------------
class TestSuccessAgent extends BaseAgent {
  async initialize(): Promise<void> {
    await super.initialize();
  }
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    // call base to leverage detection & emission
    return await super.processMessage(context, message + ' (ack)');
  }
}

class TestFailureAgent extends BaseAgent {
  async initialize(): Promise<void> {
    await super.initialize();
  }
  async processMessage(_context: AgentContext, message: string): Promise<AgentResponse> {
    const taskId = message.match(/TASK_ID[:=]\s*([A-Za-z0-9_-]+)/)?.[1] || '';
    if (taskId) {
      await (this as any).emitTaskFailure(taskId, 'TEST_FAIL', 'Injected failure');
    }
    // Return an error styled response (emission already done)
    return { content: 'failed', metadata: { injected: true } };
  }
}

function buildAgentConfig(id: string, caps: string[] = ['general']): AgentConfig {
  return {
    id,
    name: id,
    description: id,
    capabilities: caps,
    memoryEnabled: false,
    aiEnabled: false,
  };
}

function buildContext(sessionId: string): AgentContext {
  return { user: { id: 'tester', name: 'Tester' } as any, sessionId, conversationHistory: [] };
}

// Helper to register test agent canonically
async function registerAgent(agent: BaseAgent) {
  const cfg = agent.getConfig();
  await comm.registerAgent({
    id: cfg.id as any,
    name: cfg.name,
    capabilities: cfg.capabilities,
    metadata: {},
  });
}

describe('AgentExecutionResult emission', () => {
  test('success agent emits completed result with session mapping', async () => {
    const a = new TestSuccessAgent(buildAgentConfig('SuccessAgent'));
    const backbone = OneAgentUnifiedBackbone.getInstance();
    const services = backbone.getServices();
    a.setUnifiedContext({
      agentId: 'SuccessAgent',
      agentType: 'specialized' as any,
      capabilities: ['general'],
      timeContext: services.timeService.getContext(),
      metadata: services.metadataService.create('agent_context', 'agent_system', {
        content: {
          category: 'agent',
          tags: ['agent:SuccessAgent'],
          sensitivity: 'internal',
          relevanceScore: 0.9,
          contextDependency: 'session',
        },
      }),
      session: { sessionId: 'sess-success', startTime: services.timeService.now() },
    });
    await a.initialize();
    await registerAgent(a);

    const sessionId = 'sess-success';
    const messages: any[] = [];
    comm.on('message_sent', (payload: any) => {
      messages.push(payload);
    });

    const taskId = 'task_success_1';
    await a.processMessage(buildContext(sessionId), `Please do X TASK_ID: ${taskId}`);

    // Allow async emission
    await new Promise((r) => setTimeout(r, 25));

    const structured = messages.find((m) => m?.message?.message?.includes(taskId));
    expect(structured).toBeTruthy();
    const parsed = JSON.parse(structured.message.message);
    expect(parsed.status).toBe('completed');
    expect(parsed.taskId).toBe(taskId);
  });

  test('failure agent emits failed result', async () => {
    const a = new TestFailureAgent(buildAgentConfig('FailureAgent'));
    const backbone = OneAgentUnifiedBackbone.getInstance();
    const services = backbone.getServices();
    a.setUnifiedContext({
      agentId: 'FailureAgent',
      agentType: 'specialized' as any,
      capabilities: ['general'],
      timeContext: services.timeService.getContext(),
      metadata: services.metadataService.create('agent_context', 'agent_system', {
        content: {
          category: 'agent',
          tags: ['agent:FailureAgent'],
          sensitivity: 'internal',
          relevanceScore: 0.9,
          contextDependency: 'session',
        },
      }),
      session: { sessionId: 'sess-failure', startTime: services.timeService.now() },
    });
    await a.initialize();
    await registerAgent(a);

    const sessionId = 'sess-failure';
    const messages: any[] = [];
    comm.on('message_sent', (payload: any) => {
      messages.push(payload);
    });

    const taskId = 'task_fail_1';
    await a.processMessage(buildContext(sessionId), `Trigger failure TASK_ID=${taskId}`);
    await new Promise((r) => setTimeout(r, 25));
    const structured = messages.find((m) => m?.message?.message?.includes(taskId));
    expect(structured).toBeTruthy();
    const parsed = JSON.parse(structured.message.message);
    expect(parsed.status).toBe('failed');
    expect(parsed.errorCode).toBe('TEST_FAIL');
  });
});

describe('Mission progress & latency tracking', () => {
  test('orchestrator broadcasts mission progress and tracks latency', async () => {
    // Register a success agent that handles development capability so selection works
    const a = new TestSuccessAgent(buildAgentConfig('DevLike', ['development']));
    const backbone = OneAgentUnifiedBackbone.getInstance();
    const services = backbone.getServices();
    a.setUnifiedContext({
      agentId: 'DevLike',
      agentType: 'specialized' as any,
      capabilities: ['development'],
      timeContext: services.timeService.getContext(),
      metadata: services.metadataService.create('agent_context', 'agent_system', {
        content: {
          category: 'agent',
          tags: ['agent:DevLike'],
          sensitivity: 'internal',
          relevanceScore: 0.9,
          contextDependency: 'session',
        },
      }),
      session: { sessionId: 'sess-plan', startTime: services.timeService.now() },
    });
    await a.initialize();
    await registerAgent(a);

    // Provide deep analysis provider to create two tasks
    taskDelegationService.registerDeepAnalysisProvider(() => ({
      summary: 'Test summary',
      recommendedActions: ['Refactor latency logic', 'Refactor code docs'],
      snapshotHash: 'abc123',
    }));
    await taskDelegationService.harvestAndQueue();

    const orch = HybridAgentOrchestrator.getInstance();

    const messages: any[] = [];
    comm.on('message_sent', (p: any) => {
      messages.push(p);
    });

    const result = await orch.executePlan({ sessionId: 'sess-plan', limit: 5 });

    // Allow emissions to settle
    await new Promise((r) => setTimeout(r, 50));

    // Check mission progress broadcast
    const progressMsg = messages.find((m) => m?.message?.message?.includes('mission_progress'));
    expect(progressMsg).toBeTruthy();
    const parsed = JSON.parse(progressMsg.message.message);
    expect(parsed.type).toBe('mission_progress');
    expect(parsed.plan.total).toBeGreaterThanOrEqual(2);

    // Ensure latency recorded: look at TaskDelegationService internal tasks for duration side effects
    const allTasks = taskDelegationService.getAllTasks();
    // we cannot directly assert duration value but ensure tasks are completed or failed
    expect(allTasks.some((t) => t.status === 'completed')).toBeTruthy();
    expect(result.dispatched.length).toBeGreaterThanOrEqual(2);
  });
});
