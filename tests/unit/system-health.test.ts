/**
 * Jest Conversion: System Health Validation
 * Ensures backbone services expose expected health structures without using process.exit.
 */
import { unifiedBackbone } from '../../coreagent/utils/UnifiedBackboneService';

describe('system-health (canonical)', () => {
  it('exposes unified backbone health & component services', () => {
    const systemHealth = unifiedBackbone.getSystemHealth();
    expect(systemHealth).toBeTruthy();
    expect(typeof systemHealth.status).toBe('string');

    const services = unifiedBackbone.getServices();
    // Time service
    const currentTime = services.timeService.now();
    expect(currentTime).toHaveProperty('iso');
    expect(currentTime).toHaveProperty('context');

    // Metadata service create()
    const testMetadata = services.metadataService.create('test', 'system-test');
    expect(testMetadata).toHaveProperty('id');
    expect(testMetadata).toHaveProperty('type', 'test');
    expect(testMetadata).toHaveProperty('quality');

    // Cache health
    const cacheHealth = unifiedBackbone.cache.getHealth();
    expect(cacheHealth).toHaveProperty('status');

    // Error handler health
    const errorHealth = unifiedBackbone.errorHandler.getHealth();
    expect(errorHealth).toHaveProperty('handledErrors');
  });
});
