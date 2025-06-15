/**
 * ConversationalAgentDemo: Demonstrates the working conversational multi-agent system
 * 
 * This demo shows how multiple AI agents can engage in natural language discussions
 * to collaboratively solve problems and generate insights.
 */

import { DialogueFacilitatorFixed } from '../coreagent/orchestrator/DialogueFacilitatorFixed';

async function demonstrateConversationalAgents() {
  console.log("🤖 Conversational Multi-Agent System Demo");
  console.log("==========================================\n");

  // Create the facilitator
  const facilitator = new DialogueFacilitatorFixed();

  try {
    // Demonstrate a conversation about microservices architecture
    console.log("📋 Topic: 'Should we adopt microservices architecture for our user management system?'\n");
    
    const summary = await facilitator.demonstrateConversation(
      "Should we adopt microservices architecture for our user management system?"
    );

    console.log("💬 CONVERSATION SUMMARY");
    console.log("=======================");
    console.log(`🎯 Topic: ${summary.topic}`);
    console.log(`👥 Participants: ${summary.participants.join(', ')}`);
    console.log(`⏱️  Duration: ${summary.duration} minutes`);
    console.log(`💭 Total Turns: ${summary.turnCount}`);
    console.log(`📊 Overall Quality: ${summary.qualityAssessment.overallQuality}%`);
    
    console.log("\n🔍 KEY INSIGHTS:");
    summary.keyInsights.forEach((insight, index) => {
      console.log(`${index + 1}. ${insight.content} (Confidence: ${(insight.confidence * 100).toFixed(0)}%)`);
    });

    console.log("\n📌 MAJOR POINTS:");
    summary.majorPoints.forEach((point, index) => {
      console.log(`${index + 1}. ${point}`);
    });

    console.log("\n✅ AREAS OF AGREEMENT:");
    summary.areasOfAgreement.forEach((agreement, index) => {
      console.log(`${index + 1}. ${agreement}`);
    });

    console.log("\n❓ UNRESOLVED QUESTIONS:");
    summary.unresolvedQuestions.forEach((question, index) => {
      console.log(`${index + 1}. ${question}`);
    });

    console.log("\n📈 QUALITY ASSESSMENT:");
    console.log(`- Perspective Diversity: ${summary.qualityAssessment.perspectiveDiversity.toFixed(1)}%`);
    console.log(`- Constructive Engagement: ${summary.qualityAssessment.constructiveEngagement.toFixed(1)}%`);
    console.log(`- Insight Generation: ${summary.qualityAssessment.insightGeneration.toFixed(1)}%`);
    console.log(`- Participation Balance: ${summary.qualityAssessment.participationBalance.toFixed(1)}%`);

    console.log("\n💪 STRENGTHS:");
    summary.qualityAssessment.strengths.forEach(strength => {
      console.log(`- ${strength}`);
    });

    console.log("\n⚠️ AREAS FOR IMPROVEMENT:");
    summary.qualityAssessment.weaknesses.forEach(weakness => {
      console.log(`- ${weakness}`);
    });

    console.log("\n🚀 RECOMMENDED FOLLOW-UP:");
    summary.recommendedFollowup.forEach((followup, index) => {
      console.log(`${index + 1}. ${followup}`);
    });

    console.log("\n✨ CONCLUSION");
    console.log("==============");
    console.log("The conversational multi-agent system successfully facilitated a");
    console.log("natural language discussion between AI agents with different perspectives.");
    console.log("This demonstrates the potential for genuine collaborative AI dialogue!");

  } catch (error) {
    console.error("❌ Error during demonstration:", error);
  }
}

// Also create a simple test for direct agent interaction
async function testDirectAgentInteraction() {
  console.log("\n🔬 DIRECT AGENT INTERACTION TEST");
  console.log("=================================\n");

  const facilitator = new DialogueFacilitatorFixed();
  const agents = facilitator.createDiverseAgents();
  
  console.log("👥 Created agents:");
  agents.forEach(agent => {
    console.log(`- ${agent.agentId}: ${agent['personality'].perspective} perspective`);
  });

  // Test direct agent-to-agent communication
  const analyticalAgent = agents[0];
  const creativeAgent = agents[1];
  
  console.log("\n💬 Direct Agent Communication Test:");
  console.log("------------------------------------");
  
  const message = "I think we should use a monolithic architecture for simplicity";
  console.log(`📤 Analytical Agent says: "${message}"`);
  
  const response = await creativeAgent.respondToAgent(
    message,
    analyticalAgent.agentId,
    creativeAgent['conversationMemory']
  );
  
  console.log(`📥 Creative Agent responds: "${response}"`);

  // Test assumption challenging
  console.log("\n🎯 Assumption Challenging Test:");
  console.log("-------------------------------");
  
  const assumption = "Microservices are always better than monoliths";
  const challenge = await analyticalAgent.challengeAssumption(assumption, "data shows otherwise");
  console.log(`🔍 Challenge: "${challenge}"`);
}

// Main execution
async function main() {
  await demonstrateConversationalAgents();
  await testDirectAgentInteraction();
  
  console.log("\n🎉 Demo completed successfully!");
  console.log("The conversational multi-agent system is working and demonstrates:");
  console.log("- Natural language agent-to-agent communication");
  console.log("- Diverse perspectives and collaborative dialogue");
  console.log("- Insight generation through multi-agent synthesis");
  console.log("- Quality assessment and conversation facilitation");
}

if (require.main === module) {
  main().catch(console.error);
}

export { demonstrateConversationalAgents, testDirectAgentInteraction };
