/**
 * ReadinessChecker - Centralized health & readiness probes for OneAgent subsystems
 * Implements Step 3: readiness/health polling utility (memory + MCP endpoints)
 */
import fetch from 'node-fetch';
import { environmentConfig } from '../config/EnvironmentConfig';
import { createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

export interface SubsystemStatus {
  name: string;
  healthy: boolean;
  endpoint: string;
  latencyMs?: number;
  error?: string;
  checkedAt: string;
}

export interface ReadinessReport {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  systems: SubsystemStatus[];
  timestamp: string;
}

async function probe(url: string, name: string, timeoutMs = 4000): Promise<SubsystemStatus> {
  const start = Date.now();
  const ts = createUnifiedTimestamp();
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal as AbortSignal });
    clearTimeout(t);
    const healthy = res.ok;
    return {
      name,
      healthy,
      endpoint: url,
      latencyMs: Date.now() - start,
      checkedAt: ts.iso,
      ...(healthy ? {} : { error: `HTTP ${res.status}` }),
    };
  } catch (e) {
    return {
      name,
      healthy: false,
      endpoint: url,
      checkedAt: ts.iso,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function generateReadinessReport(): Promise<ReadinessReport> {
  const memoryUrl = environmentConfig.endpoints.memory.url.replace(/\/$/, '') + '/ping';
  const mcpUrl =
    environmentConfig.endpoints.mcp.url.replace(/\/$/, '') + environmentConfig.endpoints.mcp.path;
  const [memoryStatus, mcpStatus] = await Promise.all([
    probe(memoryUrl, 'memory'),
    probe(mcpUrl, 'mcp'),
  ]);
  const systems = [memoryStatus, mcpStatus];
  const allHealthy = systems.every((s) => s.healthy);
  const anyHealthy = systems.some((s) => s.healthy);
  const overall: ReadinessReport['overall'] = allHealthy
    ? 'healthy'
    : anyHealthy
      ? 'degraded'
      : 'unhealthy';
  return { overall, systems, timestamp: createUnifiedTimestamp().iso };
}

export async function waitForReadiness(
  timeoutMs = 15000,
  intervalMs = 1500,
): Promise<ReadinessReport> {
  const start = Date.now();
  let last: ReadinessReport = await generateReadinessReport();
  while (Date.now() - start < timeoutMs && last.overall !== 'healthy') {
    await new Promise((r) => setTimeout(r, intervalMs));
    last = await generateReadinessReport();
  }
  return last;
}

export default { generateReadinessReport, waitForReadiness };
