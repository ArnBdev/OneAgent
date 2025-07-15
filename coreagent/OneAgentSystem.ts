/**
 * OneAgent Core System - Revolutionary AI Assistant with Internal Team Collaboration
 * 
 * This is the heart of OneAgent - a unified AI system with specialist agents
 * that can seamlessly hand off conversations and conduct internal team meetings
 * for collective intelligence.
 * 
 * @version 3.0.0-ONEAGENT-ARCHITECTURE
 * @date June 19, 2025
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
  ContextCategory, 
  PrivacyLevel, 
  ProjectScope,
  UnifiedTimestamp
} from './types/oneagent-backbone-types.js';
import { createUnifiedTimestamp } from './utils/UnifiedBackboneService';

// Import existing agent infrastructure
import { AgentFactory, AgentFactoryConfig } from './agents/base/AgentFactory';
import { ISpecializedAgent } from './agents/base/ISpecializedAgent';
import { CoreAgent as ExistingCoreAgent } from './agents/specialized/CoreAgent';

// User interface for compatibility - matches existing user.ts
// Currently unused but kept for future multi-user support
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface User {
  id: string;
  name: string;
  createdAt: string;
  lastActiveAt: string;
}

// Core OneAgent Interfaces
export interface AgentResponse {
  message: string;
  handoffTo?: string;
  requiresTeamMeeting?: boolean;
  meetingRequest?: TeamMeetingRequest;
  confidence: number;
  contextContinuity: ConversationContext;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  conversationHistory: ConversationMessage[];
  currentAgent: string;
  contextCategory: ContextCategory;
  privacyLevel: PrivacyLevel;
  projectScope: ProjectScope;
  metadata: Record<string, unknown>;
}

export interface ConversationMessage {
  id: string;
  timestamp: UnifiedTimestamp;
  from: string; // 'user' or agent id
  content: string;
  contextCategory: ContextCategory;
  metadata?: Record<string, unknown>;
}

export interface TeamMeetingRequest {
  topic: string;
  suggestedParticipants?: string[];
  meetingType: 'discussion' | 'review' | 'brainstorm' | 'analysis';
  urgency: 'low' | 'normal' | 'high';
  context: ConversationContext;
}

export interface SpecialistAgent {
  id: string;
  name: string;
  skills: string[];
  capabilities: string[];
  description: string;
  
  // Core agent methods
  analyzeIntent(message: string, context: ConversationContext): Promise<IntentAnalysis>;
  canHandle(intent: IntentAnalysis): Promise<boolean>;
  takeOver(context: ConversationContext): Promise<string>;
  processMessage(message: string, context: ConversationContext): Promise<AgentResponse>;
  
  // Team meeting participation
  participateInMeeting(meeting: TeamMeeting): Promise<AgentPerspective>;
  provideExpertise(topic: string, context: ConversationContext): Promise<ExpertiseResponse>;
}

export interface IntentAnalysis {
  intent: string;
  confidence: number;
  requiredSkills: string[];
  contextCategory: ContextCategory;
  urgency: 'low' | 'normal' | 'high';
  requiresSpecialist: boolean;
  requiresTeamMeeting: boolean;
  suggestedAgent?: string;
  suggestedMeetingParticipants?: string[];
}

export interface AgentPerspective {
  agentId: string;
  perspective: string;
  keyInsights: string[];
  concerns: string[];
  recommendations: string[];
  questionsForOtherAgents: string[];
  confidence: number;
}

export interface ExpertiseResponse {
  analysis: string;
  recommendations: string[];
  risks: string[];
  alternatives: string[];
  confidence: number;
}

export interface TeamMeeting {
  id: string;
  topic: string;
  participants: string[];
  coordinator: string;
  context: ConversationContext;
  status: 'planning' | 'active' | 'synthesizing' | 'completed';
  startTime: UnifiedTimestamp;
  perspectives: AgentPerspective[];
  discussion: MeetingDiscussion[];
  synthesis?: MeetingSynthesis;
}

export interface MeetingDiscussion {
  round: number;
  agentId: string;
  message: string;
  type: 'perspective' | 'question' | 'response' | 'challenge';
  timestamp: UnifiedTimestamp;
}

export interface MeetingSynthesis {
  keyInsights: string[];
  recommendations: string[];
  conflictResolutions: string[];
  actionItems: string[];
  confidence: number;
  consensusLevel: number;
}

/**
 * OneAgent Core System - The Revolutionary AI Assistant
 * 
 * Features:
 * - Single unified interface for all AI assistance
 * - Seamless handoffs between specialist agents
 * - Internal team meetings for collective intelligence
 * - Universal deployment (phone, web, VS Code Copilot)
 */
export class OneAgentSystem extends EventEmitter {
  public coreAgent!: CoreAgent; // Make public for TeamMeetingEngine access
  public specialists: Map<string, SpecialistAgent> = new Map(); // Make public for TeamMeetingEngine
  private activeAgent!: SpecialistAgent;
  private conversationContext!: ConversationContext;
  public teamMeetingEngine!: TeamMeetingEngine; // Make public for access
  
  constructor() {
    super();
    this.initializeSystem();
  }
  
  private async initializeSystem(): Promise<void> {
    // Initialize CoreAgent as the primary orchestrator
    this.coreAgent = new CoreAgent(this);
    this.activeAgent = this.coreAgent;
    
    // Initialize team meeting engine
    this.teamMeetingEngine = new TeamMeetingEngine(this);
    
    // Register specialist agents
    await this.registerSpecialistAgents();
    
    this.emit('system-initialized');
  }
  
  /**
   * Main entry point for user messages
   * This is where all conversations begin
   */
  async processUserMessage(message: string, userId: string = 'default'): Promise<string> {
    try {
      // Ensure conversation context exists
      if (!this.conversationContext || this.conversationContext.userId !== userId) {
        this.conversationContext = await this.createConversationContext(userId);
      }
      
      // Add user message to conversation history
      this.addToConversationHistory('user', message);
      
      // CoreAgent always processes first to determine routing
      const response = await this.coreAgent.processMessage(message, this.conversationContext);
        // Handle different response types
      if (response.handoffTo) {
        return await this.executeHandoff(response.handoffTo);
      }
      
      if (response.requiresTeamMeeting && response.meetingRequest) {
        return await this.initiateTeamMeeting(response.meetingRequest);
      }
      
      // Add agent response to conversation history
      this.addToConversationHistory(this.activeAgent.id, response.message);
      
      return response.message;
      
    } catch (error) {
      console.error('OneAgent processing error:', error);
      return "I apologize, but I encountered an error processing your message. Please try again.";
    }
  }

  /**
   * Execute seamless handoff between agents
   */
  private async executeHandoff(targetAgentId: string): Promise<string> {
    const targetAgent = this.specialists.get(targetAgentId);
    if (!targetAgent) {
      return `I couldn't find the ${targetAgentId} specialist. Let me handle this directly.`;
    }
    
    // Update active agent
    const previousAgent = this.activeAgent;
    this.activeAgent = targetAgent;
    
    // Agent takes over with full context
    const handoffMessage = await targetAgent.takeOver(this.conversationContext);
    
    // Add handoff to conversation history
    this.addToConversationHistory('system', `Handoff from ${previousAgent.id} to ${targetAgent.id}`);
    this.addToConversationHistory(targetAgent.id, handoffMessage);
    
    this.emit('agent-handoff', { from: previousAgent.id, to: targetAgent.id });
    
    return handoffMessage;
  }
  
  /**
   * Initiate internal team meeting for collective intelligence
   */
  private async initiateTeamMeeting(request: TeamMeetingRequest): Promise<string> {
    try {
      const meetingResult = await this.teamMeetingEngine.conductMeeting(request);
      
      // Add meeting result to conversation history
      this.addToConversationHistory('team-meeting', `Meeting conducted: ${meetingResult.synthesis?.keyInsights.join(', ')}`);
      
      this.emit('team-meeting-completed', meetingResult);
      
      // Return synthesis to user
      return this.formatMeetingResult(meetingResult);
      
    } catch (error) {
      console.error('Team meeting error:', error);
      return "I encountered an issue conducting the team meeting. Let me provide my individual analysis instead.";
    }
  }
  
  /**
   * Format team meeting results for user presentation
   */
  private formatMeetingResult(meeting: TeamMeeting): string {
    if (!meeting.synthesis) {
      return "The team meeting is still in progress. I'll provide updates as we reach conclusions.";
    }
    
    const { keyInsights, recommendations, confidence } = meeting.synthesis;
    
    let result = `## Team Meeting Results\n\n`;
    result += `**Topic**: ${meeting.topic}\n`;
    result += `**Participants**: ${meeting.participants.join(', ')}\n\n`;
    
    if (keyInsights.length > 0) {
      result += `**Key Insights**:\n`;
      keyInsights.forEach((insight, i) => {
        result += `${i + 1}. ${insight}\n`;
      });
      result += `\n`;
    }
    
    if (recommendations.length > 0) {
      result += `**Recommendations**:\n`;
      recommendations.forEach((rec, i) => {
        result += `${i + 1}. ${rec}\n`;
      });
      result += `\n`;
    }
    
    result += `**Confidence Level**: ${Math.round(confidence)}%\n\n`;
    result += `*Would you like me to explain any of these points in more detail or show you the full discussion?*`;
    
    return result;
  }
    /**
   * Register all specialist agents using existing AgentFactory
   * Canonical, extensible, and future-proof implementation
   */
  private async registerSpecialistAgents(): Promise<void> {
    try {
      console.log('🚀 Registering specialist agents via AgentFactory...');

      // Canonical agent registration config array for extensibility
      const agentConfigs: AgentFactoryConfig[] = [
        {
          type: 'development',
          id: 'DevAgent',
          name: 'Development Specialist',
          description: 'Expert in coding, architecture, and development best practices',
          memoryEnabled: true,
          aiEnabled: true
        },
        {
          type: 'office',
          id: 'OfficeAgent',
          name: 'Office Productivity Specialist',
          description: 'Expert in document management, scheduling, and office workflows',
          memoryEnabled: true,
          aiEnabled: true
        },
        {
          type: 'fitness',
          id: 'FitnessAgent',
          name: 'Fitness and Health Specialist',
          description: 'Expert in workout planning, nutrition, and health optimization',
          memoryEnabled: true,
          aiEnabled: true
        }
      ];

      // Register all agents in a canonical, extensible loop
      for (const config of agentConfigs) {
        const agent = await AgentFactory.createAgent(config);
        this.specialists.set(config.id, this.createAgentAdapter(agent, config.id));
      }

      console.log(`✅ Registered ${this.specialists.size} specialist agents successfully`);
    } catch (error) {
      console.error('❌ Failed to register specialist agents:', error);
      throw error;
    }
  }
  /**
   * Create adapter to bridge ISpecializedAgent with SpecialistAgent interface
   */
  private createAgentAdapter(agent: ISpecializedAgent, agentType: string): SpecialistAgent {
    return {
      id: agent.id,
      name: agentType,
      skills: this.getAgentSkills(agentType),
      capabilities: this.getAgentCapabilities(agentType),
      description: `${agentType} specialized agent`,
      
      // Bridge methods
      analyzeIntent: async (_message: string, context: ConversationContext) => {
        const analysis: IntentAnalysis = {
          intent: 'handled',
          confidence: 0.8,
          requiredSkills: this.getAgentSkills(agentType),
          contextCategory: context.contextCategory,
          urgency: 'normal' as const,
          requiresSpecialist: false,
          requiresTeamMeeting: false
        };
        return analysis;
      },
      
      canHandle: async (_intent: IntentAnalysis) => true,
      
      takeOver: async (_context: ConversationContext) => {
        return `Hello! I'm the ${agentType} and I'm ready to help with ${this.getAgentSkills(agentType).join(', ')}.`;
      },
      
      processMessage: async (message: string, context: ConversationContext) => {
        // Bridge to existing agent's executeAction method
        try {
          const actions = agent.getAvailableActions();
          if (actions.length > 0) {
            const result = await agent.executeAction(actions[0], { message }, {
              user: { 
                id: context.userId, 
                name: 'User',
                createdAt: createUnifiedTimestamp().iso,
                lastActiveAt: createUnifiedTimestamp().iso
              },
              sessionId: context.sessionId,
              conversationHistory: []
            });
            
            return {
              message: typeof result === 'string' ? result : JSON.stringify(result),
              confidence: 0.8,
              contextContinuity: context
            };
          }
        } catch (error) {
          console.error(`Error processing message with ${agentType}:`, error);
        }
        
        return {
          message: `I understand you need help with ${agentType.toLowerCase()} tasks. I'm working on providing better assistance.`,
          confidence: 0.6,
          contextContinuity: context
        };
      },
      
      participateInMeeting: async (_meeting: TeamMeeting) => ({
        agentId: agent.id,
        perspective: `As the ${agentType}, I bring expertise in ${this.getAgentSkills(agentType).join(', ')}.`,
        keyInsights: [`${agentType} perspective on the topic`],
        concerns: ['Technical feasibility', 'Best practices'],
        recommendations: [`Apply ${agentType.toLowerCase()} best practices`],
        questionsForOtherAgents: ['How does this impact other domains?'],
        confidence: 0.8
      }),
      
      provideExpertise: async (_topic: string, _context: ConversationContext) => ({
        analysis: `From a ${agentType.toLowerCase()} perspective, this requires careful consideration.`,
        recommendations: [`Follow ${agentType.toLowerCase()} best practices`],
        risks: ['Technical implementation challenges'],
        alternatives: ['Alternative approaches available'],
        confidence: 0.8
      })
    };
  }
  
  private getAgentSkills(agentType: string): string[] {
    const skillMap: Record<string, string[]> = {
      'DevAgent': ['coding', 'debugging', 'architecture', 'testing'],
      'OfficeAgent': ['documents', 'scheduling', 'productivity', 'communication'],
      'FitnessAgent': ['workout_planning', 'nutrition', 'health_tracking', 'motivation']
    };
    return skillMap[agentType] || ['general_assistance'];
  }
  
  private getAgentCapabilities(agentType: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      'DevAgent': ['code_review', 'debugging', 'architecture_guidance'],
      'OfficeAgent': ['document_processing', 'calendar_management', 'task_organization'],
      'FitnessAgent': ['workout_planning', 'nutrition_tracking', 'progress_monitoring']
    };
    return capabilityMap[agentType] || ['general_capabilities'];
  }
  
  /**
   * Create conversation context for new session
   */
  private async createConversationContext(userId: string): Promise<ConversationContext> {
    return {
      userId,
      sessionId: `session_${createUnifiedTimestamp().unix}`,
      conversationHistory: [],
      currentAgent: 'core-agent',
      contextCategory: 'GENERAL',
      privacyLevel: 'internal',
      projectScope: 'PERSONAL',
      metadata: {
        startTime: createUnifiedTimestamp(),
        platform: 'oneagent-core'
      }
    };
  }
  
  /**
   * Add message to conversation history
   */
  private addToConversationHistory(from: string, content: string): void {
    const message: ConversationMessage = {
      id: `msg_${createUnifiedTimestamp().unix}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: createUnifiedTimestamp(),
      from,
      content,
      contextCategory: this.conversationContext.contextCategory
    };
    
    this.conversationContext.conversationHistory.push(message);
  }
  
  // Getters for system access
  getSpecialistAgents(): Map<string, SpecialistAgent> {
    return this.specialists;
  }
  
  getActiveAgent(): SpecialistAgent {
    return this.activeAgent;
  }
  
  getConversationContext(): ConversationContext {
    return this.conversationContext;
  }
  
  getTeamMeetingEngine(): TeamMeetingEngine {
    return this.teamMeetingEngine;
  }
}

/**
 * CoreAgent wrapper for OneAgentSystem
 * Bridges the new OneAgent interface with existing CoreAgent implementation
 */
class CoreAgent implements SpecialistAgent {
  public id = 'CoreAgent';
  public name = 'Core Orchestrator';
  public skills = ['orchestration', 'coordination', 'analysis', 'synthesis'];
  public capabilities = ['task_management', 'agent_coordination', 'team_meetings'];
  public description = 'Primary orchestrator and coordinator for OneAgent system';
  
  private existingCoreAgent: ExistingCoreAgent;
  private oneAgentSystem: OneAgentSystem;
  
  constructor(oneAgentSystem: OneAgentSystem) {
    this.oneAgentSystem = oneAgentSystem;
    this.existingCoreAgent = new ExistingCoreAgent();
  }
    async analyzeIntent(message: string, context: ConversationContext): Promise<IntentAnalysis> {
    // Enhanced intent analysis for OneAgent routing
    const requiresSpecialist = this.detectSpecialistNeeds(message);
    const requiresTeamMeeting = this.detectTeamMeetingNeeds(message);
    
    const analysis: IntentAnalysis = {
      intent: this.extractPrimaryIntent(message),
      confidence: 0.85,
      requiredSkills: this.extractRequiredSkills(message),
      contextCategory: context.contextCategory,
      urgency: this.detectUrgency(message),
      requiresSpecialist,
      requiresTeamMeeting
    };
      if (requiresSpecialist) {
      const suggestedAgent = this.suggestAgent(message);
      if (suggestedAgent) {
        analysis.suggestedAgent = suggestedAgent;
      }
    }
    
    if (requiresTeamMeeting) {
      const suggestedParticipants = this.suggestMeetingParticipants(message);
      if (suggestedParticipants) {
        analysis.suggestedMeetingParticipants = suggestedParticipants;
      }
    }
    
    return analysis;
  }
  
  async canHandle(intent: IntentAnalysis): Promise<boolean> {
    // CoreAgent can always handle coordination and general queries
    return !intent.requiresSpecialist || intent.intent === 'coordination';
  }
  
  async takeOver(_context: ConversationContext): Promise<string> {
    return "I'm here to help coordinate and ensure you get the best assistance. What can I help you with?";
  }
  
  async processMessage(message: string, context: ConversationContext): Promise<AgentResponse> {
    const intent = await this.analyzeIntent(message, context);
    
    if (intent.requiresTeamMeeting) {
      return {
        message: `I believe this would benefit from a team discussion. Let me convene a meeting with our specialists.`,
        requiresTeamMeeting: true,        meetingRequest: {
          topic: message,
          suggestedParticipants: intent.suggestedMeetingParticipants || [],
          meetingType: 'discussion',
          urgency: intent.urgency,
          context
        },
        confidence: intent.confidence,
        contextContinuity: context
      };
    }
    
    if (intent.requiresSpecialist && intent.suggestedAgent) {
      return {
        message: `Let me connect you with our ${intent.suggestedAgent} who specializes in this area.`,
        handoffTo: intent.suggestedAgent,
        confidence: intent.confidence,
        contextContinuity: context
      };
    }
    
    // Handle directly
    return {
      message: await this.generateDirectResponse(message, context),
      confidence: intent.confidence,
      contextContinuity: context
    };
  }
  
  async participateInMeeting(_meeting: TeamMeeting): Promise<AgentPerspective> {
    return {
      agentId: this.id,
      perspective: `As the coordinator, I see this as an opportunity to synthesize different viewpoints and ensure we address all aspects comprehensively.`,
      keyInsights: ['Coordination perspective', 'Cross-domain synthesis needed'],
      concerns: ['Ensuring balanced participation', 'Managing complexity'],
      recommendations: ['Structured discussion', 'Clear action items'],
      questionsForOtherAgents: ['What specific expertise does each participant bring?'],
      confidence: 0.9
    };
  }
  
  async provideExpertise(_topic: string, _context: ConversationContext): Promise<ExpertiseResponse> {
    return {
      analysis: `From a coordination perspective, this topic requires careful orchestration of multiple specialist viewpoints.`,
      recommendations: ['Engage multiple specialists', 'Ensure comprehensive coverage'],
      risks: ['Missing critical perspectives', 'Coordination overhead'],
      alternatives: ['Single specialist consultation', 'Phased approach'],
      confidence: 0.85
    };
  }
  
  // Private helper methods for intent analysis
  private detectSpecialistNeeds(message: string): boolean {
    const specialistKeywords = ['code', 'debug', 'office', 'document', 'fitness', 'workout', 'design', 'security'];
    return specialistKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }
  
  private detectTeamMeetingNeeds(message: string): boolean {
    const teamKeywords = ['discuss', 'team', 'meeting', 'brainstorm', 'review', 'collaborate', 'multiple perspectives'];
    return teamKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }
  
  private extractPrimaryIntent(message: string): string {
    // Simple intent extraction - can be enhanced with ML
    if (message.includes('code') || message.includes('develop')) return 'development';
    if (message.includes('document') || message.includes('office')) return 'office';
    if (message.includes('fitness') || message.includes('health')) return 'fitness';
    return 'general';
  }
  
  private extractRequiredSkills(message: string): string[] {
    const skills: string[] = [];
    if (message.includes('code')) skills.push('coding');
    if (message.includes('design')) skills.push('design');
    if (message.includes('security')) skills.push('security');
    return skills;
  }
  
  private detectUrgency(message: string): 'low' | 'normal' | 'high' {
    if (message.includes('urgent') || message.includes('asap')) return 'high';
    if (message.includes('soon') || message.includes('quickly')) return 'normal';
    return 'low';
  }
  
  private suggestAgent(message: string): string | undefined {
    if (message.includes('code') || message.includes('develop')) return 'DevAgent';
    if (message.includes('document') || message.includes('office')) return 'OfficeAgent';
    if (message.includes('fitness') || message.includes('health')) return 'FitnessAgent';
    return undefined;
  }
  
  private suggestMeetingParticipants(message: string): string[] {
    const participants: string[] = [];
    if (message.includes('code')) participants.push('DevAgent');
    if (message.includes('office')) participants.push('OfficeAgent');
    if (message.includes('fitness')) participants.push('FitnessAgent');
    return participants;
  }
  
  private async generateDirectResponse(message: string, context: ConversationContext): Promise<string> {
    // Use existing CoreAgent for direct responses
    try {      const response = await this.existingCoreAgent.processMessage({
        user: { 
          id: context.userId, 
          name: 'User',
          createdAt: createUnifiedTimestamp().iso,
          lastActiveAt: createUnifiedTimestamp().iso
        },
        sessionId: context.sessionId,
        conversationHistory: [],
        metadata: context.metadata
      }, message);
      
      return response.content;
    } catch (error) {
      console.error('Error in direct response generation:', error);
      return "I understand your request. Let me provide the best assistance I can while we work on enhancing my capabilities.";
    }
  }
}

/**
 * TeamMeetingEngine - Collective Intelligence Engine
 * Orchestrates team meetings between specialist agents for superior insights
 */
class TeamMeetingEngine {
  private oneAgentSystem: OneAgentSystem;
  private activeMeetings: Map<string, TeamMeeting> = new Map();
  
  constructor(oneAgentSystem: OneAgentSystem) {
    this.oneAgentSystem = oneAgentSystem;
  }
  
  async conductMeeting(request: TeamMeetingRequest): Promise<TeamMeeting> {
    const meetingId = uuidv4();
    const meeting: TeamMeeting = {
      id: meetingId,
      topic: request.topic,
      participants: await this.selectParticipants(request),
      coordinator: 'CoreAgent',
      context: request.context,
      status: 'planning',
      startTime: createUnifiedTimestamp(),
      perspectives: [],
      discussion: []
    };
    
    this.activeMeetings.set(meetingId, meeting);
    
    try {
      // Phase 1: Gather individual perspectives
      await this.gatherPerspectives(meeting);
      
      // Phase 2: Facilitate discussion
      await this.facilitateDiscussion(meeting);
      
      // Phase 3: Synthesize results
      await this.synthesizeResults(meeting);
      
      meeting.status = 'completed';
      
    } catch (error) {
      console.error('Team meeting error:', error);
      meeting.status = 'completed';
      
      // Provide fallback synthesis
      meeting.synthesis = {
        keyInsights: ['Meeting encountered technical difficulties'],
        recommendations: ['Consider individual specialist consultation'],
        conflictResolutions: [],
        actionItems: ['Retry with simplified approach'],
        confidence: 0.5,
        consensusLevel: 0.3
      };
    }
    
    return meeting;
  }
  
  private async selectParticipants(request: TeamMeetingRequest): Promise<string[]> {
    let participants = request.suggestedParticipants || [];
    
    // Smart participant selection based on topic
    if (participants.length === 0) {
      participants = this.inferParticipantsFromTopic(request.topic);
    }
    
    // Always include CoreAgent as coordinator
    if (!participants.includes('CoreAgent')) {
      participants.unshift('CoreAgent');
    }
    
    // Limit to reasonable number of participants
    return participants.slice(0, 4);
  }
  
  private inferParticipantsFromTopic(topic: string): string[] {
    const participants: string[] = ['CoreAgent'];
    
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('code') || topicLower.includes('develop') || topicLower.includes('architecture')) {
      participants.push('DevAgent');
    }
    
    if (topicLower.includes('document') || topicLower.includes('office') || topicLower.includes('productivity')) {
      participants.push('OfficeAgent');
    }
    
    if (topicLower.includes('fitness') || topicLower.includes('health') || topicLower.includes('workout')) {
      participants.push('FitnessAgent');
    }
    
    return participants;
  }
  
  private async gatherPerspectives(meeting: TeamMeeting): Promise<void> {
    meeting.status = 'active';
    
    const perspectives: AgentPerspective[] = [];
    
    for (const participantId of meeting.participants) {
      try {
        const agent = this.oneAgentSystem.specialists.get(participantId) || 
                     (participantId === 'CoreAgent' ? this.oneAgentSystem.coreAgent : null);
        
        if (agent) {
          const perspective = await agent.participateInMeeting(meeting);
          perspectives.push(perspective);
          
          // Add to discussion log
          meeting.discussion.push({
            round: 1,
            agentId: participantId,
            message: perspective.perspective,
            type: 'perspective',
            timestamp: createUnifiedTimestamp()
          });
        }
      } catch (error) {
        console.error(`Error gathering perspective from ${participantId}:`, error);
      }
    }
    
    meeting.perspectives = perspectives;
  }
  
  private async facilitateDiscussion(meeting: TeamMeeting): Promise<void> {
    // For now, implement basic discussion facilitation
    // This can be enhanced with more sophisticated interaction patterns
    
    const questions = this.generateDiscussionQuestions(meeting);
    
    for (const question of questions.slice(0, 2)) { // Limit to 2 rounds for efficiency
      for (const participantId of meeting.participants) {
        try {
          const agent = this.oneAgentSystem.specialists.get(participantId) || 
                       (participantId === 'CoreAgent' ? this.oneAgentSystem.coreAgent : null);
          
          if (agent) {
            // Simulate agent responding to discussion question
            const response = await this.getAgentResponse(agent, question, meeting);
            
            meeting.discussion.push({
              round: meeting.discussion.length + 1,
              agentId: participantId,
              message: response,
              type: 'response',
              timestamp: createUnifiedTimestamp()
            });
          }
        } catch (error) {
          console.error(`Error in discussion with ${participantId}:`, error);
        }
      }
    }
  }
  
  private generateDiscussionQuestions(meeting: TeamMeeting): string[] {
    const allConcerns = meeting.perspectives.flatMap(p => p.concerns);
    const allQuestions = meeting.perspectives.flatMap(p => p.questionsForOtherAgents);
    
    const questions = [
      `What are the main trade-offs we need to consider for: ${meeting.topic}?`,
      ...allQuestions.slice(0, 2),
      `How can we address these concerns: ${allConcerns.slice(0, 3).join(', ')}?`
    ];
    
    return questions.filter(q => q.length > 10); // Filter out empty/short questions
  }
  
  private async getAgentResponse(agent: SpecialistAgent, question: string, meeting: TeamMeeting): Promise<string> {
    try {
      // Use the agent's expertise to respond to the question
      const expertise = await agent.provideExpertise(question, meeting.context);
      return `${expertise.analysis} ${expertise.recommendations.slice(0, 2).join(' ')}`;
    } catch {
      return `As ${agent.name}, I think this requires careful consideration of ${agent.skills.join(' and ')}.`;
    }
  }
  
  private async synthesizeResults(meeting: TeamMeeting): Promise<void> {
    meeting.status = 'synthesizing';
    
    // Collect all insights and recommendations
    const allInsights = meeting.perspectives.flatMap(p => p.keyInsights);
    const allRecommendations = meeting.perspectives.flatMap(p => p.recommendations);
    
    // Calculate confidence based on agent agreement
    const avgConfidence = meeting.perspectives.reduce((sum, p) => sum + p.confidence, 0) / meeting.perspectives.length;
    
    // Detect conflicts and resolutions
    const conflicts = this.detectConflicts(meeting.perspectives);
    const resolutions = this.resolveConflicts(conflicts);
    
    meeting.synthesis = {
      keyInsights: this.deduplicate(allInsights).slice(0, 5),
      recommendations: this.deduplicate(allRecommendations).slice(0, 5),
      conflictResolutions: resolutions,
      actionItems: this.generateActionItems(allRecommendations),
      confidence: avgConfidence,
      consensusLevel: this.calculateConsensus(meeting.perspectives)
    };
  }
  
  private detectConflicts(perspectives: AgentPerspective[]): string[] {
    // Simple conflict detection - can be enhanced
    const conflicts: string[] = [];
    
    // Check for conflicting recommendations
    const recommendations = perspectives.flatMap(p => p.recommendations);
    if (recommendations.some(r => r.includes('avoid')) && recommendations.some(r => r.includes('implement'))) {
      conflicts.push('Conflicting implementation approaches detected');
    }
    
    return conflicts;
  }
  
  private resolveConflicts(conflicts: string[]): string[] {
    return conflicts.map(conflict => 
      `Resolution: Consider phased approach or hybrid solution for: ${conflict}`
    );
  }
  
  private generateActionItems(recommendations: string[]): string[] {
    return recommendations
      .filter(r => r.includes('implement') || r.includes('create') || r.includes('develop'))
      .slice(0, 3)
      .map(r => `Action: ${r}`);
  }
  
  private calculateConsensus(perspectives: AgentPerspective[]): number {
    // Simple consensus calculation based on similar recommendations
    const allRecs = perspectives.flatMap(p => p.recommendations);
    const uniqueRecs = this.deduplicate(allRecs);
    
    return allRecs.length > 0 ? (allRecs.length - uniqueRecs.length) / allRecs.length : 0;
  }
  
  private deduplicate(items: string[]): string[] {
    return [...new Set(items.map(item => item.toLowerCase()))].slice(0, 5);
  }
}

export default OneAgentSystem;
