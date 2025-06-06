import { GeminiClient } from './coreagent/tools/geminiClient';

// Test the class
const config = {
  apiKey: 'test-key',
  model: 'gemini-pro'
};

const client = new GeminiClient(config);
console.log('Client created:', client.getConfig());
