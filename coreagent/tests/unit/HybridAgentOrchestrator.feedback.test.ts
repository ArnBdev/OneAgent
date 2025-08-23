import { HybridAgentOrchestrator } from '../../agents/orchestration/HybridAgentOrchestrator';
import { feedbackService } from '../../services/FeedbackService';

jest.mock('../../services/FeedbackService', () => {
  return {
    feedbackService: { save: jest.fn().mockResolvedValue(undefined) },
  };
});

describe('HybridAgentOrchestrator.recordFeedback', () => {
  it('delegates to FeedbackService.save with proper payload', async () => {
    const orch = new HybridAgentOrchestrator();
    await orch.recordFeedback('task_abc', 'bad', 'Needs correction');

    expect(feedbackService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task_abc',
        userRating: 'bad',
        correction: 'Needs correction',
      }),
    );
  });
});
