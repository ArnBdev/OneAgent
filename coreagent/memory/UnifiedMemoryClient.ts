/**
 * OneAgent Unified Memory Client
 * 
 * Client implementation that connects to the unified memory server
 * and provides the UnifiedMemoryInterface functionality to all agents.
 * 
 * Features:
 * - HTTP connection to enhanced memory server
 * - Automatic retry logic with exponential backoff
 * - Constitutional AI validation integration
 * - Quality scoring for all operations
 * - Comprehensive error handling and fallback
 * 
 * @version 1.0.0
 * @created June 13, 2025
 */

import {
  UnifiedMemoryInterface,
  ConversationMemory,
  LearningMemory,
  PatternMemory,
  MemorySearchQuery,
  MemoryResult,
  EmergingPattern,
  CrossAgentLearning,
  MemoryAnalytics,
  QualityMetrics,
  MemoryConfig,
  DEFAULT_MEMORY_CONFIG,
  MemoryError,
  StorageError,
  SearchError,
  ValidationError,
  validateConversationMemory,
  validateLearningMemory,
  validatePatternMemory,
  generateMemoryId
} from './UnifiedMemoryInterface';

/**
 * HTTP client for unified memory operations
 */
export class UnifiedMemoryClient implements UnifiedMemoryInterface {
  private config: MemoryConfig;
  private baseUrl: string;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
    this.baseUrl = this.config.serverUrl;
  }

  // =====================================
  // Core Storage Operations
  // =====================================

  async storeConversation(conversation: ConversationMemory): Promise<string> {
    try {
      // Validate input
      validateConversationMemory(conversation);
      
      // Ensure ID is set
      if (!conversation.id) {
        conversation.id = generateMemoryId();
      }

      // Constitutional AI validation if enabled
      if (this.config.constitutionalValidation) {
        await this.validateWithConstitutionalAI('conversation', conversation.content);
      }

      const response = await this.makeRequest('POST', '/memory/conversations', conversation);
      
      if (!response.success) {
        throw new StorageError(`Failed to store conversation: ${response.error}`);
      }

      return response.id;
    } catch (error) {
      throw this.handleError('storeConversation', error);
    }
  }

  async storeLearning(learning: LearningMemory): Promise<string> {
    try {
      validateLearningMemory(learning);
      
      if (!learning.id) {
        learning.id = generateMemoryId();
      }

      if (this.config.constitutionalValidation) {
        await this.validateWithConstitutionalAI('learning', learning.content);
      }

      const response = await this.makeRequest('POST', '/memory/learnings', learning);
      
      if (!response.success) {
        throw new StorageError(`Failed to store learning: ${response.error}`);
      }

      return response.id;
    } catch (error) {
      throw this.handleError('storeLearning', error);
    }
  }

  async storePattern(pattern: PatternMemory): Promise<string> {
    try {
      validatePatternMemory(pattern);
      
      if (!pattern.id) {
        pattern.id = generateMemoryId();
      }

      if (this.config.constitutionalValidation) {
        await this.validateWithConstitutionalAI('pattern', pattern.description);
      }

      const response = await this.makeRequest('POST', '/memory/patterns', pattern);
      
      if (!response.success) {
        throw new StorageError(`Failed to store pattern: ${response.error}`);
      }

      return response.id;
    } catch (error) {
      throw this.handleError('storePattern', error);
    }
  }

  // =====================================
  // Search and Retrieval Operations
  // =====================================

  async searchMemories(query: MemorySearchQuery): Promise<MemoryResult[]> {
    try {
      if (!query.query || query.query.trim().length === 0) {
        throw new ValidationError('Search query cannot be empty');
      }

      const response = await this.makeRequest('POST', '/memory/search', query);
      
      if (!response.success) {
        throw new SearchError(`Search failed: ${response.error}`);
      }

      return response.results || [];
    } catch (error) {
      throw this.handleError('searchMemories', error);
    }
  }

  async findRelatedLearnings(memoryId: string, agentId?: string): Promise<LearningMemory[]> {
    try {
      if (!memoryId) {
        throw new ValidationError('Memory ID is required');
      }

      const params = new URLSearchParams({ memoryId });
      if (agentId) params.append('agentId', agentId);

      const response = await this.makeRequest('GET', `/memory/related-learnings?${params}`);
      
      if (!response.success) {
        throw new SearchError(`Failed to find related learnings: ${response.error}`);
      }

      return response.learnings || [];
    } catch (error) {
      throw this.handleError('findRelatedLearnings', error);
    }
  }

  async getAgentPatterns(agentId: string, patternType?: string): Promise<PatternMemory[]> {
    try {
      if (!agentId) {
        throw new ValidationError('Agent ID is required');
      }

      const params = new URLSearchParams({ agentId });
      if (patternType) params.append('type', patternType);

      const response = await this.makeRequest('GET', `/memory/patterns?${params}`);
      
      if (!response.success) {
        throw new SearchError(`Failed to get agent patterns: ${response.error}`);
      }

      return response.patterns || [];
    } catch (error) {
      throw this.handleError('getAgentPatterns', error);
    }
  }

  async getConversationHistory(userId: string, agentId?: string, limit: number = 50): Promise<ConversationMemory[]> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const params = new URLSearchParams({ userId, limit: limit.toString() });
      if (agentId) params.append('agentId', agentId);

      const response = await this.makeRequest('GET', `/memory/conversations?${params}`);
      
      if (!response.success) {
        throw new SearchError(`Failed to get conversation history: ${response.error}`);
      }

      return response.conversations || [];
    } catch (error) {
      throw this.handleError('getConversationHistory', error);
    }
  }

  // =====================================
  // Organic Growth Operations
  // =====================================

  async identifyEmergingPatterns(): Promise<EmergingPattern[]> {
    try {
      const response = await this.makeRequest('GET', '/memory/emerging-patterns');
      
      if (!response.success) {
        throw new SearchError(`Failed to identify emerging patterns: ${response.error}`);
      }

      return response.patterns || [];
    } catch (error) {
      throw this.handleError('identifyEmergingPatterns', error);
    }
  }

  async suggestCrossAgentLearnings(): Promise<CrossAgentLearning[]> {
    try {
      const response = await this.makeRequest('GET', '/memory/cross-agent-learnings');
      
      if (!response.success) {
        throw new SearchError(`Failed to suggest cross-agent learnings: ${response.error}`);
      }

      return response.suggestions || [];
    } catch (error) {
      throw this.handleError('suggestCrossAgentLearnings', error);
    }
  }

  async applyCrossAgentLearning(learning: CrossAgentLearning): Promise<boolean> {
    try {
      if (!learning.sourceAgent || !learning.targetAgent) {
        throw new ValidationError('Source and target agents are required');
      }

      if (this.config.constitutionalValidation) {
        await this.validateWithConstitutionalAI('cross_agent_learning', learning.content);
      }

      const response = await this.makeRequest('POST', '/memory/apply-cross-agent-learning', learning);
      
      return response.success || false;
    } catch (error) {
      throw this.handleError('applyCrossAgentLearning', error);
    }
  }

  // =====================================
  // Analytics and Insights
  // =====================================

  async getSystemAnalytics(agentId?: string): Promise<MemoryAnalytics> {
    try {
      const params = agentId ? `?agentId=${agentId}` : '';
      const response = await this.makeRequest('GET', `/memory/analytics${params}`);
      
      if (!response.success) {
        throw new SearchError(`Failed to get system analytics: ${response.error}`);
      }

      return response.analytics;
    } catch (error) {
      throw this.handleError('getSystemAnalytics', error);
    }
  }

  async getQualityMetrics(timeRange?: { start: Date; end: Date }): Promise<QualityMetrics> {
    try {
      let params = '';
      if (timeRange) {
        const searchParams = new URLSearchParams({
          start: timeRange.start.toISOString(),
          end: timeRange.end.toISOString()
        });
        params = `?${searchParams}`;
      }

      const response = await this.makeRequest('GET', `/memory/quality-metrics${params}`);
      
      if (!response.success) {
        throw new SearchError(`Failed to get quality metrics: ${response.error}`);
      }

      return response.metrics;
    } catch (error) {
      throw this.handleError('getQualityMetrics', error);
    }
  }

  // =====================================
  // Utility Methods
  // =====================================

  /**
   * Test connection to memory server
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/health');
      return response.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get server status and capabilities
   */
  async getServerStatus(): Promise<any> {
    try {
      const response = await this.makeRequest('GET', '/status');
      return response;
    } catch (error) {
      throw this.handleError('getServerStatus', error);
    }
  }

  // =====================================
  // Private Helper Methods
  // =====================================
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    let attempts = 0;
    let lastError: Error = new Error('Unknown error');

    while (attempts < this.config.maxRetries) {
      try {
        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OneAgent-UnifiedMemoryClient/1.0.0'
          }
        };        if (data && (method === 'POST' || method === 'PUT')) {
          // Convert camelCase to snake_case and dates to ISO strings for Python server compatibility
          const preprocessedData = this.preprocessForServer(data);
          const convertedData = this.toSnakeCase(preprocessedData);
          options.body = JSON.stringify(convertedData);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        options.signal = controller.signal;

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;

      } catch (error) {
        lastError = error as Error;
        attempts++;
        
        if (attempts < this.config.maxRetries) {
          // Exponential backoff
          const delay = this.config.retryDelay * Math.pow(2, attempts - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new MemoryError(
      `Request failed after ${this.config.maxRetries} attempts: ${lastError.message}`,
      'REQUEST_FAILED',
      { url, method, attempts, lastError: lastError.message }
    );
  }
  private async validateWithConstitutionalAI(type: string, content: string): Promise<void> {
    try {
      // This will integrate with the oneagent_constitutional_validate tool
      // For now, we'll add a placeholder that can be enhanced
      
      // Basic content validation
      if (content.length === 0) {
        throw new ValidationError('Content cannot be empty');
      }

      // Check for potentially harmful content
      const harmfulPatterns = [
        /password\s*[:=]\s*\S+/i,
        /api[_-]?key\s*[:=]\s*\S+/i,
        /secret\s*[:=]\s*\S+/i,
        /token\s*[:=]\s*\S+/i
      ];

      for (const pattern of harmfulPatterns) {
        if (pattern.test(content)) {
          throw new ValidationError('Content appears to contain sensitive information');
        }
      }

      // TODO: Integrate with oneagent_constitutional_validate tool
      // const validation = await oneagent_constitutional_validate({
      //   response: content,
      //   userMessage: `Store ${type} in memory`,
      //   context: { operation: 'memory_storage', type }
      // });
      
      // if (!validation.isValid) {
      //   throw new ValidationError(`Constitutional AI validation failed: ${validation.violations.join(', ')}`);
      // }

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      // Don't fail the operation if constitutional validation fails
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Constitutional AI validation failed for ${type}:`, errorMessage);
    }
  }

  /**
   * Convert camelCase object to snake_case for Python server compatibility
   */
  private toSnakeCase(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.toSnakeCase(item));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = this.toSnakeCase(value);
    }
    return result;
  }

  /**
   * Convert JavaScript dates to ISO strings for Python compatibility
   */
  private preprocessForServer(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (data instanceof Date) {
      return data.toISOString();
    }

    if (Array.isArray(data)) {
      return data.map(item => this.preprocessForServer(item));
    }

    if (typeof data === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.preprocessForServer(value);
      }
      return result;
    }

    return data;
  }

  private handleError(operation: string, error: any): MemoryError {
    if (error instanceof MemoryError) {
      return error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new MemoryError(
        `Memory server connection failed during ${operation}`,
        'CONNECTION_ERROR',
        { operation, originalError: error.message }
      );
    }

    return new MemoryError(
      `Operation ${operation} failed: ${error.message}`,
      'OPERATION_ERROR',
      { operation, originalError: error.message }
    );
  }
}

// =====================================
// Factory Function
// =====================================

/**
 * Create a new unified memory client with default configuration
 */
export function createUnifiedMemoryClient(config?: Partial<MemoryConfig>): UnifiedMemoryClient {
  return new UnifiedMemoryClient(config);
}

// =====================================
// Singleton Instance
// =====================================

let defaultInstance: UnifiedMemoryClient | null = null;

/**
 * Get the default singleton instance of the unified memory client
 */
export function getUnifiedMemoryClient(): UnifiedMemoryClient {
  if (!defaultInstance) {
    defaultInstance = new UnifiedMemoryClient();
  }
  return defaultInstance;
}

/**
 * Reset the default instance (useful for testing)
 */
export function resetUnifiedMemoryClient(): void {
  defaultInstance = null;
}
