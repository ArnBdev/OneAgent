"use strict";
/**
 * Gemini Embeddings Tool for OneAgent
 *
 * Provides semantic search, similarity matching, and embedding-based
 * memory enhancement for the OneAgent system using Google Gemini embeddings.
 * Updated to use UnifiedMemoryClient.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiEmbeddingsTool = void 0;
const profiler_1 = require("../performance/profiler");
/**
 * Gemini Embeddings Tool
 * Integrates Gemini embeddings with UnifiedMemoryClient for semantic operations
 */
class GeminiEmbeddingsTool {
    constructor(geminiClient, unifiedMemoryClient) {
        this.embeddingCache = new Map();
        this.geminiClient = geminiClient;
        this.unifiedMemoryClient = unifiedMemoryClient;
        console.log('🔢 GeminiEmbeddingsTool initialized with UnifiedMemoryClient');
    }
    /**
     * Perform semantic search across memories
     */
    async semanticSearch(query, searchQuery, options) {
        const startTime = Date.now();
        const operationId = `semantic-search-${Date.now()}`;
        try {
            profiler_1.globalProfiler.startOperation(operationId, 'semantic-search');
            // Step 1: Generate embedding for the query
            const queryEmbedding = await this.geminiClient.generateEmbedding(query, {
                taskType: options?.taskType || 'SEMANTIC_SIMILARITY',
                model: options?.model || 'text-embedding-004'
            });
            // Step 2: Search memories using unified memory client
            const memories = await this.unifiedMemoryClient.searchMemories(searchQuery || {
                query,
                maxResults: options?.topK || 10,
                semanticSearch: true
            });
            // Step 3: Generate embeddings for memory contents and calculate similarities
            const memoryTexts = memories.map(memory => memory.content || '');
            const memoryEmbeddings = await Promise.all(memoryTexts.map(text => this.geminiClient.generateEmbedding(text, {
                taskType: 'SEMANTIC_SIMILARITY',
                model: options?.model || 'text-embedding-004'
            })));
            const searchResults = memories.map((memory, index) => {
                const similarity = this.calculateCosineSimilarity(queryEmbedding.embedding, memoryEmbeddings[index].embedding);
                // Map MemoryEntry to MemoryResult format
                const memoryResult = {
                    id: memory.id,
                    type: memory.type === 'conversation' || memory.type === 'learning' || memory.type === 'pattern'
                        ? memory.type
                        : 'conversation', // Default fallback
                    content: memory.content,
                    agentId: memory.agentId || 'default',
                    relevanceScore: similarity,
                    timestamp: new Date(memory.timestamp),
                    metadata: memory.metadata || {},
                    summary: memory.metadata?.summary || undefined
                };
                return {
                    memory: memoryResult,
                    similarity,
                    embeddingResult: memoryEmbeddings[index]
                };
            }).filter(result => result.similarity >= (options?.similarityThreshold || 0.1))
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, options?.topK || 10);
            const analytics = {
                totalMemories: memories.length,
                searchResults: searchResults.length,
                averageSimilarity: searchResults.length > 0
                    ? searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length
                    : 0,
                topSimilarity: searchResults.length > 0 ? searchResults[0].similarity : 0,
                processingTime: Date.now() - startTime
            };
            profiler_1.globalProfiler.endOperation(operationId, true);
            return { results: searchResults, analytics };
        }
        catch (error) {
            profiler_1.globalProfiler.endOperation(operationId, false, error?.toString());
            console.error('❌ Semantic search failed:', error);
            return {
                results: [],
                analytics: {
                    totalMemories: 0,
                    searchResults: 0,
                    averageSimilarity: 0,
                    topSimilarity: 0,
                    processingTime: Date.now() - startTime
                }
            };
        }
    }
    /**
     * Enhanced memory storage with embedding generation
     */
    async storeMemoryWithEmbedding(content, agentId, userId, memoryType = 'conversation', metadata) {
        const operationId = `store-memory-${Date.now()}`;
        try {
            profiler_1.globalProfiler.startOperation(operationId, 'store-memory-embedding');
            // Generate embedding
            const embedding = await this.geminiClient.generateEmbedding(content, {
                taskType: 'SEMANTIC_SIMILARITY',
                model: 'text-embedding-004'
            });
            let memoryId;
            const timestamp = new Date();
            // Store based on memory type
            switch (memoryType) {
                case 'conversation':
                    memoryId = await this.unifiedMemoryClient.storeConversation({
                        id: '', // Will be generated by the server
                        agentId,
                        userId,
                        timestamp,
                        content,
                        context: { timestamp, sessionId: metadata?.sessionId || 'default' },
                        outcome: { success: true, value: content, confidence: 0.9 },
                        ...(metadata && { metadata })
                    });
                    break;
                case 'learning':
                    memoryId = await this.unifiedMemoryClient.storeLearning({
                        id: '', // Will be generated by the server
                        agentId,
                        learningType: 'pattern',
                        content,
                        confidence: 0.8,
                        applicationCount: 0,
                        lastApplied: timestamp,
                        sourceConversations: [],
                        ...(metadata && { metadata })
                    });
                    break;
                default:
                    throw new Error(`Unsupported memory type: ${memoryType}`);
            }
            profiler_1.globalProfiler.endOperation(operationId, true);
            return { memoryId, embedding };
        }
        catch (error) {
            profiler_1.globalProfiler.endOperation(operationId, false, error?.toString());
            console.error('❌ Memory storage with embedding failed:', error);
            throw error;
        }
    }
    /**
     * Calculate cosine similarity between two embeddings
     */
    calculateCosineSimilarity(embedding1, embedding2) {
        if (embedding1.length !== embedding2.length) {
            throw new Error('Embeddings must have the same length');
        }
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
    /**
     * Get similar memories using embeddings
     */
    async findSimilarMemories(queryText, searchQuery, options) {
        return this.semanticSearch(queryText, searchQuery, options);
    }
    /**
     * Clear embedding cache
     */
    clearCache() {
        this.embeddingCache.clear();
        console.log('🧹 Embedding cache cleared');
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.embeddingCache.size,
            keys: Array.from(this.embeddingCache.keys())
        };
    }
}
exports.GeminiEmbeddingsTool = GeminiEmbeddingsTool;
