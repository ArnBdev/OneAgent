/**
 * UnifiedConfigProvider.ts
 * Canonical layered configuration provider (Phase 1)
 *
 * Layers (highest precedence last):
 *   1. Base (oneAgentConfig) - loaded from env / .env (single source of truth)
 *   2. Runtime Overrides (applyRuntimeOverride)
 *   3. Scoped Overrides (applyScopedOverride(scope, patch))
 *
 * Features (Phase 1 scope):
 *   - Layered resolution (shallow merge per top-level key)
 *   - Scoped override management (add / clear)
 *   - Runtime override patching
 *   - Freeze semantics (immutable after freeze except read operations)
 *   - Hash generation (change detection)
 *   - Monitoring events (operation_metric) for load / override / freeze
 *   - Canonical ID & timestamp usage via UnifiedBackboneService helpers
 *
 * Constitutional AI Principles:
 *   - Accuracy: Does not fabricate values; only merges supplied patches onto canonical base.
 *   - Transparency: All mutating operations emit monitoring events with operation & scope metadata.
 *   - Helpfulness: Provides getHash() for quick change detection & diagnostics.
 *   - Safety: Freeze prevents mutation during critical operation windows (deployment, audit).
 */
import crypto from 'crypto';
import { oneAgentConfig, type ServerConfig } from './index';
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';
import { createUnifiedId, createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

type PartialConfig = Partial<ServerConfig>;

export interface ConfigMutationMeta {
  reason?: string;
  actor?: string; // component / system initiating change
  scope?: string; // for scoped overrides
}

export interface UnifiedConfigSnapshot {
  config: ServerConfig;
  hash: string;
  frozen: boolean;
  generatedAt: string; // ISO timestamp
}

// Shallow merge helper accepting specific server config shape without requiring index signature
// Returns a widened any-typed object then cast back to T to satisfy compiler (safe for Phase 1 shallow merges)
type GenericRecord = { [key: string]: unknown };
function shallowMerge<T extends object>(base: T, patch?: Partial<T>): T {
  if (!patch) return base;
  const result: GenericRecord = { ...(base as GenericRecord) };
  const patchRec = patch as GenericRecord;
  for (const k of Object.keys(patchRec)) {
    const v = patchRec[k];
    if (typeof v === 'undefined') continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const existing =
        result[k] && typeof result[k] === 'object' && !Array.isArray(result[k])
          ? (result[k] as GenericRecord)
          : {};
      result[k] = { ...existing, ...(v as GenericRecord) };
    } else {
      result[k] = v;
    }
  }
  return result as T;
}

class UnifiedConfigProviderImpl {
  private base: ServerConfig;
  private runtimeOverrides: PartialConfig = {};
  /**
   * ARCHITECTURAL EXCEPTION: This Map is used for ephemeral configuration overrides.
   * It is NOT a persistent cache and is cleared on restart. Allowed for config management.
   */
  // eslint-disable-next-line oneagent/no-parallel-cache
  private scopedOverrides: Map<string, PartialConfig> = new Map();
  private frozen = false;
  private initialized = false;
  private lastHash = '';

  constructor() {
    this.base = oneAgentConfig; // single source baseline
    this.emitOp('config_load', 'success', { environment: this.base.environment });
    this.initialized = true;
    this.lastHash = this.computeHash();
  }

  /** Ensure provider initialized (idempotent) */
  ensureInitialized(): void {
    if (!this.initialized) {
      this.base = oneAgentConfig;
      this.initialized = true;
      this.emitOp('config_load', 'success', { environment: this.base.environment, lateInit: true });
      this.lastHash = this.computeHash();
    }
  }

  /** Get resolved configuration (base + runtime + scoped) */
  getConfig(): ServerConfig {
    this.ensureInitialized();
    // Merge order: base -> runtime override -> each scoped override in insertion order (later scopes override earlier)
    let resolved: ServerConfig = { ...this.base };
    resolved = shallowMerge(resolved, this.runtimeOverrides);
    for (const [, patch] of this.scopedOverrides) {
      resolved = shallowMerge(resolved, patch);
    }
    return resolved;
  }

  /** Apply a runtime (global) override */
  applyRuntimeOverride(patch: PartialConfig, meta: ConfigMutationMeta = {}): void {
    this.mutationGuard('runtime override');
    this.runtimeOverrides = shallowMerge(this.runtimeOverrides, patch);
    this.updateHashAndEmit('config_runtime_override', patch, meta);
  }

  /** Apply / merge a scoped override */
  applyScopedOverride(scope: string, patch: PartialConfig, meta: ConfigMutationMeta = {}): void {
    this.mutationGuard(`scoped override:${scope}`);
    const existing = this.scopedOverrides.get(scope) || {};
    this.scopedOverrides.set(scope, shallowMerge(existing, patch));
    this.updateHashAndEmit('config_scoped_override', patch, { ...meta, scope });
  }

  /** Clear a scoped override */
  clearScopedOverride(scope: string, meta: ConfigMutationMeta = {}): void {
    this.mutationGuard(`clear scoped override:${scope}`);
    if (this.scopedOverrides.has(scope)) {
      this.scopedOverrides.delete(scope);
      this.updateHashAndEmit('config_scoped_override_clear', {}, { ...meta, scope });
    }
  }

  /** Freeze configuration to prevent further mutation */
  freezeConfig(reason?: string): void {
    if (this.frozen) return; // idempotent
    this.frozen = true;
    this.emitOp('config_freeze', 'success', { reason });
  }

  /** Test-only reset (fast test mode). Clears overrides & unfreezes for deterministic hash/order tests */
  /* istanbul ignore next */
  resetForTest(reason = 'reset'): void {
    if (process.env.ONEAGENT_FAST_TEST_MODE !== '1') {
      throw new Error('resetForTest only allowed in fast test mode');
    }
    this.runtimeOverrides = {};
    this.scopedOverrides.clear();
    this.frozen = false;
    this.updateHashAndEmit('config_test_reset', {}, { reason });
  }

  /** Whether config is frozen */
  isFrozen(): boolean {
    return this.frozen;
  }

  /** Produce stable hash of resolved config (ignores volatile keys if needed) */
  getHash(): string {
    return this.lastHash;
  }

  /** Get full snapshot */
  getSnapshot(): UnifiedConfigSnapshot {
    const cfg = this.getConfig();
    return {
      config: cfg,
      hash: this.getHash(),
      frozen: this.frozen,
      generatedAt: createUnifiedTimestamp().iso,
    };
  }

  // ================== Internal helpers ==================
  private mutationGuard(context: string): void {
    if (this.frozen) {
      this.emitOp('config_mutation_blocked', 'warning', { context });
      throw new Error(`[UnifiedConfigProvider] Mutation blocked (frozen) during ${context}`);
    }
  }

  private computeHash(): string {
    const resolved = this.getConfig();
    const json = JSON.stringify(resolved, Object.keys(resolved).sort());
    return crypto.createHash('sha256').update(json).digest('hex').slice(0, 32); // 128-bit truncated
  }

  private updateHashAndEmit(
    operation: string,
    patch: PartialConfig,
    meta: ConfigMutationMeta,
  ): void {
    const oldHash = this.lastHash;
    this.lastHash = this.computeHash();
    this.emitOp(operation, 'success', {
      oldHash,
      newHash: this.lastHash,
      changed: oldHash !== this.lastHash,
      patch,
      ...meta,
    });
  }

  private emitOp(
    operation: string,
    status: 'success' | 'error' | 'warning',
    meta: Record<string, unknown>,
  ): void {
    try {
      unifiedMonitoringService.trackOperation(
        'UnifiedConfigProvider',
        operation,
        status === 'success' ? 'success' : 'error',
        {
          ...meta,
          // Use existing canonical id type category 'operation' to avoid introducing new IdType category prematurely
          operationId: createUnifiedId('operation', operation),
        },
      );
    } catch {
      // Swallow to avoid config access failures if monitoring disabled
    }
  }
}

export const UnifiedConfigProvider = new UnifiedConfigProviderImpl();
export type UnifiedConfigProviderType = UnifiedConfigProviderImpl;

// Register on globalThis for lazy, circular-safe access from UnifiedBackboneService without dynamic require
try {
  (
    globalThis as unknown as { __unifiedConfigProvider?: UnifiedConfigProviderType }
  ).__unifiedConfigProvider = UnifiedConfigProvider;
} catch {
  // ignore if global assignment fails
}

// Canonical access helper (future code should use backbone wrapper once integrated)
export function getUnifiedConfig(): ServerConfig {
  return UnifiedConfigProvider.getConfig();
}
