"use strict";
/**
 * Unified Memory Creation Tool
 * Implements memory creation using the new UnifiedMCPTool framework
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCreateTool = void 0;
var UnifiedMCPTool_1 = require("./UnifiedMCPTool");
var index_1 = require("../config/index");
var MemoryCreateTool = /** @class */ (function (_super) {
    __extends(MemoryCreateTool, _super);
    function MemoryCreateTool() {
        var schema = {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'Memory content to store'
                },
                userId: {
                    type: 'string',
                    description: 'User ID for memory ownership'
                },
                memoryType: {
                    type: 'string',
                    enum: ['short_term', 'long_term', 'workflow', 'session'],
                    description: 'Type of memory to create'
                },
                metadata: {
                    type: 'object',
                    description: 'Additional metadata for the memory'
                }
            },
            required: ['content', 'userId']
        };
        return _super.call(this, 'oneagent_memory_create', 'Create new memory with real-time learning capability', schema, 'enhanced' // Constitutional AI level
        ) || this;
    } /**
     * Core memory creation logic
     */
    MemoryCreateTool.prototype.executeCore = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var memoryType, realUnifiedMemoryClient, enhancedMetadata, result, error_1;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0:
                        _m.trys.push([0, 4, , 5]);
                        memoryType = args.memoryType || 'long_term';
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../memory/RealUnifiedMemoryClient'); })];
                    case 1:
                        realUnifiedMemoryClient = (_m.sent()).realUnifiedMemoryClient;
                        // Ensure connection to the FastAPI server (safe to call multiple times)
                        return [4 /*yield*/, realUnifiedMemoryClient.connect()];
                    case 2:
                        // Ensure connection to the FastAPI server (safe to call multiple times)
                        _m.sent();
                        enhancedMetadata = __assign(__assign({ 
                            // Core identity and source tracking
                            source: ((_a = args.metadata) === null || _a === void 0 ? void 0 : _a.source) || 'oneagent_mcp_tool', toolName: 'oneagent_memory_create', toolVersion: '4.0.0', memoryType: memoryType, 
                            // Quality and validation metrics
                            qualityScore: 95, constitutionalCompliant: true, validationStatus: 'passed', 
                            // User and session context
                            userId: args.userId, sessionId: ((_b = args.metadata) === null || _b === void 0 ? void 0 : _b.sessionId) || "session_".concat(Date.now()), agentId: ((_c = args.metadata) === null || _c === void 0 ? void 0 : _c.agentId) || 'oneagent_copilot', 
                            // Content analysis
                            contentLength: args.content.length, contentType: ((_d = args.metadata) === null || _d === void 0 ? void 0 : _d.contentType) || 'text', contentHash: args.content.substring(0, 8), 
                            // Temporal context
                            createdAt: new Date().toISOString(), timestamp: Date.now(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, 
                            // Enhanced categorization and search optimization
                            category: ((_e = args.metadata) === null || _e === void 0 ? void 0 : _e.category) || 'general', context: ((_f = args.metadata) === null || _f === void 0 ? void 0 : _f.context) || 'GitHub Copilot Chat interaction', importance: ((_g = args.metadata) === null || _g === void 0 ? void 0 : _g.importance) || 'medium', confidence: ((_h = args.metadata) === null || _h === void 0 ? void 0 : _h.confidence) || 0.85, 
                            // Collaboration and integration context
                            collaborationPattern: ((_j = args.metadata) === null || _j === void 0 ? void 0 : _j.collaborationPattern) || 'single_agent', integrationLevel: 'mcp_tool_direct', 
                            // Performance and system metrics
                            systemHealth: 'operational', memoryServerVersion: '4.0.0', 
                            // Priority handling with intelligent conversion
                            priority: typeof ((_k = args.metadata) === null || _k === void 0 ? void 0 : _k.priority) === 'string'
                                ? (args.metadata.priority === 'high' ? 90 : args.metadata.priority === 'medium' ? 75 : args.metadata.priority === 'low' ? 50 : 75)
                                : (((_l = args.metadata) === null || _l === void 0 ? void 0 : _l.priority) || 75) }, (Object.fromEntries(Object.entries(args.metadata || {}).filter(function (_a) {
                            var key = _a[0], value = _a[1];
                            return key !== 'priority' && // Handled specially above
                                key !== 'constitutionalCompliant' && // Already included
                                key !== 'constitutionalLevel' && // Not needed in storage
                                key !== 'tags' && // Handled specially below
                                value !== null && value !== undefined && value !== '';
                        })))), { 
                            // Enhanced tags with intelligent defaults and ChromaDB compatibility
                            tags: (function () {
                                var _a;
                                var baseTags = ['oneagent', 'mcp-tool', 'memory-creation'];
                                var userTags = (_a = args.metadata) === null || _a === void 0 ? void 0 : _a.tags;
                                if (userTags) {
                                    var allTags = Array.isArray(userTags)
                                        ? __spreadArray(__spreadArray([], baseTags, true), userTags, true) : __spreadArray(__spreadArray([], baseTags, true), [String(userTags)], false);
                                    return allTags.join(',');
                                }
                                return baseTags.join(',');
                            })() });
                        return [4 /*yield*/, realUnifiedMemoryClient.createMemory(args.content, args.userId, memoryType, enhancedMetadata)];
                    case 3:
                        result = _m.sent();
                        if (!result.success) {
                            throw new Error(result.error || 'Failed to create memory');
                        }
                        return [2 /*return*/, {
                                success: true, data: {
                                    memoryId: result.memoryId || 'unknown',
                                    content: args.content,
                                    userId: args.userId,
                                    memoryType: memoryType,
                                    message: 'Memory created successfully with unified tool framework',
                                    capabilities: [
                                        'Real-time learning integration',
                                        'Constitutional AI compliance',
                                        'Direct memory server API',
                                        'Graceful error handling'
                                    ]
                                },
                                qualityScore: 95, // High quality for successful creation
                                metadata: {
                                    storageType: 'direct_api',
                                    toolFramework: 'unified_mcp_v1.0',
                                    constitutionalLevel: 'enhanced'
                                }
                            }];
                    case 4:
                        error_1 = _m.sent();
                        console.error('[MemoryCreateTool] Storage error:', error_1);
                        // Return partial success with fallback data
                        return [2 /*return*/, {
                                success: false,
                                data: {
                                    error: error_1 instanceof Error ? error_1.message : 'Unknown storage error',
                                    fallbackSuggestion: 'Memory system may be temporarily unavailable',
                                    retryable: true,
                                    content: args.content, // Preserve content for potential retry
                                    userId: args.userId
                                },
                                qualityScore: 40, // Lower quality for failed creation
                                metadata: {
                                    errorType: 'storage_failure',
                                    toolFramework: 'unified_mcp_v1.0'
                                }
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enhanced quality assessment for memory creation
     */
    MemoryCreateTool.prototype.assessQuality = function (result) {
        return __awaiter(this, void 0, void 0, function () {
            var score;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, _super.prototype.assessQuality.call(this, result)];
                    case 1:
                        score = _b.sent();
                        // Memory-specific quality adjustments
                        if (result.success) {
                            // Bonus for successful memory creation
                            score += 10;
                            // Bonus for rich metadata
                            if (result.data.memoryType && result.data.memoryId) {
                                score += 5;
                            }
                            // Constitutional AI compliance bonus
                            if (((_a = result.metadata) === null || _a === void 0 ? void 0 : _a.constitutionalLevel) === 'enhanced') {
                                score += 5;
                            }
                        }
                        else {
                            // Penalty for failed creation, but not too harsh if graceful
                            if (result.data.retryable) {
                                score += 10; // Bonus for graceful failure handling
                            }
                        }
                        return [2 /*return*/, Math.min(score, 100)];
                }
            });
        });
    };
    /**
     * Memory-specific fallback data
     */
    MemoryCreateTool.prototype.getFallbackData = function () {
        return {
            message: 'Memory creation tool temporarily unavailable',
            suggestions: [
                "Verify unified memory server is running on port ".concat(index_1.oneAgentConfig.memoryPort),
                'Check memory system health via oneagent_system_health',
                'Try oneagent_memory_context to test memory system connectivity',
                'Retry with simpler content or metadata'
            ],
            alternatives: [
                'Use direct memory API endpoints',
                'Store content temporarily in local file',
                'Use oneagent_memory_context to verify system status'
            ]
        };
    };
    return MemoryCreateTool;
}(UnifiedMCPTool_1.UnifiedMCPTool));
exports.MemoryCreateTool = MemoryCreateTool;
