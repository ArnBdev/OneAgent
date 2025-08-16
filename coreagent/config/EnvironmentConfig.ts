/**
 * EnvironmentConfig.ts - Canonical environment variable accessor
 * Consolidates all environment-derived endpoints (ports, URLs, keys)
 * and prevents scattered process.env usage & localhost literals.
 *
 * Usage (canonical):
 *   import { environmentConfig } from '../config/EnvironmentConfig';
 *   const { memory, mcp } = environmentConfig.endpoints;
 */
import { UnifiedBackboneService } from '../utils/UnifiedBackboneService';

export interface CanonicalEndpointConfig {
  memory: { url: string; port: number };
  mcp: { url: string; port: number; path: string };
  ui: { url: string; port: number };
}

export interface CanonicalEnvironmentConfig {
  endpoints: CanonicalEndpointConfig;
  apiKeys: {
    gemini: string;
    brave: string;
    github: string;
  };
  features: {
    constitutionalAI: boolean;
    memoryEnabled: boolean;
    healthMonitoring: boolean;
  };
}

function currentCfg() {
  return UnifiedBackboneService.getResolvedConfig();
}

export const environmentConfig: CanonicalEnvironmentConfig = {
  get endpoints() {
    return UnifiedBackboneService.getEndpoints();
  },
  get apiKeys() {
    const cfg = currentCfg();
    return {
      gemini: cfg.geminiApiKey,
      brave: cfg.braveApiKey,
      github: cfg.githubToken,
    };
  },
  get features() {
    const cfg = currentCfg();
    return {
      constitutionalAI: cfg.constitutional.enabled,
      memoryEnabled: cfg.memory.enabled,
      healthMonitoring: cfg.healthMonitoringEnabled,
    };
  },
} as unknown as CanonicalEnvironmentConfig;

// Guard utility to assert no hardcoded localhost usages sneak in new code paths
export function assertNoHardcodedLocalhost(value: string, context: string): void {
  if (/localhost|127\.0\.0\.1/gi.test(value)) {
    // Allow only if value matches canonical config value (ensures single source)
    const cfg = UnifiedBackboneService.getResolvedConfig();
    const allowed = [cfg.memoryUrl, cfg.mcpUrl, cfg.uiUrl];
    if (!allowed.includes(value)) {
      throw new Error(
        `[EnvironmentConfig] Non-canonical localhost usage detected in ${context}: ${value}`,
      );
    }
  }
}

export default environmentConfig;
