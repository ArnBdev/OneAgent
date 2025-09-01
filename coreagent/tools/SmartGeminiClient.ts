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
import {
  GeminiConfig,
  ChatResponse,
  ChatOptions,
  EmbeddingOptions,
  EmbeddingResult,
} from '../types/gemini';
import * as dotenv from 'dotenv';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

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

  constructor(config: SmartGeminiConfig = {}) {
    const apiKey = config.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    this.config = {
      apiKey: apiKey,
      model: config.model || 'gemini-2.5-flash', // Updated to latest stable model
      useWrapperFirst: config.useWrapperFirst !== false, // Default true
      enableFallback: config.enableFallback !== false, // Default true
      maxRetries: config.maxRetries || 2,
      ...config,
    };

    if (!this.config.apiKey) {
      throw new Error(
        'No Gemini API key found. Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.',
      );
    }

    // Ensure compatibility with @google/generative-ai which may read from
    // process.env.GOOGLE_API_KEY internally in some versions. Set it here
    // as a safe fallback to avoid API_KEY_INVALID errors when the client
    // library inspects env vars instead of constructor args.
    try {
      if (!process.env.GOOGLE_API_KEY) process.env.GOOGLE_API_KEY = String(this.config.apiKey);
    } catch {
      // Non-fatal — just log if we can't set env var
      console.warn('Warning: could not set process.env.GOOGLE_API_KEY fallback');
      /* noop */
    }

    // Initialize enterprise wrapper client
    this.wrapperClient = new GeminiClient({
      apiKey: this.config.apiKey,
      model: this.config.model,
    } as GeminiConfig);

    // Initialize direct Google Generative AI client
    this.directClient = new GoogleGenerativeAI(this.config.apiKey);
    this.directModel = this.directClient.getGenerativeModel({ model: this.config.model! });

    console.log(`🧠 SmartGeminiClient initialized with model: ${this.config.model}`);
    console.log(
      `🔧 Wrapper-first: ${this.config.useWrapperFirst}, Fallback enabled: ${this.config.enableFallback}`,
    );
  }

  /**
   * Smart content generation with enterprise wrapper + direct fallback
   */
  async generateContent(prompt: string, options?: ChatOptions): Promise<ChatResponse> {
    const startTime = createUnifiedTimestamp().unix;

    // Try enterprise wrapper first (if enabled)
    if (this.config.useWrapperFirst && !this.fallbackActive) {
      try {
        console.log('🏢 Attempting enterprise wrapper approach...');

        const response = await this.wrapperClient.chat(prompt, options);

        console.log(
          `✅ Enterprise wrapper success (${createUnifiedTimestamp().unix - startTime}ms)`,
        );
        return response;
      } catch (error: unknown) {
        const err = error as Error;
        console.log(`⚠️ Enterprise wrapper failed: ${err.message}`);

        // Don't retry wrapper if it's clearly in mock mode
        if (err.message?.includes('rate limit') || err.message?.includes('mock mode')) {
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
          timestamp: new Date().toISOString(),
        };

        console.log(`✅ Direct Gemini success (${createUnifiedTimestamp().unix - startTime}ms)`);
        return chatResponse;
      } catch (error: unknown) {
        const err = error as unknown;
        // Try to extract useful info from library error
        let msg = String(err);
        if (typeof err === 'object' && err !== null) {
          const maybeMessage = (err as unknown as { message?: unknown }).message;
          if (maybeMessage) msg = String(maybeMessage);
          try {
            const resp = (err as unknown as { response?: { text?: () => Promise<string> } })
              .response;
            if (resp && typeof resp.text === 'function') {
              // attempt to read body
              const body = await resp.text();
              if (body) msg += ` | response_body: ${body}`;
            }
          } catch {
            // noop
          }
        }
        console.error('❌ Direct Gemini also failed:', msg);
        throw new Error(`Both enterprise wrapper and direct Gemini failed: ${msg}`);
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
   * Expose embedding generation (pass-through to wrapper client) so higher-level
   * capability-based code (e.g., ConstitutionValidator) can rely on a unified client
   * without needing raw GeminiClient instanceof checks.
   */
  async generateEmbedding(text: string, options?: EmbeddingOptions): Promise<EmbeddingResult> {
    return this.wrapperClient.generateEmbedding(text, options);
  }

  async generateEmbeddingBatch(
    texts: string[],
    options?: EmbeddingOptions,
  ): Promise<EmbeddingResult[]> {
    return this.wrapperClient.generateEmbeddingBatch(texts, options);
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
      wrapperConfig: this.wrapperClient.getConfig(),
    };
  }

  /**
   * Test both approaches to verify functionality
   */
  async testBothApproaches(): Promise<{
    wrapper: ChatResponse | { error: string };
    direct: ChatResponse | { error: string };
  }> {
    const testPrompt = "Say 'Hello from AI!' in exactly those words.";

    const results: {
      wrapper: ChatResponse | { error: string };
      direct: ChatResponse | { error: string };
    } = {
      wrapper: { error: 'Not tested' },
      direct: { error: 'Not tested' },
    };

    // Test wrapper
    try {
      console.log('🧪 Testing enterprise wrapper...');
      results.wrapper = await this.wrapperClient.chat(testPrompt);
      console.log('✅ Wrapper test passed');
    } catch (error: unknown) {
      const err = error as Error;
      console.log('❌ Wrapper test failed:', err.message);
      results.wrapper = { error: err.message };
    }

    // Test direct
    try {
      console.log('🧪 Testing direct Gemini...');
      const result = await this.directModel.generateContent(testPrompt);
      results.direct = {
        response: result.response.text(),
        finishReason: 'STOP',
        timestamp: new Date().toISOString(),
      };
      console.log('✅ Direct test passed');
    } catch (error: unknown) {
      const err = error as Error;
      console.log('❌ Direct test failed:', err.message);
      results.direct = { error: err.message };
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
