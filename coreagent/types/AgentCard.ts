/**
 * Canonical AgentCard Interface - Single Source of Truth
 *
 * This is the ONE and ONLY AgentCard interface used throughout OneAgent.
 * All other AgentCard interfaces should be removed and imports redirected here.
 *
 * Supports both A2A Protocol and Registry requirements.
 *
 * INTEGRATED WITH CANONICAL SYSTEMS:
 * - UnifiedBackboneService for temporal metadata
 * - UnifiedTimeService for consistent timestamps
 * - Constitutional AI validation
 */

import {
  UnifiedTimestamp,
  UnifiedMetadata,
  UnifiedTimeService,
  UnifiedMetadataService,
} from './oneagent-backbone-types';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import { environmentConfig } from '../config/EnvironmentConfig';

// =============================================================================
// CANONICAL AGENT CARD INTERFACE
// =============================================================================

// Resolve default A2A protocol version from environment with safe fallback
const DEFAULT_A2A_PROTOCOL_VERSION = (process.env.ONEAGENT_A2A_PROTOCOL_VERSION || '0.2.6').trim();

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
}

export interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
  extensions?: AgentExtension[];
}

export interface AgentExtension {
  uri: string;
  description?: string;
  required?: boolean;
  params?: Record<string, unknown>;
}

export interface SecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  description?: string;
  name?: string;
  in?: string;
  flows?: Record<string, unknown>;
  openIdConnectUrl?: string;
  // A2A v0.3.0 additions
  oauth2MetadataUrl?: string;
}

export interface AgentProvider {
  organization: string;
  url: string;
}

export interface AgentInterface {
  url: string;
  transport: string;
}

// A2A v0.3.0 - Digital signature for agent card verification
export interface AgentCardSignature {
  algorithm: string; // e.g., "RS256", "ES256"
  value: string; // Base64-encoded signature
  keyId?: string; // Optional key identifier
}

/**
 * Canonical AgentCard - ONE interface for all purposes
 *
 * This interface serves both:
 * - A2A Protocol requirements (Google specification)
 * - Registry/Discovery requirements (internal OneAgent)
 * - Legacy compatibility requirements
 */
export interface AgentCard {
  // Core Identity (A2A Protocol required)
  protocolVersion: string;
  name: string; // A2A Protocol uses "name"
  agentId: string; // Registry uses "agentId" - both supported
  displayName?: string; // Optional display name for UI
  description: string;
  version: string;
  url: string;

  // Legacy compatibility fields
  agentType: string; // Legacy field for agent type classification

  // Status and Health (Registry required)
  status: 'active' | 'inactive' | 'pending' | 'retired' | 'error';
  health: 'healthy' | 'degraded' | 'offline' | 'error';
  lastHeartbeat: number;

  // CANONICAL BACKBONE INTEGRATION
  // Unified temporal metadata using UnifiedTimestamp
  createdAt: UnifiedTimestamp; // Creation time with full context
  updatedAt: UnifiedTimestamp; // Last update with context
  lastAccessedAt?: UnifiedTimestamp; // Last access time

  // Unified metadata for traceability and intelligence
  metadata: UnifiedMetadata; // Full metadata with constitutional compliance

  // Capabilities (hybrid approach for compatibility)
  capabilities: AgentCapabilities; // A2A Protocol format
  capabilityList?: string[]; // Registry format (auto-generated)

  // Skills (hybrid approach for compatibility)
  skills: AgentSkill[]; // A2A Protocol format (required)
  skillList?: string[]; // Registry format (auto-generated)

  // Transport and Communication (A2A Protocol)
  preferredTransport?: string;
  additionalInterfaces?: AgentInterface[];
  defaultInputModes: string[];
  defaultOutputModes: string[];

  // Security (A2A Protocol)
  securitySchemes?: { [scheme: string]: SecurityScheme };
  security?: { [scheme: string]: string[] }[];
  supportsAuthenticatedExtendedCard?: boolean;

  // A2A v0.3.0 additions
  oauth2MetadataUrl?: string; // OAuth2 metadata discovery endpoint
  signatures?: AgentCardSignature[]; // Digital signatures for verification

  // Registry-specific fields
  qualityScore?: number;
  endpoint?: string;
  loadLevel?: number;
  lastSeen?: Date;

  // Provider and Documentation (A2A Protocol)
  provider?: AgentProvider;
  iconUrl?: string;
  documentationUrl?: string;

  // Flexible additional data
  credentials?: Record<string, unknown>;
  authorization?: Record<string, unknown>;
  endpoints?: {
    a2a?: string;
    mcp?: string;
  };
  // NOTE: metadata is now the UnifiedMetadata field above, not a generic Record
}

/**
 * AgentRegistration extends AgentCard with registry-specific fields
 * (For backward compatibility with existing registry code)
 */
export interface AgentRegistration extends AgentCard {
  qualityScore: number; // Override to make required
  endpoint?: string;
  loadLevel?: number;
  lastSeen?: Date;
}

/**
 * AgentFilter for discovery operations
 */
export interface AgentFilter {
  type?: string;
  capability?: string;
  skill?: string;
  health?: string;
  version?: string;
  status?: string;
  credentialsPresent?: boolean;
  authorizationScope?: string;
  [key: string]: unknown;
}

// =============================================================================
// UTILITY FUNCTIONS FOR INTERFACE COMPATIBILITY
// =============================================================================

/**
 * Convert AgentCard to A2A Protocol format
 */
export function toA2AFormat(card: AgentCard): AgentCard {
  return {
    ...card,
    // Ensure A2A required fields are present
    protocolVersion: card.protocolVersion || DEFAULT_A2A_PROTOCOL_VERSION,
    defaultInputModes: card.defaultInputModes || ['text/plain'],
    defaultOutputModes: card.defaultOutputModes || ['text/plain'],
    skills: card.skills || [],
    capabilities: card.capabilities || {},
  };
}

/**
 * Convert AgentCard to Registry format (for backward compatibility)
 */
export function toRegistryFormat(
  card: AgentCard,
): AgentCard & { capabilityList: string[]; skillList: string[] } {
  return {
    ...card,
    capabilityList: card.capabilityList || Object.keys(card.capabilities || {}),
    skillList: card.skillList || (card.skills || []).map((skill) => skill.id),
  };
}

/**
 * Create minimal AgentCard for testing
 * THIS FUNCTION IS DEPRECATED - Use createAgentCard() with backbone service instead
 */
export function createTestAgentCard(overrides: Partial<AgentCard> = {}): AgentCard {
  // WARNING: This is a legacy function that doesn't use canonical backbone
  // For production code, use createAgentCard() with UnifiedBackboneService

  // Create minimal timestamps (NOT canonical)
  const now = createUnifiedTimestamp().unix;
  const basicTimestamp = {
    iso: new Date(now).toISOString(),
    unix: now,
    utc: new Date(now).toISOString(),
    local: new Date(now).toString(),
    timezone: 'UTC',
    context: 'test_context',
    contextual: {
      timeOfDay: 'morning',
      energyLevel: 'medium',
      optimalFor: ['testing'],
    },
    metadata: {
      source: 'TestFunction',
      precision: 'second' as const,
      timezone: 'UTC',
    },
  };

  // Create minimal metadata (NOT canonical)
  const basicMetadata = {
    id: 'test-metadata-id',
    type: 'test_agent',
    version: '1.0.0',
    temporal: {
      created: basicTimestamp,
      updated: basicTimestamp,
      contextSnapshot: {
        timeOfDay: 'morning',
        dayOfWeek: 'monday',
        businessContext: false,
        energyContext: 'medium',
      },
    },
    system: {
      source: 'test_system',
      component: 'test_component',
      agent: 'test-agent',
    },
    quality: {
      score: 85,
      constitutionalCompliant: true,
      validationLevel: 'basic' as const,
      confidence: 0.85,
    },
    content: {
      category: 'test',
      tags: ['test', 'agent'],
      sensitivity: 'internal' as const,
      relevanceScore: 0.8,
      contextDependency: 'session' as const,
    },
    relationships: {
      children: [],
      related: [],
      dependencies: [],
    },
    analytics: {
      accessCount: 0,
      lastAccessPattern: 'created',
      usageContext: [],
    },
  };

  return {
    protocolVersion: DEFAULT_A2A_PROTOCOL_VERSION,
    name: 'TestAgent',
    agentId: 'test-agent-id',
    agentType: 'test',
    description: 'Test agent for development',
    version: '1.0.0',
    url: environmentConfig.endpoints.ui.url,
    status: 'active',
    health: 'healthy',
    lastHeartbeat: now,

    // Required canonical fields
    createdAt: basicTimestamp,
    updatedAt: basicTimestamp,
    metadata: basicMetadata,

    capabilities: {},
    skills: [],
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    ...overrides,
  };
}

/**
 * Create AgentCard with canonical backbone integration
 * Uses UnifiedBackboneService for proper temporal metadata
 */
export async function createAgentCard(
  config: {
    name: string;
    agentId: string;
    agentType: string;
    description: string;
    version?: string;
    url?: string;
    capabilities?: AgentCapabilities;
    skills?: AgentSkill[];
    status?: 'active' | 'inactive' | 'pending' | 'retired' | 'error';
    health?: 'healthy' | 'degraded' | 'offline' | 'error';
  },
  backboneService: {
    timeService: UnifiedTimeService;
    metadataService: UnifiedMetadataService;
  },
): Promise<AgentCard> {
  const timestamp = backboneService.timeService.now();

  // Create unified metadata for the agent (await if async)
  // If create is async, await it; otherwise, use directly
  const metadata: UnifiedMetadata = await backboneService.metadataService.create(
    'agent_card',
    'agent_system',
    {
      content: {
        category: 'agent',
        tags: [`agent:${config.agentId}`, `type:${config.agentType}`],
        sensitivity: 'internal' as const,
        relevanceScore: 0.9,
        contextDependency: 'global' as const,
      },
      system: {
        source: 'agent_system',
        component: 'agent_registry',
        agent: {
          id: config.agentId,
          type: config.agentType,
        },
      },
    },
  );

  return {
    protocolVersion: DEFAULT_A2A_PROTOCOL_VERSION,
    name: config.name,
    agentId: config.agentId,
    agentType: config.agentType,
    description: config.description,
    version: config.version || '1.0.0',
    url: config.url || '',
    status: config.status || 'active',
    health: config.health || 'healthy',
    lastHeartbeat: timestamp.unix,

    // CANONICAL BACKBONE INTEGRATION
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: metadata,

    capabilities: config.capabilities || {},
    skills: config.skills || [],
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['text/plain', 'application/json'],
  };
}

/**
 * Update AgentCard with canonical backbone integration
 * Properly updates temporal metadata and maintains traceability
 */
export async function updateAgentCard(
  existing: AgentCard,
  updates: Partial<AgentCard>,
  backboneService: {
    timeService: UnifiedTimeService;
    metadataService: UnifiedMetadataService;
  },
): Promise<AgentCard> {
  const timestamp = backboneService.timeService.now();

  // Update unified metadata (await if async)
  const updatedMetadata: UnifiedMetadata = await backboneService.metadataService.update(
    existing.metadata.id,
    {
      temporal: {
        ...existing.metadata.temporal,
        updated: timestamp,
      },
    },
  );

  return {
    ...existing,
    ...updates,
    updatedAt: timestamp,
    metadata: updatedMetadata,
    lastHeartbeat: timestamp.unix,
  };
}
