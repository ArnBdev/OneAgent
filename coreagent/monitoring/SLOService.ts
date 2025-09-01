import fs from 'fs';
import path from 'path';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

export interface SLOTarget {
  p95LatencyMs?: number;
  p99LatencyMs?: number;
  errorRate?: number; // 0-1
}
export interface SLOObjective {
  operation: string;
  description?: string;
  budgetCycleDays?: number;
  target: SLOTarget;
}
export interface SLOServiceEntry {
  name: string;
  objectives: SLOObjective[];
}
export interface SLOConfig {
  version: number;
  services: SLOServiceEntry[];
  defaults?: { budgetCycleDays?: number };
  metadata?: Record<string, unknown>;
}

/**
 * Canonical SLO loader – reads slo.config.json once and exposes immutable snapshot.
 * No background polling to avoid parallel state; consumers re-import or call reload explicitly if needed.
 */
export class SLOService {
  private config: SLOConfig | null = null;
  private readonly configPath: string;

  constructor(configPath = path.join(process.cwd(), 'slo.config.json')) {
    this.configPath = configPath;
  }

  load(): SLOConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`SLO config not found at ${this.configPath}`);
    }
    const raw = fs.readFileSync(this.configPath, 'utf-8');
    const parsed: SLOConfig = JSON.parse(raw);
    // Basic validation (schema is external JSON Schema for editor tooling)
    if (typeof parsed.version !== 'number' || !Array.isArray(parsed.services)) {
      throw new Error('Invalid SLO config structure');
    }
    const ts = createUnifiedTimestamp();
    if (!parsed.metadata) parsed.metadata = {};
    parsed.metadata.loadedAt = ts.iso;
    this.config = parsed;
    return this.config;
  }

  getConfig(): SLOConfig | null {
    return this.config;
  }

  getObjectivesByOperation(op: string): SLOObjective[] {
    if (!this.config) return [];
    const matches: SLOObjective[] = [];
    for (const svc of this.config.services) {
      for (const obj of svc.objectives) {
        if (obj.operation === op) matches.push(obj);
      }
    }
    return matches;
  }
}

export const sloService = new SLOService();
