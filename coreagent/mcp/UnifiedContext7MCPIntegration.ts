/**
 * Enhanced Context7 MCP Integration with Unified Memory
 * 
 * Integrates with the unified memory system to:
 * - Store documentation query patterns and results
 * - Enable cross-agent learning from documentation access
 * - Share documentation intelligence between agents
 * - Build institutional knowledge about useful documentation patterns
 * 
 * @version 2.0.0 - Unified Memory Integration
 * @created June 13, 2025
 */

import { LocalMCPAdapter, MCPServerConfig } from './adapter';
import { UnifiedMemoryClient } from '../memory/UnifiedMemoryClient';
import { 
  ConversationMemory, 
  LearningMemory, 
  PatternMemory,
  LearningType,
  PatternType,
  PatternCondition
} from '../memory/UnifiedMemoryInterface';

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
  userId?: string;
  sessionId?: string;
}

export interface DocumentationResult {
  source: string;
  title: string;
  content: string;
  url?: string;
  relevanceScore: number;
  cached: boolean;
  memoryEnhanced?: boolean;
  metadata?: Record<string, any>;
}

export interface CacheMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  memoryHits: number;
  averageResponseTime: number;
  lastCacheCleanup: Date;
}

export interface DocumentationPattern {
  queryPattern: string;
  commonSources: string[];
  successfulResults: number;
  userSatisfaction: number;
  lastUsed: Date;
}

/**
 * Enhanced Context7 MCP Integration with Unified Memory
 */
export class UnifiedContext7MCPIntegration {
  private mcpAdapter: LocalMCPAdapter;
  private unifiedMemoryClient: UnifiedMemoryClient;
  private documentationCache: Map<string, DocumentationResult[]> = new Map();
  private sourceConfigs: Map<string, DocumentationSource> = new Map();
  private cacheMetrics: CacheMetrics;
  private agentId: string;

  constructor(agentId: string = 'context7-integration') {
    const mcpConfig: MCPServerConfig = {
      name: 'context7-docs',
      type: 'local',
      port: 3002
    };
    
    this.mcpAdapter = new LocalMCPAdapter(mcpConfig);
    this.unifiedMemoryClient = new UnifiedMemoryClient();
    this.agentId = agentId;
    
    this.cacheMetrics = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryHits: 0,
      averageResponseTime: 0,
      lastCacheCleanup: new Date()
    };

    this.initializeDocumentationSources();
  }

  /**
   * Initialize documentation sources with unified memory integration
   */
  private async initializeDocumentationSources(): Promise<void> {
    const sources: DocumentationSource[] = [
      { name: 'react', type: 'framework', endpoint: 'https://react.dev', version: '18.x' },
      { name: 'typescript', type: 'language', endpoint: 'https://www.typescriptlang.org/docs', version: '5.x' },
      { name: 'nodejs', type: 'api', endpoint: 'https://nodejs.org/docs/latest/api', version: '20.x' },
      { name: 'express', type: 'framework', endpoint: 'https://expressjs.com/en/api.html', version: '4.x' },
      { name: 'vscode-api', type: 'api', endpoint: 'https://code.visualstudio.com/api/references/vscode-api', version: 'latest' },
      { name: 'jest', type: 'framework', endpoint: 'https://jestjs.io/docs/api', version: '29.x' },
      { name: 'webpack', type: 'framework', endpoint: 'https://webpack.js.org/api', version: '5.x' },
      { name: 'vite', type: 'framework', endpoint: 'https://vitejs.dev/guide/api.html', version: '5.x' },
      { name: 'nestjs', type: 'framework', endpoint: 'https://docs.nestjs.com', version: '10.x' },
      { name: 'prisma', type: 'framework', endpoint: 'https://www.prisma.io/docs/reference', version: '5.x' }
    ];

    for (const source of sources) {
      this.sourceConfigs.set(source.name, source);
    }

    // Store source configuration in unified memory for cross-agent access
    try {
      await this.storeSourceConfiguration(sources);
    } catch (error) {
      console.warn(`⚠️ Failed to store source configuration in unified memory: ${error}`);
    }
  }

  /**
   * Enhanced documentation query with unified memory integration
   */
  async queryDocumentation(query: DocumentationQuery): Promise<DocumentationResult[]> {
    const startTime = Date.now();
    this.cacheMetrics.totalQueries++;

    try {
      // Step 1: Check unified memory for similar queries and patterns
      const memoryResults = await this.searchDocumentationMemory(query);
      
      // Step 2: Check local cache
      const cacheKey = this.generateCacheKey(query);
      const cachedResults = this.documentationCache.get(cacheKey);
      
      if (cachedResults) {
        this.cacheMetrics.cacheHits++;
        // Enhance cached results with memory insights
        const enhancedResults = await this.enhanceResultsWithMemory(cachedResults, memoryResults);
        this.updateMetrics(Date.now() - startTime);
        return enhancedResults.map(result => ({ ...result, cached: true }));
      }

      this.cacheMetrics.cacheMisses++;
      
      // Step 3: Query external sources with memory-informed prioritization
      const externalResults = await this.queryExternalSourcesWithMemory(query, memoryResults);
      
      // Step 4: Store the interaction in unified memory for learning
      await this.storeDocumentationInteraction(query, externalResults);
      
      // Step 5: Extract and store patterns for future optimization
      await this.extractAndStoreDocumentationPatterns(query, externalResults);
      
      this.documentationCache.set(cacheKey, externalResults);
      this.updateMetrics(Date.now() - startTime);
      
      return externalResults;
    } catch (error) {
      console.error('[UnifiedContext7MCP] Documentation query failed:', error);
      return this.getFallbackDocumentation(query);
    }
  }

  /**
   * Search unified memory for relevant documentation patterns and results
   */  private async searchDocumentationMemory(query: DocumentationQuery): Promise<any[]> {
    try {
      const searchQuery = `documentation query: ${query.query} source: ${query.source}`;      const searchResult = await this.unifiedMemoryClient.getMemoryContext(
        searchQuery,
        this.agentId,
        5
      );
      
      // Handle both possible result formats
      const memories = (searchResult as any).results || (searchResult as any).entries || [];
      this.cacheMetrics.memoryHits += memories.length > 0 ? 1 : 0;
      
      return memories.map((memory: any) => ({
        content: memory.content,
        relevanceScore: memory.relevanceScore || 0.8,
        type: memory.type,
        agentId: memory.agentId,
        timestamp: memory.timestamp
      }));
    } catch (error) {
      console.warn(`⚠️ Memory search failed: ${error}`);
      return [];
    }
  }

  /**
   * Query external sources with memory-informed prioritization
   */  private async queryExternalSourcesWithMemory(
    query: DocumentationQuery, 
    memoryResults: any[]
  ): Promise<DocumentationResult[]> {
    // Use memory insights to prioritize sources
    const prioritizedSources = this.prioritizeSourcesWithMemory(query, memoryResults);
    const results: DocumentationResult[] = [];
    
    // Query prioritized sources
    for (const sourceName of prioritizedSources) {
      if (results.length >= (query.maxResults || 10)) break;
      
      try {
        const sourceResults = await this.querySpecificSource(sourceName, query);
        results.push(...sourceResults);
      } catch (error) {
        console.warn(`⚠️ Failed to query source ${sourceName}: ${error}`);
      }
    }    // If no external results, use enhanced fallback documentation
    if (results.length === 0) {
      console.log('📚 Using fallback documentation due to external source failure');
      return await this.getFallbackDocumentation(query);
    }

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, query.maxResults || 10);
  }

  /**
   * Prioritize documentation sources based on memory patterns
   */
  private prioritizeSourcesWithMemory(query: DocumentationQuery, memoryResults: any[]): string[] {
    const sourcePriority = new Map<string, number>();
    
    // Default priority
    Array.from(this.sourceConfigs.keys()).forEach(source => {
      sourcePriority.set(source, 0.5);
    });

    // Boost priority based on memory patterns
    for (const memory of memoryResults) {
      if (memory.type === 'pattern' && memory.content.includes('source:')) {
        const sourceMatch = memory.content.match(/source:\s*([\\w-]+)/);
        if (sourceMatch) {
          const source = sourceMatch[1];
          const currentPriority = sourcePriority.get(source) || 0;
          sourcePriority.set(source, currentPriority + memory.relevanceScore * 0.3);
        }
      }
    }

    // Handle specific source requests
    if (query.source && this.sourceConfigs.has(query.source)) {
      sourcePriority.set(query.source, 1.0);
    }

    // Sort by priority
    return Array.from(sourcePriority.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([source]) => source);
  }

  /**
   * Store documentation interaction in unified memory
   */
  private async storeDocumentationInteraction(
    query: DocumentationQuery,
    results: DocumentationResult[]
  ): Promise<void> {
    try {
      const conversationMemory: ConversationMemory = {
        id: `doc-query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agentId: this.agentId,
        userId: query.userId || 'system',
        timestamp: new Date(),
        content: `Documentation Query: ${query.query}\\n\\nSource: ${query.source}\\n\\nResults: ${results.length} documents found\\n\\nTop Result: ${results[0]?.title || 'None'}`,
        context: {
          user: { 
            id: query.userId || 'system', 
            name: 'Documentation User',
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          },
          sessionId: query.sessionId || 'doc-session',
          conversationHistory: []
        },
        outcome: {
          success: results.length > 0,
          confidence: results.length > 0 ? 0.9 : 0.3,
          responseTime: 0,
          actionsPerformed: ['documentation_search']
        },        metadata: {
          category: 'documentation_query',
          querySource: query.source,
          resultsCount: results.length,
          topRelevanceScore: results[0]?.relevanceScore || 0,
          queryPattern: this.extractQueryPattern(query.query)
        }
      };

      await this.unifiedMemoryClient.createMemory(
        JSON.stringify(conversationMemory),
        this.agentId,
        'session'
      );
    } catch (error) {
      console.warn(`⚠️ Failed to store documentation interaction: ${error}`);
    }
  }

  /**
   * Extract and store documentation patterns for optimization
   */
  private async extractAndStoreDocumentationPatterns(
    query: DocumentationQuery,
    results: DocumentationResult[]
  ): Promise<void> {
    try {
      // Extract query pattern
      const queryPattern = this.extractQueryPattern(query.query);
      const successfulSources = results.filter(r => r.relevanceScore > 0.7).map(r => r.source);
      
      if (successfulSources.length > 0) {        const patternMemory: PatternMemory = {
          id: `doc-pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          agentId: this.agentId,
          patternType: 'documentation_query' as PatternType,
          description: `Documentation pattern: ${queryPattern} -> successful sources: ${successfulSources.join(', ')}`,
          frequency: 1,
          strength: results.length > 0 ? 0.8 : 0.3,
          conditions: [            {
              type: 'query_pattern',
              operator: 'contains',
              value: queryPattern
            },
            {
              type: 'source',
              operator: 'contains',
              value: successfulSources.join(',')
            }
          ],          outcomes: [
            {
              type: 'successful_documentation_search',
              confidence: results.length > 0 ? 
                results.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / results.length : 0,
              impact: `Found ${results.length} relevant results`,
              measuredEffect: results.length
            }
          ],
          metadata: {
            queryType: this.categorizeQueryType(query.query),
            averageRelevance: results.length > 0 ? 
              results.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / results.length : 0,
            sourceSuccess: successfulSources.join(','),
            extractedAt: new Date().toISOString()
          }
        };

        await this.unifiedMemoryClient.createMemory(
          JSON.stringify(patternMemory),
          this.agentId,
          'long_term'
        );
      }
      
      // Extract learning if high-quality results
      if (results.length > 0 && results[0].relevanceScore > 0.8) {
        await this.extractDocumentationLearning(query, results);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to extract documentation patterns: ${error}`);
    }
  }

  /**
   * Extract learning from high-quality documentation results
   */
  private async extractDocumentationLearning(
    query: DocumentationQuery,
    results: DocumentationResult[]
  ): Promise<void> {
    try {
      const learningMemory: LearningMemory = {
        id: `doc-learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agentId: this.agentId,
        learningType: 'documentation_context' as LearningType,
        content: `High-quality documentation found for "${query.query}" in source "${query.source}". Best result: "${results[0].title}" with relevance ${results[0].relevanceScore.toFixed(2)}. This pattern indicates ${query.source} is effective for ${this.categorizeQueryType(query.query)} queries.`,
        confidence: results[0].relevanceScore,
        applicationCount: 1,
        lastApplied: new Date(),
        sourceConversations: [],
        metadata: {
          queryType: this.categorizeQueryType(query.query),
          bestSource: results[0].source,
          bestTitle: results[0].title,
          relevanceScore: results[0].relevanceScore,
          applicableTo: 'cross_agent_documentation'
        }
      };

      await this.unifiedMemoryClient.createMemory(
        JSON.stringify(learningMemory),
        this.agentId,
        'long_term'
      );
    } catch (error) {
      console.warn(`⚠️ Failed to extract documentation learning: ${error}`);
    }
  }

  /**
   * Extract query pattern for learning and optimization
   */
  private extractQueryPattern(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('how to') || lowerQuery.includes('how do')) {
      return 'how_to_question';
    }
    if (lowerQuery.includes('what is') || lowerQuery.includes('what are')) {
      return 'definition_question';
    }
    if (lowerQuery.includes('api') || lowerQuery.includes('method') || lowerQuery.includes('function')) {
      return 'api_reference';
    }
    if (lowerQuery.includes('example') || lowerQuery.includes('sample')) {
      return 'example_request';
    }
    if (lowerQuery.includes('error') || lowerQuery.includes('debug') || lowerQuery.includes('fix')) {
      return 'troubleshooting';
    }
    if (lowerQuery.includes('best practice') || lowerQuery.includes('recommend')) {
      return 'best_practices';
    }
    
    return 'general_query';
  }

  /**
   * Categorize query type for learning
   */
  private categorizeQueryType(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('typescript') || lowerQuery.includes('type')) {
      return 'typescript';
    }
    if (lowerQuery.includes('react') || lowerQuery.includes('component') || lowerQuery.includes('jsx')) {
      return 'react';
    }
    if (lowerQuery.includes('api') || lowerQuery.includes('endpoint') || lowerQuery.includes('request')) {
      return 'api';
    }
    if (lowerQuery.includes('test') || lowerQuery.includes('jest') || lowerQuery.includes('spec')) {
      return 'testing';
    }
    if (lowerQuery.includes('build') || lowerQuery.includes('webpack') || lowerQuery.includes('vite')) {
      return 'build_tools';
    }
    
    return 'general';
  }

  // ...existing code for querySpecificSource, enhanceResultsWithMemory, etc.
  
  /**
   * Query a specific documentation source via MCP
   */
  private async querySpecificSource(sourceName: string, query: DocumentationQuery): Promise<DocumentationResult[]> {
    const source = this.sourceConfigs.get(sourceName);
    if (!source) {
      return [];
    }

    try {
      await this.checkRateLimit(sourceName);

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
          title: item.title || item.name || 'Documentation',
          content: item.content || item.description || '',
          url: item.url || source.endpoint,
          relevanceScore: item.relevance || 0.7,
          cached: false,
          memoryEnhanced: true
        }));
      }
    } catch (error) {
      console.warn(`[UnifiedContext7MCP] Failed to query ${sourceName}:`, error);
    }

    return [];
  }

  /**
   * Store source configuration in unified memory for cross-agent access
   */
  private async storeSourceConfiguration(sources: DocumentationSource[]): Promise<void> {
    try {
      const configMemory: ConversationMemory = {
        id: `context7-config-${Date.now()}`,
        agentId: this.agentId,
        userId: 'system',
        timestamp: new Date(),
        content: `Context7 Documentation Sources Configuration: ${sources.map(s => `${s.name} (${s.type})`).join(', ')}`,
        context: {
          user: { 
            id: 'system', 
            name: 'System Configuration',
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          },
          sessionId: 'config-session',
          conversationHistory: []
        },
        outcome: {
          success: true,
          confidence: 1.0,
          responseTime: 0,
          actionsPerformed: ['configuration_update']
        },
        metadata: {
          category: 'context7_configuration',
          sourceCount: sources.length,
          sources: sources.map(s => s.name).join(','),
          configVersion: '2.0.0'
        }
      };

      await this.unifiedMemoryClient.createMemory(
        JSON.stringify(configMemory),
        this.agentId,
        'workflow'
      );
    } catch (error) {
      console.warn(`⚠️ Failed to store source configuration: ${error}`);
    }
  }

  // Helper methods
  private generateCacheKey(query: DocumentationQuery): string {
    return `${query.source}-${query.query}-${query.maxResults || 10}`;
  }
  private async checkRateLimit(_sourceName: string): Promise<void> {
    // Simple rate limiting implementation
    // In production, this would be more sophisticated
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private enhanceResultsWithMemory(
    cachedResults: DocumentationResult[], 
    memoryResults: any[]
  ): DocumentationResult[] {
    return cachedResults.map(result => ({
      ...result,
      memoryEnhanced: memoryResults.length > 0,
      relevanceScore: memoryResults.length > 0 ? Math.min(result.relevanceScore + 0.1, 1.0) : result.relevanceScore
    }));  }

  /**
   * Primary memory-driven fallback documentation system
   * This ensures organic, system-wide learning by using unified memory as the PRIMARY source
   */
  private async getFallbackDocumentation(query: DocumentationQuery): Promise<DocumentationResult[]> {
    console.log('🧠 Using unified memory as PRIMARY documentation source');
      try {
      // Phase 1: Search for exact documentation matches in memory
      const exactSearchQuery = `documentation: ${query.query} ${query.source || ''}`;
      const exactMemoryResults = await this.unifiedMemoryClient.getMemoryContext(
        exactSearchQuery,
        'context7-integration',
        8
      );
      
      // Phase 2: Search for related patterns and learnings
      const patternSearchQuery = `${query.query} patterns examples code documentation`;
      const patternMemoryResults = await this.unifiedMemoryClient.getMemoryContext(
        patternSearchQuery,
        'context7-integration',
        5
      );
        // Combine and deduplicate results
      const exactResults = (exactMemoryResults as any).results || (exactMemoryResults as any).entries || [];
      const patternResults = (patternMemoryResults as any).results || (patternMemoryResults as any).entries || [];
      
      const allMemoryResults = [...exactResults, ...patternResults]
        .filter((memory, index, array) => 
          array.findIndex(m => m.id === memory.id) === index
        )
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      
      if (allMemoryResults.length > 0) {
        console.log(`📚 Found ${allMemoryResults.length} relevant documentation patterns in unified memory`);
        
        // Convert memory results to high-quality documentation format
        const documentationResults: DocumentationResult[] = allMemoryResults.map(memory => ({
          source: `memory-${memory.agentId || 'unified'}`,
          title: this.generateMemoryDocTitle(query, memory),
          content: this.enhanceMemoryContentForDocumentation(memory.content, query),
          relevanceScore: Math.min(memory.relevanceScore || 0.8, 0.98),
          cached: false,
          memoryEnhanced: true,
          metadata: {
            memoryId: memory.id,
            memoryType: memory.type,
            agentSource: memory.agentId,
            originalTimestamp: memory.timestamp
          }
        }));

        // Store this successful memory retrieval as a strong learning pattern
        await this.storeSuccessfulMemoryRetrieval(query, documentationResults);
        
        return documentationResults.slice(0, query.maxResults || 3);
      }
    } catch (error) {
      console.warn(`⚠️ Unified memory search failed: ${error}`);
    }

    // Phase 3: If no memory results, create comprehensive learning pattern and use minimal mock
    console.log('💡 No memory results found - creating learning pattern for future organic growth');
    await this.createComprehensiveLearningPattern(query);

    // Phase 4: Minimal mock fallback only if memory is completely empty
    console.log('⚠️ Using minimal mock fallback - priority is memory system growth');
    const minimalResults = await this.getMinimalMemoryGrowthFallback(query);
    
    // Store this fallback interaction to improve future memory searches
    await this.storeFallbackInteractionForLearning(query, minimalResults);
    
    return minimalResults;
  }
  private async storeMemoryPattern(query: DocumentationQuery, results: DocumentationResult[]): Promise<void> {
    try {
      const patternMemory: PatternMemory = {
        id: `doc-pattern-${Date.now()}`,
        agentId: this.agentId,
        patternType: 'documentation_pattern',
        description: `Successful documentation retrieval: query="${query.query}" source="${query.source || 'any'}" results=${results.length} relevance=${results[0]?.relevanceScore || 0}`,
        frequency: 1,
        strength: Math.min(results[0]?.relevanceScore || 0.5, 0.95),
        conditions: [
          {
            type: 'query_type',
            value: 'documentation',
            operator: 'equals'
          },
          {
            type: 'source',
            value: query.source || 'any',
            operator: 'equals'
          }
        ],
        outcomes: [
          {
            type: 'retrieval_success',
            confidence: Math.min(results[0]?.relevanceScore || 0.5, 0.95),
            impact: 'positive',
            measuredEffect: results.length
          }
        ],        metadata: {
          queryType: 'documentation',
          source: query.source,
          resultCount: results.length,
          maxRelevance: Math.max(...results.map(r => r.relevanceScore))
        }
      };      await this.unifiedMemoryClient.createMemory(
        JSON.stringify(patternMemory),
        this.agentId,
        'long_term'
      );
    } catch (error) {
      console.warn(`⚠️ Failed to store memory pattern: ${error}`);
    }
  }

  private async createDocumentationLearningPattern(query: DocumentationQuery): Promise<void> {
    try {
      const learningMemory: LearningMemory = {
        id: `doc-learning-${Date.now()}`,
        agentId: this.agentId,
        learningType: 'documentation_context',
        content: `Documentation gap identified: "${query.query}" for source "${query.source || 'unspecified'}". This represents a learning opportunity for external source integration.`,
        confidence: 0.7,
        applicationCount: 0,
        lastApplied: new Date(),
        sourceConversations: [],        metadata: {
          queryType: 'documentation-gap',
          source: query.source,
          query: query.query,
          timestamp: new Date().toISOString()
        }
      };

      await this.unifiedMemoryClient.createMemory(
        JSON.stringify(learningMemory),
        this.agentId,
        'long_term'
      );
      console.log('📝 Stored documentation gap as learning pattern for future improvement');
    } catch (error) {
      console.warn(`⚠️ Failed to store learning pattern: ${error}`);
    }
  }

  private getBasicMockDocumentation(query: DocumentationQuery): DocumentationResult[] {
    // Basic mock documentation as final fallback
    const mockResults: DocumentationResult[] = [];
    
    if (query.query.toLowerCase().includes('react') || query.source === 'react') {
      mockResults.push({
        source: 'react',
        title: 'React Hooks Documentation',
        content: `React Hooks allow you to use state and other React features without writing a class. The useState Hook lets you add React state to function components. Example: const [count, setCount] = useState(0);`,
        relevanceScore: 0.9,
        cached: false,
        memoryEnhanced: false
      });
    }

    if (query.query.toLowerCase().includes('typescript') || query.source === 'typescript') {
      mockResults.push({
        source: 'typescript',
        title: 'TypeScript with React',
        content: `TypeScript provides static type checking for React components. Use interfaces to define props: interface Props { name: string; } Use typed hooks: const [state, setState] = useState<string>('');`,
        relevanceScore: 0.85,
        cached: false,
        memoryEnhanced: false
      });
    }

    if (query.query.toLowerCase().includes('hooks') || query.query.toLowerCase().includes('useeffect')) {
      mockResults.push({
        source: 'react',
        title: 'useEffect Hook Documentation',
        content: `The useEffect Hook lets you perform side effects in function components. Use cleanup functions to prevent memory leaks: useEffect(() => { const subscription = subscribeToSomething(); return () => subscription.unsubscribe(); }, []);`,
        relevanceScore: 0.92,
        cached: false,
        memoryEnhanced: false
      });
    }

    if (mockResults.length === 0) {
      mockResults.push({
        source: query.source || 'fallback',
        title: 'Documentation Query',
        content: `Search for: ${query.query}. No external documentation available at this time, but this query has been recorded for future learning.`,
        relevanceScore: 0.3,
        cached: false,
        memoryEnhanced: false
      });
    }

    return mockResults.slice(0, query.maxResults || 3);
  }

  private updateMetrics(responseTime: number): void {
    const totalTime = this.cacheMetrics.averageResponseTime * (this.cacheMetrics.totalQueries - 1) + responseTime;
    this.cacheMetrics.averageResponseTime = totalTime / this.cacheMetrics.totalQueries;
  }

  /**
   * Get cache and memory metrics
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.cacheMetrics };
  }

  /**
   * Get available documentation sources
   */
  getAvailableSources(): DocumentationSource[] {
    return Array.from(this.sourceConfigs.values());
  }

  /**
   * Generate meaningful documentation title from memory content
   */
  private generateMemoryDocTitle(query: DocumentationQuery, memory: any): string {
    const queryWords = query.query.toLowerCase().split(' ').filter(w => w.length > 2);
    const contentPreview = memory.content.substring(0, 100).toLowerCase();
    
    // Look for technical terms or patterns
    const techTerms = ['react', 'typescript', 'node', 'api', 'hook', 'component', 'function', 'async', 'promise'];
    const foundTerms = techTerms.filter(term => 
      queryWords.includes(term) || contentPreview.includes(term)
    );
    
    if (foundTerms.length > 0) {
      return `${foundTerms[0].toUpperCase()} Documentation: ${query.query}`;
    }
    
    return `Memory Documentation: ${query.query} (Source: ${memory.agentId || 'unified'})`;
  }

  /**
   * Enhance memory content for documentation presentation
   */
  private enhanceMemoryContentForDocumentation(content: string, query: DocumentationQuery): string {
    // Add context header
    let enhanced = `📚 From Unified Memory System:\n\n`;
    
    // Ensure the content is documentation-friendly
    if (content.length < 50) {
      enhanced += `${content}\n\n`;
      enhanced += `💡 Additional Context: This documentation was organically learned from agent interactions related to "${query.query}".`;
    } else {
      enhanced += content;
      
      // Add learning context footer
      enhanced += `\n\n🧠 This documentation represents organic learning from cross-agent interactions in the unified memory system.`;
    }
    
    return enhanced;
  }

  /**
   * Store successful memory retrieval as a learning pattern for optimization
   */
  private async storeSuccessfulMemoryRetrieval(
    query: DocumentationQuery, 
    results: DocumentationResult[]
  ): Promise<void> {
    try {
      const patternMemory: PatternMemory = {
        id: `memory-success-${Date.now()}`,
        agentId: this.agentId,
        patternType: 'documentation_pattern',
        description: `Successful memory-based documentation retrieval: query="${query.query}" source="${query.source || 'any'}" results=${results.length} avgRelevance=${(results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length).toFixed(2)}`,
        frequency: 1,
        strength: Math.min(results[0]?.relevanceScore || 0.8, 0.98),
        conditions: [
          {
            type: 'query_pattern',
            value: query.query.toLowerCase(),
            operator: 'contains'
          },
          {
            type: 'source_context',
            value: query.source || 'any',
            operator: 'equals'
          },
          {
            type: 'memory_availability',
            value: 'true',
            operator: 'equals'
          }
        ],
        outcomes: [
          {
            type: 'memory_retrieval_success',
            confidence: Math.min(results[0]?.relevanceScore || 0.8, 0.98),
            impact: 'positive',
            measuredEffect: results.length
          }
        ],
        metadata: {
          queryType: 'memory-documentation',
          source: query.source,
          resultCount: results.length,
          maxRelevance: Math.max(...results.map(r => r.relevanceScore)),
          memorySystemUsed: true,
          organicLearning: true
        }      };

      await this.unifiedMemoryClient.createMemory(
        JSON.stringify(patternMemory),
        this.agentId,
        'long_term'
      );
      console.log('✅ Stored successful memory retrieval pattern for optimization');
    } catch (error) {
      console.warn(`⚠️ Failed to store memory success pattern: ${error}`);
    }
  }

  /**
   * Create comprehensive learning pattern for memory system growth
   */
  private async createComprehensiveLearningPattern(query: DocumentationQuery): Promise<void> {
    try {
      const learningMemory: LearningMemory = {
        id: `memory-growth-${Date.now()}`,
        agentId: this.agentId,
        learningType: 'documentation_context',
        content: `MEMORY GROWTH OPPORTUNITY: Query "${query.query}" for source "${query.source || 'unspecified'}" found no matches in unified memory. This represents a high-priority learning opportunity. Future agent interactions related to this topic should be prioritized for memory storage and cross-agent sharing.`,
        confidence: 0.85,
        applicationCount: 0,
        lastApplied: new Date(),
        sourceConversations: [],
        metadata: {
          queryType: 'memory-gap-analysis',
          source: query.source,
          query: query.query,
          priority: 'high',
          timestamp: new Date().toISOString(),
          systemLearning: true,
          organicGrowthTarget: true
        }
      };      await this.unifiedMemoryClient.createMemory(
        JSON.stringify(learningMemory),
        this.agentId,
        'long_term'
      );
      console.log('📝 Stored comprehensive learning pattern for memory system growth');
    } catch (error) {
      console.warn(`⚠️ Failed to store comprehensive learning pattern: ${error}`);
    }
  }

  /**
   * Minimal fallback focused on memory system growth rather than mock data
   */
  private async getMinimalMemoryGrowthFallback(query: DocumentationQuery): Promise<DocumentationResult[]> {
    return [{
      source: 'unified-memory-system',
      title: `Learning Opportunity: ${query.query}`,
      content: `🧠 Unified Memory System Response:

No documentation found in memory for "${query.query}" ${query.source ? `(source: ${query.source})` : ''}.

This query has been recorded as a learning opportunity. Future agent interactions related to this topic will be automatically captured and shared across the system for organic documentation growth.

💡 To improve documentation coverage:
1. This query is now prioritized for memory capture
2. Related agent interactions will be automatically stored
3. Cross-agent learning patterns will be enhanced
4. Future queries will have better memory-based results

The unified memory system is designed to grow organically through real agent interactions rather than relying on static mock data.`,
      relevanceScore: 0.4,
      cached: false,
      memoryEnhanced: true,
      metadata: {
        learningOpportunity: true,
        systemGrowth: true,
        organicLearning: true
      }
    }];
  }

  /**
   * Store fallback interaction to improve future memory searches
   */
  private async storeFallbackInteractionForLearning(
    query: DocumentationQuery, 
    results: DocumentationResult[]
  ): Promise<void> {
    try {
      const conversationMemory: ConversationMemory = {
        id: `fallback-learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agentId: this.agentId,
        userId: query.userId || 'system',
        timestamp: new Date(),
        content: `FALLBACK DOCUMENTATION INTERACTION: Query "${query.query}" resulted in memory system fallback. This interaction is being stored to improve future organic learning and cross-agent documentation sharing.

Query Details:
- Search: ${query.query}
- Source: ${query.source || 'unspecified'}
- Results: ${results.length} fallback items
- System Learning: ENABLED

This pattern will help the unified memory system identify common documentation gaps and prioritize relevant content for future storage.`,
        context: {
          user: { 
            id: query.userId || 'system', 
            name: 'Documentation System',
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          },
          sessionId: query.sessionId || 'fallback-session',
          conversationHistory: []
        },
        outcome: {
          success: false, // Mark as unsuccessful to prioritize improvement
          confidence: 0.4,
          responseTime: 0,
          actionsPerformed: ['fallback_documentation', 'learning_opportunity_creation']
        },
        metadata: {
          interactionType: 'fallback-learning',
          documentationType: 'memory-growth',
          systemImprovement: true,
          organicLearning: true,
          priority: 'memory-enhancement'
        }
      };      await this.unifiedMemoryClient.createMemory(
        JSON.stringify(conversationMemory),
        this.agentId,
        'long_term'
      );
      console.log('📊 Stored fallback interaction for memory system improvement');
    } catch (error) {
      console.warn(`⚠️ Failed to store fallback learning interaction: ${error}`);
    }
  }
}
