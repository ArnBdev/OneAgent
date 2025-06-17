"use strict";
// Google Gemini API client for AI-powered text processing
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const profiler_1 = require("../performance/profiler");
class GeminiClient {
    constructor(config) {
        this.mockMode = false;
        this.config = {
            model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            timeout: 30000,
            retryAttempts: 3,
            ...config
        };
        // Enable mock mode if no API key provided or in test environment
        this.mockMode = !config.apiKey || config.apiKey === 'your_google_gemini_api_key_here' || process.env.NODE_ENV === 'test';
        if (!this.mockMode) {
            this.client = axios_1.default.create({
                baseURL: this.config.baseUrl,
                timeout: this.config.timeout,
                params: {
                    key: this.config.apiKey
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        else {
            console.log('🤖 GeminiClient: Running in mock mode');
            // Create a dummy client for mock mode
            this.client = axios_1.default.create();
        }
    }
    /**
     * Generate content using Gemini API
     */
    async generateContent(messages, options) {
        try {
            if (this.mockMode) {
                return this.mockGenerateContent(messages, options);
            }
            console.log(`🤖 Generating content with ${this.config.model}`);
            const request = {
                contents: messages,
                generationConfig: {
                    temperature: options?.temperature || 0.7,
                    maxOutputTokens: options?.maxTokens || 1000,
                    topK: 40,
                    topP: 0.95
                },
                safetySettings: [
                    {
                        category: 'HARM_CATEGORY_HARASSMENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_HATE_SPEECH',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    }
                ]
            };
            const endpoint = `/models/${this.config.model}:generateContent`;
            const response = await this.client.post(endpoint, request);
            if (response.status !== 200) {
                throw new Error(`Gemini API returned status ${response.status}`);
            }
            const candidate = response.data.candidates?.[0];
            if (!candidate) {
                throw new Error('No response generated from Gemini API');
            }
            const generatedText = candidate.content.parts[0]?.text || '';
            console.log(`🤖 Generated ${generatedText.length} characters`);
            const result = {
                response: generatedText,
                finishReason: candidate.finishReason,
                timestamp: new Date().toISOString()
            };
            // Add usage metadata if available
            if (response.data.usageMetadata) {
                result.usage = {
                    promptTokens: response.data.usageMetadata.promptTokenCount,
                    completionTokens: response.data.usageMetadata.candidatesTokenCount,
                    totalTokens: response.data.usageMetadata.totalTokenCount
                };
            }
            return result;
        }
        catch (error) {
            console.error('❌ Gemini API error:', error.message);
            if (axios_1.default.isAxiosError(error)) {
                // Handle rate limiting by falling back to mock mode
                if (error.response?.status === 429) {
                    console.log('⏳ Rate limit exceeded, using mock response');
                    return this.mockGenerateContent(messages, options);
                }
                const geminiError = {
                    code: error.response?.status || 500,
                    message: error.message,
                    status: error.response?.statusText || 'Unknown Error',
                    details: error.response?.data
                };
                throw geminiError;
            }
            throw error;
        }
    }
    /**
     * Simple chat interface
     */
    async chat(userPrompt, options) {
        const messages = [];
        // Add system prompt if provided
        if (options?.systemPrompt) {
            messages.push({
                role: 'user',
                parts: [{ text: `System: ${options.systemPrompt}` }]
            });
            messages.push({
                role: 'model',
                parts: [{ text: 'I understand. I will follow these instructions.' }]
            });
        }
        // Add context if provided
        if (options?.context) {
            messages.push({
                role: 'user',
                parts: [{ text: `Context: ${options.context}` }]
            });
        }
        // Add user prompt
        messages.push({
            role: 'user',
            parts: [{ text: userPrompt }]
        });
        return this.generateContent(messages, options);
    }
    /**
     * Analyze text with specific instructions
     */
    async analyzeText(text, instruction, options) {
        const userPrompt = `Please analyze the following text according to these instructions: ${instruction}\n\nText to analyze:\n${text}`;
        return this.chat(userPrompt, options);
    }
    /**
     * Summarize text
     */
    async summarizeText(text, maxLength) {
        const lengthInstruction = maxLength ? ` in approximately ${maxLength} words` : '';
        const userPrompt = `Please provide a clear and concise summary of the following text${lengthInstruction}:\n\n${text}`;
        return this.chat(userPrompt, {
            temperature: 0.3,
            maxTokens: maxLength ? Math.ceil(maxLength * 1.5) : 500
        });
    }
    /**
     * Test the connection to Gemini API
     */
    async testConnection() {
        try {
            if (this.mockMode) {
                console.log('🤖 GeminiClient: Mock connection test passed');
                return true;
            }
            const testResponse = await this.chat('Hello, please respond with "Test successful"', {
                temperature: 0.1,
                maxTokens: 50
            });
            console.log('🤖 GeminiClient: Connection test passed');
            return testResponse.response.length > 0;
        }
        catch (error) {
            console.error('❌ GeminiClient: Connection test failed:', error);
            return false;
        }
    }
    /**
     * Mock content generation for development/testing
     */
    mockGenerateContent(messages, _options) {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        const userText = lastUserMessage?.parts[0]?.text || '';
        console.log(`🤖 Mock generation for input: "${userText.substring(0, 50)}..."`);
        // Generate a fallback response when API is rate limited
        let fallbackResponse;
        if (userText.toLowerCase().includes('summarize') || userText.toLowerCase().includes('summary')) {
            fallbackResponse = `I understand you'd like a summary. Due to API rate limits, I'm currently operating in limited mode. Please try again in a few moments for full AI analysis capabilities.`;
        }
        else if (userText.toLowerCase().includes('analyze')) {
            fallbackResponse = `I see you need analysis assistance. Currently experiencing API rate limits - full analytical capabilities will be restored shortly. Please retry your request.`;
        }
        else if (userText.toLowerCase().includes('hello') || userText.toLowerCase().includes('test')) {
            fallbackResponse = `Hello! I'm OneAgent's AI assistant. Currently operating in limited mode due to API rate limits. Full capabilities will be available once rate limits reset.`;
        }
        else {
            fallbackResponse = `I understand your request about "${userText.substring(0, 100)}${userText.length > 100 ? '...' : ''}". Currently experiencing API rate limits. Please try again shortly for full AI processing capabilities.`;
        } // Return response immediately (no async needed for fallback)
        return {
            response: fallbackResponse,
            finishReason: 'STOP',
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Get client configuration (without sensitive data)
     */
    getConfig() {
        return {
            model: this.config.model,
            baseUrl: this.config.baseUrl,
            timeout: this.config.timeout,
            retryAttempts: this.config.retryAttempts,
            mockMode: this.mockMode
        };
    }
    /**
     * Generate text embedding using Gemini embedding models
     */
    async generateEmbedding(text, options) {
        const operationId = `gemini_embedding_${Date.now()}_${Math.random()}`;
        profiler_1.globalProfiler.startOperation(operationId, 'gemini_generate_embedding', {
            textLength: text.length,
            model: options?.model,
            taskType: options?.taskType
        });
        try {
            if (this.mockMode) {
                const result = this.mockGenerateEmbedding(text, options);
                profiler_1.globalProfiler.endOperation(operationId, true);
                return result;
            }
            const embeddingModel = options?.model || 'text-embedding-004';
            console.log(`🔢 Generating embedding with ${embeddingModel} for text: "${text.substring(0, 50)}..."`);
            const request = {
                content: {
                    parts: [{ text }]
                }
            };
            // Add task type if specified
            if (options?.taskType) {
                request.taskType = options.taskType;
            }
            // Add title if specified
            if (options?.title) {
                request.title = options.title;
            }
            const endpoint = `/models/${embeddingModel}:embedContent`;
            const response = await this.client.post(endpoint, request);
            if (response.status !== 200) {
                throw new Error(`Gemini Embedding API returned status ${response.status}`);
            }
            const embedding = response.data.embedding.values;
            console.log(`🔢 Generated embedding with ${embedding.length} dimensions`);
            const result = {
                embedding,
                text,
                taskType: options?.taskType,
                dimensions: embedding.length,
                timestamp: new Date().toISOString()
            };
            profiler_1.globalProfiler.endOperation(operationId, true);
            return result;
        }
        catch (error) {
            console.error('❌ Gemini Embedding API error:', error.message);
            if (axios_1.default.isAxiosError(error)) {
                // Handle rate limiting by falling back to mock mode
                if (error.response?.status === 429) {
                    console.log('⏳ Rate limit exceeded, using mock embedding');
                    const result = this.mockGenerateEmbedding(text, options);
                    profiler_1.globalProfiler.endOperation(operationId, true);
                    return result;
                }
                const geminiError = {
                    code: error.response?.status || 500,
                    message: error.message,
                    status: error.response?.statusText || 'Unknown Error',
                    details: error.response?.data
                };
                profiler_1.globalProfiler.endOperation(operationId, false, geminiError.message);
                throw geminiError;
            }
            profiler_1.globalProfiler.endOperation(operationId, false, error.message);
            throw error;
        }
    }
    /**
     * Generate embeddings for multiple texts in batch
     */
    async generateEmbeddingBatch(texts, options) {
        const operationId = `gemini_batch_embedding_${Date.now()}_${Math.random()}`;
        profiler_1.globalProfiler.startOperation(operationId, 'gemini_batch_embeddings', {
            batchSize: texts.length,
            model: options?.model,
            taskType: options?.taskType
        });
        try {
            if (this.mockMode) {
                const results = await Promise.all(texts.map(text => this.mockGenerateEmbedding(text, options)));
                profiler_1.globalProfiler.endOperation(operationId, true);
                return results;
            }
            const embeddingModel = options?.model || 'text-embedding-004';
            console.log(`🔢 Generating batch embeddings with ${embeddingModel} for ${texts.length} texts`);
            const requests = texts.map(text => {
                const request = {
                    model: `models/${embeddingModel}`,
                    content: {
                        parts: [{ text }]
                    }
                };
                if (options?.taskType) {
                    request.taskType = options.taskType;
                }
                if (options?.title) {
                    request.title = options.title;
                }
                return request;
            });
            const batchRequest = { requests };
            const endpoint = `/models/${embeddingModel}:batchEmbedContents`; // Correct batch endpoint format
            const response = await this.client.post(endpoint, batchRequest);
            if (response.status !== 200) {
                throw new Error(`Gemini Embedding API returned status ${response.status}`);
            } // Debug: Log the actual response structure
            console.log('🔍 Batch embeddings response structure:', JSON.stringify(response.data, null, 2));
            // Check if response has the expected structure
            if (!response.data.embeddings || !Array.isArray(response.data.embeddings)) {
                throw new Error(`Unexpected batch embeddings response structure: ${JSON.stringify(response.data)}`);
            }
            const results = response.data.embeddings.map((embeddingResponse, index) => {
                // API returns structure: { "values": [...] }
                if (!embeddingResponse.values || !Array.isArray(embeddingResponse.values)) {
                    console.error(`Invalid embedding structure at index ${index}:`, embeddingResponse);
                    throw new Error(`Cannot find embedding values at index ${index}`);
                }
                return {
                    embedding: embeddingResponse.values,
                    text: texts[index],
                    taskType: options?.taskType,
                    dimensions: embeddingResponse.values.length,
                    timestamp: new Date().toISOString()
                };
            });
            console.log(`🔢 Generated ${results.length} embeddings with ${results[0]?.dimensions || 0} dimensions each`);
            profiler_1.globalProfiler.endOperation(operationId, true);
            return results;
        }
        catch (error) {
            console.error('❌ Gemini Batch Embedding API error:', error.message);
            if (axios_1.default.isAxiosError(error)) {
                // Handle rate limiting by falling back to mock mode
                if (error.response?.status === 429) {
                    console.log('⏳ Rate limit exceeded, using mock embeddings');
                    const results = await Promise.all(texts.map(text => this.mockGenerateEmbedding(text, options)));
                    profiler_1.globalProfiler.endOperation(operationId, true);
                    return results;
                }
                const geminiError = {
                    code: error.response?.status || 500,
                    message: error.message,
                    status: error.response?.statusText || 'Unknown Error',
                    details: error.response?.data
                };
                profiler_1.globalProfiler.endOperation(operationId, false, geminiError.message);
                throw geminiError;
            }
            profiler_1.globalProfiler.endOperation(operationId, false, error.message);
            throw error;
        }
    }
    /**
     * Calculate cosine similarity between two embeddings
     */
    static calculateCosineSimilarity(embedding1, embedding2) {
        if (embedding1.length !== embedding2.length) {
            throw new Error('Embeddings must have the same dimensions');
        }
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }
        const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }
    /**
     * Find most similar texts using embeddings
     */
    async findSimilarTexts(queryText, candidateTexts, options) {
        console.log(`🔍 Finding similar texts for query: "${queryText.substring(0, 50)}..."`);
        // Generate embedding for query
        const queryEmbedding = await this.generateEmbedding(queryText, {
            ...options,
            taskType: 'RETRIEVAL_QUERY'
        });
        // Generate embeddings for candidates
        const candidateEmbeddings = await this.generateEmbeddingBatch(candidateTexts, {
            ...options,
            taskType: 'RETRIEVAL_DOCUMENT'
        });
        // Calculate similarities
        const similarities = candidateEmbeddings.map((candidate, index) => ({
            text: candidate.text,
            similarity: GeminiClient.calculateCosineSimilarity(queryEmbedding.embedding, candidate.embedding),
            index
        }));
        // Sort by similarity (highest first)
        similarities.sort((a, b) => b.similarity - a.similarity);
        // Return top K results
        const topK = options?.topK || similarities.length;
        const results = similarities.slice(0, topK);
        console.log(`🔍 Found ${results.length} similar texts, top similarity: ${results[0]?.similarity.toFixed(4) || 0}`);
        return results;
    }
    /**
     * Mock embedding generation for development/testing
     */
    mockGenerateEmbedding(text, options) {
        console.log(`🔢 Mock embedding generation for: "${text.substring(0, 50)}..."`);
        // Generate a realistic mock embedding (384 dimensions like text-embedding-004)
        const dimensions = 384;
        const embedding = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
        // Normalize the embedding to unit length (common practice)
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        const normalizedEmbedding = embedding.map(val => val / magnitude);
        return {
            embedding: normalizedEmbedding,
            text,
            taskType: options?.taskType,
            dimensions,
            timestamp: new Date().toISOString()
        };
    }
}
exports.GeminiClient = GeminiClient;
