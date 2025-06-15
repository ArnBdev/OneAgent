"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MEMORY_CONFIG = exports.SearchError = exports.StorageError = exports.ValidationError = exports.MemoryError = void 0;
exports.generateMemoryId = generateMemoryId;
exports.validateConversationMemory = validateConversationMemory;
exports.validateLearningMemory = validateLearningMemory;
exports.validatePatternMemory = validatePatternMemory;
const index_1 = require("../config/index");
// =====================================
// Error Types
// =====================================
class MemoryError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'MemoryError';
    }
}
exports.MemoryError = MemoryError;
class ValidationError extends MemoryError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class StorageError extends MemoryError {
    constructor(message, details) {
        super(message, 'STORAGE_ERROR', details);
        this.name = 'StorageError';
    }
}
exports.StorageError = StorageError;
class SearchError extends MemoryError {
    constructor(message, details) {
        super(message, 'SEARCH_ERROR', details);
        this.name = 'SearchError';
    }
}
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
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
