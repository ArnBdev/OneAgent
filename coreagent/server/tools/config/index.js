"use strict";
/**
 * OneAgent Centralized Configuration
 *
 * Single source of truth for all server configurations.
 * Reads from .env file and provides type-safe access to configuration values.
 *
 * This eliminates hardcoded ports and URLs throughout the codebase.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MEMORY_CONFIG = exports.oneAgentConfig = void 0;
exports.validateConfig = validateConfig;
exports.getConfigSummary = getConfigSummary;
var dotenv_1 = require("dotenv");
var path_1 = require("path");
// Load environment variables from .env file
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, '..', '.env') });
/**
 * OneAgent Server Configuration
 * All server URLs, ports, and settings are centralized here
 */
exports.oneAgentConfig = {
    // Core Configuration
    environment: process.env.ONEAGENT_ENV || 'development',
    host: process.env.ONEAGENT_HOST || '127.0.0.1',
    // Memory Server Configuration
    memoryPort: parseInt(process.env.ONEAGENT_MEMORY_PORT || '8001', 10),
    memoryUrl: process.env.ONEAGENT_MEMORY_URL || 'http://127.0.0.1:8001',
    // MCP Server Configuration  
    mcpPort: parseInt(process.env.ONEAGENT_MCP_PORT || '8083', 10),
    mcpUrl: process.env.ONEAGENT_MCP_URL || 'http://127.0.0.1:8083',
    // UI Server Configuration
    uiPort: parseInt(process.env.ONEAGENT_UI_PORT || '8080', 10),
    uiUrl: process.env.ONEAGENT_UI_URL || 'http://127.0.0.1:8080',
    // API Keys
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    braveApiKey: process.env.BRAVE_API_KEY || '',
    githubToken: process.env.GITHUB_TOKEN || '',
    // Memory Storage Configuration
    memoryStoragePath: process.env.MEMORY_STORAGE_PATH || './oneagent_unified_memory',
    memoryCollection: process.env.MEMORY_COLLECTION || 'oneagent_memories',
    memoryMaxPerUser: parseInt(process.env.MEMORY_MAX_PER_USER || '10000', 10),
    memorySimilarityThreshold: parseFloat(process.env.MEMORY_SIMILARITY_THRESHOLD || '0.7'),
    // Supabase Configuration
    supabaseUrl: process.env.SUPABASE_URL || '',
};
/**
 * Legacy configuration for backward compatibility
 * @deprecated Use oneAgentConfig instead
 */
exports.DEFAULT_MEMORY_CONFIG = {
    serverUrl: exports.oneAgentConfig.memoryUrl,
    port: exports.oneAgentConfig.memoryPort,
    host: exports.oneAgentConfig.host,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
};
/**
 * Validate that required configuration values are present
 */
function validateConfig() {
    var errors = [];
    if (!exports.oneAgentConfig.geminiApiKey) {
        errors.push('GEMINI_API_KEY is required but not set');
    }
    if (exports.oneAgentConfig.memoryPort < 1 || exports.oneAgentConfig.memoryPort > 65535) {
        errors.push('ONEAGENT_MEMORY_PORT must be a valid port number');
    }
    if (exports.oneAgentConfig.mcpPort < 1 || exports.oneAgentConfig.mcpPort > 65535) {
        errors.push('ONEAGENT_MCP_PORT must be a valid port number');
    }
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}
/**
 * Get configuration summary for debugging
 */
function getConfigSummary() {
    return "OneAgent Configuration:\n  Environment: ".concat(exports.oneAgentConfig.environment, "\n  Memory Server: ").concat(exports.oneAgentConfig.memoryUrl, "\n  MCP Server: ").concat(exports.oneAgentConfig.mcpUrl, "\n  UI Server: ").concat(exports.oneAgentConfig.uiUrl, "\n  Memory Storage: ").concat(exports.oneAgentConfig.memoryStoragePath, "\n  API Keys: ").concat(exports.oneAgentConfig.geminiApiKey ? 'Gemini ✓' : 'Gemini ✗', " ").concat(exports.oneAgentConfig.braveApiKey ? 'Brave ✓' : 'Brave ✗');
}
exports.default = exports.oneAgentConfig;
