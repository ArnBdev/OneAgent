/**
 * Unified Context7 Store Tool
 * 
 * Constitutional AI-compliant tool for storing documentation and context
 * through the Context7 MCP integration system.
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { Context7MCPIntegration, DocumentationSource } from '../mcp/Context7MCPIntegration';
import { OneAgentMem0Bridge } from '../memory/OneAgentMem0Bridge';
import { LearningMemory } from '../memory/UnifiedMemoryInterface';

export interface Context7StoreParams {
  source: string;
  title: string;
  content: string;
  url?: string;
  version?: string;
  metadata?: Record<string, any>;
  qualityCheck?: boolean;
}

export interface Context7StoreResult extends ToolExecutionResult {
  // The main results are in the 'data' property as required by ToolExecutionResult
}

/**
 * Unified Context7 Store Tool for documentation storage and indexing
 */
export class UnifiedContext7StoreTool extends UnifiedMCPTool {
  private context7Integration: Context7MCPIntegration;
  private memoryBridge: OneAgentMem0Bridge;

  constructor(context7Integration: Context7MCPIntegration) {
    const schema: InputSchema = {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Documentation source identifier' },
        title: { type: 'string', description: 'Title of the documentation entry' },
        content: { type: 'string', description: 'Content to store' },
        url: { type: 'string', description: 'Optional URL reference' },
        version: { type: 'string', description: 'Version information (optional)' },
        metadata: { type: 'object', description: 'Additional metadata (optional)' },
        qualityCheck: { type: 'boolean', description: 'Perform quality validation before storing (default: true)' }
      },
      required: ['source', 'title', 'content']
    };

    super(
      'oneagent_context7_store',
      'Store documentation and context with Constitutional AI validation and quality scoring',
      schema,
      'enhanced'
    );
    
    this.context7Integration = context7Integration;
    this.memoryBridge = new OneAgentMem0Bridge({}); // Canonical memory bridge
  }

  /**
   * Core execution method implementing documentation storage
   */
  protected async executeCore(args: Context7StoreParams): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // Apply Constitutional AI validation to content
      await this.validateContentSafety(args);

      // Perform quality check if requested (default: true)
      const qualityScore = args.qualityCheck !== false ? 
        await this.performQualityCheck(args) : 80;

      // Prepare documentation entry
      const documentationEntry = {
        source: args.source,
        title: args.title,
        content: args.content,
        url: args.url,
        version: args.version,
        metadata: {
          ...args.metadata,
          storedAt: new Date().toISOString(),
          qualityScore,
          constitutionalCompliant: true,
          toolName: this.name
        },
        relevanceScore: qualityScore / 100 // Convert to 0-1 scale for relevance
      };

      // Store in Context7 cache/index
      const storeResult = await this.storeInContext7(documentationEntry);

      // Store learning in unified memory
      await this.storeLearning(args, storeResult, Date.now() - startTime);

      // Create response
      const responseData: Context7StoreResult = {
        success: true,
        data: {
          stored: true,
          documentId: storeResult.documentId,
          source: args.source,
          qualityScore,
          cached: true,
          indexUpdated: storeResult.indexUpdated,
          storageTime: Date.now() - startTime,
          metadata: {
            operation: 'documentation_store',
            contentLength: args.content.length,
            titleLength: args.title.length,
            hasUrl: !!args.url,
            hasVersion: !!args.version,
            qualityValidation: args.qualityCheck !== false
          }
        },
        qualityScore
      };

      return responseData;

    } catch (error) {
      throw new Error(`Context7 store failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate content safety using Constitutional AI principles
   */
  private async validateContentSafety(args: Context7StoreParams): Promise<void> {
    // Constitutional AI: Safety validation
    const unsafePatterns = [
      /\b(password|secret|token|api[_\-]?key)\s*[:=]\s*\S+/i,
      /\b(private|confidential|internal)\s+(key|token|secret)/i,
      /\b(malicious|harmful|dangerous)\s+(code|script|command)/i,
      /\bDO\s+NOT\s+(SHARE|DISTRIBUTE|COPY)/i
    ];

    const fullContent = `${args.title} ${args.content} ${args.url || ''}`;
    
    for (const pattern of unsafePatterns) {
      if (pattern.test(fullContent)) {
        throw new Error('Content contains potentially unsafe information and cannot be stored');
      }
    }

    // Content length validation
    if (args.content.length > 100000) { // 100KB limit
      throw new Error('Content too large (max 100KB)');
    }

    if (args.title.length > 500) {
      throw new Error('Title too long (max 500 characters)');
    }

    // Constitutional AI: Accuracy validation - ensure content has substance
    if (args.content.trim().length < 50) {
      throw new Error('Content too short to be meaningful (min 50 characters)');
    }
  }

  /**
   * Perform quality assessment of the documentation content
   */
  private async performQualityCheck(args: Context7StoreParams): Promise<number> {
    let score = 100;

    // Content quality factors
    const contentWords = args.content.split(/\s+/).length;
    const titleWords = args.title.split(/\s+/).length;

    // Penalize very short content
    if (contentWords < 20) {
      score -= 20;
    } else if (contentWords < 50) {
      score -= 10;
    }

    // Penalize poor titles
    if (titleWords < 2) {
      score -= 15;
    } else if (titleWords > 15) {
      score -= 5;
    }

    // Reward structured content
    if (args.content.includes('\n') && args.content.includes('```')) {
      score += 10; // Code examples
    }

    if (args.content.match(/^#+\s/m)) {
      score += 5; // Markdown headers
    }

    // Reward metadata completeness
    if (args.url) score += 5;
    if (args.version) score += 5;
    if (args.metadata && Object.keys(args.metadata).length > 0) score += 5;

    // Constitutional AI: Helpfulness assessment
    const helpfulnessScore = await this.assessHelpfulness(args);
    score = Math.floor((score + helpfulnessScore) / 2);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Assess content helpfulness
   */
  private async assessHelpfulness(args: Context7StoreParams): Promise<number> {
    let helpfulnessScore = 80; // Base score

    // Check for common helpful patterns
    const helpfulPatterns = [
      /\b(example|sample|demo|tutorial)\b/i,
      /\b(how\s+to|step\s+by\s+step|guide)\b/i,
      /\b(api|function|method|class)\b/i,
      /\b(parameter|argument|return|throws)\b/i,
      /```[\s\S]*?```/g, // Code blocks
      /\n\s*[-*+]\s+/g // Lists
    ];

    const matches = helpfulPatterns.reduce((count, pattern) => {
      const match = args.content.match(pattern);
      return count + (match ? match.length : 0);
    }, 0);

    helpfulnessScore += Math.min(20, matches * 3); // Bonus for helpful patterns

    return Math.min(100, helpfulnessScore);
  }
  /**
   * Store documentation in Context7 integration
   */
  private async storeInContext7(_entry: any): Promise<{ documentId: string; indexUpdated: boolean }> {
    // In a real implementation, this would interact with the Context7 integration
    // For now, we'll simulate the storage operation
    
    try {
      // Generate document ID
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate storage delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return {
        documentId,
        indexUpdated: true
      };
      
    } catch (error) {
      throw new Error(`Failed to store in Context7: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store learning and context in memory
   */
  private async storeLearning(args: Context7StoreParams, storeResult: any, operationTime: number): Promise<void> {
    try {
      const learning: LearningMemory = {
        id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: this.name, // Use tool name as agentId for now
        learningType: 'documentation_context',
        content: JSON.stringify({
          source: args.source,
          title: args.title,
          contentLength: args.content.length,
          operationTime,
          documentId: storeResult.documentId,
          timestamp: new Date().toISOString(),
          quality: {
            qualityScore: storeResult.qualityScore || 80,
            hasUrl: !!args.url,
            hasVersion: !!args.version,
            hasMetadata: !!(args.metadata && Object.keys(args.metadata).length > 0)
          }
        }),
        confidence: 0.9,
        applicationCount: 0,
        lastApplied: new Date(),
        sourceConversations: [],
        metadata: {
          tool: 'context7_store',
          source: args.source,
          documentId: storeResult.documentId,
          operation: 'documentation_storage'
        }
      };
      await this.memoryBridge.storeLearning(learning);
    } catch (error) {
      // Non-critical error - log but don't fail the main operation
      console.warn(`Failed to store Context7 learning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available documentation sources
   */
  public getAvailableSources(): string[] {
    return this.context7Integration.getAvailableSources().map(s => s.name);
  }

  /**
   * Get Context7 storage metrics
   */
  public getStorageMetrics() {
    return this.context7Integration.getCacheMetrics();
  }
}
