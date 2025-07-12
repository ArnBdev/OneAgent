"use strict";
/**
 * Performance Profiler for OneAgent
 *
 * Provides comprehensive performance monitoring and analysis for:
 * - Embedding generation latency
 * - Memory operations timing
 * - API call performance
 * - Resource usage patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalProfiler = exports.PerformanceProfiler = void 0;
/**
 * Performance profiler for Milestone 1.4 optimization
 */
class PerformanceProfiler {
    constructor() {
        this.metrics = [];
        this.activeOperations = new Map();
        this.maxMetrics = 10000; // Prevent memory leak
    }
    /**
     * Start timing an operation
     */
    startOperation(operationId, operationType, metadata) {
        const startTime = Date.now();
        this.activeOperations.set(operationId, startTime);
        // Store initial metric entry
        this.metrics.push({
            operation: operationType,
            startTime,
            endTime: 0,
            duration: 0,
            success: false,
            metadata: metadata || {}
        });
        // Cleanup old metrics to prevent memory issues
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    }
    /**
     * End timing an operation
     */
    endOperation(operationId, success = true, error) {
        const endTime = Date.now();
        const startTime = this.activeOperations.get(operationId);
        if (!startTime) {
            console.warn(`⚠️ No start time found for operation: ${operationId}`);
            return;
        }
        const duration = endTime - startTime;
        // Find and update the metric
        const metric = this.metrics.find(m => m.startTime === startTime && m.endTime === 0);
        if (metric) {
            metric.endTime = endTime;
            metric.duration = duration;
            metric.success = success;
            if (error)
                metric.error = error;
        }
        this.activeOperations.delete(operationId);
        // Log slow operations immediately
        if (duration > 5000) { // 5+ seconds
            console.warn(`🐌 Slow operation detected: ${operationId} took ${duration}ms`);
        }
    }
    /**
     * Quick performance check for specific operation types
     */
    checkPerformance(operationType) {
        const recentMetrics = this.metrics
            .filter(m => m.operation === operationType)
            .slice(-100); // Last 100 operations
        if (recentMetrics.length === 0) {
            return {
                avgLatency: 0,
                recentErrors: 0,
                recommendations: [`No recent ${operationType} operations to analyze`]
            };
        }
        const avgLatency = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
        const recentErrors = recentMetrics.filter(m => !m.success).length;
        const recommendations = [];
        // Performance recommendations
        if (avgLatency > 3000) {
            recommendations.push(`${operationType} average latency is high (${avgLatency.toFixed(0)}ms). Consider caching or optimization.`);
        }
        if (recentErrors > recentMetrics.length * 0.1) {
            recommendations.push(`${operationType} error rate is high (${((recentErrors / recentMetrics.length) * 100).toFixed(1)}%). Check error handling.`);
        }
        if (operationType === 'embedding_generation' && avgLatency > 2000) {
            recommendations.push('Consider implementing embedding batching or upgrading to faster embedding model.');
        }
        if (operationType === 'memory_search' && avgLatency > 1000) {
            recommendations.push('Memory search is slow. Consider implementing indexing or caching frequently accessed memories.');
        }
        return { avgLatency, recentErrors, recommendations };
    }
    /**
     * Generate comprehensive performance report
     */
    generateReport() {
        const completedMetrics = this.metrics.filter(m => m.endTime > 0);
        if (completedMetrics.length === 0) {
            return {
                totalOperations: 0,
                averageLatency: 0,
                p95Latency: 0,
                p99Latency: 0,
                errorRate: 0,
                slowestOperations: [],
                operationBreakdown: {},
                recommendations: ['No performance data available yet. Run some operations to collect metrics.']
            };
        }
        // Calculate latency percentiles
        const sortedDurations = completedMetrics
            .map(m => m.duration)
            .sort((a, b) => a - b);
        const p95Index = Math.floor(sortedDurations.length * 0.95);
        const p99Index = Math.floor(sortedDurations.length * 0.99);
        const averageLatency = sortedDurations.reduce((sum, d) => sum + d, 0) / sortedDurations.length;
        const p95Latency = sortedDurations[p95Index] || 0;
        const p99Latency = sortedDurations[p99Index] || 0;
        // Error rate calculation
        const errorCount = completedMetrics.filter(m => !m.success).length;
        const errorRate = (errorCount / completedMetrics.length) * 100;
        // Find slowest operations
        const slowestOperations = completedMetrics
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10);
        // Operation breakdown
        const operationBreakdown = {};
        completedMetrics.forEach(metric => {
            if (!operationBreakdown[metric.operation]) {
                operationBreakdown[metric.operation] = {
                    count: 0,
                    avgDuration: 0,
                    errorCount: 0
                };
            }
            const breakdown = operationBreakdown[metric.operation];
            breakdown.count++;
            breakdown.avgDuration = (breakdown.avgDuration * (breakdown.count - 1) + metric.duration) / breakdown.count;
            if (!metric.success)
                breakdown.errorCount++;
        });
        // Generate recommendations
        const recommendations = [];
        if (averageLatency > 2000) {
            recommendations.push('Overall system latency is high. Consider implementing more aggressive caching.');
        }
        if (errorRate > 5) {
            recommendations.push(`Error rate is ${errorRate.toFixed(1)}%. Review error handling and retry mechanisms.`);
        }
        // Operation-specific recommendations
        Object.entries(operationBreakdown).forEach(([operation, stats]) => {
            if (stats.avgDuration > 3000) {
                recommendations.push(`${operation} operations are slow (avg: ${stats.avgDuration.toFixed(0)}ms). Consider optimization.`);
            }
            if (stats.errorCount / stats.count > 0.1) {
                recommendations.push(`${operation} has high error rate (${((stats.errorCount / stats.count) * 100).toFixed(1)}%).`);
            }
        });
        if (recommendations.length === 0) {
            recommendations.push('System performance looks good! Continue monitoring.');
        }
        return {
            totalOperations: completedMetrics.length,
            averageLatency,
            p95Latency,
            p99Latency,
            errorRate,
            slowestOperations,
            operationBreakdown,
            recommendations
        };
    }
    /**
     * Clear all metrics (useful for fresh analysis)
     */
    clearMetrics() {
        this.metrics = [];
        this.activeOperations.clear();
        console.log('🧹 Performance metrics cleared');
    }
    /**
     * Get current metrics count
     */
    getMetricsCount() {
        return this.metrics.length;
    }
}
exports.PerformanceProfiler = PerformanceProfiler;
// Global profiler instance
exports.globalProfiler = new PerformanceProfiler();
