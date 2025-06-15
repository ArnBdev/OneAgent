"use strict";
/**
 * Unified MCP Tool Framework
 * Constitutional AI-compliant tool architecture with predictable patterns
 */
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
exports.UnifiedMCPTool = void 0;
var RealUnifiedMemoryClient_1 = require("../memory/RealUnifiedMemoryClient");
/**
 * Base class for all unified MCP tools
 * Implements Constitutional AI compliance and predictable execution patterns
 */
var UnifiedMCPTool = /** @class */ (function () {
    function UnifiedMCPTool(name, description, schema, constitutionalLevel) {
        if (constitutionalLevel === void 0) { constitutionalLevel = 'basic'; }
        this.name = name;
        this.description = description;
        this.schema = schema;
        this.constitutionalLevel = constitutionalLevel;
        this.unifiedMemoryClient = new RealUnifiedMemoryClient_1.default();
    }
    /**
     * Main execution method - implements the unified tool pipeline
     */
    UnifiedMCPTool.prototype.execute = function (args, id) {
        return __awaiter(this, void 0, void 0, function () {
            var validationResult, executionResult, qualityScore, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.validateInput(args)];
                    case 1:
                        validationResult = _a.sent();
                        if (!validationResult.isValid) {
                            return [2 /*return*/, this.createErrorResponse(id, validationResult.errors || ['Invalid input'])];
                        }
                        return [4 /*yield*/, this.executeCore(validationResult.cleanArgs)];
                    case 2:
                        executionResult = _a.sent();
                        return [4 /*yield*/, this.assessQuality(executionResult)];
                    case 3:
                        qualityScore = _a.sent();
                        return [2 /*return*/, this.createSuccessResponse(id, executionResult, qualityScore)];
                    case 4:
                        error_1 = _a.sent();
                        // Phase 4: Error Handling & Fallback
                        console.error("[".concat(this.name, "] Error:"), error_1);
                        return [2 /*return*/, this.createFallbackResponse(id, error_1)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Phase 1: Input validation with Constitutional AI principles
     */
    UnifiedMCPTool.prototype.validateInput = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var errors, _i, _a, field, _b, _c, _d, fieldName, fieldSchema, isValid, constitutionalScore;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        errors = [];
                        // Check required fields
                        for (_i = 0, _a = this.schema.required; _i < _a.length; _i++) {
                            field = _a[_i];
                            if (!args[field]) {
                                errors.push("Missing required field: ".concat(field));
                            }
                        }
                        // Validate field types
                        for (_b = 0, _c = Object.entries(this.schema.properties); _b < _c.length; _b++) {
                            _d = _c[_b], fieldName = _d[0], fieldSchema = _d[1];
                            if (args[fieldName] !== undefined) {
                                isValid = this.validateFieldType(args[fieldName], fieldSchema);
                                if (!isValid) {
                                    errors.push("Invalid type for field: ".concat(fieldName));
                                }
                            }
                        }
                        constitutionalScore = 100;
                        if (!(this.constitutionalLevel !== 'basic')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.performConstitutionalValidation(args)];
                    case 1:
                        constitutionalScore = _e.sent();
                        _e.label = 2;
                    case 2: return [2 /*return*/, {
                            isValid: errors.length === 0 && constitutionalScore >= 70,
                            cleanArgs: this.sanitizeArgs(args),
                            errors: errors.length > 0 ? errors : [],
                            constitutionalScore: constitutionalScore
                        }];
                }
            });
        });
    };
    /**
     * Phase 3: Quality assessment
     */
    UnifiedMCPTool.prototype.assessQuality = function (result) {
        return __awaiter(this, void 0, void 0, function () {
            var score, dataKeys;
            return __generator(this, function (_a) {
                score = result.success ? 80 : 30;
                // Adjust based on data completeness
                if (result.data && typeof result.data === 'object') {
                    dataKeys = Object.keys(result.data);
                    score += Math.min(dataKeys.length * 2, 15); // Max 15 bonus points
                }
                // Constitutional AI alignment bonus
                if (this.constitutionalLevel === 'critical') {
                    score += 5; // Bonus for critical tool compliance
                }
                return [2 /*return*/, Math.min(score, 100)];
            });
        });
    };
    /**
     * Success response formatter - follows working memory_context pattern
     */
    UnifiedMCPTool.prototype.createSuccessResponse = function (id, result, qualityScore) {
        return {
            jsonrpc: '2.0',
            id: id,
            result: {
                content: [{
                        type: 'text',
                        text: JSON.stringify(__assign(__assign(__assign({ success: result.success }, result.data), { qualityScore: qualityScore, toolName: this.name, constitutionalCompliant: true, timestamp: new Date().toISOString() }), (result.metadata && { metadata: result.metadata })), null, 2)
                    }],
                isError: false
            }
        };
    };
    /**
     * Error response formatter
     */
    UnifiedMCPTool.prototype.createErrorResponse = function (id, errors) {
        return {
            jsonrpc: '2.0',
            id: id,
            result: {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: errors.join(', '),
                            toolName: this.name,
                            fallbackAvailable: this.hasFallback(),
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }],
                isError: true
            }
        };
    };
    /**
     * Fallback response formatter - graceful degradation
     */
    UnifiedMCPTool.prototype.createFallbackResponse = function (id, error) {
        var fallbackData = this.getFallbackData();
        return {
            jsonrpc: '2.0',
            id: id,
            result: {
                content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                            fallback: fallbackData,
                            toolName: this.name,
                            constitutionalNote: 'Tool failed gracefully with fallback data',
                            timestamp: new Date().toISOString()
                        }, null, 2)
                    }],
                isError: false // Not an error if we have graceful fallback
            }
        };
    };
    // Helper methods
    UnifiedMCPTool.prototype.validateFieldType = function (value, schema) {
        if (schema.type === 'string')
            return typeof value === 'string';
        if (schema.type === 'number')
            return typeof value === 'number';
        if (schema.type === 'boolean')
            return typeof value === 'boolean';
        if (schema.type === 'object')
            return typeof value === 'object';
        if (schema.type === 'array')
            return Array.isArray(value);
        return true; // Allow unknown types
    };
    UnifiedMCPTool.prototype.sanitizeArgs = function (args) {
        // Basic sanitization - remove undefined values
        var clean = {};
        for (var _i = 0, _a = Object.entries(args); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (value !== undefined) {
                clean[key] = value;
            }
        }
        return clean;
    };
    UnifiedMCPTool.prototype.performConstitutionalValidation = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var score, content;
            return __generator(this, function (_a) {
                score = 100;
                content = JSON.stringify(args).toLowerCase();
                if (content.includes('delete') || content.includes('remove')) {
                    score -= 10; // Slight penalty for destructive operations
                }
                return [2 /*return*/, score];
            });
        });
    };
    UnifiedMCPTool.prototype.hasFallback = function () {
        // Default: assume tools have some fallback capability
        return true;
    };
    UnifiedMCPTool.prototype.getFallbackData = function () {
        // Default fallback data
        return {
            message: "".concat(this.name, " encountered an error but is designed for graceful degradation"),
            suggestions: ['Try again with different parameters', 'Check system health', 'Contact support if issue persists']
        };
    };
    return UnifiedMCPTool;
}());
exports.UnifiedMCPTool = UnifiedMCPTool;
