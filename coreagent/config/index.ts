/**
 * OneAgent Canonical Configuration
 *
 * SINGLE SOURCE OF TRUTH for all server configuration values.
 *
 * IMPORTANT: All config access MUST go through UnifiedBackboneService.config.
 * Do NOT import oneAgentConfig or ServerConfig directly from this file in any system code.
 *
 * Example (canonical):
 *   import { UnifiedBackboneService } from '../utils/UnifiedBackboneService';
 *   const config = UnifiedBackboneService.config;
 *
 * This file is ONLY to be imported by UnifiedBackboneService.
 *
 * Direct imports are non-canonical and will be removed in future.
 */

import { config } from 'dotenv';
import * as path from 'path';
import type { ConstitutionalPrinciple } from '../types/oneagent-backbone-types';

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

  // Constitutional AI Configuration
  constitutional: {
    enabled: boolean;
    principles: ConstitutionalPrinciple[];
    qualityThreshold: number;
  };

  // Memory Configuration
  memory: {
    enabled: boolean;
    provider: string;
    config: Record<string, unknown>;
  };

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

  // Feature Flags
  features: {
    enableGraphEnrichment: boolean;
    enableHybridSearch?: boolean;
  };

  // Optional Memgraph (Graph DB) Configuration
  memgraph?: {
    enabled: boolean;
    url: string;
    username?: string;
    password?: string;
    database?: string;
    driver?: 'neo4j' | 'memgraph';
  };

  // Hybrid Search configuration (Phase A)
  hybridSearch?: {
    enabled?: boolean; // master switch in addition to features.enableHybridSearch
    limit?: number; // default max results
    graphHopDepth?: number; // future: path expansion depth (unused in MVP)
    weights?: {
      vector?: number; // weight for vector results
      graph?: number; // weight for graph results
      recency?: number; // reserved for future
    };
  };
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
  memoryPort: parseInt(process.env.ONEAGENT_MEMORY_PORT || '8010', 10),
  memoryUrl:
    process.env.ONEAGENT_MEMORY_URL ||
    `http://${process.env.MEMORY_HOST || process.env.ONEAGENT_HOST || '127.0.0.1'}:${parseInt(
      process.env.ONEAGENT_MEMORY_PORT || '8010',
      10,
    )}/mcp`,

  // MCP Server Configuration
  mcpPort: parseInt(process.env.ONEAGENT_MCP_PORT || '8083', 10),
  mcpUrl:
    process.env.ONEAGENT_MCP_URL ||
    `http://${process.env.ONEAGENT_HOST || '127.0.0.1'}:${parseInt(
      process.env.ONEAGENT_MCP_PORT || '8083',
      10,
    )}`,

  // Constitutional AI Configuration
  constitutional: {
    enabled: process.env.ONEAGENT_CONSTITUTIONAL_ENABLED !== 'false',
    principles: [
      {
        id: 'accuracy',
        name: 'Accuracy',
        description: 'Provide accurate and factual information',
        category: 'accuracy' as const,
        weight: 1.0,
        isViolated: false,
        confidence: 0.9,
        validationRule: 'no_speculation',
        severityLevel: 'high' as const,
      },
      {
        id: 'transparency',
        name: 'Transparency',
        description: 'Be transparent about limitations and reasoning',
        category: 'transparency' as const,
        weight: 0.8,
        isViolated: false,
        confidence: 0.9,
        validationRule: 'explain_reasoning',
        severityLevel: 'medium' as const,
      },
      {
        id: 'helpfulness',
        name: 'Helpfulness',
        description: 'Provide helpful and actionable guidance',
        category: 'helpfulness' as const,
        weight: 0.9,
        isViolated: false,
        confidence: 0.8,
        validationRule: 'actionable_response',
        severityLevel: 'medium' as const,
      },
      {
        id: 'safety',
        name: 'Safety',
        description: 'Avoid harmful or dangerous recommendations',
        category: 'safety' as const,
        weight: 1.0,
        isViolated: false,
        confidence: 0.95,
        validationRule: 'harm_prevention',
        severityLevel: 'critical' as const,
      },
    ],
    qualityThreshold: parseFloat(process.env.ONEAGENT_QUALITY_THRESHOLD || '0.8'),
  },

  // Memory Configuration
  memory: {
    enabled: process.env.ONEAGENT_MEMORY_ENABLED !== 'false',
    provider: process.env.ONEAGENT_MEMORY_PROVIDER || 'mem0',
    config: {
      endpoint: process.env.ONEAGENT_MEMORY_URL || 'http://127.0.0.1:8001',
      apiKey: process.env.ONEAGENT_MEMORY_API_KEY || '',
    },
  },

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
  uiUrl:
    process.env.ONEAGENT_UI_URL ||
    `http://${process.env.ONEAGENT_HOST || '127.0.0.1'}:${parseInt(
      process.env.ONEAGENT_UI_PORT || '8080',
      10,
    )}`,
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

  // Feature Flags (default on; set ONEAGENT_FEATURE_GRAPH_ENRICHMENT=false to disable)
  features: {
    enableGraphEnrichment: process.env.ONEAGENT_FEATURE_GRAPH_ENRICHMENT !== 'false',
    // Hybrid search default enabled (can be disabled via ONEAGENT_FEATURE_HYBRID_SEARCH=false)
    enableHybridSearch: process.env.ONEAGENT_FEATURE_HYBRID_SEARCH !== 'false',
  },

  // Memgraph Configuration (optional)
  memgraph: {
    enabled: process.env.MEMGRAPH_URL ? true : false,
    url: process.env.MEMGRAPH_URL || 'bolt://localhost:7687',
    username: process.env.MEMGRAPH_USERNAME || process.env.MEMGRAPH_USER || '',
    password: process.env.MEMGRAPH_PASSWORD || '',
    database: process.env.MEMGRAPH_DATABASE || undefined,
    driver: (process.env.MEMGRAPH_DRIVER as 'neo4j' | 'memgraph' | undefined) || 'neo4j',
  },

  // Hybrid Search defaults
  hybridSearch: {
    enabled: process.env.ONEAGENT_FEATURE_HYBRID_SEARCH !== 'false',
    limit: parseInt(process.env.ONEAGENT_HYBRID_SEARCH_LIMIT || '10', 10),
    graphHopDepth: parseInt(process.env.ONEAGENT_HYBRID_GRAPH_HOPS || '1', 10),
    weights: {
      vector: parseFloat(process.env.ONEAGENT_HYBRID_WEIGHT_VECTOR || '0.6'),
      graph: parseFloat(process.env.ONEAGENT_HYBRID_WEIGHT_GRAPH || '0.4'),
      recency: parseFloat(process.env.ONEAGENT_HYBRID_WEIGHT_RECENCY || '0.0'),
    },
  },
};

/**
 * Legacy configuration for backward compatibility
 * @deprecated Use UnifiedBackboneService.config instead. This function is for legacy code only.
 */
export function getDefaultMemoryConfig(config: ServerConfig) {
  return {
    serverUrl: config.memoryUrl,
    port: config.memoryPort,
    host: config.host,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
  };
}

/**
 * Validate that required configuration values are present
 * @param config The canonical config object (pass UnifiedBackboneService.config)
 */
export function validateConfig(config: ServerConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config.geminiApiKey) {
    errors.push('GEMINI_API_KEY is required but not set');
  }
  if (config.memoryPort < 1 || config.memoryPort > 65535) {
    errors.push('ONEAGENT_MEMORY_PORT must be a valid port number');
  }
  if (config.mcpPort < 1 || config.mcpPort > 65535) {
    errors.push('ONEAGENT_MCP_PORT must be a valid port number');
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration summary for debugging
 * @param config The canonical config object (pass UnifiedBackboneService.config)
 */
export function getConfigSummary(config: ServerConfig): string {
  return `OneAgent Configuration:
  Environment: ${config.environment}
  Memory Server: ${config.memoryUrl}
  MCP Server: ${config.mcpUrl}
  UI Server: ${config.uiUrl}
  Memory Storage: ${config.memoryStoragePath}
  API Keys: ${config.geminiApiKey ? 'Gemini ✓' : 'Gemini ✗'} ${config.braveApiKey ? 'Brave ✓' : 'Brave ✗'}`;
}

/**
 * @deprecated DO NOT import config directly. Use UnifiedBackboneService.config instead.
 *
 * Canonical usage:
 *   import { UnifiedBackboneService } from '../utils/UnifiedBackboneService';
 *   const config = UnifiedBackboneService.config;
 *
 * Direct import of this file is forbidden and will throw at runtime in future.
 */

if (
  typeof require !== 'undefined' &&
  require.main !== module &&
  module &&
  module.parent &&
  module.parent.filename &&
  /config[\\]index\.ts$/.test(module.parent.filename)
) {
  throw new Error(
    '[OneAgent] Non-canonical config import detected! All config access must go through UnifiedBackboneService.config.',
  );
}

// No default export: all config access must be via UnifiedBackboneService.config
