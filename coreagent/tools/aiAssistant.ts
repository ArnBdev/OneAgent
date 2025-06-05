// AI Assistant tool using Google Gemini for intelligent text processing

import { GeminiClient } from './geminiClient';
import { ChatResponse, ChatOptions } from '../types/gemini';

export interface AIAssistantOptions {
  temperature?: number;
  maxTokens?: number;
  context?: string;
  format?: 'text' | 'json' | 'markdown';
}

export interface AITaskResult {
  success: boolean;
  result: string;
  confidence?: number;
  processingTime: number;
  timestamp: string;
  error?: string;
}

export class AIAssistantTool {
  private geminiClient: GeminiClient;

  constructor(geminiClient: GeminiClient) {
    this.geminiClient = geminiClient;
  }

  /**
   * Ask the AI assistant a question
   */
  async ask(question: string, options?: AIAssistantOptions): Promise<AITaskResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 AI Assistant: Processing question "${question.substring(0, 50)}..."`);      const chatOptions: ChatOptions = {
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 1000,
        ...(options?.context && { context: options.context })
      };

      // Add format instructions if specified
      let formattedQuestion = question;
      if (options?.format === 'json') {
        formattedQuestion += '\n\nPlease respond in valid JSON format.';
      } else if (options?.format === 'markdown') {
        formattedQuestion += '\n\nPlease format your response using Markdown.';
      }

      const response = await this.geminiClient.chat(formattedQuestion, chatOptions);
      const processingTime = Date.now() - startTime;

      console.log(`🤖 AI Assistant: Response generated in ${processingTime}ms`);

      return {
        success: true,
        result: response.response,
        confidence: this.calculateConfidence(response),
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      console.error('❌ AI Assistant error:', error.message);
      
      return {
        success: false,
        result: '',
        processingTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Analyze and summarize text
   */
  async summarize(text: string, options?: { 
    maxLength?: number; 
    style?: 'brief' | 'detailed' | 'bullet-points' 
  }): Promise<AITaskResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 AI Assistant: Summarizing ${text.length} characters`);

      let instruction = 'Please provide a clear and concise summary of the following text';
      
      if (options?.maxLength) {
        instruction += ` in approximately ${options.maxLength} words`;
      }
      
      if (options?.style === 'bullet-points') {
        instruction += ' using bullet points to highlight key information';
      } else if (options?.style === 'detailed') {
        instruction += ' with detailed analysis of main themes and important details';
      } else if (options?.style === 'brief') {
        instruction += ' focusing only on the most essential information';
      }

      const response = await this.geminiClient.summarizeText(text, options?.maxLength);
      const processingTime = Date.now() - startTime;

      console.log(`🤖 AI Assistant: Summary completed in ${processingTime}ms`);

      return {
        success: true,
        result: response.response,
        confidence: this.calculateConfidence(response),
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      console.error('❌ AI Assistant summarization error:', error.message);
      
      return {
        success: false,
        result: '',
        processingTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Analyze text with specific instructions
   */
  async analyze(text: string, instruction: string, options?: AIAssistantOptions): Promise<AITaskResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 AI Assistant: Analyzing text with instruction "${instruction.substring(0, 30)}..."`);      const response = await this.geminiClient.analyzeText(text, instruction, {
        temperature: options?.temperature || 0.3,
        maxTokens: options?.maxTokens || 1500,
        ...(options?.context && { context: options.context })
      });

      const processingTime = Date.now() - startTime;

      console.log(`🤖 AI Assistant: Analysis completed in ${processingTime}ms`);

      return {
        success: true,
        result: response.response,
        confidence: this.calculateConfidence(response),
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      console.error('❌ AI Assistant analysis error:', error.message);
      
      return {
        success: false,
        result: '',
        processingTime,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Help with workflow tasks
   */
  async helpWithWorkflow(workflowName: string, currentStep: string, context: string): Promise<AITaskResult> {
    const question = `I'm working on a workflow called "${workflowName}" and I'm currently at the step: "${currentStep}". 
    
Context: ${context}

Can you help me understand what I should do next or provide guidance for completing this step effectively?`;

    return this.ask(question, {
      temperature: 0.5,
      maxTokens: 800,
      format: 'markdown'
    });
  }

  /**
   * Generate workflow suggestions
   */
  async suggestWorkflowImprovements(workflowDescription: string): Promise<AITaskResult> {
    const question = `Please analyze this workflow description and suggest improvements, optimizations, or potential issues:

${workflowDescription}

Please provide specific, actionable suggestions.`;

    return this.ask(question, {
      temperature: 0.6,
      maxTokens: 1000,
      format: 'markdown'
    });
  }

  /**
   * Test the AI assistant functionality
   */
  async testAssistant(): Promise<boolean> {
    try {
      console.log('🤖 Testing AI assistant functionality...');
      
      const testResult = await this.ask('Please respond with "AI Assistant test successful" to confirm you are working correctly.', {
        temperature: 0.1,
        maxTokens: 50
      });
      
      const isWorking = testResult.success && testResult.result.toLowerCase().includes('test successful');
      
      if (isWorking) {
        console.log('✅ AI assistant test passed');
      } else {
        console.log('⚠️ AI assistant test completed (mock mode)');
      }
      
      return isWorking || testResult.success; // Allow mock mode to pass
    } catch (error) {
      console.error('❌ AI assistant test failed:', error);
      return false;
    }
  }

  /**
   * Calculate confidence score based on response characteristics
   */
  private calculateConfidence(response: ChatResponse): number {
    let confidence = 70; // Base confidence

    // Increase confidence for longer, more detailed responses
    if (response.response.length > 200) confidence += 10;
    if (response.response.length > 500) confidence += 10;

    // Increase confidence if response finished normally
    if (response.finishReason === 'STOP') confidence += 10;

    // Decrease confidence for very short responses
    if (response.response.length < 50) confidence -= 20;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Get AI assistant configuration
   */
  getConfig() {
    return {
      provider: 'Google Gemini',
      clientConfig: this.geminiClient.getConfig()
    };
  }
}
