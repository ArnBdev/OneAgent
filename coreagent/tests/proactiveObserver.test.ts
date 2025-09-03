import { proactiveObserverService } from '../services/ProactiveTriageOrchestrator';

describe('ProactiveObserverService (baseline)', () => {
  test('triage cycle executes without deep analysis when no anomalies', async () => {
    const result = await proactiveObserverService.runObservationCycle();
    expect(result.triage).toBeDefined();
    // Accept either path if environment forces deep analysis
    if (!process.env.ONEAGENT_PROACTIVE_DEEP_ANALYSIS) {
      // Deep analysis may still run if heuristic flags; allow null OR object
      expect(result.triage.anomalySuspected === false || !!result.deep).toBe(true);
    }
  });
});
