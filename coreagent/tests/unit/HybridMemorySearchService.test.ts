import { hybridMemorySearchService } from '../../services/HybridMemorySearchService';
import { OneAgentMemory } from '../../memory/OneAgentMemory';
import { memgraphService } from '../../services/MemgraphService';
import { UnifiedBackboneService } from '../../utils/UnifiedBackboneService';

jest.mock('../../memory/OneAgentMemory');

jest.mock('../../services/MemgraphService', () => ({
  memgraphService: {
    isEnabled: jest.fn(() => true),
    readQuery: jest.fn(async () => []),
  },
}));

describe('HybridMemorySearchService', () => {
  const userId = 'u1';
  const query = 'alpha';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('isEnabled respects feature flag', () => {
    const cfg = UnifiedBackboneService.getResolvedConfig();
    expect(hybridMemorySearchService.isEnabled()).toBe(cfg.features?.enableHybridSearch !== false);
  });

  it('returns vector-only results when graph disabled', async () => {
    (memgraphService.isEnabled as jest.Mock).mockReturnValue(false);
    (OneAgentMemory.getInstance as unknown as jest.Mock).mockReturnValue({
      searchMemory: jest.fn(async () => ({
        results: [
          {
            id: 'v1',
            content: 'vector hit',
            metadata: {
              id: 'm1',
              type: 'memory',
              version: '1.0.0',
              temporal: {
                created: {
                  iso: '',
                  unix: 0,
                  utc: '',
                  local: '',
                  timezone: '',
                  context: '',
                  contextual: { timeOfDay: '', energyLevel: '', optimalFor: [] },
                  metadata: { source: '', precision: 'second', timezone: '' },
                },
                updated: {
                  iso: '',
                  unix: 0,
                  utc: '',
                  local: '',
                  timezone: '',
                  context: '',
                  contextual: { timeOfDay: '', energyLevel: '', optimalFor: [] },
                  metadata: { source: '', precision: 'second', timezone: '' },
                },
                contextSnapshot: {
                  timeOfDay: '',
                  dayOfWeek: '',
                  businessContext: true,
                  energyContext: '',
                },
              },
              system: { source: 'test', component: 'unit', userId },
              quality: {
                score: 80,
                constitutionalCompliant: true,
                validationLevel: 'basic',
                confidence: 0.8,
              },
              content: {
                category: 'general',
                tags: [],
                sensitivity: 'internal',
                relevanceScore: 0.9,
                contextDependency: 'session',
              },
              relationships: { children: [], related: [], dependencies: [] },
              analytics: { accessCount: 0, lastAccessPattern: '', usageContext: [] },
            },
            relatedMemories: [],
            accessCount: 0,
            lastAccessed: new Date(),
            qualityScore: 0,
            constitutionalStatus: 'compliant',
            lastValidation: new Date(),
          },
        ],
      })),
    });

    const res = await hybridMemorySearchService.getContext({ userId, query, limit: 5 });
    expect(res.results.length).toBe(1);
    expect(res.sources.vector).toBe(1);
    expect(res.sources.graph).toBe(0);
  });

  it('merges vector and graph results and limits output', async () => {
    (memgraphService.isEnabled as jest.Mock).mockReturnValue(true);
    (memgraphService.readQuery as jest.Mock).mockResolvedValue([
      {
        rec: {
          id: 'g1',
          content: 'graph hit',
          metadata: {
            id: 'g1',
            type: 'graph_node',
            version: '1.0.0',
            temporal: {
              created: {
                iso: '',
                unix: 0,
                utc: '',
                local: '',
                timezone: '',
                context: '',
                contextual: { timeOfDay: '', energyLevel: '', optimalFor: [] },
                metadata: { source: '', precision: 'second', timezone: '' },
              },
              updated: {
                iso: '',
                unix: 0,
                utc: '',
                local: '',
                timezone: '',
                context: '',
                contextual: { timeOfDay: '', energyLevel: '', optimalFor: [] },
                metadata: { source: '', precision: 'second', timezone: '' },
              },
              contextSnapshot: {
                timeOfDay: '',
                dayOfWeek: '',
                businessContext: true,
                energyContext: '',
              },
            },
            system: { source: 'test', component: 'unit', userId },
            quality: {
              score: 80,
              constitutionalCompliant: true,
              validationLevel: 'basic',
              confidence: 0.8,
            },
            content: {
              category: 'graph',
              tags: [],
              sensitivity: 'internal',
              relevanceScore: 0.5,
              contextDependency: 'session',
            },
            relationships: { children: [], related: [], dependencies: [] },
            analytics: { accessCount: 0, lastAccessPattern: '', usageContext: [] },
          },
          relatedMemories: [],
          accessCount: 0,
          lastAccessed: new Date(),
          qualityScore: 0,
          constitutionalStatus: 'compliant',
          lastValidation: new Date(),
        },
      },
    ]);
    (OneAgentMemory.getInstance as unknown as jest.Mock).mockReturnValue({
      searchMemory: jest.fn(async () => ({
        results: [
          {
            id: 'v2',
            content: 'vector hit',
            metadata: {
              id: 'v2',
              type: 'memory',
              version: '1.0.0',
              temporal: {
                created: {
                  iso: '',
                  unix: 0,
                  utc: '',
                  local: '',
                  timezone: '',
                  context: '',
                  contextual: { timeOfDay: '', energyLevel: '', optimalFor: [] },
                  metadata: { source: '', precision: 'second', timezone: '' },
                },
                updated: {
                  iso: '',
                  unix: 0,
                  utc: '',
                  local: '',
                  timezone: '',
                  context: '',
                  contextual: { timeOfDay: '', energyLevel: '', optimalFor: [] },
                  metadata: { source: '', precision: 'second', timezone: '' },
                },
                contextSnapshot: {
                  timeOfDay: '',
                  dayOfWeek: '',
                  businessContext: true,
                  energyContext: '',
                },
              },
              system: { source: 'test', component: 'unit', userId },
              quality: {
                score: 80,
                constitutionalCompliant: true,
                validationLevel: 'basic',
                confidence: 0.8,
              },
              content: {
                category: 'general',
                tags: [],
                sensitivity: 'internal',
                relevanceScore: 0.9,
                contextDependency: 'session',
              },
              relationships: { children: [], related: [], dependencies: [] },
              analytics: { accessCount: 0, lastAccessPattern: '', usageContext: [] },
            },
            relatedMemories: [],
            accessCount: 0,
            lastAccessed: new Date(),
            qualityScore: 0,
            constitutionalStatus: 'compliant',
            lastValidation: new Date(),
          },
        ],
      })),
    });

    const res = await hybridMemorySearchService.getContext({ userId, query, limit: 1 });
    expect(res.results.length).toBe(1);
    expect(res.sources.vector + res.sources.graph).toBeGreaterThan(0);
  });
});
