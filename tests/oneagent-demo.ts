/**
 * OneAgent System Demo - Working Implementation
 * 
 * Demonstrates the core OneAgent functionality with minimal dependencies
 */

console.log('🚀 OneAgent System Demo - Starting...');
console.log('====================================\n');

// Mock interfaces for demo purposes
interface MockUser {
  id: string;
  name: string;
  createdAt: string;
  lastActiveAt: string;
}

interface MockConversationContext {
  userId: string;
  sessionId: string;
  conversationHistory: MockConversationMessage[];
  currentAgent: string;
  contextCategory: 'general' | 'coding' | 'office' | 'fitness';
  privacyLevel: 'public' | 'standard' | 'private';
  projectScope: 'default' | 'personal' | 'professional';
  metadata: Record<string, any>;
}

interface MockConversationMessage {
  id: string;
  timestamp: Date;
  from: string;
  content: string;
  contextCategory: string;
}

interface MockIntentAnalysis {
  intent: string;
  confidence: number;
  requiredSkills: string[];
  contextCategory: string;
  urgency: 'low' | 'normal' | 'high';
  requiresSpecialist: boolean;
  requiresTeamMeeting: boolean;
  suggestedAgent?: string;
  suggestedMeetingParticipants?: string[];
}

interface MockAgentResponse {
  message: string;
  handoffTo?: string;
  requiresTeamMeeting?: boolean;
  confidence: number;
  contextContinuity: MockConversationContext;
}

// Mock OneAgent System for Demo
class OneAgentDemo {
  private specialists: Map<string, any> = new Map();
  private conversationContext!: MockConversationContext;
  private conversationHistory: MockConversationMessage[] = [];

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents(): void {
    const agentTypes = [
      { id: 'CoreAgent', skills: ['coordination', 'routing', 'general_assistance'] },
      { id: 'DevAgent', skills: ['coding', 'debugging', 'architecture', 'testing'] },
      { id: 'OfficeAgent', skills: ['documents', 'scheduling', 'productivity', 'communication'] },
      { id: 'FitnessAgent', skills: ['workout_planning', 'nutrition', 'health_tracking', 'motivation'] }
    ];

    agentTypes.forEach(agent => {
      this.specialists.set(agent.id, {
        id: agent.id,
        skills: agent.skills,
        isActive: true
      });
    });

    console.log(`✅ Initialized ${this.specialists.size} specialist agents`);
  }

  async processUserMessage(message: string, userId: string = 'demo-user'): Promise<string> {
    console.log(`\n📥 Processing message: "${message}"`);
    
    // Create or update context
    if (!this.conversationContext || this.conversationContext.userId !== userId) {
      this.conversationContext = this.createConversationContext(userId);
      console.log(`📋 Created conversation context for user: ${userId}`);
    }

    // Add user message to history
    this.addToConversationHistory('user', message);

    // Analyze intent
    const intent = this.analyzeIntent(message);
    console.log(`🧠 Intent analysis: ${intent.intent} (confidence: ${(intent.confidence * 100).toFixed(1)}%)`);

    // Handle routing
    if (intent.requiresSpecialist && intent.suggestedAgent) {
      return this.executeHandoff(intent.suggestedAgent, message);
    }

    if (intent.requiresTeamMeeting) {
      return this.initiateTeamMeeting(message, intent.suggestedMeetingParticipants || []);
    }

    // Handle directly
    const response = `I understand you're looking for help with ${intent.intent}. Let me assist you with that.`;
    this.addToConversationHistory('CoreAgent', response);
    return response;
  }

  private analyzeIntent(message: string): MockIntentAnalysis {
    const lowerMessage = message.toLowerCase();
    
    // Detect coding-related requests
    if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('bug') || lowerMessage.includes('debug')) {
      return {
        intent: 'coding_assistance',
        confidence: 0.9,
        requiredSkills: ['coding', 'debugging'],
        contextCategory: 'coding',
        urgency: 'normal',
        requiresSpecialist: true,
        requiresTeamMeeting: false,
        suggestedAgent: 'DevAgent'
      };
    }

    // Detect office/productivity requests
    if (lowerMessage.includes('document') || lowerMessage.includes('schedule') || lowerMessage.includes('meeting') || lowerMessage.includes('productivity')) {
      return {
        intent: 'office_assistance',
        confidence: 0.85,
        requiredSkills: ['documents', 'scheduling'],
        contextCategory: 'office',
        urgency: 'normal',
        requiresSpecialist: true,
        requiresTeamMeeting: false,
        suggestedAgent: 'OfficeAgent'
      };
    }

    // Detect fitness/health requests
    if (lowerMessage.includes('workout') || lowerMessage.includes('fitness') || lowerMessage.includes('exercise') || lowerMessage.includes('health')) {
      return {
        intent: 'fitness_assistance',
        confidence: 0.8,
        requiredSkills: ['workout_planning', 'nutrition'],
        contextCategory: 'fitness',
        urgency: 'normal',
        requiresSpecialist: true,
        requiresTeamMeeting: false,
        suggestedAgent: 'FitnessAgent'
      };
    }

    // Detect team meeting needs
    if (lowerMessage.includes('discuss') || lowerMessage.includes('brainstorm') || lowerMessage.includes('team') || lowerMessage.includes('collaborate')) {
      return {
        intent: 'team_collaboration',
        confidence: 0.9,
        requiredSkills: ['coordination', 'collaboration'],
        contextCategory: 'general',
        urgency: 'normal',
        requiresSpecialist: false,
        requiresTeamMeeting: true,
        suggestedMeetingParticipants: ['DevAgent', 'OfficeAgent']
      };
    }

    // Default general assistance
    return {
      intent: 'general_assistance',
      confidence: 0.7,
      requiredSkills: ['general_assistance'],
      contextCategory: 'general',
      urgency: 'normal',
      requiresSpecialist: false,
      requiresTeamMeeting: false
    };
  }

  private executeHandoff(targetAgentId: string, _originalMessage: string): string {
    const targetAgent = this.specialists.get(targetAgentId);
    
    if (!targetAgent) {
      const response = `I couldn't find the ${targetAgentId} specialist. Let me handle this directly.`;
      this.addToConversationHistory('CoreAgent', response);
      return response;
    }

    console.log(`🔄 Executing handoff to: ${targetAgentId}`);
    console.log(`🎯 Agent skills: ${targetAgent.skills.join(', ')}`);
    
    const handoffMessage = `Hello! I'm the ${targetAgentId} and I specialize in ${targetAgent.skills.join(', ')}. I'm ready to help you with your request.`;
    
    this.addToConversationHistory('system', `Handoff from CoreAgent to ${targetAgentId}`);
    this.addToConversationHistory(targetAgentId, handoffMessage);
    
    return handoffMessage;
  }

  private initiateTeamMeeting(_message: string, participants: string[]): string {
    console.log(`🏛️ Initiating team meeting with participants: ${participants.join(', ')}`);
    
    const meetingResponse = `I've convened a team meeting to discuss your request. Our specialists are collaborating to provide you with the best possible assistance.

Meeting Participants:
${participants.map(p => `  🤖 ${p}: ${this.specialists.get(p)?.skills.join(', ') || 'Available'}`).join('\n')}

They're working together to analyze your request and will provide a comprehensive response shortly.`;

    this.addToConversationHistory('team-meeting', `Meeting initiated: ${participants.join(', ')}`);
    this.addToConversationHistory('CoreAgent', meetingResponse);
    
    return meetingResponse;
  }

  private createConversationContext(userId: string): MockConversationContext {
    return {
      userId,
      sessionId: `session-${Date.now()}`,
      conversationHistory: [],
      currentAgent: 'CoreAgent',
      contextCategory: 'general',
      privacyLevel: 'standard',
      projectScope: 'default',
      metadata: {
        createdAt: new Date().toISOString(),
        platform: 'OneAgent-Demo'
      }
    };
  }

  private addToConversationHistory(from: string, content: string): void {
    const message: MockConversationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      from,
      content,
      contextCategory: this.conversationContext.contextCategory
    };
    
    this.conversationHistory.push(message);
    this.conversationContext.conversationHistory.push(message);
  }

  getConversationHistory(): MockConversationMessage[] {
    return this.conversationHistory;
  }

  getRegisteredAgents(): string[] {
    return Array.from(this.specialists.keys());
  }
}

// Demo execution
async function runOneAgentDemo(): Promise<void> {
  const oneAgent = new OneAgentDemo();
  
  console.log(`🤖 OneAgent System initialized with agents: ${oneAgent.getRegisteredAgents().join(', ')}\n`);

  // Test scenarios
  const testMessages = [
    "I need help debugging a JavaScript function",
    "Can you help me schedule a meeting for next week?",
    "I want to create a workout plan for building muscle",
    "Let's brainstorm ideas for improving our project architecture",
    "What's the weather like today?"
  ];

  for (const message of testMessages) {
    console.log('=' .repeat(60));
    const response = await oneAgent.processUserMessage(message);
    console.log(`💬 OneAgent Response: ${response}`);
    console.log();
  }

  console.log('=' .repeat(60));
  console.log('📋 Conversation History Summary:');
  const history = oneAgent.getConversationHistory();
  history.forEach((msg, index) => {
    console.log(`${index + 1}. [${msg.from}]: ${msg.content}`);
  });

  console.log('\n🎉 OneAgent Demo completed successfully!');
  console.log('✅ Demonstrated: Unified interface, agent routing, handoffs, team meetings');
}

// Run the demo
runOneAgentDemo().catch(console.error);
