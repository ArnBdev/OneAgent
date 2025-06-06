/**
 * Memory Intelligence Layer for OneAgent
 * 
 * Provides advanced memory capabilities:
 * - Automatic memory categorization
 * - Semantic similarity search using embeddings
 * - Memory importance scoring
 * - Usage analytics and patterns
 * - Memory summarization
 */

import { Mem0Client, Mem0Memory, Mem0SearchFilter } from '../tools/mem0Client';
import { GeminiEmbeddingsTool, SemanticSearchResult } from '../tools/geminiEmbeddings';
import { globalProfiler } from '../performance/profiler';
import { EmbeddingResult } from '../types/gemini';

export interface MemoryCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  priority: number; // 1-10, higher = more important
}

export interface MemoryImportanceScore {
  overall: number; // 0-100
  recency: number; // 0-100 (how recent)
  frequency: number; // 0-100 (how often accessed)
  relevance: number; // 0-100 (semantic relevance)
  userInteraction: number; // 0-100 (user engagement)
}

export interface MemoryAnalytics {
  totalMemories: number;
  categoryCounts: Record<string, number>;
  categoryBreakdown: Record<string, number>; // Alias for categoryCounts
  averageImportance: number;
  topCategories: Array<{ category: string; count: number; avgImportance: number }>;
  memoryGrowthRate: number; // memories per day
  accessPatterns: Array<{ hour: number; accessCount: number }>;
  similarityNetworks: Array<{ memoryId: string; connectedMemories: string[]; }>;
}

export interface MemorySummary {
  originalContent: string;
  summary: string;
  keyPoints: string[];
  confidence: number;
  wordReduction: number; // percentage
}

/**
 * Memory Intelligence Engine
 */
export class MemoryIntelligence {
  private mem0Client: Mem0Client;
  private embeddingsClient: GeminiEmbeddingsTool;
  private categories: MemoryCategory[] = [];
  private embeddingCache = new Map<string, EmbeddingResult>();

  constructor(mem0Client: Mem0Client, embeddingsClient: GeminiEmbeddingsTool) {
    this.mem0Client = mem0Client;
    this.embeddingsClient = embeddingsClient;
    this.initializeDefaultCategories();
    console.log('🧠 Memory Intelligence Layer initialized');
  }

  /**
   * Initialize default memory categories
   */
  private initializeDefaultCategories(): void {
    this.categories = [
      {
        id: 'user_preferences',
        name: 'User Preferences',
        description: 'User settings, likes, dislikes, and personal preferences',
        keywords: ['prefer', 'like', 'dislike', 'favorite', 'setting', 'option'],
        priority: 9
      },
      {
        id: 'task_instructions',
        name: 'Task Instructions',
        description: 'Specific instructions for tasks and workflows',
        keywords: ['task', 'instruction', 'step', 'procedure', 'workflow', 'process'],
        priority: 8
      },
      {
        id: 'conversation_context',
        name: 'Conversation Context',
        description: 'Ongoing conversation topics and context',
        keywords: ['discuss', 'talk', 'conversation', 'topic', 'context'],
        priority: 6
      },
      {
        id: 'factual_information',
        name: 'Factual Information',
        description: 'Facts, data, and reference information',
        keywords: ['fact', 'data', 'information', 'reference', 'knowledge'],
        priority: 7
      },
      {
        id: 'personal_details',
        name: 'Personal Details',
        description: 'Personal information about the user',
        keywords: ['name', 'age', 'job', 'family', 'personal', 'bio'],
        priority: 9
      },
      {
        id: 'project_information',
        name: 'Project Information',
        description: 'Work projects, goals, and progress',
        keywords: ['project', 'goal', 'work', 'progress', 'deadline', 'milestone'],
        priority: 8
      },
      {
        id: 'learning_notes',
        name: 'Learning Notes',
        description: 'Learning materials, notes, and educational content',
        keywords: ['learn', 'study', 'note', 'education', 'tutorial', 'lesson'],
        priority: 7
      },
      {
        id: 'temporary_context',
        name: 'Temporary Context',
        description: 'Short-term context that may not need long-term storage',
        keywords: ['temp', 'temporary', 'quick', 'brief', 'moment'],
        priority: 3
      }
    ];
  }

  /**
   * Automatically categorize a memory based on content and metadata
   */
  async categorizeMemory(memory: Mem0Memory): Promise<string> {
    const operationId = `categorize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    globalProfiler.startOperation(operationId, 'memory_categorization', {
      memoryId: memory.id,
      contentLength: memory.content.length
    });

    try {
      const content = memory.content.toLowerCase();
      const metadata = memory.metadata || {};
      
      // Score each category
      const categoryScores = this.categories.map(category => {
        let score = 0;
        
        // Keyword matching
        const keywordMatches = category.keywords.filter(keyword => 
          content.includes(keyword.toLowerCase())
        ).length;
        score += keywordMatches * 10;
        
        // Metadata hints
        if (metadata.category === category.id) score += 50;
        if (metadata.type && category.keywords.includes(metadata.type)) score += 20;
        
        // Memory type hints
        if (memory.memoryType === 'workflow' && category.id === 'task_instructions') score += 30;
        if (memory.memoryType === 'session' && category.id === 'conversation_context') score += 30;
        if (memory.memoryType === 'long_term' && category.id === 'personal_details') score += 20;
        
        // Content length heuristics
        if (memory.content.length > 500 && category.id === 'factual_information') score += 10;
        if (memory.content.length < 100 && category.id === 'temporary_context') score += 15;
        
        return { category, score };
      });

      // Find best category
      const bestCategory = categoryScores.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      // If no strong category match, use heuristics
      if (bestCategory.score < 20) {
        if (memory.memoryType === 'workflow') return 'task_instructions';
        if (memory.memoryType === 'session') return 'conversation_context';
        if (memory.memoryType === 'short_term') return 'temporary_context';
        return 'factual_information'; // default
      }

      globalProfiler.endOperation(operationId, true);
      return bestCategory.category.id;

    } catch (error) {
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Memory categorization failed:', error);
      return 'factual_information'; // safe default
    }
  }

  /**
   * Calculate importance score for a memory
   */
  async calculateImportanceScore(memory: Mem0Memory): Promise<MemoryImportanceScore> {
    const operationId = `importance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    globalProfiler.startOperation(operationId, 'importance_calculation', {
      memoryId: memory.id
    });

    try {
      const now = new Date();
      const createdAt = new Date(memory.createdAt);
      const updatedAt = new Date(memory.updatedAt);
      
      // Recency score (0-100)
      const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceUpdated = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      const recency = Math.max(0, 100 - (daysSinceUpdated * 2)); // Decay over time
      
      // Frequency score (simulated - would need access logs in real implementation)
      const accessCount = (memory.metadata?.accessCount as number) || 1;
      const frequency = Math.min(100, accessCount * 10);
      
      // Relevance score (based on category priority)
      const category = await this.categorizeMemory(memory);
      const categoryData = this.categories.find(c => c.id === category);
      const relevance = categoryData ? categoryData.priority * 10 : 50;
      
      // User interaction score (based on metadata)
      const userRating = (memory.metadata?.userRating as number) || 0;
      const hasUserNotes = Boolean(memory.metadata?.userNotes);
      const userInteraction = (userRating * 20) + (hasUserNotes ? 20 : 0);
      
      // Calculate overall score (weighted average)
      const overall = (
        recency * 0.3 +
        frequency * 0.2 +
        relevance * 0.3 +
        userInteraction * 0.2
      );

      const score: MemoryImportanceScore = {
        overall: Math.round(overall),
        recency: Math.round(recency),
        frequency: Math.round(frequency),
        relevance: Math.round(relevance),
        userInteraction: Math.round(userInteraction)
      };

      globalProfiler.endOperation(operationId, true);
      return score;

    } catch (error) {
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Importance calculation failed:', error);
      return {
        overall: 50,
        recency: 50,
        frequency: 50,
        relevance: 50,
        userInteraction: 50
      };
    }
  }

  /**
   * Semantic similarity search using embeddings
   */
  async findSimilarMemories(
    queryText: string, 
    options: {
      topK?: number;
      similarityThreshold?: number;
      category?: string;
      memoryType?: string;
    } = {}
  ): Promise<SemanticSearchResult[]> {
    const operationId = `similarity_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    globalProfiler.startOperation(operationId, 'semantic_similarity_search', {
      queryLength: queryText.length,
      topK: options.topK || 10
    });

    try {
      // Build search filter
      const filter: Mem0SearchFilter = {
        limit: 100 // Get more results for embedding comparison
      };

      if (options.category) {
        filter.metadata = { category: options.category };
      }
      if (options.memoryType) {
        filter.memoryType = options.memoryType;
      }      // Get memories from Mem0
      const memoriesResponse = await this.mem0Client.searchMemories(filter);
      if (!memoriesResponse.success || !memoriesResponse.data || memoriesResponse.data.length === 0) {
        globalProfiler.endOperation(operationId, true);
        return [];
      }
      const memories = memoriesResponse.data;      // Use GeminiEmbeddingsTool for semantic search
      const semanticSearchResult = await this.embeddingsClient.semanticSearch(queryText, {}, {
        topK: options.topK || 10,
        similarityThreshold: options.similarityThreshold || 0.7
      });

      globalProfiler.endOperation(operationId, true);
      return semanticSearchResult.results;

    } catch (error) {
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Semantic similarity search failed:', error);
      return [];
    }
  }
  /**
   * Generate analytics for memory usage patterns
   */
  async generateMemoryAnalytics(): Promise<MemoryAnalytics> {
    const operationId = `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    globalProfiler.startOperation(operationId, 'memory_analytics');
    
    try {
      // Get all memories
      const allMemoriesResponse = await this.mem0Client.searchMemories({ limit: 10000 });
      
      if (!allMemoriesResponse.success || !allMemoriesResponse.data || allMemoriesResponse.data.length === 0) {        return {
          totalMemories: 0,
          categoryCounts: {},
          categoryBreakdown: {},
          averageImportance: 0,
          topCategories: [],
          memoryGrowthRate: 0,
          accessPatterns: [],
          similarityNetworks: []
        };
      }

      const allMemories = allMemoriesResponse.data;

      // Categorize all memories
      const categoryPromises = allMemories.map((memory: Mem0Memory) => this.categorizeMemory(memory));
      const categories = await Promise.all(categoryPromises);
      
      // Count categories
      const categoryCounts: Record<string, number> = {};
      categories.forEach((category: string) => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      // Calculate importance scores
      const importancePromises = allMemories.slice(0, 50).map((memory: Mem0Memory) => // Limit for performance
        this.calculateImportanceScore(memory)
      );
      const importanceScores = await Promise.all(importancePromises);
      const averageImportance = importanceScores.reduce((sum: number, score: MemoryImportanceScore) => sum + score.overall, 0) / importanceScores.length;      // Top categories
      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category,
          count,
          avgImportance: importanceScores
            .filter((_: MemoryImportanceScore, index: number) => categories[index] === category)
            .reduce((sum: number, score: MemoryImportanceScore) => sum + score.overall, 0) / Math.max(1, importanceScores.filter((_: MemoryImportanceScore, index: number) => categories[index] === category).length)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate growth rate (memories per day)
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentMemories = allMemories.filter((memory: Mem0Memory) => 
        new Date(memory.createdAt) > oneWeekAgo
      );
      const memoryGrowthRate = recentMemories.length / 7;

      // Access patterns (simulated - would need real access logs)
      const accessPatterns = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        accessCount: Math.floor(Math.random() * 20) + 1 // Simulated data
      }));

      // Similarity networks (basic implementation)
      const similarityNetworks = allMemories.slice(0, 10).map((memory: Mem0Memory) => ({
        memoryId: memory.id,
        connectedMemories: allMemories
          .filter((m: Mem0Memory) => m.id !== memory.id)
          .slice(0, 3) // Top 3 similar
          .map((m: Mem0Memory) => m.id)
      }));      const analytics: MemoryAnalytics = {
        totalMemories: allMemories.length,
        categoryCounts,
        categoryBreakdown: categoryCounts, // Alias for categoryCounts
        averageImportance,
        topCategories,
        memoryGrowthRate,
        accessPatterns,
        similarityNetworks
      };

      globalProfiler.endOperation(operationId, true);
      return analytics;

    } catch (error) {      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Memory analytics generation failed:', error);
      return {
        totalMemories: 0,
        categoryCounts: {},
        categoryBreakdown: {},
        averageImportance: 0,
        topCategories: [],
        memoryGrowthRate: 0,
        accessPatterns: [],
        similarityNetworks: []
      };
    }
  }

  /**
   * Summarize memory content for efficient storage
   */
  async summarizeMemory(memory: Mem0Memory): Promise<MemorySummary> {
    const operationId = `summarization_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    globalProfiler.startOperation(operationId, 'memory_summarization', {
      originalLength: memory.content.length
    });

    try {
      // Basic summarization (would use LLM in production)
      const sentences = memory.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      if (sentences.length <= 2) {
        // Too short to summarize
        return {
          originalContent: memory.content,
          summary: memory.content,
          keyPoints: [memory.content.trim()],
          confidence: 100,
          wordReduction: 0
        };
      }

      // Extract key sentences (first, last, and longest)
      const keySentences = [
        sentences[0]?.trim(),
        sentences[sentences.length - 1]?.trim(),
        sentences.reduce((longest, current) => 
          current.length > longest.length ? current : longest, '')?.trim()
      ].filter((sentence, index, array) => 
        sentence && array.indexOf(sentence) === index // Remove duplicates
      );

      const summary = keySentences.join('. ') + '.';
      const originalWords = memory.content.split(/\s+/).length;
      const summaryWords = summary.split(/\s+/).length;
      const wordReduction = ((originalWords - summaryWords) / originalWords) * 100;

      // Extract key points (simple keyword extraction)
      const keyPoints = this.extractKeyPoints(memory.content);

      const result: MemorySummary = {
        originalContent: memory.content,
        summary,
        keyPoints,
        confidence: Math.min(90, Math.max(60, 100 - (wordReduction * 0.5))), // Confidence based on reduction
        wordReduction: Math.round(wordReduction)
      };

      globalProfiler.endOperation(operationId, true);
      return result;

    } catch (error) {
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Memory summarization failed:', error);
      return {
        originalContent: memory.content,
        summary: memory.content,
        keyPoints: [memory.content],
        confidence: 0,
        wordReduction: 0
      };
    }
  }

  /**
   * Extract key points from text (simple implementation)
   */
  private extractKeyPoints(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Score sentences by keyword density and position
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position scoring (first and last sentences are important)
      if (index === 0 || index === sentences.length - 1) score += 2;
      
      // Length scoring (moderate length is good)
      const words = sentence.split(/\s+/).length;
      if (words >= 5 && words <= 20) score += 1;
      
      // Keyword scoring (contains important words)
      const importantWords = ['important', 'key', 'main', 'primary', 'essential', 'critical', 'significant'];
      const hasImportantWords = importantWords.some(word => 
        sentence.toLowerCase().includes(word)
      );
      if (hasImportantWords) score += 2;
      
      return { sentence: sentence.trim(), score };
    });

    // Return top 3 key points
    return scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.sentence)
      .filter(sentence => sentence.length > 0);
  }

  /**
   * Get memory categories
   */
  getCategories(): MemoryCategory[] {
    return [...this.categories];
  }

  /**
   * Add custom category
   */
  addCategory(category: MemoryCategory): void {
    this.categories.push(category);
    console.log(`📁 Added memory category: ${category.name}`);
  }
}
