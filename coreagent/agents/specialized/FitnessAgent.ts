/**
 * FitnessAgent - Specialized agent for fitness and wellness tasks
 * 
 * This agent specializes in workout planning, nutrition tracking,
 * progress monitoring, and health-related goal setting.
 */

import { BaseAgent, AgentConfig, AgentContext, AgentResponse, AgentAction } from '../base/BaseAgent';
import { ISpecializedAgent, AgentStatus, AgentHealthStatus } from '../base/ISpecializedAgent';

export class FitnessAgent extends BaseAgent implements ISpecializedAgent {
  public readonly id: string;
  public readonly config: AgentConfig;
  private processedMessages: number = 0;
  private errors: string[] = [];

  constructor(config: AgentConfig) {
    super(config);
    this.id = config.id || `fitness-agent-${Date.now()}`;
    this.config = config;
  }

  /**
   * Initialize the fitness agent
   */
  async initialize(): Promise<void> {
    await super.initialize();
    console.log(`FitnessAgent ${this.id} initialized successfully`);
  }

  /**
   * Process fitness-related messages
   */
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    try {
      this.validateContext(context);
      this.processedMessages++;

      // Add message to memory for context
      await this.addMemory(context.user.id, message, {
        agentType: 'fitness',
        sessionId: context.sessionId,
        timestamp: new Date().toISOString()
      });

      // Search for relevant fitness memories
      const relevantMemories = await this.searchMemories(context.user.id, message, 5);

      // Analyze the message for fitness-related tasks
      const actions = await this.analyzeFitnessTask(message);
      
      // Generate response using AI with fitness context
      const prompt = this.buildFitnessPrompt(message, relevantMemories, context);
      const aiResponse = await this.generateResponse(prompt, relevantMemories);

      return this.createResponse(aiResponse, actions, relevantMemories);    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errors.push(`Processing error: ${errorMessage}`);
      console.error('FitnessAgent processing error:', error);
      
      return this.createResponse(
        "I apologize, but I encountered an error processing your fitness request. Please try again.",
        [],
        []
      );
    }
  }

  /**
   * Get available fitness actions
   */
  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'workout_plan',
        description: 'Create a personalized workout plan',
        parameters: { duration: 'number', equipment: 'array', goals: 'array' }
      },
      {
        type: 'nutrition_track',
        description: 'Track nutrition and calories',
        parameters: { meal: 'string', calories: 'number', macros: 'object' }
      },
      {
        type: 'progress_monitor',
        description: 'Monitor fitness progress',
        parameters: { metric: 'string', value: 'number', date: 'string' }
      },
      {
        type: 'goal_set',
        description: 'Set fitness goals',
        parameters: { goalType: 'string', target: 'number', timeline: 'string' }
      },
      {
        type: 'exercise_recommend',
        description: 'Recommend exercises',
        parameters: { bodyPart: 'string', difficulty: 'string', equipment: 'array' }
      }
    ];
  }

  /**
   * Execute fitness-specific actions
   */
  async executeAction(action: AgentAction, context: AgentContext): Promise<any> {
    switch (action.type) {
      case 'workout_plan':
        return await this.createWorkoutPlan(action.parameters, context);
      case 'nutrition_track':
        return await this.trackNutrition(action.parameters, context);
      case 'progress_monitor':
        return await this.monitorProgress(action.parameters, context);
      case 'goal_set':
        return await this.setGoal(action.parameters, context);
      case 'exercise_recommend':
        return await this.recommendExercises(action.parameters, context);
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
   * Get agent name
   */
  getName(): string {
    return this.config.name || `FitnessAgent-${this.id}`;
  }

  /**
   * Get detailed health status
   */
  async getHealthStatus(): Promise<AgentHealthStatus> {
    return {
      status: this.isReady() && this.errors.length < 5 ? 'healthy' : 'degraded',
      uptime: Date.now(),
      memoryUsage: 0, // Mock value
      responseTime: 45, // Mock value
      errorRate: this.processedMessages > 0 ? this.errors.length / this.processedMessages : 0
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.errors = [];
    console.log(`FitnessAgent ${this.id} cleaned up`);
  }

  /**
   * Analyze message for fitness tasks
   */
  private async analyzeFitnessTask(message: string): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      actions.push({
        type: 'workout_plan',
        description: 'Create workout plan based on request',
        parameters: { request: message }
      });
    }

    if (lowerMessage.includes('nutrition') || lowerMessage.includes('calories') || lowerMessage.includes('diet')) {
      actions.push({
        type: 'nutrition_track',
        description: 'Track nutrition based on request',
        parameters: { request: message }
      });
    }

    if (lowerMessage.includes('progress') || lowerMessage.includes('weight') || lowerMessage.includes('measurement')) {
      actions.push({
        type: 'progress_monitor',
        description: 'Monitor progress based on request',
        parameters: { request: message }
      });
    }

    if (lowerMessage.includes('goal') || lowerMessage.includes('target')) {
      actions.push({
        type: 'goal_set',
        description: 'Set fitness goal based on request',
        parameters: { request: message }
      });
    }

    return actions;
  }
  /**
   * Build fitness-specific prompt for AI
   */
  private buildFitnessPrompt(message: string, memories: any[], context: AgentContext): string {
    // Extract customInstructions from enriched context userProfile
    const customInstructions = context.enrichedContext?.userProfile?.customInstructions;
    
    let prompt = `
You are a Fitness and Wellness Coach AI specialized in health, exercise, and nutrition.

Context:
- User: ${context.user.name || 'User'}
- Session: ${context.sessionId}
- Previous interactions: ${memories.length} relevant fitness memories`;

    // Add custom instructions if available
    if (customInstructions) {
      prompt += `
- User Preferences: ${customInstructions}`;
    }

    prompt += `

User Request: ${message}

Please provide helpful fitness guidance including:
- Personalized workout recommendations
- Nutrition advice and meal planning
- Progress tracking and motivation
- Goal setting and achievement strategies
- Exercise form and safety tips

Be encouraging, knowledgeable, and safety-focused in your responses.
Always remind users to consult healthcare professionals for medical advice.
`;

    return prompt;
  }

  /**
   * Fitness action implementations
   */
  private async createWorkoutPlan(params: any, _context: AgentContext): Promise<any> {
    // Mock workout plan creation
    return {
      success: true,
      planId: `workout_${Date.now()}`,
      plan: {
        duration: '4 weeks',
        frequency: '3-4 times per week',
        exercises: ['Push-ups', 'Squats', 'Planks', 'Lunges'],
        description: `Workout plan created based on: ${params.request}`
      }
    };
  }

  private async trackNutrition(params: any, _context: AgentContext): Promise<any> {
    // Mock nutrition tracking
    return {
      success: true,
      trackingId: `nutrition_${Date.now()}`,
      message: `Nutrition tracked based on: ${params.request}`,
      dailyCalories: 2000,
      macros: { protein: 150, carbs: 200, fat: 70 }
    };
  }

  private async monitorProgress(params: any, _context: AgentContext): Promise<any> {
    // Mock progress monitoring
    return {
      success: true,
      progressId: `progress_${Date.now()}`,
      message: `Progress monitored based on: ${params.request}`,
      trend: 'improving'
    };
  }

  private async setGoal(params: any, _context: AgentContext): Promise<any> {
    // Mock goal setting
    return {
      success: true,
      goalId: `goal_${Date.now()}`,
      message: `Fitness goal set based on: ${params.request}`,
      timeline: '8 weeks'
    };
  }

  private async recommendExercises(params: any, _context: AgentContext): Promise<any> {
    // Mock exercise recommendations
    return {
      success: true,
      recommendations: [
        'Push-ups (beginner to advanced variations)',
        'Bodyweight squats',
        'Plank holds',
        'Mountain climbers'
      ],
      message: `Exercise recommendations based on: ${params.request}`
    };
  }
}