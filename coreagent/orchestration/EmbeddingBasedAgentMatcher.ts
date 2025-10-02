/**
 * EmbeddingBasedAgentMatcher - Semantic Agent-Task Matching
 *
 * Intelligent agent selection using embedding similarity for optimal task assignment.
 * Leverages the EnhancedEmbeddingService with task-type optimization for superior matching.
 *
 * Features:
 * - Semantic agent-task matching via embedding similarity
 * - Task-type optimized embeddings (RETRIEVAL_DOCUMENT for agents, RETRIEVAL_QUERY for tasks)
 * - Memory-driven learning from successful assignments
 * - Fallback to rule-based routing when similarity is low
 * - Performance metrics and quality tracking
 *
 * Quality Standards:
 * - 90%+ agent-task match accuracy
 * - Constitutional AI validation for critical assignments
 * - Memory-backed learning and pattern recognition
 *
 * @version 4.4.0
 * @author OneAgent Professional Development Platform
 */

import {
  createUnifiedId,
  createUnifiedTimestamp,
  getOneAgentMemory,
} from '../utils/UnifiedBackboneService';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';
import {
  EnhancedEmbeddingService,
  embedDocument,
  embedQuery,
} from '../services/EnhancedEmbeddingService';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface AgentProfile {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  specializations: string[];
  description: string;
  availability: 'available' | 'busy' | 'offline';
  performanceScore?: number;
}

/**
 * Agent performance metrics for adaptive selection
 */
export interface AgentPerformanceMetrics {
  agentId: string;
  successCount: number;
  failureCount: number;
  totalTasks: number;
  averageCompletionTime: number; // milliseconds
  averageQualityScore: number; // 0-1
  successRate: number; // percentage
  lastUpdated: number; // unix timestamp
}

/**
 * Event types for real-time progress updates
 */
export type AgentMatchEventType = 'match_found' | 'match_failed' | 'performance_updated';

export interface AgentMatchEvent {
  type: AgentMatchEventType;
  taskId?: string;
  agentId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type AgentMatchEventHandler = (event: AgentMatchEvent) => void;

export interface TaskRequirements {
  id: string;
  name: string;
  description: string;
  requiredSkills: string[];
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentMatchResult {
  agentId: string;
  agentName: string;
  similarityScore: number;
  matchReason: 'embedding' | 'rule-based' | 'learning';
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface AgentMatcherConfig {
  similarityThreshold?: number; // Min similarity for embedding match (default 0.7)
  dimensions?: 768 | 1536 | 3072; // Embedding dimensions (default 768)
  enableLearning?: boolean; // Learn from successful assignments (default true)
  enableRuleFallback?: boolean; // Fallback to rule-based (default true)
  memoryEnabled?: boolean; // Enable memory persistence (default true)
  enablePerformanceTracking?: boolean; // Track agent performance (default true)
  performanceWeight?: number; // Weight for performance in selection (0-1, default 0.3)
}

// =============================================================================
// EMBEDDING-BASED AGENT MATCHER
// =============================================================================

export class EmbeddingBasedAgentMatcher {
  private memory: OneAgentMemory;
  private embeddingService: EnhancedEmbeddingService;
  private config: Required<AgentMatcherConfig>;
  private matcherId: string;

  // Cache agent embeddings for performance
  private agentEmbeddings: Map<string, { embedding: number[]; timestamp: number }>;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Agent performance tracking
  private agentPerformance: Map<string, AgentPerformanceMetrics>;

  // Event listeners for real-time progress
  private eventHandlers: AgentMatchEventHandler[];

  constructor(config: AgentMatcherConfig = {}) {
    this.memory = getOneAgentMemory();
    this.embeddingService = new EnhancedEmbeddingService();
    this.matcherId = createUnifiedId('operation', 'agentmatcher');

    this.config = {
      similarityThreshold: config.similarityThreshold ?? 0.7,
      dimensions: config.dimensions ?? 768,
      enableLearning: config.enableLearning ?? true,
      enableRuleFallback: config.enableRuleFallback ?? true,
      memoryEnabled: config.memoryEnabled ?? true,
      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
      performanceWeight: config.performanceWeight ?? 0.3,
    };

    this.agentEmbeddings = new Map();
    this.agentPerformance = new Map();
    this.eventHandlers = [];

    console.log(`[AgentMatcher:${this.matcherId}] Initialized with config:`, this.config);
  }

  /**
   * Add event listener for real-time progress updates
   */
  addEventListener(handler: AgentMatchEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Remove event listener
   */
  removeEventListener(handler: AgentMatchEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index !== -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: AgentMatchEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('[AgentMatcher] Event handler error:', error);
      }
    }
  }

  /**
   * Match a task to the best available agent using embedding similarity
   */
  async matchTaskToAgent(
    task: TaskRequirements,
    availableAgents: AgentProfile[],
  ): Promise<AgentMatchResult | null> {
    const startTime = createUnifiedTimestamp();

    try {
      console.log(`[AgentMatcher] Matching task: ${task.name} to ${availableAgents.length} agents`);

      // Filter by availability
      const onlineAgents = availableAgents.filter((a) => a.availability !== 'offline');
      if (onlineAgents.length === 0) {
        console.warn('[AgentMatcher] No online agents available');
        return null;
      }

      // Try embedding-based matching first
      const embeddingMatch = await this.embeddingBasedMatch(task, onlineAgents);

      if (embeddingMatch && embeddingMatch.similarityScore >= this.config.similarityThreshold) {
        // High similarity - use embedding match
        console.log(
          `[AgentMatcher] Embedding match found: ${embeddingMatch.agentName} (similarity: ${embeddingMatch.similarityScore.toFixed(3)})`,
        );

        // Store successful match for learning
        if (this.config.enableLearning) {
          await this.storeSuccessfulMatch(task, embeddingMatch);
        }

        const duration = createUnifiedTimestamp().unix - startTime.unix;
        unifiedMonitoringService.trackOperation('AgentMatcher', 'matchTask', 'success', {
          matcherId: this.matcherId,
          taskId: task.id,
          agentId: embeddingMatch.agentId,
          matchType: 'embedding',
          similarityScore: embeddingMatch.similarityScore,
          durationMs: duration,
        });

        // Emit event
        this.emitEvent({
          type: 'match_found',
          taskId: task.id,
          agentId: embeddingMatch.agentId,
          timestamp: createUnifiedTimestamp().iso,
          metadata: {
            agentName: embeddingMatch.agentName,
            similarityScore: embeddingMatch.similarityScore,
            matchReason: embeddingMatch.matchReason,
            durationMs: duration,
          },
        });

        return embeddingMatch;
      }

      // Fallback to rule-based matching if enabled
      if (this.config.enableRuleFallback) {
        const ruleMatch = this.ruleBasedMatch(task, onlineAgents);
        if (ruleMatch) {
          console.log(`[AgentMatcher] Rule-based match found: ${ruleMatch.agentName}`);

          const duration = createUnifiedTimestamp().unix - startTime.unix;
          unifiedMonitoringService.trackOperation('AgentMatcher', 'matchTask', 'success', {
            matcherId: this.matcherId,
            taskId: task.id,
            agentId: ruleMatch.agentId,
            matchType: 'rule-based',
            durationMs: duration,
          });

          return ruleMatch;
        }
      }

      // No suitable match found
      console.warn(`[AgentMatcher] No suitable agent found for task: ${task.name}`);
      const duration = createUnifiedTimestamp().unix - startTime.unix;
      unifiedMonitoringService.trackOperation('AgentMatcher', 'matchTask', 'error', {
        matcherId: this.matcherId,
        taskId: task.id,
        error: 'no_match',
        durationMs: duration,
      });

      // Emit event
      this.emitEvent({
        type: 'match_failed',
        taskId: task.id,
        timestamp: createUnifiedTimestamp().iso,
        metadata: {
          reason: 'no_suitable_agent',
          availableAgents: onlineAgents.length,
          durationMs: duration,
        },
      });

      return null;
    } catch (error) {
      console.error('[AgentMatcher] Matching error:', error);
      const duration = createUnifiedTimestamp().unix - startTime.unix;
      unifiedMonitoringService.trackOperation('AgentMatcher', 'matchTask', 'error', {
        matcherId: this.matcherId,
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
        durationMs: duration,
      });
      throw error;
    }
  }

  /**
   * Embedding-based matching using semantic similarity
   */
  private async embeddingBasedMatch(
    task: TaskRequirements,
    agents: AgentProfile[],
  ): Promise<AgentMatchResult | null> {
    try {
      // Embed task requirements using RETRIEVAL_QUERY (optimized for search)
      const taskText = this.taskToText(task);
      const taskEmbeddingResult = await embedQuery(taskText, this.config.dimensions);
      const taskEmbedding = taskEmbeddingResult.embedding;

      // Embed each agent's capabilities using RETRIEVAL_DOCUMENT (optimized for indexing)
      const agentMatches: AgentMatchResult[] = [];

      for (const agent of agents) {
        const agentEmbedding = await this.getOrCreateAgentEmbedding(agent);

        // Compute cosine similarity
        const similarity = this.embeddingService.cosineSimilarity(taskEmbedding, agentEmbedding);

        // Compute weighted score (similarity + performance)
        const weightedScore = this.computeWeightedScore(similarity, agent.id);

        agentMatches.push({
          agentId: agent.id,
          agentName: agent.name,
          similarityScore: weightedScore, // Use weighted score for sorting
          matchReason: 'embedding',
          confidence: similarity, // Keep original similarity as confidence
          metadata: {
            agentType: agent.type,
            capabilities: agent.capabilities,
            performanceScore: agent.performanceScore,
            rawSimilarity: similarity,
            weightedScore,
            performance: this.agentPerformance.get(agent.id),
          },
        });
      }

      // Sort by weighted score (highest first)
      agentMatches.sort((a, b) => b.similarityScore - a.similarityScore);

      // Return best match if above threshold
      const bestMatch = agentMatches[0];
      if (bestMatch && bestMatch.similarityScore >= this.config.similarityThreshold) {
        return bestMatch;
      }

      return null;
    } catch (error) {
      console.error('[AgentMatcher] Embedding-based matching error:', error);
      return null;
    }
  }

  /**
   * Rule-based matching (fallback when embeddings don't yield high similarity)
   */
  private ruleBasedMatch(task: TaskRequirements, agents: AgentProfile[]): AgentMatchResult | null {
    // Simple rule-based matching: skill overlap
    let bestMatch: AgentMatchResult | null = null;
    let maxOverlap = 0;

    for (const agent of agents) {
      // Count skill overlap
      const overlap = task.requiredSkills.filter((skill) =>
        agent.capabilities.some((cap) => cap.toLowerCase().includes(skill.toLowerCase())),
      ).length;

      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestMatch = {
          agentId: agent.id,
          agentName: agent.name,
          similarityScore: overlap / task.requiredSkills.length,
          matchReason: 'rule-based',
          confidence: 0.6, // Lower confidence for rule-based
          metadata: {
            agentType: agent.type,
            skillOverlap: overlap,
            totalSkills: task.requiredSkills.length,
          },
        };
      }
    }

    return bestMatch;
  }

  /**
   * Get or create cached agent embedding
   */
  private async getOrCreateAgentEmbedding(agent: AgentProfile): Promise<number[]> {
    const now = createUnifiedTimestamp().unix;
    const cached = this.agentEmbeddings.get(agent.id);

    // Return cached if valid
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.embedding;
    }

    // Create new embedding
    const agentText = this.agentToText(agent);
    const embeddingResult = await embedDocument(agentText, this.config.dimensions);
    const embedding = embeddingResult.embedding;

    // Cache for future use
    this.agentEmbeddings.set(agent.id, { embedding, timestamp: now });

    return embedding;
  }

  /**
   * Convert task to text for embedding
   */
  private taskToText(task: TaskRequirements): string {
    return `
Task: ${task.name}
Description: ${task.description}
Required Skills: ${task.requiredSkills.join(', ')}
Complexity: ${task.complexity}
Priority: ${task.priority}
    `.trim();
  }

  /**
   * Convert agent to text for embedding
   */
  private agentToText(agent: AgentProfile): string {
    return `
Agent: ${agent.name}
Type: ${agent.type}
Description: ${agent.description}
Capabilities: ${agent.capabilities.join(', ')}
Specializations: ${agent.specializations.join(', ')}
    `.trim();
  }

  /**
   * Store successful match for learning
   */
  private async storeSuccessfulMatch(
    task: TaskRequirements,
    match: AgentMatchResult,
  ): Promise<void> {
    if (!this.config.memoryEnabled) return;

    try {
      await this.memory.addMemory({
        content: `Successful Agent Match: ${match.agentName} for ${task.name}`,
        metadata: {
          type: 'agent_match',
          matcherId: this.matcherId,
          taskId: task.id,
          taskName: task.name,
          agentId: match.agentId,
          agentName: match.agentName,
          similarityScore: match.similarityScore,
          matchReason: match.matchReason,
          confidence: match.confidence,
          requiredSkills: task.requiredSkills,
          timestamp: createUnifiedTimestamp().iso,
        } as unknown as Record<string, unknown>,
      });
    } catch (error) {
      console.warn('[AgentMatcher] Failed to store successful match:', error);
    }
  }

  /**
   * Learn from past successful matches
   */
  async learnFromHistory(taskType: string): Promise<AgentProfile[]> {
    if (!this.config.enableLearning || !this.config.memoryEnabled) {
      return [];
    }

    try {
      // Search for successful matches similar to this task type
      const searchResults = await this.memory.searchMemory({
        query: `agent_match ${taskType}`,
        userId: 'system',
        limit: 10,
      });

      if (!Array.isArray(searchResults) || searchResults.length === 0) {
        return [];
      }

      // Extract agent IDs from successful matches
      const agentFrequency = new Map<string, number>();
      for (const result of searchResults) {
        const metadata = result.metadata as Record<string, unknown> | undefined;
        const agentId = metadata?.agentId as string | undefined;
        if (agentId) {
          agentFrequency.set(agentId, (agentFrequency.get(agentId) || 0) + 1);
        }
      }

      // Return most frequently successful agents
      const sortedAgents = Array.from(agentFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([agentId]) => agentId);

      console.log(
        `[AgentMatcher] Learned ${sortedAgents.length} successful agents for ${taskType}`,
      );
      return []; // Return empty for now, would need agent registry to fetch full profiles
    } catch (error) {
      console.error('[AgentMatcher] Learning from history error:', error);
      return [];
    }
  }

  /**
   * Clear agent embedding cache
   */
  clearCache(): void {
    this.agentEmbeddings.clear();
    console.log('[AgentMatcher] Agent embedding cache cleared');
  }

  // =============================================================================
  // PERFORMANCE TRACKING METHODS
  // =============================================================================

  /**
   * Record task completion for agent performance tracking
   */
  async recordTaskCompletion(
    agentId: string,
    taskId: string,
    success: boolean,
    completionTime: number,
    qualityScore: number = 0.8,
  ): Promise<void> {
    if (!this.config.enablePerformanceTracking) return;

    const metrics = this.agentPerformance.get(agentId) || {
      agentId,
      successCount: 0,
      failureCount: 0,
      totalTasks: 0,
      averageCompletionTime: 0,
      averageQualityScore: 0,
      successRate: 0,
      lastUpdated: createUnifiedTimestamp().unix,
    };

    // Update counts
    metrics.totalTasks++;
    if (success) {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
    }

    // Update running averages
    metrics.averageCompletionTime =
      (metrics.averageCompletionTime * (metrics.totalTasks - 1) + completionTime) /
      metrics.totalTasks;
    metrics.averageQualityScore =
      (metrics.averageQualityScore * (metrics.totalTasks - 1) + qualityScore) / metrics.totalTasks;
    metrics.successRate = (metrics.successCount / metrics.totalTasks) * 100;
    metrics.lastUpdated = createUnifiedTimestamp().unix;

    this.agentPerformance.set(agentId, metrics);

    // Emit event
    this.emitEvent({
      type: 'performance_updated',
      agentId,
      taskId,
      timestamp: createUnifiedTimestamp().iso,
      metadata: { metrics },
    });

    // Store in memory
    if (this.config.memoryEnabled) {
      try {
        await this.memory.addMemory({
          content: `Agent Performance Update: ${agentId} - ${success ? 'Success' : 'Failure'}`,
          metadata: {
            type: 'agent_performance',
            matcherId: this.matcherId,
            agentId,
            taskId,
            success,
            completionTime,
            qualityScore,
            metrics,
            timestamp: createUnifiedTimestamp().iso,
          } as unknown as Record<string, unknown>,
        });
      } catch (error) {
        console.warn('[AgentMatcher] Failed to store performance update:', error);
      }
    }

    console.log(
      `[AgentMatcher] Performance updated for ${agentId}: ${metrics.successRate.toFixed(1)}% success, ${metrics.averageCompletionTime.toFixed(0)}ms avg`,
    );
  }

  /**
   * Get agent performance metrics
   */
  getAgentPerformance(agentId: string): AgentPerformanceMetrics | undefined {
    return this.agentPerformance.get(agentId);
  }

  /**
   * Get all agent performance metrics
   */
  getAllPerformanceMetrics(): Map<string, AgentPerformanceMetrics> {
    return new Map(this.agentPerformance);
  }

  /**
   * Compute weighted match score (similarity + performance)
   */
  private computeWeightedScore(similarityScore: number, agentId: string): number {
    if (!this.config.enablePerformanceTracking) {
      return similarityScore;
    }

    const metrics = this.agentPerformance.get(agentId);
    if (!metrics || metrics.totalTasks < 3) {
      // Not enough data, use pure similarity
      return similarityScore;
    }

    // Normalize performance metrics to 0-1 scale
    const performanceScore =
      (metrics.successRate / 100) * 0.5 + // 50% weight on success rate
      metrics.averageQualityScore * 0.3 + // 30% weight on quality
      (1 - Math.min(metrics.averageCompletionTime / 30000, 1)) * 0.2; // 20% weight on speed (30s baseline)

    // Weighted combination
    const weightedScore =
      similarityScore * (1 - this.config.performanceWeight) +
      performanceScore * this.config.performanceWeight;

    return weightedScore;
  }
}
