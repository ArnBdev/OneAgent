/**
 * OneAgent NLACS Coordination Tool
 * Modern agent coordination using NLACS orchestrator
 * Replaces deprecated AgentCoordinationTool and RealAgentCoordinationTool_v2
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { UnifiedNLACSOrchestrator } from '../nlacs/UnifiedNLACSOrchestrator';

export class NLACSCoordinationTool extends UnifiedMCPTool {
  constructor() {
    const schema: InputSchema = {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Task or goal for agent coordination'
        },
        agentTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Types of agents to coordinate (optional)'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Task priority level (default: medium)'
        },
        timeout: {
          type: 'number',
          description: 'Maximum execution time in seconds (default: 300)'
        },
        requiresBMAD: {
          type: 'boolean',
          description: 'Whether task requires BMAD analysis (default: false)'
        }
      },
      required: ['task']
    };

    super(
      'oneagent_agent_coordinate',
      'Coordinate multiple OneAgent agents for complex task execution via NLACS',
      schema,
      'critical'
    );
  }

  public async executeCore(args: any): Promise<ToolExecutionResult> {
    try {
      const {
        task,
        agentTypes = [],
        priority = 'medium',
        timeout = 300,
        requiresBMAD = false
      } = args;      console.log('[NLACSCoordinationTool] Coordinating agents via NLACS for task:', task);

      // Get NLACS orchestrator instance
      const orchestrator = UnifiedNLACSOrchestrator.getInstance();      // Create agent context for coordination with actual user context
      const userContext: any = {
        user: { 
          id: 'Arne', // FIX: Use actual user profile instead of hardcoded "mcp-user"
          name: 'Arne', 
          createdAt: new Date(),
          lastActiveAt: new Date()
        },
        sessionId: `nlacs-session-${Date.now()}`,
        timestamp: new Date(),
        conversationHistory: [],
        workingMemory: new Map(),
        tools: [],
        metrics: {
          messagesProcessed: 0,
          averageResponseTime: 0,
          errorCount: 0,
          successRate: 100,
          lastActivity: new Date()
        }
      };      // Execute actual agent coordination with conversation execution
      const coordinationResult = await orchestrator.coordinateAgentsForTask(
        task,
        userContext,
        {
          maxAgents: agentTypes.length > 0 ? agentTypes.length : 3,
          priority: priority as 'low' | 'medium' | 'high' | 'urgent',
          enableBMAD: requiresBMAD
        }
      );

      // Return enhanced result with actual coordination data
      const result = {
        success: coordinationResult.success,
        task,
        priority,
        requestedAgents: agentTypes,
        result: coordinationResult.result,
        participatingAgents: coordinationResult.participatingAgents,
        qualityScore: coordinationResult.qualityScore,
        executionTime: coordinationResult.executionTime,
        constitutionalValidated: coordinationResult.constitutionalValidated,
        nlacs: {
          orchestratorActive: true,
          coordinationInitiated: true,
          conversationExecuted: coordinationResult.success
        },
        metadata: {
          framework: 'nlacs_v2.0.0',
          constitutionalLevel: 'critical',
          bmadRequired: requiresBMAD,
          timestamp: new Date().toISOString(),
          note: 'NLACS coordination with actual conversation execution'
        }
      };

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('[NLACSCoordinationTool] Coordination failed:', error);
      
      return {
        success: false,
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to coordinate agents via NLACS',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
  /**
   * Basic conversation retrieval for backward compatibility
   */
  public async retrieveConversationHistory(
    _sessionId?: string,
    _agentType?: string,
    _timeRangeHours?: number
  ): Promise<any> {
    return {
      success: true,
      conversations: [],
      totalFound: 0,
      message: 'NLACS conversation retrieval - use specific conversation tools',
      source: 'nlacs_coordination_tool'
    };
  }

  /**
   * Basic conversation search for backward compatibility
   */
  public async searchConversations(
    query: string,
    _agentType?: string,
    _timeRangeHours?: number,
    _maxResults = 20
  ): Promise<any> {
    return {
      success: true,
      results: [],
      totalFound: 0,
      query,
      message: 'NLACS conversation search - use specific conversation tools',
      source: 'nlacs_coordination_tool'
    };
  }
}
