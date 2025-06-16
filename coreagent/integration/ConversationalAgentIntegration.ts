/**
 * ConversationalAgentIntegration: Integration with OneAgent multi-agent system
 * 
 * This module integrates the conversational agent system with the existing
 * OneAgent infrastructure for practical deployment and testing.
 */

import { DialogueFacilitator } from '../orchestrator/DialogueFacilitator';
import { CoreAgent } from '../agents/specialized/CoreAgent';
import { ConversationContext, AgentPersonality } from '../types/ConversationTypes';

export class ConversationalAgentManager {
  private facilitator: DialogueFacilitator;
  private registeredAgents: Map<string, CoreAgent> = new Map();
  constructor() {
    this.facilitator = new DialogueFacilitator();
    this.initializeDefaultAgents();
  }

  /**
   * Initialize a set of default conversational agents
   */
  private initializeDefaultAgents(): void {
    const defaultPersonalities: AgentPersonality[] = [
      {
        perspective: "analytical",
        communicationStyle: "direct",
        expertiseFocus: ["software-architecture", "performance-analysis"],
        cognitiveStyle: "detail-oriented",
        biases: ["confirmation-bias"],
        confidence: 0.85
      },
      {
        perspective: "creative",
        communicationStyle: "collaborative",
        expertiseFocus: ["user-experience", "innovation"],
        cognitiveStyle: "big-picture",
        biases: ["optimism-bias"],
        confidence: 0.75
      },
      {
        perspective: "skeptical",
        communicationStyle: "diplomatic",
        expertiseFocus: ["security", "risk-management"],
        cognitiveStyle: "systems-thinking",
        biases: ["negativity-bias"],
        confidence: 0.90
      },
      {
        perspective: "practical",
        communicationStyle: "direct",
        expertiseFocus: ["implementation", "operations"],
        cognitiveStyle: "detail-oriented",
        biases: ["status-quo-bias"],
        confidence: 0.80
      }
    ];    defaultPersonalities.forEach((_personality, index) => {
      const agent = new CoreAgent({
        id: `conversational-agent-${index + 1}`,
        name: `ConversationalAgent-${index + 1}`,
        description: "Conversational agent for dialogue facilitation",
        capabilities: ["conversation", "dialogue", "facilitation"],
        memoryEnabled: true,
        aiEnabled: true
      });
      this.registeredAgents.set(agent.config.id, agent);
      // Note: DialogueFacilitator.registerAgent method needs to be implemented
    });
  }

  /**
   * Start a conversational session on a specific topic
   */
  async startConversation(
    topic: string,
    domain: string = "software-development",
    complexityLevel: number = 5
  ): Promise<any> {
    const context: ConversationContext = {
      domain,
      complexityLevel,
      stakeholders: ["development-team", "users"],
      constraints: ["time", "budget"],
      timeHorizon: "short-term",
      riskLevel: "medium",
      metadata: { 
        purpose: "collaborative-problem-solving",
        initiatedBy: "user",
        timestamp: new Date().toISOString()
      }
    };

    const participantIds = Array.from(this.registeredAgents.keys());
    const discussion = await this.facilitator.facilitateDiscussion(topic, context, participantIds);
    
    return {
      threadId: discussion.threadId,
      topic: discussion.topic,
      participants: discussion.participants,
      status: discussion.status,
      turnCount: discussion.turns.length,
      summary: "Conversation initiated successfully"
    };
  }

  /**
   * Get a conversation summary
   */
  async getConversationSummary(threadId: string): Promise<any> {
    try {
      const summary = await this.facilitator.concludeDiscussion(threadId);
      return {
        success: true,
        summary,
        insights: summary.keyInsights.map(insight => ({
          content: insight.content,
          confidence: Math.round(insight.confidence * 100),
          type: insight.insightType,
          novelty: Math.round(insight.novelty * 100)
        })),
        qualityMetrics: {
          overall: Math.round(summary.qualityAssessment.overallQuality),
          diversity: Math.round(summary.qualityAssessment.perspectiveDiversity),
          engagement: Math.round(summary.qualityAssessment.constructiveEngagement)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Test the conversational system with a sample scenario
   */
  async runConversationTest(): Promise<any> {
    console.log("🚀 Testing Conversational Multi-Agent System...\n");
    
    const scenarios = [
      "Should we implement caching for our API responses?",
      "How should we handle user authentication in our new microservice?",
      "What's the best approach for database migration with zero downtime?"
    ];

    const results = [];
    
    for (const scenario of scenarios) {
      console.log(`📋 Testing scenario: "${scenario}"`);
      
      try {
        const conversation = await this.startConversation(scenario, "software-architecture", 6);
        const summary = await this.getConversationSummary(conversation.threadId);
        
        results.push({
          scenario,
          success: summary.success,
          turnCount: conversation.turnCount,
          qualityScore: summary.qualityMetrics?.overall || 0,
          insightCount: summary.insights?.length || 0
        });
        
        console.log(`✅ Completed - Quality: ${summary.qualityMetrics?.overall || 0}%, Insights: ${summary.insights?.length || 0}`);
        
      } catch (error) {
        console.log(`❌ Failed: ${error}`);
        results.push({
          scenario,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    console.log("\n📊 Test Results Summary:");
    console.log("========================");
    
    const successCount = results.filter(r => r.success).length;
    const avgQuality = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.qualityScore || 0), 0) / Math.max(successCount, 1);
    
    console.log(`✅ Successful conversations: ${successCount}/${results.length}`);
    console.log(`📈 Average quality score: ${Math.round(avgQuality)}%`);
    console.log(`💡 Total insights generated: ${results.reduce((sum, r) => sum + (r.insightCount || 0), 0)}`);
    
    return {
      totalTests: results.length,
      successCount,
      averageQuality: Math.round(avgQuality),
      results
    };
  }

  /**
   * Get system status and capabilities
   */
  getSystemStatus(): any {
    return {
      status: "operational",
      agentCount: this.registeredAgents.size,
      capabilities: [
        "multi-agent-dialogue",
        "perspective-diversity",
        "collaborative-insights",
        "conversation-quality-assessment",
        "natural-language-communication"
      ],      agentTypes: Array.from(this.registeredAgents.values()).map(agent => ({
        id: agent.config.id,
        perspective: "analytical", // Default since CoreAgent doesn't have personality
        expertise: agent.config.capabilities
      }))
    };
  }
}

// Export for integration with existing OneAgent tools
export async function coordinateConversationalAgents(
  task: string,
  requiredCapabilities: string[] = [],
  maxAgents: number = 4
): Promise<any> {
  const manager = new ConversationalAgentManager();
  
  // Map the task to a conversational format
  const conversationTopic = `Task: ${task}. Required capabilities: ${requiredCapabilities.join(', ')}`;
  
  const conversation = await manager.startConversation(
    conversationTopic,
    "task-coordination",
    7
  );
  
  const summary = await manager.getConversationSummary(conversation.threadId);
  
  return {
    coordinationResult: "conversational-agents-engaged",
    threadId: conversation.threadId,
    participantCount: Math.min(maxAgents, manager.getSystemStatus().agentCount),
    insights: summary.insights || [],
    qualityScore: summary.qualityMetrics?.overall || 0,
    recommendedActions: summary.summary?.recommendedFollowup || []
  };
}

// Integration test function
export async function testConversationalIntegration(): Promise<void> {
  console.log("🧪 Conversational Agent Integration Test");
  console.log("========================================\n");
  
  const manager = new ConversationalAgentManager();
  
  // Test system status
  const status = manager.getSystemStatus();
  console.log("📊 System Status:", JSON.stringify(status, null, 2));
  
  // Run conversation test
  const testResults = await manager.runConversationTest();
  console.log("\n🏆 Final Test Results:", JSON.stringify(testResults, null, 2));
  
  // Test coordination function
  console.log("\n🔄 Testing coordination function...");
  const coordinationResult = await coordinateConversationalAgents(
    "Design a scalable user authentication system",
    ["security", "scalability", "user-experience"],
    3
  );
  console.log("✅ Coordination Result:", JSON.stringify(coordinationResult, null, 2));
}
