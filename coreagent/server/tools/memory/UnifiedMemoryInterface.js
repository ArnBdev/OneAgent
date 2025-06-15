"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MEMORY_CONFIG = exports.SearchError = exports.StorageError = exports.ValidationError = exports.MemoryError = void 0;
exports.generateMemoryId = generateMemoryId;
exports.validateConversationMemory = validateConversationMemory;
exports.validateLearningMemory = validateLearningMemory;
exports.validatePatternMemory = validatePatternMemory;
var index_1 = require("../config/index");
// =====================================
// Error Types
// =====================================
var MemoryError = /** @class */ (function (_super) {
    __extends(MemoryError, _super);
    function MemoryError(message, code, details) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.details = details;
        _this.name = 'MemoryError';
        return _this;
    }
    return MemoryError;
}(Error));
exports.MemoryError = MemoryError;
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, details) {
        var _this = _super.call(this, message, 'VALIDATION_ERROR', details) || this;
        _this.name = 'ValidationError';
        return _this;
    }
    return ValidationError;
}(MemoryError));
exports.ValidationError = ValidationError;
var StorageError = /** @class */ (function (_super) {
    __extends(StorageError, _super);
    function StorageError(message, details) {
        var _this = _super.call(this, message, 'STORAGE_ERROR', details) || this;
        _this.name = 'StorageError';
        return _this;
    }
    return StorageError;
}(MemoryError));
exports.StorageError = StorageError;
var SearchError = /** @class */ (function (_super) {
    __extends(SearchError, _super);
    function SearchError(message, details) {
        var _this = _super.call(this, message, 'SEARCH_ERROR', details) || this;
        _this.name = 'SearchError';
        return _this;
    }
    return SearchError;
}(MemoryError));
exports.SearchError = SearchError;
exports.DEFAULT_MEMORY_CONFIG = {
    serverUrl: index_1.oneAgentConfig.memoryUrl,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    enableEmbeddings: true,
    embeddingModel: 'gemini',
    qualityThreshold: 0.85,
    constitutionalValidation: true
};
// =====================================
// Utility Functions
// =====================================
/**
 * Generate a unique ID for memory entries
 */
function generateMemoryId() {
    return "mem_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
}
/**
 * Validate a conversation memory object
 */
function validateConversationMemory(conversation) {
    if (!conversation.id)
        throw new ValidationError('Conversation ID is required');
    if (!conversation.agentId)
        throw new ValidationError('Agent ID is required');
    if (!conversation.userId)
        throw new ValidationError('User ID is required');
    if (!conversation.content)
        throw new ValidationError('Content is required');
    if (!conversation.timestamp)
        throw new ValidationError('Timestamp is required');
}
/**
 * Validate a learning memory object
 */
function validateLearningMemory(learning) {
    if (!learning.id)
        throw new ValidationError('Learning ID is required');
    if (!learning.agentId)
        throw new ValidationError('Agent ID is required');
    if (!learning.content)
        throw new ValidationError('Learning content is required');
    if (learning.confidence < 0 || learning.confidence > 1) {
        throw new ValidationError('Confidence must be between 0 and 1');
    }
}
/**
 * Validate a pattern memory object
 */
function validatePatternMemory(pattern) {
    if (!pattern.id)
        throw new ValidationError('Pattern ID is required');
    if (!pattern.agentId)
        throw new ValidationError('Agent ID is required');
    if (!pattern.description)
        throw new ValidationError('Pattern description is required');
    if (pattern.strength < 0 || pattern.strength > 1) {
        throw new ValidationError('Strength must be between 0 and 1');
    }
}
