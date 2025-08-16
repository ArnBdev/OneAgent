/**
 * Monitoring Test Utilities
 * Canonical helper functions for asserting operation coverage in monitoring events
 * Avoids duplication across communication tests while preventing any parallel monitoring logic.
 */
import { MonitoringEvent } from '../../coreagent/monitoring/UnifiedMonitoringService';

export interface OperationCoverageResult {
  required: string[];
  present: string[];
  missing: string[];
  coverageRatio: number; // 1.0 === 100%
}

/**
 * Filter events for a given component and compute coverage for required operations.
 */
export function computeOperationCoverage(
  events: MonitoringEvent[],
  component: string,
  requiredOps: string[],
): OperationCoverageResult {
  const componentEvents = events.filter((e) => e.component === component);
  const present = Array.from(
    new Set(componentEvents.map((e) => e.operation).filter(Boolean)),
  ) as string[];
  const missing = requiredOps.filter((op) => !present.includes(op));
  return {
    required: requiredOps,
    present,
    missing,
    coverageRatio: (requiredOps.length - missing.length) / requiredOps.length,
  };
}

/**
 * Assert that 100% of required operations are present unless monitoring disabled.
 * Automatically skips when ONEAGENT_DISABLE_AUTO_MONITORING=1.
 */
export function assertOperationCoverage(
  events: MonitoringEvent[],
  component: string,
  requiredOps: string[],
  opts: { allowSkipOnDisabled?: boolean } = { allowSkipOnDisabled: true },
): void {
  if (process.env.ONEAGENT_DISABLE_AUTO_MONITORING === '1' && opts.allowSkipOnDisabled) {
    console.log(
      `[monitoringTestUtils] Monitoring disabled; skipping operation coverage assertion for ${component}`,
    );
    return;
  }
  const result = computeOperationCoverage(events, component, requiredOps);
  if (result.missing.length) {
    throw new Error(
      `Missing monitoring operation events for component ${component}: ${result.missing.join(', ')} | Present: ${result.present.join(', ')}`,
    );
  }
  console.log(`[monitoringTestUtils] Operation coverage 100% for ${component}`, {
    present: result.present,
  });
}

/**
 * Convenience helper to filter events to only those whose operation is in the provided list.
 */
export function getAndFilterEvents(
  events: MonitoringEvent[],
  operations: string[],
): MonitoringEvent[] {
  const set = new Set(operations);
  return events.filter((e) => !!e.operation && set.has(e.operation));
}

/**
 * Assert that a specific ordered subsequence of operations occurred (not necessarily contiguous).
 */
export function assertOperationSequence(
  events: MonitoringEvent[],
  component: string,
  sequence: string[],
): void {
  const componentOps = events
    .filter((e) => e.component === component && e.operation)
    .map((e) => e.operation as string);
  let idx = 0;
  for (const op of componentOps) {
    if (op === sequence[idx]) idx += 1;
    if (idx === sequence.length) break;
  }
  if (idx !== sequence.length) {
    throw new Error(
      `Operation sequence not observed for ${component}. Expected subsequence: ${sequence.join(' -> ')} | Observed ops: ${componentOps.join(', ')}`,
    );
  }
  console.log(`[monitoringTestUtils] Operation sequence observed for ${component}`, { sequence });
}

// No default export to keep explicit usage and clarity.
