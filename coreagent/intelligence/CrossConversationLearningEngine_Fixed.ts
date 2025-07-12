/**
 * Phase 4: Cross-Conversation Learning Engine
 * 
 * Analyzes conversation patterns across sessions to identify successful workflows,
 * extract learning patterns, and apply insights to future interactions.
 */

import { OneAgentMemory } from '../memory/OneAgentMemory';

export interface ConversationPattern {
  id: string;
  type: 'workflow' | 'collaboration' | 'problem_solving' | 'decision_making';
  pattern: string;
  confidence: number;
  successRate: number;
  usageCount: number;
  domain: string;
  createdAt: Date;
  lastUsed: Date;
  outcomes: string[];
  metadata: Record<string, unknown>;
}

export interface WorkflowPattern {
  id: string;
  name: string;
  steps: string[];
  domain: string;
  successRate: number;
  avgExecutionTime: number;
  complexity: 'low' | 'medium' | 'high';
  prerequisites: string[];
  outcomes: string[];
  createdAt: Date;
  lastUsed: Date;
  metadata: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  type: string;
  participants: string[];
  messages: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
  startTime: Date;
  endTime: Date;
  outcome: string;
  confidence: number;
  domain: string;
  metadata: Record<string, unknown>;
}

export interface ConversationOptimization {
  optimizationType: string;
  predictedOutcome: string;
  confidence: number;
  suggestedActions: string[];
  riskMitigation: string[];
  estimatedImprovement: number;
  applicablePatterns: string[];
  metadata: Record<string, unknown>;
}

export class CrossConversationLearningEngine {
  private memory: OneAgentMemory;
  private patterns: Map<string, ConversationPattern>;
  private workflows: Map<string, WorkflowPattern>;

  constructor(memory: OneAgentMemory) {
    this.memory = memory;
    this.patterns = new Map();
    this.workflows = new Map();
  }

  /**
   * Analyze conversation patterns across sessions
   * Core Phase 4 requirement
   */
  async analyzeConversationPatterns(conversations: Conversation[]): Promise<ConversationPattern[]> {
    console.log(`🔍 Analyzing ${conversations.length} conversations for patterns...`);
    
    try {
      const patterns: ConversationPattern[] = [];
      const domainGroups = this.groupConversationsByDomain(conversations);
      
      for (const [domain, domainConversations] of domainGroups) {
        // Analyze workflow patterns
        const workflowPatterns = await this.extractWorkflowPatterns(domainConversations);
        
        // Analyze collaboration patterns
        const collaborationPatterns = await this.extractCollaborationPatterns(domainConversations);
        
        // Analyze problem-solving patterns
        const problemSolvingPatterns = await this.extractProblemSolvingPatterns(domainConversations);
        
        patterns.push(...workflowPatterns, ...collaborationPatterns, ...problemSolvingPatterns);
      }
      
      // Store patterns in memory
      for (const pattern of patterns) {
        this.patterns.set(pattern.id, pattern);
        await this.storePatternInMemory(pattern);
      }
      
      console.log(`✅ Identified ${patterns.length} conversation patterns`);
      return patterns;
      
    } catch (error) {
      console.error('❌ Error analyzing conversation patterns:', error);
      return [];
    }
  }

  /**
   * Extract successful workflow patterns
   * Core Phase 4 requirement
   */
  async extractSuccessfulWorkflows(conversations: Conversation[]): Promise<WorkflowPattern[]> {
    console.log(`⚡ Extracting successful workflows from ${conversations.length} conversations...`);
    
    try {
      const workflows: WorkflowPattern[] = [];
      const successfulConversations = conversations.filter(conv => conv.confidence > 0.7);
      
      for (const conversation of successfulConversations) {
        const workflow = await this.analyzeWorkflowFromConversation(conversation);
        if (workflow) {
          workflows.push(workflow);
        }
      }
      
      // Store workflows in memory
      for (const workflow of workflows) {
        this.workflows.set(workflow.id, workflow);
        await this.storeWorkflowInMemory(workflow);
      }
      
      console.log(`✅ Extracted ${workflows.length} successful workflows`);
      return workflows;
      
    } catch (error) {
      console.error('❌ Error extracting workflows:', error);
      return [];
    }
  }

  /**
   * Apply learned patterns to new conversations
   * Core Phase 4 requirement
   */
  async applyLearning(
    currentConversation: Conversation,
    learnedPatterns: ConversationPattern[]
  ): Promise<ConversationOptimization> {
    console.log(`🧠 Applying learned patterns to conversation: ${currentConversation.id}`);
    
    try {
      // Find relevant patterns
      const relevantPatterns = this.findRelevantPatterns(currentConversation, learnedPatterns);
      
      // Predict outcome
      const predictedOutcome = await this.predictOutcome(currentConversation);
      
      // Generate optimization suggestions
      const optimization: ConversationOptimization = {
        optimizationType: this.determineOptimizationType(relevantPatterns),
        predictedOutcome: predictedOutcome.outcome,
        confidence: predictedOutcome.confidence,
        suggestedActions: this.generateSuggestedActions(relevantPatterns),
        riskMitigation: this.generateRiskMitigation(relevantPatterns),
        estimatedImprovement: this.calculateEstimatedImprovement(relevantPatterns),
        applicablePatterns: relevantPatterns.map(p => p.id),
        metadata: {
          analysisTimestamp: new Date(),
          patternCount: relevantPatterns.length,
          domain: currentConversation.domain
        }
      };
      
      console.log(`✅ Generated optimization with ${optimization.confidence}% confidence`);
      return optimization;
      
    } catch (error) {
      console.error('❌ Error applying learning:', error);
      return {
        optimizationType: 'basic',
        predictedOutcome: 'unknown',
        confidence: 0.3,
        suggestedActions: ['Monitor conversation closely'],
        riskMitigation: ['Have backup plan ready'],
        estimatedImprovement: 0.1,
        applicablePatterns: [],
        metadata: { error: error.message }
      };
    }
  }

  // Helper methods
  private groupConversationsByDomain(conversations: Conversation[]): Map<string, Conversation[]> {
    const domainGroups = new Map<string, Conversation[]>();
    
    conversations.forEach(conversation => {
      const domain = conversation.domain;
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain)!.push(conversation);
    });
    
    return domainGroups;
  }

  private async extractWorkflowPatterns(conversations: Conversation[]): Promise<ConversationPattern[]> {
    const patterns: ConversationPattern[] = [];
    
    for (const conversation of conversations) {
      if (conversation.confidence > 0.7) {
        const pattern: ConversationPattern = {
          id: `workflow-${conversation.id}-${Date.now()}`,
          type: 'workflow',
          pattern: `Successful workflow in ${conversation.domain}`,
          confidence: conversation.confidence,
          successRate: 0.85,
          usageCount: 1,
          domain: conversation.domain,
          createdAt: new Date(),
          lastUsed: new Date(),
          outcomes: [conversation.outcome],
          metadata: {
            sourceConversation: conversation.id,
            messageCount: conversation.messages.length
          }
        };
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  private async extractCollaborationPatterns(conversations: Conversation[]): Promise<ConversationPattern[]> {
    const patterns: ConversationPattern[] = [];
    
    const multiParticipantConversations = conversations.filter(conv => conv.participants.length > 1);
    
    for (const conversation of multiParticipantConversations) {
      if (conversation.confidence > 0.6) {
        const pattern: ConversationPattern = {
          id: `collaboration-${conversation.id}-${Date.now()}`,
          type: 'collaboration',
          pattern: `Effective collaboration with ${conversation.participants.length} participants`,
          confidence: conversation.confidence,
          successRate: 0.75,
          usageCount: 1,
          domain: conversation.domain,
          createdAt: new Date(),
          lastUsed: new Date(),
          outcomes: [conversation.outcome],
          metadata: {
            participantCount: conversation.participants.length,
            collaborationDuration: conversation.endTime.getTime() - conversation.startTime.getTime()
          }
        };
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  private async extractProblemSolvingPatterns(conversations: Conversation[]): Promise<ConversationPattern[]> {
    const patterns: ConversationPattern[] = [];
    
    const problemSolvingConversations = conversations.filter(conv => 
      conv.messages.some(msg => msg.content.toLowerCase().includes('problem') || 
                              msg.content.toLowerCase().includes('solution'))
    );
    
    for (const conversation of problemSolvingConversations) {
      if (conversation.confidence > 0.65) {
        const pattern: ConversationPattern = {
          id: `problem-solving-${conversation.id}-${Date.now()}`,
          type: 'problem_solving',
          pattern: `Problem-solving approach in ${conversation.domain}`,
          confidence: conversation.confidence,
          successRate: 0.8,
          usageCount: 1,
          domain: conversation.domain,
          createdAt: new Date(),
          lastUsed: new Date(),
          outcomes: [conversation.outcome],
          metadata: {
            problemKeywords: this.extractProblemKeywords(conversation.messages),
            solutionSteps: this.extractSolutionSteps(conversation.messages)
          }
        };
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  private async analyzeWorkflowFromConversation(conversation: Conversation): Promise<WorkflowPattern | null> {
    const steps = this.extractWorkflowSteps(conversation.messages);
    
    if (steps.length > 0) {
      return {
        id: `workflow-${conversation.id}-${Date.now()}`,
        name: `${conversation.domain} Workflow`,
        steps,
        domain: conversation.domain,
        successRate: conversation.confidence,
        avgExecutionTime: conversation.endTime.getTime() - conversation.startTime.getTime(),
        complexity: this.determineComplexity(steps),
        prerequisites: this.extractPrerequisites(conversation.messages),
        outcomes: [conversation.outcome],
        createdAt: new Date(),
        lastUsed: new Date(),
        metadata: {
          sourceConversation: conversation.id,
          messageCount: conversation.messages.length
        }
      };
    }
    
    return null;
  }

  private extractWorkflowSteps(messages: Array<{role: string; content: string; timestamp: Date}>): string[] {
    const steps: string[] = [];
    
    messages.forEach(message => {
      if (message.content.includes('step') || message.content.includes('then') || message.content.includes('next')) {
        steps.push(message.content.substring(0, 100));
      }
    });
    
    return steps;
  }

  private determineComplexity(steps: string[]): 'low' | 'medium' | 'high' {
    if (steps.length <= 3) return 'low';
    if (steps.length <= 6) return 'medium';
    return 'high';
  }

  private extractPrerequisites(messages: Array<{role: string; content: string; timestamp: Date}>): string[] {
    const prerequisites: string[] = [];
    
    messages.forEach(message => {
      if (message.content.includes('require') || message.content.includes('need') || message.content.includes('prerequisite')) {
        prerequisites.push(message.content.substring(0, 100));
      }
    });
    
    return prerequisites;
  }

  private extractProblemKeywords(messages: Array<{role: string; content: string; timestamp: Date}>): string[] {
    const keywords: string[] = [];
    const problemWords = ['problem', 'issue', 'challenge', 'difficulty', 'error', 'bug'];
    
    messages.forEach(message => {
      problemWords.forEach(word => {
        if (message.content.toLowerCase().includes(word)) {
          keywords.push(word);
        }
      });
    });
    
    return [...new Set(keywords)];
  }

  private extractSolutionSteps(messages: Array<{role: string; content: string; timestamp: Date}>): string[] {
    const steps: string[] = [];
    
    messages.forEach(message => {
      if (message.content.includes('solution') || message.content.includes('fix') || message.content.includes('resolve')) {
        steps.push(message.content.substring(0, 100));
      }
    });
    
    return steps;
  }

  private findRelevantPatterns(conversation: Conversation, patterns: ConversationPattern[]): ConversationPattern[] {
    return patterns.filter(pattern => 
      pattern.domain === conversation.domain && 
      pattern.confidence > 0.6
    );
  }

  private async predictOutcome(conversation: Conversation): Promise<{outcome: string; confidence: number}> {
    // Simple prediction based on conversation characteristics
    const messageCount = conversation.messages.length;
    const participantCount = conversation.participants.length;
    
    let confidence = 0.5;
    let outcome = 'unknown';
    
    if (messageCount > 5 && participantCount > 1) {
      confidence = 0.75;
      outcome = 'collaborative_success';
    } else if (messageCount > 3) {
      confidence = 0.65;
      outcome = 'individual_success';
    } else {
      confidence = 0.4;
      outcome = 'needs_more_interaction';
    }
    
    return { outcome, confidence };
  }

  private determineOptimizationType(patterns: ConversationPattern[]): string {
    if (patterns.length === 0) return 'basic';
    
    const types = patterns.map(p => p.type);
    const mostCommonType = types.reduce((a, b) => 
      types.filter(v => v === a).length >= types.filter(v => v === b).length ? a : b
    );
    
    return `${mostCommonType}_optimization`;
  }

  private generateSuggestedActions(patterns: ConversationPattern[]): string[] {
    const actions: string[] = [];
    
    patterns.forEach(pattern => {
      switch (pattern.type) {
        case 'workflow':
          actions.push('Follow established workflow patterns');
          break;
        case 'collaboration':
          actions.push('Engage multiple participants');
          break;
        case 'problem_solving':
          actions.push('Use structured problem-solving approach');
          break;
        case 'decision_making':
          actions.push('Apply decision-making framework');
          break;
      }
    });
    
    return [...new Set(actions)];
  }

  private generateRiskMitigation(patterns: ConversationPattern[]): string[] {
    const mitigation: string[] = [];
    
    patterns.forEach(pattern => {
      if (pattern.successRate < 0.7) {
        mitigation.push(`Monitor ${pattern.type} pattern closely`);
      }
    });
    
    if (mitigation.length === 0) {
      mitigation.push('Continue with current approach');
    }
    
    return mitigation;
  }

  private calculateEstimatedImprovement(patterns: ConversationPattern[]): number {
    if (patterns.length === 0) return 0.1;
    
    const avgSuccessRate = patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length;
    return Math.min(avgSuccessRate * 0.3, 0.5);
  }

  private async storePatternInMemory(pattern: ConversationPattern): Promise<void> {
    await this.memory.addMemory({
      content: `Conversation Pattern: ${pattern.type} - ${pattern.pattern}`,
      metadata: {
        type: 'conversation_pattern',
        patternId: pattern.id,
        domain: pattern.domain,
        confidence: pattern.confidence,
        successRate: pattern.successRate,
        timestamp: Date.now(),
        category: 'phase4_learning'
      }
    });
  }

  private async storeWorkflowInMemory(workflow: WorkflowPattern): Promise<void> {
    await this.memory.addMemory({
      content: `Workflow Pattern: ${workflow.name} - ${workflow.steps.join(', ')}`,
      metadata: {
        type: 'workflow_pattern',
        workflowId: workflow.id,
        domain: workflow.domain,
        successRate: workflow.successRate,
        complexity: workflow.complexity,
        timestamp: Date.now(),
        category: 'phase4_learning'
      }
    });
  }
}
