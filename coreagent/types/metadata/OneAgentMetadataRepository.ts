/**
 * OneAgent Unified Metadata Repository
 * Core Implementation of Metadata Management System
 *
 * This repository provides the central hub for all metadata operations
 * across the OneAgent ecosystem, ensuring Constitutional AI compliance,
 * quality standards, and cross-system synchronization.
 *
 * Version: 1.0.0
 * Created: 2024-06-18
 */

import {
  AnyMetadata,
  MetadataType,
  MetadataRepository,
  MetadataQueryCriteria,
  SearchOptions,
  ValidationResult,
  QualityScore,
  ConstitutionalValidationResult,
  SyncResult,
  ConstitutionalAIMetadata,
  QualityMetadata,
  SemanticMetadata,
} from './OneAgentUnifiedMetadata.js';
import { OneAgentUnifiedBackbone } from '../../utils/UnifiedBackboneService.js';

// =====================================
// METADATA REPOSITORY IMPLEMENTATION
// =====================================

export class OneAgentMetadataRepository implements MetadataRepository {
  /**
   * ARCHITECTURAL EXCEPTION: This Map provides in-memory metadata storage with indices.
   * It is used for runtime metadata management with structured indexing.
   * This usage is allowed for metadata repository infrastructure.
   */
  // eslint-disable-next-line oneagent/no-parallel-cache
  private storage: Map<string, AnyMetadata> = new Map();
  private unifiedBackbone: OneAgentUnifiedBackbone;
  private indices: {
    byType: Map<MetadataType, Set<string>>;
    byTags: Map<string, Set<string>>;
    bySystem: Map<string, Set<string>>;
    byQuality: Map<string, Set<string>>; // quality grade -> ids
  };
  constructor(
    private constitutionalValidator?: ConstitutionalValidator,
    private qualityScorer?: QualityScorer,
    private semanticAnalyzer?: SemanticAnalyzer,
    private syncManager?: SyncManager,
  ) {
    this.unifiedBackbone = OneAgentUnifiedBackbone.getInstance();
    this.indices = {
      byType: new Map(),
      byTags: new Map(),
      bySystem: new Map(),
      byQuality: new Map(),
    };
  }

  // =====================================
  // CRUD OPERATIONS
  // =====================================

  async create<T extends AnyMetadata>(metadata: T): Promise<T> {
    // Validate metadata
    const validation = await this.validate(metadata);
    if (!validation.isValid) {
      throw new Error(`Invalid metadata: ${validation.errors.map((e) => e.message).join(', ')}`);
    }

    // Enhance with Constitutional AI validation
    if (this.constitutionalValidator) {
      const constitutionalResult = await this.validateConstitutional(metadata);
      metadata.constitutional = this.mergeConstitutionalMetadata(
        metadata.constitutional,
        constitutionalResult,
      );
    }

    // Enhance with quality scoring
    if (this.qualityScorer) {
      const qualityResult = await this.scoreQuality(metadata);
      metadata.quality = this.mergeQualityMetadata(metadata.quality, qualityResult);
    }

    // Enhance with semantic analysis
    if (this.semanticAnalyzer) {
      const semanticEnhancements = await this.semanticAnalyzer.analyze(metadata);
      metadata.semantic = this.mergeSemanticMetadata(metadata.semantic, semanticEnhancements);
    } // Use unified backbone for enhanced time awareness
    const unifiedBackbone = OneAgentUnifiedBackbone.getInstance();
    const timeContext = unifiedBackbone.getServices().timeService.getContext();
    const timestamp = unifiedBackbone.getServices().timeService.now();

    metadata.updatedAt = new Date(timeContext.realTime.utc);
    if (!metadata.createdAt) {
      metadata.createdAt = new Date(timeContext.realTime.utc);
    } // Create enhanced temporal metadata using unified backbone
    if (!metadata.temporal) {
      metadata.temporal = {
        realTime: {
          createdAtUnix: timestamp.unix,
          updatedAtUnix: timestamp.unix,
          timezoneCaptured: timestamp.timezone,
          utcOffset: timeContext.realTime.offset,
        },
        contextSnapshot: {
          timeOfDay: timeContext.context.timeOfDay,
          dayOfWeek: timeContext.context.dayOfWeek,
          businessContext: timeContext.context.businessDay,
          seasonalContext: timeContext.context.seasonalContext,
          userEnergyContext: timeContext.intelligence.energyLevel,
        },
        relevance: {
          isTimeDependent: metadata.type === 'conversation' || metadata.type === 'memory',
          relevanceDecay: metadata.type === 'documentation' ? 'slow' : 'medium',
          temporalTags: [],
        },
        lifeCoaching: {
          habitTimestamp: false,
          goalTimeline: {
            isGoalRelated: false,
            timeframe: 'daily',
          },
          emotionalTiming: {
            energyAlignment: timeContext.intelligence.optimalFocusTime,
            reflectionTiming: timeContext.context.timeOfDay === 'evening',
          },
        },
        professional: {
          projectPhase: 'execution',
          urgencyLevel: 'medium',
          deadlineAwareness: {
            hasDeadline: false,
            criticalPath: false,
          },
          collaborationTiming: {
            requiresRealTime: false,
            asyncFriendly: true,
            timezoneSensitive: false,
          },
        },
      };
    }

    // Store and index
    this.storage.set(metadata.id, metadata);
    this.updateIndices(metadata);

    // Trigger sync if configured
    if (this.syncManager) {
      await this.syncManager.triggerSync(metadata.id);
    }

    return metadata;
  }

  async read<T extends AnyMetadata>(id: string): Promise<T | null> {
    const metadata = this.storage.get(id) as T;
    if (metadata) {
      // Update access tracking with enhanced time
      const timeContext = this.unifiedBackbone.getServices().timeService.getContext();
      metadata.lastAccessedAt = new Date(timeContext.realTime.utc);
      metadata.context.usage.lastAccessed = new Date(timeContext.realTime.utc);
      metadata.context.usage.frequencyAccessed += 1;

      // Update temporal tracking
      if (metadata.temporal?.realTime) {
        metadata.temporal.realTime.lastAccessedUnix = timeContext.realTime.unix;
      }
    }
    return metadata || null;
  }

  async update<T extends AnyMetadata>(id: string, updates: Partial<T>): Promise<T> {
    const existing = await this.read<T>(id);
    if (!existing) {
      throw new Error(`Metadata with id ${id} not found`);
    } // Merge updates with enhanced time
    const timeContext = this.unifiedBackbone.getServices().timeService.getContext();
    const updated = { ...existing, ...updates, updatedAt: new Date(timeContext.realTime.utc) } as T;

    // Update temporal metadata
    if (updated.temporal?.realTime) {
      updated.temporal.realTime.updatedAtUnix = timeContext.realTime.unix;
    }

    // Re-validate
    const validation = await this.validate(updated);
    if (!validation.isValid) {
      throw new Error(
        `Invalid metadata updates: ${validation.errors.map((e) => e.message).join(', ')}`,
      );
    }

    // Re-analyze if significant changes
    if (this.hasSignificantChanges(existing, updated)) {
      if (this.constitutionalValidator) {
        const constitutionalResult = await this.validateConstitutional(updated);
        updated.constitutional = this.mergeConstitutionalMetadata(
          updated.constitutional,
          constitutionalResult,
        );
      }

      if (this.qualityScorer) {
        const qualityResult = await this.scoreQuality(updated);
        updated.quality = this.mergeQualityMetadata(updated.quality, qualityResult);
      }
    }

    // Store and update indices
    this.storage.set(id, updated);
    this.updateIndices(updated);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const metadata = this.storage.get(id);
    if (!metadata) {
      return false;
    }

    // Remove from indices
    this.removeFromIndices(metadata);

    // Remove from storage
    this.storage.delete(id);

    return true;
  }

  // =====================================
  // QUERY OPERATIONS
  // =====================================

  async query<T extends AnyMetadata>(criteria: MetadataQueryCriteria): Promise<T[]> {
    let candidateIds = new Set<string>();
    let firstFilter = true;

    // Filter by type
    if (criteria.type) {
      const typeIds = this.indices.byType.get(criteria.type) || new Set();
      if (firstFilter) {
        candidateIds = new Set(typeIds);
        firstFilter = false;
      } else {
        candidateIds = this.intersection(candidateIds, typeIds);
      }
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      const tagIds = new Set<string>();
      criteria.tags.forEach((tag: string) => {
        const ids = this.indices.byTags.get(tag) || new Set();
        ids.forEach((id) => tagIds.add(id));
      });

      if (firstFilter) {
        candidateIds = tagIds;
        firstFilter = false;
      } else {
        candidateIds = this.intersection(candidateIds, tagIds);
      }
    }

    // Filter by quality
    if (criteria.qualityRange) {
      const qualityIds = new Set<string>();
      ['A', 'B', 'C', 'D', 'F'].forEach((grade) => {
        const gradeScore = this.gradeToScore(grade);
        if (gradeScore >= criteria.qualityRange!.min && gradeScore <= criteria.qualityRange!.max) {
          const ids = this.indices.byQuality.get(grade) || new Set();
          ids.forEach((id) => qualityIds.add(id));
        }
      });

      if (firstFilter) {
        candidateIds = qualityIds;
        firstFilter = false;
      } else {
        candidateIds = this.intersection(candidateIds, qualityIds);
      }
    }

    // If no filters applied, get all
    if (firstFilter) {
      candidateIds = new Set(this.storage.keys());
    }

    // Convert to metadata objects and apply additional filters
    let results: T[] = [];
    for (const id of candidateIds) {
      const metadata = this.storage.get(id) as T;
      if (metadata && this.matchesAdditionalCriteria(metadata, criteria)) {
        results.push(metadata);
      }
    }

    // Apply sorting
    if (criteria.sortBy) {
      results.sort((a, b) =>
        this.compareMetadata(a, b, criteria.sortBy!, criteria.sortOrder || 'asc'),
      );
    }

    // Apply pagination
    if (criteria.offset) {
      results = results.slice(criteria.offset);
    }
    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  async search<T extends AnyMetadata>(query: string, options: SearchOptions = {}): Promise<T[]> {
    const results: Array<{ metadata: T; score: number }> = [];

    for (const [, metadata] of this.storage) {
      let score = 0;

      // Basic text search
      if (this.matchesTextSearch(metadata, query)) {
        score += 10;
      }

      // Semantic search if enabled and available
      if (options.semanticSearch && this.semanticAnalyzer) {
        const semanticScore = await this.semanticAnalyzer.similarity(query, metadata);
        score += semanticScore * 20;
      }

      // Tag matching
      if (
        metadata.semantic.semanticTags.primary.some((tag: string) =>
          tag.toLowerCase().includes(query.toLowerCase()),
        )
      ) {
        score += 15;
      }

      // Title/description matching
      if (metadata.title.toLowerCase().includes(query.toLowerCase())) {
        score += 25;
      }
      if (metadata.description?.toLowerCase().includes(query.toLowerCase())) {
        score += 10;
      }

      // Quality boost
      score *= metadata.quality.qualityScore.overall / 100;

      // Constitutional compliance boost
      if (metadata.constitutional.overallCompliance.score >= 80) {
        score *= 1.1;
      }

      if (score >= (options.relevanceThreshold || 5)) {
        results.push({ metadata: metadata as T, score });
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    const limit = options.maxResults || 50;
    return results.slice(0, limit).map((r) => r.metadata);
  }

  // =====================================
  // RELATIONSHIP OPERATIONS
  // =====================================

  async getRelated<T extends AnyMetadata>(id: string, relationshipType?: string): Promise<T[]> {
    const metadata = await this.read(id);
    if (!metadata) {
      return [];
    }

    const relatedIds = metadata.semantic.relationships.relatedIds;
    const related: T[] = [];

    for (const relatedId of relatedIds) {
      if (relationshipType) {
        const type = metadata.semantic.relationships.relationshipTypes[relatedId];
        if (type !== relationshipType) {
          continue;
        }
      }

      const relatedMetadata = await this.read<T>(relatedId);
      if (relatedMetadata) {
        related.push(relatedMetadata);
      }
    }

    // Sort by relationship strength
    related.sort((a, b) => {
      const strengthA = metadata.semantic.relationships.strength[a.id] || 0;
      const strengthB = metadata.semantic.relationships.strength[b.id] || 0;
      return strengthB - strengthA;
    });

    return related;
  }

  async createRelationship(
    fromId: string,
    toId: string,
    relationshipType: string,
    strength: number = 0.5,
  ): Promise<boolean> {
    const fromMetadata = await this.read(fromId);
    const toMetadata = await this.read(toId);

    if (!fromMetadata || !toMetadata) {
      return false;
    }

    // Add relationship in both directions
    fromMetadata.semantic.relationships.relatedIds.push(toId);
    fromMetadata.semantic.relationships.relationshipTypes[toId] = relationshipType as
      | 'parent'
      | 'child'
      | 'sibling'
      | 'reference'
      | 'similar';
    fromMetadata.semantic.relationships.strength[toId] = strength;

    toMetadata.semantic.relationships.relatedIds.push(fromId);
    toMetadata.semantic.relationships.relationshipTypes[fromId] = this.getInverseRelationship(
      relationshipType,
    ) as 'parent' | 'child' | 'sibling' | 'reference' | 'similar';
    toMetadata.semantic.relationships.strength[fromId] = strength;

    // Update both metadata objects
    await this.update(fromId, fromMetadata);
    await this.update(toId, toMetadata);

    return true;
  }

  // =====================================
  // VALIDATION AND QUALITY
  // =====================================

  async validate<T extends AnyMetadata>(metadata: T): Promise<ValidationResult> {
    const errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }> = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Required field validation
    if (!metadata.id) errors.push({ field: 'id', message: 'ID is required', severity: 'error' });
    if (!metadata.type)
      errors.push({ field: 'type', message: 'Type is required', severity: 'error' });
    if (!metadata.title)
      errors.push({ field: 'title', message: 'Title is required', severity: 'error' });

    // Timestamp validation
    if (!metadata.createdAt)
      errors.push({
        field: 'createdAt',
        message: 'Created timestamp is required',
        severity: 'error',
      });
    if (!metadata.updatedAt)
      errors.push({
        field: 'updatedAt',
        message: 'Updated timestamp is required',
        severity: 'error',
      });

    // Constitutional AI validation
    if (metadata.constitutional.overallCompliance.score < 80) {
      warnings.push('Constitutional AI compliance score is below recommended threshold (80)');
    }

    // Quality validation
    if (metadata.quality.qualityScore.overall < 80) {
      warnings.push('Quality score is below recommended threshold (80)');
      suggestions.push('Consider improving content quality to meet professional standards');
    }

    // Semantic validation
    if (metadata.semantic.semanticTags.primary.length === 0) {
      warnings.push('No primary semantic tags defined');
      suggestions.push('Add semantic tags to improve searchability');
    }

    return {
      isValid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  async scoreQuality<T extends AnyMetadata>(metadata: T): Promise<QualityScore> {
    if (this.qualityScorer) {
      return await this.qualityScorer.score(metadata);
    }

    // Fallback basic scoring
    const scores = {
      completeness: this.scoreCompleteness(metadata),
      accuracy: metadata.constitutional.accuracy.score,
      relevance: Math.min(metadata.semantic.semanticTags.primary.length * 20, 100),
      clarity: metadata.title.length > 10 ? 80 : 60,
      maintainability: metadata.validation.schemaCompliant ? 90 : 50,
      performance: 75, // Default
    };

    const overall =
      Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;

    return {
      overall,
      breakdown: scores,
      grade: this.scoreToGrade(overall),
      improvements: this.generateImprovements(scores),
    };
  }

  async validateConstitutional<T extends AnyMetadata>(
    metadata: T,
  ): Promise<ConstitutionalValidationResult> {
    if (this.constitutionalValidator) {
      return await this.constitutionalValidator.validate(metadata);
    }

    // Fallback basic validation
    const breakdown = {
      accuracy: metadata.constitutional.accuracy.score,
      transparency: metadata.constitutional.transparency.score,
      helpfulness: metadata.constitutional.helpfulness.score,
      safety: metadata.constitutional.safety.score,
    };

    const score = Object.values(breakdown).reduce((sum, s) => sum + s, 0) / 4;

    return {
      compliant: score >= 80,
      score,
      grade: this.scoreToGrade(score),
      breakdown,
      violations: score < 80 ? ['Overall compliance below threshold'] : [],
      recommendations: score < 80 ? ['Improve content to meet Constitutional AI standards'] : [],
    };
  }

  // =====================================
  // SYNCHRONIZATION
  // =====================================

  async sync(systemId: string, metadataId: string): Promise<SyncResult> {
    if (!this.syncManager) {
      throw new Error('Sync manager not configured');
    }

    return await this.syncManager.sync(systemId, metadataId);
  }

  async bulkSync(systemId: string, metadataIds: string[]): Promise<SyncResult[]> {
    if (!this.syncManager) {
      throw new Error('Sync manager not configured');
    }

    return await this.syncManager.bulkSync(systemId, metadataIds);
  }

  // =====================================
  // PRIVATE HELPER METHODS
  // =====================================

  private updateIndices(metadata: AnyMetadata): void {
    // Type index
    if (!this.indices.byType.has(metadata.type as MetadataType)) {
      this.indices.byType.set(metadata.type as MetadataType, new Set());
    }
    this.indices.byType.get(metadata.type as MetadataType)!.add(metadata.id);

    // Tag index
    metadata.semantic.semanticTags.primary.forEach((tag) => {
      if (!this.indices.byTags.has(tag)) {
        this.indices.byTags.set(tag, new Set());
      }
      this.indices.byTags.get(tag)!.add(metadata.id);
    });

    // System index
    Object.keys(metadata.integration.systemIds).forEach((system) => {
      if (!this.indices.bySystem.has(system)) {
        this.indices.bySystem.set(system, new Set());
      }
      this.indices.bySystem.get(system)!.add(metadata.id);
    }); // Quality index
    const grade = this.scoreToGrade(metadata.quality.qualityScore.overall);
    if (!this.indices.byQuality.has(grade)) {
      this.indices.byQuality.set(grade, new Set());
    }
    this.indices.byQuality.get(grade)!.add(metadata.id);
  }

  private removeFromIndices(metadata: AnyMetadata): void {
    // Remove from all indices
    this.indices.byType.get(metadata.type as MetadataType)?.delete(metadata.id);

    metadata.semantic.semanticTags.primary.forEach((tag) => {
      this.indices.byTags.get(tag)?.delete(metadata.id);
    });

    Object.keys(metadata.integration.systemIds).forEach((system) => {
      this.indices.bySystem.get(system)?.delete(metadata.id);
    });
    const grade = this.scoreToGrade(metadata.quality.qualityScore.overall);
    this.indices.byQuality.get(grade)?.delete(metadata.id);
  }

  private intersection<T>(set1: Set<T>, set2: Set<T>): Set<T> {
    return new Set([...set1].filter((x) => set2.has(x)));
  }

  private matchesTextSearch(metadata: AnyMetadata, query: string): boolean {
    const searchText = [
      metadata.title,
      metadata.description || '',
      ...metadata.semantic.semanticTags.primary,
      ...metadata.semantic.searchability.searchTerms,
    ]
      .join(' ')
      .toLowerCase();

    return searchText.includes(query.toLowerCase());
  }

  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private gradeToScore(grade: string): number {
    switch (grade) {
      case 'A':
        return 95;
      case 'B':
        return 85;
      case 'C':
        return 75;
      case 'D':
        return 65;
      case 'F':
        return 50;
      default:
        return 0;
    }
  }

  private scoreCompleteness(metadata: AnyMetadata): number {
    let score = 0;
    let maxScore = 0;

    // Required fields
    maxScore += 20;
    if (metadata.title && metadata.title.length > 5) score += 20;

    maxScore += 20;
    if (metadata.description && metadata.description.length > 10) score += 20;

    maxScore += 20;
    if (metadata.semantic.semanticTags.primary.length > 0) score += 20;

    maxScore += 20;
    if (metadata.constitutional.overallCompliance.score > 0) score += 20;

    maxScore += 20;
    if (metadata.quality.qualityScore.overall > 0) score += 20;

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  private generateImprovements(scores: Record<string, number>): string[] {
    const improvements: string[] = [];

    Object.entries(scores).forEach(([category, score]) => {
      if (score < 80) {
        switch (category) {
          case 'completeness':
            improvements.push('Add more detailed description and semantic tags');
            break;
          case 'accuracy':
            improvements.push('Verify content accuracy and update Constitutional AI validation');
            break;
          case 'relevance':
            improvements.push('Add more relevant semantic tags and context');
            break;
          case 'clarity':
            improvements.push('Improve title and description clarity');
            break;
          case 'maintainability':
            improvements.push('Ensure schema compliance and proper validation');
            break;
          case 'performance':
            improvements.push('Optimize metadata structure for better performance');
            break;
        }
      }
    });

    return improvements;
  }

  private hasSignificantChanges(old: AnyMetadata, updated: AnyMetadata): boolean {
    // Check if core content changed
    return (
      old.title !== updated.title ||
      old.description !== updated.description ||
      JSON.stringify(old.semantic.semanticTags) !== JSON.stringify(updated.semantic.semanticTags)
    );
  }

  private getInverseRelationship(relationshipType: string): string {
    const inverses: Record<string, string> = {
      parent: 'child',
      child: 'parent',
      similar: 'similar',
      reference: 'referenced-by',
      'referenced-by': 'reference',
      sibling: 'sibling',
    };
    return inverses[relationshipType] || relationshipType;
  }

  private matchesAdditionalCriteria(
    metadata: AnyMetadata,
    criteria: MetadataQueryCriteria,
  ): boolean {
    // Date range filtering
    if (criteria.dateRange) {
      const date = metadata.createdAt;
      if (date < criteria.dateRange.start || date > criteria.dateRange.end) {
        return false;
      }
    }

    // Constitutional compliance filtering
    if (criteria.constitutionalCompliance !== undefined) {
      const isCompliant = metadata.constitutional.overallCompliance.score >= 80;
      if (criteria.constitutionalCompliance !== isCompliant) {
        return false;
      }
    }

    // System filtering
    if (criteria.systems && criteria.systems.length > 0) {
      const hasSystem = criteria.systems.some((system) =>
        Object.keys(metadata.integration.systemIds).includes(system),
      );
      if (!hasSystem) {
        return false;
      }
    }

    // Archived filtering
    if (criteria.archived !== undefined) {
      if (criteria.archived !== metadata.system.archived) {
        return false;
      }
    }

    return true;
  }

  private compareMetadata(
    a: AnyMetadata,
    b: AnyMetadata,
    sortBy: string,
    order: 'asc' | 'desc',
  ): number {
    let comparison = 0;

    switch (sortBy) {
      case 'createdAt':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'updatedAt':
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;
      case 'quality':
        comparison = a.quality.qualityScore.overall - b.quality.qualityScore.overall;
        break;
      case 'constitutional':
        comparison =
          a.constitutional.overallCompliance.score - b.constitutional.overallCompliance.score;
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      default:
        comparison = 0;
    }

    return order === 'desc' ? -comparison : comparison;
  }

  private mergeConstitutionalMetadata(
    existing: ConstitutionalAIMetadata,
    validation: ConstitutionalValidationResult,
  ): ConstitutionalAIMetadata {
    return {
      ...existing,
      accuracy: { ...existing.accuracy, score: validation.breakdown.accuracy },
      transparency: { ...existing.transparency, score: validation.breakdown.transparency },
      helpfulness: { ...existing.helpfulness, score: validation.breakdown.helpfulness },
      safety: { ...existing.safety, score: validation.breakdown.safety },
      overallCompliance: {
        ...existing.overallCompliance,
        score: validation.score,
        grade: validation.grade,
        lastValidated: new Date(this.unifiedBackbone.getServices().timeService.now().utc),
        validatedBy: 'OneAgentMetadataRepository',
      },
    };
  }

  private mergeQualityMetadata(existing: QualityMetadata, quality: QualityScore): QualityMetadata {
    return {
      ...existing,
      qualityScore: {
        overall: quality.overall,
        accuracy: quality.breakdown.accuracy || existing.qualityScore.accuracy,
        completeness: quality.breakdown.completeness || existing.qualityScore.completeness,
        relevance: quality.breakdown.relevance || existing.qualityScore.relevance,
        clarity: quality.breakdown.clarity || existing.qualityScore.clarity,
        maintainability: quality.breakdown.maintainability || existing.qualityScore.maintainability,
        performance: quality.breakdown.performance || existing.qualityScore.performance,
      },
      standards: {
        ...existing.standards,
        currentStatus:
          quality.overall >= 90
            ? 'exceeds-target'
            : quality.overall >= 80
              ? 'meets-target'
              : quality.overall >= 60
                ? 'meets-minimum'
                : 'below-minimum',
        improvementSuggestions: quality.improvements,
      },
    };
  }

  private mergeSemanticMetadata(
    existing: SemanticMetadata,
    enhancements: Partial<SemanticMetadata>,
  ): SemanticMetadata {
    return {
      ...existing,
      ...enhancements,
      semanticTags: {
        ...existing.semanticTags,
        ...enhancements.semanticTags,
      },
    };
  }
}

// =====================================
// SUPPORTING SERVICE INTERFACES
// =====================================

export interface ConstitutionalValidator {
  validate<T extends AnyMetadata>(metadata: T): Promise<ConstitutionalValidationResult>;
}

export interface QualityScorer {
  score<T extends AnyMetadata>(metadata: T): Promise<QualityScore>;
}

export interface SemanticAnalyzer {
  analyze<T extends AnyMetadata>(metadata: T): Promise<Partial<SemanticMetadata>>;
  similarity(query: string, metadata: AnyMetadata): Promise<number>;
}

export interface SyncManager {
  sync(systemId: string, metadataId: string): Promise<SyncResult>;
  bulkSync(systemId: string, metadataIds: string[]): Promise<SyncResult[]>;
  triggerSync(metadataId: string): Promise<void>;
}

/**
 * This metadata repository provides:
 *
 * 1. **Complete CRUD Operations**: Full metadata lifecycle management
 * 2. **Advanced Querying**: Type-safe queries with multiple filter options
 * 3. **Semantic Search**: AI-powered search with relevance scoring
 * 4. **Relationship Management**: Connect related metadata intelligently
 * 5. **Quality Assurance**: Automatic quality scoring and validation
 * 6. **Constitutional AI**: Built-in compliance checking and enhancement
 * 7. **Cross-System Sync**: Unified synchronization across OneAgent systems
 * 8. **Performance Optimization**: Efficient indexing and caching strategies
 *
 * The repository serves as the central hub for all metadata operations,
 * ensuring consistency, quality, and intelligence across the entire
 * OneAgent ecosystem.
 */
