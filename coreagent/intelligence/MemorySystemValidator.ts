/**
 * MemorySystemValidator - Reality Detection for Memory Systems
 * 
 * Prevents mock memory from masquerading as real Gemini-based memory.
 * Provides transparent, accurate system status for TriageAgent integration.
 */

import { IIntelligenceProvider } from '../interfaces/IIntelligenceProvider';

export interface MemorySystemType {
  type: 'Gemini-ChromaDB' | 'Mem0-Local' | 'MockMemory' | 'Unknown';
  isReal: boolean;
  hasPersistence: boolean;
  hasEmbeddings: boolean;
  capabilities: string[];
}

export interface MemoryValidationResult {
  systemType: MemorySystemType;
  connectionStatus: 'connected' | 'degraded' | 'disconnected' | 'mock_fallback';
  dataQuality: 'real' | 'mock' | 'mixed' | 'unknown';
  userImpact: string;
  recommendations: string[];
  transparency: {
    isDeceptive: boolean;
    actualCapabilities: string[];
    reportedCapabilities: string[];
  };
}

export interface MemoryTestResponse {
  isTest: boolean;
  source: 'gemini' | 'mem0' | 'mock' | 'unknown';
  metadata?: Record<string, any>;
}

export class MemorySystemValidator implements IIntelligenceProvider {
  private lastValidation: MemoryValidationResult | null = null;
  private validationCache: Map<string, MemoryValidationResult> = new Map();

  constructor() {
    console.log('🔍 MemorySystemValidator initialized - Reality detection active');
  }  /**
   * Comprehensive memory system validation with deception detection
   */  async validateMemorySystem(endpoint = 'http://127.0.0.1:8000'): Promise<MemoryValidationResult> {
    const cacheKey = `${endpoint}_${Date.now().toString().slice(-6)}`;
    
    try {
      // Step 1: Test basic connectivity
      const connectionTest = await this.testConnection(endpoint);
      
      // Step 2: Identify actual system type
      const systemType = await this.identifySystemType(endpoint);
      
      // Step 3: Test data integrity and persistence
      const dataQuality = await this.testDataQuality(endpoint);
      
      // Step 4: Detect deceptive reporting
      const transparencyCheck = await this.checkTransparency(systemType, dataQuality);
      
      const result: MemoryValidationResult = {
        systemType,
        connectionStatus: connectionTest.status,
        dataQuality: dataQuality.quality,
        userImpact: this.calculateUserImpact(systemType, dataQuality),
        recommendations: this.generateRecommendations(systemType, connectionTest),
        transparency: transparencyCheck
      };

      this.lastValidation = result;
      this.validationCache.set(cacheKey, result);
      
      // Log critical findings
      if (transparencyCheck.isDeceptive) {
        console.warn('🚨 DECEPTIVE MEMORY REPORTING DETECTED');
        console.warn(`📊 Reported: ${transparencyCheck.reportedCapabilities.join(', ')}`);
        console.warn(`🔍 Actual: ${transparencyCheck.actualCapabilities.join(', ')}`);
      }

      return result;
      
    } catch (error) {
      console.error('❌ Memory system validation failed:', error);
      
      return {
        systemType: {
          type: 'Unknown',
          isReal: false,
          hasPersistence: false,
          hasEmbeddings: false,
          capabilities: []
        },
        connectionStatus: 'disconnected',
        dataQuality: 'unknown',
        userImpact: 'Memory system unavailable - no persistence or intelligent search',
        recommendations: ['Check memory server status', 'Restart memory service', 'Verify configuration'],
        transparency: {
          isDeceptive: false,
          actualCapabilities: [],
          reportedCapabilities: []
        }
      };
    }
  }

  /**
   * Test memory system connection
   */
  private async testConnection(endpoint: string): Promise<{
    status: 'connected' | 'degraded' | 'disconnected' | 'mock_fallback';
    responseTime: number;
    serverInfo?: any;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${endpoint}/health`);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return { status: 'degraded', responseTime };
      }
        const serverInfo = await response.json();
      
      // Check if this is mock server (only based on explicit indicators, not response time)
      if (serverInfo.service?.includes('mem0-test-server') || 
          serverInfo.message?.includes('mock')) {
        return { status: 'mock_fallback', responseTime, serverInfo };
      }
      
      return { status: 'connected', responseTime, serverInfo };
      
    } catch (error) {
      return { status: 'disconnected', responseTime: Date.now() - startTime };
    }
  }

  /**
   * Identify the actual memory system type
   */  private async identifySystemType(endpoint: string): Promise<MemorySystemType> {
    try {
      console.log(`🔍 Identifying memory system type for endpoint: ${endpoint}`);
      
      // Test for Gemini-ChromaDB system
      console.log(`🔍 Testing Gemini features...`);
      const geminiTest = await this.testGeminiFeatures(endpoint);
      console.log(`🔍 Gemini test result: isGemini=${geminiTest.isGemini}, features=${geminiTest.features.join(', ')}`);
      
      if (geminiTest.isGemini) {
        console.log(`✅ Detected Gemini-ChromaDB system`);
        return {
          type: 'Gemini-ChromaDB',
          isReal: true,
          hasPersistence: true,
          hasEmbeddings: true,
          capabilities: ['semantic_search', 'vector_storage', 'persistence', 'embeddings']
        };
      }

      // Test for basic Mem0
      console.log(`🔍 Testing Mem0 features...`);
      const mem0Test = await this.testMem0Features(endpoint);
      console.log(`🔍 Mem0 test result: isMem0=${mem0Test.isMem0}, features=${mem0Test.features.join(', ')}`);
      
      if (mem0Test.isMem0) {
        console.log(`✅ Detected Mem0-Local system`);
        return {
          type: 'Mem0-Local',
          isReal: true,
          hasPersistence: true,
          hasEmbeddings: false,
          capabilities: ['basic_storage', 'text_search', 'persistence']
        };
      }

      // Check for mock system
      console.log(`🔍 Testing mock features...`);
      const mockTest = await this.testMockFeatures(endpoint);
      console.log(`🔍 Mock test result: isMock=${mockTest.isMock}, indicators=${mockTest.indicators.join(', ')}`);
      
      if (mockTest.isMock) {
        console.log(`⚠️ Detected MockMemory system`);
        return {
          type: 'MockMemory',
          isReal: false,
          hasPersistence: false,
          hasEmbeddings: false,
          capabilities: ['temporary_storage', 'session_only']
        };
      }

      console.log(`❓ Unable to identify system type - defaulting to Unknown`);
      return {
        type: 'Unknown',
        isReal: false,
        hasPersistence: false,
        hasEmbeddings: false,
        capabilities: []
      };

    } catch (error) {
      console.error('❌ System type identification failed:', error);
      return {
        type: 'Unknown',
        isReal: false,
        hasPersistence: false,
        hasEmbeddings: false,
        capabilities: []
      };
    }
  }
  /**
   * Test for Gemini-specific features
   */  private async testGeminiFeatures(endpoint: string): Promise<{ isGemini: boolean; features: string[] }> {
    try {
      // Look for Gemini-specific endpoints and responses with broader searches
      let searchData: any = null;
      
      // Try multiple search queries to find Gemini memories
      const searchQueries = ['embedding', 'semantic', 'search', 'test', 'memory'];
      
      for (const query of searchQueries) {
        const testSearch = await fetch(`${endpoint}/v1/memories?query=${query}&limit=10`, {
          method: 'GET'
        });

        if (testSearch.ok) {
          searchData = await testSearch.json();
          if (searchData.success && searchData.data && searchData.data.length > 0) {
            break; // Found memories, use this result
          }
        }
      }

      if (!searchData || !searchData.success) return { isGemini: false, features: [] };

      // Check for Gemini-specific response structure
      let hasEmbeddings = searchData.embeddings || searchData.vector_dimensions;
      let hasSemanticSearch = searchData.semantic_results || searchData.similarity_scores;
      
      // Enhanced Gemini detection: Check memory metadata for embedding models
      let hasGeminiMetadata = searchData.model === 'text-embedding-004' || 
                             searchData.provider === 'Gemini';
      
      // Check individual memories for Gemini embedding model indicators
      if (!hasGeminiMetadata && searchData.success && searchData.data && Array.isArray(searchData.data)) {
        for (const memory of searchData.data) {
          if (memory.metadata?.embedding_model?.includes('gemini-text-embedding-004') ||
              memory.metadata?.embedding_model?.includes('text-embedding-004')) {
            hasGeminiMetadata = true;
            hasEmbeddings = true; // Gemini embeddings confirmed
            hasSemanticSearch = true; // Semantic search capability confirmed
            console.log(`🔍 Gemini metadata detected in memory ${memory.id}: ${memory.metadata.embedding_model}`);
            break;
          }
        }
      }

      const features = [];
      if (hasEmbeddings) features.push('embeddings');
      if (hasSemanticSearch) features.push('semantic_search');
      if (hasGeminiMetadata) features.push('gemini_provider');

      return {
        isGemini: hasGeminiMetadata || (hasEmbeddings && hasSemanticSearch),
        features
      };    } catch (error) {
      console.error('❌ testGeminiFeatures failed:', error);
      return { isGemini: false, features: [] };
    }
  }
  /**
   * Test for basic Mem0 features
   */  private async testMem0Features(endpoint: string): Promise<{ isMem0: boolean; features: string[] }> {
    try {
      console.log(`🔍 Testing Mem0 features for endpoint: ${endpoint}`);
      
      const testResponse = await fetch(`${endpoint}/v1/memories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Memory system validation test',
          metadata: { test: true, timestamp: Date.now() },
          user_id: 'system_test'
        })
      });

      console.log(`🔍 Mem0 test response status: ${testResponse.status}, ok: ${testResponse.ok}`);

      if (!testResponse.ok) {
        console.log(`❌ Mem0 test failed - response not ok`);
        return { isMem0: false, features: [] };
      }

      const responseData = await testResponse.json();
      console.log(`🔍 Mem0 response data:`, JSON.stringify(responseData, null, 2));
      
      // Check response structure for Mem0 patterns
      const hasPersistence = responseData.success && responseData.data?.id;
      const hasMetadata = responseData.data?.metadata !== undefined;
      
      console.log(`🔍 Mem0 analysis: hasPersistence=${hasPersistence}, hasMetadata=${hasMetadata}`);

      const isMem0 = hasPersistence; // Simplified detection - if it can store and retrieve with success=true, it's Mem0
      console.log(`🔍 Mem0 detection result: isMem0=${isMem0}`);

      return {
        isMem0,
        features: hasPersistence ? ['persistence', 'basic_storage'] : []
      };    } catch (error) {
      console.error('❌ testMem0Features failed:', error);
      return { isMem0: false, features: [] };
    }
  }

  /**
   * Test for mock system indicators
   */
  private async testMockFeatures(endpoint: string): Promise<{ isMock: boolean; indicators: string[] }> {
    try {
      const indicators = [];

      // Test 1: Check server info
      const healthResponse = await fetch(`${endpoint}/health`);
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        if (health.service?.includes('mem0-test-server') || 
            health.title?.includes('Test')) {
          indicators.push('test_server_identifier');
        }
      }      // Test 2: Check for suspiciously fast responses (adjust threshold for local servers)
      const startTime = Date.now();
      await fetch(`${endpoint}/health`);
      const responseTime = Date.now() - startTime;
      
      if (responseTime < 2) { // Only flag extremely fast responses (under 2ms)
        indicators.push('suspiciously_fast_response');
      }      // Test 3: Check for in-memory storage patterns
      const testAdd = await fetch(`${endpoint}/v1/memories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Mock detection test',
          user_id: 'mock_test'
        })
      });

      if (testAdd.ok) {
        const addData = await testAdd.json();
        if (addData.data?.id?.startsWith('mem_') && addData.data.id.length < 10) {
          indicators.push('simple_id_pattern');
        }
      }

      return {
        isMock: indicators.length >= 2,
        indicators
      };

    } catch (error) {
      return { isMock: false, indicators: [] };
    }
  }

  /**
   * Test data quality and persistence
   */
  private async testDataQuality(endpoint: string): Promise<{
    quality: 'real' | 'mock' | 'mixed' | 'unknown';
    persistence: boolean;
    testResults: any;
  }> {
    const testId = `quality_test_${Date.now()}`;
      try {
      // Add test memory using correct OneAgent endpoint
      const addResponse = await fetch(`${endpoint}/v1/memories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `Quality test memory ${testId}`,
          metadata: { test: true, validator: 'MemorySystemValidator' },
          user_id: 'system_validator'
        })
      });

      if (!addResponse.ok) {
        return { quality: 'unknown', persistence: false, testResults: null };
      }      const addData = await addResponse.json();
      
      // Search for the memory using correct OneAgent endpoint
      const searchResponse = await fetch(`${endpoint}/v1/memories?query=${encodeURIComponent(testId)}&userId=system_validator&limit=1`, {
        method: 'GET'
      });

      if (!searchResponse.ok) {
        return { quality: 'unknown', persistence: false, testResults: addData };
      }      const searchData = await searchResponse.json();
      const found = searchData.success && searchData.data?.length > 0;

      // Determine quality based on response characteristics
      let quality: 'real' | 'mock' | 'mixed' | 'unknown' = 'unknown';
      
      if (found && addData.data?.id && searchData.data[0].metadata) {
        // Check if data seems real or mock
        const hasRealTimestamp = searchData.data[0].createdAt !== "2025-01-03T12:00:00Z";
        const hasComplexId = addData.data.id.length > 10;
        const hasEmbeddings = searchData.data[0].metadata?.embedding_model || searchData.embeddings || searchData.similarities;

        if (hasRealTimestamp && hasComplexId && hasEmbeddings) {
          quality = 'real';
        } else if (!hasRealTimestamp && !hasComplexId) {
          quality = 'mock';
        } else {
          quality = 'mixed';
        }
      }

      return {
        quality,
        persistence: found,
        testResults: { add: addData, search: searchData }
      };

    } catch (error) {
      return { quality: 'unknown', persistence: false, testResults: error };
    }
  }

  /**
   * Check for deceptive reporting
   */
  private async checkTransparency(systemType: MemorySystemType, dataQuality: any): Promise<{
    isDeceptive: boolean;
    actualCapabilities: string[];
    reportedCapabilities: string[];
  }> {
    const actualCapabilities = systemType.capabilities;
    
    // These would be reported by a system claiming to be "optimal"
    const reportedCapabilities = [
      'semantic_search', 'vector_storage', 'persistence', 
      'embeddings', 'real_time_learning'
    ];

    const isDeceptive = !systemType.isReal && 
                       (dataQuality.quality === 'mock' || !dataQuality.persistence);

    return {
      isDeceptive,
      actualCapabilities,
      reportedCapabilities: isDeceptive ? reportedCapabilities : actualCapabilities
    };
  }

  /**
   * Calculate user impact
   */
  private calculateUserImpact(systemType: MemorySystemType, dataQuality: any): string {
    if (!systemType.isReal) {
      return 'Session-only memory - no persistence between sessions, no intelligent search';
    }

    if (!dataQuality.persistence) {
      return 'Memory storage failing - data may not persist';
    }

    if (!systemType.hasEmbeddings) {
      return 'Basic text storage only - no semantic search capabilities';
    }

    return 'Full memory capabilities available';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(systemType: MemorySystemType, connection: any): string[] {
    const recommendations = [];

    if (!systemType.isReal) {
      recommendations.push('Start real Gemini memory server for persistent storage');
      recommendations.push('Verify Gemini API key configuration');
      recommendations.push('Check ChromaDB installation and setup');
    }

    if (connection.status === 'mock_fallback') {
      recommendations.push('Stop mock server and start production memory system');
      recommendations.push('Verify memory server is running on correct port');
    }

    if (!systemType.hasPersistence) {
      recommendations.push('Enable persistent storage configuration');
      recommendations.push('Check database permissions and disk space');
    }

    return recommendations;
  }

  /**
   * Get last validation result
   */
  getLastValidation(): MemoryValidationResult | null {
    return this.lastValidation;
  }

  /**
   * Get validation summary for TriageAgent
   */
  getValidationSummary(): string {
    if (!this.lastValidation) {
      return 'Memory system not validated - run validation first';
    }

    const v = this.lastValidation;
    return `Memory: ${v.systemType.type} | Status: ${v.connectionStatus} | Quality: ${v.dataQuality} | Real: ${v.systemType.isReal}`;
  }
}
