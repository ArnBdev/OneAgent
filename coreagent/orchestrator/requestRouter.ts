/**
 * RequestRouter - Implementation of request routing to appropriate agents
 * 
 * This class analyzes user requests and routes them to the most suitable
 * specialized agent based on intent, keywords, and context.
 */

import { 
  IRequestRouter, 
  RouteResult, 
  RequestAnalysis, 
  RoutingRule, 
  PerformanceMetrics,
  RequestIntent,
  Entity,
  AlternativeAgent
} from './interfaces/IRequestRouter';
import { ISpecializedAgent } from '../agents/base/ISpecializedAgent';
import { AgentContext } from '../agents/base/BaseAgent_new';
import { IAgentRegistry } from './interfaces/IAgentRegistry';

export class RequestRouter implements IRequestRouter {
  private registry: IAgentRegistry;
  private routingRules: RoutingRule[] = [];
  private performanceData: Map<string, PerformanceMetrics> = new Map();

  constructor(registry: IAgentRegistry) {
    this.registry = registry;
    this.initializeDefaultRules();
  }
  /**
   * Route a user request to the most appropriate agent
   */
  async routeRequest(request: string, context: AgentContext): Promise<RouteResult> {
    try {
      // Analyze the request
      const analysis = await this.analyzeRequest(request);
      
      // Get all available agents
      const agents = this.registry.getAllAgents();
      
      if (agents.length === 0) {
        return {
          selectedAgent: null,
          confidence: 0,
          reasoning: 'No agents available',
          alternatives: [],
          fallbackStrategy: 'manual_handling'
        };
      }

      // Score each agent for this request
      const scoredAgents: Array<{ agent: ISpecializedAgent; score: number; reasoning: string }> = [];
      
      for (const agent of agents) {
        const score = await this.scoreAgent(agent, analysis, request, context);
        const reasoning = this.generateReasoning(agent, analysis, score, context);
        scoredAgents.push({ agent, score, reasoning });
      }

      // Sort by score descending
      scoredAgents.sort((a, b) => b.score - a.score);

      const selectedAgent = scoredAgents[0];
      const alternatives: AlternativeAgent[] = scoredAgents
        .slice(1, 4) // Top 3 alternatives
        .map(item => ({
          agent: item.agent,
          confidence: item.score,
          reasoning: item.reasoning
        }));

      return {
        selectedAgent: selectedAgent.score > 0.3 ? selectedAgent.agent : null,
        confidence: selectedAgent.score,
        reasoning: selectedAgent.reasoning,
        alternatives,
        fallbackStrategy: selectedAgent.score <= 0.3 ? 'general_agent' : 'direct_routing'
      };

    } catch (error) {
      console.error('Request routing error:', error);
      return {
        selectedAgent: null,
        confidence: 0,
        reasoning: `Routing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        alternatives: [],
        fallbackStrategy: 'error_handling'
      };
    }
  }

  /**
   * Analyze request intent and determine routing strategy
   */
  async analyzeRequest(request: string): Promise<RequestAnalysis> {
    const lowerRequest = request.toLowerCase();
    
    // Extract keywords
    const keywords = this.extractKeywords(lowerRequest);
    
    // Extract entities
    const entities = this.extractEntities(request);
    
    // Determine intent
    const intent = this.determineIntent(lowerRequest, keywords);
    
    // Calculate sentiment (-1 to 1)
    const sentiment = this.calculateSentiment(lowerRequest);
    
    // Calculate urgency (0 to 1)
    const urgency = this.calculateUrgency(lowerRequest);
    
    // Calculate complexity (0 to 1)
    const complexity = this.calculateComplexity(request);

    return {
      intent,
      keywords,
      entities,
      sentiment,
      urgency,
      complexity
    };
  }
  /**
   * Get routing confidence score for a specific agent
   */
  async getRoutingConfidence(request: string, agent: ISpecializedAgent, context?: AgentContext): Promise<number> {
    const analysis = await this.analyzeRequest(request);
    return await this.scoreAgent(agent, analysis, request, context);
  }

  /**
   * Register routing rules for specific patterns
   */
  registerRoutingRule(rule: RoutingRule): void {
    this.routingRules.push(rule);
    // Sort by priority descending
    this.routingRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get all available routing rules
   */
  getRoutingRules(): RoutingRule[] {
    return [...this.routingRules];
  }

  /**
   * Update routing weights based on performance
   */
  async updateRoutingWeights(agentId: string, performance: PerformanceMetrics): Promise<void> {
    this.performanceData.set(agentId, performance);
    
    // Update routing rules weights based on performance
    const performanceScore = this.calculatePerformanceScore(performance);
    
    for (const rule of this.routingRules) {
      if (rule.targetAgentType === agentId) {
        rule.weight = Math.max(0.1, rule.weight * performanceScore);
      }
    }
  }
  /**
   * Score an agent for a given request analysis
   */
  private async scoreAgent(agent: ISpecializedAgent, analysis: RequestAnalysis, request: string, context?: AgentContext): Promise<number> {
    let score = 0;

    // Base capability matching
    const capabilityScore = this.scoreAgentCapabilities(agent, analysis);
    score += capabilityScore * 0.35; // Reduced weight to accommodate custom instructions

    // Rule-based scoring
    const ruleScore = this.scoreAgentRules(agent, request, analysis);
    score += ruleScore * 0.25; // Reduced weight

    // Performance-based scoring
    const performanceScore = this.getAgentPerformanceScore(agent.id);
    score += performanceScore * 0.2;

    // Health-based scoring
    const healthScore = agent.getStatus().isHealthy ? 1.0 : 0.5;
    score += healthScore * 0.1;

    // Custom instructions scoring (new)
    if (context?.enrichedContext?.userProfile?.customInstructions) {
      const customInstructionsScore = this.scoreAgentByCustomInstructions(
        agent, 
        context.enrichedContext.userProfile.customInstructions, 
        request
      );
      score += customInstructionsScore * 0.1; // 10% weight for user preferences
    }

    return Math.min(score, 1.0);
  }

  /**
   * Score agent capabilities against request
   */
  private scoreAgentCapabilities(agent: ISpecializedAgent, analysis: RequestAnalysis): number {
    const capabilities = agent.config.capabilities;
    let score = 0;

    // Intent matching
    switch (analysis.intent.category) {
      case 'office':
        if (capabilities.some(cap => ['document_processing', 'calendar_management', 'email_assistance'].includes(cap))) {
          score += 0.8;
        }
        break;
      case 'fitness':
        if (capabilities.some(cap => ['workout_planning', 'nutrition_tracking', 'progress_monitoring'].includes(cap))) {
          score += 0.8;
        }
        break;
      case 'general':
        if (capabilities.includes('conversation')) {
          score += 0.6;
        }
        break;
    }

    // Keyword matching
    for (const keyword of analysis.keywords) {
      if (capabilities.some(cap => cap.includes(keyword))) {
        score += 0.1;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Score agent using routing rules
   */
  private scoreAgentRules(agent: ISpecializedAgent, request: string, analysis: RequestAnalysis): number {
    let score = 0;

    for (const rule of this.routingRules) {
      if (this.ruleMatches(rule, request, analysis)) {
        if (rule.targetAgentType === agent.id || 
            agent.config.capabilities.includes(rule.targetAgentType)) {
          score += rule.weight;
        }
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Check if a routing rule matches the request
   */
  private ruleMatches(rule: RoutingRule, request: string, analysis: RequestAnalysis): boolean {
    // Pattern matching
    if (rule.pattern instanceof RegExp) {
      if (!rule.pattern.test(request)) return false;
    } else {
      if (!request.toLowerCase().includes(rule.pattern.toLowerCase())) return false;
    }

    // Condition checking
    if (rule.conditions) {
      for (const condition of rule.conditions) {
        if (!this.evaluateCondition(condition, analysis, request)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Evaluate a routing condition
   */
  private evaluateCondition(condition: any, analysis: RequestAnalysis, _request: string): boolean {
    // Implementation would depend on condition type
    // This is a simplified version
    switch (condition.type) {
      case 'keyword':
        return analysis.keywords.includes(condition.value);
      case 'sentiment':
        return this.compareNumbers(analysis.sentiment, condition.operator, condition.value);
      default:
        return true;
    }
  }

  /**
   * Compare numbers based on operator
   */
  private compareNumbers(value: number, operator: string, target: number): boolean {
    switch (operator) {
      case 'greater_than': return value > target;
      case 'less_than': return value < target;
      case 'equals': return Math.abs(value - target) < 0.1;
      default: return false;
    }
  }

  /**
   * Get agent performance score
   */
  private getAgentPerformanceScore(agentId: string): number {
    const performance = this.performanceData.get(agentId);
    if (!performance) return 0.5; // Default score

    return this.calculatePerformanceScore(performance);
  }

  /**
   * Calculate performance score from metrics
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    const responseTimeScore = Math.max(0, 1 - (metrics.responseTime / 5000)); // 5 second baseline
    const satisfactionScore = metrics.userSatisfaction;
    const completionScore = metrics.taskCompletion;
    const errorScore = Math.max(0, 1 - metrics.errorRate);

    return (responseTimeScore + satisfactionScore + completionScore + errorScore) / 4;
  }

  /**
   * Generate reasoning for agent selection
   */  private generateReasoning(agent: ISpecializedAgent, analysis: RequestAnalysis, score: number, context?: AgentContext): string {
    const reasons: string[] = [];

    if (score > 0.7) {
      reasons.push(`Strong capability match for ${analysis.intent.category} tasks`);
    } else if (score > 0.4) {
      reasons.push(`Moderate capability match`);
    } else {
      reasons.push(`Limited capability match`);
    }

    if (agent.getStatus().isHealthy) {
      reasons.push('Agent is healthy and responsive');
    }

    // Add custom instructions consideration
    if (context?.enrichedContext?.userProfile?.customInstructions) {
      const customScore = this.scoreAgentByCustomInstructions(
        agent, 
        context.enrichedContext.userProfile.customInstructions, 
        ''
      );
      if (customScore > 0.5) {
        reasons.push('Aligns well with user preferences');
      } else if (customScore > 0.2) {
        reasons.push('Partially matches user preferences');
      }
    }

    return reasons.join(', ');
  }
  /**
   * Score agent based on user's custom instructions
   */
  private scoreAgentByCustomInstructions(agent: ISpecializedAgent, customInstructions: string, _request: string): number {
    let score = 0;
    const instructions = customInstructions.toLowerCase();
    const agentType = agent.id.toLowerCase();
    
    // Check if custom instructions mention specific agent types
    if (instructions.includes('office') || instructions.includes('document') || instructions.includes('calendar')) {
      if (agentType.includes('office')) {
        score += 0.6;
      } else {
        score -= 0.2; // Penalize if user prefers office but this isn't office agent
      }
    }
    
    if (instructions.includes('fitness') || instructions.includes('workout') || instructions.includes('health')) {
      if (agentType.includes('fitness')) {
        score += 0.6;
      } else {
        score -= 0.2; // Penalize if user prefers fitness but this isn't fitness agent
      }
    }
    
    // Check for communication style preferences
    if (instructions.includes('formal') || instructions.includes('professional')) {
      if (agentType.includes('office')) {
        score += 0.2;
      }
    }
    
    if (instructions.includes('casual') || instructions.includes('friendly') || instructions.includes('motivational')) {
      if (agentType.includes('fitness')) {
        score += 0.2;
      }
    }
    
    // Check for specific capability preferences mentioned in instructions
    const capabilities = agent.config.capabilities;
    for (const capability of capabilities) {
      if (instructions.includes(capability.replace('_', ' '))) {
        score += 0.1;
      }
    }
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Extract keywords from request
   */
  private extractKeywords(request: string): string[] {
    const keywords: string[] = [];
    const words = request.split(/\s+/);
    
    // Simple keyword extraction - could be enhanced with NLP
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'but', 'for', 'with', 'this', 'that', 'they', 'have'].includes(word)
    );

    return importantWords.slice(0, 10); // Limit to top 10
  }

  /**
   * Extract entities from request
   */
  private extractEntities(request: string): Entity[] {
    // Simplified entity extraction
    const entities: Entity[] = [];
    
    // Date patterns
    const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
    let match;
    while ((match = datePattern.exec(request)) !== null) {
      entities.push({
        type: 'date',
        value: match[0],
        confidence: 0.9,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    return entities;
  }

  /**
   * Determine request intent
   */
  private determineIntent(_request: string, keywords: string[]): RequestIntent {
    // Simplified intent detection
    let category: any = 'general';
    let confidence = 0.5;

    if (keywords.some(k => ['document', 'email', 'calendar', 'meeting'].includes(k))) {
      category = 'office';
      confidence = 0.8;
    } else if (keywords.some(k => ['workout', 'fitness', 'exercise', 'nutrition'].includes(k))) {
      category = 'fitness';
      confidence = 0.8;
    }

    return {
      primary: category,
      secondary: [],
      confidence,
      category
    };
  }

  /**
   * Calculate sentiment score
   */
  private calculateSentiment(request: string): number {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'love'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'problem'];

    let score = 0;
    for (const word of positiveWords) {
      if (request.includes(word)) score += 0.2;
    }
    for (const word of negativeWords) {
      if (request.includes(word)) score -= 0.2;
    }

    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Calculate urgency score
   */
  private calculateUrgency(request: string): number {
    const urgentWords = ['urgent', 'asap', 'immediately', 'quickly', 'emergency'];
    let urgency = 0;

    for (const word of urgentWords) {
      if (request.includes(word)) urgency += 0.3;
    }

    return Math.min(1, urgency);
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexity(request: string): number {
    // Simple complexity based on length and structure
    const wordCount = request.split(/\s+/).length;
    const questionMarks = (request.match(/\?/g) || []).length;
    const commas = (request.match(/,/g) || []).length;

    let complexity = (wordCount / 50) + (questionMarks * 0.1) + (commas * 0.05);
    return Math.min(1, complexity);
  }

  /**
   * Initialize default routing rules
   */
  private initializeDefaultRules(): void {
    this.registerRoutingRule({
      id: 'office_documents',
      pattern: /document|file|write|create|edit/i,
      targetAgentType: 'office',
      priority: 8,
      weight: 0.8
    });

    this.registerRoutingRule({
      id: 'fitness_workout',
      pattern: /workout|exercise|fitness|gym|training/i,
      targetAgentType: 'fitness',
      priority: 8,
      weight: 0.8
    });

    this.registerRoutingRule({
      id: 'general_help',
      pattern: /help|question|information/i,
      targetAgentType: 'general',
      priority: 3,
      weight: 0.5
    });
  }
}