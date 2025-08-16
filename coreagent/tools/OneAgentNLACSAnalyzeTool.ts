import { UnifiedBackboneService } from '../utils/UnifiedBackboneService';
import { OneAgentA2AProtocol } from '../protocols/a2a/A2AProtocol';
import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { toolRegistry, ToolCategory } from './ToolRegistry';

type NLACSAnalyzeParams = {
  agentId: string;
  query?: string;
  limit?: number;
};

type NLACSMessage = {
  metadata?: { messageType?: string; timestamp?: string };
  parts?: { text?: string }[];
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
    const { agentId, query, limit } = args;
    const config = UnifiedBackboneService.config;
    const agentCard = {
      protocolVersion: config.a2aProtocolVersion,
      name: agentId,
      description: 'NLACS Analysis Agent',
      url: '',
      version: '1.0.0',
      skills: [],
      capabilities: {},
      defaultInputModes: ['text'],
      defaultOutputModes: ['text'],
    };
    const a2a = new OneAgentA2AProtocol(agentCard);
    await a2a.initialize();
    const messages = await a2a.getAgentMessages({ limit: limit || 10 });
    const analysis = (messages as NLACSMessage[]).map((m) => ({
      messageType: m.metadata?.messageType,
      content: m.parts && m.parts[0] && m.parts[0].text,
      timestamp: m.metadata?.timestamp,
    }));
    return { success: true, data: { agentId, query, analysis } };
  }
}

// Register tool in the canonical registry
toolRegistry.registerTool(new OneAgentNLACSAnalyzeTool(), {
  category: ToolCategory.AGENT_COMMUNICATION,
  constitutionalLevel: 'enhanced',
  priority: 8,
});
