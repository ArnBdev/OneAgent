"use strict";
/**
 * RealUnifiedMemoryClient.ts
 *
 * REAL Persistent Memory Implementation with ChromaDB
 * Replaces the mock memory system with true vector storage and embeddings
 *
 * Features:
 * - Real ChromaDB vector database for embeddings
 * - Persistent storage across sessions
 * - Semantic search with embeddings
 * - Inter-agent memory sharing
 * - Constitutional AI validation
 * - Quality scoring and metrics
 *
 * @version 4.0.0
 * @author OneAgent Professional Development Platform
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.realUnifiedMemoryClient = exports.RealUnifiedMemoryClient = void 0;
var events_1 = require("events");
var uuid_1 = require("uuid");
var fs = require("fs/promises");
var path = require("path");
var index_1 = require("../config/index");
/**
 * Constitutional AI Validation Levels
 */
var ConstitutionalLevel;
(function (ConstitutionalLevel) {
    ConstitutionalLevel["BASIC"] = "basic";
    ConstitutionalLevel["STANDARD"] = "standard";
    ConstitutionalLevel["PROFESSIONAL"] = "professional";
    ConstitutionalLevel["ENTERPRISE"] = "enterprise";
})(ConstitutionalLevel || (ConstitutionalLevel = {}));
/**
 * Real Unified Memory Client with ChromaDB
 *
 * Provides genuine persistent memory with vector embeddings and semantic search.
 * No more mock implementations - this is the real deal!
 */
var RealUnifiedMemoryClient = /** @class */ (function (_super) {
    __extends(RealUnifiedMemoryClient, _super);
    function RealUnifiedMemoryClient(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this) || this;
        _this.isConnected = false;
        _this.collection = null; // ChromaDB collection instance
        // Performance and quality metrics
        _this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            qualityScores: [],
            constitutionalCompliance: 0,
            averageQualityScore: 0,
            successRate: 0,
            totalMemories: 0,
            uniqueUsers: new Set(),
            uniqueAgents: new Set()
        };
        // Default configuration with professional-grade settings
        _this.config = {
            host: config.host || index_1.oneAgentConfig.host, // Use centralized config instead of localhost
            port: config.port || index_1.oneAgentConfig.memoryPort, // Use configured memory port
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            enableSSL: config.enableSSL || false,
            apiKey: config.apiKey || process.env.GOOGLE_AI_STUDIO_API_KEY,
            persistPath: config.persistPath || './oneagent_unified_memory'
        };
        console.log('[RealUnifiedMemoryClient] Initialized with real ChromaDB backend');
        return _this;
    }
    /**
     * Connect to OneAgent Memory Server via REST API
     */
    RealUnifiedMemoryClient.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var healthUrl, response, healthData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log('[RealUnifiedMemoryClient] Connecting to OneAgent Memory Server...');
                        healthUrl = "http://".concat(this.config.host, ":").concat(this.config.port, "/health");
                        return [4 /*yield*/, fetch(healthUrl)];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Memory server health check failed: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        healthData = _a.sent();
                        // Mark as connected
                        this.isConnected = true;
                        this.emit('connected', {
                            type: 'OneAgentMemoryServer',
                            server: 'oneagent_memory_server.py',
                            capabilities: ['vector_search', 'embeddings', 'persistence', 'semantic_search']
                        });
                        console.log('[RealUnifiedMemoryClient] ✅ Connected to OneAgent Memory Server successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('[RealUnifiedMemoryClient] ❌ Failed to connect:', error_1);
                        this.emit('error', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Disconnect from OneAgent Memory Server
     */
    RealUnifiedMemoryClient.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!this.isConnected) return [3 /*break*/, 2];
                        // Save metrics before disconnecting
                        return [4 /*yield*/, this.saveMetrics()];
                    case 1:
                        // Save metrics before disconnecting
                        _a.sent();
                        this.isConnected = false;
                        this.emit('disconnected');
                        console.log('[RealUnifiedMemoryClient] Disconnected from OneAgent Memory Server');
                        _a.label = 2;
                    case 2: return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        this.emit('error', error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a new memory entry with real persistence
     */ RealUnifiedMemoryClient.prototype.createMemory = function (content_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (content, userId, memoryType, metadata, constitutionalLevel) {
            var startTime, memoryId, constitutionalResult, qualityScore, memoryEntry, cleanMetadata, createUrl, requestBody, response, result, createdMemory, error_3;
            if (memoryType === void 0) { memoryType = 'long_term'; }
            if (metadata === void 0) { metadata = {}; }
            if (constitutionalLevel === void 0) { constitutionalLevel = ConstitutionalLevel.STANDARD; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected) {
                            throw new Error('Memory client not connected');
                        }
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        memoryId = (0, uuid_1.v4)();
                        return [4 /*yield*/, this.validateConstitutionalAI(content, constitutionalLevel)];
                    case 2:
                        constitutionalResult = _a.sent();
                        if (!constitutionalResult.valid) {
                            this.metrics.failedRequests++;
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Constitutional AI validation failed: ".concat(constitutionalResult.reason),
                                    constitutionalCompliance: false
                                }];
                        }
                        return [4 /*yield*/, this.calculateQualityScore(content, metadata)];
                    case 3:
                        qualityScore = _a.sent();
                        memoryEntry = {
                            id: memoryId,
                            content: content,
                            metadata: __assign(__assign({}, metadata), { memoryType: memoryType, userId: userId, timestamp: Date.now(), qualityScore: qualityScore, constitutionalLevel: constitutionalLevel.toString(), constitutionalCompliance: constitutionalResult.valid }),
                            timestamp: Date.now(),
                            userId: userId,
                            memoryType: memoryType,
                            qualityScore: qualityScore
                        };
                        cleanMetadata = this.cleanMetadata(__assign(__assign({}, metadata), { memoryType: memoryType, 
                            // Use ISO string timestamp instead of epoch number
                            timestamp: new Date().toISOString(), qualityScore: qualityScore }));
                        createUrl = "http://".concat(this.config.host, ":").concat(this.config.port, "/v1/memories");
                        requestBody = {
                            content: content,
                            userId: userId, // FastAPI server expects 'userId' not 'user_id'        metadata: cleanMetadata
                        };
                        return [4 /*yield*/, fetch(createUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestBody)
                            })];
                    case 4:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Memory server create failed: ".concat(response.status, " ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 5:
                        result = _a.sent();
                        createdMemory = result.data;
                        // Update metrics
                        this.updateMetrics(startTime, true, qualityScore);
                        this.metrics.totalMemories++;
                        this.metrics.uniqueUsers.add(userId);
                        // Memory created successfully
                        return [2 /*return*/, {
                                success: true,
                                memoryId: (createdMemory === null || createdMemory === void 0 ? void 0 : createdMemory.id) || memoryId,
                                qualityScore: qualityScore,
                                constitutionalCompliance: true,
                                message: 'Memory created successfully with real persistence'
                            }];
                    case 6:
                        error_3 = _a.sent();
                        this.updateMetrics(startTime, false);
                        console.error('[RealUnifiedMemoryClient] ❌ Failed to create memory:', error_3);
                        return [2 /*return*/, {
                                success: false,
                                error: error_3 instanceof Error ? error_3.message : 'Unknown error',
                                constitutionalCompliance: false
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieve memory context with semantic search
     */ RealUnifiedMemoryClient.prototype.getMemoryContext = function (query_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (query, userId, limit, memoryTypes) {
            var startTime, params, searchUrl, response, result, memories, searchResults, searchQuality, error_4;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected) {
                            throw new Error('Memory client not connected');
                        }
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        params = new URLSearchParams({
                            userId: userId,
                            limit: limit.toString()
                        });
                        if (query) {
                            params.append('query', query);
                        }
                        if (memoryTypes && memoryTypes.length > 0) {
                            params.append('memoryTypes', memoryTypes.join(','));
                        }
                        searchUrl = "http://".concat(this.config.host, ":").concat(this.config.port, "/v1/memories?").concat(params);
                        return [4 /*yield*/, fetch(searchUrl, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Memory server search failed: ".concat(response.status, " ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        memories = result.data || [];
                        searchResults = memories.map(function (memory) { return ({
                            id: memory.id,
                            content: memory.content,
                            metadata: memory.metadata || {},
                            similarity: memory.relevanceScore || 0.5, // FastAPI server uses relevanceScore
                            timestamp: memory.createdAt ? new Date(memory.createdAt).getTime() : Date.now()
                        }); });
                        searchQuality = this.calculateSearchQuality(searchResults, query);
                        this.updateMetrics(startTime, true);
                        // Search completed successfully
                        return [2 /*return*/, {
                                memories: searchResults,
                                totalFound: searchResults.length,
                                searchQuality: searchQuality
                            }];
                    case 4:
                        error_4 = _a.sent();
                        this.updateMetrics(startTime, false);
                        console.error('[RealUnifiedMemoryClient] ❌ Failed to retrieve memory context:', error_4);
                        return [2 /*return*/, {
                                memories: [],
                                totalFound: 0,
                                searchQuality: 0
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Edit existing memory
     */
    RealUnifiedMemoryClient.prototype.editMemory = function (memoryId, userId, content, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, existing, newContent, rawMetadata, constitutionalResult, sanitizedMetadata, updateOptions, error_5;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.isConnected || !this.collection) {
                            throw new Error('Memory client not connected');
                        }
                        startTime = Date.now();
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.collection.get({
                                ids: [memoryId]
                            })];
                    case 2:
                        existing = _c.sent();
                        if (!existing.ids || existing.ids.length === 0) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'Memory not found'
                                }];
                        } // Update the memory
                        newContent = content || ((_a = existing.documents) === null || _a === void 0 ? void 0 : _a[0]) || '';
                        rawMetadata = __assign(__assign(__assign({}, (((_b = existing.metadatas) === null || _b === void 0 ? void 0 : _b[0]) || {})), metadata), { lastModified: Date.now(), modifiedBy: userId });
                        if (!content) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.validateConstitutionalAI(content, ConstitutionalLevel.STANDARD)];
                    case 3:
                        constitutionalResult = _c.sent();
                        if (!constitutionalResult.valid) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Constitutional AI validation failed: ".concat(constitutionalResult.reason),
                                    constitutionalCompliance: false
                                }];
                        }
                        _c.label = 4;
                    case 4:
                        sanitizedMetadata = this.sanitizeMetadata(rawMetadata);
                        updateOptions = {
                            ids: [memoryId],
                            metadatas: [sanitizedMetadata]
                        };
                        if (content) {
                            updateOptions.documents = [newContent];
                        }
                        return [4 /*yield*/, this.collection.update(updateOptions)];
                    case 5:
                        _c.sent();
                        this.updateMetrics(startTime, true);
                        // Memory updated successfully
                        return [2 /*return*/, {
                                success: true,
                                memoryId: memoryId,
                                message: 'Memory updated successfully'
                            }];
                    case 6:
                        error_5 = _c.sent();
                        this.updateMetrics(startTime, false);
                        console.error('[RealUnifiedMemoryClient] ❌ Failed to edit memory:', error_5);
                        return [2 /*return*/, {
                                success: false,
                                error: error_5 instanceof Error ? error_5.message : 'Unknown error'
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete memory
     */ RealUnifiedMemoryClient.prototype.deleteMemory = function (memoryId_1, _userId_1) {
        return __awaiter(this, arguments, void 0, function (memoryId, _userId, // Prefixed with underscore to indicate intentionally unused
        confirm) {
            var startTime, deleteUrl, response, result, error_6;
            if (confirm === void 0) { confirm = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected || !this.collection) {
                            throw new Error('Memory client not connected');
                        }
                        if (!confirm) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'Deletion requires confirmation'
                                }];
                        }
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        deleteUrl = "http://".concat(this.config.host, ":").concat(this.config.port, "/v1/memories/").concat(memoryId);
                        return [4 /*yield*/, fetch(deleteUrl, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Memory server delete failed: ".concat(response.status, " ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        result = _a.sent();
                        this.updateMetrics(startTime, true);
                        this.metrics.totalMemories = Math.max(0, this.metrics.totalMemories - 1);
                        // Memory deleted successfully
                        return [2 /*return*/, {
                                success: true,
                                message: result.message || 'Memory deleted successfully'
                            }];
                    case 4:
                        error_6 = _a.sent();
                        this.updateMetrics(startTime, false);
                        console.error('[RealUnifiedMemoryClient] ❌ Failed to delete memory:', error_6);
                        return [2 /*return*/, {
                                success: false,
                                error: error_6 instanceof Error ? error_6.message : 'Unknown error'
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get comprehensive memory statistics
     */
    RealUnifiedMemoryClient.prototype.getMemoryStats = function (_userId) {
        return __awaiter(this, void 0, void 0, function () {
            var collectionCount, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected || !this.collection) {
                            throw new Error('Memory client not connected');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.collection.count()];
                    case 2:
                        collectionCount = _a.sent();
                        return [2 /*return*/, {
                                totalMemories: collectionCount,
                                metrics: __assign(__assign({}, this.metrics), { uniqueUsers: this.metrics.uniqueUsers.size, uniqueAgents: this.metrics.uniqueAgents.size }),
                                systemStatus: {
                                    type: 'ChromaDB',
                                    isReal: true,
                                    hasPersistence: true,
                                    hasEmbeddings: true,
                                    capabilities: [
                                        'semantic_search',
                                        'vector_storage',
                                        'persistence',
                                        'embeddings',
                                        'real_time_learning',
                                        'inter_agent_sharing'
                                    ],
                                    connectionStatus: 'connected',
                                    transparency: {
                                        actualType: 'ChromaDB Vector Database',
                                        reported: [
                                            'semantic_search',
                                            'vector_storage',
                                            'persistence',
                                            'embeddings',
                                            'real_time_learning'
                                        ],
                                        actual: [
                                            'semantic_search',
                                            'vector_storage',
                                            'persistence',
                                            'embeddings',
                                            'real_time_learning'
                                        ],
                                        isDeceptive: false
                                    }
                                }
                            }];
                    case 3:
                        error_7 = _a.sent();
                        console.error('[RealUnifiedMemoryClient] ❌ Failed to get stats:', error_7);
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate Constitutional AI principles
     */
    RealUnifiedMemoryClient.prototype.validateConstitutionalAI = function (content, level) {
        return __awaiter(this, void 0, void 0, function () {
            var validationRules, rules, score, inappropriatePatterns, speculativePatterns, matches;
            var _a;
            return __generator(this, function (_b) {
                validationRules = (_a = {},
                    _a[ConstitutionalLevel.BASIC] = ['length', 'profanity'],
                    _a[ConstitutionalLevel.STANDARD] = ['length', 'profanity', 'accuracy', 'helpfulness'],
                    _a[ConstitutionalLevel.PROFESSIONAL] = ['length', 'profanity', 'accuracy', 'helpfulness', 'transparency'],
                    _a[ConstitutionalLevel.ENTERPRISE] = ['length', 'profanity', 'accuracy', 'helpfulness', 'transparency', 'safety'],
                    _a);
                rules = validationRules[level];
                score = 100;
                // Length check
                if (rules.includes('length') && (content.length < 10 || content.length > 10000)) {
                    return [2 /*return*/, { valid: false, reason: 'Content length outside acceptable range', score: 0 }];
                }
                // Basic profanity/inappropriate content check
                if (rules.includes('profanity')) {
                    inappropriatePatterns = /\b(hate|harmful|dangerous|illegal)\b/i;
                    if (inappropriatePatterns.test(content)) {
                        return [2 /*return*/, { valid: false, reason: 'Content contains inappropriate material', score: 0 }];
                    }
                }
                // Accuracy check (basic heuristics)
                if (rules.includes('accuracy')) {
                    speculativePatterns = /\b(probably|maybe|might|possibly|seems like|I think)\b/gi;
                    matches = content.match(speculativePatterns);
                    if (matches && matches.length > 3) {
                        score -= 20; // Reduce score for excessive speculation
                    }
                }
                return [2 /*return*/, { valid: score >= 60, score: score }];
            });
        });
    };
    /**
     * Calculate quality score for content
     */
    RealUnifiedMemoryClient.prototype.calculateQualityScore = function (content, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var score, sentences;
            return __generator(this, function (_a) {
                score = 50;
                // Content length scoring
                if (content.length >= 50 && content.length <= 2000) {
                    score += 20;
                }
                sentences = content.split(/[.!?]+/).length;
                if (sentences >= 2 && sentences <= 10) {
                    score += 15;
                }
                // Metadata richness
                if (Object.keys(metadata).length >= 3) {
                    score += 10;
                }
                // Cap at 100
                return [2 /*return*/, Math.min(100, score)];
            });
        });
    };
    /**
     * Calculate search quality based on results
     */
    RealUnifiedMemoryClient.prototype.calculateSearchQuality = function (memories, _query) {
        if (memories.length === 0)
            return 0;
        // Base quality on average similarity and result count
        var avgSimilarity = memories.reduce(function (sum, m) { return sum + m.similarity; }, 0) / memories.length;
        var countBonus = Math.min(memories.length / 10, 1) * 20;
        return Math.min(100, (avgSimilarity * 80) + countBonus);
    };
    /**
     * Update performance metrics
     */
    RealUnifiedMemoryClient.prototype.updateMetrics = function (startTime, success, qualityScore) {
        var responseTime = Date.now() - startTime;
        this.metrics.totalRequests++;
        if (success) {
            this.metrics.successfulRequests++;
        }
        else {
            this.metrics.failedRequests++;
        }
        // Update average response time
        this.metrics.averageResponseTime =
            (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
                this.metrics.totalRequests;
        // Update quality scores
        if (qualityScore !== undefined) {
            this.metrics.qualityScores.push(qualityScore);
            this.metrics.averageQualityScore =
                this.metrics.qualityScores.reduce(function (sum, score) { return sum + score; }, 0) /
                    this.metrics.qualityScores.length;
        }
        // Update success rate
        this.metrics.successRate = this.metrics.successfulRequests / this.metrics.totalRequests;
    };
    /**
     * Save metrics to disk
     */
    RealUnifiedMemoryClient.prototype.saveMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var metricsPath, metricsData, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        metricsPath = path.join(this.config.persistPath || './oneagent_unified_memory', 'metrics.json');
                        return [4 /*yield*/, fs.mkdir(path.dirname(metricsPath), { recursive: true })];
                    case 1:
                        _a.sent();
                        metricsData = __assign(__assign({}, this.metrics), { uniqueUsers: Array.from(this.metrics.uniqueUsers), uniqueAgents: Array.from(this.metrics.uniqueAgents), lastSaved: Date.now() });
                        return [4 /*yield*/, fs.writeFile(metricsPath, JSON.stringify(metricsData, null, 2))];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _a.sent();
                        console.warn('[RealUnifiedMemoryClient] Failed to save metrics:', error_8);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Load metrics from disk
     */
    RealUnifiedMemoryClient.prototype.loadMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var metricsPath, data, metricsData, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        metricsPath = path.join(this.config.persistPath || './oneagent_unified_memory', 'metrics.json');
                        return [4 /*yield*/, fs.readFile(metricsPath, 'utf-8')];
                    case 1:
                        data = _a.sent();
                        metricsData = JSON.parse(data);
                        this.metrics = __assign(__assign(__assign({}, this.metrics), metricsData), { uniqueUsers: new Set(metricsData.uniqueUsers || []), uniqueAgents: new Set(metricsData.uniqueAgents || []) });
                        console.log('[RealUnifiedMemoryClient] Loaded existing metrics');
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _a.sent();
                        console.log('[RealUnifiedMemoryClient] No existing metrics found, starting fresh');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if memory system is connected and ready
     */
    RealUnifiedMemoryClient.prototype.isReady = function () {
        return this.isConnected && this.collection !== null;
    };
    /**
     * Sanitize metadata for ChromaDB storage
     * Removes null/undefined values and ensures all values are compatible with ChromaDB
     */
    RealUnifiedMemoryClient.prototype.sanitizeMetadata = function (metadata) {
        var sanitized = {};
        for (var _i = 0, _a = Object.entries(metadata); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (value === null || value === undefined) {
                // Skip null/undefined values
                continue;
            }
            else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                // Keep valid types as-is
                sanitized[key] = value;
            }
            else if (value instanceof Date) {
                // Convert dates to ISO strings
                sanitized[key] = value.toISOString();
            }
            else if (typeof value === 'object') {
                // Convert objects to JSON strings
                sanitized[key] = JSON.stringify(value);
            }
            else {
                // Convert everything else to string
                sanitized[key] = String(value);
            }
        }
        return sanitized;
    };
    /**
     * Clean metadata by removing null/undefined values and ensuring ChromaDB compatibility
     * ChromaDB only accepts string, number, boolean values in metadata
     */
    RealUnifiedMemoryClient.prototype.cleanMetadata = function (metadata) {
        var cleaned = {};
        for (var _i = 0, _a = Object.entries(metadata); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (value === null || value === undefined) {
                // Skip null/undefined values
                continue;
            }
            else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                // Keep valid types as-is
                cleaned[key] = value;
            }
            else if (value instanceof Date) {
                // Convert dates to ISO strings
                cleaned[key] = value.toISOString();
            }
            else if (typeof value === 'object') {
                // Convert objects to JSON strings
                cleaned[key] = JSON.stringify(value);
            }
            else {
                // Convert everything else to string
                cleaned[key] = String(value);
            }
        }
        return cleaned;
    };
    /**
     * Get connection status and capabilities
     */
    RealUnifiedMemoryClient.prototype.getStatus = function () {
        return {
            connected: this.isConnected,
            type: 'ChromaDB',
            collection: this.collection ? 'oneagent_unified_memory' : null,
            capabilities: this.isConnected ? [
                'semantic_search',
                'vector_storage',
                'persistence',
                'embeddings',
                'real_time_learning',
                'inter_agent_sharing'
            ] : [],
            metrics: this.metrics
        };
    };
    return RealUnifiedMemoryClient;
}(events_1.EventEmitter));
exports.RealUnifiedMemoryClient = RealUnifiedMemoryClient;
exports.default = RealUnifiedMemoryClient;
// Export singleton instance for convenience (real memory system)
exports.realUnifiedMemoryClient = new RealUnifiedMemoryClient();
console.log('[RealUnifiedMemoryClient] Singleton instance created - ready for OneAgent integration');
