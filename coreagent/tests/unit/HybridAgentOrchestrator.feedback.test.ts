import { HybridAgentOrchestrator } from '../../agents/orchestration/HybridAgentOrchestrator';
import { FeedbackService } from '../../services/FeedbackService';

jest.spyOn(FeedbackService.prototype, 'save').mockResolvedValue(undefined);

describe('HybridAgentOrchestrator.recordFeedback', () => {
  it('delegates to FeedbackService.save with proper payload', async () => {
    const orch = new HybridAgentOrchestrator();
    await orch.recordFeedback('task_abc', 'bad', 'Needs correction');

    expect(FeedbackService.prototype.save).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task_abc',
        userRating: 'bad',
        correction: 'Needs correction',
      }),
    );
  });
});
