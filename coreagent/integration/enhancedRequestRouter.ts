/**
 * Enhanced Request Router - Advanced routing with security and context integration
 * Part of Level 2.5 Integration Bridges (Phase 1b)
 * 
 * Provides intelligent request routing with security validation and context awareness.
 */

import { IRequest, IResponse } from '../types/conversation';
import { User } from '../types/user';
import { RequestValidator, ValidationResult, defaultRequestValidator } from '../validation/requestValidator';
import { SimpleAuditLogger, defaultAuditLogger } from '../audit/auditLogger';
import { SecureErrorHandler, defaultSecureErrorHandler } from '../utils/secureErrorHandler';
import { ContextManager, EnrichedContext } from './contextManager';
import { PerformanceBridge } from './performanceBridge';

export interface RoutingRule {
  agentType: string;
  priority: number;
  conditions: RoutingCondition[];
  fallbackAgent?: string;
  resourceRequirements: {
    minMemory: number;
    estimatedTime: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

export interface RoutingCondition {
  type: 'user_permission' | 'rate_limit' | 'content_filter' | 'resource_availability' | 'custom';
  value: any;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
}

export interface RoutingDecision {
  selectedAgent: string;
  confidence: number;
  reasoning: string[];
  alternativeAgents: string[];
  securityChecks: {
    validation: ValidationResult;
    rateLimit: boolean;
    permissions: boolean;
  };
  expectedPerformance: {
    estimatedTime: number;
    complexity: 'low' | 'medium' | 'high';
    resourceUsage: number;
  };
}

export interface EnhancedRequestRouterConfig {
  enableSecurityValidation: boolean;
  enablePerformanceOptimization: boolean;
  enableContextAwareRouting: boolean;
  defaultRoutingRules: RoutingRule[];
  fallbackAgent: string;
  maxRoutingTime: number;
  enableRoutingCache: boolean;
  cacheTimeout: number;
}

export class EnhancedRequestRouter {
  private requestValidator: RequestValidator;
  private auditLogger: SimpleAuditLogger;
  private errorHandler: SecureErrorHandler;
  private contextManager: ContextManager;
  private performanceBridge: PerformanceBridge;
  private config: EnhancedRequestRouterConfig;
  private routingRules: Map<string, RoutingRule> = new Map();
  private routingCache = new Map<string, { decision: RoutingDecision; timestamp: number }>();
  private agentRegistry = new Map<string, any>();

  constructor(
    contextManager: ContextManager,
    performanceBridge: PerformanceBridge,
    config?: Partial<EnhancedRequestRouterConfig>,
    requestValidator?: RequestValidator,
    auditLogger?: SimpleAuditLogger,
    errorHandler?: SecureErrorHandler
  ) {
    this.contextManager = contextManager;
    this.performanceBridge = performanceBridge;
    this.requestValidator = requestValidator || defaultRequestValidator;
    this.auditLogger = auditLogger || defaultAuditLogger;
    this.errorHandler = errorHandler || defaultSecureErrorHandler;
    
    this.config = {
      enableSecurityValidation: true,
      enablePerformanceOptimization: true,
      enableContextAwareRouting: true,
      defaultRoutingRules: this.getDefaultRoutingRules(),
      fallbackAgent: 'generic-gemini',
      maxRoutingTime: 1000, // 1 second
      enableRoutingCache: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      ...config
    };

    this.initializeDefaultRoutes();
  }

  /**
   * Routes a request to the appropriate agent with enhanced security and context
   */
  async routeRequest(request: IRequest, user: User): Promise<RoutingDecision> {
    const routingStartTime = Date.now();
    
    try {
      // Check routing cache first
      if (this.config.enableRoutingCache) {
        const cached = this.getCachedRouting(request, user);
        if (cached) {
          await this.auditLogger.logInfo(
            'ENHANCED_ROUTER',
            'Routing decision retrieved from cache',
            { requestId: request.requestId, selectedAgent: cached.decision.selectedAgent }
          );
          return cached.decision;
        }
      }

      // Create enriched context
      const context = await this.contextManager.createEnrichedContext(request, user);
      
      // Perform security validation
      const securityChecks = await this.performSecurityChecks(request, context);
      
      if (!securityChecks.validation.isValid) {
        throw new Error(`Validation failed: ${securityChecks.validation.errors.join(', ')}`);
      }

      // Make routing decision
      const routingDecision = await this.makeRoutingDecision(request, context, securityChecks);
      
      // Cache the decision
      if (this.config.enableRoutingCache) {
        this.cacheRoutingDecision(request, user, routingDecision);
      }

      const routingTime = Date.now() - routingStartTime;
      
      // Log routing decision
      await this.auditLogger.logInfo(
        'ENHANCED_ROUTER',
        `Request routed to ${routingDecision.selectedAgent}`,
        {
          requestId: request.requestId,
          userId: user.id,
          selectedAgent: routingDecision.selectedAgent,
          confidence: routingDecision.confidence,
          routingTime,
          reasoning: routingDecision.reasoning
        }
      );

      // Check routing performance
      if (routingTime > this.config.maxRoutingTime) {
        await this.auditLogger.logWarning(
          'ROUTING_PERFORMANCE',
          `Routing took longer than expected: ${routingTime}ms`,
          { requestId: request.requestId, maxTime: this.config.maxRoutingTime }
        );
      }

      return routingDecision;    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown routing error';
      await this.auditLogger.logError(
        'ENHANCED_ROUTER',
        `Routing failed: ${errorMessage}`,
        { requestId: request.requestId, userId: user.id }
      );
      
      // Return fallback decision
      return this.createFallbackDecision(request, errorMessage);
    }
  }

  /**
   * Registers an agent with the router
   */
  async registerAgent(agentType: string, agent: any): Promise<void> {
    this.agentRegistry.set(agentType, agent);
    
    await this.auditLogger.logInfo(
      'AGENT_REGISTRY',
      `Agent registered: ${agentType}`,
      { agentType }
    );
  }

  /**
   * Gets available agents
   */
  getAvailableAgents(): string[] {
    return Array.from(this.agentRegistry.keys());
  }

  /**
   * Adds or updates a routing rule
   */
  addRoutingRule(rule: RoutingRule): void {
    this.routingRules.set(rule.agentType, rule);
  }

  /**
   * Gets routing analytics
   */
  async getRoutingAnalytics(): Promise<{
    totalRequests: number;
    agentUsage: Array<{ agentType: string; count: number; averageConfidence: number }>;
    averageRoutingTime: number;
    cacheHitRate: number;
    securityRejections: number;
  }> {
    // This would be implemented with actual metrics tracking
    return {
      totalRequests: 0,
      agentUsage: [],
      averageRoutingTime: 0,
      cacheHitRate: 0,
      securityRejections: 0
    };
  }

  /**
   * Performs comprehensive security checks
   */
  private async performSecurityChecks(
    request: IRequest,
    context: EnrichedContext
  ): Promise<RoutingDecision['securityChecks']> {
    // Request validation
    const validation = this.config.enableSecurityValidation
      ? this.requestValidator.validateRequest(request)
      : { isValid: true, errors: [], warnings: [] };

    // Rate limiting check
    const rateLimitCheck = await this.contextManager.checkRateLimit(context.user.id);
    const rateLimit = rateLimitCheck.allowed;

    // Permission check
    const permissions = this.checkUserPermissions(request, context.user);

    if (!rateLimit) {
      await this.auditLogger.logWarning(
        'RATE_LIMIT_EXCEEDED',
        `Rate limit exceeded for user ${context.user.id}`,
        { userId: context.user.id, requestId: request.requestId }
      );
    }

    return {
      validation,
      rateLimit,
      permissions
    };
  }

  /**
   * Makes the core routing decision
   */
  private async makeRoutingDecision(
    request: IRequest,
    context: EnrichedContext,
    securityChecks: RoutingDecision['securityChecks']
  ): Promise<RoutingDecision> {
    const reasoning: string[] = [];
    let selectedAgent = request.agentType || this.config.fallbackAgent;
    let confidence = 50; // Default confidence

    // Check if requested agent is available
    if (request.agentType && this.agentRegistry.has(request.agentType)) {
      const rule = this.routingRules.get(request.agentType);
      if (rule && this.evaluateRoutingConditions(rule, context)) {
        selectedAgent = request.agentType;
        confidence = 90;
        reasoning.push(`Requested agent ${request.agentType} available and conditions met`);
      } else {
        reasoning.push(`Requested agent ${request.agentType} conditions not met`);
      }
    }

    // Context-aware routing adjustments
    if (this.config.enableContextAwareRouting) {
      const contextAdjustment = this.getContextAwareRecommendation(request, context);
      if (contextAdjustment.agent !== selectedAgent && contextAdjustment.confidence > confidence) {
        selectedAgent = contextAdjustment.agent;
        confidence = contextAdjustment.confidence;
        reasoning.push(`Context-aware routing suggested ${selectedAgent}: ${contextAdjustment.reason}`);
      }
    }

    // Performance-aware routing
    if (this.config.enablePerformanceOptimization) {
      const performanceAdjustment = await this.getPerformanceAwareRecommendation(selectedAgent, context);
      if (performanceAdjustment.shouldSwitch) {
        selectedAgent = performanceAdjustment.recommendedAgent;
        confidence = Math.min(confidence, 75); // Reduce confidence for performance switch
        reasoning.push(`Performance optimization switched to ${selectedAgent}: ${performanceAdjustment.reason}`);
      }
    }

    // Ensure selected agent is registered
    if (!this.agentRegistry.has(selectedAgent)) {
      selectedAgent = this.config.fallbackAgent;
      confidence = 30;
      reasoning.push(`Selected agent not available, using fallback: ${selectedAgent}`);
    }

    // Build alternative agents list
    const alternativeAgents = this.getAlternativeAgents(selectedAgent, request, context);

    // Calculate expected performance
    const expectedPerformance = this.calculateExpectedPerformance(selectedAgent, context);

    return {
      selectedAgent,
      confidence,
      reasoning,
      alternativeAgents,
      securityChecks,
      expectedPerformance
    };
  }

  /**
   * Evaluates routing conditions for a rule
   */
  private evaluateRoutingConditions(rule: RoutingRule, context: EnrichedContext): boolean {
    return rule.conditions.every(condition => {
      switch (condition.type) {
        case 'user_permission':
          return context.user.permissions?.includes(condition.value) || false;
        case 'rate_limit':
          return context.security.rateLimitInfo.requestsInWindow < condition.value;
        case 'resource_availability':
          return context.performance.resourceLimits.maxMemoryUsage >= rule.resourceRequirements.minMemory;
        default:
          return true;
      }
    });
  }

  /**
   * Gets context-aware agent recommendation
   */
  private getContextAwareRecommendation(
    request: IRequest,
    context: EnrichedContext
  ): { agent: string; confidence: number; reason: string } {
    // Analyze conversation history
    if (context.session.agentHistory.length > 0) {
      const lastAgent = context.session.agentHistory[context.session.agentHistory.length - 1];
      const agentFrequency = context.session.agentHistory.filter(a => a === lastAgent).length;
      
      if (agentFrequency > 3 && lastAgent !== 'generic-gemini') {
        return {
          agent: lastAgent,
          confidence: 80,
          reason: `User frequently uses ${lastAgent} (${agentFrequency} times)`
        };
      }
    }

    // Analyze custom instructions
    if (context.userProfile?.customInstructions) {
      const instructions = context.userProfile.customInstructions.toLowerCase();
      
      if (instructions.includes('code') || instructions.includes('development')) {
        return { agent: 'dev', confidence: 85, reason: 'Custom instructions indicate development focus' };
      }
      if (instructions.includes('health') || instructions.includes('fitness')) {
        return { agent: 'fitness', confidence: 85, reason: 'Custom instructions indicate fitness focus' };
      }
      if (instructions.includes('research') || instructions.includes('analysis')) {
        return { agent: 'research', confidence: 85, reason: 'Custom instructions indicate research focus' };
      }
    }

    // Analyze prompt content
    if (request.prompt) {
      const prompt = request.prompt.toLowerCase();
      if (prompt.includes('code') || prompt.includes('programming') || prompt.includes('debug')) {
        return { agent: 'dev', confidence: 75, reason: 'Prompt content suggests development task' };
      }
      if (prompt.includes('search') || prompt.includes('find') || prompt.includes('research')) {
        return { agent: 'research', confidence: 75, reason: 'Prompt content suggests research task' };
      }
    }

    return { agent: request.agentType || 'generic-gemini', confidence: 50, reason: 'No specific context indicators' };
  }

  /**
   * Gets performance-aware routing recommendation
   */
  private async getPerformanceAwareRecommendation(
    selectedAgent: string,
    context: EnrichedContext
  ): Promise<{ shouldSwitch: boolean; recommendedAgent: string; reason: string }> {
    const agentPerformance = await this.performanceBridge.getComponentPerformance(selectedAgent);
    
    if (!agentPerformance) {
      return { shouldSwitch: false, recommendedAgent: selectedAgent, reason: 'No performance data available' };
    }

    // Check if agent is in critical state
    if (agentPerformance.status === 'critical') {
      return {
        shouldSwitch: true,
        recommendedAgent: this.config.fallbackAgent,
        reason: `Agent ${selectedAgent} is in critical state`
      };
    }

    // Check response time thresholds
    if (agentPerformance.averageLatency > 5000 && context.performance.estimatedComplexity === 'low') {
      return {
        shouldSwitch: true,
        recommendedAgent: 'generic-gemini',
        reason: `Agent ${selectedAgent} has high latency (${agentPerformance.averageLatency}ms) for low complexity task`
      };
    }

    return { shouldSwitch: false, recommendedAgent: selectedAgent, reason: 'Performance metrics acceptable' };
  }

  /**
   * Gets alternative agents for fallback
   */  private getAlternativeAgents(selectedAgent: string, _request: IRequest, context: EnrichedContext): string[] {
    const alternatives: string[] = [];
    const availableAgents = this.getAvailableAgents();
    
    // Add generic fallback
    if (selectedAgent !== 'generic-gemini') {
      alternatives.push('generic-gemini');
    }
    
    // Add contextually similar agents
    if (selectedAgent === 'dev' && availableAgents.includes('stem')) {
      alternatives.push('stem');
    }
    if (selectedAgent === 'research' && availableAgents.includes('office')) {
      alternatives.push('office');
    }
    
    // Add based on user history
    const frequentAgents = this.getFrequentlyUsedAgents(context.session.agentHistory);
    alternatives.push(...frequentAgents.filter(a => !alternatives.includes(a) && a !== selectedAgent));
    
    return alternatives.slice(0, 3); // Limit to 3 alternatives
  }

  /**
   * Calculates expected performance for selected agent
   */
  private calculateExpectedPerformance(
    selectedAgent: string,
    context: EnrichedContext
  ): RoutingDecision['expectedPerformance'] {
    const rule = this.routingRules.get(selectedAgent);
    const baseTime = rule?.resourceRequirements.estimatedTime || 3000; // 3 seconds default
    
    // Adjust based on complexity
    let estimatedTime = baseTime;
    switch (context.performance.estimatedComplexity) {
      case 'low':
        estimatedTime *= 0.5;
        break;
      case 'high':
        estimatedTime *= 2;
        break;
    }
    
    return {
      estimatedTime,
      complexity: context.performance.estimatedComplexity,
      resourceUsage: rule?.resourceRequirements.minMemory || 50 // MB
    };
  }

  /**
   * Creates fallback routing decision
   */
  private createFallbackDecision(_request: IRequest, errorMessage: string): RoutingDecision {
    return {
      selectedAgent: this.config.fallbackAgent,
      confidence: 20,
      reasoning: [`Fallback due to error: ${errorMessage}`],
      alternativeAgents: [],
      securityChecks: {
        validation: { isValid: false, errors: [errorMessage], warnings: [] },
        rateLimit: true,
        permissions: true
      },
      expectedPerformance: {
        estimatedTime: 5000,
        complexity: 'medium',
        resourceUsage: 50
      }
    };
  }

  /**
   * Cache management methods
   */
  private getCachedRouting(request: IRequest, user: User): { decision: RoutingDecision } | null {
    const cacheKey = this.generateCacheKey(request, user);
    const cached = this.routingCache.get(cacheKey);
    
    if (!cached || Date.now() - cached.timestamp > this.config.cacheTimeout) {
      if (cached) this.routingCache.delete(cacheKey);
      return null;
    }
    
    return cached;
  }

  private cacheRoutingDecision(request: IRequest, user: User, decision: RoutingDecision): void {
    const cacheKey = this.generateCacheKey(request, user);
    this.routingCache.set(cacheKey, {
      decision,
      timestamp: Date.now()
    });
  }

  private generateCacheKey(request: IRequest, user: User): string {
    return `${user.id}_${request.agentType}_${request.prompt?.substring(0, 50) || ''}`;
  }

  /**
   * Helper methods
   */
  private checkUserPermissions(request: IRequest, user: User): boolean {
    const requiredPermission = this.getRequiredPermission(request.agentType || '');
    return user.permissions?.includes(requiredPermission) || user.permissions?.includes('admin') || false;
  }

  private getRequiredPermission(agentType: string): string {
    const permissionMap: Record<string, string> = {
      'dev': 'development',
      'office': 'office_access',
      'medical': 'medical_access'
    };
    return permissionMap[agentType] || 'basic';
  }

  private getFrequentlyUsedAgents(agentHistory: string[]): string[] {
    const frequency = new Map<string, number>();
    agentHistory.forEach(agent => {
      frequency.set(agent, (frequency.get(agent) || 0) + 1);
    });
    
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([agent]) => agent);
  }

  private getDefaultRoutingRules(): RoutingRule[] {
    return [
      {
        agentType: 'research',
        priority: 80,
        conditions: [],
        resourceRequirements: { minMemory: 100, estimatedTime: 5000, complexity: 'high' }
      },
      {
        agentType: 'dev',
        priority: 85,
        conditions: [{ type: 'user_permission', value: 'development', operator: 'equals' }],
        resourceRequirements: { minMemory: 150, estimatedTime: 7000, complexity: 'high' }
      },
      {
        agentType: 'fitness',
        priority: 70,
        conditions: [],
        resourceRequirements: { minMemory: 50, estimatedTime: 2000, complexity: 'low' }
      },
      {
        agentType: 'generic-gemini',
        priority: 60,
        conditions: [],
        resourceRequirements: { minMemory: 30, estimatedTime: 3000, complexity: 'medium' }
      }
    ];
  }

  private initializeDefaultRoutes(): void {
    this.config.defaultRoutingRules.forEach(rule => {
      this.routingRules.set(rule.agentType, rule);
    });
  }

  /**
   * Gets current router configuration
   */
  getConfig(): EnhancedRequestRouterConfig {
    return { ...this.config };
  }

  /**
   * Updates router configuration
   */
  updateConfig(newConfig: Partial<EnhancedRequestRouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default EnhancedRequestRouter;
