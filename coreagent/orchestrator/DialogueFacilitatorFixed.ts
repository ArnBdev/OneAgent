/**
 * DialogueFacilitatorFixed: Working implementation for orchestrating multi-agent conversations
 * 
 * This system manages natural language discussions between AI agents to produce
 * collaborative insights that go beyond what any single agent could achieve.
 */

import { 
  ConversationContext, 
  DiscussionThread, 
  ConversationTurn, 
  TurnType,
  DialogueState,
  Insight,
  InsightType,
  DiscussionQualityAssessment,
  DiscussionSummary,
  ThreadStatus,
  AgentPersonality
} from '../types/ConversationTypes';

import { ConversationalAgent, AgentContribution } from '../agents/ConversationalAgentFixed';

export class DialogueFacilitatorFixed {
  private activeDiscussions: Map<string, DiscussionThread> = new Map();
  private qualityThreshold: number = 0.7;
  private agents: Map<string, ConversationalAgent> = new Map();

  /**
   * Register agents for participation in discussions
   */
  registerAgent(agent: ConversationalAgent): void {
    this.agents.set(agent.agentId, agent);
  }

  /**
   * Create agent personalities for diverse conversations
   */
  createDiverseAgents(): ConversationalAgent[] {
    const personalities: AgentPersonality[] = [
      {
        perspective: "analytical",
        communicationStyle: "direct",
        expertiseFocus: ["data-analysis", "systems-thinking"],
        cognitiveStyle: "detail-oriented",
        biases: ["confirmation-bias"],
        confidence: 0.8
      },
      {
        perspective: "creative",
        communicationStyle: "collaborative", 
        expertiseFocus: ["innovation", "design-thinking"],
        cognitiveStyle: "big-picture",
        biases: ["optimism-bias"],
        confidence: 0.7
      },
      {
        perspective: "skeptical",
        communicationStyle: "diplomatic",
        expertiseFocus: ["risk-assessment", "critical-thinking"],
        cognitiveStyle: "systems-thinking",
        biases: ["negativity-bias"],
        confidence: 0.9
      }
    ];

    return personalities.map((personality, index) => {
      const agent = new ConversationalAgent(
        `agent-${index + 1}`,
        "conversational",
        personality
      );
      this.registerAgent(agent);
      return agent;
    });
  }

  /**
   * Start a new multi-agent discussion on a given topic
   */
  async facilitateDiscussion(
    topic: string, 
    context: ConversationContext, 
    participantIds: string[]
  ): Promise<DiscussionThread> {
    
    const threadId = this.generateThreadId(topic);
    
    const thread: DiscussionThread = {
      threadId,
      topic,
      context,
      participants: participantIds,
      turns: [],
      insights: [],
      status: ThreadStatus.ACTIVE,
      startTime: new Date(),
      lastActivity: new Date()
    };

    this.activeDiscussions.set(threadId, thread);

    // Get initial contributions from all participants
    const initialContributions = await this.gatherInitialContributions(topic, context, participantIds);
    
    // Add initial turns to thread
    for (const contribution of initialContributions) {
      const turn: ConversationTurn = {
        agentId: contribution.agentId,
        content: contribution.content,
        turnType: TurnType.INITIAL_CONTRIBUTION,
        timestamp: contribution.timestamp,
        confidence: contribution.confidence,
        perspective: contribution.perspective
      };
      thread.turns.push(turn);
    }

    // Facilitate follow-up discussion
    await this.facilitateFollowUpRounds(threadId, 3); // 3 rounds of discussion

    return thread;
  }

  /**
   * Gather initial contributions from all participants
   */
  private async gatherInitialContributions(
    topic: string,
    context: ConversationContext,
    participantIds: string[]
  ): Promise<AgentContribution[]> {
    const contributions: AgentContribution[] = [];
    
    for (const agentId of participantIds) {
      const agent = this.agents.get(agentId);
      if (agent) {
        const contribution = await agent.engageInDiscussion(topic, context, contributions);
        contributions.push(contribution);
      }
    }
    
    return contributions;
  }

  /**
   * Facilitate multiple rounds of agent-to-agent responses
   */
  private async facilitateFollowUpRounds(threadId: string, rounds: number): Promise<void> {
    const thread = this.activeDiscussions.get(threadId);
    if (!thread) return;

    for (let round = 0; round < rounds; round++) {
      const responses = await this.gatherRoundResponses(thread);
      
      // Add responses to thread
      for (const response of responses) {
        const turn: ConversationTurn = {
          agentId: response.agentId,
          content: response.content,
          turnType: TurnType.RESPONSE,
          timestamp: response.timestamp,
          confidence: response.confidence,
          perspective: response.perspective
        };
        thread.turns.push(turn);
      }

      // Check if we should continue or conclude
      const quality = await this.assessDiscussionQuality(threadId);
      if (quality.overallQuality > 85 || thread.turns.length > 15) {
        break; // Natural conclusion reached
      }
    }
  }

  /**
   * Gather responses from agents for the current round
   */
  private async gatherRoundResponses(thread: DiscussionThread): Promise<AgentContribution[]> {
    const responses: AgentContribution[] = [];
    const recentTurns = thread.turns.slice(-thread.participants.length);
    
    for (const agentId of thread.participants) {
      const agent = this.agents.get(agentId);
      if (!agent) continue;

      // Find the most recent turn from a different agent
      const otherAgentTurn = recentTurns.find(turn => turn.agentId !== agentId);
      if (otherAgentTurn) {
        const conversationHistory = agent['conversationMemory']; // Access private member for demo
        const response = await agent.respondToAgent(
          otherAgentTurn.content,
          otherAgentTurn.agentId,
          conversationHistory
        );

        responses.push({
          agentId: agentId,
          agentType: "conversational",
          content: response,
          perspective: agent['personality'].perspective,
          confidence: agent['personality'].confidence,
          timestamp: new Date()
        });
      }
    }
    
    return responses;
  }

  /**
   * Assess the quality of an ongoing discussion
   */
  async assessDiscussionQuality(threadId: string): Promise<DiscussionQualityAssessment> {
    const thread = this.activeDiscussions.get(threadId);
    if (!thread) {
      throw new Error(`Discussion thread ${threadId} not found`);
    }

    const perspectives = new Set(thread.turns.map(turn => turn.perspective));
    const turnCount = thread.turns.length;
    const participantCount = thread.participants.length;

    return {
      overallQuality: Math.min(100, (perspectives.size * 20) + (turnCount * 2)),
      perspectiveDiversity: (perspectives.size / participantCount) * 100,
      constructiveEngagement: this.calculateEngagementScore(thread.turns),
      insightGeneration: this.calculateInsightScore(thread),
      participationBalance: this.calculateBalanceScore(thread),
      topicCoverage: Math.min(100, turnCount * 5),
      strengths: this.identifyStrengths(thread),
      weaknesses: this.identifyWeaknesses(thread),
      recommendations: this.generateRecommendations(thread)
    };
  }

  /**
   * Conclude a discussion and create a comprehensive summary
   */
  async concludeDiscussion(threadId: string): Promise<DiscussionSummary> {
    const thread = this.activeDiscussions.get(threadId);
    if (!thread) {
      throw new Error(`Discussion thread ${threadId} not found`);
    }

    thread.status = ThreadStatus.CONCLUDED;
    const qualityAssessment = await this.assessDiscussionQuality(threadId);
    
    const insights = await this.extractInsights(thread);
    thread.insights = insights;

    return {
      threadId,
      topic: thread.topic,
      participants: thread.participants,
      duration: Math.round((new Date().getTime() - thread.startTime.getTime()) / 60000),
      turnCount: thread.turns.length,
      keyInsights: insights,
      majorPoints: this.extractMajorPoints(thread),
      areasOfAgreement: this.identifyAgreements(thread),
      unresolvedQuestions: this.identifyUnresolvedQuestions(thread),
      recommendedFollowup: this.suggestFollowup(thread),
      qualityAssessment
    };
  }

  /**
   * Demonstrate a complete conversation workflow
   */
  async demonstrateConversation(topic: string): Promise<DiscussionSummary> {
    // Create diverse agents
    const agents = this.createDiverseAgents();
    
    // Create context for the discussion
    const context: ConversationContext = {
      domain: "software-architecture",
      complexityLevel: 7,
      stakeholders: ["developers", "users"],
      constraints: ["budget", "timeline"],
      timeHorizon: "short-term",
      riskLevel: "medium",
      metadata: { purpose: "design-decision" }
    };

    // Start the discussion
    const participantIds = agents.map(agent => agent.agentId);
    const thread = await this.facilitateDiscussion(topic, context, participantIds);
    
    // Conclude and summarize
    return await this.concludeDiscussion(thread.threadId);
  }

  // Helper methods
  private generateThreadId(topic: string): string {
    return `discussion-${topic.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
  }

  private calculateEngagementScore(turns: ConversationTurn[]): number {
    const engagementWords = ['build', 'agree', 'challenge', 'connect', 'insight'];
    const engagementCount = turns.filter(turn => 
      engagementWords.some(word => turn.content.toLowerCase().includes(word))
    ).length;
    return Math.min(100, (engagementCount / Math.max(turns.length, 1)) * 100);
  }

  private calculateInsightScore(thread: DiscussionThread): number {
    return Math.min(100, thread.insights.length * 25);
  }

  private calculateBalanceScore(thread: DiscussionThread): number {
    const agentCounts = new Map<string, number>();
    for (const turn of thread.turns) {
      agentCounts.set(turn.agentId, (agentCounts.get(turn.agentId) || 0) + 1);
    }
    
    const counts = Array.from(agentCounts.values());
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length;
    
    return Math.max(0, 100 - (variance * 10));
  }

  private identifyStrengths(thread: DiscussionThread): string[] {
    const strengths: string[] = [];
    
    if (thread.turns.length > 10) strengths.push("Rich dialogue with multiple exchanges");
    
    const perspectives = new Set(thread.turns.map(turn => turn.perspective));
    if (perspectives.size >= 3) strengths.push("Diverse perspectives represented");
    
    const challenges = thread.turns.filter(turn => turn.content.includes('challenge')).length;
    if (challenges > 0) strengths.push("Constructive challenging of ideas");
    
    return strengths;
  }

  private identifyWeaknesses(thread: DiscussionThread): string[] {
    const weaknesses: string[] = [];
    
    if (thread.turns.length < 5) weaknesses.push("Limited dialogue depth");
    if (thread.insights.length === 0) weaknesses.push("No clear insights emerged");
    
    return weaknesses;
  }

  private generateRecommendations(thread: DiscussionThread): string[] {
    const recommendations: string[] = [];
    
    if (thread.turns.length < 8) {
      recommendations.push("Encourage more back-and-forth exchanges");
    }
    
    const perspectives = new Set(thread.turns.map(turn => turn.perspective));
    if (perspectives.size < 3) {
      recommendations.push("Include more diverse perspectives");
    }
    
    return recommendations;
  }

  private async extractInsights(thread: DiscussionThread): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    // Simple insight extraction - in production would use NLP
    const synthesisCount = thread.turns.filter(turn => 
      turn.content.includes('synthesis') || turn.content.includes('connect')
    ).length;
    
    if (synthesisCount > 0) {
      insights.push({
        insightId: `insight-${thread.threadId}-1`,
        content: `Collaborative synthesis achieved through multi-perspective dialogue`,
        sourceAgents: thread.participants,
        insightType: InsightType.SYNTHESIS,
        confidence: 0.8,
        novelty: 0.7,
        timestamp: new Date(),
        supportingEvidence: [`${synthesisCount} synthesis attempts observed`]
      });
    }
    
    return insights;
  }

  private extractMajorPoints(thread: DiscussionThread): string[] {
    return thread.turns
      .map(turn => turn.content.split('.')[0])
      .filter(point => point.length > 20)
      .slice(0, 5);
  }

  private identifyAgreements(thread: DiscussionThread): string[] {
    return thread.turns
      .filter(turn => turn.content.includes('agree') || turn.content.includes('build'))
      .map(turn => turn.content.substring(0, 100))
      .slice(0, 3);
  }

  private identifyUnresolvedQuestions(thread: DiscussionThread): string[] {
    return thread.turns
      .filter(turn => turn.content.includes('?'))
      .map(turn => turn.content.split('?')[0] + '?')
      .slice(0, 3);
  }

  private suggestFollowup(thread: DiscussionThread): string[] {
    return [
      `Deep dive into ${thread.topic} implementation details`,
      `Explore alternative approaches to ${thread.topic}`,
      `Address unresolved questions from this discussion`
    ];
  }
}
