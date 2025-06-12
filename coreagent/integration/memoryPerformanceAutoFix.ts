
// Auto-apply memory performance optimizations
import { MemorySystemPerformanceFix } from './memorySystemPerformanceFix';
import { SimpleAuditLogger } from '../tools/auditLogger';

const auditLogger = new SimpleAuditLogger({
  logDirectory: 'logs/memory-performance',
  enableConsoleOutput: false,
  bufferSize: 10,
  flushInterval: 5000
});

const memoryPerformanceFix = new MemorySystemPerformanceFix(auditLogger);

// Auto-apply performance fixes on module load
(async () => {
  try {
    const validation = await memoryPerformanceFix.validatePerformanceFixes();
    if (validation.validation !== 'success') {
      console.log('🔧 Auto-applying memory performance optimizations...');
      // Performance fixes will be applied when memory bridge is initialized
    }
  } catch (error) {
    // Silent fail - performance optimizations are optional
  }
})();

export { memoryPerformanceFix };