/**
 * SmartGeminiClient - Hybrid AI Client Implementation
 *
 * Strategy:
 * 1. Primary path: Enterprise wrapper (GeminiClient) providing retries, safety, monitoring.
 * 2. Fallback path: Direct Google Gen AI SDK (@google/genai) if wrapper fails or is disabled.
 * 3. Uniform ChatResponse interface regardless of underlying execution path.
 *
 * Design Goals:
 * - Zero deprecated dependencies (removed @google/generative-ai).
 * - Clear separation of responsibilities (wrapper vs direct).
 * - Explicit environment-based control: ONEAGENT_DISABLE_GENAI_DIRECT=1 to disable fallback.
 * - Strong typing (no implicit any) and transparent error reporting.
 */

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { GeminiClient } from './geminiClient';
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';
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
  private directClient: GoogleGenAI | null = null;
  private config: SmartGeminiConfig;
  private fallbackActive: boolean = false;

  constructor(config: SmartGeminiConfig = {}) {
    const apiKey = config.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    this.config = {
      apiKey,
      model: config.model || 'gemini-2.5-flash',
      useWrapperFirst: config.useWrapperFirst !== false,
      enableFallback:
        process.env.ONEAGENT_DISABLE_GENAI_DIRECT === '1' ? false : config.enableFallback !== false,
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

    try {
      this.directClient = new GoogleGenAI({ apiKey: this.config.apiKey });
    } catch (e) {
      console.warn('[SmartGeminiClient] Failed to initialize GoogleGenAI client', e);
      this.directClient = null;
    }

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
    const model = this.config.model || 'unknown-model';

    // Try enterprise wrapper first (if enabled)
    if (this.config.useWrapperFirst && !this.fallbackActive) {
      try {
        console.log('🏢 Attempting enterprise wrapper approach...');

        const response = await this.wrapperClient.chat(prompt, options);

        console.log(
          `✅ Enterprise wrapper success (${createUnifiedTimestamp().unix - startTime}ms)`,
        );
        try {
          unifiedMonitoringService.trackOperation('AI', 'gemini_wrapper_generate', 'success', {
            durationMs: createUnifiedTimestamp().unix - startTime,
            model,
            path: 'wrapper',
            fallbackActive: this.fallbackActive,
          });
        } catch {
          /* non-fatal monitoring */
        }
        return response;
      } catch (error: unknown) {
        const err = error as Error;
        console.log(`⚠️ Enterprise wrapper failed: ${err.message}`);
        try {
          unifiedMonitoringService.trackOperation('AI', 'gemini_wrapper_generate', 'error', {
            durationMs: createUnifiedTimestamp().unix - startTime,
            model,
            path: 'wrapper',
            fallbackActive: this.fallbackActive,
            errorMessage: err.message?.slice(0, 180),
          });
        } catch {
          /* non-fatal */
        }

        // Don't retry wrapper if it's clearly in mock mode
        if (err.message?.includes('rate limit') || err.message?.includes('mock mode')) {
          console.log('🔄 Activating permanent fallback mode due to wrapper issues');
          this.fallbackActive = true;
        }
      }
    }

    // Fallback: Direct Google Gen AI
    if (this.config.enableFallback) {
      return this.directGenerate(prompt, startTime);
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
      directAvailable: !!this.directClient,
      wrapperConfig: this.wrapperClient.getConfig(),
    };
  }

  /**
   * Direct generation path using Google Gen AI SDK.
   * Extracted for reuse (main generation + testBothApproaches).
   */
  private async directGenerate(prompt: string, startedUnix?: number): Promise<ChatResponse> {
    if (!this.directClient) throw new Error('Direct GoogleGenAI client not initialized');
    const began = startedUnix ?? createUnifiedTimestamp().unix;
    const model = this.config.model || 'unknown-model';
    const maxRetries = Math.max(0, this.config.maxRetries || 0);
    let attempt = 0;
    const baseDelay = 250;
    // Basic retry classification function
    const isTransient = (msg: string) =>
      /timeout|ECONN|network|429|temporar|ETIMEDOUT|ECONNRESET|ENOTFOUND|5\d{2}/i.test(msg);

    while (true) {
      try {
        const genStart = createUnifiedTimestamp().unix;
        const result: GenerateContentResponse = await this.directClient.models.generateContent({
          model: this.config.model!,
          contents: prompt,
        });
        const text = this.extractText(result);
        const response: ChatResponse = {
          response: text,
          finishReason: 'STOP',
          timestamp: new Date().toISOString(),
        };
        const total = createUnifiedTimestamp().unix - began;
        console.log(
          `✅ Direct Gemini success (${total}ms) [model=${this.config.model}] attempts=${attempt + 1}`,
        );
        try {
          unifiedMonitoringService.trackOperation('AI', 'gemini_direct_generate', 'success', {
            durationMs: total,
            model,
            attempts: attempt + 1,
            path: 'direct',
            fallbackActive: this.fallbackActive,
            lastAttemptDuration: createUnifiedTimestamp().unix - genStart,
          });
        } catch {
          /* ignore monitoring */
        }
        return response;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const total = createUnifiedTimestamp().unix - began;
        console.error(`❌ Direct Gemini failed attempt ${attempt + 1}:`, msg);
        const transient = isTransient(msg);
        // Permanent fallback disable if auth/config issue
        if (msg.includes('API key') || msg.includes('unauthorized')) this.fallbackActive = true;
        try {
          unifiedMonitoringService.trackOperation('AI', 'gemini_direct_generate', 'error', {
            durationMs: total,
            model,
            attempts: attempt + 1,
            path: 'direct',
            fallbackActive: this.fallbackActive,
            transient,
            errorMessage: msg.slice(0, 200),
          });
        } catch {
          /* ignore */
        }
        attempt++;
        if (!(transient && attempt <= maxRetries)) {
          throw new Error(`Direct Gemini failed: ${msg}`);
        }
        // Backoff with jitter
        const delayMs = baseDelay * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 100);
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
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
      results.direct = await this.directGenerate(testPrompt);
      console.log('✅ Direct test passed');
    } catch (error: unknown) {
      const err = error as Error;
      console.log('❌ Direct test failed:', err.message);
      results.direct = { error: err.message };
    }

    return results;
  }

  /** Extract text from GenerateContentResponse safely */
  private extractText(resp: GenerateContentResponse): string {
    try {
      const anyResp = resp as unknown as { text?: string };
      if (typeof anyResp.text === 'string') return anyResp.text;
      // Fallback: inspect candidates if present (future-proofing)
      const candList = (
        resp as unknown as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        }
      ).candidates;
      if (Array.isArray(candList)) {
        for (const c of candList) {
          const parts = c?.content?.parts;
          if (Array.isArray(parts)) {
            const partText = parts
              .map((p) => p?.text || '')
              .join('')
              .trim();
            if (partText) return partText;
          }
        }
      }
    } catch {
      /* ignore */
    }
    return '';
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
