/**
 * GracefulShutdown - Canonical global shutdown utility
 * Ensures all active intervals, monitors, and resources are stopped before process exit.
 */
import { OneAgentUnifiedBackbone } from './UnifiedBackboneService';
import { healthMonitoringService } from '../monitoring/HealthMonitoringService';

export interface ShutdownOptions {
  exit?: boolean; // Whether to call process.exit
  timeoutMs?: number; // Max time to wait for async cleanup
  reason?: string; // Reason for logging
  forceAfterTimeout?: boolean; // Force exit if timeout reached
  exitCode?: number; // Process exit code (default 0)
}

export class GracefulShutdownManager {
  private static instance: GracefulShutdownManager;
  private shuttingDown = false;
  private logger: Console = console;

  static getInstance(): GracefulShutdownManager {
    if (!this.instance) this.instance = new GracefulShutdownManager();
    return this.instance;
  }

  async shutdown(options: ShutdownOptions = {}): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    const start = Date.now();
    const {
      exit = false,
      timeoutMs = 5000,
      reason = 'unspecified',
      forceAfterTimeout = true,
      exitCode = 0,
    } = options;

    this.logger.log(`🔻 Initiating graceful shutdown (reason: ${reason})`);

    const tasks: Promise<unknown>[] = [];

    try {
      // Stop health monitoring
      try {
        tasks.push(healthMonitoringService.stopMonitoring());
      } catch (e) {
        this.logger.debug?.('healthMonitoringService stop error (non-fatal):', e);
      }

      // Stop unified monitoring if available dynamically
      try {
        const mod = await import('../monitoring/UnifiedMonitoringService');
        type MaybeUnified = { unifiedMonitoringService?: { stopMonitoring: () => Promise<void> } };
        const maybe: MaybeUnified = mod as MaybeUnified;
        if (maybe.unifiedMonitoringService) {
          tasks.push(maybe.unifiedMonitoringService.stopMonitoring());
        }
      } catch (e) {
        this.logger.debug?.('UnifiedMonitoringService stop error (non-fatal):', e);
      }

      // Shutdown backbone subsystems
      try {
        const backbone = OneAgentUnifiedBackbone.getInstance() as unknown as {
          getServices?: () => { errorHandler?: { shutdown?: () => void } };
          cache?: { clear?: () => void };
        };
        if (backbone.getServices) {
          const services = backbone.getServices();
          services?.errorHandler?.shutdown?.();
        }
        backbone.cache?.clear?.();
      } catch (e) {
        this.logger.debug?.('Backbone cleanup error (non-fatal):', e);
      }

      // Audit logger if singleton exported
      try {
        const auditModule = await import('../audit/auditLogger');
        type MaybeAudit = { auditLogger?: { shutdown?: () => Promise<void> } };
        const maybeAudit: MaybeAudit = auditModule as MaybeAudit;
        if (maybeAudit.auditLogger?.shutdown) tasks.push(maybeAudit.auditLogger.shutdown());
      } catch (e) {
        this.logger.debug?.('Audit logger shutdown error (non-fatal):', e);
      }

      // Performance monitor if singleton
      try {
        const perfModule = await import('../monitoring/PerformanceMonitor');
        type MaybePerf = { performanceMonitor?: { stop?: () => void } };
        const maybePerf: MaybePerf = perfModule as MaybePerf;
        maybePerf.performanceMonitor?.stop?.();
      } catch (e) {
        this.logger.debug?.('Performance monitor stop error (non-fatal):', e);
      }

      // Await tasks with timeout
      await Promise.race([
        Promise.allSettled(tasks),
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
      ]);

      const elapsed = Date.now() - start;
      this.logger.log(`✅ Graceful shutdown complete in ${elapsed}ms`);
    } catch (err) {
      this.logger.error('❌ Shutdown encountered errors:', err);
    } finally {
      if (exit) {
        const elapsed = Date.now() - start;
        let shouldExit = true;
        if (elapsed > timeoutMs && !forceAfterTimeout) {
          this.logger.warn('⏳ Shutdown timeout exceeded; process left running by configuration');
          shouldExit = false;
        }
        if (shouldExit) {
          this.logger.log(`👋 Exiting process (code ${exitCode}).`);
          process.exit(exitCode);
        }
      }
    }
  }
}

export const gracefulShutdown = (options?: ShutdownOptions) =>
  GracefulShutdownManager.getInstance().shutdown(options);
