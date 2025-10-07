import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { toolRegistry, ToolCategory } from './ToolRegistry';
import { UnifiedAgentCommunicationService } from '../utils/UnifiedAgentCommunicationService';
import type { EmergentInsight, SessionId, A2AGroupSession } from '../types/oneagent-backbone-types';

type NLACSAnalyzeParams = {
  agentId: string;
  query?: string;
  limit?: number;
};

const inputSchema: InputSchema = {
  type: 'object',
  properties: {
    agentId: { type: 'string', description: 'Agent ID to analyze' },
    query: { type: 'string', description: 'Analysis query or focus' },
    limit: { type: 'number', description: 'Number of messages to analyze', default: 10 },
  },
  required: ['agentId'],
};

export class OneAgentNLACSAnalyzeTool extends UnifiedMCPTool {
  constructor() {
    super(
      'oneagent_nlacs_analyze',
      'Analyze agent conversations and collaboration patterns using NLACS',
      inputSchema,
      ToolCategory.AGENT_COMMUNICATION,
      'enhanced',
    );
  }

  async executeCore(args: NLACSAnalyzeParams): Promise<ToolExecutionResult> {
    const { agentId } = args;
    const comms = UnifiedAgentCommunicationService.getInstance();
    // 1. Find all sessions where agentId is a participant (public memory search via comms)
    const sessionResults = await comms['memory'].searchMemory({
      query: `sessions for agent ${agentId}`,
      userId: 'system_nlacs_tool',
      limit: 50,
      filters: { 'sessionData.participants': agentId, entityType: 'A2ASession' },
    });
    const sessions: A2AGroupSession[] = (Array.isArray(sessionResults) ? sessionResults : [])
      .map((r) => {
        const meta = r.metadata as Record<string, unknown>;
        return meta && typeof meta === 'object' && 'sessionData' in meta
          ? (meta['sessionData'] as A2AGroupSession)
          : undefined;
      })
      .filter(
        (s): s is A2AGroupSession =>
          !!s && Array.isArray(s.participants) && s.participants.includes(agentId),
      );

    const insightsBySession: Record<SessionId, EmergentInsight[]> = {};
    for (const session of sessions) {
      try {
        const insights = await comms.synthesizeInsights(session.id);
        insightsBySession[session.id] = insights;
      } catch (err) {
        // Use a valid EmergentInsight type with type 'pattern' and error content
        insightsBySession[session.id] = [
          {
            id: 'error',
            type: 'pattern',
            content: `Failed to synthesize insights for session ${session.id}: ${(err as Error).message}`,
            confidence: 0,
            contributors: [],
            sources: [],
            implications: [],
            actionItems: [],
            createdAt: new Date(),
            relevanceScore: 0,
            metadata: { error: true },
          },
        ];
      }
    }

    return {
      success: true,
      data: {
        agentId,
        sessionCount: sessions.length,
        insightsBySession,
      },
    };
  }
}

// Register tool in the canonical registry
toolRegistry.registerTool(new OneAgentNLACSAnalyzeTool(), {
  category: ToolCategory.AGENT_COMMUNICATION,
  constitutionalLevel: 'enhanced',
  priority: 8,
});
