/**
 * PerformanceBridge - Specialized performance coordination bridge
 * Part of Level 2.5 Integration Bridges (Phase 1b)
 * 
 * Provides centralized performance monitoring and optimization across OneAgent components.
 */

import { PerformanceAPI } from '../api/performanceAPI';
import { SimpleAuditLogger, defaultAuditLogger } from '../audit/auditLogger';
import { SecureErrorHandler, defaultSecureErrorHandler } from '../utils/secureErrorHandler';

export interface PerformanceThresholds {
  responseTime: {
    excellent: number;
    good: number;
    warning: number;
    critical: number;
  };
  memoryUsage: {
    warning: number;
    critical: number;
  };
  errorRate: {
    warning: number;
    critical: number;
  };
  throughput: {
    minimum: number;
    target: number;
  };
}

export interface ComponentPerformanceProfile {
  componentName: string;
  averageLatency: number;
  errorRate: number;
  throughputPerMinute: number;
  memoryUsage: number;
  lastHealthCheck: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
}

export interface PerformanceAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  component: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
  resolved: boolean;
}

export interface PerformanceBridgeConfig {
  enableRealTimeMonitoring: boolean;
  alertThresholds: PerformanceThresholds;
  monitoringInterval: number;
  retentionPeriod: number;
  enableAutoOptimization: boolean;
  enablePredictiveAnalysis: boolean;
}

export class PerformanceBridge {
  private performanceAPI: PerformanceAPI;
  private auditLogger: SimpleAuditLogger;
  private errorHandler: SecureErrorHandler;
  private config: PerformanceBridgeConfig;
  private componentProfiles = new Map<string, ComponentPerformanceProfile>();
  private activeAlerts = new Map<string, PerformanceAlert>();
  private monitoringTimer: NodeJS.Timeout | null = null;
  private operationCounters = new Map<string, { count: number; lastReset: number }>();

  constructor(
    performanceAPI: PerformanceAPI,
    config?: Partial<PerformanceBridgeConfig>,
    auditLogger?: SimpleAuditLogger,
    errorHandler?: SecureErrorHandler
  ) {
    this.performanceAPI = performanceAPI;
    this.auditLogger = auditLogger || defaultAuditLogger;
    this.errorHandler = errorHandler || defaultSecureErrorHandler;
    
    this.config = {
      enableRealTimeMonitoring: true,
      alertThresholds: {
        responseTime: {
          excellent: 100,  // 100ms
          good: 500,       // 500ms
          warning: 2000,   // 2s
          critical: 5000   // 5s
        },
        memoryUsage: {
          warning: 70,     // 70%
          critical: 90     // 90%
        },
        errorRate: {
          warning: 5,      // 5%
          critical: 15     // 15%
        },
        throughput: {
          minimum: 10,     // 10 ops/min
          target: 100      // 100 ops/min
        }
      },
      monitoringInterval: 30000, // 30 seconds
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      enableAutoOptimization: false,
      enablePredictiveAnalysis: false,
      ...config
    };

    this.initializeMonitoring();
  }

  /**
   * Tracks a performance operation across components
   */
  async trackOperation<T>(
    componentName: string,
    operationName: string,
    operation: () => Promise<T>,
    context: {
      userId?: string;
      sessionId?: string;
      requestId?: string;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const operationId = this.generateOperationId(componentName, operationName);
    
    try {
      // Increment operation counter
      this.incrementOperationCounter(componentName);
      
      // Record operation start
      await this.performanceAPI.recordEvent('operation_start', {
        component: componentName,
        operation: operationName,
        operationId,
        timestamp: startTime,
        ...context
      });

      // Execute operation
      const result = await operation();
      
      const duration = Date.now() - startTime;
      
      // Record successful completion
      await this.recordOperationCompletion(
        componentName,
        operationName,
        operationId,
        duration,
        true,
        context
      );
      
      // Update component profile
      await this.updateComponentProfile(componentName, duration, true);
      
      // Check thresholds
      await this.checkPerformanceThresholds(componentName, duration, null);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record failed completion
      await this.recordOperationCompletion(
        componentName,
        operationName,
        operationId,
        duration,
        false,
        context,
        error
      );
      
      // Update component profile
      await this.updateComponentProfile(componentName, duration, false);
      
      // Check thresholds and log error
      await this.checkPerformanceThresholds(componentName, duration, error);
      
      throw error;
    }
  }

  /**
   * Records system-wide performance metrics
   */
  async recordSystemMetrics(): Promise<void> {
    const systemMetrics = {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
      activeRequests: (process as any)._getActiveRequests?.()?.length || 0
    };

    await this.performanceAPI.recordEvent('system_metrics', systemMetrics);
    
    // Check system-level thresholds
    const memoryUsagePercent = (systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100;
    
    if (memoryUsagePercent > this.config.alertThresholds.memoryUsage.critical) {
      await this.triggerAlert('system', 'memory_usage', memoryUsagePercent, 
        this.config.alertThresholds.memoryUsage.critical, 'critical');
    } else if (memoryUsagePercent > this.config.alertThresholds.memoryUsage.warning) {
      await this.triggerAlert('system', 'memory_usage', memoryUsagePercent, 
        this.config.alertThresholds.memoryUsage.warning, 'warning');
    }
  }

  /**
   * Gets comprehensive performance analytics
   */
  async getPerformanceAnalytics(): Promise<{
    components: ComponentPerformanceProfile[];
    alerts: PerformanceAlert[];
    systemSummary: {
      totalOperations: number;
      averageResponseTime: number;
      overallErrorRate: number;
      systemHealth: 'healthy' | 'warning' | 'critical';
    };
  }> {
    const components = Array.from(this.componentProfiles.values());
    const alerts = Array.from(this.activeAlerts.values());
    
    // Calculate system summary
    const totalOperations = Array.from(this.operationCounters.values())
      .reduce((sum, counter) => sum + counter.count, 0);
    
    const averageResponseTime = components.length > 0
      ? components.reduce((sum, c) => sum + c.averageLatency, 0) / components.length
      : 0;
    
    const overallErrorRate = components.length > 0
      ? components.reduce((sum, c) => sum + c.errorRate, 0) / components.length
      : 0;
    
    const criticalAlerts = alerts.filter(a => a.level === 'critical' && !a.resolved);
    const warningAlerts = alerts.filter(a => a.level === 'warning' && !a.resolved);
    
    const systemHealth = criticalAlerts.length > 0 ? 'critical' 
      : warningAlerts.length > 0 ? 'warning' 
      : 'healthy';

    return {
      components,
      alerts,
      systemSummary: {
        totalOperations,
        averageResponseTime,
        overallErrorRate,
        systemHealth
      }
    };
  }

  /**
   * Gets real-time performance data for a specific component
   */
  async getComponentPerformance(componentName: string): Promise<ComponentPerformanceProfile | null> {
    return this.componentProfiles.get(componentName) || null;
  }

  /**
   * Gets current active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Resolves a performance alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;
    
    alert.resolved = true;
    
    await this.auditLogger.logInfo(
      'PERFORMANCE_ALERT',
      `Alert resolved: ${alertId}`,
      { alertId, component: alert.component, metric: alert.metric }
    );
    
    return true;
  }

  /**
   * Records operation completion
   */
  private async recordOperationCompletion(
    componentName: string,
    operationName: string,
    operationId: string,
    duration: number,
    success: boolean,
    context: any,
    error?: any
  ): Promise<void> {
    await this.performanceAPI.recordEvent('operation_complete', {
      component: componentName,
      operation: operationName,
      operationId,
      duration,
      success,
      timestamp: Date.now(),
      error: error?.message,
      ...context
    });
  }

  /**
   * Updates component performance profile
   */
  private async updateComponentProfile(
    componentName: string,
    latency: number,
    success: boolean
  ): Promise<void> {
    let profile = this.componentProfiles.get(componentName);
    
    if (!profile) {
      profile = {
        componentName,
        averageLatency: latency,
        errorRate: success ? 0 : 100,
        throughputPerMinute: 1,
        memoryUsage: 0,
        lastHealthCheck: new Date().toISOString(),
        status: 'healthy'
      };
    } else {
      // Update with exponential moving average
      const alpha = 0.1;
      profile.averageLatency = (1 - alpha) * profile.averageLatency + alpha * latency;
      profile.errorRate = (1 - alpha) * profile.errorRate + alpha * (success ? 0 : 100);
      profile.lastHealthCheck = new Date().toISOString();
    }
    
    // Update status based on thresholds
    profile.status = this.calculateComponentStatus(profile);
    
    this.componentProfiles.set(componentName, profile);
  }

  /**
   * Calculates component health status
   */
  private calculateComponentStatus(profile: ComponentPerformanceProfile): 'healthy' | 'warning' | 'critical' | 'unknown' {
    const thresholds = this.config.alertThresholds;
    
    if (profile.errorRate > thresholds.errorRate.critical || 
        profile.averageLatency > thresholds.responseTime.critical) {
      return 'critical';
    }
    
    if (profile.errorRate > thresholds.errorRate.warning || 
        profile.averageLatency > thresholds.responseTime.warning) {
      return 'warning';
    }
    
    return 'healthy';
  }

  /**
   * Checks performance thresholds and triggers alerts
   */
  private async checkPerformanceThresholds(
    componentName: string,
    duration: number,
    error: any
  ): Promise<void> {
    const thresholds = this.config.alertThresholds.responseTime;
    
    if (duration > thresholds.critical) {
      await this.triggerAlert(componentName, 'response_time', duration, thresholds.critical, 'critical');
    } else if (duration > thresholds.warning) {
      await this.triggerAlert(componentName, 'response_time', duration, thresholds.warning, 'warning');
    }
      if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown performance error';
      await this.auditLogger.logError(
        'PERFORMANCE_ERROR',
        `Component ${componentName} operation failed`,
        { componentName, duration, error: errorMessage }
      );
    }
  }

  /**
   * Triggers a performance alert
   */
  private async triggerAlert(
    component: string,
    metric: string,
    value: number,
    threshold: number,
    level: 'info' | 'warning' | 'critical'
  ): Promise<void> {
    const alertId = `${component}_${metric}_${Date.now()}`;
    
    const alert: PerformanceAlert = {
      id: alertId,
      level,
      component,
      metric,
      value,
      threshold,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    this.activeAlerts.set(alertId, alert);
    
    await this.auditLogger.logWarning(
      'PERFORMANCE_ALERT',
      `Performance alert triggered: ${component} ${metric} ${value} > ${threshold}`,
      { alert }
    );
  }

  /**
   * Increments operation counter for throughput tracking
   */
  private incrementOperationCounter(componentName: string): void {
    const now = Date.now();
    let counter = this.operationCounters.get(componentName);
    
    if (!counter) {
      counter = { count: 0, lastReset: now };
    }
    
    // Reset counter every minute for throughput calculation
    if (now - counter.lastReset > 60000) {
      counter.count = 0;
      counter.lastReset = now;
    }
    
    counter.count++;
    this.operationCounters.set(componentName, counter);
  }

  /**
   * Generates unique operation ID
   */
  private generateOperationId(componentName: string, operationName: string): string {
    return `${componentName}_${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initializes performance monitoring
   */
  private initializeMonitoring(): void {
    if (!this.config.enableRealTimeMonitoring) return;
    
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.recordSystemMetrics();
        await this.cleanupOldAlerts();      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown monitoring error';
        await this.auditLogger.logError(
          'PERFORMANCE_BRIDGE',
          'Error in monitoring cycle',
          { error: errorMessage }
        );
      }
    }, this.config.monitoringInterval);
  }

  /**
   * Cleans up old resolved alerts
   */
  private async cleanupOldAlerts(): Promise<void> {
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    
    for (const [alertId, alert] of this.activeAlerts) {
      const alertTime = new Date(alert.timestamp).getTime();
      if (alertTime < cutoffTime && alert.resolved) {
        this.activeAlerts.delete(alertId);
      }
    }
  }

  /**
   * Gracefully shuts down the performance bridge
   */
  async shutdown(): Promise<void> {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  /**
   * Gets current bridge configuration
   */
  getConfig(): PerformanceBridgeConfig {
    return { ...this.config };
  }

  /**
   * Updates bridge configuration
   */
  updateConfig(newConfig: Partial<PerformanceBridgeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if interval changed
    if (newConfig.monitoringInterval && this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.initializeMonitoring();
    }
  }
}

export default PerformanceBridge;
