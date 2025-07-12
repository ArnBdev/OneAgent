/**
 * OneAgent Centralized Configuration
 * 
 * Single source of truth for all server configurations.
 * Reads from .env file and provides type-safe access to configuration values.
 * 
 * This eliminates hardcoded ports and URLs throughout the codebase.
 */

import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
// Use relative path from project root
config({ path: path.join(process.cwd(), '.env') });

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
  
  // A2A Protocol Configuration
  a2aProtocolVersion: string;
  a2aBaseUrl: string;
  a2aWellKnownPath: string;
  a2aTransport: string;
  a2aSecurityEnabled: boolean;
  a2aDiscoveryEnabled: boolean;
  a2aPushNotifications: boolean;
  a2aStreamingEnabled: boolean;
  a2aStateHistory: boolean;
  
  // UI Server
  uiPort: number;
  uiUrl: string;
    // API Keys
  geminiApiKey: string;
  braveApiKey: string;
  githubToken: string;
    // OURA v3.0 Configuration
  legacyAutoRegistrationDisabled: boolean;
  broadcastDiscoveryDisabled: boolean;
  unifiedRegistryEnabled: boolean;
  constitutionalAIRequired: boolean;
  minimumQualityScore: number;
  requireVersioning: boolean;
  memoryFirstArchitecture: boolean;
  healthMonitoringEnabled: boolean;
  
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
  
  // A2A Protocol Configuration
  a2aProtocolVersion: process.env.ONEAGENT_A2A_PROTOCOL_VERSION || '0.2.5',
  a2aBaseUrl: process.env.ONEAGENT_A2A_BASE_URL || 'http://127.0.0.1:8083/a2a',
  a2aWellKnownPath: process.env.ONEAGENT_A2A_WELL_KNOWN_PATH || '/.well-known/agent.json',
  a2aTransport: process.env.ONEAGENT_A2A_TRANSPORT || 'JSONRPC',
  a2aSecurityEnabled: process.env.ONEAGENT_A2A_SECURITY_ENABLED === 'true',
  a2aDiscoveryEnabled: process.env.ONEAGENT_A2A_DISCOVERY_ENABLED === 'true',
  a2aPushNotifications: process.env.ONEAGENT_A2A_PUSH_NOTIFICATIONS === 'true',
  a2aStreamingEnabled: process.env.ONEAGENT_A2A_STREAMING_ENABLED === 'true',
  a2aStateHistory: process.env.ONEAGENT_A2A_STATE_HISTORY === 'true',
  
  // UI Server Configuration
  uiPort: parseInt(process.env.ONEAGENT_UI_PORT || '8080', 10),
  uiUrl: process.env.ONEAGENT_UI_URL || 'http://127.0.0.1:8080',
    // API Keys
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  braveApiKey: process.env.BRAVE_API_KEY || '',
  githubToken: process.env.GITHUB_TOKEN || '',
    // OURA v3.0 Configuration
  legacyAutoRegistrationDisabled: process.env.OURA_V3_LEGACY_AUTOREGISTER_DISABLED === 'true',
  broadcastDiscoveryDisabled: process.env.OURA_V3_BROADCAST_DISCOVERY_DISABLED === 'true',
  unifiedRegistryEnabled: process.env.OURA_V3_UNIFIED_REGISTRY_ENABLED === 'true',
  constitutionalAIRequired: process.env.OURA_V3_CONSTITUTIONAL_AI_REQUIRED === 'true',
  minimumQualityScore: parseInt(process.env.OURA_V3_MINIMUM_QUALITY_SCORE || '80', 10),
  requireVersioning: process.env.OURA_V3_REQUIRE_VERSIONING === 'true',
  memoryFirstArchitecture: process.env.OURA_V3_MEMORY_FIRST_ARCHITECTURE === 'true',
  healthMonitoringEnabled: process.env.OURA_V3_HEALTH_MONITORING_ENABLED === 'true',
  
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
