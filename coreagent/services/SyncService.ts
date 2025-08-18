import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

import { OneAgentMemory } from '../memory/OneAgentMemory';
import { GeminiClient } from '../tools/geminiClient';
import { getEmbeddingDefault } from '../config/UnifiedModelPicker';
import { unifiedMetadataService, createUnifiedTimestamp } from '../utils/UnifiedBackboneService';

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

  constructor(specsDir = join(process.cwd(), 'specs')) {
    this.specsDir = specsDir;
    this.memory = OneAgentMemory.getInstance();
    const pick = getEmbeddingDefault();
    // Constrain to the canonical embedding model literal type expected by Gemini types
    this.embeddingModel =
      pick.name === 'gemini-embedding-001' ? 'gemini-embedding-001' : 'gemini-embedding-001';
    this.gemini = new GeminiClient({
      apiKey: process.env.GEMINI_API_KEY || '',
      model: this.embeddingModel,
    });
  }

  async syncConstitution(): Promise<void> {
    const ts = createUnifiedTimestamp().iso;
    let files: string[] = [];
    try {
      const dir = await fs.readdir(this.specsDir);
      files = dir.filter((f) => f.endsWith('.spec.md'));
      if (files.length === 0) {
        console.warn(`[SyncService] No .spec.md files found in ${this.specsDir}`);
        return;
      }
    } catch {
      console.warn(`[SyncService] Specs directory not found: ${this.specsDir}`);
      return;
    }

    for (const file of files) {
      const full = join(this.specsDir, file);
      let content = '';
      try {
        content = await fs.readFile(full, 'utf8');
      } catch (e) {
        console.error(`[SyncService] Failed reading ${full}:`, e);
        continue;
      }
      const domain = inferDomainFromFilename(file);
      const rules = splitIntoRules(content);
      if (rules.length === 0) continue;

      for (const ruleText of rules) {
        try {
          const emb = await this.gemini.generateEmbedding(ruleText, { model: this.embeddingModel });
          const rule: ConstitutionalRule = {
            id: hash(ruleText),
            sourceFile: `specs/${file}`,
            ruleText,
            ruleEmbedding: emb.embedding,
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
              dimensions: emb.dimensions,
            },
            custom: rule,
          });
          await this.memory.addMemoryCanonical(ruleText, metadata, 'system');
        } catch (e) {
          console.error('[SyncService] Failed to upsert rule:', e);
        }
      }
    }
    console.log('✅ SyncService: Constitution synchronized to memory');
  }
}

export default SyncService;
