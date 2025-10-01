import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { createHash } from 'crypto';
import { OneAgentUnifiedBackbone, createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import { unifiedLogger } from '../utils/UnifiedLogger';
import { getEmbeddingModel } from '../config/UnifiedModelPicker';

/** Minimal embedding-capable client surface */
interface EmbeddingClientLike {
  generateEmbedding: (
    text: string,
    options?: Record<string, unknown>,
  ) => Promise<{ embedding: number[] }>;
  generateEmbeddingBatch?: (
    texts: string[],
    options?: Record<string, unknown>,
  ) => Promise<Array<{ embedding: number[] }>>;
}

type EmbeddingKind = 'rule' | 'query' | 'generic';

interface PersistedEmbeddingRecord {
  v: number[]; // vector
  d: number; // dimensions
  k: EmbeddingKind;
  t: string; // iso timestamp
  m: string; // model
  n?: number; // cached L2 norm (added in v1 upgrade)
}

/**
 * EmbeddingCacheService
 * Canonical shared embedding cache built on OneAgentUnifiedBackbone cache system.
 * - Namespaced keys: embedding:v1:<kind>:<hash>
 * - Hash: sha256(text).slice(0,24) (stable across services)
 * - Persistence: JSON file (embeddings.json) loaded at startup, periodic flush on changes.
 */
export class EmbeddingCacheService {
  private static instance: EmbeddingCacheService;
  // Lazy accessors avoid circular import timing issues during module evaluation
  private get backbone() {
    return OneAgentUnifiedBackbone.getInstance();
  }
  private get cache() {
    return this.backbone.cache;
  }
  private dirty = false;
  private persistPath: string;
  private saveInterval?: NodeJS.Timeout;
  /**
   * ARCHITECTURAL EXCEPTION: This Map provides fast lookup index for embedding records.
   * It mirrors persisted data for performance, not additional business state.
   * This usage is allowed for embedding cache optimization.
   */
  // eslint-disable-next-line oneagent/no-parallel-cache
  private inMemoryIndex = new Map<string, PersistedEmbeddingRecord>();
  private readonly VERSION = 'v1';
  private readonly FLUSH_INTERVAL_MS = 30000; // 30s
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  private constructor(persistDir = join(process.cwd(), 'data', 'cache')) {
    this.persistPath = join(persistDir, 'embeddings.json');
  }

  /** Runtime stats for health/monitoring */
  getStats(): {
    version: string;
    entries: number;
    withNorms: number;
    avgDim: number;
    kinds: Record<string, number>;
  } {
    let total = 0;
    let withNorms = 0;
    let dimSum = 0;
    const kinds: Record<string, number> = {};
    for (const rec of this.inMemoryIndex.values()) {
      total++;
      if (rec.n) withNorms++;
      dimSum += rec.d;
      kinds[rec.k] = (kinds[rec.k] || 0) + 1;
    }
    return {
      version: this.VERSION,
      entries: total,
      withNorms,
      avgDim: total ? Math.round(dimSum / total) : 0,
      kinds,
    };
  }

  static getInstance(): EmbeddingCacheService {
    if (!EmbeddingCacheService.instance) {
      EmbeddingCacheService.instance = new EmbeddingCacheService();
      EmbeddingCacheService.instance
        .initialize()
        .catch((e) => unifiedLogger.warn('[EmbeddingCacheService] Initialization failed', e));
    }
    return EmbeddingCacheService.instance;
  }

  /** Stable 24-char hash */
  hash(text: string): string {
    return createHash('sha256').update(text).digest('hex').slice(0, 24);
  }

  private key(kind: EmbeddingKind, hash: string): string {
    return `embedding:${this.VERSION}:${kind}:${hash}`;
  }

  private async initialize(): Promise<void> {
    try {
      // In fast test or NODE_ENV test mode, skip disk restore & timers to avoid post-test async logs
      if (process.env.ONEAGENT_FAST_TEST_MODE === '1' || process.env.NODE_ENV === 'test') {
        unifiedLogger.debug(
          '[EmbeddingCacheService] Skipping persistence restore (FAST_TEST_MODE)',
        );
        return;
      }
      await fs.mkdir(dirname(this.persistPath), { recursive: true });
      const raw = await fs.readFile(this.persistPath, 'utf8');
      const json: Record<string, PersistedEmbeddingRecord> = JSON.parse(raw);
      let restored = 0;
      let upgraded = 0;
      for (const [key, rec] of Object.entries(json)) {
        // Backfill norm if missing
        if (!rec.n && Array.isArray(rec.v)) {
          rec.n = this.computeNorm(rec.v);
          upgraded++;
        }
        this.inMemoryIndex.set(key, rec);
        await this.cache.set(key, rec.v, this.DEFAULT_TTL);
        restored++;
      }
      unifiedLogger.info('[EmbeddingCacheService] Restored embeddings', { restored, upgraded });
    } catch (e) {
      // If file absent, ignore
      unifiedLogger.debug('[EmbeddingCacheService] No existing persistence or failed to load', e);
    }
    if (!(process.env.ONEAGENT_FAST_TEST_MODE === '1' || process.env.NODE_ENV === 'test')) {
      this.startFlushTimer();
    }
  }

  private startFlushTimer(): void {
    this.saveInterval = setInterval(() => {
      void this.flush();
    }, this.FLUSH_INTERVAL_MS);
    (this.saveInterval as unknown as NodeJS.Timer).unref?.();
  }

  async flush(): Promise<void> {
    if (!this.dirty) return;
    const obj: Record<string, PersistedEmbeddingRecord> = {};
    for (const [k, v] of this.inMemoryIndex.entries()) obj[k] = v;
    try {
      await fs.writeFile(this.persistPath, JSON.stringify(obj));
      this.dirty = false;
      unifiedLogger.debug('[EmbeddingCacheService] Flushed embeddings to disk', {
        count: this.inMemoryIndex.size,
      });
    } catch (e) {
      unifiedLogger.warn('[EmbeddingCacheService] Failed persisting embeddings', e);
    }
  }

  /** Get embedding for a single text (cached or compute) */
  async getOrCompute(
    client: EmbeddingClientLike,
    text: string,
    kind: EmbeddingKind,
  ): Promise<number[]> {
    const h = this.hash(text);
    const cacheKey = this.key(kind, h);
    const cached = (await this.cache.get(cacheKey)) as number[] | null;
    if (cached) return cached;
    const model = getEmbeddingModel();
    const emb = await client.generateEmbedding(text, {
      model,
      taskType: kind === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
    });
    await this.store(cacheKey, kind, emb.embedding, model);
    return emb.embedding;
  }

  /** Batch get/compute embeddings for many texts */
  async getOrComputeBatch(
    client: EmbeddingClientLike,
    texts: string[],
    kind: EmbeddingKind,
  ): Promise<Map<string, number[]>> {
    /**
     * ARCHITECTURAL EXCEPTION: This Map accumulates results for batch operation.
     * It is a temporary collection for function return, not persistent state.
     * This usage is allowed for batch operation results.
     */
    const out = new Map<string, number[]>();
    const toCompute: string[] = [];
    const model = getEmbeddingModel();
    for (const t of texts) {
      const h = this.hash(t);
      const cacheKey = this.key(kind, h);
      const cached = (await this.cache.get(cacheKey)) as number[] | null;
      if (cached) {
        out.set(t, cached);
      } else {
        toCompute.push(t);
      }
    }
    if (toCompute.length === 0) return out;

    // Prefer batch API if available
    const canBatch = typeof client.generateEmbeddingBatch === 'function';
    if (canBatch) {
      try {
        const batch = await client.generateEmbeddingBatch!(toCompute, {
          model,
          taskType: kind === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
        });
        batch.forEach((b, i) => {
          const text = toCompute[i];
          out.set(text, b.embedding);
        });
      } catch (e) {
        unifiedLogger.warn('[EmbeddingCacheService] Batch embedding failed, falling back', e);
      }
    }
    // For any remaining missing (either no batch support or batch failure)
    for (const t of toCompute) {
      if (out.has(t)) continue; // already filled by batch
      const single = await client.generateEmbedding(t, {
        model,
        taskType: kind === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
      });
      out.set(t, single.embedding);
    }
    // Store newly computed embeddings
    for (const [text, vec] of out.entries()) {
      const h = this.hash(text);
      const cacheKey = this.key(kind, h);
      // Avoid overwriting existing (in case another concurrent compute stored)
      if (!(await this.cache.get(cacheKey))) await this.store(cacheKey, kind, vec, model);
    }
    return out;
  }

  /** Compute & cache L2 norm */
  private computeNorm(vec: number[]): number {
    let sum = 0;
    for (let i = 0; i < vec.length; i++) sum += vec[i]! * vec[i]!;
    return Math.sqrt(sum);
  }

  /** Retrieve cached norm for text/kind (if available) */
  getNorm(kind: EmbeddingKind, text: string): number | null {
    const h = this.hash(text);
    const cacheKey = this.key(kind, h);
    const rec = this.inMemoryIndex.get(cacheKey);
    return rec?.n ?? null;
  }

  /** Cosine similarity leveraging optional precomputed norms */
  cosineSimilarity(a: number[], b: number[], aNorm?: number, bNorm?: number): number {
    let dot = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) dot += a[i]! * b[i]!;
    const na = aNorm ?? this.computeNorm(a);
    const nb = bNorm ?? this.computeNorm(b);
    if (na === 0 || nb === 0) return 0;
    return dot / (na * nb);
  }

  private async store(
    cacheKey: string,
    kind: EmbeddingKind,
    vector: number[],
    model: string,
  ): Promise<void> {
    await this.cache.set(cacheKey, vector, this.DEFAULT_TTL);
    this.inMemoryIndex.set(cacheKey, {
      v: vector,
      d: vector.length,
      k: kind,
      t: createUnifiedTimestamp().iso,
      m: model,
      n: this.computeNorm(vector),
    });
    this.dirty = true;
  }
}

export const embeddingCacheService = EmbeddingCacheService.getInstance();
