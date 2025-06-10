/**
 * Context7 MCP Integration for DevAgent
 * 
 * Provides external documentation access through MCP protocol
 * for accelerated development assistance.
 */

import { LocalMCPAdapter, MCPServerConfig } from './adapter';

export interface DocumentationSource {
  name: string;
  type: 'library' | 'framework' | 'api' | 'language';
  endpoint?: string;
  version?: string;
  lastUpdated?: Date;
}

export interface DocumentationQuery {
  source: string;
  query: string;
  context?: string;
  maxResults?: number;
}

export interface DocumentationResult {
  source: string;
  title: string;
  content: string;
  url?: string;
  relevanceScore: number;
  cached: boolean;
}

export interface CacheMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  lastCacheCleanup: Date;
}

/**
 * Context7 MCP Documentation Integration
 */
export class Context7MCPIntegration {
  private mcpAdapter: LocalMCPAdapter;
  private documentationCache: Map<string, DocumentationResult[]> = new Map();
  private sourceConfigs: Map<string, DocumentationSource> = new Map();
  private cacheMetrics: CacheMetrics;

  constructor() {
    const mcpConfig: MCPServerConfig = {
      name: 'context7-docs',
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

    this.initializeDocumentationSources();
  }

  async queryDocumentation(query: DocumentationQuery): Promise<DocumentationResult[]> {
    const startTime = Date.now();
    this.cacheMetrics.totalQueries++;

    try {
      const cacheKey = this.generateCacheKey(query);
      const cachedResults = this.documentationCache.get(cacheKey);
      
      if (cachedResults) {
        this.cacheMetrics.cacheHits++;
        this.updateMetrics(Date.now() - startTime);
        return cachedResults.map(result => ({ ...result, cached: true }));
      }

      this.cacheMetrics.cacheMisses++;
      const results = await this.queryExternalSources(query);
      this.documentationCache.set(cacheKey, results);
      this.updateMetrics(Date.now() - startTime);
      
      return results;
    } catch (error) {
      console.error('[Context7MCP] Documentation query failed:', error);
      return this.getFallbackDocumentation(query);
    }
  }
  private async queryExternalSources(query: DocumentationQuery): Promise<DocumentationResult[]> {
    const results: DocumentationResult[] = [];
    
    // Query specific source if provided
    if (query.source && this.sourceConfigs.has(query.source)) {
      const sourceResults = await this.querySpecificSource(query.source, query);
      results.push(...sourceResults);
    } else {
      // Query multiple sources in parallel
      const sourcePromises = Array.from(this.sourceConfigs.keys()).map(
        sourceName => this.querySpecificSource(sourceName, query)
      );
      
      const allResults = await Promise.allSettled(sourcePromises);
      
      for (const result of allResults) {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
        }
      }
    }

    // Sort by relevance and limit results
    const sortedResults = results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, query.maxResults || 10);

    // If no external results, fall back to local patterns
    return sortedResults.length > 0 ? sortedResults : this.getFallbackDocumentation(query);
  }

  /**
   * Query a specific documentation source via MCP
   */
  private async querySpecificSource(sourceName: string, query: DocumentationQuery): Promise<DocumentationResult[]> {
    const source = this.sourceConfigs.get(sourceName);
    if (!source) {
      return [];
    }

    try {
      // Add rate limiting check
      await this.checkRateLimit(sourceName);

      // Make MCP call to external documentation service
      const mcpResponse = await this.mcpAdapter.sendRequest('query_documentation', {
        source: sourceName,
        query: query.query,
        context: query.context,
        maxResults: query.maxResults || 5,
        endpoint: source.endpoint,
        version: source.version
      });

      if (mcpResponse.result && mcpResponse.result.items) {
        return mcpResponse.result.items.map((item: any) => ({
          source: sourceName,
          title: item.title || 'Documentation Entry',
          content: this.extractRelevantContent(item.content || '', query.query),
          url: item.url || source.endpoint,
          relevanceScore: this.calculateRelevanceScore(item, query.query),
          cached: false
        }));
      }

      return [];
    } catch (error) {
      console.warn(`[Context7MCP] Failed to query ${sourceName}:`, error);
      return [];
    }
  }

  /**
   * Extract most relevant content section from documentation
   */
  private extractRelevantContent(fullContent: string, searchQuery: string): string {
    const maxLength = 500;
    const queryWords = searchQuery.toLowerCase().split(' ');
    
    // Find paragraph containing most query words
    const paragraphs = fullContent.split('\n\n');
    let bestParagraph = '';
    let bestScore = 0;

    for (const paragraph of paragraphs) {
      const lowerParagraph = paragraph.toLowerCase();
      const score = queryWords.reduce((acc, word) => {
        return acc + (lowerParagraph.includes(word) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestParagraph = paragraph;
      }
    }

    // Truncate if too long
    if (bestParagraph.length > maxLength) {
      return bestParagraph.substring(0, maxLength) + '...';
    }

    return bestParagraph || fullContent.substring(0, maxLength);
  }

  /**
   * Calculate relevance score for documentation result
   */
  private calculateRelevanceScore(item: any, searchQuery: string): number {
    const queryWords = searchQuery.toLowerCase().split(' ');
    const title = (item.title || '').toLowerCase();
    const content = (item.content || '').toLowerCase();
    
    let score = 0;

    // Title matches are highly relevant
    for (const word of queryWords) {
      if (title.includes(word)) {
        score += 0.3;
      }
      if (content.includes(word)) {
        score += 0.1;
      }
    }

    // Boost score based on item metadata
    if (item.type === 'api') score += 0.1;
    if (item.type === 'example') score += 0.2;
    if (item.tags && item.tags.includes('popular')) score += 0.1;

    return Math.min(score, 1.0);
  }

  private getFallbackDocumentation(query: DocumentationQuery): DocumentationResult[] {
    const enhancedPatterns = [
      {
        keywords: ['react', 'component', 'jsx', 'hook'],
        title: 'React Component Pattern',
        content: 'React functional components with hooks for state management. Use useState for local state, useEffect for side effects, and useContext for shared state.',
        relevanceScore: 0.8
      },
      {
        keywords: ['typescript', 'interface', 'type', 'generic'],
        title: 'TypeScript Type Definition',
        content: 'TypeScript interfaces define object shapes. Use generics for reusable types, union types for multiple possibilities, and utility types for transformations.',
        relevanceScore: 0.8
      },
      {
        keywords: ['express', 'api', 'route', 'middleware'],
        title: 'Express.js API Route Pattern',
        content: 'Express routes handle HTTP requests. Use middleware for authentication, validation, and logging. Define routes with app.get/post/put/delete methods.',
        relevanceScore: 0.7
      },
      {
        keywords: ['nodejs', 'module', 'async', 'promise'],
        title: 'Node.js Module Pattern',
        content: 'Node.js modules export functionality using module.exports or ES6 export. Use async/await for asynchronous operations and proper error handling.',
        relevanceScore: 0.7
      },
      {
        keywords: ['vscode', 'extension', 'api', 'command'],
        title: 'VS Code Extension Development',
        content: 'VS Code extensions use activation events, commands, and contribution points. Register commands in package.json and implement in extension.ts.',
        relevanceScore: 0.8
      },
      {
        keywords: ['jest', 'test', 'mock', 'expect'],
        title: 'Jest Testing Pattern',
        content: 'Jest provides testing framework with describe/it blocks, expect assertions, and mocking capabilities. Use beforeEach for setup and afterEach for cleanup.',
        relevanceScore: 0.7
      },
      {
        keywords: ['webpack', 'build', 'bundle', 'config'],
        title: 'Webpack Configuration',
        content: 'Webpack bundles modules with entry points, loaders for file transformation, and plugins for optimization. Configure output, devServer, and optimization.',
        relevanceScore: 0.6
      },
      {
        keywords: ['vite', 'build', 'dev', 'hmr'],
        title: 'Vite Development Setup',
        content: 'Vite provides fast development with hot module replacement. Configure with vite.config.ts for plugins, build options, and dev server settings.',
        relevanceScore: 0.7
      },
      {
        keywords: ['nestjs', 'decorator', 'service', 'controller'],
        title: 'NestJS Architecture Pattern',
        content: 'NestJS uses decorators for dependency injection. Controllers handle routes, Services contain business logic, and Modules organize features.',
        relevanceScore: 0.7
      },
      {
        keywords: ['prisma', 'database', 'orm', 'schema'],
        title: 'Prisma ORM Pattern',
        content: 'Prisma provides type-safe database access. Define schema.prisma with models, generate client, and use CRUD operations with full type safety.',
        relevanceScore: 0.7
      }
    ];

    const queryLower = query.query.toLowerCase();
    const matchingPatterns = enhancedPatterns.filter(pattern =>
      pattern.keywords.some(keyword => queryLower.includes(keyword))
    );

    // If no specific matches, return general development patterns
    if (matchingPatterns.length === 0) {
      return [
        {
          source: 'fallback',
          title: 'General Development Pattern',
          content: 'Focus on clean code principles: single responsibility, proper error handling, comprehensive testing, and clear documentation.',
          relevanceScore: 0.5,
          cached: false
        }
      ];
    }

    return matchingPatterns.map(pattern => ({
      source: 'fallback',
      title: pattern.title,
      content: pattern.content,
      relevanceScore: pattern.relevanceScore,
      cached: false
    }));
  }
  private initializeDocumentationSources(): void {
    // Popular JavaScript/TypeScript libraries and frameworks
    this.sourceConfigs.set('react', {
      name: 'React Documentation',
      type: 'framework',
      endpoint: 'https://react.dev',
      version: '18.x',
      lastUpdated: new Date('2024-12-01')
    });

    this.sourceConfigs.set('typescript', {
      name: 'TypeScript Documentation',
      type: 'language',
      endpoint: 'https://www.typescriptlang.org/docs',
      version: '5.x',
      lastUpdated: new Date('2024-11-15')
    });

    this.sourceConfigs.set('nodejs', {
      name: 'Node.js Documentation',
      type: 'framework',
      endpoint: 'https://nodejs.org/docs/latest/api',
      version: '20.x',
      lastUpdated: new Date('2024-12-01')
    });

    this.sourceConfigs.set('express', {
      name: 'Express.js Documentation',
      type: 'framework',
      endpoint: 'https://expressjs.com/en/api.html',
      version: '4.x',
      lastUpdated: new Date('2024-10-20')
    });

    this.sourceConfigs.set('vscode-api', {
      name: 'VS Code Extension API',
      type: 'api',
      endpoint: 'https://code.visualstudio.com/api/references/vscode-api',
      version: 'latest',
      lastUpdated: new Date('2024-12-01')
    });

    this.sourceConfigs.set('jest', {
      name: 'Jest Testing Framework',
      type: 'framework',
      endpoint: 'https://jestjs.io/docs/api',
      version: '29.x',
      lastUpdated: new Date('2024-09-15')
    });

    this.sourceConfigs.set('webpack', {
      name: 'Webpack Documentation',
      type: 'framework',
      endpoint: 'https://webpack.js.org/api',
      version: '5.x',
      lastUpdated: new Date('2024-11-01')
    });

    this.sourceConfigs.set('vite', {
      name: 'Vite Build Tool',
      type: 'framework',
      endpoint: 'https://vitejs.dev/guide/api.html',
      version: '5.x',
      lastUpdated: new Date('2024-11-30')
    });

    this.sourceConfigs.set('nestjs', {
      name: 'NestJS Framework',
      type: 'framework',
      endpoint: 'https://docs.nestjs.com',
      version: '10.x',
      lastUpdated: new Date('2024-10-15')
    });

    this.sourceConfigs.set('prisma', {
      name: 'Prisma ORM',
      type: 'library',
      endpoint: 'https://www.prisma.io/docs/reference',
      version: '5.x',
      lastUpdated: new Date('2024-11-20')
    });
  }

  private generateCacheKey(query: DocumentationQuery): string {
    return `${query.source || 'all'}_${query.query}_${query.context || ''}`.toLowerCase();
  }

  private updateMetrics(responseTime: number): void {
    const totalQueries = this.cacheMetrics.totalQueries;
    const currentAverage = this.cacheMetrics.averageResponseTime;
    
    this.cacheMetrics.averageResponseTime = 
      ((currentAverage * (totalQueries - 1)) + responseTime) / totalQueries;
  }

  /**
   * Add rate limiting to prevent overwhelming external documentation services
   */
  private rateLimitMap: Map<string, number> = new Map();
  private readonly RATE_LIMIT_MS = 1000; // 1 second between requests per source

  private async checkRateLimit(sourceName: string): Promise<boolean> {
    const lastRequest = this.rateLimitMap.get(sourceName) || 0;
    const now = Date.now();
    
    if (now - lastRequest < this.RATE_LIMIT_MS) {
      // Rate limited, wait
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_MS - (now - lastRequest)));
    }
    
    this.rateLimitMap.set(sourceName, Date.now());
    return true;
  }

  /**
   * Clear old cache entries to prevent memory bloat
   */
  private async cleanupCache(): Promise<void> {
    const maxCacheAge = 3600000; // 1 hour
    const now = Date.now();
    
    for (const [key, results] of this.documentationCache.entries()) {
      // Check if any result is older than max age (simplified check)
      const shouldCleanup = results.some(result => 
        result.cached && (now - this.cacheMetrics.lastCacheCleanup.getTime()) > maxCacheAge
      );
      
      if (shouldCleanup) {
        this.documentationCache.delete(key);
      }
    }
    
    this.cacheMetrics.lastCacheCleanup = new Date();
    console.log(`[Context7MCP] Cache cleanup completed. Entries remaining: ${this.documentationCache.size}`);
  }

  /**
   * Add new documentation source dynamically
   */
  addDocumentationSource(name: string, source: DocumentationSource): void {
    this.sourceConfigs.set(name, source);
    console.log(`[Context7MCP] Added documentation source: ${name} (${source.type})`);
  }

  /**
   * Remove documentation source
   */
  removeDocumentationSource(name: string): boolean {
    const removed = this.sourceConfigs.delete(name);
    if (removed) {
      console.log(`[Context7MCP] Removed documentation source: ${name}`);
    }
    return removed;
  }

  /**
   * Get detailed source information
   */
  getSourceInfo(sourceName: string): DocumentationSource | undefined {
    return this.sourceConfigs.get(sourceName);
  }

  /**
   * Update source configuration
   */
  updateSourceConfig(sourceName: string, updates: Partial<DocumentationSource>): boolean {
    const existing = this.sourceConfigs.get(sourceName);
    if (!existing) {
      return false;
    }

    const updated = { ...existing, ...updates, lastUpdated: new Date() };
    this.sourceConfigs.set(sourceName, updated);
    console.log(`[Context7MCP] Updated documentation source: ${sourceName}`);
    return true;
  }

  /**
   * Force refresh of specific source cache
   */
  async refreshSourceCache(sourceName: string): Promise<void> {
    // Clear cache entries for this source
    for (const [key, results] of this.documentationCache.entries()) {
      const filteredResults = results.filter(result => result.source !== sourceName);
      if (filteredResults.length !== results.length) {
        if (filteredResults.length === 0) {
          this.documentationCache.delete(key);
        } else {
          this.documentationCache.set(key, filteredResults);
        }
      }
    }
    
    console.log(`[Context7MCP] Refreshed cache for source: ${sourceName}`);
  }

  /**
   * Get usage statistics for monitoring
   */
  getUsageStatistics(): {
    totalQueries: number;
    cacheEfficiency: number;
    popularSources: Array<{source: string; queries: number}>;
    averageResponseTime: number;
    uptime: number;
  } {
    // Simplified statistics - in real implementation would track per-source usage
    return {
      totalQueries: this.cacheMetrics.totalQueries,
      cacheEfficiency: this.getCacheHitRatio(),
      popularSources: [
        { source: 'react', queries: Math.floor(this.cacheMetrics.totalQueries * 0.3) },
        { source: 'typescript', queries: Math.floor(this.cacheMetrics.totalQueries * 0.25) },
        { source: 'nodejs', queries: Math.floor(this.cacheMetrics.totalQueries * 0.2) }
      ],
      averageResponseTime: this.cacheMetrics.averageResponseTime,
      uptime: Date.now() - this.cacheMetrics.lastCacheCleanup.getTime()
    };
  }

  getCacheMetrics(): CacheMetrics {
    return { ...this.cacheMetrics };
  }

  getCacheHitRatio(): number {
    if (this.cacheMetrics.totalQueries === 0) return 0;
    return this.cacheMetrics.cacheHits / this.cacheMetrics.totalQueries;
  }

  getAvailableSources(): DocumentationSource[] {
    return Array.from(this.sourceConfigs.values());
  }

  getPerformanceStatus(): {
    cacheHitRatio: number;
    averageResponseTime: number;
    meetsTargets: {
      cache1ms: boolean;
      cache50ms: boolean;
      cache200ms: boolean;
    };
  } {
    const cacheHitRatio = this.getCacheHitRatio();
    const avgTime = this.cacheMetrics.averageResponseTime;

    return {
      cacheHitRatio,
      averageResponseTime: avgTime,
      meetsTargets: {
        cache1ms: cacheHitRatio > 0.8 && avgTime < 1,
        cache50ms: cacheHitRatio > 0.6 && avgTime < 50,
        cache200ms: avgTime < 200
      }
    };
  }
}
