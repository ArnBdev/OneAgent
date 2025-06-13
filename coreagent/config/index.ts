/**
 * OneAgent Centralized Configuration
 * 
 * Single source of truth for all server configurations.
 * Reads from .env file and provides type-safe access to configuration values.
 * 
 * This eliminates hardcoded ports and URLs throughout the codebase.
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: path.join(__dirname, '..', '.env') });

export interface ServerConfig {
  // Core Configuration
  environment: string;
  host: string;
  
  // Memory Server
  memoryPort: number;
  memoryUrl: string;
  
  // MCP Server  
  mcpPort: number;
  mcpUrl: string;
  
  // UI Server
  uiPort: number;
  uiUrl: string;
  
  // API Keys
  geminiApiKey: string;
  braveApiKey: string;
  githubToken: string;
  
  // Memory Storage
  memoryStoragePath: string;
  memoryCollection: string;
  memoryMaxPerUser: number;
  memorySimilarityThreshold: number;
  
  // Supabase
  supabaseUrl: string;
}

/**
 * OneAgent Server Configuration
 * All server URLs, ports, and settings are centralized here
 */
export const oneAgentConfig: ServerConfig = {
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
export const DEFAULT_MEMORY_CONFIG = {
  serverUrl: oneAgentConfig.memoryUrl,
  port: oneAgentConfig.memoryPort,
  host: oneAgentConfig.host,
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000,
};

/**
 * Validate that required configuration values are present
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!oneAgentConfig.geminiApiKey) {
    errors.push('GEMINI_API_KEY is required but not set');
  }
  
  if (oneAgentConfig.memoryPort < 1 || oneAgentConfig.memoryPort > 65535) {
    errors.push('ONEAGENT_MEMORY_PORT must be a valid port number');
  }
  
  if (oneAgentConfig.mcpPort < 1 || oneAgentConfig.mcpPort > 65535) {
    errors.push('ONEAGENT_MCP_PORT must be a valid port number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get configuration summary for debugging
 */
export function getConfigSummary(): string {
  return `OneAgent Configuration:
  Environment: ${oneAgentConfig.environment}
  Memory Server: ${oneAgentConfig.memoryUrl}
  MCP Server: ${oneAgentConfig.mcpUrl}
  UI Server: ${oneAgentConfig.uiUrl}
  Memory Storage: ${oneAgentConfig.memoryStoragePath}
  API Keys: ${oneAgentConfig.geminiApiKey ? 'Gemini ✓' : 'Gemini ✗'} ${oneAgentConfig.braveApiKey ? 'Brave ✓' : 'Brave ✗'}`;
}

export default oneAgentConfig;
