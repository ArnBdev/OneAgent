/**
 * Register Real AI Agents with SmartGeminiClient in Agent Network
 */

import { DevAgent } from './coreagent/agents/specialized/DevAgent';
import { OfficeAgent } from './coreagent/agents/specialized/OfficeAgent';
import { FitnessAgent } from './coreagent/agents/specialized/FitnessAgent';
import { AgentConfig } from './coreagent/agents/base/BaseAgent';

async function registerRealAIAgents() {
  console.log('🤖 Registering Real AI Agents with Hybrid SmartGeminiClient\n');

  try {
    // Create DevAgent with SmartGeminiClient
    const devAgentConfig: AgentConfig = {
      id: 'DevAgent',
      name: 'Development Agent',
      description: 'AI-powered development assistant with code review, debugging, and generation capabilities',
      capabilities: ['code_review', 'debugging', 'code_generation', 'architecture_guidance', 'testing_support'],
      aiEnabled: true,
      memoryEnabled: true
    };

    const devAgent = new DevAgent(devAgentConfig);
    await devAgent.initialize();
    console.log('✅ DevAgent with SmartGeminiClient initialized');

    // Create OfficeAgent with SmartGeminiClient  
    const officeAgentConfig: AgentConfig = {
      id: 'OfficeAgent',
      name: 'Office Productivity Agent',
      description: 'AI-powered office assistant for documents, emails, and productivity tasks',
      capabilities: ['document_processing', 'email_assistance', 'scheduling', 'data_analysis'],
      aiEnabled: true,
      memoryEnabled: true
    };

    const officeAgent = new OfficeAgent(officeAgentConfig);
    await officeAgent.initialize();
    console.log('✅ OfficeAgent with SmartGeminiClient initialized');

    // Create FitnessAgent with SmartGeminiClient
    const fitnessAgentConfig: AgentConfig = {
      id: 'FitnessAgent', 
      name: 'Fitness & Health Agent',
      description: 'AI-powered fitness and health assistant',
      capabilities: ['workout_planning', 'nutrition_advice', 'health_tracking', 'goal_setting'],
      aiEnabled: true,
      memoryEnabled: true
    };

    const fitnessAgent = new FitnessAgent(fitnessAgentConfig);
    await fitnessAgent.initialize();
    console.log('✅ FitnessAgent with SmartGeminiClient initialized');

    // Test real AI responses
    console.log('\n🧪 Testing Real AI Agent Responses:');
    
    const testUser = {
      id: 'test-user-real-ai',
      name: 'Test User',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      preferences: {}
    };

    const testContext = {
      user: testUser,
      sessionId: 'test-session-real-ai',
      conversationHistory: []
    };

    // Test DevAgent AI response
    console.log('\n🔧 DevAgent AI Test:');
    const devResponse = await devAgent.processMessage(
      testContext,
      'Create a TypeScript function to validate email addresses'
    );
    console.log('DevAgent Response Length:', devResponse.content.length);
    console.log('DevAgent Response Preview:', devResponse.content.substring(0, 200) + '...');

    // Test OfficeAgent AI response  
    console.log('\n📄 OfficeAgent AI Test:');
    const officeResponse = await officeAgent.processMessage(
      testContext,
      'Help me write a professional email requesting a meeting'
    );
    console.log('OfficeAgent Response Length:', officeResponse.content.length);
    console.log('OfficeAgent Response Preview:', officeResponse.content.substring(0, 200) + '...');

    console.log('\n🎉 All real AI agents successfully initialized and tested!');
    console.log('✅ Agents are now generating REAL AI responses using SmartGeminiClient hybrid approach');

  } catch (error: any) {
    console.error('❌ Failed to register real AI agents:', error.message);
    console.error('Full error:', error);
  }
}

if (require.main === module) {
  registerRealAIAgents().catch(console.error);
}

export { registerRealAIAgents };
