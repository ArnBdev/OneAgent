import { OneAgentMemory } from '../memory/OneAgentMemory';
import { unifiedMetadataService, createUnifiedTimestamp } from '../utils/UnifiedBackboneService';
import type { FeedbackRecord } from '../types/oneagent-backbone-types';

/**
 * FeedbackService
 * Canonical singleton to persist user feedback correlated to task metrics.
 * Storage backend: OneAgentMemory (mem0) with metadata { type: 'feedback_record' }.
 */
export class FeedbackService {
  private static instance: FeedbackService | null = null;
  private memory = OneAgentMemory.getInstance();

  static getInstance(): FeedbackService {
    if (!FeedbackService.instance) FeedbackService.instance = new FeedbackService();
    return FeedbackService.instance;
  }

  /** Save a feedback record to canonical memory */
  async save(feedback: FeedbackRecord): Promise<void> {
    const ts = createUnifiedTimestamp();
    const meta = unifiedMetadataService.create('feedback_record', 'FeedbackService', {
      system: {
        source: 'FeedbackService',
        component: 'feedback',
        userId: 'feedback',
      },
      content: {
        category: 'feedback',
        tags: ['feedback', feedback.userRating, feedback.taskId],
        sensitivity: 'internal',
        relevanceScore: 0.2,
        contextDependency: 'session',
      },
      temporal: {
        created: ts,
        updated: ts,
        accessed: ts,
        contextSnapshot: {
          timeOfDay: ts.contextual.timeOfDay,
          dayOfWeek: new Date(ts.unix).toLocaleDateString(undefined, { weekday: 'long' }),
          businessContext: true,
          energyContext: ts.contextual.energyLevel,
        },
      },
    });
    // Persist minimal content + attach the feedback as custom data
    const summary = `Feedback ${feedback.userRating.toUpperCase()} for task ${feedback.taskId}${
      feedback.correction ? `: ${feedback.correction}` : ''
    }`;
    const metadata = { ...meta, custom: { feedback } } as Record<string, unknown>;
    await this.memory.addMemoryCanonical(summary, metadata, 'feedback');
  }
}

export const feedbackService = FeedbackService.getInstance();
