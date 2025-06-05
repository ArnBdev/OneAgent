// Test script for AI Assistant functionality
import { GeminiClient } from './coreagent/tools/geminiClient';
import { AIAssistantTool } from './coreagent/tools/aiAssistant';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAIAssistant() {
  console.log('🧪 Testing AI Assistant standalone...');
  
  // Initialize Gemini client
  const geminiClient = new GeminiClient({
    apiKey: process.env.GOOGLE_API_KEY || 'test_key',
    model: process.env.GOOGLE_MODEL || 'gemini-pro'
  });
  
  // Initialize AI Assistant
  const aiAssistant = new AIAssistantTool(geminiClient);
  
  // Test generateResponse functionality
  console.log('\n1. Testing basic question...');
  const response1 = await aiAssistant.ask('What is OneAgent?', {
    temperature: 0.5,
    maxTokens: 150
  });
  
  console.log(`✅ Success: ${response1.success}`);
  console.log(`🕐 Processing time: ${response1.processingTime}ms`);
  console.log(`📝 Response: ${response1.result.substring(0, 100)}...`);
  
  // Test with system context
  console.log('\n2. Testing with context...');
  const response2 = await aiAssistant.ask('How should I organize my workflow?', {
    context: 'OneAgent is a modular AI platform for workflow automation',
    temperature: 0.6,
    maxTokens: 200,
    format: 'markdown'
  });
  
  console.log(`✅ Success: ${response2.success}`);
  console.log(`🕐 Processing time: ${response2.processingTime}ms`);
  console.log(`📝 Response: ${response2.result.substring(0, 100)}...`);
  
  // Test summarization
  console.log('\n3. Testing summarization...');
  const longText = `OneAgent is a comprehensive AI agent platform designed for modularity and scalability. 
  The system features CoreAgent as its foundation, providing essential shared functionality including 
  workflow management, user identity handling, memory integration through Mem0, intelligent web search 
  via Brave API, and AI-powered assistance using Google Gemini. The architecture is built with modern 
  TypeScript and follows clean architecture principles, making it extensible for specialized agent 
  modules like CodeAgent for development tasks, OfficeAgent for productivity workflows, and HomeAgent 
  for smart home automation. The platform prioritizes security with proper API key management, 
  private data storage, and comprehensive error handling throughout all components.`;
  
  const summary = await aiAssistant.summarize(longText, {
    maxLength: 50,
    style: 'brief'
  });
  
  console.log(`✅ Success: ${summary.success}`);
  console.log(`🕐 Processing time: ${summary.processingTime}ms`);
  console.log(`📝 Summary: ${summary.result}`);
  
  console.log('\n🎉 AI Assistant test completed!');
}

if (require.main === module) {
  testAIAssistant().catch(console.error);
}
