/**
 * Enhanced Context7 Metadata Structure
 * Optimized for retrieval efficiency and contextual search
 * 
 * @version 3.0.0 - Enhanced Metadata Optimization
 * @created June 18, 2025
 */

export interface EnhancedDocumentationMetadata {
  // === SEARCH OPTIMIZATION ===
  searchTags: {
    primary: string[];           // Main technology/framework tags
    secondary: string[];         // Related technologies, patterns
    semantic: string[];          // Natural language search terms
    synonyms: string[];          // Alternative terminology
  };

  // === CONTEXTUAL INFORMATION ===
  context: {
    technology: {
      stack: string[];           // [nodejs, typescript, react]
      versions: Record<string, string>; // { "nodejs": "22.x", "typescript": "5.7" }
      dependencies: string[];    // Related packages/libraries
    };
    problemDomain: {
      category: 'setup' | 'troubleshooting' | 'optimization' | 'migration' | 'feature' | 'best-practice';
      complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      useCase: string;          // Brief description of the use case
      prerequisites: string[];   // Required knowledge/setup
    };
    solution: {
      pattern: string;          // Solution pattern type
      effectiveness: number;    // 0-1 success rate
      alternatives: string[];   // Alternative approaches mentioned
      followUpActions: string[]; // Suggested next steps
    };
  };

  // === RETRIEVAL OPTIMIZATION ===
  indexing: {
    compositeKeys: string[];    // Pre-computed search combinations
    keywordDensity: Record<string, number>; // Term frequency for ranking
    relatedQueries: string[];   // Similar successful queries
    crossReferences: {
      type: 'prerequisite' | 'follow-up' | 'alternative' | 'related';
      target: string;           // Reference to other documentation
      relevance: number;        // 0-1 relevance score
    }[];
  };

  // === QUALITY INDICATORS ===
  quality: {
    sourceAuthority: number;    // 0-1 official source credibility
    contentFreshness: number;   // 0-1 based on last updated
    userSatisfaction: number;   // 0-1 based on usage patterns
    verificationStatus: 'verified' | 'unverified' | 'needs-review';
    reviewCount: number;        // How many times used successfully
  };

  // === TEMPORAL AND USAGE ===
  usage: {
    accessCount: number;        // How often retrieved
    lastAccessed: Date;         // Most recent access
    averageRelevanceScore: number; // Historical relevance
    peakUsagePeriods: string[]; // When most frequently accessed
    decayFactor: number;        // Relevance decay over time
  };

  // === CROSS-AGENT INTELLIGENCE ===
  intelligence: {
    agentSuccessPatterns: Record<string, number>; // Which agents find this useful
    collaborativeRating: number; // Cross-agent consensus score
    knowledgeGaps: string[];     // What information is missing
    improvementSuggestions: string[]; // How to enhance this entry
  };

  // === ORIGINAL METADATA (Enhanced) ===
  original: {
    category: string;
    querySource: string;
    resultsCount: number;
    topRelevanceScore: number;
    queryPattern: string;
    queryType: string;
    averageRelevance: number;
    sourceSuccess: string;
    extractedAt: string;
  };
}

// === USAGE EXAMPLES ===

/**
 * Example 1: TypeScript Configuration Query
 */
const typescriptConfigMetadata: EnhancedDocumentationMetadata = {
  searchTags: {
    primary: ['typescript', 'configuration', 'tsconfig'],
    secondary: ['compiler', 'build', 'project-setup'],
    semantic: ['setup typescript project', 'configure typescript compiler', 'typescript settings'],
    synonyms: ['ts config', 'typescript options', 'compiler configuration']
  },
  context: {
    technology: {
      stack: ['typescript', 'nodejs'],
      versions: { 'typescript': '5.7', 'nodejs': '22.x' },
      dependencies: ['@types/node', 'ts-node']
    },
    problemDomain: {
      category: 'setup',
      complexity: 'intermediate',
      useCase: 'Configure TypeScript for Node.js project',
      prerequisites: ['basic typescript knowledge', 'nodejs installed']
    },
    solution: {
      pattern: 'configuration-file',
      effectiveness: 0.95,
      alternatives: ['programmatic configuration', 'cli flags'],
      followUpActions: ['setup build scripts', 'configure IDE']
    }
  },
  indexing: {
    compositeKeys: ['typescript-setup', 'nodejs-typescript', 'tsconfig-configuration'],
    keywordDensity: { 'typescript': 0.8, 'configuration': 0.6, 'setup': 0.4 },
    relatedQueries: ['typescript build setup', 'nodejs typescript project'],
    crossReferences: [
      { type: 'follow-up', target: 'typescript-build-scripts', relevance: 0.8 },
      { type: 'related', target: 'nodejs-project-setup', relevance: 0.7 }
    ]
  },
  quality: {
    sourceAuthority: 0.95, // Official TypeScript docs
    contentFreshness: 0.9, // Recently updated
    userSatisfaction: 0.88,
    verificationStatus: 'verified',
    reviewCount: 12
  },
  usage: {
    accessCount: 25,
    lastAccessed: new Date(),
    averageRelevanceScore: 0.87,
    peakUsagePeriods: ['morning', 'project-start'],
    decayFactor: 0.95
  },
  intelligence: {
    agentSuccessPatterns: { 'DevAgent': 0.9, 'SetupAgent': 0.85 },
    collaborativeRating: 0.88,
    knowledgeGaps: ['advanced compiler options'],
    improvementSuggestions: ['add more examples', 'include common errors']
  },
  original: {
    category: 'documentation_query',
    querySource: 'typescript',
    resultsCount: 5,
    topRelevanceScore: 0.92,
    queryPattern: 'setup_configuration',
    queryType: 'typescript',
    averageRelevance: 0.85,
    sourceSuccess: 'typescript,nodejs',
    extractedAt: new Date().toISOString()
  }
};

/**
 * Enhanced metadata provides:
 * - Rich semantic search capabilities
 * - Technology stack context awareness
 * - Quality and freshness indicators
 * - Cross-reference intelligence
 * - Usage pattern optimization
 * - Collaborative agent learning
 */
