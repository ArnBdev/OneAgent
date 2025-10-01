import {
  OneAgentUnifiedBackbone,
  UnifiedBackboneService,
  createUnifiedTimestamp,
} from '../utils/UnifiedBackboneService';
// import { OneAgentMemory } from '../memory/OneAgentMemory';
import { getOneAgentMemory } from '../utils/UnifiedBackboneService';
import { memgraphService } from './MemgraphService';
import type { MemoryRecord } from '../types/oneagent-backbone-types';

export interface HybridSearchParams {
  userId: string;
  query: string;
  limit?: number;
  agentId?: string;
}

export interface HybridSearchResult {
  results: MemoryRecord[];
  sources: { vector: number; graph: number };
  tookMs: number;
  query: string;
}

/**
 * HybridMemorySearchService (Phase A MVP)
 * - Combines vector search (OneAgentMemory/mem0) with simple graph lookup (Memgraph)
 * - Enforces metadata scoping via userId (and agentId when provided)
 * - Safe no-op when backends disabled; returns best-effort results
 */
export class HybridMemorySearchService {
  constructor() {}

  public isEnabled(): boolean {
    const cfg = UnifiedBackboneService.getResolvedConfig();
    return Boolean(cfg.features?.enableHybridSearch && cfg.hybridSearch?.enabled !== false);
  }

  public async getContext(params: HybridSearchParams): Promise<HybridSearchResult> {
    const startTs = createUnifiedTimestamp();
    const services = OneAgentUnifiedBackbone.getInstance().getServices();
    const cfg = UnifiedBackboneService.getResolvedConfig();
    const limit = params.limit || cfg.hybridSearch?.limit || 10;

    const useVector = cfg.memory?.enabled !== false; // always available in our stack
    const useGraph = memgraphService.isEnabled();

    let vectorResults: MemoryRecord[] = [];
    let graphResults: MemoryRecord[] = [];

    // Vector path (mem0)
    if (useVector) {
      try {
        const memory = getOneAgentMemory();
        const res = await memory.searchMemory({
          query: params.query,
          userId: params.userId,
          limit,
        });
        // Canonical: res is MemorySearchResult[]; map to MemoryRecord if needed
        vectorResults = Array.isArray(res)
          ? res.map((r) => ({
              id: r.id,
              content: r.content,
              metadata:
                r.metadata &&
                typeof r.metadata === 'object' &&
                'id' in r.metadata &&
                'type' in r.metadata &&
                'version' in r.metadata &&
                'temporal' in r.metadata &&
                'system' in r.metadata &&
                'quality' in r.metadata &&
                'content' in r.metadata &&
                'relationships' in r.metadata &&
                'analytics' in r.metadata
                  ? (r.metadata as import('../types/oneagent-backbone-types').UnifiedMetadata)
                  : {
                      id: r.id,
                      type: 'memory',
                      version: '1.0.0',
                      temporal: {
                        created: createUnifiedTimestamp(),
                        updated: createUnifiedTimestamp(),
                        contextSnapshot: {
                          timeOfDay: 'unknown',
                          dayOfWeek: 'unknown',
                          businessContext: false,
                          energyContext: 'unknown',
                        },
                      },
                      system: {
                        source: 'HybridMemorySearchService',
                        component: 'vector-search',
                      },
                      quality: {
                        score: 0,
                        constitutionalCompliant: true,
                        validationLevel: 'basic',
                        confidence: 0.5,
                      },
                      content: {
                        category: 'memory',
                        tags: [],
                        sensitivity: 'internal',
                        relevanceScore: 0,
                        contextDependency: 'session',
                      },
                      relationships: {
                        parent: undefined,
                        children: [],
                        related: [],
                        dependencies: [],
                      },
                      analytics: {
                        accessCount: 0,
                        lastAccessPattern: 'search',
                        usageContext: [],
                      },
                    },
              relatedMemories: [],
              accessCount: 0,
              lastAccessed: new Date(),
              qualityScore: 0,
              constitutionalStatus: 'compliant',
              lastValidation: new Date(),
            }))
          : [];
      } catch (err) {
        services.errorHandler.handleError(err as Error, {
          component: 'HybridMemorySearchService',
          operation: 'vector_search',
          external: true,
          userId: params.userId,
        });
      }
    }

    // Graph path (Memgraph) - MVP: naive text filter across node properties content/text/name
    if (useGraph) {
      try {
        // Parameterized query to avoid injection; user scoping required
        // We return minimal fields and construct metadata in JS
        const cypher = `
          MATCH (n)
          WHERE n._userId = $userId
            AND ($agentId IS NULL OR n.agent_id = $agentId)
            AND any(k IN ['content','text','name','title'] WHERE exists(n[k]) AND toString(n[k]) CONTAINS $q)
          RETURN coalesce(n.id, toString(id(n))) AS id,
                 coalesce(n.content, n.text, n.name, n.title, '') AS content
          LIMIT $limit
        `;
        type Row = { id: string; content: string };
        const rows = await memgraphService.readQuery<Row>(cypher, {
          userId: params.userId,
          agentId: params.agentId ?? null,
          q: params.query,
          limit,
        });
        const now = services.timeService.now();
        graphResults = (rows || []).map((r) => {
          const rec: MemoryRecord = {
            id: r.id,
            content: r.content,
            metadata: {
              id: r.id,
              type: 'graph_node',
              version: '1.0.0',
              temporal: {
                created: now,
                updated: now,
                contextSnapshot: {
                  timeOfDay: now.contextual.timeOfDay,
                  dayOfWeek: new Date(now.unix).toLocaleDateString(undefined, { weekday: 'long' }),
                  businessContext: true,
                  energyContext: now.contextual.energyLevel,
                },
              },
              system: {
                source: 'HybridMemorySearchService',
                component: 'graph-search',
                userId: params.userId,
                agent: params.agentId || '',
              },
              quality: {
                score: 80,
                constitutionalCompliant: true,
                validationLevel: 'basic',
                confidence: 0.8,
              },
              content: {
                category: 'graph',
                tags: ['graph', 'memgraph', 'node'],
                sensitivity: 'internal',
                relevanceScore: 0.6,
                contextDependency: 'session',
              },
              relationships: { children: [], related: [], dependencies: [] },
              analytics: { accessCount: 0, lastAccessPattern: 'search', usageContext: [] },
            },
            relatedMemories: [],
            accessCount: 0,
            lastAccessed: new Date(now.unix),
            qualityScore: 0,
            constitutionalStatus: 'compliant',
            lastValidation: new Date(now.unix),
          };
          return rec;
        });
      } catch (err) {
        services.errorHandler.handleError(err as Error, {
          component: 'HybridMemorySearchService',
          operation: 'graph_search',
          external: true,
          userId: params.userId,
        });
      }
    }

    // Merge and rank
    const weights = {
      vector: cfg.hybridSearch?.weights?.vector ?? 0.6,
      graph: cfg.hybridSearch?.weights?.graph ?? 0.4,
      recency: cfg.hybridSearch?.weights?.recency ?? 0,
    } as const;

    const byId = new Map<
      string,
      { rec: MemoryRecord; score: number; source: 'vector' | 'graph' }
    >();
    const norm = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);

    for (const m of vectorResults) {
      const rel =
        (m && m.metadata && (m.metadata as { content?: { relevanceScore?: number } }).content
          ? (m.metadata as { content?: { relevanceScore?: number } }).content!.relevanceScore
          : undefined) ?? 0;
      const baseVec = 0.5 + 0.5 * norm(rel);
      const scoreVec = weights.vector * baseVec;
      byId.set(m.id, { rec: m, score: scoreVec, source: 'vector' });
    }
    for (const g of graphResults) {
      const baseGraph = 0.5; // MVP fixed baseline for graph hits
      const scoreGraph = weights.graph * baseGraph;
      const entry = byId.get(g.id as string);
      if (!entry) byId.set(g.id as string, { rec: g, score: scoreGraph, source: 'graph' });
      else entry.score += scoreGraph;
    }

    const merged = Array.from(byId.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(limit))
      .map((e) => e.rec);

    return {
      results: merged,
      sources: { vector: vectorResults.length, graph: graphResults.length },
      tookMs: Math.max(0, createUnifiedTimestamp().unix - startTs.unix),
      query: params.query,
    };
  }
}

export const hybridMemorySearchService = new HybridMemorySearchService();
