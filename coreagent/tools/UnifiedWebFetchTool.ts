/**
 * Unified Web Fetch Tool
 * Constitutional AI-compliant wrapper for WebFetchTool
 */

import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from './UnifiedMCPTool';
import { WebFetchTool } from './webFetch';
import { OneAgentMemory, OneAgentMemoryConfig } from '../memory/OneAgentMemory';
import { createUnifiedId, OneAgentUnifiedMetadataService } from '../utils/UnifiedBackboneService';

export interface WebFetchParams {
  url: string;
  extractContent?: boolean;
  includeMetadata?: boolean;
  timeout?: number;
  userAgent?: string;
  validateUrl?: boolean;
}

export interface WebFetchResult {
  success: boolean;
  content?: {
    text?: string;
    metadata?: unknown;
    safetyScore?: number;
    contentWarnings?: string[];
  };
  timing?: {
    totalTime?: number;
  };
  constitutionalValidation?: {
    passed: boolean;
    warnings: string[];
    safetyScore: number;
  };
}

export interface FetchLearning {
  id: string;
  agentId: string;
  learningType: string;
  content: string;
  confidence: number;
  applicationCount: number;
  lastApplied: Date;
  sourceConversations: unknown[];
  metadata: {
    tool: string;
    operation: string;
    domain?: string;
  };
}

export class UnifiedWebFetchTool extends UnifiedMCPTool {
  private webFetchTool: WebFetchTool;
  private memorySystem: OneAgentMemory;
  private metadataService: OneAgentUnifiedMetadataService;

  constructor() {
    const schema: InputSchema = {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to fetch content from',
          pattern: '^https?://.+',
        },
        extractContent: {
          type: 'boolean',
          description: 'Extract main content from HTML (default: true)',
        },
        includeMetadata: {
          type: 'boolean',
          description: 'Include page metadata (default: true)',
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds (default: 10000)',
          minimum: 1000,
          maximum: 30000,
        },
        userAgent: {
          type: 'string',
          description: 'Custom User-Agent string',
        },
        validateUrl: {
          type: 'boolean',
          description: 'Validate URL before fetching (default: true)',
        },
      },
      required: ['url'],
    };

    super(
      'oneagent_web_fetch',
      'Fetch and extract content from web pages with Constitutional AI validation',
      schema,
      'enhanced',
    );

    // Initialize WebFetchTool
    this.webFetchTool = new WebFetchTool({
      defaultTimeout: 10000,
      defaultUserAgent: 'OneAgent-WebFetchTool/1.0 (Constitutional AI Compliant)',
      maxRetries: 3,
      retryDelay: 1000,
      maxContentSize: 10 * 1024 * 1024, // 10MB
      allowedContentTypes: [
        'text/html',
        'text/plain',
        'text/xml',
        'application/xml',
        'application/json',
        'text/markdown',
      ],
    });
    const memoryConfig: OneAgentMemoryConfig = {
      apiKey: process.env.MEM0_API_KEY || 'demo-key',
      apiUrl: process.env.MEM0_API_URL,
    };
    this.memorySystem = OneAgentMemory.getInstance(memoryConfig);
    this.metadataService = OneAgentUnifiedMetadataService.getInstance();
  }

  public async executeCore(args: unknown): Promise<ToolExecutionResult> {
    try {
      const params = args as WebFetchParams;
      const {
        url,
        extractContent = true,
        includeMetadata = true,
        timeout = 10000,
        userAgent,
        validateUrl = true,
      } = params;

      // Constitutional AI URL validation
      const urlValidation = this.validateUrlSafety(url);
      if (!urlValidation.isValid) {
        return {
          success: false,
          data: {
            success: false,
            message: `URL validation failed: ${urlValidation.reason}`,
            url,
            timestamp: new Date().toISOString(),
          },
        };
      } // Fetch content using WebFetchTool
      const fetchResult = await this.webFetchTool.fetchContent({
        url,
        extractContent,
        extractMetadata: includeMetadata,
        timeout,
        ...(userAgent && { userAgent }),
        validateUrl,
      });

      // Apply Constitutional AI content filtering
      const filteredContent = await this.applyContentFiltering(fetchResult);

      // Store fetch learning in memory
      await this.storeFetchLearning(url, filteredContent);

      return {
        success: true,
        data: {
          success: true,
          fetchResult: filteredContent,
          url,
          contentExtracted: extractContent,
          metadataIncluded: includeMetadata,
          constitutionallyValidated: true,
          message: 'Web content fetched with Constitutional AI validation',
          capabilities: [
            'Web content fetching and extraction',
            'Constitutional AI content filtering',
            'Safe URL validation',
            'Metadata extraction and analysis',
          ],
          qualityScore: this.calculateContentQuality(filteredContent),
          toolName: 'oneagent_web_fetch',
          constitutionalCompliant: true,
          timestamp: new Date().toISOString(),
          metadata: {
            fetchType: 'web_content',
            toolFramework: 'unified_mcp_v1.0',
            constitutionalLevel: 'enhanced',
          },
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        data: error instanceof Error ? error.message : 'Web fetch failed',
        qualityScore: 0,
      };
    }
  }

  /**
   * Validate URL safety using Constitutional AI principles
   */
  private validateUrlSafety(url: string): { isValid: boolean; reason?: string } {
    try {
      const urlObj = new URL(url);

      // Block potentially harmful protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, reason: 'Only HTTP/HTTPS protocols allowed' };
      }

      // Block localhost and private IPs for security
      const hostname = urlObj.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.')
      ) {
        return { isValid: false, reason: 'Private/localhost URLs not allowed' };
      }

      // Block potentially malicious file extensions
      const maliciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
      if (maliciousExtensions.some((ext) => urlObj.pathname.toLowerCase().endsWith(ext))) {
        return { isValid: false, reason: 'Potentially unsafe file type' };
      }

      return { isValid: true };
    } catch {
      return { isValid: false, reason: 'Invalid URL format' };
    }
  }

  /**
   * Apply Constitutional AI content filtering
   */
  private async applyContentFiltering(fetchResult: WebFetchResult): Promise<WebFetchResult> {
    if (!fetchResult.success || !fetchResult.content) {
      return fetchResult;
    }

    // Filter potentially harmful content patterns
    const harmfulPatterns = [
      /\b(download.*virus|malware|trojan)\b/gi,
      /\b(hack.*password|steal.*data|phishing)\b/gi,
      /\b(illegal.*download|piracy|torrent)\b/gi,
    ];

    const contentWarnings: string[] = [];
    const content = fetchResult.content.text || '';

    harmfulPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        contentWarnings.push(`Potential security concern detected (pattern ${index + 1})`);
      }
    });

    return {
      ...fetchResult,
      content: {
        ...fetchResult.content,
        safetyScore: this.calculateSafetyScore(content),
        ...(contentWarnings.length > 0 && { contentWarnings }),
      },
      constitutionalValidation: {
        passed: contentWarnings.length === 0,
        warnings: contentWarnings,
        safetyScore: this.calculateSafetyScore(content),
      },
    };
  }

  /**
   * Calculate content safety score
   */
  private calculateSafetyScore(content: string): number {
    let score = 100;

    const riskyTerms = [
      'virus',
      'malware',
      'hack',
      'exploit',
      'phishing',
      'illegal',
      'piracy',
      'crack',
      'keygen',
      'warez',
    ];

    const contentLower = content.toLowerCase();
    riskyTerms.forEach((term) => {
      const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score -= matches * 5; // Reduce score for each risky term occurrence
    });

    return Math.max(score, 0);
  }

  /**
   * Calculate overall content quality
   */
  private calculateContentQuality(fetchResult: WebFetchResult): number {
    if (!fetchResult.success) return 0;

    let score = 50; // Base score

    // Boost for successful content extraction
    if (fetchResult.content && fetchResult.content.text) {
      score += 20;

      // Boost for substantial content
      if (fetchResult.content.text.length > 1000) {
        score += 15;
      }
    }

    // Boost for metadata availability
    if (fetchResult.content && fetchResult.content.metadata) {
      score += 10;
    }

    // Apply safety score
    const safetyScore = fetchResult.content?.safetyScore || 100;
    score = score * (safetyScore / 100);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Store fetch learning in memory
   */
  private async storeFetchLearning(url: string, fetchResult: WebFetchResult): Promise<void> {
    try {
      const learning: FetchLearning = {
        id: createUnifiedId('learning', 'web_fetch'),
        agentId: 'oneagent_web_fetch',
        learningType: 'documentation_context',
        content: JSON.stringify({
          url,
          success: fetchResult.success,
          contentLength: fetchResult.content?.text?.length || 0,
          safetyScore: fetchResult.content?.safetyScore || 0,
          qualityScore: this.calculateContentQuality(fetchResult),
          fetchTime: fetchResult.timing?.totalTime || 0,
          timestamp: new Date().toISOString(),
          insights: this.generateFetchInsights(url, fetchResult),
        }),
        confidence: 0.9,
        applicationCount: 0,
        lastApplied: new Date(),
        sourceConversations: [],
        metadata: {
          tool: 'web_fetch',
          operation: 'web_content_fetch',
          ...(() => {
            try {
              return { domain: new URL(url).hostname };
            } catch {
              return {};
            }
          })(),
        },
      };
      await this.memorySystem.addMemoryCanonical(
        learning.content,
        this.metadataService.create('web_fetch_learning', 'UnifiedWebFetchTool', {
          system: {
            userId: 'system',
            source: 'web_fetch_tool',
            component: 'fetch-learning',
          },
          content: {
            category: 'web_intelligence',
            tags: ['web', 'fetch', 'learning'],
            sensitivity: 'internal',
            relevanceScore: 0.7,
            contextDependency: 'global',
          },
          contextual: {
            url,
            success: fetchResult.success,
            qualityScore: this.calculateContentQuality(fetchResult),
          },
        }),
        'system',
      );
    } catch (_error) {
      console.warn('[UnifiedWebFetchTool] Failed to store fetch learning:', _error);
    }
  }

  /**
   * Generate insights from fetch results
   */
  private generateFetchInsights(url: string, fetchResult: WebFetchResult): string[] {
    const insights: string[] = [];

    if (!fetchResult.success) {
      insights.push('Fetch failed - check URL accessibility and network connectivity');
    } else {
      const contentLength = fetchResult.content?.text?.length || 0;
      if (contentLength < 100) {
        insights.push('Very short content - may indicate redirection or minimal page');
      } else if (contentLength > 50000) {
        insights.push('Large content detected - consider content summarization');
      }

      const safetyScore = fetchResult.content?.safetyScore || 100;
      if (safetyScore < 80) {
        insights.push('Safety concerns detected - review content before use');
      }
    }

    try {
      const domain = new URL(url).hostname;
      insights.push(`Domain: ${domain} - consider adding to trusted/blocked list based on quality`);
    } catch {
      insights.push('URL parsing failed - validate URL format');
    }

    return insights;
  }
}
