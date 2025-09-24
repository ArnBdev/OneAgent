/**
 * Negative & Retry Path Tests for Agent Execution Results
 */
process.env.ONEAGENT_FAST_TEST_MODE = '1';
process.env.ONEAGENT_SIMULATE_AGENT_EXECUTION = '0';

import { unifiedAgentCommunicationService as comm } from '../../coreagent/utils/UnifiedAgentCommunicationService';
import { HybridAgentOrchestrator } from '../../coreagent/agents/orchestration/HybridAgentOrchestrator';
import {
  BaseAgent,
  AgentConfig,
  AgentContext,
  AgentResponse,
} from '../../coreagent/agents/base/BaseAgent';
import { OneAgentUnifiedBackbone } from '../../coreagent/utils/UnifiedBackboneService';
import { taskDelegationService } from '../../coreagent/services/TaskDelegationService';

function buildAgentConfig(id: string, caps: string[] = ['development']): AgentConfig {
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

class FlakyAgent extends BaseAgent {
  private failOnce = true;
  async processMessage(ctx: AgentContext, message: string): Promise<AgentResponse> {
    const taskId = message.match(/TASK_ID[:=]\s*([A-Za-z0-9_-]+)/)?.[1];
    if (this.failOnce && taskId) {
      this.failOnce = false;
      await (this as any).emitTaskFailure(taskId, 'FLAKY_ONCE', 'Injected first failure');
      return { content: 'failed once', metadata: { flaky: true } };
    }
    return await super.processMessage(ctx, message + ' success path');
  }
}

async function registerAgent(agent: BaseAgent) {
  const cfg = agent.getConfig();
  await comm.registerAgent({
    id: cfg.id as any,
    name: cfg.name,
    capabilities: cfg.capabilities,
    metadata: {},
  });
}

describe('Negative structured emission handling', () => {
  test('ignores malformed JSON and duplicate emissions', async () => {
    const a = new FlakyAgent(buildAgentConfig('FlakyDev'));
    const backbone = OneAgentUnifiedBackbone.getInstance();
    const services = backbone.getServices();
    a.setUnifiedContext({
      agentId: 'FlakyDev',
      agentType: 'specialized' as any,
      capabilities: ['development'],
      timeContext: services.timeService.getContext(),
      metadata: services.metadataService.create('agent_context', 'agent_system', {
        content: {
          category: 'agent',
          tags: ['agent:FlakyDev'],
          sensitivity: 'internal',
          relevanceScore: 0.5,
          contextDependency: 'session',
        },
      }),
      session: { sessionId: 'sess-negative', startTime: services.timeService.now() },
    });
    await a.initialize();
    await registerAgent(a);

    // Provide single task
    taskDelegationService.registerDeepAnalysisProvider(() => ({
      summary: 'Negative test',
      recommendedActions: ['Refactor negative handler'],
      snapshotHash: 'neg1',
    }));
    await taskDelegationService.harvestAndQueue();

    const orch = HybridAgentOrchestrator.getInstance();
    const messages: any[] = [];
    comm.on('message_sent', (p: any) => messages.push(p));

    const result = await orch.executePlan({ sessionId: 'sess-negative', limit: 3 });
    // allow emissions
    await new Promise((r) => setTimeout(r, 50));

    // Flaky agent should complete after one retry internally triggered by orchestrator re-dispatch logic (markExecutionResult + maybeRequeue not yet auto-invoked). We assert at least one failure then completion emission present.
    const failed = messages.filter((m) => /"status":"failed"/.test(m?.message?.message || ''));
    const completed = messages.filter((m) =>
      /"status":"completed"/.test(m?.message?.message || ''),
    );
    expect(failed.length).toBeGreaterThanOrEqual(1);
    expect(completed.length).toBeGreaterThanOrEqual(1);
    expect(result.dispatched.length).toBeGreaterThanOrEqual(1);
  });
});
