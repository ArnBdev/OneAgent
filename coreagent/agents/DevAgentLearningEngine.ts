/**
 * DevAgent Adaptive Learning Engine
 *
 * Core learning system that enables DevAgent to:
 * - Store and retrieve learned patterns from interactions
 * - Build a local knowledge base of successful solutions
 * - Learn from context7 documentation and store useful insights (canonical only)
 * - Continuously improve through pattern recognition
 * - Maintain institutional memory across sessions
 *
 * This creates a truly adaptive agent that gets better over time.
 *
 * @version 1.0.0
 * @created June 14, 2025
 */

import type { DocumentationResult, OneAgentA2AProtocol } from '../types/oneagent-backbone-types';
// UnifiedContext7MCPIntegration import removed (deprecated)
import { CodeAnalysisResult } from './AdvancedCodeAnalysisEngine';
import { getEnhancedTimeContext } from '../utils/EnhancedTimeAwareness.js';
import { OneAgentUnifiedBackbone } from '../utils/UnifiedBackboneService.js';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { createUnifiedTimestamp, unifiedMetadataService } from '../utils/UnifiedBackboneService';

export interface LearnedPattern {
  id: string;
  name: string;
  description: string;
  category: 'solution' | 'anti-pattern' | 'best-practice' | 'framework' | 'library' | 'debugging';
  language: string;
  framework?: string;

  // Pattern details
  problem: string;
  solution: string;
  reasoning: string;
  codeExample?: string;

  // Learning metadata
  confidence: number; // 0-1
  successRate: number; // How often this pattern worked
  timesUsed: number;
  timesSuccessful: number;

  // Context
  contexts: string[]; // Where this pattern applies
  dependencies: string[]; // Required libraries/frameworks
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  // Quality and validation
  qualityScore: number;
  constitutionallyValid: boolean;
  lastValidated: Date;
  lastUsed: Date;

  // Sources
  learnedFrom: 'context7' | 'user-interaction' | 'analysis-engine' | 'cross-agent'; // Only for documentation learning
  sourceDetails?: {
    documentationUrl?: string;
    sessionId?: string;
    agentId?: string;
    userFeedback?: 'positive' | 'negative' | 'neutral';
  };

  // Relationships
  relatedPatterns: string[]; // IDs of related patterns
  supersedes?: string[]; // Patterns this one replaces
  supersededBy?: string; // If this pattern is outdated
}

export interface LearningContext {
  sessionId: string;
  userId: string;
  language: string;
  framework?: string;
  problemType: string;
  successfulOutcome: boolean;
  userSatisfaction?: 'high' | 'medium' | 'low';
  analysisResult?: CodeAnalysisResult;
  documentationUsed?: DocumentationResult[];
}

export interface LearningMetrics {
  totalPatterns: number;
  patternsByCategory: Record<string, number>;
  patternsByLanguage: Record<string, number>;
  averageConfidence: number;
  averageSuccessRate: number;
  recentLearnings: number; // Last 7 days
  qualityTrend: number; // Improvement over time
  mostUsedPatterns: LearnedPattern[];
  emergingPatterns: LearnedPattern[]; // Recently learned, high potential
}

/**
 * Adaptive Learning Engine for DevAgent
 */
export class DevAgentLearningEngine {
  private a2aProtocol: OneAgentA2AProtocol;
  // context7Integration removed (deprecated)
  private agentId: string;
  private unifiedBackbone: OneAgentUnifiedBackbone;
  private memoryBridge: OneAgentMemory;

  // In-memory cache for fast access
  private patternCache: Map<string, LearnedPattern> = new Map();
  private categoryIndex: Map<string, string[]> = new Map(); // category -> pattern IDs
  private languageIndex: Map<string, string[]> = new Map(); // language -> pattern IDs

  private metrics: LearningMetrics = {
    totalPatterns: 0,
    patternsByCategory: {},
    patternsByLanguage: {},
    averageConfidence: 0,
    averageSuccessRate: 0,
    recentLearnings: 0,
    qualityTrend: 0,
    mostUsedPatterns: [],
    emergingPatterns: [],
  };
  constructor(agentId: string, a2aProtocol: OneAgentA2AProtocol) {
    this.agentId = agentId;
    this.a2aProtocol = a2aProtocol;
    // context7Integration initialization removed (deprecated)
    this.unifiedBackbone = OneAgentUnifiedBackbone.getInstance();
    this.memoryBridge = OneAgentMemory.getInstance();
  }

  /**
   * Initialize the learning engine and load existing patterns
   */
  async initialize(): Promise<void> {
    console.log('[LearningEngine] Initializing adaptive learning system...');

    try {
      // Load existing patterns from memory
      await this.loadExistingPatterns();

      // Update metrics
      await this.updateMetrics();

      console.log(`[LearningEngine] Loaded ${this.patternCache.size} existing patterns`);
      console.log(
        `[LearningEngine] Average confidence: ${this.metrics.averageConfidence.toFixed(2)}`,
      );
      console.log(
        `[LearningEngine] Average success rate: ${this.metrics.averageSuccessRate.toFixed(2)}`,
      );
    } catch (error) {
      console.warn('[LearningEngine] Failed to load existing patterns:', error);
    }
  }

  /**
   * Learn from a successful interaction
   */
  async learnFromInteraction(
    problem: string,
    solution: string,
    language: string,
    context: LearningContext,
  ): Promise<LearnedPattern | null> {
    try {
      console.log('[LearningEngine] Learning from interaction...');

      // Extract pattern from interaction
      const pattern = await this.extractPattern(problem, solution, language, context);

      if (!pattern) {
        return null;
      }

      // Check if we already have a similar pattern
      const existingPattern = await this.findSimilarPattern(pattern);

      if (existingPattern) {
        // Update existing pattern with new learning
        return await this.updateExistingPattern(existingPattern.id, context);
      } else {
        // Store new pattern
        return await this.storeNewPattern(pattern);
      }
    } catch (error) {
      console.error('[LearningEngine] Failed to learn from interaction:', error);
      return null;
    }
  }

  /**
   * Learn from context7 documentation (canonical only)
   */
  async learnFromDocumentation(
    documentationResults: DocumentationResult[],
    language: string,
    problemContext: string,
  ): Promise<LearnedPattern[]> {
    const learnedPatterns: LearnedPattern[] = [];

    try {
      console.log('[LearningEngine] Learning from context7 documentation...'); // Only for documentation learning

      for (const doc of documentationResults) {
        if (doc.relevanceScore > 0.7) {
          // Only learn from highly relevant docs
          const patterns = await this.extractPatternsFromDocumentation(
            doc,
            language,
            problemContext,
          );

          for (const pattern of patterns) {
            const stored = await this.storeNewPattern(pattern);
            if (stored) {
              learnedPatterns.push(stored);
            }
          }
        }
      }

      console.log(`[LearningEngine] Learned ${learnedPatterns.length} patterns from documentation`);
      return learnedPatterns;
    } catch (error) {
      console.error('[LearningEngine] Failed to learn from documentation:', error);
      return [];
    }
  }

  /**
   * Find relevant patterns for a given problem
   */
  async findRelevantPatterns(
    problem: string,
    language: string,
    category?: string,
    maxResults: number = 5,
  ): Promise<LearnedPattern[]> {
    try {
      // First check cache
      const cached = this.searchPatternCache(problem, language, category);

      // Also search in persistent memory
      const memoryResults = await this.searchPatternsInMemory(
        problem,
        language,
        category,
        maxResults,
      );

      // Combine and deduplicate
      const combined = [...cached, ...memoryResults];
      const unique = this.deduplicatePatterns(combined);

      // Sort by relevance and confidence
      return unique
        .sort((a, b) => {
          const scoreA = a.confidence * a.successRate * this.calculateRelevance(a, problem);
          const scoreB = b.confidence * b.successRate * this.calculateRelevance(b, problem);
          return scoreB - scoreA;
        })
        .slice(0, maxResults);
    } catch (error) {
      console.error('[LearningEngine] Failed to find relevant patterns:', error);
      return [];
    }
  }
  /**
   * Record pattern usage and outcome
   */
  async recordPatternUsage(
    patternId: string,
    wasSuccessful: boolean,
    _userFeedback?: 'positive' | 'negative' | 'neutral',
  ): Promise<void> {
    try {
      const pattern = this.patternCache.get(patternId);
      if (!pattern) {
        console.warn(`[LearningEngine] Pattern ${patternId} not found for usage recording`);
        return;
      }

      // Update pattern metrics
      pattern.timesUsed++;
      if (wasSuccessful) {
        pattern.timesSuccessful++;
      }
      pattern.successRate = pattern.timesSuccessful / pattern.timesUsed;
      const usageTimestamp = this.unifiedBackbone.getServices().timeService.now();
      pattern.lastUsed = new Date(usageTimestamp.utc);

      // Adjust confidence based on success
      if (wasSuccessful) {
        pattern.confidence = Math.min(1.0, pattern.confidence + 0.05);
      } else {
        pattern.confidence = Math.max(0.1, pattern.confidence - 0.1);
      }

      // Store updated pattern
      await this.updatePatternInMemory(pattern);

      // Update cache
      this.patternCache.set(patternId, pattern);

      console.log(
        `[LearningEngine] Updated pattern ${pattern.name}: confidence=${pattern.confidence.toFixed(2)}, success rate=${pattern.successRate.toFixed(2)}`,
      );
    } catch (error) {
      console.error('[LearningEngine] Failed to record pattern usage:', error);
    }
  }

  /**
   * Get learning metrics and insights
   */
  async getLearningMetrics(): Promise<LearningMetrics> {
    await this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Validate and clean up patterns (remove outdated, low-performing ones)
   */
  async cleanupPatterns(): Promise<{ removed: number; updated: number }> {
    let removed = 0;
    let updated = 0;

    try {
      console.log('[LearningEngine] Starting pattern cleanup...');

      for (const [patternId, pattern] of this.patternCache) {
        // Remove patterns with very low success rate and high usage
        if (pattern.timesUsed > 10 && pattern.successRate < 0.3) {
          await this.removePattern(patternId);
          removed++;
          continue;
        }
        // Mark old patterns for review
        const currentTime = this.unifiedBackbone.getServices().timeService.now();
        const daysSinceLastUsed =
          (currentTime.unix - pattern.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastUsed > 90 && pattern.timesUsed < 3) {
          pattern.confidence = Math.max(0.1, pattern.confidence - 0.2);
          await this.updatePatternInMemory(pattern);
          updated++;
        }
      }

      console.log(`[LearningEngine] Cleanup complete: removed ${removed}, updated ${updated}`);
      return { removed, updated };
    } catch (error) {
      console.error('[LearningEngine] Pattern cleanup failed:', error);
      return { removed: 0, updated: 0 };
    }
  }

  // PRIVATE IMPLEMENTATION METHODS
  /**
   * Load existing patterns from persistent memory (canonical format only)
   */
  private async loadExistingPatterns(): Promise<void> {
    try {
      // Query for all DevAgent learning patterns globally, not user-specific
      const memoryResult = await this.memoryBridge.searchMemory({
        query: 'learned pattern solution best practice devagent',
        userId: 'global',
        limit: 100,
        semanticSearch: true,
        type: 'learned-patterns',
      });
      const loadedPatterns: string[] = [];
      if (Array.isArray(memoryResult)) {
        for (const memory of memoryResult) {
          // Canonical: expect metadata.type === 'learned_pattern' and content is valid JSON
          if (memory.metadata?.type === 'learned_pattern') {
            try {
              const pattern: LearnedPattern = JSON.parse(memory.content);
              this.patternCache.set(pattern.id, pattern);
              this.updateIndexes(pattern);
              loadedPatterns.push(pattern.name);
            } catch (parseError) {
              console.warn(
                '[LearningEngine] Failed to parse stored pattern (canonical):',
                parseError,
              );
            }
          }
        }
      }
      console.log(
        `[LearningEngine] Loaded ${this.patternCache.size} existing patterns from global repository: ${loadedPatterns.join(', ')}`,
      );
    } catch (error) {
      console.warn('[LearningEngine] Failed to load existing patterns:', error);
    }
  }

  /**
   * Extract a pattern from a successful interaction
   */
  private async extractPattern(
    problem: string,
    solution: string,
    language: string,
    context: LearningContext,
  ): Promise<LearnedPattern | null> {
    // Use AI to extract meaningful patterns
    const unifiedMetadata = this.unifiedBackbone
      .getServices()
      .metadataService.create('learning-pattern', 'DevAgentLearningEngine', {
        content: {
          category: 'dev-pattern',
          tags: [language, context.framework].filter(Boolean) as string[],
          sensitivity: 'internal',
          relevanceScore: 0.8,
          contextDependency: 'session',
        },
      });
    const patternId = unifiedMetadata.id;

    // Determine category based on problem type
    const category = this.determinePatternCategory(problem, solution);

    // Determine complexity
    const complexity = this.determineComplexity(solution, context);
    const pattern: LearnedPattern = {
      id: patternId,
      name: this.generatePatternName(problem, language),
      description: `Solution for ${problem} in ${language}`,
      category,
      language,
      ...(context.framework && { framework: context.framework }),

      problem: problem,
      solution: solution,
      reasoning: `Learned from successful interaction in session ${context.sessionId}`,

      confidence: context.successfulOutcome ? 0.8 : 0.5,
      successRate: 1.0, // First time
      timesUsed: 1,
      timesSuccessful: context.successfulOutcome ? 1 : 0,

      contexts: [context.problemType],
      dependencies: this.extractDependencies(solution),
      complexity,
      qualityScore: context.analysisResult?.qualityScore || 80,
      constitutionallyValid: context.analysisResult?.constitutionalCompliance || true,
      lastValidated: new Date(this.unifiedBackbone.getServices().timeService.now().utc),
      lastUsed: new Date(this.unifiedBackbone.getServices().timeService.now().utc),

      learnedFrom: 'user-interaction',
      sourceDetails: {
        sessionId: context.sessionId,
        userFeedback:
          context.userSatisfaction === 'high'
            ? 'positive'
            : context.userSatisfaction === 'low'
              ? 'negative'
              : 'neutral',
      },
      relatedPatterns: [],
      supersedes: [],
    };

    return pattern;
  }

  /**
   * Extract patterns from context7 documentation (canonical only)
   */
  private async extractPatternsFromDocumentation(
    doc: DocumentationResult,
    language: string,
    problemContext: string,
  ): Promise<LearnedPattern[]> {
    const patterns: LearnedPattern[] = [];

    // Look for code examples and best practices in documentation
    const codeBlocks = this.extractCodeBlocks(doc.content);
    const bestPractices = this.extractBestPractices(doc.content);
    for (const codeBlock of codeBlocks) {
      const patternMetadata = this.unifiedBackbone.getServices().metadataService.create(
        'context7-pattern', // Only for documentation learning
        'DevAgentLearningEngine',
        {
          content: {
            category: 'context7-learning', // Only for documentation learning
            tags: [language, 'context7', 'documentation'], // Only for documentation learning
            sensitivity: 'internal',
            relevanceScore: 0.85,
            contextDependency: 'session',
          },
        },
      );
      const patternId = patternMetadata.id;

      const pattern: LearnedPattern = {
        id: patternId,
        name: `${doc.title} - ${language} Code Pattern`,
        description: `Code example from ${doc.source} documentation`,
        category: 'solution',
        language,

        problem: problemContext,
        solution: codeBlock,
        reasoning: `Documented best practice from ${doc.source}`,
        codeExample: codeBlock,

        confidence: 0.9, // High confidence for official docs
        successRate: 0.95, // Assume documentation is reliable
        timesUsed: 0,
        timesSuccessful: 0,

        contexts: [problemContext],
        dependencies: this.extractDependencies(codeBlock),
        complexity: 'intermediate',
        qualityScore: 90,
        constitutionallyValid: true,
        lastValidated: new Date(getEnhancedTimeContext().realTime.utc),
        lastUsed: new Date(0), // Never used yet
        learnedFrom: 'context7', // Only for documentation learning
        ...(doc.url && { sourceDetails: { documentationUrl: doc.url } }),

        relatedPatterns: [],
        supersedes: [],
      };

      patterns.push(pattern);
    }

    // Process best practice patterns - architectural completion
    for (const bestPractice of bestPractices) {
      if (bestPractice.trim().length < 20) continue; // Skip short/incomplete practices

      const practiceMetadata = this.unifiedBackbone.getServices().metadataService.create(
        'context7-best-practice', // Only for documentation learning
        'DevAgentLearningEngine',
        {
          content: {
            category: 'context7-learning', // Only for documentation learning
            tags: [language, 'context7', 'documentation', 'best-practice'], // Only for documentation learning
            sensitivity: 'internal',
            relevanceScore: 0.9, // Best practices are highly relevant
            contextDependency: 'session',
          },
        },
      );
      const practiceId = practiceMetadata.id;

      const practicePattern: LearnedPattern = {
        id: practiceId,
        name: `${doc.title} - ${language} Best Practice`,
        description: `Best practice guideline from ${doc.source}`,
        category: 'best-practice',
        language,

        problem: problemContext,
        solution: bestPractice.trim(),
        reasoning: `Best practice recommendation from ${doc.source}`,
        codeExample: '', // Best practices are textual, not code

        confidence: 0.95, // Very high confidence for documented best practices
        successRate: 0.9, // Best practices prevent issues
        timesUsed: 0,
        timesSuccessful: 0,

        contexts: [problemContext],
        dependencies: [], // Best practices typically don't have code dependencies
        complexity: 'beginner', // Best practices are foundational guidelines

        qualityScore: 95, // Best practices have high quality value
        constitutionallyValid: true,
        lastValidated: new Date(getEnhancedTimeContext().realTime.utc),
        lastUsed: new Date(0),

        learnedFrom: 'context7', // Only for documentation learning
        ...(doc.url && { sourceDetails: { documentationUrl: doc.url } }),

        relatedPatterns: [],
        supersedes: [],
      };

      patterns.push(practicePattern);
    }

    return patterns;
  }
  /**
   * Store a new pattern in persistent memory
   */
  private async storeNewPattern(pattern: LearnedPattern): Promise<LearnedPattern> {
    try {
      const meta = unifiedMetadataService.create('learned_pattern', 'DevAgentLearningEngine', {
        system: {
          source: 'dev_agent_learning',
          component: 'DevAgentLearningEngine',
          userId: 'dev_agent',
        },
        content: {
          category: 'learned_pattern',
          tags: ['learning', pattern.category, pattern.language],
          sensitivity: 'internal',
          relevanceScore: pattern.confidence,
          contextDependency: 'session',
        },
      });
      interface PatternExt {
        custom?: Record<string, unknown>;
      }
      (meta as PatternExt).custom = {
        patternId: pattern.id,
        language: pattern.language,
        framework: pattern.framework,
        category: pattern.category,
        confidence: pattern.confidence,
        applicationCount: pattern.timesUsed,
        lastApplied: createUnifiedTimestamp().iso,
      };
      await this.memoryBridge.addMemoryCanonical(JSON.stringify(pattern), meta, 'dev_agent');
      return pattern;
    } catch (error) {
      console.error('[LearningEngine] Failed to store new pattern:', error);
      throw error;
    }
  }

  /**
   * Update indexes for fast pattern lookup
   */
  private updateIndexes(pattern: LearnedPattern): void {
    // Category index
    if (!this.categoryIndex.has(pattern.category)) {
      this.categoryIndex.set(pattern.category, []);
    }
    this.categoryIndex.get(pattern.category)!.push(pattern.id);

    // Language index
    if (!this.languageIndex.has(pattern.language)) {
      this.languageIndex.set(pattern.language, []);
    }
    this.languageIndex.get(pattern.language)!.push(pattern.id);
  }

  /**
   * Calculate relevance score for a pattern given a problem
   */
  private calculateRelevance(pattern: LearnedPattern, problem: string): number {
    const problemWords = problem.toLowerCase().split(' ');
    const patternWords = [
      ...pattern.problem.toLowerCase().split(' '),
      ...pattern.description.toLowerCase().split(' '),
      ...pattern.contexts.join(' ').toLowerCase().split(' '),
    ];

    let matches = 0;
    for (const word of problemWords) {
      if (patternWords.some((pw) => pw.includes(word) || word.includes(pw))) {
        matches++;
      }
    }

    return matches / problemWords.length;
  }

  /**
   * Helper methods for pattern analysis
   */
  private determinePatternCategory(problem: string, solution: string): LearnedPattern['category'] {
    const lowerProblem = problem.toLowerCase();
    const lowerSolution = solution.toLowerCase();

    if (
      lowerProblem.includes('debug') ||
      lowerProblem.includes('error') ||
      lowerProblem.includes('fix')
    ) {
      return 'debugging';
    }
    if (
      lowerSolution.includes('avoid') ||
      lowerSolution.includes("don't") ||
      lowerSolution.includes('never')
    ) {
      return 'anti-pattern';
    }
    if (lowerSolution.includes('best practice') || lowerSolution.includes('recommended')) {
      return 'best-practice';
    }
    if (lowerProblem.includes('framework') || lowerSolution.includes('framework')) {
      return 'framework';
    }
    if (lowerProblem.includes('library') || lowerSolution.includes('import')) {
      return 'library';
    }

    return 'solution';
  }

  private determineComplexity(
    solution: string,
    _context: LearningContext,
  ): LearnedPattern['complexity'] {
    const solutionLength = solution.length;
    const codeLines = solution.split('\n').length;

    if (solutionLength < 200 && codeLines < 10) return 'beginner';
    if (solutionLength < 500 && codeLines < 25) return 'intermediate';
    if (solutionLength < 1000 && codeLines < 50) return 'advanced';
    return 'expert';
  }

  private generatePatternName(problem: string, language: string): string {
    const words = problem.split(' ').slice(0, 4);
    return `${language} ${words.join(' ')} Pattern`;
  }

  private extractDependencies(solution: string): string[] {
    const dependencies = [];
    const importMatches = solution.match(/import.*from ['"]([^'"]+)['"]/g);
    if (importMatches) {
      for (const match of importMatches) {
        const dep = match.match(/from ['"]([^'"]+)['"]/)?.[1];
        if (dep) dependencies.push(dep);
      }
    }
    return dependencies;
  }

  private extractCodeBlocks(content: string): string[] {
    const codeBlocks = [];
    const matches = content.match(/```[\s\S]*?```/g);
    if (matches) {
      for (const match of matches) {
        codeBlocks.push(match.replace(/```\w*\n?/, '').replace(/```$/, ''));
      }
    }
    return codeBlocks;
  }

  private extractBestPractices(content: string): string[] {
    // Extract sentences that contain best practice indicators
    const sentences = content.split(/[.!?]+/);
    return sentences.filter(
      (sentence) =>
        sentence.toLowerCase().includes('best practice') ||
        sentence.toLowerCase().includes('recommended') ||
        sentence.toLowerCase().includes('should'),
    );
  }

  private searchPatternCache(
    problem: string,
    language: string,
    category?: string,
  ): LearnedPattern[] {
    const results = [];

    for (const pattern of this.patternCache.values()) {
      if (pattern.language === language) {
        if (category && pattern.category !== category) continue;

        const relevance = this.calculateRelevance(pattern, problem);
        if (relevance > 0.3) {
          results.push(pattern);
        }
      }
    }

    return results;
  }
  private async searchPatternsInMemory(
    problem: string,
    language: string,
    category?: string,
    maxResults: number = 5,
  ): Promise<LearnedPattern[]> {
    try {
      const searchQuery = `${language} ${category || ''} ${problem}`.trim();
      const memoryResult = await this.memoryBridge.searchMemory({
        query: searchQuery,
        userId: this.agentId,
        limit: maxResults,
        semanticSearch: true,
        type: 'learned-patterns',
      });
      const list = Array.isArray(memoryResult) ? memoryResult : [];
      const patterns: LearnedPattern[] = list
        .slice(0, maxResults)
        .map((mem) => {
          try {
            interface MemoryLike {
              metadata?: { type?: string };
            }
            if ((mem as MemoryLike).metadata?.type === 'learned_pattern') {
              return JSON.parse(mem.content) as LearnedPattern;
            }
          } catch (e) {
            console.warn('[LearningEngine] Failed to parse pattern memory:', e);
          }
          return null;
        })
        .filter((p): p is LearnedPattern => !!p);
      return patterns;
    } catch (error) {
      console.error('[LearningEngine] Failed to search patterns in memory:', error);
      return [];
    }
  }

  private deduplicatePatterns(patterns: LearnedPattern[]): LearnedPattern[] {
    const seen = new Set<string>();
    return patterns.filter((pattern) => {
      if (seen.has(pattern.id)) return false;
      seen.add(pattern.id);
      return true;
    });
  }

  private async findSimilarPattern(pattern: LearnedPattern): Promise<LearnedPattern | null> {
    // Simple similarity check - can be enhanced with semantic analysis
    for (const existing of this.patternCache.values()) {
      if (
        existing.language === pattern.language &&
        existing.category === pattern.category &&
        this.calculateSimilarity(existing.problem, pattern.problem) > 0.8
      ) {
        return existing;
      }
    }
    return null;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(' '));
    const words2 = new Set(text2.toLowerCase().split(' '));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private async updateExistingPattern(
    patternId: string,
    context: LearningContext,
  ): Promise<LearnedPattern> {
    const pattern = this.patternCache.get(patternId)!;

    // Update metrics
    pattern.timesUsed++;
    if (context.successfulOutcome) {
      pattern.timesSuccessful++;
    }
    pattern.successRate = pattern.timesSuccessful / pattern.timesUsed;
    const contextUsageTimestamp = this.unifiedBackbone.getServices().timeService.now();
    pattern.lastUsed = new Date(contextUsageTimestamp.utc);

    // Update confidence
    if (context.successfulOutcome) {
      pattern.confidence = Math.min(1.0, pattern.confidence + 0.02);
    }

    await this.updatePatternInMemory(pattern);
    return pattern;
  }
  private async updatePatternInMemory(pattern: LearnedPattern): Promise<void> {
    const meta = unifiedMetadataService.create('learned_pattern', 'DevAgentLearningEngine', {
      system: {
        source: 'dev_agent_learning',
        component: 'DevAgentLearningEngine',
        userId: 'dev_agent',
      },
      content: {
        category: 'learned_pattern',
        tags: ['learning', pattern.category, pattern.language, 'update'],
        sensitivity: 'internal',
        relevanceScore: pattern.confidence,
        contextDependency: 'session',
      },
    });
    interface PatternUpdateExt {
      custom?: Record<string, unknown>;
    }
    (meta as PatternUpdateExt).custom = {
      patternId: pattern.id,
      language: pattern.language,
      framework: pattern.framework,
      category: pattern.category,
      confidence: pattern.confidence,
      applicationCount: pattern.timesUsed,
      lastApplied: createUnifiedTimestamp().iso,
      updated: true,
    };
    await this.memoryBridge.addMemory({ content: JSON.stringify(pattern), metadata: meta });
  }

  private async removePattern(patternId: string): Promise<void> {
    this.patternCache.delete(patternId);
    // Note: We don't actually delete from memory to preserve history
    console.log(`[LearningEngine] Removed pattern ${patternId} from active cache`);
  }

  private async updateMetrics(): Promise<void> {
    const patterns = Array.from(this.patternCache.values());

    this.metrics.totalPatterns = patterns.length;
    this.metrics.averageConfidence =
      patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length || 0;
    this.metrics.averageSuccessRate =
      patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length || 0;

    // Update categories and languages
    this.metrics.patternsByCategory = {};
    this.metrics.patternsByLanguage = {};

    for (const pattern of patterns) {
      this.metrics.patternsByCategory[pattern.category] =
        (this.metrics.patternsByCategory[pattern.category] || 0) + 1;
      this.metrics.patternsByLanguage[pattern.language] =
        (this.metrics.patternsByLanguage[pattern.language] || 0) + 1;
    }

    // Most used patterns
    this.metrics.mostUsedPatterns = patterns.sort((a, b) => b.timesUsed - a.timesUsed).slice(0, 5); // Emerging patterns (recent, low usage, high confidence)
    const currentTime = this.unifiedBackbone.getServices().timeService.now();
    const recentCutoff = currentTime.unix - 7 * 24 * 60 * 60 * 1000; // 7 days
    this.metrics.emergingPatterns = patterns
      .filter((p) => {
        const lastValidatedTime =
          p.lastValidated instanceof Date
            ? p.lastValidated.getTime()
            : new Date(p.lastValidated).getTime();
        return lastValidatedTime > recentCutoff && p.timesUsed < 5 && p.confidence > 0.7;
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    this.metrics.recentLearnings = this.metrics.emergingPatterns.length;
  }
}

export default DevAgentLearningEngine;
