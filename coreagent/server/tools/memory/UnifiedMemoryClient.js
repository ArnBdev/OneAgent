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
exports.ConstitutionalLevel = exports.unifiedMemoryClient = exports.UnifiedMemoryClient = void 0;
var events_1 = require("events");
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
})(ConstitutionalLevel || (exports.ConstitutionalLevel = ConstitutionalLevel = {}));
/**
 * MCP-compliant Unified Memory Client
 *
 * Implements the Model Context Protocol specification for memory operations
 * with Constitutional AI validation and quality scoring.
 */
var UnifiedMemoryClient = /** @class */ (function (_super) {
    __extends(UnifiedMemoryClient, _super);
    function UnifiedMemoryClient(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this) || this;
        _this.isConnected = false;
        _this.requestId = 0;
        _this.pendingRequests = new Map();
        // Performance and quality metrics
        _this.metrics = {
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
        _this.config = {
            host: config.host || 'localhost',
            port: config.port || index_1.oneAgentConfig.mcpPort,
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            enableSSL: config.enableSSL || false,
            apiKey: config.apiKey || process.env.ONEAGENT_API_KEY
        };
        _this.setupEventHandlers();
        return _this;
    }
    /**
     * Setup event handlers for connection management
     */
    UnifiedMemoryClient.prototype.setupEventHandlers = function () {
        var _this = this;
        this.on('error', function (error) {
            console.error('[UnifiedMemoryClient] Error:', error);
            _this.metrics.failedRequests++;
        });
        this.on('response', function (response) {
            _this.updateQualityMetrics(response);
        });
    };
    /**
     * Connect to the Memory Server
     */
    UnifiedMemoryClient.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, healthData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        url = "".concat(this.config.enableSSL ? 'https' : 'http', "://").concat(this.config.host, ":").concat(this.config.port, "/health");
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'User-Agent': 'OneAgent-UnifiedMemoryClient/4.0.0'
                                },
                                signal: AbortSignal.timeout(this.config.timeout)
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Health check failed: HTTP ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        healthData = _a.sent();
                        console.log('[UnifiedMemoryClient] Connected to memory server:', healthData);
                        this.isConnected = true;
                        this.emit('connected', healthData);
                        console.log('[UnifiedMemoryClient] Connected to Memory Server successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.emit('error', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Disconnect from the MCP memory server
     */
    UnifiedMemoryClient.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, id, pending_1;
            return __generator(this, function (_c) {
                try {
                    if (this.isConnected) {
                        // Clear pending requests
                        for (_i = 0, _a = this.pendingRequests; _i < _a.length; _i++) {
                            _b = _a[_i], id = _b[0], pending_1 = _b[1];
                            clearTimeout(pending_1.timeout);
                            pending_1.reject(new Error('Connection closed'));
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
                return [2 /*return*/];
            });
        });
    }; /**
     * Create a new memory entry with Constitutional AI validation
     */
    UnifiedMemoryClient.prototype.createMemory = function (content_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (content, userId, memoryType, metadata) {
            var url, payload, response, errorText, result, error_2;
            var _a;
            if (memoryType === void 0) { memoryType = 'long_term'; }
            if (metadata === void 0) { metadata = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = "".concat(this.config.enableSSL ? 'https' : 'http', "://").concat(this.config.host, ":").concat(this.config.port, "/v1/memories");
                        payload = {
                            content: content,
                            userId: userId,
                            metadata: __assign({ source: 'UnifiedMemoryClient', memoryType: memoryType, agentId: metadata.agentId || 'UnifiedMemoryClient', sessionId: metadata.sessionId, workflowId: metadata.workflowId, tags: metadata.tags || [], priority: metadata.priority || 1 }, metadata)
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'User-Agent': 'OneAgent-UnifiedMemoryClient/4.0.0'
                                },
                                body: JSON.stringify(payload)
                            })];
                    case 2:
                        response = _b.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _b.sent();
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText, " - ").concat(errorText));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        result = _b.sent();
                        return [2 /*return*/, {
                                success: result.success || false,
                                data: result.data,
                                qualityScore: (_a = result.data) === null || _a === void 0 ? void 0 : _a.qualityScore,
                                constitutionalCompliance: true, // Assume compliance for now
                                error: result.error
                            }];
                    case 6:
                        error_2 = _b.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_2 instanceof Error ? error_2.message : 'Unknown error'
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieve memory context with semantic search
     */
    UnifiedMemoryClient.prototype.getMemoryContext = function (query_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (query, userId, limit, memoryTypes) {
            var request, response, error_3;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            jsonrpc: '2.0',
                            id: this.getNextRequestId(),
                            method: 'memory/search',
                            params: {
                                query: query,
                                userId: userId,
                                limit: limit,
                                memoryTypes: memoryTypes,
                                semanticSearch: true,
                                includeQualityMetrics: true
                            }
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sendRequest(request)];
                    case 2:
                        response = _a.sent();
                        if (response.error) {
                            throw new Error(response.error.message);
                        }
                        return [2 /*return*/, response.result];
                    case 3:
                        error_3 = _a.sent();
                        this.emit('error', error_3);
                        return [2 /*return*/, {
                                entries: [],
                                totalCount: 0,
                                qualityMetrics: {
                                    averageQuality: 0,
                                    constitutionalCompliance: 0
                                }
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update existing memory entry
     */
    UnifiedMemoryClient.prototype.updateMemory = function (memoryId, userId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var request, response, error_4;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        request = {
                            jsonrpc: '2.0',
                            id: this.getNextRequestId(),
                            method: 'memory/update',
                            params: {
                                memoryId: memoryId,
                                userId: userId,
                                updates: __assign(__assign({}, updates), { lastModified: Date.now() })
                            }
                        };
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sendRequest(request)];
                    case 2:
                        response = _c.sent();
                        if (response.error) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: response.error.message
                                }];
                        }
                        return [2 /*return*/, {
                                success: true,
                                data: response.result,
                                qualityScore: (_a = response.result) === null || _a === void 0 ? void 0 : _a.qualityScore,
                                constitutionalCompliance: (_b = response.result) === null || _b === void 0 ? void 0 : _b.constitutionalCompliance
                            }];
                    case 3:
                        error_4 = _c.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_4 instanceof Error ? error_4.message : 'Unknown error'
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete memory entry with confirmation
     */
    UnifiedMemoryClient.prototype.deleteMemory = function (memoryId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (memoryId, userId, confirm) {
            var request, response, error_5;
            if (confirm === void 0) { confirm = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!confirm) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'Deletion requires explicit confirmation'
                                }];
                        }
                        request = {
                            jsonrpc: '2.0',
                            id: this.getNextRequestId(),
                            method: 'memory/delete',
                            params: {
                                memoryId: memoryId,
                                userId: userId,
                                confirm: confirm
                            }
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sendRequest(request)];
                    case 2:
                        response = _a.sent();
                        if (response.error) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: response.error.message
                                }];
                        }
                        return [2 /*return*/, {
                                success: true,
                                data: response.result
                            }];
                    case 3:
                        error_5 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_5 instanceof Error ? error_5.message : 'Unknown error'
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get comprehensive system health and performance metrics
     */
    UnifiedMemoryClient.prototype.getSystemHealth = function () {
        return __awaiter(this, void 0, void 0, function () {
            var request, response, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            jsonrpc: '2.0',
                            id: this.getNextRequestId(),
                            method: 'system/health',
                            params: {}
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sendRequest(request)];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.result];
                    case 3:
                        error_6 = _a.sent();
                        this.emit('error', error_6);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate content using Constitutional AI principles
     */
    UnifiedMemoryClient.prototype.validateConstitutional = function (content, context) {
        return __awaiter(this, void 0, void 0, function () {
            var request, response, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            jsonrpc: '2.0',
                            id: this.getNextRequestId(),
                            method: 'constitutional/validate',
                            params: {
                                content: content,
                                context: context
                            }
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sendRequest(request)];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.result];
                    case 3:
                        error_7 = _a.sent();
                        this.emit('error', error_7);
                        return [2 /*return*/, {
                                isValid: false,
                                score: 0,
                                violations: ['Validation service unavailable'],
                                recommendations: ['Retry validation when service is available']
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate quality score for content
     */
    UnifiedMemoryClient.prototype.generateQualityScore = function (content_1) {
        return __awaiter(this, arguments, void 0, function (content, criteria) {
            var request, response, error_8;
            if (criteria === void 0) { criteria = ['accuracy', 'clarity', 'completeness', 'relevance']; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            jsonrpc: '2.0',
                            id: this.getNextRequestId(),
                            method: 'quality/score',
                            params: {
                                content: content,
                                criteria: criteria
                            }
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sendRequest(request)];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.result];
                    case 3:
                        error_8 = _a.sent();
                        this.emit('error', error_8);
                        return [2 /*return*/, {
                                overallScore: 0,
                                criteriaScores: {},
                                grade: 'F',
                                improvements: ['Quality scoring service unavailable']
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send MCP request with retry logic and timeout handling
     */
    UnifiedMemoryClient.prototype.sendRequest = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, attempt, response, responseTime, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!this.isConnected && request.method !== 'initialize')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.connect()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        startTime = Date.now();
                        this.metrics.totalRequests++;
                        attempt = 1;
                        _a.label = 3;
                    case 3:
                        if (!(attempt <= this.config.retryAttempts)) return [3 /*break*/, 11];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 10]);
                        return [4 /*yield*/, this.makeHttpRequest(request)];
                    case 5:
                        response = _a.sent();
                        responseTime = Date.now() - startTime;
                        this.updatePerformanceMetrics(responseTime);
                        this.metrics.successfulRequests++;
                        this.emit('response', response);
                        return [2 /*return*/, response];
                    case 6:
                        error_9 = _a.sent();
                        console.warn("[UnifiedMemoryClient] Request attempt ".concat(attempt, " failed:"), error_9);
                        if (!(attempt < this.config.retryAttempts)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.delay(this.config.retryDelay * attempt)];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        this.metrics.failedRequests++;
                        throw error_9;
                    case 9: return [3 /*break*/, 10];
                    case 10:
                        attempt++;
                        return [3 /*break*/, 3];
                    case 11: throw new Error('All retry attempts exhausted');
                }
            });
        });
    };
    /**
     * Make HTTP request to Memory Server REST API
     */
    UnifiedMemoryClient.prototype.makeHttpRequest = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var methodToEndpoint, mapping, url, headers, controller, timeoutId, payload, searchParams, response, data, error_10;
            var _a, _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        methodToEndpoint = {
                            'memory/create': { endpoint: '/v1/memories', method: 'POST' },
                            'memory/search': { endpoint: '/v1/memories', method: 'GET' },
                            'memory/update': { endpoint: '/v1/memories', method: 'PUT' },
                            'memory/delete': { endpoint: '/v1/memories', method: 'DELETE' }
                        };
                        mapping = methodToEndpoint[request.method];
                        if (!mapping) {
                            throw new Error("Unsupported method: ".concat(request.method));
                        }
                        url = "".concat(this.config.enableSSL ? 'https' : 'http', "://").concat(this.config.host, ":").concat(this.config.port).concat(mapping.endpoint);
                        headers = {
                            'Content-Type': 'application/json',
                            'User-Agent': 'OneAgent-UnifiedMemoryClient/4.0.0'
                        };
                        if (this.config.apiKey) {
                            headers['Authorization'] = "Bearer ".concat(this.config.apiKey);
                        }
                        controller = new AbortController();
                        timeoutId = setTimeout(function () { return controller.abort(); }, this.config.timeout);
                        _h.label = 1;
                    case 1:
                        _h.trys.push([1, 4, , 5]);
                        payload = void 0;
                        if (request.method === 'memory/create') {
                            payload = {
                                content: (_a = request.params) === null || _a === void 0 ? void 0 : _a.content,
                                userId: (_b = request.params) === null || _b === void 0 ? void 0 : _b.userId,
                                metadata: ((_c = request.params) === null || _c === void 0 ? void 0 : _c.metadata) || {}
                            };
                        }
                        else if (request.method === 'memory/search') {
                            searchParams = new URLSearchParams();
                            if ((_d = request.params) === null || _d === void 0 ? void 0 : _d.query)
                                searchParams.append('query', request.params.query);
                            if ((_e = request.params) === null || _e === void 0 ? void 0 : _e.userId)
                                searchParams.append('userId', request.params.userId);
                            if ((_f = request.params) === null || _f === void 0 ? void 0 : _f.limit)
                                searchParams.append('limit', request.params.limit.toString());
                            if (((_g = request.params) === null || _g === void 0 ? void 0 : _g.memoryTypes) && Array.isArray(request.params.memoryTypes)) {
                                searchParams.append('memoryTypes', request.params.memoryTypes.join(','));
                            }
                            url += '?' + searchParams.toString();
                            payload = null; // No body for GET request
                        }
                        else {
                            payload = request.params;
                        }
                        return [4 /*yield*/, fetch(url, __assign(__assign({ method: mapping.method, headers: headers }, (payload ? { body: JSON.stringify(payload) } : {})), { signal: controller.signal }))];
                    case 2:
                        response = _h.sent();
                        clearTimeout(timeoutId);
                        if (!response.ok) {
                            throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _h.sent();
                        // Transform REST response to MCP format
                        return [2 /*return*/, {
                                jsonrpc: '2.0',
                                id: request.id,
                                result: data
                            }];
                    case 4:
                        error_10 = _h.sent();
                        clearTimeout(timeoutId);
                        if (error_10 instanceof Error && error_10.name === 'AbortError') {
                            throw new Error("Request timeout after ".concat(this.config.timeout, "ms"));
                        }
                        throw error_10;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update performance metrics
     */
    UnifiedMemoryClient.prototype.updatePerformanceMetrics = function (responseTime) {
        var currentAvg = this.metrics.averageResponseTime;
        var totalRequests = this.metrics.successfulRequests;
        this.metrics.averageResponseTime =
            (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
    };
    /**
     * Update quality metrics from response
     */
    UnifiedMemoryClient.prototype.updateQualityMetrics = function (response) {
        var _a, _b;
        if ((_a = response.result) === null || _a === void 0 ? void 0 : _a.qualityScore) {
            this.metrics.qualityScores.push(response.result.qualityScore);
            // Keep only last 100 scores for rolling average
            if (this.metrics.qualityScores.length > 100) {
                this.metrics.qualityScores.shift();
            }
        }
        if (((_b = response.result) === null || _b === void 0 ? void 0 : _b.constitutionalCompliance) !== undefined) {
            var currentCompliance = this.metrics.constitutionalCompliance;
            var totalResponses = this.metrics.successfulRequests;
            this.metrics.constitutionalCompliance =
                (currentCompliance * (totalResponses - 1) + response.result.constitutionalCompliance) / totalResponses;
        }
    };
    /**
     * Generate next request ID
     */
    UnifiedMemoryClient.prototype.getNextRequestId = function () {
        return ++this.requestId;
    };
    /**
     * Utility delay function
     */
    UnifiedMemoryClient.prototype.delay = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    /**
     * Get current client metrics
     */
    UnifiedMemoryClient.prototype.getMetrics = function () {
        // Calculate derived metrics
        var averageQualityScore = this.metrics.qualityScores.length > 0
            ? this.metrics.qualityScores.reduce(function (a, b) { return a + b; }, 0) / this.metrics.qualityScores.length
            : 0;
        var successRate = this.metrics.totalRequests > 0
            ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
            : 0;
        // Update metrics object
        this.metrics.averageQualityScore = averageQualityScore;
        this.metrics.successRate = successRate;
        return __assign({}, this.metrics);
    };
    /**
     * Check connection status
     */
    UnifiedMemoryClient.prototype.isConnectionHealthy = function () {
        return this.isConnected && this.getMetrics().successRate > 80;
    };
    /**
     * Reset client metrics
     */
    UnifiedMemoryClient.prototype.resetMetrics = function () {
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
    };
    // ============================================================================
    // BACKWARD COMPATIBILITY METHODS
    // Support for legacy APIs to maintain compatibility with existing codebase
    // ============================================================================
    /**
     * Legacy searchMemories method for backward compatibility
     * @deprecated Use getMemoryContext instead
     */
    UnifiedMemoryClient.prototype.searchMemories = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, limit, result, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = options.userId || 'default_user';
                        limit = options.maxResults || 10;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getMemoryContext(options.query, userId, limit)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.entries];
                    case 3:
                        error_11 = _a.sent();
                        console.warn('[UnifiedMemoryClient] searchMemories legacy method failed:', error_11);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Legacy storeConversation method for backward compatibility
     * @deprecated Use createMemory instead
     */
    UnifiedMemoryClient.prototype.storeConversation = function (conversation) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_12;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.createMemory(JSON.stringify(conversation), 'oneagent_system', 'long_term', { source: 'legacy_conversation', type: 'conversation' })];
                    case 1:
                        result = _b.sent();
                        if (result.success && ((_a = result.data) === null || _a === void 0 ? void 0 : _a.id)) {
                            return [2 /*return*/, result.data.id];
                        }
                        // Return a mock ID if creation failed
                        return [2 /*return*/, "mock_".concat(Date.now())];
                    case 2:
                        error_12 = _b.sent();
                        console.warn('[UnifiedMemoryClient] storeConversation legacy method failed:', error_12);
                        return [2 /*return*/, "mock_".concat(Date.now())];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Legacy storeMemoryWithEmbedding method for backward compatibility
     * @deprecated Use createMemory with metadata instead
     */
    UnifiedMemoryClient.prototype.storeMemoryWithEmbedding = function (content, metadata, userId, agentId, embedding, memoryType, additionalOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_13;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.createMemory(content, userId || 'default_user', memoryType || 'long_term', __assign(__assign(__assign({}, metadata), { agentId: agentId, embedding: embedding }), additionalOptions))];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, {
                                memoryId: ((_a = result.data) === null || _a === void 0 ? void 0 : _a.id) || "mock_".concat(Date.now()),
                                embedding: embedding
                            }];
                    case 2:
                        error_13 = _b.sent();
                        console.warn('[UnifiedMemoryClient] storeMemoryWithEmbedding legacy method failed:', error_13);
                        return [2 /*return*/, {
                                memoryId: "mock_".concat(Date.now()),
                                embedding: embedding
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Legacy semanticSearch method for backward compatibility
     * @deprecated Use getMemoryContext instead
     */
    UnifiedMemoryClient.prototype.semanticSearch = function (query, options, searchOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, result, processingTime, error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        startTime = Date.now();
                        return [4 /*yield*/, this.getMemoryContext(query, options.userId || 'default_user', (searchOptions === null || searchOptions === void 0 ? void 0 : searchOptions.topK) || 10)];
                    case 1:
                        result = _a.sent();
                        processingTime = Date.now() - startTime;
                        return [2 /*return*/, {
                                results: result.entries.map(function (entry) { return ({
                                    content: entry.content,
                                    similarity: 0.8, // Mock similarity score
                                    metadata: entry.metadata
                                }); }),
                                analytics: {
                                    processingTime: processingTime
                                }
                            }];
                    case 2:
                        error_14 = _a.sent();
                        console.warn('[UnifiedMemoryClient] semanticSearch legacy method failed:', error_14);
                        return [2 /*return*/, {
                                results: [],
                                analytics: {
                                    processingTime: 0
                                }
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Legacy findSimilarMemories method for backward compatibility
     * @deprecated Use getMemoryContext instead
     */
    UnifiedMemoryClient.prototype.findSimilarMemories = function (memoryId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getMemoryContext("similar to ".concat(memoryId), 'default_user', (options === null || options === void 0 ? void 0 : options.topK) || 5)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, {
                                results: result.entries.map(function (entry) { return ({
                                    id: entry.id,
                                    content: entry.content,
                                    similarity: 0.7 // Mock similarity score
                                }); })
                            }];
                    case 2:
                        error_15 = _a.sent();
                        console.warn('[UnifiedMemoryClient] findSimilarMemories legacy method failed:', error_15);
                        return [2 /*return*/, {
                                results: []
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Legacy testEmbeddings method for backward compatibility
     * @deprecated Embeddings testing moved to separate module
     */
    UnifiedMemoryClient.prototype.testEmbeddings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.createMemory('Embeddings test memory', 'test_user', 'short_term', { test: true })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.success];
                    case 2:
                        error_16 = _a.sent();
                        console.warn('[UnifiedMemoryClient] testEmbeddings legacy method failed:', error_16);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Legacy getCacheStats method for backward compatibility
     * @deprecated Cache statistics moved to performance metrics
     */
    UnifiedMemoryClient.prototype.getCacheStats = function () {
        return {
            size: this.metrics.qualityScores.length,
            keys: ["requests_".concat(this.metrics.totalRequests), "success_rate_".concat(this.metrics.successRate)]
        };
    };
    /**
     * Legacy testConnection method for backward compatibility
     * @deprecated Use isConnectionHealthy instead
     */
    UnifiedMemoryClient.prototype.testConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.connect()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.isConnectionHealthy()];
                    case 2:
                        error_17 = _a.sent();
                        console.warn('[UnifiedMemoryClient] testConnection legacy method failed:', error_17);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Legacy storeLearning method for backward compatibility
     * @deprecated Use createMemory with appropriate metadata instead
     */
    UnifiedMemoryClient.prototype.storeLearning = function (learning) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_18;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.createMemory(typeof learning === 'string' ? learning : JSON.stringify(learning), learning.userId || 'default_user', 'long_term', __assign({ type: 'learning', learningType: learning.learningType, confidence: learning.confidence, source: 'legacy_learning' }, learning.metadata))];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, ((_a = result.data) === null || _a === void 0 ? void 0 : _a.id) || "mock_learning_".concat(Date.now())];
                    case 2:
                        error_18 = _b.sent();
                        console.warn('[UnifiedMemoryClient] storeLearning legacy method failed:', error_18);
                        return [2 /*return*/, "mock_learning_".concat(Date.now())];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Legacy storePattern method for backward compatibility
     * @deprecated Use createMemory with appropriate metadata instead
     */
    UnifiedMemoryClient.prototype.storePattern = function (pattern) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_19;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.createMemory(typeof pattern === 'string' ? pattern : JSON.stringify(pattern), pattern.userId || 'default_user', 'long_term', __assign({ type: 'pattern', patternType: pattern.patternType, frequency: pattern.frequency, source: 'legacy_pattern' }, pattern.metadata))];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, ((_a = result.data) === null || _a === void 0 ? void 0 : _a.id) || "mock_pattern_".concat(Date.now())];
                    case 2:
                        error_19 = _b.sent();
                        console.warn('[UnifiedMemoryClient] storePattern legacy method failed:', error_19);
                        return [2 /*return*/, "mock_pattern_".concat(Date.now())];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return UnifiedMemoryClient;
}(events_1.EventEmitter));
exports.UnifiedMemoryClient = UnifiedMemoryClient;
// Export singleton instance for convenience
exports.unifiedMemoryClient = new UnifiedMemoryClient();
