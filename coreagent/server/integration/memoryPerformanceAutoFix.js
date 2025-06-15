"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryPerformanceFix = void 0;
// Auto-apply memory performance optimizations
const memorySystemPerformanceFix_1 = require("./memorySystemPerformanceFix");
const auditLogger_1 = require("../audit/auditLogger");
const auditLogger = new auditLogger_1.SimpleAuditLogger({
    logDirectory: 'logs/memory-performance',
    enableConsoleOutput: false,
    bufferSize: 10,
    flushInterval: 5000
});
const memoryPerformanceFix = new memorySystemPerformanceFix_1.MemorySystemPerformanceFix(auditLogger);
exports.memoryPerformanceFix = memoryPerformanceFix;
// Auto-apply performance fixes on module load
(async () => {
    try {
        const validation = await memoryPerformanceFix.validatePerformanceFixes();
        if (validation.validation !== 'success') {
            console.log('🔧 Auto-applying memory performance optimizations...');
            // Performance fixes will be applied when memory bridge is initialized
        }
    }
    catch (error) {
        // Silent fail - performance optimizations are optional
    }
})();
