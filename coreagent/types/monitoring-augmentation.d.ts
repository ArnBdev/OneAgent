// Module augmentation to provide optional metric helpers without creating a parallel monitoring system.
// Rationale: Existing communication service references increment/gauge that are not yet implemented on
// UnifiedMonitoringService. We add them as optional so TypeScript stops erroring while retaining a single
// canonical monitoring service. Future implementation can supply concrete methods.

import { UnifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';

declare module '../monitoring/UnifiedMonitoringService' {
  interface UnifiedMonitoringService {
    /** Optional counter-like helper (planned canonical API). */
    increment?(metric: string, data?: unknown): void;
    /** Optional gauge-like helper (planned canonical API). */
    gauge?(metric: string, value?: number): void;
  }
}

// Safe no-op shims (only if missing) to avoid runtime errors when calls occur.
// This does NOT introduce a parallel metrics store; simply prevents undefined access.
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';
const svc = unifiedMonitoringService as UnifiedMonitoringService;
if (!svc.increment) {
  svc.increment = () => {
    /* no-op until canonical metrics expansion */
  };
}
if (!svc.gauge) {
  svc.gauge = () => {
    /* no-op until canonical metrics expansion */
  };
}
