// filepath: coreagent/types/webFindings.ts
// Web findings storage and management types

export interface WebSearchFinding {
  id: string;
  query: string;
  results: unknown[]; // WebSearchResponse results
  metadata: {
    timestamp: string;
    userId?: string;
    sessionId?: string;
    totalResults: number;
    searchTime: number;
    source: 'brave' | 'other';
  };
  classification: {
    category: 'research' | 'documentation' | 'troubleshooting' | 'general' | 'devagent';
    importance: number; // 0-1 scale
    relevanceScore: number; // 0-1 scale
    tags: string[];
  };
  storage: {
    cached: boolean;
    persistToMemory: boolean;
    ttl: number; // milliseconds
    accessCount: number;
    lastAccessed: string;
  };
}

export interface WebFetchFinding {
  id: string;
  url: string;
  originalUrl: string;
  content: {
    html?: string;
    text: string;
    size: number;
    contentType: string;
    encoding?: string;
  };  metadata: {
    title?: string;
    description?: string;
    keywords?: string[];
    domain?: string; // e.g., "developer.mozilla.org" - extracted from URL for easy citation
    ogData?: Record<string, string>;
    twitterData?: Record<string, string>;
    favicon?: string;
    timestamp: string;
    userId?: string;
    sessionId?: string;
    fetchTime: number;
    statusCode: number;
  };
  extracted: {
    summary?: string;
    keyPoints: string[];
    entities?: string[];
    links: string[];
    images: string[];
    language?: string;
    wordCount: number;
  };
  classification: {
    category: 'documentation' | 'api-reference' | 'tutorial' | 'blog' | 'forum' | 'code' | 'other';
    importance: number; // 0-1 scale
    relevanceScore: number; // 0-1 scale
    topics: string[];
    framework?: string; // React, Vue, TypeScript, etc.
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
  storage: {
    cached: boolean;
    persistToMemory: boolean;
    ttl: number; // milliseconds
    accessCount: number;
    lastAccessed: string;
    compressed: boolean;
  };
}

export interface WebFindingsConfig {
  storage: {
    enableCaching: boolean;
    enablePersistence: boolean;
    maxCacheSize: number; // MB
    defaultTTL: number; // milliseconds
    compressionThreshold: number; // bytes
    autoCleanupInterval: number; // milliseconds
  };
  classification: {
    autoClassify: boolean;
    importanceThreshold: number; // 0-1, above which to persist
    devAgentRelevanceBoost: number; // multiplier for dev-related content
  };
  integration: {
    memoryIntelligence: boolean;
    embeddingCache: boolean;
    memoryBridge: boolean;
  };
  privacy: {
    obfuscateUrls: boolean;
    excludePatterns: string[]; // URL patterns to never store
    maxPersonalDataRetention: number; // days
  };
}

export interface FindingsSearchOptions {
  query?: string;
  category?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  userId?: string;
  sessionId?: string;
  includeContent?: boolean;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'importance' | 'access_count';
  sortOrder?: 'asc' | 'desc';
}

export interface FindingsSearchResult {
  findings: (WebSearchFinding | WebFetchFinding)[];
  metadata: {
    total: number;
    searchTime: number;
    cached: boolean;
    query?: string;
  };
}

export interface FindingsStorageStats {
  cache: {
    size: number; // MB
    entries: number;
    hitRate: number;
    oldestEntry: string;
    newestEntry: string;
  };
  persistent: {
    totalFindings: number;
    searchFindings: number;
    fetchFindings: number;
    avgImportance: number;
    storageSize: number; // MB
  };
  performance: {
    avgClassificationTime: number;
    avgStorageTime: number;
    avgRetrievalTime: number;
    totalOperations: number;
  };
}

export interface FindingsCleanupResult {
  removed: {
    expired: number;
    lowImportance: number;
    duplicates: number;
  };
  retained: number;
  spaceSaved: number; // MB
  operationTime: number; // ms
}
