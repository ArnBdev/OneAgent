// Standalone runner to execute a2a-events.smoke.test under a minimal Jest-like facade when run directly.
// This avoids invoking jest CLI when quick manual smoke needed. Not a replacement for real jest run.
// Canonical systems only; no parallel test frameworks introduced.

import './jest-mini-globals';
import './a2a-events.smoke.test';
import { runMiniTests } from './jest-mini-globals';

runMiniTests().catch((e: unknown) => {
  console.error(e);
  process.exitCode = 1;
});
