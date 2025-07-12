/**
 * Types for Conversational Multi-Agent System
 * 
 * These types enable natural language discussions between AI agents
 * that go beyond simple task coordination to produce collaborative insights.
 */

export interface ConversationContext {
  domain: string;              // The subject domain (e.g., "software-architecture", "business-strategy")
  complexityLevel: number;     // 1-10 scale of topic complexity
  stakeholders: string[];      // Who cares about this discussion
  constraints: string[];       // Limitations or requirements
  timeHorizon: string;        // "immediate", "short-term", "long-term"
  riskLevel: "low" | "medium" | "high";
  metadata: Record<string, unknown>;
}

export enum DialogueState {
  LISTENING = "listening",
  CONTRIBUTING = "contributing", 
  CHALLENGING = "challenging",
  SYNTHESIZING = "synthesizing",
  QUESTIONING = "questioning",
  BUILDING = "building",
  CONCLUDING = "concluding"
}

export interface AgentPersonality {
  perspective: string;         // "analytical", "creative", "skeptical", "optimistic", etc.
  communicationStyle: string;  // "direct", "diplomatic", "socratic", "collaborative", etc.
  expertiseFocus: string[];    // Areas of specialized knowledge
  cognitiveStyle: string;      // "systems-thinking", "detail-oriented", "big-picture", etc.
  biases: string[];           // Known cognitive biases or preferences
  confidence: number;         // Base confidence level (0-1)
}

export interface ConversationTurn {
  agentId: string;
  content: string;
  turnType: TurnType;
  timestamp: Date;
  responseToTurn?: string;     // ID of turn this is responding to
  confidence: number;
  perspective: string;
}

export enum TurnType {
  INITIAL_CONTRIBUTION = "initial",
  RESPONSE = "response", 
  CHALLENGE = "challenge",
  BUILD_ON = "build-on",
  CLARIFICATION = "clarification",
  SYNTHESIS = "synthesis",
  QUESTION = "question",
  CONCLUSION = "conclusion"
}

export interface DiscussionThread {
  threadId: string;
  topic: string;
  context: ConversationContext;
  participants: string[];      // Agent IDs
  turns: ConversationTurn[];
  insights: Insight[];
  status: ThreadStatus;
  startTime: Date;
  lastActivity: Date;
}

export enum ThreadStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  CONCLUDED = "concluded",
  NEEDS_FACILITATION = "needs-facilitation"
}

export interface Insight {
  insightId: string;
  content: string;
  sourceAgents: string[];      // Which agents contributed to this insight
  insightType: InsightType;
  confidence: number;
  novelty: number;            // How novel is this insight (0-1)
  timestamp: Date;
  supportingEvidence: string[];
}

export enum InsightType {
  SYNTHESIS = "synthesis",        // Combining multiple perspectives
  NOVEL_CONNECTION = "novel-connection",  // Finding unexpected relationships
  CONTRADICTION_RESOLUTION = "contradiction-resolution",
  ASSUMPTION_CHALLENGE = "assumption-challenge", 
  CREATIVE_SOLUTION = "creative-solution",
  RISK_IDENTIFICATION = "risk-identification",
  OPPORTUNITY_DISCOVERY = "opportunity-discovery"
}

export interface ConversationMemory {
  discussions: Map<string, DiscussionThread>;
  agentContributions: Map<string, ConversationTurn[]>;
  insights: Insight[];
  relationships: AgentRelationship[];
  
  // Methods for memory management
  addTurn(threadId: string, turn: ConversationTurn): void;
  getRelevantHistory(agentId: string, topic: string): ConversationTurn[];
  findSimilarDiscussions(context: ConversationContext): DiscussionThread[];
  updateInsights(newInsight: Insight): void;
}

export interface AgentRelationship {
  agentA: string;
  agentB: string;
  relationshipType: RelationshipType;
  collaborationQuality: number;  // 0-1 scale
  agreementRate: number;         // How often they agree
  complementarity: number;       // How well they complement each other
  conflictResolutionStyle: string;
}

export enum RelationshipType {
  COMPLEMENTARY = "complementary",    // Different but compatible perspectives
  COMPETITIVE = "competitive",        // Often disagree, but productively
  SYNERGISTIC = "synergistic",       // Build naturally on each other's ideas
  CHALLENGING = "challenging",        // One often challenges the other
  NEUTRAL = "neutral"                // No strong pattern
}

export interface DialogueFacilitator {
  // AI system that manages multi-agent conversations
  facilitateDiscussion(topic: string, context: ConversationContext, participants: string[]): Promise<DiscussionThread>;
  moderateConflict(threadId: string, conflictingTurns: ConversationTurn[]): Promise<ConversationTurn>;
  suggestNextSpeaker(threadId: string): Promise<string>;
  assessDiscussionQuality(threadId: string): Promise<DiscussionQualityAssessment>;
  identifyEmergingInsights(threadId: string): Promise<Insight[]>;
  concludeDiscussion(threadId: string): Promise<DiscussionSummary>;
}

export interface DiscussionQualityAssessment {
  overallQuality: number;           // 0-100 scale
  perspectiveDiversity: number;     // How many different viewpoints represented
  constructiveEngagement: number;   // How well agents build on each other
  insightGeneration: number;        // Quality and novelty of insights produced
  participationBalance: number;     // How evenly distributed participation is
  topicCoverage: number;           // How thoroughly the topic was explored
  
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface DiscussionSummary {
  threadId: string;
  topic: string;
  participants: string[];
  duration: number;               // Minutes
  turnCount: number;
  keyInsights: Insight[];
  majorPoints: string[];
  areasOfAgreement: string[];
  unresolvedQuestions: string[];
  recommendedFollowup: string[];
  qualityAssessment: DiscussionQualityAssessment;
}

export interface ConversationAnalytics {
  // For understanding conversation patterns and improving agent interactions
  analyzeTurnPatterns(threadId: string): TurnPatternAnalysis;
  identifySuccessfulInteractions(timeframe: string): SuccessfulInteraction[];
  assessAgentCompatibility(agentA: string, agentB: string): CompatibilityReport;
  recommendOptimalGroupings(topic: string, availableAgents: string[]): AgentGrouping[];
}

export interface TurnPatternAnalysis {
  averageTurnLength: number;
  responseLatency: number;
  buildOnRate: number;           // How often agents build on previous ideas
  challengeRate: number;         // How often they challenge assumptions
  questionRate: number;          // How often they ask clarifying questions
  insightDensity: number;        // Insights per turn
}

export interface SuccessfulInteraction {
  participants: string[];
  topic: string;
  qualityScore: number;
  insightsGenerated: number;
  whatMadeItSuccessful: string[];
  replicablePatterns: string[];
}

export interface CompatibilityReport {
  compatibilityScore: number;    // 0-100
  complementaryStrengths: string[];
  potentialConflicts: string[];
  recommendedRoles: { [agentId: string]: string };
  historicalPerformance: number[];
}

export interface AgentGrouping {
  agents: string[];
  projectedQuality: number;
  reasoningForGrouping: string;
  suggestedRoles: { [agentId: string]: string };
  potentialRisks: string[];
}

/**
 * Example conversation flow:
 * 
 * 1. Topic introduced with context
 * 2. Facilitator selects initial participants based on expertise/compatibility
 * 3. Agents make initial contributions based on their personalities and expertise
 * 4. Facilitator guides turn-taking and identifies when to introduce new perspectives
 * 5. Agents respond to each other, building, challenging, questioning as appropriate
 * 6. Facilitator identifies emerging insights and helps agents explore them
 * 7. When discussion reaches natural conclusion, facilitator summarizes and extracts insights
 * 8. Analytics system learns from successful patterns for future conversations
 */
