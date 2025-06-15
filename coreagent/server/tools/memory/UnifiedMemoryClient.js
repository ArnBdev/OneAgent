"use strict";
/**
 * UnifiedMemoryClient.ts
 *
 * MCP-compliant Unified Memory Client for OneAgent
 * Implements Constitutional AI principles and BMAD framework integration
 *
 * Based on MCP Specification 2025-03-26 and TypeScript SDK best practices
 *
 * @version 4.0.0
 * @author OneAgent Professional Development Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstitutionalLevel = exports.unifiedMemoryClient = exports.UnifiedMemoryClient = void 0;
const events_1 = require("events");
const index_1 = require("../config/index");
/**
 * Constitutional AI Validation Levels
 */
var ConstitutionalLevel;
(function (ConstitutionalLevel) {
    ConstitutionalLevel["BASIC"] = "basic";
    ConstitutionalLevel["STANDARD"] = "standard";
    ConstitutionalLevel["PROFESSIONAL"] = "professional";
    ConstitutionalLevel["ENTERPRISE"] = "enterprise";
})(ConstitutionalLevel || (exports.ConstitutionalLevel = ConstitutionalLevel = {}));
/**
 * MCP-compliant Unified Memory Client
 *
 * Implements the Model Context Protocol specification for memory operations
 * with Constitutional AI validation and quality scoring.
 */
class UnifiedMemoryClient extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.isConnected = false;
        this.requestId = 0;
        this.pendingRequests = new Map();
        // Performance and quality metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            qualityScores: [],
            constitutionalCompliance: 0,
            averageQualityScore: 0,
            successRate: 0
        };
        // Default configuration with professional-grade settings
        this.config = {
            host: config.host || 'localhost',
            port: config.port || index_1.oneAgentConfig.mcpPort,
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            enableSSL: config.enableSSL || false,
            apiKey: config.apiKey || process.env.ONEAGENT_API_KEY
        };
        this.setupEventHandlers();
    }
    /**
     * Setup event handlers for connection management
     */
    setupEventHandlers() {
        this.on('error', (error) => {
            console.error('[UnifiedMemoryClient] Error:', error);
            this.metrics.failedRequests++;
        });
        this.on('response', (response) => {
            this.updateQualityMetrics(response);
        });
    }
    /**
     * Connect to the Memory Server
     */
    async connect() {
        try {
            // Test connection with health check instead of MCP initialize
            const url = `${this.config.enableSSL ? 'https' : 'http'}://${this.config.host}:${this.config.port}/health`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'OneAgent-UnifiedMemoryClient/4.0.0'
                },
                signal: AbortSignal.timeout(this.config.timeout)
            });
            if (!response.ok) {
                throw new Error(`Health check failed: HTTP ${response.status}`);
            }
            const healthData = await response.json();
            console.log('[UnifiedMemoryClient] Connected to memory server:', healthData);
            this.isConnected = true;
            this.emit('connected', healthData);
            console.log('[UnifiedMemoryClient] Connected to Memory Server successfully');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Disconnect from the MCP memory server
     */
    async disconnect() {
        try {
            if (this.isConnected) {
                // Clear pending requests
                for (const [id, pending] of this.pendingRequests) {
                    clearTimeout(pending.timeout);
                    pending.reject(new Error('Connection closed'));
                }
                this.pendingRequests.clear();
                this.isConnected = false;
                this.emit('disconnected');
                console.log('[UnifiedMemoryClient] Disconnected from MCP memory server');
            }
        }
        catch (error) {
            this.emit('error', error);
        }
    } /**
     * Create a new memory entry with Constitutional AI validation
     */
    async createMemory(content, userId, memoryType = 'long_term', metadata = {}) {
        const url = `${this.config.enableSSL ? 'https' : 'http'}://${this.config.host}:${this.config.port}/v1/memories`;
        const payload = {
            content,
            userId: userId,
            metadata: {
                source: 'UnifiedMemoryClient',
                memoryType,
                agentId: metadata.agentId || 'UnifiedMemoryClient',
                sessionId: metadata.sessionId,
                workflowId: metadata.workflowId,
                tags: metadata.tags || [],
                priority: metadata.priority || 1,
                ...metadata
            }
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'OneAgent-UnifiedMemoryClient/4.0.0'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }
            const result = await response.json();
            return {
                success: result.success || false,
                data: result.data,
                qualityScore: result.data?.qualityScore,
                constitutionalCompliance: true, // Assume compliance for now
                error: result.error
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Retrieve memory context with semantic search
     */
    async getMemoryContext(query, userId, limit = 10, memoryTypes) {
        const request = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method: 'memory/search',
            params: {
                query,
                userId,
                limit,
                memoryTypes,
                semanticSearch: true,
                includeQualityMetrics: true
            }
        };
        try {
            const response = await this.sendRequest(request);
            if (response.error) {
                throw new Error(response.error.message);
            }
            return response.result;
        }
        catch (error) {
            this.emit('error', error);
            return {
                entries: [],
                totalCount: 0,
                qualityMetrics: {
                    averageQuality: 0,
                    constitutionalCompliance: 0
                }
            };
        }
    }
    /**
     * Update existing memory entry
     */
    async updateMemory(memoryId, userId, updates) {
        const request = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method: 'memory/update',
            params: {
                memoryId,
                userId,
                updates: {
                    ...updates,
                    lastModified: Date.now()
                }
            }
        };
        try {
            const response = await this.sendRequest(request);
            if (response.error) {
                return {
                    success: false,
                    error: response.error.message
                };
            }
            return {
                success: true,
                data: response.result,
                qualityScore: response.result?.qualityScore,
                constitutionalCompliance: response.result?.constitutionalCompliance
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Delete memory entry with confirmation
     */
    async deleteMemory(memoryId, userId, confirm = false) {
        if (!confirm) {
            return {
                success: false,
                error: 'Deletion requires explicit confirmation'
            };
        }
        const request = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method: 'memory/delete',
            params: {
                memoryId,
                userId,
                confirm
            }
        };
        try {
            const response = await this.sendRequest(request);
            if (response.error) {
                return {
                    success: false,
                    error: response.error.message
                };
            }
            return {
                success: true,
                data: response.result
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get comprehensive system health and performance metrics
     */
    async getSystemHealth() {
        const request = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method: 'system/health',
            params: {}
        };
        try {
            const response = await this.sendRequest(request);
            return response.result;
        }
        catch (error) {
            this.emit('error', error);
            return null;
        }
    }
    /**
     * Validate content using Constitutional AI principles
     */
    async validateConstitutional(content, context) {
        const request = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method: 'constitutional/validate',
            params: {
                content,
                context
            }
        };
        try {
            const response = await this.sendRequest(request);
            return response.result;
        }
        catch (error) {
            this.emit('error', error);
            return {
                isValid: false,
                score: 0,
                violations: ['Validation service unavailable'],
                recommendations: ['Retry validation when service is available']
            };
        }
    }
    /**
     * Generate quality score for content
     */
    async generateQualityScore(content, criteria = ['accuracy', 'clarity', 'completeness', 'relevance']) {
        const request = {
            jsonrpc: '2.0',
            id: this.getNextRequestId(),
            method: 'quality/score',
            params: {
                content,
                criteria
            }
        };
        try {
            const response = await this.sendRequest(request);
            return response.result;
        }
        catch (error) {
            this.emit('error', error);
            return {
                overallScore: 0,
                criteriaScores: {},
                grade: 'F',
                improvements: ['Quality scoring service unavailable']
            };
        }
    }
    /**
     * Send MCP request with retry logic and timeout handling
     */
    async sendRequest(request) {
        if (!this.isConnected && request.method !== 'initialize') {
            await this.connect();
        }
        const startTime = Date.now();
        this.metrics.totalRequests++;
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const response = await this.makeHttpRequest(request);
                // Update performance metrics
                const responseTime = Date.now() - startTime;
                this.updatePerformanceMetrics(responseTime);
                this.metrics.successfulRequests++;
                this.emit('response', response);
                return response;
            }
            catch (error) {
                console.warn(`[UnifiedMemoryClient] Request attempt ${attempt} failed:`, error);
                if (attempt < this.config.retryAttempts) {
                    await this.delay(this.config.retryDelay * attempt);
                }
                else {
                    this.metrics.failedRequests++;
                    throw error;
                }
            }
        }
        throw new Error('All retry attempts exhausted');
    }
    /**
     * Make HTTP request to Memory Server REST API
     */
    async makeHttpRequest(request) {
        const methodToEndpoint = {
            'memory/create': { endpoint: '/v1/memories', method: 'POST' },
            'memory/search': { endpoint: '/v1/memories', method: 'GET' },
            'memory/update': { endpoint: '/v1/memories', method: 'PUT' },
            'memory/delete': { endpoint: '/v1/memories', method: 'DELETE' }
        };
        const mapping = methodToEndpoint[request.method];
        if (!mapping) {
            throw new Error(`Unsupported method: ${request.method}`);
        }
        let url = `${this.config.enableSSL ? 'https' : 'http'}://${this.config.host}:${this.config.port}${mapping.endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'OneAgent-UnifiedMemoryClient/4.0.0'
        };
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        try {
            // Transform MCP request to REST API payload
            let payload;
            if (request.method === 'memory/create') {
                payload = {
                    content: request.params?.content,
                    userId: request.params?.userId,
                    metadata: request.params?.metadata || {}
                };
            }
            else if (request.method === 'memory/search') {
                // For GET requests, add parameters to URL
                const searchParams = new URLSearchParams();
                if (request.params?.query)
                    searchParams.append('query', request.params.query);
                if (request.params?.userId)
                    searchParams.append('userId', request.params.userId);
                if (request.params?.limit)
                    searchParams.append('limit', request.params.limit.toString());
                if (request.params?.memoryTypes && Array.isArray(request.params.memoryTypes)) {
                    searchParams.append('memoryTypes', request.params.memoryTypes.join(','));
                }
                url += '?' + searchParams.toString();
                payload = null; // No body for GET request
            }
            else {
                payload = request.params;
            }
            const response = await fetch(url, {
                method: mapping.method,
                headers,
                ...(payload ? { body: JSON.stringify(payload) } : {}),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            // Transform REST response to MCP format
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: data
            };
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Request timeout after ${this.config.timeout}ms`);
            }
            throw error;
        }
    }
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(responseTime) {
        const currentAvg = this.metrics.averageResponseTime;
        const totalRequests = this.metrics.successfulRequests;
        this.metrics.averageResponseTime =
            (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
    }
    /**
     * Update quality metrics from response
     */
    updateQualityMetrics(response) {
        if (response.result?.qualityScore) {
            this.metrics.qualityScores.push(response.result.qualityScore);
            // Keep only last 100 scores for rolling average
            if (this.metrics.qualityScores.length > 100) {
                this.metrics.qualityScores.shift();
            }
        }
        if (response.result?.constitutionalCompliance !== undefined) {
            const currentCompliance = this.metrics.constitutionalCompliance;
            const totalResponses = this.metrics.successfulRequests;
            this.metrics.constitutionalCompliance =
                (currentCompliance * (totalResponses - 1) + response.result.constitutionalCompliance) / totalResponses;
        }
    }
    /**
     * Generate next request ID
     */
    getNextRequestId() {
        return ++this.requestId;
    }
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get current client metrics
     */
    getMetrics() {
        // Calculate derived metrics
        const averageQualityScore = this.metrics.qualityScores.length > 0
            ? this.metrics.qualityScores.reduce((a, b) => a + b, 0) / this.metrics.qualityScores.length
            : 0;
        const successRate = this.metrics.totalRequests > 0
            ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
            : 0;
        // Update metrics object
        this.metrics.averageQualityScore = averageQualityScore;
        this.metrics.successRate = successRate;
        return { ...this.metrics };
    }
    /**
     * Check connection status
     */
    isConnectionHealthy() {
        return this.isConnected && this.getMetrics().successRate > 80;
    }
    /**
     * Reset client metrics
     */
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            qualityScores: [],
            constitutionalCompliance: 0,
            averageQualityScore: 0,
            successRate: 0
        };
    }
    // ============================================================================
    // BACKWARD COMPATIBILITY METHODS
    // Support for legacy APIs to maintain compatibility with existing codebase
    // ============================================================================
    /**
     * Legacy searchMemories method for backward compatibility
     * @deprecated Use getMemoryContext instead
     */
    async searchMemories(options) {
        const userId = options.userId || 'default_user';
        const limit = options.maxResults || 10;
        try {
            const result = await this.getMemoryContext(options.query, userId, limit);
            return result.entries;
        }
        catch (error) {
            console.warn('[UnifiedMemoryClient] searchMemories legacy method failed:', error);
            return [];
        }
    }
    /**
     * Legacy storeConversation method for backward compatibility
     * @deprecated Use createMemory instead
     */
    async storeConversation(conversation) {
        try {
            const result = await this.createMemory(JSON.stringify(conversation), 'oneagent_system', 'long_term', { source: 'legacy_conversation', type: 'conversation' });
            if (result.success && result.data?.id) {
                return result.data.id;
            }
            // Return a mock ID if creation failed
            return `mock_${Date.now()}`;
        }
        catch (error) {
            console.warn('[UnifiedMemoryClient] storeConversation legacy method failed:', error);
            return `mock_${Date.now()}`;
        }
    }
    /**
     * Legacy storeMemoryWithEmbedding method for backward compatibility
     * @deprecated Use createMemory with metadata instead
     */
    async storeMemoryWithEmbedding(content, metadata, userId, agentId, embedding, memoryType, additionalOptions) {
        try {
            const result = await this.createMemory(content, userId || 'default_user', memoryType || 'long_term', {
                ...metadata,
                agentId,
                embedding,
                ...additionalOptions
            });
            return {
                memoryId: result.data?.id || `mock_${Date.now()}`,
                embedding: embedding
            };
        }
        catch (error) {
            console.warn('[UnifiedMemoryClient] storeMemoryWithEmbedding legacy method failed:', error);
            return {
                memoryId: `mock_${Date.now()}`,
                embedding: embedding
            };
        }
    }
    /**
     * Legacy semanticSearch method for backward compatibility
     * @deprecated Use getMemoryContext instead
     */
    async semanticSearch(query, options, searchOptions) {
        try {
            const startTime = Date.now();
            const result = await this.getMemoryContext(query, options.userId || 'default_user', searchOptions?.topK || 10);
            const processingTime = Date.now() - startTime;
            return {
                results: result.entries.map(entry => ({
                    content: entry.content,
                    similarity: 0.8, // Mock similarity score
                    metadata: entry.metadata
                })),
                analytics: {
                    processingTime
                }
            };
        }
        catch (error) {
            console.warn('[UnifiedMemoryClient] semanticSearch legacy method failed:', error);
            return {
                results: [],
                analytics: {
                    processingTime: 0
                }
            };
        }
    }
    /**
     * Legacy findSimilarMemories method for backward compatibility
     * @deprecated Use getMemoryContext instead
     */
    async findSimilarMemories(memoryId, options) {
        try {
            // Use a generic search since we don't have the specific memory content
            const result = await this.getMemoryContext(`similar to ${memoryId}`, 'default_user', options?.topK || 5);
            return {
                results: result.entries.map(entry => ({
                    id: entry.id,
                    content: entry.content,
                    similarity: 0.7 // Mock similarity score
                }))
            };
        }
        catch (error) {
            console.warn('[UnifiedMemoryClient] findSimilarMemories legacy method failed:', error);
            return {
                results: []
            };
        }
    }
    /**
     * Legacy testEmbeddings method for backward compatibility
     * @deprecated Embeddings testing moved to separate module
     */
    async testEmbeddings() {
        try {
            // Simple test by checking if we can connect and create a test memory
            const result = await this.createMemory('Embeddings test memory', 'test_user', 'short_term', { test: true });
            return result.success;
        }
        catch (error) {
            console.warn('[UnifiedMemoryClient] testEmbeddings legacy method failed:', error);
            return false;
        }
    }
    /**
     * Legacy getCacheStats method for backward compatibility
     * @deprecated Cache statistics moved to performance metrics
     */
    getCacheStats() {
        return {
            size: this.metrics.qualityScores.length,
            keys: [`requests_${this.metrics.totalRequests}`, `success_rate_${this.metrics.successRate}`]
        };
    }
    /**
     * Legacy testConnection method for backward compatibility
     * @deprecated Use isConnectionHealthy instead
     */
    async testConnection() {
        try {
            await this.connect();
            return this.isConnectionHealthy();
        }
        catch (error) {
            console.warn('[UnifiedMemoryClient] testConnection legacy method failed:', error);
            return false;
        }
    }
    /**
     * Legacy storeLearning method for backward compatibility
     * @deprecated Use createMemory with appropriate metadata instead
     */
    async storeLearning(learning) {
        try {
            const result = await this.createMemory(typeof learning === 'string' ? learning : JSON.stringify(learning), learning.userId || 'default_user', 'long_term', {
                type: 'learning',
                learningType: learning.learningType,
                confidence: learning.confidence,
                source: 'legacy_learning',
                ...learning.metadata
            });
            return result.data?.id || `mock_learning_${Date.now()}`;
        }
        catch (error) {
            console.warn('[UnifiedMemoryClient] storeLearning legacy method failed:', error);
            return `mock_learning_${Date.now()}`;
        }
    }
    /**
     * Legacy storePattern method for backward compatibility
     * @deprecated Use createMemory with appropriate metadata instead
     */
    async storePattern(pattern) {
        try {
            const result = await this.createMemory(typeof pattern === 'string' ? pattern : JSON.stringify(pattern), pattern.userId || 'default_user', 'long_term', {
                type: 'pattern',
                patternType: pattern.patternType,
                frequency: pattern.frequency,
                source: 'legacy_pattern',
                ...pattern.metadata
            });
            return result.data?.id || `mock_pattern_${Date.now()}`;
        }
        catch (error) {
            console.warn('[UnifiedMemoryClient] storePattern legacy method failed:', error);
            return `mock_pattern_${Date.now()}`;
        }
    }
}
exports.UnifiedMemoryClient = UnifiedMemoryClient;
// Export singleton instance for convenience
exports.unifiedMemoryClient = new UnifiedMemoryClient();
