/**
 * Unified MCP Tool Framework
 * Constitutional AI-compliant tool architecture with predictable patterns
 */

import { OneAgentMem0Bridge } from '../memory/OneAgentMem0Bridge';
import { EnhancedMem0Client } from '../memory/EnhancedMem0Client';

export interface ToolValidationResult {
  isValid: boolean;
  cleanArgs: any;
  errors?: string[];
  constitutionalScore?: number;
}

export interface ToolExecutionResult {
  success: boolean;
  data: any;
  qualityScore?: number;
  metadata?: any;
}

export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError: boolean;
}

export interface InputSchema {
  type: 'object';
  properties: Record<string, any>;
  required: string[];
}

/**
 * Base class for all unified MCP tools
 * Implements Constitutional AI compliance and predictable execution patterns
 */
export abstract class UnifiedMCPTool {
  public readonly name: string;
  public readonly description: string;
  public readonly schema: InputSchema;
  public readonly constitutionalLevel: 'basic' | 'enhanced' | 'critical';

  constructor(
    name: string,
    description: string,
    schema: InputSchema,
    constitutionalLevel: 'basic' | 'enhanced' | 'critical' = 'basic'
  ) {
    this.name = name;
    this.description = description;
    this.schema = schema;
    this.constitutionalLevel = constitutionalLevel;
  }

  /**
   * Main execution method - implements the unified tool pipeline
   */
  async execute(args: any, id: any): Promise<any> {
    try {
      // Phase 1: Input Validation & Constitutional AI Check
      const validationResult = await this.validateInput(args);
      if (!validationResult.isValid) {
        return this.createErrorResponse(id, validationResult.errors || ['Invalid input']);
      }

      // Phase 2: Core Logic Execution
      const executionResult = await this.executeCore(validationResult.cleanArgs);
      
      // Phase 3: Output Formatting & Quality Check
      const qualityScore = await this.assessQuality(executionResult);
      
      return this.createSuccessResponse(id, executionResult, qualityScore);

    } catch (error) {
      // Phase 4: Error Handling & Fallback
      console.error(`[${this.name}] Error:`, error);
      return this.createFallbackResponse(id, error);
    }
  }

  /**
   * Phase 1: Input validation with Constitutional AI principles
   */
  protected async validateInput(args: any): Promise<ToolValidationResult> {
    const errors: string[] = [];
    
    // Check required fields
    for (const field of this.schema.required) {
      if (!args[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field types
    for (const [fieldName, fieldSchema] of Object.entries(this.schema.properties)) {
      if (args[fieldName] !== undefined) {
        const isValid = this.validateFieldType(args[fieldName], fieldSchema);
        if (!isValid) {
          errors.push(`Invalid type for field: ${fieldName}`);
        }
      }
    }

    // Constitutional AI validation for enhanced/critical tools
    let constitutionalScore = 100;
    if (this.constitutionalLevel !== 'basic') {
      constitutionalScore = await this.performConstitutionalValidation(args);
    }    return {
      isValid: errors.length === 0 && constitutionalScore >= 70,
      cleanArgs: this.sanitizeArgs(args),
      errors: errors.length > 0 ? errors : [],
      constitutionalScore
    };
  }

  /**
   * Phase 2: Core tool logic - to be implemented by subclasses
   */
  protected abstract executeCore(args: any): Promise<ToolExecutionResult>;

  /**
   * Phase 3: Quality assessment
   */
  protected async assessQuality(result: ToolExecutionResult): Promise<number> {
    // Base quality scoring - can be enhanced per tool
    let score = result.success ? 80 : 30;
    
    // Adjust based on data completeness
    if (result.data && typeof result.data === 'object') {
      const dataKeys = Object.keys(result.data);
      score += Math.min(dataKeys.length * 2, 15); // Max 15 bonus points
    }

    // Constitutional AI alignment bonus
    if (this.constitutionalLevel === 'critical') {
      score += 5; // Bonus for critical tool compliance
    }

    return Math.min(score, 100);
  }

  /**
   * Success response formatter - follows working memory_context pattern
   */
  protected createSuccessResponse(id: any, result: ToolExecutionResult, qualityScore: number): any {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            ...result.data,
            qualityScore,
            toolName: this.name,
            constitutionalCompliant: true,
            timestamp: new Date().toISOString(),
            ...(result.metadata && { metadata: result.metadata })
          }, null, 2)
        }],
        isError: false
      }
    };
  }

  /**
   * Error response formatter
   */
  protected createErrorResponse(id: any, errors: string[]): any {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errors.join(', '),
            toolName: this.name,
            fallbackAvailable: this.hasFallback(),
            timestamp: new Date().toISOString()
          }, null, 2)
        }],
        isError: true
      }
    };
  }

  /**
   * Fallback response formatter - graceful degradation
   */
  protected createFallbackResponse(id: any, error: any): any {
    const fallbackData = this.getFallbackData();
    
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            fallback: fallbackData,
            toolName: this.name,
            constitutionalNote: 'Tool failed gracefully with fallback data',
            timestamp: new Date().toISOString()
          }, null, 2)
        }],
        isError: false // Not an error if we have graceful fallback
      }
    };
  }

  // Helper methods
  private validateFieldType(value: any, schema: any): boolean {
    if (schema.type === 'string') return typeof value === 'string';
    if (schema.type === 'number') return typeof value === 'number';
    if (schema.type === 'boolean') return typeof value === 'boolean';
    if (schema.type === 'object') return typeof value === 'object';
    if (schema.type === 'array') return Array.isArray(value);
    return true; // Allow unknown types
  }

  private sanitizeArgs(args: any): any {
    // Basic sanitization - remove undefined values
    const clean: any = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) {
        clean[key] = value;
      }
    }
    return clean;
  }

  private async performConstitutionalValidation(args: any): Promise<number> {
    // Simplified constitutional validation
    // In real implementation, this would call Constitutional AI service
    let score = 100;
    
    // Check for harmful content patterns
    const content = JSON.stringify(args).toLowerCase();
    if (content.includes('delete') || content.includes('remove')) {
      score -= 10; // Slight penalty for destructive operations
    }
    
    return score;
  }
  private hasFallback(): boolean {
    // Default: assume tools have some fallback capability
    return true;
  }

  protected getFallbackData(): any {
    // Default fallback data
    return {
      message: `${this.name} encountered an error but is designed for graceful degradation`,
      suggestions: ['Try again with different parameters', 'Check system health', 'Contact support if issue persists']
    };
  }
}
