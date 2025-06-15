/**
 * Performance Monitor Implementation - ALITA Phase 1
 * 
 * Purpose: Monitor and track performance metrics for ALITA components
 * Why: <50ms target enforcement and system health monitoring
 * 
 * @version 1.0.0
 * @date 2025-06-15
 */

export interface OperationMetrics {
  averageLatency: number;
  errorRate: number;
  successCount: number;
  totalOperations: number;
}

/**
 * Performance Monitor
 * WHY: Continuous monitoring ensures performance targets are met
 */
export class PerformanceMonitor {
  private metrics: Map<string, {
    latencies: number[];
    errors: number;
    successes: number;
    total: number;
  }> = new Map();

  private maxSampleSize = 1000; // Keep last 1000 operations for rolling averages

  /**
   * Record operation latency
   * WHY: Track performance against <50ms target
   */
  async recordLatency(operation: string, timeMs: number): Promise<void> {
    const operationMetrics = this.getOrCreateOperationMetrics(operation);
    
    operationMetrics.latencies.push(timeMs);
    operationMetrics.successes++;
    operationMetrics.total++;
    
    // Keep rolling window of samples
    if (operationMetrics.latencies.length > this.maxSampleSize) {
      operationMetrics.latencies.shift();
    }

    // Log warning if operation exceeds target
    if (timeMs > 50) {
      console.warn(`Performance warning: ${operation} took ${timeMs}ms (target: <50ms)`);
    }
  }

  /**
   * Record operation error
   * WHY: Track error rates for system health
   */
  async recordError(operation: string, error: Error): Promise<void> {
    const operationMetrics = this.getOrCreateOperationMetrics(operation);
    
    operationMetrics.errors++;
    operationMetrics.total++;
    
    console.error(`Operation error in ${operation}:`, error.message);
  }

  /**
   * Get metrics for specific operation
   * WHY: Performance analysis and monitoring
   */
  async getMetrics(operation: string): Promise<OperationMetrics> {
    const operationMetrics = this.getOrCreateOperationMetrics(operation);
    
    const averageLatency = operationMetrics.latencies.length > 0
      ? operationMetrics.latencies.reduce((sum, latency) => sum + latency, 0) / operationMetrics.latencies.length
      : 0;
    
    const errorRate = operationMetrics.total > 0
      ? operationMetrics.errors / operationMetrics.total
      : 0;

    return {
      averageLatency,
      errorRate,
      successCount: operationMetrics.successes,
      totalOperations: operationMetrics.total
    };
  }

  /**
   * Get comprehensive performance summary
   * WHY: Overall system health assessment
   */
  async getPerformanceSummary(): Promise<{
    overall: OperationMetrics;
    operations: Record<string, OperationMetrics>;
    healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  }> {
    const operations: Record<string, OperationMetrics> = {};
    let totalLatency = 0;
    let totalErrors = 0;
    let totalSuccesses = 0;
    let totalOperations = 0;

    for (const [operation, _] of this.metrics) {
      const metrics = await this.getMetrics(operation);
      operations[operation] = metrics;
      
      totalLatency += metrics.averageLatency * metrics.totalOperations;
      totalErrors += metrics.totalOperations * metrics.errorRate;
      totalSuccesses += metrics.successCount;
      totalOperations += metrics.totalOperations;
    }

    const overall = {
      averageLatency: totalOperations > 0 ? totalLatency / totalOperations : 0,
      errorRate: totalOperations > 0 ? totalErrors / totalOperations : 0,
      successCount: totalSuccesses,
      totalOperations
    };

    // Determine health status
    let healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (overall.averageLatency > 100 || overall.errorRate > 0.1) {
      healthStatus = 'CRITICAL';
    } else if (overall.averageLatency > 50 || overall.errorRate > 0.05) {
      healthStatus = 'WARNING';
    }

    return {
      overall,
      operations,
      healthStatus
    };
  }

  /**
   * Reset metrics for specific operation
   * WHY: Fresh start for testing or troubleshooting
   */
  resetMetrics(operation?: string): void {
    if (operation) {
      this.metrics.delete(operation);
      console.log(`Reset metrics for operation: ${operation}`);
    } else {
      this.metrics.clear();
      console.log('Reset all performance metrics');
    }
  }

  /**
   * Get operations that exceed performance targets
   * WHY: Identify performance bottlenecks
   */
  async getSlowOperations(latencyThreshold: number = 50): Promise<{
    operation: string;
    averageLatency: number;
    exceededBy: number;
  }[]> {
    const slowOperations = [];
    
    for (const [operation, _] of this.metrics) {
      const metrics = await this.getMetrics(operation);
      if (metrics.averageLatency > latencyThreshold) {
        slowOperations.push({
          operation,
          averageLatency: metrics.averageLatency,
          exceededBy: metrics.averageLatency - latencyThreshold
        });
      }
    }

    return slowOperations.sort((a, b) => b.exceededBy - a.exceededBy);
  }

  /**
   * Performance alert system
   * WHY: Proactive monitoring and alerting
   */
  async checkPerformanceAlerts(): Promise<{
    alerts: string[];
    recommendations: string[];
  }> {
    const alerts: string[] = [];
    const recommendations: string[] = [];
    
    const summary = await this.getPerformanceSummary();
    
    // Check overall health
    if (summary.healthStatus === 'CRITICAL') {
      alerts.push('CRITICAL: System performance severely degraded');
      recommendations.push('Immediate investigation required - consider scaling or optimization');
    } else if (summary.healthStatus === 'WARNING') {
      alerts.push('WARNING: System performance below targets');
      recommendations.push('Monitor closely and consider performance optimization');
    }

    // Check specific operations
    const slowOps = await this.getSlowOperations();
    if (slowOps.length > 0) {
      alerts.push(`${slowOps.length} operations exceed 50ms target`);
      recommendations.push(`Focus optimization on: ${slowOps.slice(0, 3).map(op => op.operation).join(', ')}`);
    }

    // Check error rates
    if (summary.overall.errorRate > 0.05) {
      alerts.push(`High error rate: ${(summary.overall.errorRate * 100).toFixed(2)}%`);
      recommendations.push('Investigate error causes and improve error handling');
    }

    return { alerts, recommendations };
  }

  // Private helper methods
  private getOrCreateOperationMetrics(operation: string) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        latencies: [],
        errors: 0,
        successes: 0,
        total: 0
      });
    }
    return this.metrics.get(operation)!;
  }
}
