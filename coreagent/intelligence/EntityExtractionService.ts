/**
 * Canonical EntityExtractionService - NLACS entity extraction interface.
 * Placeholder implementation: simple pattern-based extraction to avoid parallel systems.
 * Future: replace with ML/NLP pipeline while keeping this contract stable.
 */
export interface ExtractedEntity {
  text: string;
  type: string;
  confidence: number;
  start?: number;
  end?: number;
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  modelVersion: string;
  strategy: string;
}

export interface IEntityExtractor {
  extract(text: string): Promise<EntityExtractionResult>;
}

class SimplePatternEntityExtractor implements IEntityExtractor {
  private static INSTANCE: SimplePatternEntityExtractor | null = null;
  static getInstance(): SimplePatternEntityExtractor {
    if (!this.INSTANCE) this.INSTANCE = new SimplePatternEntityExtractor();
    return this.INSTANCE;
  }

  private patterns: Array<{ type: string; regex: RegExp }> = [
    { type: 'email', regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
    { type: 'url', regex: /(https?:\/\/[^\s]+)/gi },
    { type: 'hashtag', regex: /#[a-z0-9_]+/gi },
    { type: 'mention', regex: /@[a-z0-9_]+/gi },
  ];

  async extract(text: string): Promise<EntityExtractionResult> {
    const entities: ExtractedEntity[] = [];
    for (const { type, regex } of this.patterns) {
      regex.lastIndex = 0; // reset
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type,
          confidence: 0.6, // baseline confidence for pattern
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
    return { entities, modelVersion: 'pattern-v1', strategy: 'pattern-baseline' };
  }
}

export class EntityExtractionService {
  private static INSTANCE: EntityExtractionService | null = null;
  private extractor: IEntityExtractor;
  private constructor() {
    // Single canonical extractor instance (extensible later)
    this.extractor = SimplePatternEntityExtractor.getInstance();
  }
  static getInstance(): EntityExtractionService {
    if (!this.INSTANCE) this.INSTANCE = new EntityExtractionService();
    return this.INSTANCE;
  }
  async extractEntities(text: string): Promise<EntityExtractionResult> {
    return this.extractor.extract(text);
  }
}
