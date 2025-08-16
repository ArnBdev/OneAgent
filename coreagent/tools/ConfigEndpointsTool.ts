/**
 * ConfigEndpointsTool.ts
 * Provides current canonical endpoint snapshot + config hash for diagnostics.
 */
import { UnifiedBackboneService } from '../utils/UnifiedBackboneService';
import { UnifiedConfigProvider } from '../config/UnifiedConfigProvider';
import { UnifiedMCPTool, InputSchema, ToolExecutionResult } from './UnifiedMCPTool';

export class ConfigEndpointsTool extends UnifiedMCPTool {
  constructor() {
    const schema: InputSchema = {
      type: 'object',
      properties: {
        includeHash: { type: 'boolean', description: 'Include config hash in output (default true)' }
      },
      required: []
    };
    super('oneagent_config_endpoints', 'Current canonical endpoint configuration snapshot', schema, 'basic');
  }

  async executeCore(args: { includeHash?: boolean }): Promise<ToolExecutionResult> {
    const includeHash = args.includeHash !== false;
    const cfg = UnifiedBackboneService.getResolvedConfig();
    const endpoints = UnifiedBackboneService.getEndpoints();
    return {
      success: true,
      data: {
        endpoints,
        ...(includeHash && { hash: UnifiedConfigProvider.getHash() }),
        overridesActive: cfg.memoryPort !== UnifiedBackboneService.config.memoryPort || cfg.mcpPort !== UnifiedBackboneService.config.mcpPort,
  timestamp: new Date().toISOString()
      }
    };
  }
}

export default ConfigEndpointsTool;
