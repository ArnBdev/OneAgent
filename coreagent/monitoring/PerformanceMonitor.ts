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
  private metrics: Map<
    string,
    {
      latencies: number[];
      errors: number;
      successes: number;
      total: number;
      // FUTURE (v4.2): histogramBins will hold bucketed counts once HDR/bucket histogram implemented
      // Do NOT rely on this now; placeholder to prevent parallel ad-hoc histogram structures.
      histogramBins?: Record<string, number>; // key format: "lt_10" | "10_50" | "50_100" | "100_500" | "500_1000" | "gte_1000"
    }
  > = new Map();

  private maxSampleSize = 1000; // Keep last 1000 operations for rolling averages
  // FUTURE (v4.2): configurable via constructor or setter; keep constant until histogram feature lands.

  // ---- Histogram Roadmap Placeholders (Non-functional until v4.2) ----
  /**
   * Plan: When implementing histograms, call this after recording latency to increment bucket counts.
   * Rationale: Centralize histogram mutation here to avoid parallel metric state.
   */
  private addToHistogram(_operation: string, _timeMs: number): void {
    const operation = _operation;
    const timeMs = _timeMs;
    const op = this.getOrCreateOperationMetrics(operation);
    if (!op.histogramBins) {
      op.histogramBins = {
        lt_10: 0,
        '10_50': 0,
        '50_100': 0,
        '100_500': 0,
        '500_1000': 0,
        gte_1000: 0,
      } as Record<string, number>;
    }
    const bins = op.histogramBins;
    if (timeMs < 10) bins.lt_10++;
    else if (timeMs < 50) bins['10_50']++;
    else if (timeMs < 100) bins['50_100']++;
    else if (timeMs < 500) bins['100_500']++;
    else if (timeMs < 1000) bins['500_1000']++;
    else bins.gte_1000++;
  }

  /**
   * Planned public accessor for histogram snapshot (read-only copy) post v4.2.
   * Until implemented, returns undefined to signal absence.
   */
  getHistogram(operation: string): Record<string, number> | undefined {
    const op = this.metrics.get(operation);
    return op?.histogramBins ? { ...op.histogramBins } : undefined;
  }

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

    // FUTURE (v4.2): populate histogram bins centrally
    this.addToHistogram(operation, timeMs);

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

    const averageLatency =
      operationMetrics.latencies.length > 0
        ? operationMetrics.latencies.reduce((sum, latency) => sum + latency, 0) /
          operationMetrics.latencies.length
        : 0;

    const errorRate =
      operationMetrics.total > 0 ? operationMetrics.errors / operationMetrics.total : 0;

    return {
      averageLatency,
      errorRate,
      successCount: operationMetrics.successes,
      totalOperations: operationMetrics.total,
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

    this.metrics.forEach((_v, operation) => {
      // We'll accumulate synchronously using existing stored samples (avoid awaiting inside forEach)
      const m = this.metrics.get(operation)!;
      const avg = m.latencies.length
        ? m.latencies.reduce((s, l) => s + l, 0) / m.latencies.length
        : 0;
      const errRate = m.total ? m.errors / m.total : 0;
      const metrics: OperationMetrics = {
        averageLatency: avg,
        errorRate: errRate,
        successCount: m.successes,
        totalOperations: m.total,
      };
      operations[operation] = metrics;
      totalLatency += metrics.averageLatency * metrics.totalOperations;
      totalErrors += metrics.totalOperations * metrics.errorRate;
      totalSuccesses += metrics.successCount;
      totalOperations += metrics.totalOperations;
    });

    const overall = {
      averageLatency: totalOperations > 0 ? totalLatency / totalOperations : 0,
      errorRate: totalOperations > 0 ? totalErrors / totalOperations : 0,
      successCount: totalSuccesses,
      totalOperations,
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
      healthStatus,
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
  async getSlowOperations(latencyThreshold: number = 50): Promise<
    {
      operation: string;
      averageLatency: number;
      exceededBy: number;
    }[]
  > {
    const slowOperations: { operation: string; averageLatency: number; exceededBy: number }[] = [];

    this.metrics.forEach((_v, operation) => {
      const m = this.metrics.get(operation)!;
      const avg = m.latencies.length
        ? m.latencies.reduce((s, l) => s + l, 0) / m.latencies.length
        : 0;
      if (avg > latencyThreshold) {
        slowOperations.push({ operation, averageLatency: avg, exceededBy: avg - latencyThreshold });
      }
    });
    return slowOperations.sort((a, b) => b.exceededBy - a.exceededBy);
  }

  // >>> Canonical Extensions (no parallel systems) >>>
  // Ingest duration from operation_metric event metadata (durationMs) into canonical store
  recordDurationFromEvent(operation: string, durationMs: number): void {
    if (typeof durationMs !== 'number' || !isFinite(durationMs) || durationMs < 0) return;
    const op = this.getOrCreateOperationMetrics(operation);
    op.latencies.push(durationMs);
    op.successes += 1;
    op.total += 1;
    if (op.latencies.length > this.maxSampleSize) op.latencies.shift();
    this.addToHistogram(operation, durationMs); // prepares for future histogram without parallel store
  }

  private computePercentile(sorted: number[], p: number): number {
    if (!sorted.length) return 0;
    const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[idx];
  }

  async getDetailedMetrics(operation: string): Promise<{
    operation: string;
    count: number;
    avgLatency: number;
    p95: number;
    p99: number;
    errorRate: number;
    recentErrors: number;
    recommendations: string[];
  }> {
    const op = this.getOrCreateOperationMetrics(operation);
    const sorted = [...op.latencies].sort((a, b) => a - b);
    const avgLatency = sorted.length ? sorted.reduce((s, v) => s + v, 0) / sorted.length : 0;
    const p95 = this.computePercentile(sorted, 95);
    const p99 = this.computePercentile(sorted, 99);
    const errorRate = op.total ? op.errors / op.total : 0;
    const recommendations: string[] = [];
    if (p95 > 3000)
      recommendations.push(
        `High p95 latency (${p95.toFixed(0)}ms) - investigate batching or dependency latency.`,
      );
    if (errorRate > 0.1)
      recommendations.push(
        `Elevated error rate ${(errorRate * 100).toFixed(1)}% - improve error handling/retries.`,
      );
    if (!recommendations.length) recommendations.push('Operation performance within targets.');
    return {
      operation,
      count: op.total,
      avgLatency,
      p95,
      p99,
      errorRate,
      recentErrors: op.errors,
      recommendations,
    };
  }

  async getGlobalReport(): Promise<{
    totalOperations: number;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    errorRate: number;
    operationBreakdown: Record<
      string,
      { count: number; avgDuration: number; errorCount: number; p95: number; p99: number }
    >;
    recommendations: string[];
  }> {
    type InternalMetrics = {
      latencies: number[];
      errors: number;
      successes: number;
      total: number;
    };
    const operationBreakdown: Record<
      string,
      { count: number; avgDuration: number; errorCount: number; p95: number; p99: number }
    > = {};
    const all: number[] = [];
    let totalErrors = 0;
    let total = 0;
    this.metrics.forEach((data, operation) => {
      const d = data as InternalMetrics;
      const sorted = d.latencies.slice().sort((a, b) => a - b);
      const avg = sorted.length ? sorted.reduce((s, v) => s + v, 0) / sorted.length : 0;
      const p95 = this.computePercentile(sorted, 95);
      const p99 = this.computePercentile(sorted, 99);
      operationBreakdown[operation] = {
        count: d.total,
        avgDuration: avg,
        errorCount: d.errors,
        p95,
        p99,
      };
      sorted.forEach((v) => all.push(v));
      totalErrors += d.errors;
      total += d.total;
    });
    const sortedAll = all.sort((a, b) => a - b);
    const averageLatency = sortedAll.length
      ? sortedAll.reduce((s, v) => s + v, 0) / sortedAll.length
      : 0;
    const p95Latency = this.computePercentile(sortedAll, 95);
    const p99Latency = this.computePercentile(sortedAll, 99);
    const errorRate = total ? totalErrors / total : 0;
    const recommendations: string[] = [];
    if (p95Latency > 3000) recommendations.push('System-wide high p95 latency - profile hotspots.');
    if (errorRate > 0.1)
      recommendations.push('High overall error rate - audit failing operations.');
    if (!recommendations.length) recommendations.push('Overall performance within targets.');
    return {
      totalOperations: total,
      averageLatency,
      p95Latency,
      p99Latency,
      errorRate,
      operationBreakdown,
      recommendations,
    };
  }
  // <<< Canonical Extensions End <<<
  // Private helper methods
  private getOrCreateOperationMetrics(operation: string) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        latencies: [],
        errors: 0,
        successes: 0,
        total: 0,
      });
    }
    return this.metrics.get(operation)!;
  }
}
