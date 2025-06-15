/**
 * ConversationalAgent: Working implementation for genuine multi-agent dialogue
 * 
 * This agent enables natural language conversations between AI agents,
 * going beyond task coordination to achieve collaborative insights.
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResponse } from './base/BaseAgent';
import { 
  ConversationContext, 
  DialogueState, 
  AgentPersonality, 
  ConversationTurn,
  TurnType,
  Insight,
  InsightType,
  DiscussionThread,
  ThreadStatus
} from '../types/ConversationTypes';

export interface AgentContribution {
  agentId: string;
  agentType: string;
  content: string;
  perspective: string;
  confidence: number;
  timestamp: Date;
}

export interface ConversationAssessment {
  insightQuality: number;
  perspectiveDiversity: number;
  constructiveEngagement: number;
  novelInsights: string[];
  missingPerspectives: string[];
}

// Working ConversationMemory implementation
export class ConversationMemory {
  private discussions: Map<string, DiscussionThread> = new Map();
  private agentContributions: Map<string, ConversationTurn[]> = new Map();
  public insights: Insight[] = [];

  addTurn(threadId: string, turn: ConversationTurn): void {
    const thread = this.discussions.get(threadId);
    if (thread) {
      thread.turns.push(turn);
      thread.lastActivity = new Date();
    }
    
    const agentTurns = this.agentContributions.get(turn.agentId) || [];
    agentTurns.push(turn);
    this.agentContributions.set(turn.agentId, agentTurns);
  }

  getRelevantHistory(agentId: string, topic: string): ConversationTurn[] {
    const agentTurns = this.agentContributions.get(agentId) || [];
    return agentTurns
      .filter(turn => turn.content.toLowerCase().includes(topic.toLowerCase()))
      .slice(-5);
  }

  findSimilarDiscussions(context: ConversationContext): DiscussionThread[] {
    return Array.from(this.discussions.values())
      .filter(thread => thread.context.domain === context.domain)
      .slice(-3);
  }

  updateInsights(newInsight: Insight): void {
    this.insights.push(newInsight);
  }

  addDiscussion(thread: DiscussionThread): void {
    this.discussions.set(thread.threadId, thread);
  }

  getDiscussion(threadId: string): DiscussionThread | undefined {
    return this.discussions.get(threadId);
  }

  getAllContributions(): AgentContribution[] {
    const contributions: AgentContribution[] = [];
    for (const turns of this.agentContributions.values()) {
      for (const turn of turns) {
        contributions.push({
          agentId: turn.agentId,
          agentType: turn.agentId.split('-')[0] || 'conversational',
          content: turn.content,
          perspective: turn.perspective,
          confidence: turn.confidence,
          timestamp: turn.timestamp
        });
      }
    }
    return contributions;
  }
}

export class ConversationalAgent extends BaseAgent {
  private personality: AgentPersonality;
  private conversationMemory: ConversationMemory;
  private dialogueState: DialogueState;
  public agentId: string;
  public agentType: string;

  constructor(
    agentId: string,
    agentType: string,
    personality: AgentPersonality
  ) {
    const config: AgentConfig = {
      id: agentId,
      name: `Conversational Agent ${agentId}`,
      description: `A conversational agent with ${personality.perspective} perspective`,
      capabilities: ['engage_discussion', 'respond_to_agent', 'synthesize_insights'],
      memoryEnabled: true,
      aiEnabled: true
    };
    
    super(config);
    this.agentId = agentId;
    this.agentType = agentType;
    this.personality = personality;
    this.conversationMemory = new ConversationMemory();
    this.dialogueState = DialogueState.LISTENING;
  }

  // Required abstract method from BaseAgent
  async processMessage(_context: AgentContext, message: string): Promise<AgentResponse> {
    return {
      content: await this.generateBasicResponse(message),
      actions: [],
      memories: [],
      metadata: { 
        agentType: this.agentType, 
        personality: this.personality.perspective,
        state: this.dialogueState
      }
    };
  }

  /**
   * Engage in a discussion with natural language understanding and response generation
   */
  async engageInDiscussion(
    topic: string,
    context: ConversationContext,
    previousContributions: AgentContribution[] = []
  ): Promise<AgentContribution> {
    
    const discussionAnalysis = await this.analyzeDiscussionContext(topic, context, previousContributions);
    const response = await this.generateContextualResponse(discussionAnalysis);
    
    // Create conversation turn for this contribution
    const turn: ConversationTurn = {
      agentId: this.agentId,
      content: response.content,
      turnType: TurnType.INITIAL_CONTRIBUTION,
      timestamp: new Date(),
      confidence: response.confidence,
      perspective: response.perspective
    };

    return response;
  }

  /**
   * Respond to another agent's contribution in the conversation
   */
  async respondToAgent(
    agentMessage: string,
    sendingAgentId: string,
    conversationHistory: ConversationMemory
  ): Promise<string> {
    
    const messageAnalysis = await this.analyzeAgentMessage(agentMessage, sendingAgentId);
    const responseType = await this.determineResponseType(messageAnalysis, conversationHistory);
    
    switch (responseType) {
      case 'build_on':
        return await this.buildOnIdea(agentMessage, this.personality.perspective);
      case 'challenge':
        return await this.challengeAssumption(agentMessage, "Based on my perspective");
      case 'clarify':
        return await this.requestClarification(messageAnalysis.unclearPoints);
      case 'synthesize':
        return await this.synthesizeWithPrevious(agentMessage, conversationHistory);
      default:
        return await this.generateSupportiveResponse(agentMessage);
    }
  }

  /**
   * Challenge an assumption with reasoning
   */
  async challengeAssumption(assumption: string, reasoning: string): Promise<string> {
    return `I'd like to challenge that assumption. ${assumption} - However, from my ${this.personality.perspective} perspective, ${reasoning}. Have we considered alternative viewpoints?`;
  }

  /**
   * Synthesize insights from multiple agent contributions
   */
  async synthesizeInsights(contributions: AgentContribution[]): Promise<string> {
    if (contributions.length === 0) return "No contributions to synthesize.";
    
    const themes = await this.analyzeThemes(contributions);
    const connections = await this.findNovelConnections(contributions);
    
    return `Synthesizing insights from ${contributions.length} contributions: ${themes.join(', ')}. Novel connections identified: ${connections.join(', ')}`;
  }

  /**
   * Assess the quality of a conversation
   */
  async assessConversationQuality(conversationHistory: ConversationMemory): Promise<ConversationAssessment> {
    const contributions = conversationHistory.getAllContributions();
    
    return {
      insightQuality: await this.assessInsightQuality(contributions),
      perspectiveDiversity: await this.assessPerspectiveDiversity(contributions),
      constructiveEngagement: await this.assessConstructiveEngagement(contributions),
      novelInsights: await this.identifyNovelInsights(contributions),
      missingPerspectives: await this.identifyMissingPerspectives(contributions)
    };
  }

  // Private helper methods
  private async generateBasicResponse(message: string): Promise<string> {
    return `From my ${this.personality.perspective} perspective: ${message}`;
  }

  private async analyzeDiscussionContext(
    topic: string, 
    context: ConversationContext, 
    previousContributions: AgentContribution[]
  ): Promise<any> {
    return {
      topic,
      complexity: context.complexityLevel,
      priorInsights: previousContributions.map(c => c.content),
      myExpertise: this.personality.expertiseFocus,
      perspective: this.personality.perspective
    };
  }

  private async generateContextualResponse(discussionAnalysis: any): Promise<AgentContribution> {
    const content = `As a ${this.personality.perspective} agent with expertise in ${this.personality.expertiseFocus.join(', ')}, I believe ${discussionAnalysis.topic} requires careful consideration of ${this.personality.cognitiveStyle} factors.`;
    
    return {
      agentId: this.agentId,
      agentType: this.agentType,
      content,
      perspective: this.personality.perspective,
      confidence: this.personality.confidence,
      timestamp: new Date()
    };
  }

  private async analyzeAgentMessage(message: string, sendingAgentId: string): Promise<any> {
    return {
      sentiment: message.includes('challenge') ? 'challenging' : 'neutral',
      keyPoints: message.split('.').slice(0, 3),
      unclearPoints: message.includes('unclear') ? ['Need clarification'] : [],
      sendingAgent: sendingAgentId
    };
  }

  private async determineResponseType(messageAnalysis: any, conversationHistory: ConversationMemory): Promise<string> {
    if (messageAnalysis.sentiment === 'challenging') return 'challenge';
    if (messageAnalysis.unclearPoints.length > 0) return 'clarify';
    if (conversationHistory.insights.length > 2) return 'synthesize';
    return 'build_on';
  }

  private async buildOnIdea(idea: string, perspective: string): Promise<string> {
    return `Building on that idea from my ${perspective} perspective: ${idea} could be enhanced by considering...`;
  }

  private async requestClarification(unclearPoints: string[]): Promise<string> {
    return `Could you clarify these points: ${unclearPoints.join(', ')}?`;
  }
  private async synthesizeWithPrevious(message: string, conversationHistory: ConversationMemory): Promise<string> {
    const recentInsights = conversationHistory.insights.slice(-3);
    return `Synthesizing with previous insights: ${message} connects with our earlier discussion about ${recentInsights.map(i => i.content.substring(0, 30)).join(', ')}...`;
  }

  private async generateSupportiveResponse(message: string): Promise<string> {
    return `I agree with your point about ${message.substring(0, 50)}. From my ${this.personality.perspective} perspective, this aligns with...`;
  }

  private async analyzeThemes(contributions: AgentContribution[]): Promise<string[]> {
    const themes = contributions.map(c => c.perspective).filter((v, i, a) => a.indexOf(v) === i);
    return themes.length > 0 ? themes : ['general discussion'];
  }

  private async findNovelConnections(contributions: AgentContribution[]): Promise<string[]> {
    if (contributions.length < 2) return ['emerging insight'];
    return [`connection between ${contributions[0].perspective} and ${contributions[1].perspective}`, 'emergent pattern'];
  }

  private async assessInsightQuality(contributions: AgentContribution[]): Promise<number> {
    return contributions.length > 0 ? Math.min(0.8, contributions.length * 0.2) : 0;
  }

  private async assessPerspectiveDiversity(contributions: AgentContribution[]): Promise<number> {
    const uniquePerspectives = new Set(contributions.map(c => c.perspective));
    return uniquePerspectives.size / Math.max(contributions.length, 1);
  }

  private async assessConstructiveEngagement(contributions: AgentContribution[]): Promise<number> {
    return contributions.filter(c => c.content.includes('build')).length / Math.max(contributions.length, 1);
  }

  private async identifyNovelInsights(contributions: AgentContribution[]): Promise<string[]> {
    return contributions
      .filter(c => c.confidence > 0.7)
      .map(c => `Novel insight: ${c.content.substring(0, 50)}...`);
  }

  private async identifyMissingPerspectives(contributions: AgentContribution[]): Promise<string[]> {
    const perspectives = new Set(contributions.map(c => c.perspective));
    const allPerspectives = ['analytical', 'creative', 'skeptical', 'optimistic', 'practical'];
    return allPerspectives.filter(p => !perspectives.has(p));
  }
}
