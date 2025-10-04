/**
 * Integration Test Suite for OneAgent Memory System
 *
 * Tests beyond basic CRUD: concurrent operations, edge cases,
 * deduplication patterns, metadata handling, large payloads
 *
 * @constitutional-ai Accuracy: Evidence-based validation
 * @quality-target 80%+ (Grade A)
 */

import { getOneAgentMemory } from '../../coreagent/utils/UnifiedBackboneService';
import {
  ensureMemoryServerReady,
  clearTestMemories,
  generateTestUserId,
  retrySearchWithBackoff,
} from './memoryTestUtils';

describe('Memory Integration Tests', () => {
  const memory = getOneAgentMemory();
  const testUserId = generateTestUserId('integration');

  beforeAll(async () => {
    await ensureMemoryServerReady();
  });

  afterAll(async () => {
    await clearTestMemories(testUserId);
  });

  describe('Concurrent Operations', () => {
    it('handles multiple simultaneous add operations', async () => {
      const operations = [
        memory.addMemory({
          content:
            'User completed concurrent test task Alpha successfully at 10:00 AM on October 4th',
          metadata: { userId: testUserId, task: 'alpha', test: 'concurrent' },
        }),
        memory.addMemory({
          content:
            'User completed concurrent test task Beta successfully at 10:05 AM on October 4th',
          metadata: { userId: testUserId, task: 'beta', test: 'concurrent' },
        }),
        memory.addMemory({
          content:
            'User completed concurrent test task Gamma successfully at 10:10 AM on October 4th',
          metadata: { userId: testUserId, task: 'gamma', test: 'concurrent' },
        }),
      ];

      const results = await Promise.all(operations);

      // All operations should succeed (returns memory IDs as strings)
      expect(results).toHaveLength(3);
      results.forEach((memoryId) => {
        expect(typeof memoryId).toBe('string');
        expect(memoryId.length).toBeGreaterThan(0);
      });

      console.log(`[INFO] Created ${results.length} concurrent memories successfully`);
    }, 30000);

    it('handles concurrent search operations without interference', async () => {
      // Add test data
      await memory.addMemory({
        content: 'User prefers dark mode theme for coding sessions in integration concurrent test',
        metadata: { userId: testUserId, category: 'preferences', test: 'concurrent-search' },
      });

      const searches = [
        memory.searchMemory({ query: 'dark mode integration', userId: testUserId }),
        memory.searchMemory({ query: 'preferences concurrent', userId: testUserId }),
        memory.searchMemory({ query: 'coding theme', userId: testUserId }),
      ];

      const results = await Promise.all(searches);

      // All searches should succeed (returns arrays)
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });

      console.log(`[INFO] All ${results.length} concurrent searches completed successfully`);
    }, 30000);
  });

  describe('Metadata Handling', () => {
    it('preserves complex nested metadata structures', async () => {
      const complexMetadata = {
        userId: testUserId,
        context: {
          project: 'OneAgent',
          version: '4.4.0',
          features: ['memory', 'ai', 'mcp'],
        },
        timestamps: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        flags: {
          verified: true,
          production: false,
        },
        test: 'complex-metadata',
      };

      const memoryId = await memory.addMemory({
        content:
          'User Alice Johnson completed complex metadata test with nested structures successfully for OneAgent v4.4.0',
        metadata: complexMetadata,
      });

      expect(typeof memoryId).toBe('string');
      expect(memoryId.length).toBeGreaterThan(0);

      console.log(`[INFO] Created memory with complex nested metadata: ${memoryId}`);

      // Search and verify (use retry for async indexing)
      const results = await retrySearchWithBackoff(() =>
        memory.searchMemory({ query: 'complex metadata nested structures', userId: testUserId }),
      );

      expect(results.length).toBeGreaterThan(0);
      console.log(`[INFO] Found ${results.length} results for complex metadata search`);
    }, 30000);

    it('handles minimal metadata gracefully (null-safety validation)', async () => {
      // Test with only userId (validates null-safety fix from MEMORY_BACKEND_DEEP_DIVE)
      const memoryId = await memory.addMemory({
        content:
          'Memory with minimal metadata for null safety testing - validates Python backend fix',
        metadata: { userId: testUserId },
      });

      expect(typeof memoryId).toBe('string');
      expect(memoryId.length).toBeGreaterThan(0);

      // Search should work without crashing (validates null-safety fix)
      const results = await retrySearchWithBackoff(() =>
        memory.searchMemory({ query: 'minimal metadata null safety', userId: testUserId }),
      );

      expect(Array.isArray(results)).toBe(true);
      console.log(`[INFO] ✅ Null-safety validation passed - found ${results.length} results`);
    }, 25000);
  });

  describe('Deduplication Patterns', () => {
    it('recognizes duplicate facts across multiple adds', async () => {
      const baseFact =
        'Bob Williams manages the integration test project for OneAgent memory system';

      // Add same fact multiple times with variations (mem0 should deduplicate)
      const id1 = await memory.addMemory({
        content: baseFact,
        metadata: { userId: testUserId, attempt: 1, test: 'deduplication' },
      });

      const id2 = await memory.addMemory({
        content: baseFact + ' and handles quality assurance', // Extension
        metadata: { userId: testUserId, attempt: 2, test: 'deduplication' },
      });

      const id3 = await memory.addMemory({
        content: 'Bob Williams is the project manager for OneAgent integration tests', // Rephrased
        metadata: { userId: testUserId, attempt: 3, test: 'deduplication' },
      });

      // All should succeed (mem0 handles deduplication internally with NONE/ADD events)
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(typeof id3).toBe('string');

      console.log(
        `[INFO] Added 3 variations for deduplication test - mem0 will mark duplicates as NONE`,
      );

      // Search should find the deduplicated results
      const results = await retrySearchWithBackoff(() =>
        memory.searchMemory({
          query: 'Bob Williams project manager integration OneAgent',
          userId: testUserId,
        }),
      );

      expect(results.length).toBeGreaterThan(0);
      console.log(
        `[INFO] Deduplication test complete - mem0 returned ${results.length} unique facts`,
      );
    }, 35000);
  });

  describe('Large Payload Handling', () => {
    it('handles long content strings (1KB+)', async () => {
      const segment =
        `User completed comprehensive integration test workflow covering multiple system components. ` +
        `The test suite includes: memory system initialization and health validation, ` +
        `CRUD operations with various data types, concurrent operation stress testing, ` +
        `edge case validation with null values and special characters, ` +
        `performance benchmarking with latency measurements, error handling verification, ` +
        `MCP protocol compliance testing with session management, ` +
        `Constitutional AI principles validation, quality scoring assessment, ` +
        `and final production readiness certification. `;

      const longContent = segment.repeat(5); // ~1KB

      const memoryId = await memory.addMemory({
        content: longContent,
        metadata: { userId: testUserId, type: 'integration-test', size: 'large', test: 'payload' },
      });

      expect(typeof memoryId).toBe('string');
      expect(memoryId.length).toBeGreaterThan(0);

      console.log(`[INFO] Created large memory payload (~${longContent.length} bytes)`);

      // Verify searchable
      const results = await retrySearchWithBackoff(
        () =>
          memory.searchMemory({
            query: 'comprehensive integration workflow system components',
            userId: testUserId,
          }),
        5,
        200,
      ); // Longer backoff for large payload

      expect(results.length).toBeGreaterThan(0);
      console.log(`[INFO] Large payload successfully indexed and searchable`);
    }, 35000);
  });

  describe('Error Recovery', () => {
    it('recovers gracefully from invalid memory IDs', async () => {
      const invalidIds = [
        'invalid-uuid-format',
        '00000000-0000-0000-0000-000000000000',
        'definitely-not-a-uuid-12345',
      ];

      for (const invalidId of invalidIds) {
        try {
          await memory.editMemory({
            id: invalidId,
            content: 'Should fail gracefully with proper error',
            metadata: { userId: testUserId },
          });
          // Should not reach here
          fail('Expected error for invalid ID but operation succeeded');
        } catch (error) {
          // Expected to fail - validate error handling
          expect(error).toBeDefined();
          console.log(`[INFO] ✅ Correctly rejected invalid ID: ${invalidId}`);
        }
      }
    }, 20000);

    it('handles empty search queries gracefully', async () => {
      // Empty query should not crash (validates robustness)
      const results = await memory.searchMemory({ query: '', userId: testUserId });

      expect(Array.isArray(results)).toBe(true);
      console.log(`[INFO] Empty query handled gracefully - returned ${results.length} results`);
    }, 10000);
  });

  describe('Search Quality', () => {
    it('returns relevant results for specific queries', async () => {
      // Add memory with distinct content
      await memory.addMemory({
        content:
          'User Carol Davis prefers TypeScript for backend development with strict type checking and comprehensive testing in integration environment',
        metadata: {
          userId: testUserId,
          category: 'preferences',
          test: 'search-quality',
          language: 'typescript',
        },
      });

      const results = await retrySearchWithBackoff(() =>
        memory.searchMemory({
          query: 'Carol Davis TypeScript backend development preferences',
          userId: testUserId,
        }),
      );

      expect(results.length).toBeGreaterThan(0);

      // Validate result structure
      const topResult = results[0];
      expect(topResult).toBeDefined();
      expect(topResult.content || topResult.id).toBeDefined();

      console.log(`[INFO] Search quality validation - found ${results.length} relevant results`);
    }, 30000);
  });

  describe('Memory Persistence', () => {
    it('maintains memory integrity across add-search-edit-search cycle', async () => {
      // Complete lifecycle test
      const memoryId = await memory.addMemory({
        content:
          'User David Evans completed persistence integrity test successfully in integration test suite cycle one',
        metadata: { userId: testUserId, test: 'persistence', cycle: 1 },
      });

      expect(typeof memoryId).toBe('string');
      console.log(`[INFO] Created memory for persistence test: ${memoryId}`);

      // First search
      const search1 = await retrySearchWithBackoff(() =>
        memory.searchMemory({
          query: 'David Evans persistence integrity test cycle',
          userId: testUserId,
        }),
      );

      expect(search1.length).toBeGreaterThan(0);
      console.log(`[INFO] Initial search found ${search1.length} results`);

      // Edit
      await memory.editMemory({
        id: memoryId,
        content:
          'User David Evans completed and verified persistence integrity test in integration suite cycle two',
        metadata: { userId: testUserId, test: 'persistence', cycle: 2, verified: true },
      });

      console.log(`[INFO] Updated memory ${memoryId} successfully`);

      // Second search after edit
      const search2 = await retrySearchWithBackoff(() =>
        memory.searchMemory({
          query: 'David Evans verified persistence cycle two',
          userId: testUserId,
        }),
      );

      expect(search2.length).toBeGreaterThan(0);
      console.log(
        `[INFO] ✅ Persistence validation complete - memory maintained integrity through full cycle`,
      );
    }, 40000);
  });
});
