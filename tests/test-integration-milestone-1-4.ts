/**
 * Milestone 1.4 Integration Test
 * Tests the complete integration between UI and backend for OneAgent
 */

import axios from 'axios';
import WebSocket from 'ws';

const API_BASE = 'http://localhost:8081/api';
const WS_URL = 'ws://localhost:8081';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string, data?: any) {
  results.push({ name, passed, error, data });
  console.log(`${passed ? '✅' : '❌'} ${name}${error ? ` - ${error}` : ''}`);
}

async function testAPIEndpoints() {
  console.log('\n🔧 Testing API Endpoints...\n');

  // Test System Status
  try {
    const response = await axios.get(`${API_BASE}/system/status`);
    logTest('System Status API', response.data.success, undefined, response.data.data);
  } catch (error) {
    logTest('System Status API', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test System Health
  try {
    const response = await axios.get(`${API_BASE}/system/health`);
    logTest('System Health API', response.data.success, undefined, response.data.data);
  } catch (error) {
    logTest('System Health API', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test Performance Metrics
  try {
    const response = await axios.get(`${API_BASE}/performance/metrics`);
    logTest('Performance Metrics API', response.data.success, undefined, response.data.data);
  } catch (error) {
    logTest('Performance Metrics API', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test Memory Search
  try {
    const response = await axios.get(`${API_BASE}/memory/search?query=React`);
    logTest('Memory Search API', response.data.success, undefined, response.data.data);
  } catch (error) {
    logTest('Memory Search API', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test Memory Creation
  try {
    const response = await axios.post(`${API_BASE}/memory/create`, {
      content: 'Integration test memory - TypeScript is awesome!',
      metadata: { category: 'test', importance: 0.8 }
    });
    logTest('Memory Creation API', response.data.success, undefined, response.data.data);
  } catch (error) {
    logTest('Memory Creation API', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test Memory Analytics
  try {
    const response = await axios.get(`${API_BASE}/memory/analytics`);
    logTest('Memory Analytics API', response.data.success, undefined, response.data.data);
  } catch (error) {
    logTest('Memory Analytics API', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test Configuration
  try {
    const response = await axios.get(`${API_BASE}/config`);
    const hasConfig = response.data.success && response.data.data;
    logTest('Configuration API', hasConfig, undefined, response.data.data);
  } catch (error) {
    logTest('Configuration API', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test Configuration Update
  try {
    const response = await axios.post(`${API_BASE}/config`, {
      MEMORY_RETENTION_DAYS: 45,
      AUTO_CATEGORIZATION: true
    });
    logTest('Configuration Update API', response.data.success, undefined, response.data.data);
  } catch (error) {
    logTest('Configuration Update API', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testWebSocketConnection(): Promise<void> {
  console.log('\n🔌 Testing WebSocket Connection...\n');

  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let messageReceived = false;
    
    const timeout = setTimeout(() => {
      if (!messageReceived) {
        logTest('WebSocket Real-time Updates', false, 'No messages received within 10 seconds');
      }
      ws.close();
      resolve();
    }, 10000);

    ws.on('open', () => {
      logTest('WebSocket Connection', true);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        logTest('WebSocket Real-time Updates', true, undefined, message.type);
        messageReceived = true;
        clearTimeout(timeout);
        ws.close();
        resolve();
      } catch (error) {
        logTest('WebSocket Message Parsing', false, error instanceof Error ? error.message : 'Unknown error');
      }
    });

    ws.on('error', (error) => {
      logTest('WebSocket Connection', false, error.message);
      clearTimeout(timeout);
      resolve();
    });

    ws.on('close', () => {
      if (!messageReceived) {
        logTest('WebSocket Connection', false, 'Connection closed before test completed');
      }
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function testEndToEndDataFlow() {
  console.log('\n🔄 Testing End-to-End Data Flow...\n');

  try {
    // 1. Create a memory
    const createResponse = await axios.post(`${API_BASE}/memory/create`, {
      content: 'End-to-end test: User prefers dark mode UI',
      metadata: { category: 'ui-preference', importance: 0.7 }
    });
    
    if (!createResponse.data.success) {
      logTest('E2E: Memory Creation', false, 'Failed to create memory');
      return;
    }
    
    logTest('E2E: Memory Creation', true);

    // 2. Search for the created memory
    const searchResponse = await axios.get(`${API_BASE}/memory/search?query=dark mode`);
    
    if (!searchResponse.data.success) {
      logTest('E2E: Memory Search', false, 'Failed to search memories');
      return;
    }
    
    const hasSearchResults = searchResponse.data.data.memories.length > 0;
    logTest('E2E: Memory Search', hasSearchResults, hasSearchResults ? undefined : 'No search results found');

    // 3. Check analytics update
    const analyticsResponse = await axios.get(`${API_BASE}/memory/analytics`);
    
    if (!analyticsResponse.data.success) {
      logTest('E2E: Analytics Update', false, 'Failed to fetch analytics');
      return;
    }
    
    const analytics = analyticsResponse.data.data;
    const hasCategories = Object.keys(analytics.categoryBreakdown).length > 0;
    logTest('E2E: Analytics Update', hasCategories);

    // 4. Test performance metrics
    const metricsResponse = await axios.get(`${API_BASE}/performance/metrics`);
    
    if (!metricsResponse.data.success) {
      logTest('E2E: Performance Tracking', false, 'Failed to fetch metrics');
      return;
    }
    
    const metrics = metricsResponse.data.data;
    const hasOperations = metrics.operations && metrics.operations.length > 0;
    logTest('E2E: Performance Tracking', hasOperations);

  } catch (error) {
    logTest('E2E: Complete Flow', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function runIntegrationTests() {
  console.log('🚀 OneAgent Milestone 1.4 Integration Test Suite');
  console.log('='.repeat(60));
  
  const startTime = Date.now();

  try {
    await testAPIEndpoints();
    await testWebSocketConnection();
    await testEndToEndDataFlow();
  } catch (error) {
    console.error('Test suite failed:', error);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log(`Duration: ${duration}ms`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Milestone 1.4 integration is successful.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
  }

  // Detailed failure report
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('\n❌ Failed Tests:');
    failures.forEach(f => {
      console.log(`  • ${f.name}: ${f.error}`);
    });
  }

  console.log('\n✅ Integration Test Complete!');
}

// Run the tests
runIntegrationTests().catch(console.error);
