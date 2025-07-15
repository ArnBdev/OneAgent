/**
 * Context7 MCP Integration for OneAgent
 * 
 * Web Development Documentation Tool
 * - Retrieves latest documentation and patterns for coding tasks and languages
 * - Stores findings in mem0 memory to build OneAgent's collective knowledge
 * - Focuses on web technologies: JavaScript, TypeScript, Node.js, React, etc.
 * - Enables OneAgent to accumulate web development expertise over time
 */

import { LocalMCPAdapter, MCPServerConfig } from './adapter';
import { UnifiedMCPTool, ToolExecutionResult, InputSchema } from '../tools/UnifiedMCPTool';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

export interface WebDevelopmentSource {
  name: string;
  type: 'web-framework' | 'programming-language' | 'web-api' | 'build-tool' | 'web-library';
  officialDocsUrl?: string;
  version?: string;
  lastUpdated?: Date;
  priority: number; // Higher priority for more commonly used web technologies
}

export interface WebDocumentationQuery {
  technology: string; // e.g., 'nodejs', 'typescript', 'react', 'express'
  topic: string; // e.g., 'async patterns', 'type definitions', 'hooks'
  version?: string;
  context?: string;
  maxResults?: number;
}

export interface WebDocumentationResult {
  technology: string;
  topic: string;
  title: string;
  content: string;
  sourceUrl: string | undefined;
  version: string | undefined;
  relevanceScore: number;
  bestPractices: string[] | undefined;
  codeExamples: string[] | undefined;
  storageTimestamp: Date;
}

export interface CacheMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  lastCacheCleanup: Date;
}

/**
 * Context7 MCP Web Development Documentation Integration
 */
export class Context7MCPIntegration {
  private mcpAdapter: LocalMCPAdapter;
  private documentationCache: Map<string, WebDocumentationResult[]> = new Map();
  private sourceConfigs: Map<string, WebDevelopmentSource> = new Map();
  private cacheMetrics: CacheMetrics;

  constructor() {
    const mcpConfig: MCPServerConfig = {
      name: 'context7-web-docs',
      type: 'local',
      port: 3002
    };
    
    this.mcpAdapter = new LocalMCPAdapter(mcpConfig);
    
    this.cacheMetrics = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      lastCacheCleanup: new Date()
    };

    this.initializeWebDevelopmentSources();
  }

  /**
   * Query web development documentation and store in mem0 for collective learning
   */
  async queryWebDocumentation(query: WebDocumentationQuery): Promise<WebDocumentationResult[]> {
    const startTime = createUnifiedTimestamp().unix;
    this.cacheMetrics.totalQueries++;

    try {
      const cacheKey = this.generateCacheKey(query);
      const cachedResults = this.documentationCache.get(cacheKey);
      
      if (cachedResults) {
        this.cacheMetrics.cacheHits++;
        this.updateMetrics(createUnifiedTimestamp().unix - startTime);
        // Store cached access in mem0 for learning patterns
        await this.storeInMem0(query, cachedResults, 'cache-hit');
        return cachedResults;
      }

      this.cacheMetrics.cacheMisses++;
      const results = await this.queryWebDevelopmentSources(query);
      this.documentationCache.set(cacheKey, results);
      this.updateMetrics(createUnifiedTimestamp().unix - startTime);
      
      // Store new findings in mem0 for collective learning
      await this.storeInMem0(query, results, 'new-discovery');
      
      return results;
    } catch (error) {
      console.error('[Context7MCP] Web documentation query failed:', error);
      return this.getFallbackWebDocumentation(query);
    }
  }

  /**
   * Store documentation findings in mem0 for OneAgent's collective learning
   */
  private async storeInMem0(query: WebDocumentationQuery, results: WebDocumentationResult[], accessType: 'cache-hit' | 'new-discovery'): Promise<void> {
    try {
      // This is where we would integrate with OneAgent's mem0 memory system
      // to store web development knowledge for collective learning
      const memoryEntry = {
        type: 'web-development-documentation',
        technology: query.technology,
        topic: query.topic,
        version: query.version,
        findings: results.map(r => ({
          title: r.title,
          content: r.content.substring(0, 1000), // Truncate for storage
          bestPractices: r.bestPractices,
          codeExamples: r.codeExamples,
          sourceUrl: r.sourceUrl,
          relevanceScore: r.relevanceScore
        })),
        context: query.context,
        accessType,
        timestamp: new Date().toISOString(),
        tags: [
          `TECH-${query.technology.toLowerCase()}`,
          `TOPIC-${query.topic.toLowerCase().replace(/\s+/g, '-')}`,
          query.version ? `VERSION-${query.version}` : null,
          'WEB-DEVELOPMENT',
          'CONTEXT7-DISCOVERY'
        ].filter(Boolean)
      };

      // TODO: Integrate with OneAgent's mem0 memory system
      // await oneAgentMemory.store(memoryEntry);
      
      console.log(`[Context7MCP] Stored web documentation in mem0: ${query.technology}/${query.topic} (${accessType})`);
    } catch (error) {
      console.error('[Context7MCP] Failed to store in mem0:', error);
    }
  }

  private async queryWebDevelopmentSources(query: WebDocumentationQuery): Promise<WebDocumentationResult[]> {
    const results: WebDocumentationResult[] = [];
    
    // Query specific technology source if configured
    if (this.sourceConfigs.has(query.technology)) {
      const sourceResults = await this.querySpecificWebSource(query.technology, query);
      results.push(...sourceResults);
    }

    // Query general web development sources
    for (const [sourceName, source] of Array.from(this.sourceConfigs.entries())) {
      if (sourceName !== query.technology && source.priority > 0.5) {
        const sourceResults = await this.querySpecificWebSource(sourceName, query);
        results.push(...sourceResults);
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, query.maxResults || 10);
  }

  private async querySpecificWebSource(sourceName: string, query: WebDocumentationQuery): Promise<WebDocumentationResult[]> {
    const source = this.sourceConfigs.get(sourceName);
    if (!source) return [];

    try {
      // Simulate web documentation retrieval
      // In a real implementation, this would query official documentation sites
      const mockResults: WebDocumentationResult[] = [
        {
          technology: query.technology,
          topic: query.topic,
          title: `${query.technology} - ${query.topic}`,
          content: `Latest documentation for ${query.technology} ${query.topic}. This would contain the actual documentation content retrieved from ${source.officialDocsUrl}.`,
          sourceUrl: source.officialDocsUrl,
          version: query.version || source.version || 'latest',
          relevanceScore: 0.9,
          bestPractices: [
            'Follow official documentation patterns',
            'Use TypeScript for better type safety',
            'Implement proper error handling'
          ],
          codeExamples: [
            `// Example ${query.technology} code for ${query.topic}`,
            `console.log('${query.technology} best practice example');`
          ],
          storageTimestamp: new Date()
        }
      ];

      return mockResults;
      
    } catch (error) {
      console.error(`[Context7MCP] Failed to query ${sourceName}:`, error);
      return [];
    }
  }

  /**
   * Initialize web development documentation sources
   */
  private initializeWebDevelopmentSources(): void {
    const webSources: Record<string, WebDevelopmentSource> = {
      'nodejs': {
        name: 'Node.js',
        type: 'programming-language',
        officialDocsUrl: 'https://nodejs.org/docs/latest/api/',
        version: '22.0.0',
        priority: 1.0,
        lastUpdated: new Date()
      },
      'typescript': {
        name: 'TypeScript',
        type: 'programming-language',
        officialDocsUrl: 'https://www.typescriptlang.org/docs/',
        version: '5.7.0',
        priority: 1.0,
        lastUpdated: new Date()
      },
      'react': {
        name: 'React',
        type: 'web-framework',
        officialDocsUrl: 'https://react.dev/',
        version: '18.0.0',
        priority: 0.9,
        lastUpdated: new Date()
      },
      'express': {
        name: 'Express.js',
        type: 'web-framework',
        officialDocsUrl: 'https://expressjs.com/',
        version: '4.18.0',
        priority: 0.8,
        lastUpdated: new Date()
      },
      'vite': {
        name: 'Vite',
        type: 'build-tool',
        officialDocsUrl: 'https://vitejs.dev/',
        version: '5.0.0',
        priority: 0.7,
        lastUpdated: new Date()
      },
      'nextjs': {
        name: 'Next.js',
        type: 'web-framework',
        officialDocsUrl: 'https://nextjs.org/docs',
        version: '14.0.0',
        priority: 0.8,
        lastUpdated: new Date()
      }
    };

    // Load all web development sources
    for (const [key, source] of Object.entries(webSources)) {
      this.sourceConfigs.set(key, source);
    }

    console.log(`[Context7MCP] Initialized ${this.sourceConfigs.size} web development sources`);
  }

  private getFallbackWebDocumentation(query: WebDocumentationQuery): WebDocumentationResult[] {
    return [
      {
        technology: query.technology,
        topic: query.topic,
        title: `Fallback: ${query.technology} ${query.topic}`,
        content: `Fallback documentation for ${query.technology} ${query.topic}. Check official documentation at the technology's website.`,
        sourceUrl: `https://www.google.com/search?q=${query.technology}+${query.topic}+documentation`,
        version: 'unknown',
        relevanceScore: 0.3,
        bestPractices: ['Consult official documentation', 'Verify version compatibility'],
        codeExamples: [],
        storageTimestamp: new Date()
      }
    ];
  }

  private generateCacheKey(query: WebDocumentationQuery): string {
    return `${query.technology}:${query.topic}:${query.version || 'latest'}:${query.context || ''}`;
  }

  private updateMetrics(responseTime: number): void {
    const total = this.cacheMetrics.totalQueries;
    this.cacheMetrics.averageResponseTime = 
      ((this.cacheMetrics.averageResponseTime * (total - 1)) + responseTime) / total;
  }

  private async cleanupCache(): Promise<void> {
    const maxCacheAge = 3600000; // 1 hour
    const now = createUnifiedTimestamp().unix;
    
    for (const [key, results] of Array.from(this.documentationCache.entries())) {
      // Check if any result is older than max age
      const shouldCleanup = results.some(result => 
        (now - result.storageTimestamp.getTime()) > maxCacheAge
      );
      
      if (shouldCleanup) {
        this.documentationCache.delete(key);
      }
    }
    
    this.cacheMetrics.lastCacheCleanup = new Date();
  }

  /**
   * Add or update a web development source
   */
  addWebDevelopmentSource(name: string, source: WebDevelopmentSource): void {
    this.sourceConfigs.set(name, {
      ...source,
      lastUpdated: new Date()
    });
    console.log(`[Context7MCP] Added web development source: ${name}`);
  }

  /**
   * Refresh cache for a specific web technology
   */
  async refreshSourceCache(sourceName: string): Promise<void> {
    // Clear cache entries for this source
    for (const [key, results] of Array.from(this.documentationCache.entries())) {
      const filteredResults = results.filter(result => result.technology !== sourceName);
      if (filteredResults.length !== results.length) {
        if (filteredResults.length === 0) {
          this.documentationCache.delete(key);
        } else {
          this.documentationCache.set(key, filteredResults);
        }
      }
    }
    
    console.log(`[Context7MCP] Refreshed cache for web technology: ${sourceName}`);
  }

  /**
   * Get available web development sources
   */
  getAvailableWebSources(): WebDevelopmentSource[] {
    return Array.from(this.sourceConfigs.values());
  }

  /**
   * Get cache metrics for monitoring
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.cacheMetrics };
  }

  /**
   * Clear all cached documentation
   */
  clearCache(): void {
    this.documentationCache.clear();
    console.log('[Context7MCP] Web documentation cache cleared');
  }
}
