/**
 * IRequestRouter - Interface for routing user requests to appropriate agents
 * 
 * This interface defines the contract for analyzing user requests and
 * routing them to the most suitable specialized agent.
 */

import { ISpecializedAgent } from '../../agents/base/ISpecializedAgent';
import { AgentContext, AgentResponse } from '../../agents/base/BaseAgent';

export interface IRequestRouter {
  /**
   * Route a user request to the most appropriate agent
   */
  routeRequest(request: string, context: AgentContext): Promise<RouteResult>;

  /**
   * Analyze request intent and determine routing strategy
   */
  analyzeRequest(request: string): Promise<RequestAnalysis>;
  /**
   * Get routing confidence score for a specific agent
   */
  getRoutingConfidence(request: string, agent: ISpecializedAgent, context?: AgentContext): Promise<number>;

  /**
   * Register routing rules for specific patterns
   */
  registerRoutingRule(rule: RoutingRule): void;

  /**
   * Get all available routing rules
   */
  getRoutingRules(): RoutingRule[];

  /**
   * Update routing weights based on performance
   */
  updateRoutingWeights(agentId: string, performance: PerformanceMetrics): Promise<void>;
}

export interface RouteResult {
  selectedAgent: ISpecializedAgent | null;
  confidence: number;
  reasoning: string;
  alternatives: AlternativeAgent[];
  fallbackStrategy?: string;
}

export interface RequestAnalysis {
  intent: RequestIntent;
  keywords: string[];
  entities: Entity[];
  sentiment: number; // -1 to 1
  urgency: number;   // 0 to 1
  complexity: number; // 0 to 1
}

export interface RequestIntent {
  primary: string;
  secondary: string[];
  confidence: number;
  category: IntentCategory;
}

export type IntentCategory = 'office' | 'fitness' | 'general' | 'coaching' | 'advisory' | 'technical';

export interface Entity {
  type: string;
  value: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface RoutingRule {
  id: string;
  pattern: string | RegExp;
  targetAgentType: string;
  priority: number;
  conditions?: RoutingCondition[];
  weight: number;
}

export interface RoutingCondition {
  type: 'keyword' | 'entity' | 'sentiment' | 'context';
  operator: 'contains' | 'equals' | 'greater_than' | 'less_than';
  value: any;
}

export interface AlternativeAgent {
  agent: ISpecializedAgent;
  confidence: number;
  reasoning: string;
}

export interface PerformanceMetrics {
  responseTime: number;
  userSatisfaction: number;
  taskCompletion: number;
  errorRate: number;
}

// Additional type definitions for complete routing functionality
export interface RoutingRequest {
  content: string;
  userId: string;
  sessionId: string;
  context: AgentContext;
  timestamp: Date;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface RoutingResult {
  selectedAgent: ISpecializedAgent | null;
  confidence: number;
  reasoning: string;
  alternatives: AlternativeAgent[];
  processingTime: number;
  fallbackStrategy?: string;
}

export interface IntentAnalysis {
  primaryIntent: string;
  secondaryIntents: string[];
  confidence: number;
  keywords: string[];
  entities: Entity[];
  sentiment: number;
  urgency: number;
  complexity: number;
}

export interface ConfidenceScore {
  overall: number;
  intentMatch: number;
  keywordMatch: number;
  contextMatch: number;
  historicalPerformance: number;
}

export interface RoutingContext {
  userId: string;
  sessionId: string;
  conversationHistory: any[];
  userPreferences?: Record<string, any>;
  previousAgents?: string[];
  timeOfDay: number;
  deviceType?: string;
}