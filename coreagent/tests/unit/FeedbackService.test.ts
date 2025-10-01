import { FeedbackService } from '../../services/FeedbackService';
import { OneAgentMemory } from '../../memory/OneAgentMemory';
import type { FeedbackRecord } from '../../types/oneagent-backbone-types';

const addMemory = jest.fn().mockResolvedValue('mem_1');
const mockMemory = { addMemory } as unknown as OneAgentMemory;

describe('FeedbackService', () => {
  it('saves feedback to memory with canonical metadata', async () => {
    const feedback: FeedbackRecord = {
      taskId: 'task_123',
      userRating: 'good',
      correction: 'Nice but include edge cases.',
      timestamp: new Date().toISOString(),
    };

    // Create a FeedbackService instance with DI for memory
    // Canonical: Use direct instantiation for FeedbackService with DI
    const service = new FeedbackService(mockMemory);
    await service.save(feedback);

    expect(addMemory).toHaveBeenCalled();
    const [req] = addMemory.mock.calls[0];
    expect(req.content).toContain('Feedback GOOD for task task_123');
    expect(req.metadata.userId).toBe('feedback');
    expect(req.metadata.type || req.metadata?.content?.category).toBeDefined(); // metadata shape exists
  });
});
