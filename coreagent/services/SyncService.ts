import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

import { OneAgentMemory } from '../memory/OneAgentMemory';
import { GeminiClient } from '../tools/geminiClient';
import { getModelFor, getEmbeddingModel } from '../config/UnifiedModelPicker';
import { unifiedMetadataService, createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import { embeddingCacheService } from './EmbeddingCacheService';
import { unifiedLogger } from '../utils/UnifiedLogger';

type Domain = 'global' | 'dev' | 'finance' | 'fitness';

export interface ConstitutionalRule {
  id: string;
  sourceFile: string;
  ruleText: string;
  ruleEmbedding: number[];
  metadata: {
    type: 'constitutional_rule';
    domain: Domain;
    timestamp: string;
  };
}

function hash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 24);
}

export function inferDomainFromFilename(file: string): Domain {
  const lc = file.toLowerCase();
  if (lc.includes('dev')) return 'dev';
  if (lc.includes('finance')) return 'finance';
  if (lc.includes('fitness')) return 'fitness';
  return 'global';
}

export function splitIntoRules(markdown: string): string[] {
  // Simple heuristic: bullet lines and imperative sentences as rules; also split by headings
  const lines = markdown
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
  const bullets = lines
    .filter((l) => l.startsWith('- ') || l.startsWith('* '))
    .map((l) => l.replace(/^[-*]\s+/, ''));
  const others = lines.filter((l) => !l.startsWith('- ') && !l.startsWith('* '));
  const sentences: string[] = [];
  for (const line of others) {
    const parts = line.split(/(?<=[.!?])\s+/);
    parts.forEach((p) => {
      const t = p.trim();
      if (t.length >= 8) sentences.push(t);
    });
  }
  const raw = [...bullets, ...sentences]
    .map((s) => s.replace(/`{1,3}[^`]*`/g, '').trim())
    .filter((s) => s.length >= 8);
  // Deduplicate
  return Array.from(new Set(raw));
}

export class SyncService {
  private specsDir: string;
  private memory: OneAgentMemory;
  private gemini: GeminiClient;
  private embeddingModel: 'gemini-embedding-001';
  private existingRuleIds: Set<string> = new Set();
  // Removed local embedding cache in favor of shared EmbeddingCacheService

  constructor(specsDir = join(process.cwd(), 'specs')) {
    this.specsDir = specsDir;
    this.memory = OneAgentMemory.getInstance();
    // Use explicit embedding capability (returns lightweight generation client; model name via getEmbeddingModel())
    const client = getModelFor('embedding_text');
    this.embeddingModel = getEmbeddingModel() as 'gemini-embedding-001';
    // If client is GeminiClient reuse it, else fallback to dedicated GeminiClient for embeddings
    this.gemini =
      client instanceof GeminiClient
        ? client
        : new GeminiClient({
            apiKey: process.env.GEMINI_API_KEY || '',
            model: this.embeddingModel,
          });
  }

  async syncConstitution(): Promise<void> {
    const ts = createUnifiedTimestamp().iso;
    // Preload existing constitutional rule IDs once for O(1) skip
    try {
      interface MemoryPreloadResultMetaContent {
        tags?: string[];
      }
      interface MemoryPreloadResultMeta {
        content?: MemoryPreloadResultMetaContent;
      }
      interface MemoryPreloadResult {
        metadata?: MemoryPreloadResultMeta | string;
      }
      const preload = await this.memory.searchMemory({
        query: 'constitutional_rule',
        userId: 'system',
        limit: 500,
      });
      const results: MemoryPreloadResult[] = (preload?.results as MemoryPreloadResult[]) || [];
      for (const r of results) {
        const meta = r.metadata;
        if (meta && typeof meta === 'object' && !(typeof meta === 'string')) {
          const tags = meta.content?.tags || [];
          for (const tag of tags)
            if (typeof tag === 'string' && tag.length === 24) this.existingRuleIds.add(tag);
        }
      }
      unifiedLogger.debug('[SyncService] Preloaded existing rule IDs', {
        count: this.existingRuleIds.size,
      });
    } catch {
      // Non-fatal; fall back to per-rule search
    }
    let files: string[] = [];
    try {
      const dir = await fs.readdir(this.specsDir);
      files = dir.filter((f) => f.endsWith('.spec.md'));
      if (files.length === 0) {
        unifiedLogger.warn(`[SyncService] No .spec.md files found in ${this.specsDir}`);
        return;
      }
    } catch {
      unifiedLogger.warn(`[SyncService] Specs directory not found: ${this.specsDir}`);
      return;
    }

    for (const file of files) {
      const full = join(this.specsDir, file);
      let content = '';
      try {
        content = await fs.readFile(full, 'utf8');
      } catch (e) {
        unifiedLogger.error(`[SyncService] Failed reading ${full}`, e);
        continue;
      }
      const domain = inferDomainFromFilename(file);
      const rules = splitIntoRules(content);
      if (rules.length === 0) continue;

      // Compute hashes first; filter out existing; batch embed only new
      const pending: Array<{ ruleText: string; ruleId: string }> = [];
      for (const ruleText of rules) {
        const ruleId = hash(ruleText);
        if (this.existingRuleIds.has(ruleId)) {
          unifiedLogger.debug(`[SyncService] Skipping existing rule ${ruleId}`);
          continue;
        }
        pending.push({ ruleText, ruleId });
      }

      if (pending.length === 0) continue;

      // Generate embeddings in batch (cache-aware)
      // Batch get/compute embeddings via shared cache
      const batchMap = await embeddingCacheService.getOrComputeBatch(
        this.gemini as unknown as {
          generateEmbedding: (
            text: string,
            options?: Record<string, unknown>,
          ) => Promise<{ embedding: number[] }>;
          generateEmbeddingBatch?: (
            texts: string[],
            options?: Record<string, unknown>,
          ) => Promise<Array<{ embedding: number[] }>>;
        },
        pending.map((p) => p.ruleText),
        'rule',
      );

      for (const p of pending) {
        try {
          const { ruleId, ruleText } = p;
          // Retrieve embedding from cache or compute (if batch failed for this one)
          const vector =
            batchMap.get(ruleText) ||
            (await embeddingCacheService.getOrCompute(
              this.gemini as unknown as {
                generateEmbedding: (
                  text: string,
                  options?: Record<string, unknown>,
                ) => Promise<{ embedding: number[] }>;
              },
              ruleText,
              'rule',
            ));
          const rule: ConstitutionalRule = {
            id: ruleId,
            sourceFile: `specs/${file}`,
            ruleText,
            ruleEmbedding: vector,
            metadata: { type: 'constitutional_rule', domain, timestamp: ts },
          };

          // Store in memory using canonical metadata
          const metadata = unifiedMetadataService.create('memory', 'SyncService', {
            system: {
              userId: 'system',
              source: 'SyncService',
              component: 'constitution-sync',
            },
            content: {
              category: 'constitutional_rule',
              tags: [domain, rule.id, file],
              sensitivity: 'internal',
              relevanceScore: 0.95,
              contextDependency: 'global',
            },
            embedding: {
              provider: 'Gemini',
              model: this.embeddingModel,
              dimensions: vector.length,
            },
            custom: rule,
          });
          await this.memory.addMemoryCanonical(ruleText, metadata, 'system');
          this.existingRuleIds.add(ruleId);
        } catch (e) {
          unifiedLogger.error('[SyncService] Failed to upsert rule', e);
        }
      }
    }
    unifiedLogger.info('✅ SyncService: Constitution synchronized to memory');
  }
}

export default SyncService;
