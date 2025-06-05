import { GeminiClient } from '../coreagent/tools/geminiClient';

// Test if the class can be instantiated
const config = { apiKey: 'test' };
const client = new GeminiClient(config);

console.log('Test passed');
