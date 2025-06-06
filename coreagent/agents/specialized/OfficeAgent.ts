/**
 * OfficeAgent - Specialized agent for office and productivity tasks
 * 
 * This agent specializes in document processing, calendar management,
 * email assistance, and general office productivity tasks.
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResponse, AgentAction } from '../base/BaseAgent_new';
import { ISpecializedAgent, AgentStatus } from '../base/ISpecializedAgent';

export class OfficeAgent extends BaseAgent implements ISpecializedAgent {
  private processedMessages: number = 0;
  private errors: string[] = [];

  constructor(config: AgentConfig) {
    super(config);
  }

  /**
   * Initialize the office agent
   */
  async initialize(config: AgentConfig): Promise<void> {
    await super.initialize();
    console.log(`OfficeAgent ${config.id} initialized successfully`);
  }

  /**
   * Process office-related messages
   */
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    try {
      this.validateContext(context);
      this.processedMessages++;

      // Add message to memory for context
      await this.addMemory(context.user.id, message, {
        agentType: 'office',
        sessionId: context.sessionId,
        timestamp: new Date().toISOString()
      });

      // Search for relevant memories
      const relevantMemories = await this.searchMemories(context.user.id, message, 5);

      // Analyze the message for office-related tasks
      const actions = await this.analyzeOfficeTask(message);
      
      // Generate response using AI with office context
      const prompt = this.buildOfficePrompt(message, relevantMemories, context);
      const aiResponse = await this.generateResponse(prompt, relevantMemories);

      return this.createResponse(aiResponse, actions, relevantMemories);

    } catch (error) {
      this.errors.push(`Processing error: ${error.message}`);
      console.error('OfficeAgent processing error:', error);
      
      return this.createResponse(
        "I apologize, but I encountered an error processing your office request. Please try again.",
        [],
        []
      );
    }
  }

  /**
   * Get available office actions
   */
  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'document_create',
        description: 'Create a new document',
        parameters: { format: 'string', template: 'string' }
      },
      {
        type: 'calendar_schedule',
        description: 'Schedule a calendar event',
        parameters: { title: 'string', date: 'string', duration: 'number' }
      },
      {
        type: 'email_draft',
        description: 'Draft an email',
        parameters: { recipient: 'string', subject: 'string', tone: 'string' }
      },
      {
        type: 'task_organize',
        description: 'Organize tasks by priority',
        parameters: { tasks: 'array', criteria: 'string' }
      },
      {
        type: 'meeting_summarize',
        description: 'Summarize meeting notes',
        parameters: { notes: 'string', participants: 'array' }
      }
    ];
  }

  /**
   * Execute office-specific actions
   */
  async executeAction(action: AgentAction, context: AgentContext): Promise<any> {
    switch (action.type) {
      case 'document_create':
        return await this.createDocument(action.parameters, context);
      case 'calendar_schedule':
        return await this.scheduleEvent(action.parameters, context);
      case 'email_draft':
        return await this.draftEmail(action.parameters, context);
      case 'task_organize':
        return await this.organizeTasks(action.parameters, context);
      case 'meeting_summarize':
        return await this.summarizeMeeting(action.parameters, context);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Get agent status
   */
  getStatus(): AgentStatus {
    return {
      isHealthy: this.isReady() && this.errors.length < 5,
      lastActivity: new Date(),
      memoryCount: 0, // Would be fetched from memory client
      processedMessages: this.processedMessages,
      errors: [...this.errors]
    };
  }

  /**
   * Analyze message for office tasks
   */
  private async analyzeOfficeTask(message: string): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('document') || lowerMessage.includes('write')) {
      actions.push({
        type: 'document_create',
        description: 'Create document based on request',
        parameters: { content: message }
      });
    }

    if (lowerMessage.includes('schedule') || lowerMessage.includes('calendar')) {
      actions.push({
        type: 'calendar_schedule',
        description: 'Schedule event based on request',
        parameters: { request: message }
      });
    }

    if (lowerMessage.includes('email')) {
      actions.push({
        type: 'email_draft',
        description: 'Draft email based on request',
        parameters: { request: message }
      });
    }

    return actions;
  }

  /**
   * Build office-specific prompt for AI
   */
  private buildOfficePrompt(message: string, memories: any[], context: AgentContext): string {
    return `
You are an Office Assistant AI specialized in productivity and office tasks.

Context:
- User: ${context.user.name || 'User'}
- Session: ${context.sessionId}
- Previous interactions: ${memories.length} relevant memories

User Request: ${message}

Please provide helpful office assistance including:
- Document creation and formatting
- Calendar and scheduling support
- Email composition assistance  
- Task organization and prioritization
- Meeting planning and summarization

Be professional, efficient, and actionable in your responses.
`;
  }

  /**
   * Office action implementations
   */
  private async createDocument(params: any, context: AgentContext): Promise<any> {
    // Mock document creation
    return {
      success: true,
      documentId: `doc_${Date.now()}`,
      message: `Document created based on: ${params.content || params.request}`
    };
  }

  private async scheduleEvent(params: any, context: AgentContext): Promise<any> {
    // Mock calendar scheduling
    return {
      success: true,
      eventId: `event_${Date.now()}`,
      message: `Event scheduled based on: ${params.request}`
    };
  }

  private async draftEmail(params: any, context: AgentContext): Promise<any> {
    // Mock email drafting
    return {
      success: true,
      draftId: `draft_${Date.now()}`,
      message: `Email drafted based on: ${params.request}`
    };
  }

  private async organizeTasks(params: any, context: AgentContext): Promise<any> {
    // Mock task organization
    return {
      success: true,
      organized: true,
      message: 'Tasks organized by priority and deadline'
    };
  }

  private async summarizeMeeting(params: any, context: AgentContext): Promise<any> {
    // Mock meeting summarization
    return {
      success: true,
      summaryId: `summary_${Date.now()}`,
      message: 'Meeting summary generated'
    };
  }
}