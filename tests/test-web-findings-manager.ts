// Test script for WebFindingsManager functionality
// Run this with: ts-node tests/test-web-findings-manager.ts

import { WebFindingsManager } from '../coreagent/intelligence/webFindingsManager';
import { BraveSearchResponse } from '../coreagent/types/braveSearch';
import { WebFetchResponse } from '../coreagent/types/webFetch';

async function testWebFindingsManager() {
  console.log('🧪 Starting WebFindingsManager tests...\n');

  // Initialize WebFindingsManager
  const manager = new WebFindingsManager({
    storage: {
      enableCaching: true,
      enablePersistence: true,
      maxCacheSize: 50, // MB
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      compressionThreshold: 25 * 1024, // 25KB
      autoCleanupInterval: 30 * 60 * 1000 // 30 minutes
    },
    classification: {
      autoClassify: true,
      importanceThreshold: 0.5,
      devAgentRelevanceBoost: 2.0
    }
  });

  try {
    // Test 1: Store search finding
    console.log('📊 Test 1: Storing search finding...');
    const mockSearchResponse: BraveSearchResponse = {
      query: {
        original: 'TypeScript React tutorial',
        show_strict_warning: false,
        is_navigational: false,
        is_geolocal: false,
        local_decision: '',
        local_locations_idx: 0,
        is_trending: false,
        is_news_breaking: false,
        ask_for_location: false,
        language: { main: 'en', language_display: 'English' },
        spellcheck_off: false,
        country: 'US',
        bad_results: false,
        should_fallback: false,
        postal_code: '',
        city: '',
        header_country: '',
        more_results_available: true,
        custom_location_label: '',
        reddit_cluster: ''
      },
      mixed: {
        type: 'mixed',
        main: [],
        top: [],
        side: []
      },
      web: {
        type: 'search',
        results: [
          {
            title: 'TypeScript React Tutorial - Complete Guide',
            url: 'https://example.com/typescript-react-tutorial',
            description: 'Learn TypeScript with React in this comprehensive tutorial',
            age: '2 days ago',
            language: 'en',
            family_friendly: true
          },
          {
            title: 'Advanced TypeScript Patterns in React',
            url: 'https://example.com/advanced-typescript-react',
            description: 'Advanced patterns and best practices for TypeScript in React applications',
            age: '1 week ago',
            language: 'en',
            family_friendly: true
          }
        ],
        family_friendly: true
      }
    };

    const searchFinding = await manager.storeSearchFinding(
      'TypeScript React tutorial',
      mockSearchResponse,
      'test-user-123',
      'test-session-456'
    );

    console.log(`✅ Search finding stored with ID: ${searchFinding.id}`);
    console.log(`   Importance: ${searchFinding.classification.importance}`);
    console.log(`   Category: ${searchFinding.classification.category}`);
    console.log(`   Results count: ${searchFinding.results.length}\n`);

    // Test 2: Store fetch finding
    console.log('📄 Test 2: Storing fetch finding...');
    const mockFetchResponse: WebFetchResponse = {
      url: 'https://example.com/typescript-react-tutorial',
      finalUrl: 'https://example.com/typescript-react-tutorial',
      statusCode: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-length': '15432'
      },
      content: {
        raw: '<html><head><title>TypeScript React Tutorial</title></head><body>This is a comprehensive guide to using TypeScript with React. Learn about components, hooks, and advanced patterns...</body></html>',
        text: 'TypeScript React Tutorial\n\nThis is a comprehensive guide to using TypeScript with React. Learn about components, hooks, and advanced patterns. TypeScript provides excellent type safety for React applications, making them more robust and maintainable.',
        html: '<html><head><title>TypeScript React Tutorial</title></head><body>This is a comprehensive guide to using TypeScript with React. Learn about components, hooks, and advanced patterns...</body></html>',
        contentType: 'text/html',
        encoding: 'utf-8',
        size: 15432,
        wordCount: 150
      },
      metadata: {
        title: 'TypeScript React Tutorial - Complete Guide',
        description: 'Learn TypeScript with React in this comprehensive tutorial',
        keywords: ['typescript', 'react', 'tutorial', 'javascript'],
        author: 'DevExpert',
        language: 'en',
        ogTitle: 'TypeScript React Tutorial - Complete Guide',
        ogDescription: 'Learn TypeScript with React in this comprehensive tutorial'
      },
      fetchTime: 1250,
      timestamp: new Date().toISOString(),
      success: true
    };

    const fetchFinding = await manager.storeFetchFinding(
      'https://example.com/typescript-react-tutorial',
      mockFetchResponse,
      'test-user-123',
      'test-session-456'
    );

    console.log(`✅ Fetch finding stored with ID: ${fetchFinding.id}`);
    console.log(`   Importance: ${fetchFinding.classification.importance}`);
    console.log(`   Category: ${fetchFinding.classification.category}`);
    console.log(`   Framework: ${fetchFinding.classification.framework || 'None detected'}`);
    console.log(`   Word count: ${fetchFinding.extracted.wordCount}\n`);

    // Test 3: Search findings
    console.log('🔍 Test 3: Searching findings...');
    const searchResults = await manager.searchFindings({
      query: 'TypeScript',
      limit: 5,
      sortBy: 'importance',
      sortOrder: 'desc'
    });

    console.log(`✅ Found ${searchResults.findings.length} findings`);
    console.log(`   Search time: ${searchResults.metadata.searchTime}ms`);
    console.log(`   Cached: ${searchResults.metadata.cached}`);
    
    searchResults.findings.forEach((finding, index) => {
      if ('query' in finding) {
        console.log(`   ${index + 1}. Search: "${finding.query}" (importance: ${finding.classification.importance})`);
      } else {
        console.log(`   ${index + 1}. Fetch: "${finding.metadata.title}" (importance: ${finding.classification.importance})`);
      }
    });
    console.log();

    // Test 4: Get storage statistics
    console.log('📊 Test 4: Getting storage statistics...');
    const stats = await manager.getStorageStats();
    
    console.log(`✅ Storage Statistics:`);
    console.log(`   Cache entries: ${stats.cache.entries}`);
    console.log(`   Cache size: ${stats.cache.size.toFixed(2)}MB`);
    console.log(`   Cache hit rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
    console.log(`   Persistent findings: ${stats.persistent.totalFindings}`);
    console.log(`   Total operations: ${stats.performance.totalOperations}\n`);

    // Test 5: Cleanup findings
    console.log('🧹 Test 5: Cleaning up findings...');
    const cleanupResult = await manager.cleanupFindings();
    
    console.log(`✅ Cleanup completed:`);
    console.log(`   Expired: ${cleanupResult.removed.expired}`);
    console.log(`   Low importance: ${cleanupResult.removed.lowImportance}`);
    console.log(`   Duplicates: ${cleanupResult.removed.duplicates}`);
    console.log(`   Space saved: ${cleanupResult.spaceSaved.toFixed(2)}MB`);
    console.log(`   Operation time: ${cleanupResult.operationTime}ms\n`);

    console.log('🎉 All WebFindingsManager tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests if called directly
if (require.main === module) {
  testWebFindingsManager()
    .then(() => {
      console.log('\n✅ Test suite completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { testWebFindingsManager };
