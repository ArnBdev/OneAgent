// Test setup helper: disable auto monitoring before importing any OneAgent modules.
process.env.ONEAGENT_DISABLE_AUTO_MONITORING = '1';

// Export a helper to assert disabled state if needed
export function monitoringDisabled(): boolean {
  return process.env.ONEAGENT_DISABLE_AUTO_MONITORING === '1';
}
