import { feedbackService } from '../../services/FeedbackService';
import { OneAgentMemory } from '../../memory/OneAgentMemory';
import type { FeedbackRecord } from '../../types/oneagent-backbone-types';

jest.mock('../../memory/OneAgentMemory', () => {
  const addMemoryCanonical = jest.fn().mockResolvedValue('mem_1');
  return {
    OneAgentMemory: {
      getInstance: jest.fn(() => ({ addMemoryCanonical })),
    },
  };
});

describe('FeedbackService', () => {
  it('saves feedback to memory with canonical metadata', async () => {
    const feedback: FeedbackRecord = {
      taskId: 'task_123',
      userRating: 'good',
      correction: 'Nice but include edge cases.',
      timestamp: new Date().toISOString(),
    };

    await feedbackService.save(feedback);

    const mem = OneAgentMemory.getInstance() as unknown as { addMemoryCanonical: jest.Mock };
    expect(mem.addMemoryCanonical).toHaveBeenCalled();
    const [summary, metadata, userId] = mem.addMemoryCanonical.mock.calls[0];
    expect(summary).toContain('Feedback GOOD for task task_123');
    expect(userId).toBe('feedback');
    expect(metadata.type || metadata?.content?.category).toBeDefined(); // metadata shape exists
  });
});
