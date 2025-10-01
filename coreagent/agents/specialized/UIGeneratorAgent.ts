/**
 * UIGeneratorAgent.ts
 * Canonical generativ UI-agent for OneAgent
 * Arver fra BaseAgent og implementerer ISpecializedAgent.
 */

import {
  BaseAgent,
  AgentConfig,
  AgentContext,
  AgentResponse,
  AgentAction,
} from '../base/BaseAgent';
import { ISpecializedAgent, AgentHealthStatus } from '../base/ISpecializedAgent';
import { UnifiedConfigProvider } from '../../config/UnifiedConfigProvider';
import { createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';

export class UIGeneratorAgent extends BaseAgent implements ISpecializedAgent {
  public readonly id: string;
  public readonly config: AgentConfig;
  private readonly metaPrompt: string = `
Du er en Senior Frontend Developer. Din oppgave er å generere én enkelt, selvstendig React-komponent i en .tsx-fil.
Bruk kun funksjonelle komponenter med hooks. Bruk shadcn/ui-komponenter som <Card>, <Badge>, <Table> osv.
Returner kun ren, uformatert .tsx-kode, uten noen form for innpakning eller markdown.
`;

  constructor(config: AgentConfig) {
    super(config);
    this.config = config;
    this.id = config.id;
  }

  async initialize(): Promise<void> {
    await super.initialize();
  }

  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    const resp = (await this.executeAction(
      'generate_ui',
      { prompt: message },
      context,
    )) as AgentResponse;
    return await this.finalizeResponseWithTaskDetection(message, resp);
  }

  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'generate_ui',
        description: 'Generer React-komponent basert på beskrivelse',
        parameters: { prompt: 'string' },
      },
    ];
  }

  async executeAction(
    action: string | AgentAction,
    params: Record<string, unknown>,
    _context?: AgentContext,
  ): Promise<AgentResponse> {
    const actionType = typeof action === 'string' ? action : action.type;
    if (actionType === 'generate_ui') {
      const prompt = params.prompt as string;
      const fullPrompt = `${this.metaPrompt}\n${prompt}`;
      let code = '';
      if (this.aiClient) {
        try {
          const response = await this.aiClient.generateContent(fullPrompt);
          code = typeof response === 'string' ? response : response?.response || '';
        } catch (err) {
          code = '// LLM generering feilet: ' + (err instanceof Error ? err.message : String(err));
        }
      } else {
        code = '// Ingen LLM-klient initialisert. Simulert kode.';
      }

      // Canonical memory system: store generated code
      if (this.memoryClient) {
        try {
          await this.memoryClient.addMemory({
            content: code,
            metadata: {
              type: 'generated_ui_code',
              technology: 'react-typescript',
              agentId: this.id,
              prompt,
              timestamp: createUnifiedTimestamp(),
              quality_score: 85,
            },
          });
        } catch {
          // Swallow memory errors for safety
        }
      }

      return {
        content: code,
        metadata: {
          agentId: this.id,
          timestamp: createUnifiedTimestamp().iso,
          configHash: UnifiedConfigProvider.getHash(),
        },
      };
    }
    return {
      content: `Action ${actionType} not implemented in UIGeneratorAgent`,
      metadata: { agentId: this.id, timestamp: createUnifiedTimestamp().iso },
    };
  }

  getStatus(): ReturnType<BaseAgent['getStatus']> {
    return super.getStatus();
  }

  getName(): string {
    return super.getName();
  }

  async getHealthStatus(): Promise<AgentHealthStatus> {
    return super.getHealthStatus();
  }

  async cleanup(): Promise<void> {
    await super.cleanup();
  }
}
