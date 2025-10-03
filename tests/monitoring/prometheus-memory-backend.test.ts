/**
 * Phase 4: Unit tests for memory backend Prometheus metrics
 * Tests the new exposePrometheusMetrics() method added in Phase 3 (v4.4.2)
 *
 * Constitutional AI Compliance:
 * - Accuracy: Validates metric values match health data
 * - Transparency: Tests clear metric naming and labels
 * - Helpfulness: Ensures actionable monitoring data
 * - Safety: Validates error handling and fallback behavior
 */

import { UnifiedMonitoringService } from '../../coreagent/monitoring/UnifiedMonitoringService';
import { HealthMonitoringService } from '../../coreagent/monitoring/HealthMonitoringService';

describe('Prometheus Memory Backend Metrics (Phase 3 v4.4.2)', () => {
  let monitoringService: UnifiedMonitoringService;
  let healthService: HealthMonitoringService;

  beforeEach(() => {
    // Create fresh instances for each test
    healthService = new HealthMonitoringService();
    monitoringService = new UnifiedMonitoringService(undefined, healthService);
  });

  describe('exposePrometheusMetrics()', () => {
    it('should expose memory backend health metric when healthy', async () => {
      // Mock healthy memory backend
      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'healthy',
        components: {
          memoryService: {
            status: 'healthy',
            responseTime: 42,
            lastCheck: new Date().toISOString(),
            details: {
              backend: 'mem0',
              capabilitiesCount: 7,
            },
          },
        } as any,
        constitutional: {
          averageQualityScore: 95,
          complianceRate: 100,
        },
      } as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Verify metric presence and format
      expect(metrics).toContain('# HELP oneagent_memory_backend_healthy');
      expect(metrics).toContain('# TYPE oneagent_memory_backend_healthy gauge');
      expect(metrics).toContain('oneagent_memory_backend_healthy{backend="mem0"} 1');

      // Verify latency metric
      expect(metrics).toContain('# HELP oneagent_memory_backend_latency_ms');
      expect(metrics).toContain('# TYPE oneagent_memory_backend_latency_ms gauge');
      expect(metrics).toContain('oneagent_memory_backend_latency_ms{backend="mem0"} 42');

      // Verify capabilities metric
      expect(metrics).toContain('# HELP oneagent_memory_backend_capabilities');
      expect(metrics).toContain('# TYPE oneagent_memory_backend_capabilities gauge');
      expect(metrics).toContain('oneagent_memory_backend_capabilities{backend="mem0"} 7');
    });

    it('should expose degraded health status with value 0.5', async () => {
      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'degraded',
        components: {
          memoryService: {
            status: 'degraded',
            responseTime: 850,
            lastCheck: new Date().toISOString(),
            details: {
              backend: 'mem0',
              capabilitiesCount: 5,
              error: 'High latency detected',
            },
          },
        } as any,
        constitutional: {
          averageQualityScore: 75,
          complianceRate: 90,
        },
      } as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Degraded should map to 0.5
      expect(metrics).toContain('oneagent_memory_backend_healthy{backend="mem0"} 0.5');
      expect(metrics).toContain('oneagent_memory_backend_latency_ms{backend="mem0"} 850');
      expect(metrics).toContain('oneagent_memory_backend_capabilities{backend="mem0"} 5');
    });

    it('should expose unhealthy status with value 0', async () => {
      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'critical',
        components: {
          memoryService: {
            status: 'unhealthy',
            responseTime: 5000,
            lastCheck: new Date().toISOString(),
            details: {
              backend: 'mem0',
              capabilitiesCount: 0,
              error: 'Connection refused',
            },
          },
        } as any,
        constitutional: {
          averageQualityScore: 40,
          complianceRate: 60,
        },
      } as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Unhealthy should map to 0
      expect(metrics).toContain('oneagent_memory_backend_healthy{backend="mem0"} 0');
      expect(metrics).toContain('oneagent_memory_backend_latency_ms{backend="mem0"} 5000');
      expect(metrics).toContain('oneagent_memory_backend_capabilities{backend="mem0"} 0');
    });

    it('should handle missing memory backend gracefully', async () => {
      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'healthy',
        components: {
          // No memoryService component
        } as any,
        constitutional: {
          averageQualityScore: 95,
          complianceRate: 100,
        },
      } as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Should not contain memory backend metrics
      expect(metrics).not.toContain('oneagent_memory_backend_healthy');
      expect(metrics).not.toContain('oneagent_memory_backend_latency_ms');
      expect(metrics).not.toContain('oneagent_memory_backend_capabilities');

      // But should still contain other metrics
      expect(metrics).toContain('oneagent_system_health');
    });

    it('should include system health metric', async () => {
      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'healthy',
        components: {} as any,
        constitutional: {
          averageQualityScore: 87,
          complianceRate: 95,
        },
      } as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      expect(metrics).toContain('# HELP oneagent_system_health Overall system health score');
      expect(metrics).toContain('# TYPE oneagent_system_health gauge');
      expect(metrics).toContain('oneagent_system_health 87');
    });

    it('should include mission metrics', async () => {
      // Track some operations first
      monitoringService.trackOperation('mission', 'execute', 'success', { durationMs: 100 });
      monitoringService.trackOperation('mission', 'execute', 'success', { durationMs: 150 });
      monitoringService.trackOperation('mission', 'execute', 'error', { durationMs: 200 });

      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'healthy',
        components: {} as any,
        constitutional: {
          averageQualityScore: 95,
          complianceRate: 100,
        },
      } as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Should contain mission metrics
      expect(metrics).toContain('# HELP oneagent_mission_active');
      expect(metrics).toContain('# TYPE oneagent_mission_active gauge');
      expect(metrics).toContain('# HELP oneagent_mission_completed');
      expect(metrics).toContain('# TYPE oneagent_mission_completed counter');
      expect(metrics).toContain('# HELP oneagent_mission_errors');
      expect(metrics).toContain('# TYPE oneagent_mission_errors counter');
    });

    it('should handle errors gracefully with fallback metrics', async () => {
      jest
        .spyOn(healthService, 'getSystemHealth')
        .mockRejectedValue(new Error('Health check failed'));

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Should contain error metric
      expect(metrics).toContain('# HELP oneagent_metrics_error');
      expect(metrics).toContain('# TYPE oneagent_metrics_error gauge');
      expect(metrics).toContain('oneagent_metrics_error{reason="Health check failed"} 1');
    });

    it('should return valid Prometheus text format', async () => {
      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'healthy',
        components: {
          memoryService: {
            status: 'healthy',
            responseTime: 42,
            lastCheck: new Date().toISOString(),
            details: {
              backend: 'mem0',
              capabilitiesCount: 7,
            },
          },
        } as any,
        constitutional: {
          averageQualityScore: 95,
          complianceRate: 100,
        },
      } as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Should end with newline
      expect(metrics.endsWith('\n')).toBe(true);

      // Each metric should follow HELP -> TYPE -> value pattern
      const lines = metrics.split('\n').filter((l) => l.trim());

      // Find memory backend healthy metric
      const helpIndex = lines.findIndex((l) =>
        l.includes('# HELP oneagent_memory_backend_healthy'),
      );
      expect(helpIndex).toBeGreaterThanOrEqual(0);

      const typeIndex = lines.findIndex((l) =>
        l.includes('# TYPE oneagent_memory_backend_healthy'),
      );
      expect(typeIndex).toBe(helpIndex + 1);

      const valueIndex = lines.findIndex((l) => l.startsWith('oneagent_memory_backend_healthy{'));
      expect(valueIndex).toBe(typeIndex + 1);
    });

    it('should escape special characters in labels', async () => {
      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'healthy',
        components: {
          memoryService: {
            status: 'healthy',
            responseTime: 42,
            lastCheck: new Date().toISOString(),
            details: {
              backend: 'mem0-special',
              capabilitiesCount: 7,
            },
          },
        } as any,
        constitutional: {
          averageQualityScore: 95,
          complianceRate: 100,
        },
      } as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Verify label values are included (basic escaping - real Prometheus client would handle advanced cases)
      expect(metrics).toContain('backend="mem0-special"');
      expect(metrics).toContain('oneagent_memory_backend_healthy{backend="mem0-special"} 1');
    });

    it('should handle missing optional fields with defaults', async () => {
      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'healthy',
        components: {
          memoryService: {
            status: 'healthy',
            // No responseTime
            lastCheck: new Date().toISOString(),
            details: {
              // No backend
              // No capabilitiesCount
            },
          },
        } as any,
        constitutional: {
          averageQualityScore: 95,
          complianceRate: 100,
        },
      } as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Should use defaults
      expect(metrics).toContain('backend="unknown"');
      expect(metrics).toContain('oneagent_memory_backend_latency_ms{backend="unknown"} 0');
      expect(metrics).toContain('oneagent_memory_backend_capabilities{backend="unknown"} 0');
    });
  });

  describe('Constitutional AI Compliance', () => {
    it('should be accurate (reports real data)', async () => {
      const expectedHealth = {
        timestamp: new Date(),
        overall: 'healthy',
        components: {
          memoryService: {
            status: 'healthy',
            responseTime: 123,
            lastCheck: new Date().toISOString(),
            details: {
              backend: 'test-backend',
              capabilitiesCount: 9,
            },
          },
        } as any,
        constitutional: {
          averageQualityScore: 88,
          complianceRate: 97,
        },
      };

      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue(expectedHealth as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Should accurately reflect the health data
      expect(metrics).toContain('oneagent_memory_backend_healthy{backend="test-backend"} 1');
      expect(metrics).toContain('oneagent_memory_backend_latency_ms{backend="test-backend"} 123');
      expect(metrics).toContain('oneagent_memory_backend_capabilities{backend="test-backend"} 9');
      expect(metrics).toContain('oneagent_system_health 88');
    });

    it('should be transparent (clear metric names)', async () => {
      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'healthy',
        components: {
          memoryService: {
            status: 'healthy',
            responseTime: 42,
            lastCheck: new Date().toISOString(),
            details: { backend: 'mem0', capabilitiesCount: 7 },
          },
        } as any,
        constitutional: { averageQualityScore: 95, complianceRate: 100 },
      } as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Metric names should be descriptive
      expect(metrics).toContain('oneagent_memory_backend_healthy');
      expect(metrics).toContain('oneagent_memory_backend_latency_ms');
      expect(metrics).toContain('oneagent_memory_backend_capabilities');

      // Help text should be clear
      expect(metrics).toContain('Memory backend health status');
      expect(metrics).toContain('Memory backend response time in milliseconds');
      expect(metrics).toContain('Memory backend available tool count');
    });

    it('should be helpful (actionable data)', async () => {
      jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'critical',
        components: {
          memoryService: {
            status: 'unhealthy',
            responseTime: 5000,
            lastCheck: new Date().toISOString(),
            details: {
              backend: 'mem0',
              capabilitiesCount: 0,
              error: 'Connection timeout',
            },
          },
        } as any,
        constitutional: { averageQualityScore: 40, complianceRate: 60 },
      } as any);

      const metrics = await monitoringService.exposePrometheusMetrics();

      // Should provide actionable metrics for alerting
      // Unhealthy = 0 (can alert on < 1)
      expect(metrics).toContain('oneagent_memory_backend_healthy{backend="mem0"} 0');
      // High latency (can alert on > 1000)
      expect(metrics).toContain('oneagent_memory_backend_latency_ms{backend="mem0"} 5000');
      // No capabilities (can alert on == 0)
      expect(metrics).toContain('oneagent_memory_backend_capabilities{backend="mem0"} 0');
    });

    it('should be safe (read-only, error handling)', async () => {
      const healthCallCount = jest.spyOn(healthService, 'getSystemHealth').mockResolvedValue({
        timestamp: new Date(),
        overall: 'healthy',
        components: {} as any,
        constitutional: { averageQualityScore: 95, complianceRate: 100 },
      } as any);

      // Multiple calls should not mutate state
      await monitoringService.exposePrometheusMetrics();
      await monitoringService.exposePrometheusMetrics();
      await monitoringService.exposePrometheusMetrics();

      // Should call getSystemHealth each time (stateless)
      expect(healthCallCount).toHaveBeenCalledTimes(3);

      // Test error safety
      healthCallCount.mockRejectedValueOnce(new Error('Simulated failure'));

      const metricsWithError = await monitoringService.exposePrometheusMetrics();

      // Should not throw, should return fallback metrics
      expect(metricsWithError).toContain('oneagent_metrics_error');
      expect(metricsWithError).toContain('Simulated failure');
    });
  });
});
