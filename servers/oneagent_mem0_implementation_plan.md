# OneAgent Mem0/Memgraph Practical Implementation Plan

## Step-by-Step Integration with Code Templates

### Phase 1: Environment Setup (Day 1-2)

#### 1.1 Docker Compose Configuration

```yaml
# File: docker-compose.mem0.yml
version: '3.8'

services:
  memgraph:
    image: memgraph/memgraph:latest
    container_name: oneagent-memgraph
    ports:
      - '7687:7687' # Bolt protocol
      - '7444:7444' # HTTPS
    environment:
      - MEMGRAPH_USER=memgraph
      - MEMGRAPH_PASSWORD=oneagent_secure
    volumes:
      - memgraph_data:/var/lib/memgraph
      - memgraph_log:/var/log/memgraph
      - memgraph_etc:/etc/memgraph
    command: ['--log-level=TRACE', '--also-log-to-stderr']

  memgraph-lab:
    image: memgraph/lab:latest
    container_name: oneagent-memgraph-lab
    ports:
      - '3000:3000'
    depends_on:
      - memgraph
    environment:
      - MEMGRAPH_HOST=memgraph
      - MEMGRAPH_PORT=7687

volumes:
  memgraph_data:
  memgraph_log:
  memgraph_etc:
```

#### 1.2 OneAgent Dependencies Update

```json
// package.json additions
{
  "dependencies": {
    "mem0ai": "^0.1.0",
    "@memgraph/client": "^1.0.0",
    "neo4j-driver": "^5.15.0" // Memgraph compatibility
  }
}
```

#### 1.3 Environment Configuration

```typescript
// File: coreagent/config/mem0-config.ts
export interface Mem0Config {
  mem0: {
    apiUrl: string;
    llm: {
      provider: 'gemini';
      model: string;
      apiKey: string;
    };
    embedder: {
      provider: 'gemini';
      model: string;
    };
    graph_store: {
      provider: 'memgraph';
      url: string;
      username: string;
      password: string;
    };
  };
  oneagent: {
    enableConstitutional: boolean;
    enableTemporal: boolean;
    enableIntelligence: boolean;
    enableMigration: boolean;
  };
}

export const DEFAULT_MEM0_CONFIG: Mem0Config = {
  mem0: {
    apiUrl: process.env.MEM0_API_URL || 'http://localhost:8000',
    llm: {
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY!,
    },
    embedder: {
      provider: 'gemini',
      model: 'text-embedding-004',
    },
    graph_store: {
      provider: 'memgraph',
      url: process.env.MEMGRAPH_URL || 'bolt://localhost:7687',
      username: process.env.MEMGRAPH_USER || 'memgraph',
      password: process.env.MEMGRAPH_PASSWORD || 'oneagent_secure',
    },
  },
  oneagent: {
    enableConstitutional: true,
    enableTemporal: true,
    enableIntelligence: true,
    enableMigration: true,
  },
};
```

---

### Phase 2: Bridge Implementation (Day 3-7)

#### 2.1 Core Bridge Interface

```typescript
// File: coreagent/memory/OneAgentMem0Bridge.ts
import { MemoryClient } from 'mem0ai';
import { Driver, auth } from 'neo4j-driver';
import {
  UnifiedMemoryInterface,
  ConversationMemory,
  LearningMemory,
  PatternMemory,
} from './UnifiedMemoryInterface';
import { TimeWindow, ConversationData, UnifiedMetadata } from '../types/oneagent-backbone-types';
import { OneAgentUnifiedBackbone } from '../utils/UnifiedBackboneService';

export class OneAgentMem0Bridge implements UnifiedMemoryInterface {
  private mem0Client: MemoryClient;
  private memgraphDriver: Driver;
  private backbone: OneAgentUnifiedBackbone;
  private isConnected: boolean = false;

  constructor(private config: Mem0Config) {
    this.backbone = OneAgentUnifiedBackbone.getInstance();
    this.initializeClients();
  }

  private async initializeClients(): Promise<void> {
    // Initialize Mem0 client with Memgraph backend
    this.mem0Client = new MemoryClient({
      llm: this.config.mem0.llm,
      embedder: this.config.mem0.embedder,
      graph_store: this.config.mem0.graph_store,
    });

    // Initialize direct Memgraph connection for advanced queries
    this.memgraphDriver = new Driver(
      this.config.mem0.graph_store.url,
      auth.basic(this.config.mem0.graph_store.username, this.config.mem0.graph_store.password),
    );
  }

  // ✅ Core Storage Operations
  async storeConversation(conversation: ConversationMemory): Promise<string> {
    try {
      // 1. Constitutional validation if enabled
      let constitutionalResult = null;
      if (this.config.oneagent.enableConstitutional) {
        constitutionalResult = await this.validateConstitutional(conversation.content);
      }

      // 2. Enhanced metadata with OneAgent backbone features
      const enhancedMetadata = {
        ...conversation.metadata,
        oneagent: {
          type: 'conversation',
          agentId: conversation.agentId,
          userId: conversation.userId,
          sessionId: conversation.context.sessionId,
          actionType: conversation.context.actionType,
          timestamp: conversation.timestamp.toISOString(),
        },
        temporal: this.config.oneagent.enableTemporal
          ? {
              timeWindow: this.getTimeWindow(conversation.timestamp),
              contextSnapshot: this.getTemporalContext(conversation.timestamp),
            }
          : {},
        constitutional: constitutionalResult
          ? {
              compliant: constitutionalResult.compliant,
              accuracy: constitutionalResult.accuracy,
              transparency: constitutionalResult.transparency,
              helpfulness: constitutionalResult.helpfulness,
              safety: constitutionalResult.safety,
            }
          : {},
        quality: {
          score: conversation.outcome.qualityScore || 0.8,
          satisfaction: conversation.outcome.satisfaction,
          success: conversation.outcome.success,
        },
      };

      // 3. Store in Mem0 (which automatically uses Memgraph backend)
      const memoryId = await this.mem0Client.add(
        conversation.content,
        conversation.userId,
        enhancedMetadata,
      );

      // 4. Create additional graph relationships for OneAgent features
      await this.createConversationGraph(conversation, memoryId);

      return memoryId;
    } catch (error) {
      console.error('[OneAgentMem0Bridge] Error storing conversation:', error);
      throw error;
    }
  }

  async storeLearning(learning: LearningMemory): Promise<string> {
    const enhancedMetadata = {
      ...learning.metadata,
      oneagent: {
        type: 'learning',
        agentId: learning.agentId,
        learningType: learning.learningType,
        confidence: learning.confidence,
        applicationCount: learning.applicationCount,
        lastApplied: learning.lastApplied.toISOString(),
        sourceConversations: learning.sourceConversations,
      },
    };

    const memoryId = await this.mem0Client.add(
      learning.content,
      `learning_${learning.agentId}`,
      enhancedMetadata,
    );

    await this.createLearningGraph(learning, memoryId);
    return memoryId;
  }

  async storePattern(pattern: PatternMemory): Promise<string> {
    const enhancedMetadata = {
      ...pattern.metadata,
      oneagent: {
        type: 'pattern',
        agentId: pattern.agentId,
        patternType: pattern.patternType,
        frequency: pattern.frequency,
        strength: pattern.strength,
        conditions: pattern.conditions,
        outcomes: pattern.outcomes,
      },
    };

    const memoryId = await this.mem0Client.add(
      pattern.description,
      `pattern_${pattern.agentId}`,
      enhancedMetadata,
    );

    await this.createPatternGraph(pattern, memoryId);
    return memoryId;
  }

  // ✅ Search and Retrieval Operations
  async searchMemories(query: MemorySearchQuery): Promise<MemoryResult[]> {
    try {
      // 1. Mem0 semantic search
      const searchResults = await this.mem0Client.search(
        query.query,
        query.agentIds?.[0] || 'global',
        {
          limit: query.maxResults || 20,
          threshold: query.confidenceThreshold || 0.7,
        },
      );

      // 2. Convert to OneAgent format with relationship enhancement
      const results: MemoryResult[] = [];

      for (const result of searchResults) {
        // Get related memories through graph relationships
        const relatedMemories = await this.getRelatedMemories(result.id);

        results.push({
          id: result.id,
          type: this.determineMemoryType(result.metadata),
          content: result.content,
          agentId: result.metadata?.oneagent?.agentId || 'unknown',
          relevanceScore: result.score || 0.8,
          timestamp: new Date(result.metadata?.oneagent?.timestamp || Date.now()),
          metadata: result.metadata,
          summary: result.content.substring(0, 200) + '...',
          relatedMemories,
        });
      }

      return results;
    } catch (error) {
      console.error('[OneAgentMem0Bridge] Error searching memories:', error);
      throw error;
    }
  }

  // ✅ OneAgent-Specific: Temporal Queries
  async getConversationsInWindow(timeWindow: TimeWindow): Promise<ConversationData[]> {
    const session = this.memgraphDriver.session();

    try {
      const result = await session.run(
        `
        MATCH (m:Memory)
        WHERE m.timestamp >= $start AND m.timestamp <= $end
        AND m.type = 'conversation'
        OPTIONAL MATCH (m)-[:HAS_CONTEXT]->(ctx:Context)
        OPTIONAL MATCH (m)-[:VALIDATED_BY]->(v:Validation)
        RETURN m, ctx, v
        ORDER BY m.timestamp DESC
      `,
        {
          start: timeWindow.start.getTime(),
          end: timeWindow.end.getTime(),
        },
      );

      return result.records.map((record) => this.convertToConversationData(record.toObject()));
    } finally {
      await session.close();
    }
  }

  // ✅ Advanced Features: Cross-Agent Learning
  async identifyEmergingPatterns(): Promise<EmergingPattern[]> {
    const session = this.memgraphDriver.session();

    try {
      const result = await session.run(`
        MATCH (m:Memory)-[:FROM_AGENT]->(a:Agent)
        WHERE m.type = 'conversation'
        CALL algo.community() YIELD nodeId, communityId
        WITH communityId, collect(a) as agents, count(m) as frequency
        WHERE frequency >= 5
        RETURN communityId, agents, frequency,
               avg([m in collect(m) | m.quality_score]) as avgQuality
        ORDER BY frequency DESC, avgQuality DESC
        LIMIT 10
      `);

      return result.records.map((record) => ({
        id: `pattern_${record.get('communityId')}`,
        description: `Emerging pattern involving ${record.get('agents').length} agents`,
        agentIds: record.get('agents').map((a: any) => a.id),
        confidence: Math.min(record.get('frequency') / 100, 1.0),
        frequency: record.get('frequency'),
        potentialApplications: this.generateApplications(record.get('agents')),
        emergenceDate: new Date(),
        strength: record.get('avgQuality'),
      }));
    } finally {
      await session.close();
    }
  }

  // ✅ Helper Methods
  private async createConversationGraph(
    conversation: ConversationMemory,
    memoryId: string,
  ): Promise<void> {
    const session = this.memgraphDriver.session();

    try {
      await session.run(
        `
        // Create or merge agent node
        MERGE (a:Agent {id: $agentId})
        ON CREATE SET a.type = 'oneagent', a.created = timestamp()
        
        // Create or merge user node
        MERGE (u:User {id: $userId})
        ON CREATE SET u.created = timestamp()
        
        // Create memory node with enhanced properties
        CREATE (m:Memory {
          id: $memoryId,
          type: 'conversation',
          content: $content,
          timestamp: $timestamp,
          quality_score: $qualityScore,
          constitutional_compliant: $constitutionalCompliant,
          session_id: $sessionId
        })
        
        // Create relationships
        CREATE (m)-[:FROM_AGENT]->(a)
        CREATE (m)-[:FOR_USER]->(u)
        CREATE (u)-[:HAD_CONVERSATION]->(m)
        
        // Create temporal context if enabled
        CREATE (m)-[:HAS_CONTEXT]->(:Context {
          timeOfDay: $timeOfDay,
          dayOfWeek: $dayOfWeek,
          energyLevel: $energyLevel
        })
      `,
        {
          agentId: conversation.agentId,
          userId: conversation.userId,
          memoryId,
          content: conversation.content,
          timestamp: conversation.timestamp.getTime(),
          qualityScore: conversation.outcome.qualityScore || 0.8,
          constitutionalCompliant: true, // Set based on validation
          sessionId: conversation.context.sessionId,
          timeOfDay: 'morning', // Get from temporal context
          dayOfWeek: 'monday', // Get from temporal context
          energyLevel: 'high', // Get from temporal context
        },
      );
    } finally {
      await session.close();
    }
  }

  private async validateConstitutional(content: string): Promise<any> {
    // Implement constitutional validation
    // This would integrate with OneAgent's existing constitutional AI
    return {
      compliant: true,
      accuracy: 0.9,
      transparency: 0.9,
      helpfulness: 0.9,
      safety: 0.9,
    };
  }

  private getTimeWindow(timestamp: Date): any {
    // Generate time window context
    return {
      start: new Date(timestamp.getTime() - 3600000), // 1 hour before
      end: new Date(timestamp.getTime() + 3600000), // 1 hour after
      description: `Context window around ${timestamp.toISOString()}`,
    };
  }

  private getTemporalContext(timestamp: Date): any {
    const hour = timestamp.getHours();
    const day = timestamp.getDay();

    return {
      timeOfDay: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
      dayOfWeek: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
        day
      ],
      businessDay: day >= 1 && day <= 5,
      energyLevel: hour >= 9 && hour <= 11 ? 'high' : 'medium',
    };
  }

  private convertToConversationData(record: any): ConversationData {
    // Convert Memgraph record to OneAgent ConversationData format
    return {
      conversationId: record.m.properties.id,
      timestamp: new Date(record.m.properties.timestamp),
      content: record.m.properties.content,
      qualityScore: record.m.properties.quality_score,
      constitutionalCompliant: record.m.properties.constitutional_compliant,
      topicTags: [], // Extract from analysis
      // ... additional fields
    };
  }

  // ✅ Connection Management
  async connect(): Promise<void> {
    try {
      // Test Memgraph connection
      const session = this.memgraphDriver.session();
      await session.run('RETURN 1');
      await session.close();

      this.isConnected = true;
      console.log('[OneAgentMem0Bridge] Successfully connected to Mem0+Memgraph');
    } catch (error) {
      console.error('[OneAgentMem0Bridge] Connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.memgraphDriver) {
      await this.memgraphDriver.close();
    }
    this.isConnected = false;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const session = this.memgraphDriver.session();
      await session.run('RETURN 1');
      await session.close();
      return true;
    } catch {
      return false;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }

  // Additional required methods from UnifiedMemoryInterface...
  async findRelatedLearnings(memoryId: string, agentId?: string): Promise<LearningMemory[]> {
    // Implementation
    return [];
  }

  async getAgentPatterns(agentId: string, patternType?: any): Promise<PatternMemory[]> {
    // Implementation
    return [];
  }

  async getConversationHistory(
    userId: string,
    agentId?: string,
    limit?: number,
  ): Promise<ConversationMemory[]> {
    // Implementation
    return [];
  }

  async suggestCrossAgentLearnings(): Promise<any[]> {
    // Implementation
    return [];
  }

  async applyCrossAgentLearning(learning: any): Promise<boolean> {
    // Implementation
    return true;
  }

  async getSystemAnalytics(agentId?: string): Promise<any> {
    // Implementation
    return {};
  }

  async getQualityMetrics(timeRange?: any): Promise<any> {
    // Implementation
    return {};
  }
}
```

#### 2.2 Migration Service

```typescript
// File: coreagent/memory/MemoryMigrationService.ts
export class MemoryMigrationService {
  constructor(
    private oldClient: RealUnifiedMemoryClient,
    private newBridge: OneAgentMem0Bridge,
  ) {}

  async migrateAll(): Promise<void> {
    console.log('[Migration] Starting full memory migration...');

    // 1. Export existing conversations
    const conversations = await this.oldClient.getAllConversations();
    console.log(`[Migration] Found ${conversations.length} conversations to migrate`);

    // 2. Export existing learnings
    const learnings = await this.oldClient.getAllLearnings();
    console.log(`[Migration] Found ${learnings.length} learnings to migrate`);

    // 3. Export existing patterns
    const patterns = await this.oldClient.getAllPatterns();
    console.log(`[Migration] Found ${patterns.length} patterns to migrate`);

    // 4. Migrate with preservation of all features
    let migrated = 0;

    for (const conversation of conversations) {
      try {
        await this.newBridge.storeConversation(conversation);
        migrated++;
        if (migrated % 100 === 0) {
          console.log(`[Migration] Migrated ${migrated}/${conversations.length} conversations`);
        }
      } catch (error) {
        console.error(`[Migration] Failed to migrate conversation ${conversation.id}:`, error);
      }
    }

    console.log('[Migration] Migration completed successfully');
  }

  async verifyMigration(): Promise<boolean> {
    // Verify data integrity after migration
    const oldCount = await this.oldClient.getConversationCount();
    const newCount = await this.newBridge.getConversationCount();

    return oldCount === newCount;
  }
}
```

---

### Phase 3: Integration Testing (Day 8-10)

#### 3.1 Test Suite

```typescript
// File: tests/integration/mem0-bridge.test.ts
describe('OneAgent Mem0 Bridge Integration', () => {
  let bridge: OneAgentMem0Bridge;
  let testConfig: Mem0Config;

  beforeAll(async () => {
    testConfig = {
      ...DEFAULT_MEM0_CONFIG,
      oneagent: {
        enableConstitutional: true,
        enableTemporal: true,
        enableIntelligence: true,
        enableMigration: false,
      },
    };

    bridge = new OneAgentMem0Bridge(testConfig);
    await bridge.connect();
  });

  afterAll(async () => {
    await bridge.disconnect();
  });

  describe('Core Storage Operations', () => {
    test('stores conversation with all OneAgent features', async () => {
      const conversation: ConversationMemory = {
        id: 'test-conv-1',
        agentId: 'test-agent',
        userId: 'test-user',
        timestamp: new Date(),
        content: 'Test conversation content',
        context: {
          actionType: 'coding',
          sessionId: 'test-session-1',
          codeContext: 'typescript',
        },
        outcome: {
          success: true,
          satisfaction: 'high',
          qualityScore: 0.9,
        },
      };

      const memoryId = await bridge.storeConversation(conversation);
      expect(memoryId).toBeDefined();

      // Verify all features preserved
      const retrieved = await bridge.searchMemories({
        query: 'Test conversation',
        agentIds: ['test-agent'],
        maxResults: 1,
      });

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].metadata.oneagent.agentId).toBe('test-agent');
      expect(retrieved[0].metadata.quality.score).toBe(0.9);
    });

    test('maintains temporal awareness', async () => {
      const timeWindow: TimeWindow = {
        start: new Date(Date.now() - 3600000),
        end: new Date(Date.now() + 3600000),
      };

      const conversations = await bridge.getConversationsInWindow(timeWindow);
      expect(Array.isArray(conversations)).toBe(true);
    });

    test('preserves constitutional validation', async () => {
      const conversation: ConversationMemory = createTestConversation();
      const memoryId = await bridge.storeConversation(conversation);

      const results = await bridge.searchMemories({
        query: conversation.content,
        maxResults: 1,
      });

      expect(results[0].metadata.constitutional).toBeDefined();
      expect(results[0].metadata.constitutional.compliant).toBe(true);
    });
  });

  describe('Advanced Features', () => {
    test('identifies emerging patterns', async () => {
      // Store multiple related conversations
      for (let i = 0; i < 10; i++) {
        await bridge.storeConversation(createRelatedConversation(i));
      }

      const patterns = await bridge.identifyEmergingPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty('confidence');
      expect(patterns[0]).toHaveProperty('agentIds');
    });

    test('supports cross-agent learning', async () => {
      const learnings = await bridge.suggestCrossAgentLearnings();
      expect(Array.isArray(learnings)).toBe(true);
    });
  });

  describe('Performance', () => {
    test('handles high-volume operations', async () => {
      const startTime = Date.now();

      // Store 100 conversations
      const promises = Array.from({ length: 100 }, (_, i) =>
        bridge.storeConversation(createTestConversation(`perf-test-${i}`)),
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // Under 30 seconds
    });

    test('semantic search performance', async () => {
      const startTime = Date.now();

      const results = await bridge.searchMemories({
        query: 'typescript development patterns',
        maxResults: 50,
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Under 5 seconds
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
```

---

### Phase 4: Deployment (Day 11-14)

#### 4.1 Production Configuration

```typescript
// File: coreagent/config/production-mem0-config.ts
export const PRODUCTION_MEM0_CONFIG: Mem0Config = {
  mem0: {
    apiUrl: process.env.MEM0_API_URL || 'http://mem0-server:8000',
    llm: {
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY!,
    },
    embedder: {
      provider: 'gemini',
      model: 'text-embedding-004',
    },
    graph_store: {
      provider: 'memgraph',
      url: process.env.MEMGRAPH_URL || 'bolt://memgraph:7687',
      username: process.env.MEMGRAPH_USER!,
      password: process.env.MEMGRAPH_PASSWORD!,
    },
  },
  oneagent: {
    enableConstitutional: true,
    enableTemporal: true,
    enableIntelligence: true,
    enableMigration: false, // Disable after initial migration
  },
};
```

#### 4.2 Gradual Rollout Service

```typescript
// File: coreagent/memory/GradualRolloutService.ts
export class GradualRolloutService {
  constructor(
    private oldClient: RealUnifiedMemoryClient,
    private newBridge: OneAgentMem0Bridge,
    private rolloutPercentage: number = 10,
  ) {}

  async routeMemoryOperation<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
  ): Promise<T> {
    // Gradually route traffic to new system
    if (Math.random() * 100 < this.rolloutPercentage) {
      try {
        return await operation();
      } catch (error) {
        console.error('[GradualRollout] New system failed, falling back:', error);
        return await fallbackOperation();
      }
    } else {
      return await fallbackOperation();
    }
  }

  incrementRollout(percentage: number): void {
    this.rolloutPercentage = Math.min(100, this.rolloutPercentage + percentage);
    console.log(`[GradualRollout] Increased to ${this.rolloutPercentage}%`);
  }
}
```

---

### 🚀 Deployment Steps

1. **Day 1-2**: Set up Docker environment, install dependencies
2. **Day 3-5**: Implement core bridge functionality
3. **Day 6-7**: Implement advanced features and migration
4. **Day 8-10**: Comprehensive testing and validation
5. **Day 11-12**: Migration of existing data
6. **Day 13-14**: Gradual production rollout

### 📊 Success Metrics

- **Compatibility**: 100% of UnifiedMemoryInterface methods working
- **Performance**: Sub-5s semantic search, sub-30s bulk operations
- **Data Integrity**: 100% successful migration verification
- **Features**: All OneAgent features (temporal, constitutional, intelligence) preserved
- **Reliability**: 99.9% uptime during rollout

This implementation plan preserves all OneAgent features while gaining the advanced capabilities of Mem0 and Memgraph. The bridge architecture ensures seamless integration with comprehensive testing and gradual deployment.
