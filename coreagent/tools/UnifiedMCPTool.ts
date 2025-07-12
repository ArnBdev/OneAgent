// UnifiedMCPTool.ts - Canonical base class for OneAgent MCP tools

export interface InputSchema {
  type: string;
  properties: Record<string, unknown>;
  required?: string[];
}

export interface ToolExecutionResult {
  success: boolean;
  data: unknown;
  qualityScore?: number;
}

export abstract class UnifiedMCPTool {
  public readonly name: string;
  public readonly description: string;
  public readonly schema: InputSchema;
  public readonly category: string;
  public readonly constitutionalLevel: 'basic' | 'enhanced' | 'critical';

  constructor(name: string, description: string, schema: InputSchema, category: string, constitutionalLevel: 'basic' | 'enhanced' | 'critical' = 'enhanced') {
    this.name = name;
    this.description = description;
    this.schema = schema;
    this.category = category;
    this.constitutionalLevel = constitutionalLevel;
  }

  abstract executeCore(args: unknown): Promise<ToolExecutionResult>;

  async execute(args: unknown): Promise<ToolExecutionResult> {
    // Optionally add session/context logic here
    return this.executeCore(args);
  }
}
