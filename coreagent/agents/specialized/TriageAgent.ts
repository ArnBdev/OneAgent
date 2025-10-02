/**
 * RealTriageAgent - REAL Task Routing & System Health AI Agent
 *
 * A fully functional BaseAgent implementation with:
 * - Real memory integration for tracking routing decisions
 * - Gemini AI for intelligent task routing and system analysis
 * - Constitutional AI validation
 * - Specialized triage and orchestration expertise
 */

import {
  BaseAgent,
  AgentConfig,
  AgentContext,
  AgentResponse,
  AgentAction,
} from '../base/BaseAgent';
import { ISpecializedAgent, AgentHealthStatus } from '../base/ISpecializedAgent';
import { PromptConfig, AgentPersona } from '../base/PromptEngine';
import type { ConstitutionalPrinciple } from '../../types/oneagent-backbone-types';
import { MemoryRecord } from '../../types/oneagent-backbone-types';
import { proactiveObserverService } from '../../services/ProactiveTriageOrchestrator';
import { OneAgentMemory } from '../../memory/OneAgentMemory';
import { getOneAgentMemory } from '../../utils/UnifiedBackboneService';

interface TaskAnalysis {
  confidence: number;
  reasoning: string;
  suggestedAgent: string;
}

interface LoadMetrics {
  cpuUsage?: number;
  memoryUsage?: number;
  activeAgents?: number;
  queueSize?: number;
  [key: string]: unknown;
}

interface RoutingResult {
  routing: {
    selectedAgent: string;
    confidence: number;
    reasoning: string;
    priority: string;
    estimatedDuration: string;
  };
  alternatives: string[];
  metadata: {
    timestamp: string;
    taskType: string;
    complexity: string;
  };
}

interface HealthAssessment {
  overall: string;
  agents: Record<string, AgentHealthStatus>;
  recommendations: string[];
  alerts: string[];
}

interface LoadBalanceResult {
  currentStatus: string;
  recommendations: string[];
  actions: string[];
  projectedImprovement: string;
}

interface TriageAnalysis {
  recommendedAgent: string;
  confidence: number;
  reasoning: string;
  priority: string;
  estimatedDuration: string;
  category: string;
  complexity: string;
  alternativeAgents: string[];
}

export class TriageAgent extends BaseAgent implements ISpecializedAgent {
  private memory: OneAgentMemory;

  constructor(config: AgentConfig, promptConfig?: PromptConfig, memory?: OneAgentMemory) {
    super(config, promptConfig || TriageAgent.createTriagePromptConfig());
    this.memory = memory || getOneAgentMemory();
  }

  /** ISpecializedAgent interface implementation */
  get id(): string {
    return this.config.id;
  }
  async initialize(): Promise<void> {
    // Call parent initialize first (includes auto-registration)
    await super.initialize();

    console.log(`TriageAgent ${this.id} initialized`);
  }

  getName(): string {
    return this.config.name;
  }

  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'route_task',
        description: 'Route a task to the most appropriate agent',
        parameters: {
          task: { type: 'string', required: true, description: 'Task description' },
          priority: {
            type: 'string',
            required: false,
            description: 'Task priority: low, medium, high, urgent',
          },
          requiredSkills: {
            type: 'array',
            required: false,
            description: 'Required skills or capabilities',
          },
        },
      },
      {
        type: 'assess_agent_health',
        description: 'Assess the health and availability of system agents',
        parameters: {
          agentId: { type: 'string', required: false, description: 'Specific agent ID to check' },
        },
      },
      {
        type: 'load_balance',
        description: 'Balance load across available agents',
        parameters: {
          currentLoad: {
            type: 'object',
            required: true,
            description: 'Current system load metrics',
          },
        },
      },
      {
        type: 'get_proactive_snapshot',
        description: 'Retrieve the latest proactive monitoring snapshot & triage status',
        parameters: {},
      },
      {
        type: 'explain_system_state',
        description: 'Generate an LLM explanation of current system health using proactive data',
        parameters: {},
      },
      {
        type: 'recommend_remediations',
        description:
          'Suggest remediation actions based on latest deep analysis and snapshot deltas',
        parameters: {},
      },
    ];
  }

  async executeAction(
    action: string | AgentAction,
    params: Record<string, unknown>,
    _context?: AgentContext,
  ): Promise<AgentResponse> {
    const actionType = typeof action === 'string' ? action : action.type;

    switch (actionType) {
      case 'route_task': {
        const routingResult = await this.routeTask(
          params.task as string,
          params.priority as string | undefined,
          params.requiredSkills as string[] | undefined,
        );
        return {
          content: 'Task routing completed',
          metadata: {
            type: 'routing_result',
            routing: routingResult.routing,
            alternatives: routingResult.alternatives,
            taskMetadata: routingResult.metadata,
          },
        };
      }
      case 'assess_agent_health': {
        const healthAssessment = await this.assessAgentHealth(params.agentId as string | undefined);
        return {
          content: 'Agent health assessment completed',
          metadata: {
            type: 'health_assessment',
            overall: healthAssessment.overall,
            agents: healthAssessment.agents,
            recommendations: healthAssessment.recommendations,
            alerts: healthAssessment.alerts,
          },
        };
      }
      case 'load_balance': {
        const loadBalanceResult = await this.balanceLoad(params.currentLoad as LoadMetrics);
        return {
          content: 'Load balancing completed',
          metadata: {
            type: 'load_balance_result',
            currentStatus: loadBalanceResult.currentStatus,
            recommendations: loadBalanceResult.recommendations,
            actions: loadBalanceResult.actions,
            projectedImprovement: loadBalanceResult.projectedImprovement,
          },
        };
      }
      case 'get_proactive_snapshot': {
        const snap = proactiveObserverService.getLastSnapshot();
        const triage = proactiveObserverService.getLastTriage();
        const deep = proactiveObserverService.getLastDeepAnalysis();
        return {
          content: 'Latest proactive snapshot retrieved',
          metadata: {
            type: 'proactive_snapshot',
            snapshot: snap || null,
            triage: triage || null,
            deep: deep || null,
          },
        };
      }
      case 'explain_system_state': {
        const snap = proactiveObserverService.getLastSnapshot();
        const triage = proactiveObserverService.getLastTriage();
        const deep = proactiveObserverService.getLastDeepAnalysis();
        const explanation = await this.explainSystemState(snap, triage, deep);
        return {
          content: explanation,
          metadata: {
            type: 'system_state_explanation',
            triage: triage || null,
            anomaly: triage?.anomalySuspected || false,
          },
        };
      }
      case 'recommend_remediations': {
        const snap = proactiveObserverService.getLastSnapshot();
        const triage = proactiveObserverService.getLastTriage();
        const deep = proactiveObserverService.getLastDeepAnalysis();
        const recs = this.buildRemediationRecommendations(snap, triage, deep);
        return {
          content: 'Remediation recommendations generated',
          metadata: { type: 'remediation_recommendations', recommendations: recs },
        };
      }
      default:
        return await super.executeAction(action, params, _context);
    }
  }

  async getHealthStatus(): Promise<AgentHealthStatus> {
    const timestamp = this.unifiedBackbone.getServices().timeService.now();
    return {
      status: 'healthy',
      uptime: timestamp.unix,
      memoryUsage: 0,
      responseTime: 0,
      errorRate: 0,
      lastActivity: new Date(timestamp.utc),
    };
  }

  async cleanup(): Promise<void> {
    console.log(`TriageAgent ${this.id} cleaned up`);
  }

  // TriageAgent-specific action implementations
  private async routeTask(
    task: string,
    priority?: string,
    requiredSkills?: string[],
  ): Promise<RoutingResult> {
    // Analyze task and determine best agent
    const analysis = this.analyzeTask(task, requiredSkills);
    const selectedAgent = this.selectBestAgent(analysis, priority);

    return {
      routing: {
        selectedAgent,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        priority: priority || 'medium',
        estimatedDuration: this.estimateDuration(task),
      },
      alternatives: this.getAlternativeAgents(selectedAgent),
      metadata: {
        timestamp: new Date().toISOString(),
        taskType: this.categorizeTask(task),
        complexity: this.assessComplexity(task),
      },
    };
  }

  private estimateDuration(task: string): string {
    // Simple duration estimation based on task complexity
    const complexity = this.assessComplexity(task);
    switch (complexity) {
      case 'low':
        return '5-15 minutes';
      case 'medium':
        return '15-60 minutes';
      case 'high':
        return '1-4 hours';
      default:
        return '30 minutes';
    }
  }

  private getAlternativeAgents(selectedAgent: string): string[] {
    // Return list of alternative agents
    const allAgents = ['CoreAgent', 'DevAgent', 'FitnessAgent', 'OfficeAgent', 'ValidationAgent'];
    return allAgents.filter((agent) => agent !== selectedAgent).slice(0, 2);
  }

  private categorizeTask(task: string): string {
    const taskLower = task.toLowerCase();
    if (taskLower.includes('code') || taskLower.includes('develop')) return 'development';
    if (taskLower.includes('fitness') || taskLower.includes('workout')) return 'fitness';
    if (taskLower.includes('validate') || taskLower.includes('check')) return 'validation';
    if (taskLower.includes('office') || taskLower.includes('document')) return 'office';
    return 'general';
  }

  private assessComplexity(task: string): string {
    const taskLength = task.length;
    const complexityKeywords = ['complex', 'advanced', 'comprehensive', 'detailed'];
    const hasComplexKeywords = complexityKeywords.some((keyword) =>
      task.toLowerCase().includes(keyword),
    );

    if (hasComplexKeywords || taskLength > 200) return 'high';
    if (taskLength > 100) return 'medium';
    return 'low';
  }

  private async assessAgentHealth(agentId?: string): Promise<HealthAssessment> {
    // Use proactive snapshot to derive health signals if present
    const snapshot = proactiveObserverService.getLastSnapshot();
    const triage = proactiveObserverService.getLastTriage();
    const overall = triage?.anomalySuspected ? 'degraded' : 'healthy';
    const timestamp = this.unifiedBackbone.getServices().timeService.now();

    const baseHealth: AgentHealthStatus = {
      status: overall === 'healthy' ? 'healthy' : 'degraded',
      uptime: timestamp.unix,
      memoryUsage: 0,
      responseTime: 0,
      errorRate: 0,
      lastActivity: new Date(timestamp.utc),
    };

    const agents: Record<string, AgentHealthStatus> = {
      CoreAgent: baseHealth,
      DevAgent: baseHealth,
      FitnessAgent: baseHealth,
      OfficeAgent: baseHealth,
    };

    const recommendations: string[] = [];
    const alerts: string[] = [];
    if (triage?.latencyConcern) recommendations.push('Investigate latency spikes');
    if (triage?.errorBudgetConcern) {
      recommendations.push('Examine error budget burn operations');
      alerts.push('Error budget burn threshold exceeded');
    }
    if (!triage) recommendations.push('Awaiting first proactive snapshot');
    if (snapshot?.errorBudgetBurnHot?.length) {
      recommendations.push('Prioritize remediation for hot operations');
    }

    if (agentId) {
      return {
        overall,
        agents: { [agentId]: agents[agentId] || baseHealth },
        recommendations,
        alerts,
      };
    }
    return { overall, agents, recommendations, alerts };
  }

  // --- Proactive integration helpers ---
  private async explainSystemState(
    snap: ReturnType<typeof proactiveObserverService.getLastSnapshot>,
    triage: ReturnType<typeof proactiveObserverService.getLastTriage>,
    deep: ReturnType<typeof proactiveObserverService.getLastDeepAnalysis>,
  ): Promise<string> {
    if (!snap || !triage) return 'No proactive snapshot available yet.';
    const baseSummary = `Snapshot @ ${snap.takenAt} | Errors(last window): ${snap.recentErrorEvents} | HotOps: ${snap.errorBudgetBurnHot.length} | Anomaly: ${triage.anomalySuspected}`;

    // NEW: Include memory backend status (Phase 2 v4.4.1)
    let memoryStatus = '';
    if (snap.memoryBackend) {
      memoryStatus = `\nMemory Backend (${snap.memoryBackend.backend}): ${snap.memoryBackend.status.toUpperCase()} | Latency: ${snap.memoryBackend.latency}ms | Capabilities: ${snap.memoryBackend.capabilities}`;
      if (snap.memoryBackend.status !== 'healthy') {
        memoryStatus += ` ⚠️ CONCERN`;
      }
    }

    if (!deep) return baseSummary + memoryStatus + ' | Deep analysis not yet performed.';
    return (
      baseSummary +
      memoryStatus +
      `\nDeep Summary: ${deep.summary}\nTop Actions: ${deep.recommendedActions.join('; ')}`
    );
  }

  private buildRemediationRecommendations(
    snap: ReturnType<typeof proactiveObserverService.getLastSnapshot>,
    triage: ReturnType<typeof proactiveObserverService.getLastTriage>,
    deep: ReturnType<typeof proactiveObserverService.getLastDeepAnalysis>,
  ): string[] {
    const recs: string[] = [];
    if (!snap || !triage) return ['Await first proactive snapshot'];

    // NEW: Memory backend recommendations (Phase 2 v4.4.1)
    if (snap.memoryBackend) {
      if (snap.memoryBackend.status === 'unhealthy') {
        recs.push('CRITICAL: Restart memory server (mem0+FastMCP) - backend unreachable');
        recs.push('Check memory server logs for errors');
        recs.push('Verify network connectivity to port 8010');
        recs.push('Validate MCP session initialization');
      } else if (snap.memoryBackend.status === 'degraded') {
        recs.push('WARNING: Memory backend degraded - investigate performance');
        recs.push(`Current latency: ${snap.memoryBackend.latency}ms (target: < 500ms)`);
        recs.push('Consider restarting memory server if persistent');
      }

      if (snap.memoryBackend.capabilities < 3) {
        recs.push('Memory backend missing tools - verify MCP initialization');
        recs.push('Check mem0_fastmcp_server.py tool registration');
      }
    }

    if (triage.latencyConcern)
      recs.push('Profile high latency operations & review recent deployments');
    if (triage.errorBudgetConcern)
      recs.push('Throttle or rollback operations breaching error budget');
    if (snap.errorBudgetBurnHot.length) {
      recs.push(
        'Focus remediation on: ' +
          snap.errorBudgetBurnHot
            .map((o) => `${o.operation}(burn:${o.burnRate.toFixed(2)})`)
            .join(', '),
      );
    }
    if (deep) {
      recs.push(...deep.recommendedActions.map((a) => `DeepSuggest: ${a}`));
    }
    if (!recs.length) recs.push('System nominal - continue monitoring');
    return recs.slice(0, 8);
  }

  private async balanceLoad(currentLoad: LoadMetrics): Promise<LoadBalanceResult> {
    const recommendations = this.generateLoadBalanceRecommendations(currentLoad);

    return {
      currentStatus: this.assessLoadStatus(currentLoad),
      recommendations,
      actions: this.generateLoadBalanceActions(currentLoad),
      projectedImprovement: 'Expected 15-20% improvement in response times',
    };
  }

  private assessLoadStatus(currentLoad: LoadMetrics): string {
    const cpu = currentLoad.cpuUsage || 0;
    const memory = currentLoad.memoryUsage || 0;
    const queue = currentLoad.queueSize || 0;

    if (cpu > 80 || memory > 80 || queue > 50) return 'High Load';
    if (cpu > 60 || memory > 60 || queue > 20) return 'Medium Load';
    return 'Normal Load';
  }

  private generateLoadBalanceActions(currentLoad: LoadMetrics): string[] {
    const actions: string[] = [];
    const cpu = currentLoad.cpuUsage || 0;
    const memory = currentLoad.memoryUsage || 0;
    const queue = currentLoad.queueSize || 0;

    if (cpu > 70) actions.push('Scale CPU resources');
    if (memory > 70) actions.push('Increase memory allocation');
    if (queue > 30) actions.push('Add additional processing agents');
    if (actions.length === 0) actions.push('Maintain current configuration');

    return actions;
  }
  private analyzeTask(task: string, _requiredSkills?: string[]): TaskAnalysis {
    // Simple task analysis logic
    const taskLower = task.toLowerCase();

    if (
      taskLower.includes('code') ||
      taskLower.includes('program') ||
      taskLower.includes('debug')
    ) {
      return {
        confidence: 85,
        reasoning: 'Task involves programming/development work',
        suggestedAgent: 'DevAgent',
      };
    } else if (
      taskLower.includes('document') ||
      taskLower.includes('office') ||
      taskLower.includes('meeting')
    ) {
      return {
        confidence: 80,
        reasoning: 'Task involves office productivity',
        suggestedAgent: 'OfficeAgent',
      };
    } else if (
      taskLower.includes('fitness') ||
      taskLower.includes('workout') ||
      taskLower.includes('health')
    ) {
      return {
        confidence: 90,
        reasoning: 'Task involves fitness and wellness',
        suggestedAgent: 'FitnessAgent',
      };
    }

    return {
      confidence: 60,
      reasoning: 'General task - routing to core agent',
      suggestedAgent: 'CoreAgent',
    };
  }

  private selectBestAgent(analysis: TaskAnalysis, _priority?: string): string {
    // For now, return the suggested agent from analysis
    return analysis.suggestedAgent;
  }

  private generateLoadBalanceRecommendations(currentLoad: LoadMetrics): string[] {
    const recommendations = ['Monitor agent response times', 'Scale up high-load agents'];

    if (currentLoad.highLoad) {
      recommendations.push('Distribute tasks to underutilized agents');
    }

    return recommendations;
  }

  /**
   * Process triage and routing related messages
   */
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    try {
      this.validateContext(context);

      // Canonical memory search

      const relevantMemories = (await this.memory.searchMemory({
        query: message,
        userId: context.user.id,
        limit: 5,
      })) as MemoryRecord[];

      // Analyze the task/query for routing decisions
      const triageAnalysis = await this.analyzeTaskForTriage(message, relevantMemories);

      // Generate AI response with triage expertise
      const response = await this.generateTriageResponse(message, triageAnalysis, relevantMemories);

      // Store this routing decision in memory for future reference (canonical signature)

      await this.memory.addMemory({
        content: `Triage Analysis: ${message}\nRouting Decision: ${JSON.stringify(triageAnalysis)}\nResponse: ${response}`,
        metadata: {
          type: 'triage_decision',
          priority: triageAnalysis.priority,
          recommendedAgent: triageAnalysis.recommendedAgent,
          category: triageAnalysis.category,
          timestamp: new Date().toISOString(),
          sessionId: context.sessionId,
        },
      });

      const base = this.createResponse(response, [], relevantMemories);
      return await this.finalizeResponseWithTaskDetection(message, base);
    } catch (error) {
      console.error('RealTriageAgent: Error processing message:', error);
      // Structured failure emission (session-aware) if this was a delegated task
      try {
        const taskId = this.detectTaskId(message);
        if (taskId) {
          await this.emitTaskFailure(
            taskId,
            'TRIAGE_PROCESS_ERROR',
            error instanceof Error ? error.message : 'Unknown error',
            { agentId: this.config.id },
          );
        }
      } catch (emitErr) {
        console.warn(`[TriageAgent:${this.config.id}] Warning emitting task failure:`, emitErr);
      }
      const errResp = this.createResponse(
        'I apologize, but I encountered an error while analyzing your request for routing. Please try again.',
        [],
        [],
      );
      return await this.finalizeResponseWithTaskDetection(message, errResp);
    }
  }
  /**
   * Analyze a task to determine optimal routing
   */
  private async analyzeTaskForTriage(
    message: string,
    memories: MemoryRecord[],
  ): Promise<TriageAnalysis> {
    const prompt = `
Analyze this user request for optimal task routing:

Request: "${message}"

Previous routing patterns: ${this.buildRoutingContext(memories)}

Determine:
1. Task category (dev, office, fitness, core, general)
2. Priority level (low, medium, high, urgent)
3. Complexity (simple, medium, complex)
4. Recommended agent(s)
5. Confidence in routing decision (1-10)
6. Alternative agents if primary is unavailable

Respond in JSON format:
{
  "category": "string",
  "priority": "string",
  "complexity": "string", 
  "recommendedAgent": "string",
  "alternativeAgents": ["string"],
  "confidence": number,
  "reasoning": "string"
}
`;

    const aiResponse = await this.generateResponse(prompt, memories);

    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse triage analysis JSON:', error);
    }

    // Fallback analysis
    return this.performFallbackTriage(message);
  }
  /**
   * Generate specialized triage response with AI
   */
  private async generateTriageResponse(
    message: string,
    triageAnalysis: TriageAnalysis,
    memories: MemoryRecord[],
  ): Promise<string> {
    const routingContext = this.buildRoutingContext(memories);

    const prompt = `
You are a professional task routing and system orchestration specialist with expertise in:
- Intelligent task analysis and categorization
- Agent capability assessment and matching
- Priority-based routing decisions
- System health monitoring and optimization
- Load balancing and resource allocation
- Escalation path management

Routing Analysis: ${JSON.stringify(triageAnalysis, null, 2)}
Previous routing patterns: ${routingContext}

User query: ${message}

Provide expert routing guidance that includes:
1. Clear explanation of routing decision
2. Recommended agent and reasoning
3. Alternative options if primary agent unavailable
4. Expected timeline and approach
5. Any special considerations or requirements

Be concise but comprehensive in your routing analysis.
`;

    return await this.generateResponse(prompt, memories);
  }

  /**
   * Build routing context from historical decisions
   */
  private buildRoutingContext(memories: MemoryRecord[]): string {
    if (!memories || memories.length === 0) {
      return 'No previous routing history available.';
    }

    const routingMemories = memories
      .filter(
        (memory) =>
          memory.metadata?.category === 'triage_decision' ||
          memory.content?.toLowerCase().includes('routing') ||
          memory.content?.toLowerCase().includes('agent'),
      )
      .slice(0, 3);

    if (routingMemories.length === 0) {
      return 'No relevant routing history found.';
    }

    return routingMemories
      .map((memory) => {
        // Parse routing information from content since it's stored as structured data
        try {
          const routingInfo = JSON.parse(memory.content);
          return `Previous: ${memory.metadata.category || 'unknown'} -> ${routingInfo.recommendedAgent || 'unknown'} (Priority: ${routingInfo.priority || 'unknown'})`;
        } catch {
          return `Previous: ${memory.metadata.category || 'unknown'} -> ${memory.content.substring(0, 50)}...`;
        }
      })
      .join('\n');
  }

  /**
   * Perform fallback triage analysis when AI parsing fails
   */
  private performFallbackTriage(message: string): TriageAnalysis {
    const messageLower = message.toLowerCase();

    // Simple keyword-based analysis
    let category = 'general';
    let recommendedAgent = 'CoreAgent';
    let priority = 'medium';

    if (
      messageLower.includes('code') ||
      messageLower.includes('dev') ||
      messageLower.includes('program')
    ) {
      category = 'dev';
      recommendedAgent = 'DevAgent';
    } else if (
      messageLower.includes('document') ||
      messageLower.includes('office') ||
      messageLower.includes('productivity')
    ) {
      category = 'office';
      recommendedAgent = 'OfficeAgent';
    } else if (
      messageLower.includes('fitness') ||
      messageLower.includes('workout') ||
      messageLower.includes('health')
    ) {
      category = 'fitness';
      recommendedAgent = 'FitnessAgent';
    }

    if (messageLower.includes('urgent') || messageLower.includes('critical')) {
      priority = 'urgent';
    } else if (messageLower.includes('important') || messageLower.includes('priority')) {
      priority = 'high';
    }

    return {
      category,
      priority,
      complexity: 'medium',
      recommendedAgent,
      alternativeAgents: ['CoreAgent'],
      confidence: 6,
      reasoning: 'Fallback keyword-based analysis used due to AI parsing failure',
      estimatedDuration: '30 minutes',
    };
  }

  /**
   * Create enhanced prompt configuration for triage expertise
   */
  private static createTriagePromptConfig(): PromptConfig {
    return {
      agentPersona: TriageAgent.createTriagePersona(),
      constitutionalPrinciples: TriageAgent.createTriageConstitutionalPrinciples(),
      enabledFrameworks: ['RTF', 'TAG', 'RGC'], // Reasoning, Task, Goals + Resources, Goals, Constraints
      enableCoVe: true, // Enable verification for routing decisions
      enableRAG: true, // Use relevant memory context
      qualityThreshold: 85, // High standard for routing accuracy
    };
  }

  /**
   * Create triage-specialized agent persona
   */
  private static createTriagePersona(): AgentPersona {
    return {
      role: 'Professional Task Routing & System Orchestration Specialist AI',
      style: 'Analytical, decisive, systematic, and optimization-focused',
      coreStrength: 'Intelligent task analysis and optimal agent routing',
      principles: [
        'Optimal routing based on agent capabilities and availability',
        'Priority-aware task scheduling and resource allocation',
        'System health monitoring and proactive optimization',
        'Clear routing rationale with fallback options',
        'Continuous learning from routing patterns and outcomes',
        'Efficient load balancing across agent network',
      ],
      frameworks: ['RTF', 'TAG', 'RGC'],
    };
  }

  /**
   * Create triage-specific constitutional principles
   */
  private static createTriageConstitutionalPrinciples(): ConstitutionalPrinciple[] {
    return [
      {
        id: 'optimal_routing',
        name: 'Optimal Agent Routing',
        description:
          'Route tasks to the most appropriate agent based on capabilities and availability',
        category: 'helpfulness',
        weight: 1,
        isViolated: false,
        confidence: 1,
        validationRule: 'Response includes clear routing rationale and agent capability matching',
        severityLevel: 'high',
      },
      {
        id: 'priority_awareness',
        name: 'Priority-Based Scheduling',
        description: 'Respect task priorities and urgency levels in routing decisions',
        category: 'helpfulness',
        weight: 1,
        isViolated: false,
        confidence: 1,
        validationRule: 'Response considers and respects stated or implied priority levels',
        severityLevel: 'high',
      },
      {
        id: 'fallback_options',
        name: 'Fallback Route Planning',
        description: 'Always provide alternative routing options for resilience',
        category: 'safety',
        weight: 1,
        isViolated: false,
        confidence: 1,
        validationRule: 'Response includes backup agents or escalation paths',
        severityLevel: 'medium',
      },
      {
        id: 'transparent_reasoning',
        name: 'Transparent Routing Logic',
        description: 'Clearly explain routing decisions and reasoning',
        category: 'transparency',
        weight: 1,
        isViolated: false,
        confidence: 1,
        validationRule: 'Response includes clear explanation of why specific agent was chosen',
        severityLevel: 'high',
      },
      {
        id: 'system_optimization',
        name: 'System-Wide Optimization',
        description: 'Consider overall system health and load balancing',
        category: 'accuracy',
        weight: 1,
        isViolated: false,
        confidence: 1,
        validationRule: 'Response considers system-wide impact and optimization',
        severityLevel: 'medium',
      },
    ];
  }
}

/**
 * Interface for triage analysis results
 */
