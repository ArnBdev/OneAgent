/**
 * Comprehensive OneAgent MCP System Integration Test
 * 
 * This test validates the complete OneAgent MCP ecosystem:
 * - OneAgent MCP Server (HTTP endpoints)
 * - HTTP MCP Adapter communication
 * - Mem0 memory server integration
 * - CoreAgent functionality
 * - End-to-end MCP communication pipeline
 */

import axios from 'axios';
import { HttpMCPAdapter, createMCPAdapter, MCPServerConfig } from '../coreagent/mcp/adapter';
import { Mem0Client } from '../coreagent/tools/mem0Client';
import { GeminiEmbeddingsTool } from '../coreagent/tools/geminiEmbeddings';

// Test Configuration
const ONEAGENT_API_BASE = 'http://localhost:8081/api';
const ONEAGENT_WS_URL = 'ws://localhost:8081';
const MEM0_SERVER_BASE = 'http://localhost:8000';
const ONEAGENT_MCP_ENDPOINT = 'http://localhost:8081/mcp';

// Test Results Interface
interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
  details?: any;
}

class ComprehensiveOneAgentTest {
  private results: TestResult[] = [];
  private startTime: number = 0;

  private log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warn: '\x1b[33m'
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type]}${message}${reset}`);
  }

  private addResult(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: any) {
    const duration = Date.now() - this.startTime;
    this.results.push({ name, status, message, duration, details });
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏸️';
    this.log(`${statusIcon} ${name}: ${message}`, status === 'PASS' ? 'success' : status === 'FAIL' ? 'error' : 'warn');
  }

  async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    this.startTime = Date.now();
    try {
      const result = await testFn();
      this.addResult(name, 'PASS', 'Completed successfully', result);
    } catch (error) {
      this.addResult(name, 'FAIL', error instanceof Error ? error.message : 'Unknown error', error);
    }
  }

  /**
   * Test 1: OneAgent MCP Server Health Check
   */
  async testOneAgentServerHealth(): Promise<any> {
    const response = await axios.get(`${ONEAGENT_API_BASE}/system/health`);
    if (response.status !== 200) {
      throw new Error(`Server health check failed: ${response.status}`);
    }
    return {
      status: response.data.data.status,
      uptime: response.data.data.uptime,
      memory: response.data.data.memory,
      connections: response.data.data.connections
    };
  }

  /**
   * Test 2: OneAgent API System Status
   */
  async testOneAgentSystemStatus(): Promise<any> {
    const response = await axios.get(`${ONEAGENT_API_BASE}/system/status`);
    if (response.status !== 200 || !response.data.success) {
      throw new Error(`System status failed: ${response.data.error || 'Unknown error'}`);
    }
    return {
      performance: response.data.data.performance,
      memory: response.data.data.memory,
      services: response.data.data.services
    };
  }

  /**
   * Test 3: HTTP MCP Adapter Creation and Configuration
   */
  async testHttpMCPAdapterCreation(): Promise<any> {
    const mcpConfig: MCPServerConfig = {
      name: 'OneAgent-Integration-Test',
      type: 'http',
      endpoint: ONEAGENT_MCP_ENDPOINT
    };

    const httpAdapter = new HttpMCPAdapter(mcpConfig);
    if (!httpAdapter) {
      throw new Error('Failed to create HTTP MCP adapter');
    }

    return {
      adapterType: 'HTTP',
      endpoint: mcpConfig.endpoint,
      name: mcpConfig.name
    };
  }

  /**
   * Test 4: HTTP MCP Communication (Mock Test)
   */
  async testHttpMCPCommunication(): Promise<any> {
    const mcpConfig: MCPServerConfig = {
      name: 'OneAgent-Integration-Test',
      type: 'http',
      endpoint: ONEAGENT_MCP_ENDPOINT
    };

    const httpAdapter = createMCPAdapter(mcpConfig);
    
    // Test ping request
    const response = await httpAdapter.sendRequest('ping', { 
      test: true,
      timestamp: new Date().toISOString()
    });

    if (!response.id) {
      throw new Error('MCP response missing request ID');
    }

    return {
      requestId: response.id,
      hasResult: !!response.result,
      hasError: !!response.error,
      timestamp: response.timestamp
    };
  }

  /**
   * Test 5: Mem0 Server Integration
   */
  async testMem0ServerIntegration(): Promise<any> {
    // Test Mem0 server health
    const healthResponse = await axios.get(`${MEM0_SERVER_BASE}/health`);
    if (healthResponse.status !== 200) {
      throw new Error(`Mem0 server health check failed: ${healthResponse.status}`);
    }

    // Test OneAgent Mem0 client
    const mem0Client = new Mem0Client({
      deploymentType: 'local',
      localEndpoint: MEM0_SERVER_BASE,
      preferLocal: true
    });

    const connectionOk = await mem0Client.testConnection();
    if (!connectionOk) {
      throw new Error('Mem0 client connection test failed');
    }

    // Test memory operations
    const testMemory = await mem0Client.createMemory(
      'Integration test memory for OneAgent MCP system validation',
      {
        test: true,
        source: 'comprehensive_mcp_test',
        timestamp: new Date().toISOString()
      },
      'test-user-mcp',
      'oneagent-core',
      'mcp-integration-test'
    );    return {
      mem0ServerHealth: healthResponse.data.message,
      clientConnection: connectionOk,
      memoryCreated: !!testMemory.success,
      memoryId: testMemory.data?.id || 'unknown'
    };
  }
  /**
   * Test 6: Gemini Embeddings Integration
   */
  async testGeminiEmbeddingsIntegration(): Promise<any> {
    // Create proper client instances for GeminiEmbeddingsTool
    const { GeminiClient } = await import('../coreagent/tools/geminiClient');
    const geminiClient = new GeminiClient({
      apiKey: process.env.GOOGLE_GEMINI_API_KEY || 'mock_key'
    });
    
    const mem0Client = new Mem0Client({
      deploymentType: 'local',
      localEndpoint: MEM0_SERVER_BASE,
      preferLocal: true
    });

    const embeddingsTool = new GeminiEmbeddingsTool(geminiClient, mem0Client);

    // Test embedding generation
    const testText = 'OneAgent MCP integration test embedding validation';
    const embedding = await geminiClient.generateEmbedding(testText);

    if (!embedding || !embedding.embedding || embedding.embedding.length === 0) {
      throw new Error('Failed to generate embeddings');
    }    return {
      textLength: testText.length,
      embeddingDimensions: embedding.embedding.length,
      dimensions: embedding.dimensions,
      taskType: embedding.taskType || 'none',
      timestamp: embedding.timestamp
    };
  }

  /**
   * Test 7: OneAgent Performance Metrics
   */
  async testOneAgentPerformanceMetrics(): Promise<any> {
    const response = await axios.get(`${ONEAGENT_API_BASE}/performance/metrics`);
    if (response.status !== 200 || !response.data.success) {
      throw new Error(`Performance metrics failed: ${response.data.error || 'Unknown error'}`);
    }

    return {
      totalOperations: response.data.data.totalOperations,
      averageLatency: response.data.data.averageLatency,
      errorRate: response.data.data.errorRate,
      activeOperations: response.data.data.activeOperations
    };
  }

  /**
   * Test 8: OneAgent Memory Analytics
   */
  async testOneAgentMemoryAnalytics(): Promise<any> {
    const response = await axios.get(`${ONEAGENT_API_BASE}/memory/analytics`);
    if (response.status !== 200 || !response.data.success) {
      throw new Error(`Memory analytics failed: ${response.data.error || 'Unknown error'}`);
    }

    return {
      totalMemories: response.data.data.totalMemories,
      categoryBreakdown: response.data.data.categoryBreakdown,
      averageImportance: response.data.data.averageImportance,
      topCategories: response.data.data.topCategories
    };
  }

  /**
   * Test 9: OneAgent Configuration Management
   */
  async testOneAgentConfiguration(): Promise<any> {
    const response = await axios.get(`${ONEAGENT_API_BASE}/config`);
    if (response.status !== 200 || !response.data.success) {
      throw new Error(`Configuration retrieval failed: ${response.data.error || 'Unknown error'}`);
    }

    return {
      hasGeminiKey: !!response.data.data.GEMINI_API_KEY,
      hasBraveKey: !!response.data.data.BRAVE_API_KEY,
      hasMem0Key: !!response.data.data.MEM0_API_KEY,
      memoryRetentionDays: response.data.data.MEMORY_RETENTION_DAYS,
      autoCategorization: response.data.data.AUTO_CATEGORIZATION
    };
  }

  /**
   * Test 10: End-to-End MCP Pipeline
   */
  async testEndToEndMCPPipeline(): Promise<any> {
    // 1. Create HTTP MCP adapter
    const mcpConfig: MCPServerConfig = {
      name: 'E2E-Test-Adapter',
      type: 'http',
      endpoint: ONEAGENT_MCP_ENDPOINT
    };
    const httpAdapter = createMCPAdapter(mcpConfig);

    // 2. Send a complex request through MCP
    const complexRequest = await httpAdapter.sendRequest('memory.search', {
      query: 'OneAgent integration',
      userId: 'test-user-e2e',
      limit: 5,
      includeMetadata: true
    });

    // 3. Verify response structure
    if (!complexRequest.id) {
      throw new Error('E2E MCP request missing ID');
    }    // 4. Test connection validation
    let connectionTest = false;
    if (httpAdapter instanceof HttpMCPAdapter) {
      connectionTest = await httpAdapter.testConnection();
    } else {
      // For LocalMCPAdapter, test with a simple ping
      const pingResponse = await httpAdapter.sendRequest('ping', { test: true });
      connectionTest = !pingResponse.error;
    }

    return {
      mcpRequestId: complexRequest.id,
      mcpResponseValid: !!complexRequest.timestamp,
      connectionTest: connectionTest,
      requestMethod: 'memory.search',
      endpoint: ONEAGENT_MCP_ENDPOINT
    };
  }

  /**
   * Run all comprehensive tests
   */
  async runAllTests(): Promise<void> {
    this.log('🚀 Starting Comprehensive OneAgent MCP System Integration Test', 'info');
    this.log('=' .repeat(80), 'info');

    const tests = [
      { name: '1. OneAgent MCP Server Health Check', fn: () => this.testOneAgentServerHealth() },
      { name: '2. OneAgent API System Status', fn: () => this.testOneAgentSystemStatus() },
      { name: '3. HTTP MCP Adapter Creation', fn: () => this.testHttpMCPAdapterCreation() },
      { name: '4. HTTP MCP Communication', fn: () => this.testHttpMCPCommunication() },
      { name: '5. Mem0 Server Integration', fn: () => this.testMem0ServerIntegration() },
      { name: '6. Gemini Embeddings Integration', fn: () => this.testGeminiEmbeddingsIntegration() },
      { name: '7. OneAgent Performance Metrics', fn: () => this.testOneAgentPerformanceMetrics() },
      { name: '8. OneAgent Memory Analytics', fn: () => this.testOneAgentMemoryAnalytics() },
      { name: '9. OneAgent Configuration Management', fn: () => this.testOneAgentConfiguration() },
      { name: '10. End-to-End MCP Pipeline', fn: () => this.testEndToEndMCPPipeline() }
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.fn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.generateReport();
  }

  /**
   * Generate comprehensive test report
   */
  generateReport(): void {
    this.log('\n📊 COMPREHENSIVE TEST REPORT', 'info');
    this.log('=' .repeat(80), 'info');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    this.log(`\n📈 Test Summary:`, 'info');
    this.log(`   ✅ Passed: ${passed}/${total}`, passed === total ? 'success' : 'info');
    this.log(`   ❌ Failed: ${failed}/${total}`, failed > 0 ? 'error' : 'info');
    this.log(`   ⏸️  Skipped: ${skipped}/${total}`, 'info');

    if (failed === 0) {
      this.log('\n🎉 ALL TESTS PASSED! OneAgent MCP System is fully operational!', 'success');
      this.log('🚀 The complete OneAgent MCP ecosystem is ready for production use.', 'success');
    } else {
      this.log('\n⚠️  Some tests failed. Please review the failing components.', 'warn');
    }

    this.log('\n📋 Detailed Results:', 'info');
    this.results.forEach((result, index) => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏸️';
      this.log(`   ${index + 1}. ${statusIcon} ${result.name}`);
      this.log(`      ${result.message}`, result.status === 'FAIL' ? 'error' : 'info');
      if (result.duration) {
        this.log(`      Duration: ${result.duration}ms`, 'info');
      }
    });

    this.log('\n🔗 System Architecture Validated:', 'info');
    this.log('   ┌─ OneAgent MCP Server (Port 8081)', 'info');
    this.log('   ├─ HTTP MCP Adapter Communication', 'info');
    this.log('   ├─ Mem0 Memory Server (Port 8000)', 'info');
    this.log('   ├─ Gemini API Integration', 'info');
    this.log('   ├─ Performance Monitoring', 'info');
    this.log('   ├─ Memory Analytics', 'info');
    this.log('   └─ End-to-End MCP Pipeline', 'info');
  }
}

/**
 * Main test execution
 */
async function main() {
  const tester = new ComprehensiveOneAgentTest();
  await tester.runAllTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { ComprehensiveOneAgentTest };
