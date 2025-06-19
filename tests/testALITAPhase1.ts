/**
 * ALITA Phase 1 Implementation Test Runner
 * 
 * Purpose: Validate Phase 1 implementation without external test dependencies
 * Why: Ensure all components work correctly before full integration
 * 
 * @version 1.0.0
 * @date 2025-06-15
 */

import { MetadataIntelligentLogger } from '../coreagent/tools/MetadataIntelligentLogger';
import { ConstitutionalValidator } from '../coreagent/validation/ConstitutionalValidator';
import { MemoryClient } from '../coreagent/memory/MemoryClient';
import { PerformanceMonitor } from '../coreagent/monitoring/PerformanceMonitor';
import { ALITAPhase1Integration } from '../coreagent/integration/ALITAPhase1Integration';

/**
 * Simple test runner for ALITA Phase 1
 * WHY: Validate implementation without external dependencies
 */
class ALITAPhase1TestRunner {
  private testResults: { name: string; passed: boolean; details?: any }[] = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting ALITA Phase 1 Implementation Tests\n');

    // Test individual components
    await this.testConstitutionalValidator();
    await this.testPerformanceMonitor();
    await this.testMemoryClient();
    await this.testMetadataIntelligentLogger();
    await this.testPhase1Integration();

    // Report results
    this.reportResults();
  }

  async testConstitutionalValidator(): Promise<void> {
    console.log('Testing Constitutional Validator...');
    const validator = new ConstitutionalValidator();

    try {
      // Test basic validation
      const result1 = await validator.validate('This is a helpful response because it provides clear guidance.');
      this.addResult('Constitutional Validator - Basic validation', result1.passed && result1.score > 50);

      // Test privacy assessment
      const result2 = await validator.assessPrivacy('Can you help me with programming?');
      this.addResult('Constitutional Validator - Privacy assessment', result2.passed);

      // Test sensitive data detection
      const result3 = await validator.assessPrivacy('My email is test@example.com');
      this.addResult('Constitutional Validator - Sensitive data detection', !result3.passed);

    } catch (error) {
      this.addResult('Constitutional Validator - Error handling', false, error);
    }
  }

  async testPerformanceMonitor(): Promise<void> {
    console.log('Testing Performance Monitor...');
    const monitor = new PerformanceMonitor();

    try {
      // Record some test metrics
      await monitor.recordLatency('test_operation', 25);
      await monitor.recordLatency('test_operation', 30);
      await monitor.recordLatency('test_operation', 35);

      const metrics = await monitor.getMetrics('test_operation');
      const averageWithinTarget = metrics.averageLatency < 50;
      
      this.addResult('Performance Monitor - Latency tracking', averageWithinTarget);
      this.addResult('Performance Monitor - Metrics calculation', metrics.totalOperations === 3);

      // Test performance summary
      const summary = await monitor.getPerformanceSummary();
      this.addResult('Performance Monitor - Summary generation', summary.healthStatus === 'HEALTHY');

    } catch (error) {
      this.addResult('Performance Monitor - Error handling', false, error);
    }
  }

  async testMemoryClient(): Promise<void> {
    console.log('Testing Memory Client...');
    const memoryClient = new MemoryClient();

    try {
      // Test metadata storage
      const metadataId = await memoryClient.storeConversationMetadata({
        userId: 'test-user-001',
        sessionId: 'test-session-001',
        messageAnalysis: { test: 'data' }
      });
      
      this.addResult('Memory Client - Metadata storage', typeof metadataId === 'string');

      // Test health check
      const health = await memoryClient.healthCheck();
      this.addResult('Memory Client - Health check', typeof health.connected === 'boolean');

    } catch (error) {
      this.addResult('Memory Client - Error handling', false, error);
    }
  }

  async testMetadataIntelligentLogger(): Promise<void> {
    console.log('Testing MetadataIntelligentLogger...');
    
    const validator = new ConstitutionalValidator();
    const memoryClient = new MemoryClient();
    const monitor = new PerformanceMonitor();
    
    const logger = new MetadataIntelligentLogger(validator, memoryClient, monitor);

    try {
      // Test message analysis
      const startTime = Date.now();
      const analysis = await logger.analyzeMessage({
        id: 'test-msg-001',
        userId: 'test-user-001',
        sessionId: 'test-session-001',
        content: 'Can you please help me implement a React component? Thank you.',
        timestamp: new Date()
      });
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      
      this.addResult('MetadataIntelligentLogger - Message analysis', analysis.messageId === 'test-msg-001');
      this.addResult('MetadataIntelligentLogger - Performance target', processingTime < 50);
      this.addResult('MetadataIntelligentLogger - Expertise detection', typeof analysis.expertiseLevel === 'string');
      this.addResult('MetadataIntelligentLogger - Style detection', typeof analysis.communicationStyle === 'string');

      // Test privacy detection
      const publicLevel = await logger.detectPrivacyLevel('How do I implement a function?');
      this.addResult('MetadataIntelligentLogger - Public privacy detection', publicLevel === 'public');

      const sensitiveLevel = await logger.detectPrivacyLevel('My password is secret123');
      this.addResult('MetadataIntelligentLogger - Sensitive privacy detection', sensitiveLevel === 'sensitive');

    } catch (error) {
      this.addResult('MetadataIntelligentLogger - Error handling', false, error);
    }
  }

  async testPhase1Integration(): Promise<void> {
    console.log('Testing Phase 1 Integration...');
    
    const validator = new ConstitutionalValidator();
    const memoryClient = new MemoryClient();
    const monitor = new PerformanceMonitor();
    
    const integration = new ALITAPhase1Integration(validator, memoryClient, monitor);

    try {
      // Test message processing
      const processedMessage = await integration.processUserMessage({
        id: 'integration-test-001',
        content: 'Test message for integration',
        userId: 'test-user-integration'
      });

      this.addResult('Phase 1 Integration - Message processing', 
        processedMessage.metadata && processedMessage.metadata.alitaProcessed);

      // Test health check
      const health = await integration.healthCheck();
      this.addResult('Phase 1 Integration - Health check', typeof health.healthy === 'boolean');

      // Test metrics
      const metrics = await integration.getPhase1Metrics();
      this.addResult('Phase 1 Integration - Metrics retrieval', metrics.phase === 'Phase 1 - MetadataIntelligentLogger');

    } catch (error) {
      this.addResult('Phase 1 Integration - Error handling', false, error);
    }
  }

  private addResult(name: string, passed: boolean, details?: any): void {
    this.testResults.push({ name, passed, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}: ${name}`);
    if (!passed && details) {
      console.log(`    Error: ${details instanceof Error ? details.message : details}`);
    }
  }

  private reportResults(): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log('\n📊 ALITA Phase 1 Test Results Summary:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests} ✅`);
    console.log(`  Failed: ${failedTests} ❌`);
    console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.name}`);
      });
    }

    const overallSuccess = failedTests === 0;
    console.log(`\n🚀 ALITA Phase 1 Implementation: ${overallSuccess ? 'READY FOR DEPLOYMENT' : 'NEEDS FIXES'}`);
    
    if (overallSuccess) {
      console.log('\n✅ All tests passed! Phase 1 is ready for integration with OneAgent MCP server.');
      console.log('📋 Next Steps:');
      console.log('  1. Integrate ALITAPhase1MCPIntegration with MCP server');
      console.log('  2. Configure memory client with actual OneAgent memory system');
      console.log('  3. Start Phase 2: SessionContextManager implementation');
    }
  }
}

/**
 * Run the tests
 */
async function runTests(): Promise<void> {
  const runner = new ALITAPhase1TestRunner();
  await runner.runAllTests();
}

// Export for use as module or run directly
export { ALITAPhase1TestRunner };

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}
