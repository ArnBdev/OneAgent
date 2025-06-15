/**
 * ServerConfig.ts - Centralized Configuration Management
 * 
 * Loads all configuration from .env file to eliminate hardcoded values
 * and provide single source of truth for all server settings.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface ServerConfiguration {
  // MCP Server Configuration
  mcp: {
    port: number;
    host: string;
    jsonRpcPath: string;
  };
  
  // Memory Server Configuration
  memory: {
    host: string;
    port: number;
    storagePath: string;
    collection: string;
    maxPerUser: number;
    similarityThreshold: number;
  };
  
  // AI Configuration
  ai: {
    geminiApiKey?: string;
    enableEmbeddings: boolean;
  };
  
  // Logging Configuration
  logging: {
    level: string;
    logFile?: string;
  };
  
  // Quality Configuration
  quality: {
    minimumScore: number;
    constitutionalCompliance: number;
    performanceTarget: number;
  };
}

/**
 * Load and validate configuration from environment variables
 */
export function loadServerConfig(): ServerConfiguration {
  const config: ServerConfiguration = {
    mcp: {
      port: parseInt(process.env.MCP_PORT || '8083', 10),
      host: process.env.MCP_HOST || '127.0.0.1',
      jsonRpcPath: process.env.MCP_JSON_RPC_PATH || '/mcp'
    },
    
    memory: {
      host: process.env.MEMORY_HOST || '127.0.0.1', 
      port: parseInt(process.env.MEMORY_PORT || '8000', 10),
      storagePath: process.env.MEMORY_STORAGE_PATH || '../oneagent_gemini_memory',
      collection: process.env.MEMORY_COLLECTION || 'oneagent_memories',
      maxPerUser: parseInt(process.env.MEMORY_MAX_PER_USER || '10000', 10),
      similarityThreshold: parseFloat(process.env.MEMORY_SIMILARITY_THRESHOLD || '0.7')
    },
      ai: {
      ...(process.env.GEMINI_API_KEY && { geminiApiKey: process.env.GEMINI_API_KEY }),
      enableEmbeddings: process.env.ENABLE_EMBEDDINGS !== 'false'
    },
    
    logging: {
      level: process.env.LOG_LEVEL || 'INFO',
      ...(process.env.MEMORY_LOG_FILE && { logFile: process.env.MEMORY_LOG_FILE })
    },
    
    quality: {
      minimumScore: parseInt(process.env.QUALITY_MINIMUM_SCORE || '80', 10),
      constitutionalCompliance: parseInt(process.env.CONSTITUTIONAL_COMPLIANCE || '100', 10),
      performanceTarget: parseInt(process.env.PERFORMANCE_TARGET || '85', 10)
    }
  };
  
  // Validate required configuration
  validateConfig(config);
  
  return config;
}

/**
 * Validate that required configuration values are present
 */
function validateConfig(config: ServerConfiguration): void {
  const errors: string[] = [];
  
  if (!config.mcp.port || config.mcp.port < 1 || config.mcp.port > 65535) {
    errors.push('Invalid MCP_PORT: must be between 1 and 65535');
  }
  
  if (!config.memory.port || config.memory.port < 1 || config.memory.port > 65535) {
    errors.push('Invalid MEMORY_PORT: must be between 1 and 65535');
  }
  
  if (config.ai.enableEmbeddings && !config.ai.geminiApiKey) {
    console.warn('WARNING: GEMINI_API_KEY not set but embeddings are enabled');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Export singleton instance
export const serverConfig = loadServerConfig();

// Export individual config sections for convenience
export const mcpConfig = serverConfig.mcp;
export const memoryConfig = serverConfig.memory;
export const aiConfig = serverConfig.ai;
export const loggingConfig = serverConfig.logging;
export const qualityConfig = serverConfig.quality;
