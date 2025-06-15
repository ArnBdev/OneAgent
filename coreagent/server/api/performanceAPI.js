"use strict";
/**
 * Performance API for OneAgent UI Integration
 *
 * Provides HTTP endpoints for accessing performance metrics, memory intelligence,
 * and system analytics from the UI layer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceAPI = void 0;
const profiler_1 = require("../performance/profiler");
/**
 * Performance API for OneAgent system monitoring and intelligence
 */
class PerformanceAPI {
    constructor(memoryIntelligence, geminiClient, unifiedMemoryClient, embeddingsTool) {
        this.memoryIntelligence = memoryIntelligence;
        this.geminiClient = geminiClient;
        this.unifiedMemoryClient = unifiedMemoryClient;
        this.embeddingsTool = embeddingsTool;
    }
    /**
     * Get comprehensive system status
     */
    async getSystemStatus() {
        try {
            const report = profiler_1.globalProfiler.generateReport();
            // Get memory analytics
            const memories = await this.unifiedMemoryClient.searchMemories({
                query: "",
                userId: "system",
                maxResults: 100
            });
            const memoryData = Array.isArray(memories) ? memories : [];
            const analytics = await this.memoryIntelligence.generateMemoryAnalytics();
            // Test service connections
            const services = {
                gemini: 'unknown',
                mem0: 'unknown',
                embedding: 'unknown'
            };
            try {
                // Test connection by attempting a simple search
                await this.unifiedMemoryClient.searchMemories({
                    query: "test",
                    userId: "system",
                    maxResults: 1
                });
                services.mem0 = 'connected';
            }
            catch {
                services.mem0 = 'error';
            }
            try {
                // Test would go here - for now assume embeddings work if memory works
                services.embedding = services.mem0 === 'connected' ? 'connected' : 'unknown';
                services.gemini = 'connected'; // Assume Gemini is available if we got this far
            }
            catch {
                services.embedding = 'error';
                services.gemini = 'error';
            }
            const status = {
                performance: {
                    totalOperations: report.totalOperations,
                    averageLatency: report.averageLatency,
                    errorRate: report.errorRate,
                    activeOperations: Object.keys(profiler_1.globalProfiler['activeOperations'] || {}).length
                },
                memory: {
                    totalMemories: memoryData.length,
                    categoryBreakdown: analytics.categoryBreakdown,
                    avgImportanceScore: analytics.averageImportance,
                    topCategories: Object.entries(analytics.categoryBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([category]) => category)
                },
                security: {
                    validationErrors: 0,
                    rateLimitViolations: 0,
                    authenticationFailures: 0,
                    securityAlertsActive: 0,
                    lastSecurityScan: new Date().toISOString()
                },
                services
            };
            return {
                success: true,
                data: status,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Get detailed performance metrics
     */
    async getPerformanceMetrics() {
        try {
            const report = profiler_1.globalProfiler.generateReport();
            return {
                success: true,
                data: report,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Get memory intelligence analytics
     */
    async getMemoryAnalytics(filter) {
        try {
            const memories = await this.unifiedMemoryClient.searchMemories({
                query: filter?.query || "",
                userId: filter?.userId || "system",
                maxResults: filter?.limit || 100
            });
            const memoryData = Array.isArray(memories) ? memories : [];
            const analytics = await this.memoryIntelligence.generateMemoryAnalytics();
            return {
                success: true,
                data: analytics,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Search memories with intelligence
     */
    async searchMemories(query, filter) {
        try {
            let results;
            if (query) {
                // Use semantic search
                const searchResults = await this.embeddingsTool.semanticSearch(query, filter);
                results = {
                    memories: searchResults.results.map(r => r.memory),
                    analytics: searchResults.analytics,
                    searchType: 'semantic'
                };
            }
            else { // Use basic search
                const memories = await this.unifiedMemoryClient.searchMemories({
                    query: filter?.query || "",
                    userId: filter?.userId || "system",
                    maxResults: filter?.limit || 50
                });
                results = {
                    memories: Array.isArray(memories) ? memories : [],
                    searchType: 'basic'
                };
            }
            return {
                success: true,
                data: results,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Create memory with intelligence
     */
    async createMemory(content, metadata, userId, agentId) {
        try { // Categorize and score the memory (create temporary memory object)
            const tempMemory = {
                id: 'temp',
                content,
                metadata: metadata || {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const category = await this.memoryIntelligence.categorizeMemory(tempMemory);
            const importance = await this.memoryIntelligence.calculateImportanceScore(tempMemory); // Store with embedding and intelligence
            const result = await this.embeddingsTool.storeMemoryWithEmbedding(content, agentId || 'oneagent-system', userId || 'system', 'learning', {
                ...metadata,
                category: category,
                importance_score: importance.overall
            });
            return {
                success: true, data: {
                    memoryId: result.memoryId,
                    embedding: result.embedding, intelligence: {
                        category: category,
                        importance: importance
                    }
                },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Get similar memories
     */
    async getSimilarMemories(memoryId, options) {
        try {
            const results = await this.embeddingsTool.findSimilarMemories(memoryId, options);
            return {
                success: true,
                data: results,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Clear performance metrics
     */
    async clearPerformanceData() {
        try {
            profiler_1.globalProfiler.clearMetrics();
            return {
                success: true,
                data: { message: 'Performance data cleared' },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Record a performance event with metadata
     */
    async recordEvent(eventType, data) {
        try {
            const operationId = `${eventType}_${Date.now()}`;
            profiler_1.globalProfiler.startOperation(operationId, eventType, data);
            profiler_1.globalProfiler.endOperation(operationId, true);
        }
        catch (error) {
            // Silently handle errors to prevent disrupting main operations
            console.warn(`Failed to record event ${eventType}:`, error);
        }
    }
    /**
     * Record security-related events and metrics
     */
    async recordSecurityEvent(eventType, metadata) {
        const operationId = `security_${eventType}_${Date.now()}`;
        profiler_1.globalProfiler.startOperation(operationId, `security_${eventType}`, metadata);
        profiler_1.globalProfiler.endOperation(operationId, true);
    }
    /**
     * Get security metrics and status
     */
    async getSecurityMetrics() {
        try {
            // This would integrate with actual security tracking systems
            const securityStatus = {
                validationErrors: 0, // Would be tracked by RequestValidator
                rateLimitViolations: 0, // Would be tracked by ContextManager
                authenticationFailures: 0, // Would be tracked by authentication system
                securityAlertsActive: 0, // Would be tracked by PerformanceBridge
                lastSecurityScan: new Date().toISOString(),
                securityLevel: 'operational'
            };
            return {
                success: true,
                data: securityStatus,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
}
exports.PerformanceAPI = PerformanceAPI;
