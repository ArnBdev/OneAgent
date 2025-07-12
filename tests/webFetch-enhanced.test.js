// Enhanced WebFetch Tool Test Suite
// Tests all the new functionality added to webFetch.ts

import { WebFetchTool } from '../coreagent/tools/webFetch.js';

async function runEnhancedTests() {
  console.log('🧪 Starting Enhanced WebFetch Tool Tests...\n');

  // Test 1: Basic functionality with mock mode
  console.log('1️⃣ Testing mock mode functionality...');
  const mockTool = new WebFetchTool({ 
    defaultUserAgent: 'OneAgent-Mock-Test/1.0'
  });
  
  try {
    const mockResult = await mockTool.quickFetch('https://example.com/test');
    console.log(`✅ Mock fetch: ${mockResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Word count: ${mockResult.content.wordCount || 0}`);
    console.log(`   Content size: ${mockResult.content.size} bytes`);
  } catch (error) {
    console.log(`❌ Mock fetch failed: ${error.message}`);
  }

  // Test 2: Health check
  console.log('\n2️⃣ Testing health check...');
  try {
    const health = await mockTool.healthCheck();
    console.log(`✅ Health check: ${health.status}`);
    console.log(`   Message: ${health.message}`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }

  // Test 3: Statistics
  console.log('\n3️⃣ Testing statistics...');
  try {
    const stats = mockTool.getStats();
    console.log(`✅ Stats retrieved:`);
    console.log(`   Request count: ${stats.requestCount}`);
    console.log(`   Mock mode: ${stats.mockMode}`);
    console.log(`   Timeout: ${stats.configSummary.timeout}ms`);
    console.log(`   Max retries: ${stats.configSummary.maxRetries}`);
    console.log(`   Content size limit: ${stats.configSummary.maxContentSize}`);
    console.log(`   Rate limit: ${stats.configSummary.rateLimit}`);
  } catch (error) {
    console.log(`❌ Stats failed: ${error.message}`);
  }

  // Test 4: Error classification
  console.log('\n4️⃣ Testing error classification...');
  const testTool = new WebFetchTool();
  
  try {
    // Test with invalid URL to trigger error classification
    const result = await testTool.fetchContent({ 
      url: 'https://invalid-domain-that-should-not-exist-12345.com',
      validateUrl: true
    });
    
    if (!result.success && result.error) {
      console.log(`✅ Error classification working: ${result.statusText}`);
      console.log(`   Error message: ${result.error}`);
    }
  } catch (error) {
    console.log(`✅ Error classification triggered: ${error.message}`);
  }

  // Test 5: Content type handling
  console.log('\n5️⃣ Testing content type handling...');
  try {
    // Test JSON content processing
    const jsonContent = await mockTool.extractContent(
      '{"test": "data", "nested": {"value": 123}}',
      'application/json',
      { url: 'test://json' }
    );
    console.log(`✅ JSON processing: ${jsonContent.wordCount} words extracted`);

    // Test XML content processing  
    const xmlContent = await mockTool.extractContent(
      '<root><item>Test data</item><item>More data</item></root>',
      'application/xml',
      { url: 'test://xml' }
    );
    console.log(`✅ XML processing: ${xmlContent.wordCount} words extracted`);

  } catch (error) {
    console.log(`❌ Content type handling failed: ${error.message}`);
  }

  // Test 6: Content validation and sanitization
  console.log('\n6️⃣ Testing content validation...');
  try {
    const maliciousContent = {
      raw: '<script>alert("xss")</script>Safe content here',
      text: 'javascript:alert("xss") Safe content here',
      contentType: 'text/html',
      encoding: 'utf-8',
      size: 100
    };
    
    const validated = testTool.validateContent(maliciousContent);
    const isSanitized = !validated.text.includes('javascript:alert') && 
                        validated.text.includes('javascript-blocked:');
    
    console.log(`✅ Content sanitization: ${isSanitized ? 'WORKING' : 'FAILED'}`);
    console.log(`   Sanitized text: "${validated.text.substring(0, 50)}..."`);
    
  } catch (error) {
    console.log(`❌ Content validation failed: ${error.message}`);
  }

  // Test 7: Summary extraction
  console.log('\n7️⃣ Testing summary extraction...');
  try {
    const longText = 'This is a very long piece of text. '.repeat(50) + 
                     'This should be truncated at a sentence boundary. ' +
                     'This part should not appear in the summary.';
    
    const summary = testTool.extractSummary(longText, 200);
    const isTruncated = summary.length < longText.length && summary.endsWith('.');
    
    console.log(`✅ Summary extraction: ${isTruncated ? 'WORKING' : 'FAILED'}`);
    console.log(`   Original: ${longText.length} chars, Summary: ${summary.length} chars`);
    
  } catch (error) {
    console.log(`❌ Summary extraction failed: ${error.message}`);
  }

  console.log('\n🏁 Enhanced WebFetch Tool Tests Complete!');
}

// Run the tests
runEnhancedTests().catch(console.error);

export { runEnhancedTests };
