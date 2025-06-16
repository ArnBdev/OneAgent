/**
 * SmartGeminiClient - Hybrid AI Client Implementation
 * 
 * Implements smart fallback strategy:
 * 1. Try enterprise GeminiClient wrapper first (with retries, monitoring, safety)
 * 2. Fall back to direct @google/generative-ai calls if wrapper fails
 * 3. Provide consistent interface regardless of underlying implementation
 * 
 * This ensures immediate working AI while preserving enterprise features.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GeminiClient } from './geminiClient';
import { GeminiConfig, ChatResponse, ChatOptions } from '../types/gemini';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface SmartGeminiConfig {
  apiKey?: string | undefined;
  model?: string | undefined;
  useWrapperFirst?: boolean | undefined;
  enableFallback?: boolean | undefined;
  maxRetries?: number | undefined;
}

export class SmartGeminiClient {
  private wrapperClient: GeminiClient;
  private directClient: GoogleGenerativeAI;
  private directModel: GenerativeModel;
  private config: SmartGeminiConfig;
  private fallbackActive: boolean = false;

  constructor(config: SmartGeminiConfig = {}) {    const apiKey = config.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    
    this.config = {
      apiKey: apiKey,
      model: config.model || 'gemini-2.0-flash-exp',
      useWrapperFirst: config.useWrapperFirst !== false, // Default true
      enableFallback: config.enableFallback !== false,   // Default true
      maxRetries: config.maxRetries || 2,
      ...config
    };

    if (!this.config.apiKey) {
      throw new Error('No Gemini API key found. Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.');
    }

    // Initialize enterprise wrapper client
    this.wrapperClient = new GeminiClient({
      apiKey: this.config.apiKey,
      model: this.config.model
    } as GeminiConfig);

    // Initialize direct Google Generative AI client
    this.directClient = new GoogleGenerativeAI(this.config.apiKey);
    this.directModel = this.directClient.getGenerativeModel({ model: this.config.model! });

    console.log(`🧠 SmartGeminiClient initialized with model: ${this.config.model}`);
    console.log(`🔧 Wrapper-first: ${this.config.useWrapperFirst}, Fallback enabled: ${this.config.enableFallback}`);
  }

  /**
   * Smart content generation with enterprise wrapper + direct fallback
   */
  async generateContent(prompt: string, options?: ChatOptions): Promise<ChatResponse> {
    const startTime = Date.now();
    
    // Try enterprise wrapper first (if enabled)
    if (this.config.useWrapperFirst && !this.fallbackActive) {
      try {
        console.log('🏢 Attempting enterprise wrapper approach...');
        
        const response = await this.wrapperClient.chat(prompt, options);
        
        console.log(`✅ Enterprise wrapper success (${Date.now() - startTime}ms)`);
        return response;
        
      } catch (error: any) {
        console.log(`⚠️ Enterprise wrapper failed: ${error.message}`);
        
        // Don't retry wrapper if it's clearly in mock mode
        if (error.message?.includes('rate limit') || error.message?.includes('mock mode')) {
          console.log('🔄 Activating permanent fallback mode due to wrapper issues');
          this.fallbackActive = true;
        }
      }
    }

    // Fall back to direct Google Generative AI
    if (this.config.enableFallback) {
      try {
        console.log('🚀 Using direct Gemini API approach...');
        
        const result = await this.directModel.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        const chatResponse: ChatResponse = {
          response: text,
          finishReason: 'STOP',
          timestamp: new Date().toISOString()
        };
        
        console.log(`✅ Direct Gemini success (${Date.now() - startTime}ms)`);
        return chatResponse;
        
      } catch (error: any) {
        console.error('❌ Direct Gemini also failed:', error.message);
        throw new Error(`Both enterprise wrapper and direct Gemini failed: ${error.message}`);
      }
    }

    throw new Error('All AI generation methods failed and fallback is disabled');
  }

  /**
   * Simple chat interface (legacy compatibility)
   */
  async chat(message: string, options?: ChatOptions): Promise<ChatResponse> {
    return this.generateContent(message, options);
  }

  /**
   * Force switch to direct mode (bypass wrapper)
   */
  enableDirectMode(): void {
    this.fallbackActive = true;
    console.log('🚀 Switched to direct mode - bypassing enterprise wrapper');
  }

  /**
   * Re-enable wrapper attempts
   */
  enableWrapperMode(): void {
    this.fallbackActive = false;
    console.log('🏢 Re-enabled enterprise wrapper attempts');
  }

  /**
   * Get current configuration and status
   */
  getStatus() {
    return {
      model: this.config.model,
      useWrapperFirst: this.config.useWrapperFirst,
      enableFallback: this.config.enableFallback,
      fallbackActive: this.fallbackActive,
      hasApiKey: !!this.config.apiKey,
      wrapperConfig: this.wrapperClient.getConfig()
    };
  }

  /**
   * Test both approaches to verify functionality
   */
  async testBothApproaches(): Promise<{wrapper: any, direct: any}> {
    const testPrompt = "Say 'Hello from AI!' in exactly those words.";
    
    const results = {
      wrapper: null as any,
      direct: null as any
    };

    // Test wrapper
    try {
      console.log('🧪 Testing enterprise wrapper...');
      results.wrapper = await this.wrapperClient.chat(testPrompt);
      console.log('✅ Wrapper test passed');
    } catch (error: any) {
      console.log('❌ Wrapper test failed:', error.message);
      results.wrapper = { error: error.message };
    }

    // Test direct
    try {
      console.log('🧪 Testing direct Gemini...');
      const result = await this.directModel.generateContent(testPrompt);
      results.direct = {
        response: result.response.text(),
        finishReason: 'STOP',
        timestamp: new Date().toISOString()
      };
      console.log('✅ Direct test passed');
    } catch (error: any) {
      console.log('❌ Direct test failed:', error.message);
      results.direct = { error: error.message };
    }

    return results;
  }
}

// Export lazy-loaded singleton instance for easy use
let _smartGeminiClient: SmartGeminiClient | null = null;
export const smartGeminiClient = (): SmartGeminiClient => {
  if (!_smartGeminiClient) {
    _smartGeminiClient = new SmartGeminiClient();
  }
  return _smartGeminiClient;
};

export default SmartGeminiClient;
