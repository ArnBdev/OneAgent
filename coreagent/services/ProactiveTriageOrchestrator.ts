import { createUnifiedTimestamp, createUnifiedId } from '../utils/UnifiedBackboneService';
import { taskDelegationService } from './TaskDelegationService';
import { unifiedMonitoringService } from '../monitoring/UnifiedMonitoringService';
import { metricsService } from './MetricsService';
import { sloService } from '../monitoring/SLOService';
import { getModelFor } from '../config/UnifiedModelPicker';
import { OneAgentMemory } from '../memory/OneAgentMemory';
import { getOneAgentMemory } from '../utils/UnifiedBackboneService';

// Canonical Proactive Triage + Deep Analysis Orchestrator (merges prior ProactiveObserverService intent with future TriageAgent consolidation)
export interface ProactiveSnapshot {
  takenAt: string; // ISO
  stats: ReturnType<typeof metricsService.getStats>;
  operations: ReturnType<typeof unifiedMonitoringService.summarizeOperationMetrics>;
  slos: ReturnType<typeof sloService.getConfig> | null;
  recentErrorEvents: number;
  errorBudgetBurnHot: Array<{ operation: string; burnRate: number; remaining: number }>;
}

export interface TriageResult {
  id: string;
  timestamp: string;
  anomalySuspected: boolean;
  reasons: string[];
  snapshotHash: string;
  latencyConcern?: boolean;
  errorBudgetConcern?: boolean;
}

export interface DeepAnalysisResult {
  id: string;
  timestamp: string;
  summary: string;
  recommendedActions: string[];
  supportingFindings: string[];
  snapshotHash: string;
}

interface ProactiveConfig {
  intervalMs: number;
  jitterRatio: number;
  errorBudgetBurnThreshold: number;
  latencyP95Multiplier: number;
  alwaysDeepAnalyze: boolean;
  memoryPersistence: boolean;
}

export class ProactiveTriageOrchestrator {
  private static instance: ProactiveTriageOrchestrator | null = null;
  private config: ProactiveConfig;
  private timer?: NodeJS.Timeout;
  private running = false;
  private lastSnapshotHash: string | null = null;
  private lastSnapshot: ProactiveSnapshot | null = null;
  private lastTriage: TriageResult | null = null;
  private lastDeep: DeepAnalysisResult | null = null;
  private memory: OneAgentMemory;

  static getInstance(
    cfg?: Partial<ProactiveConfig>,
    memory?: OneAgentMemory,
  ): ProactiveTriageOrchestrator {
    if (!ProactiveTriageOrchestrator.instance) {
      ProactiveTriageOrchestrator.instance = new ProactiveTriageOrchestrator(cfg, memory);
      // Register deep analysis provider with task delegation service (decoupled, avoids circular import usage back)
      taskDelegationService.registerDeepAnalysisProvider(
        () => ProactiveTriageOrchestrator.instance?.getLastDeepAnalysis() || null,
      );
    }
    return ProactiveTriageOrchestrator.instance;
  }

  private constructor(cfg?: Partial<ProactiveConfig>, memory?: OneAgentMemory) {
    this.config = {
      intervalMs: parseInt(process.env.ONEAGENT_PROACTIVE_INTERVAL_MS || '45000', 10) || 45000,
      jitterRatio: 0.25,
      errorBudgetBurnThreshold: 1.2,
      latencyP95Multiplier: 1.5,
      alwaysDeepAnalyze: process.env.ONEAGENT_PROACTIVE_DEEP_ANALYSIS === '1',
      memoryPersistence: process.env.ONEAGENT_PROACTIVE_MEMORY === '1',
      ...(cfg || {}),
    };
    this.memory = memory || getOneAgentMemory();
  }

  start(): void {
    if (this.timer) return;
    const schedule = () => {
      // Use canonical IdType ('operation') for jitter seed
      const jitterSeed =
        parseInt(createUnifiedId('operation', 'proactive').slice(-6), 16) / 0xffffff;
      const jitter = this.config.intervalMs * this.config.jitterRatio * jitterSeed;
      const delay = this.config.intervalMs + jitter;
      this.timer = setTimeout(async () => {
        try {
          await this.runObservationCycle();
        } catch (err) {
          unifiedMonitoringService.trackOperation(
            'ProactiveObserver',
            'observation_cycle',
            'error',
            {
              error: (err as Error).message,
            },
          );
        } finally {
          schedule();
        }
      }, delay);
      this.timer.unref?.();
    };
    schedule();
    unifiedMonitoringService.trackOperation('ProactiveObserver', 'start', 'success', {
      intervalMs: this.config.intervalMs,
    });
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    unifiedMonitoringService.trackOperation('ProactiveObserver', 'stop', 'success');
  }

  async runObservationCycle(): Promise<{ triage: TriageResult; deep?: DeepAnalysisResult | null }> {
    if (this.running) {
      return {
        triage: {
          id: createUnifiedId('analysis', 'cycle'),
          timestamp: createUnifiedTimestamp().iso,
          anomalySuspected: false,
          reasons: ['cycle_already_running'],
          snapshotHash: this.lastSnapshotHash || 'none',
        },
        deep: null,
      };
    }
    this.running = true;
    const start = createUnifiedTimestamp().unix;
    try {
      const snapshot = await this.buildSnapshot();
      const triage = await this.performTriage(snapshot);
      let deep: DeepAnalysisResult | null = null;
      const needDeep =
        this.config.alwaysDeepAnalyze ||
        (triage.anomalySuspected && triage.snapshotHash !== this.lastSnapshotHash);
      if (needDeep) {
        deep = await this.performDeepAnalysis(snapshot, triage);
        if (deep) this.lastSnapshotHash = deep.snapshotHash;
        const autoDelegate = process.env.ONEAGENT_PROACTIVE_AUTO_DELEGATE !== '0';
        if (
          deep &&
          autoDelegate &&
          Array.isArray(deep.recommendedActions) &&
          deep.recommendedActions.length > 0
        ) {
          try {
            await taskDelegationService.harvestAndQueue();
          } catch {
            /* swallow delegation errors */
          }
        }
      }
      unifiedMonitoringService.trackOperation('ProactiveObserver', 'observation_cycle', 'success', {
        durationMs: createUnifiedTimestamp().unix - start,
        anomaly: triage.anomalySuspected,
        deep: !!deep,
      });
      return { triage, deep };
    } catch (err) {
      unifiedMonitoringService.trackOperation('ProactiveObserver', 'observation_cycle', 'error', {
        durationMs: createUnifiedTimestamp().unix - start,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    } finally {
      this.running = false;
    }
  }

  private async buildSnapshot(): Promise<ProactiveSnapshot> {
    if (!sloService.getConfig()) {
      try {
        sloService.load();
      } catch {
        /* ignore */
      }
    }
    const stats = metricsService.getStats();
    const operations = unifiedMonitoringService.summarizeOperationMetrics({
      window: 5 * 60 * 1000,
    });
    const slos = sloService.getConfig();
    const recentEvents = unifiedMonitoringService.getRecentEvents(200);
    const errorEvents = recentEvents.filter(
      (e) =>
        (e.data.status === 'error' || e.severity === 'error' || e.severity === 'critical') &&
        (e.data.operation || e.data.op),
    );
    const errorBudgetBurnHot: Array<{ operation: string; burnRate: number; remaining: number }> =
      [];
    if (slos) {
      const observedErrorByOp: Record<string, { error: number; total: number }> = {};
      Object.values(operations.components).forEach((comp) => {
        Object.entries(comp.operations).forEach(([operation, rec]) => {
          if (!observedErrorByOp[operation]) observedErrorByOp[operation] = { error: 0, total: 0 };
          observedErrorByOp[operation].error += rec.error;
          observedErrorByOp[operation].total += rec.total;
        });
      });
      for (const svc of slos.services) {
        for (const obj of svc.objectives) {
          if (obj.target.errorRate && obj.target.errorRate > 0) {
            const observed = observedErrorByOp[obj.operation];
            if (observed && observed.total > 0) {
              const observedRate = observed.error / observed.total;
              const burnRate = observedRate / obj.target.errorRate;
              const remaining = Math.max(0, 1 - burnRate);
              if (burnRate >= this.config.errorBudgetBurnThreshold) {
                errorBudgetBurnHot.push({ operation: obj.operation, burnRate, remaining });
              }
            }
          }
        }
      }
    }
    return {
      takenAt: createUnifiedTimestamp().iso,
      stats,
      operations,
      slos: slos || null,
      recentErrorEvents: errorEvents.length,
      errorBudgetBurnHot,
    };
  }

  private hashObject(obj: unknown): string {
    try {
      const json = JSON.stringify(obj);
      let h = 0;
      for (let i = 0; i < json.length; i++) h = (Math.imul(31, h) + json.charCodeAt(i)) | 0;
      return `h${(h >>> 0).toString(16)}`;
    } catch {
      return 'hash_err';
    }
  }

  private async performTriage(snapshot: ProactiveSnapshot): Promise<TriageResult> {
    const ts = createUnifiedTimestamp();
    const reasons: string[] = [];
    let anomaly = false;
    if (snapshot.errorBudgetBurnHot.length) {
      anomaly = true;
      reasons.push('error_budget_burn');
    }
    if (snapshot.recentErrorEvents > 3) {
      anomaly = true;
      reasons.push('elevated_error_events');
    }
    if (snapshot.stats.latency.p95 > snapshot.stats.latency.p50 * 3) {
      anomaly = true;
      reasons.push('latency_spike_ratio');
    }
    if (!anomaly) {
      try {
        const model = getModelFor('utility');
        const prompt = `You are a triage gate. Given a JSON snapshot decide if deep analysis is needed. Return ONLY yes or no.\nSnapshot:${JSON.stringify({ e: snapshot.recentErrorEvents, hot: snapshot.errorBudgetBurnHot, lat: snapshot.stats.latency })}`;
        const resp = await this.generateText(model, prompt);
        if (/yes/i.test(resp.trim())) {
          anomaly = true;
          reasons.push('model_triage_yes');
        }
      } catch {
        /* ignore */
      }
    }
    const triage: TriageResult = {
      id: createUnifiedId('analysis', 'triage'),
      timestamp: ts.iso,
      anomalySuspected: anomaly,
      reasons: reasons.length ? reasons : ['none'],
      snapshotHash: this.hashObject({
        e: snapshot.recentErrorEvents,
        ebh: snapshot.errorBudgetBurnHot,
        lat: snapshot.stats.latency,
      }),
      latencyConcern: reasons.includes('latency_spike_ratio'),
      errorBudgetConcern: reasons.includes('error_budget_burn'),
    };
    // persist last snapshot + triage early (before deep analysis)
    this.lastSnapshot = snapshot;
    this.lastTriage = triage;
    unifiedMonitoringService.trackOperation(
      'ProactiveObserver',
      'triage_scan',
      anomaly ? 'error' : 'success',
      { anomaly, reasons: triage.reasons.join(',') },
    );
    return triage;
  }

  private async performDeepAnalysis(
    snapshot: ProactiveSnapshot,
    triage: TriageResult,
  ): Promise<DeepAnalysisResult | null> {
    const ts = createUnifiedTimestamp();
    try {
      const model = getModelFor('agentic_reasoning');
      const prompt = `You are a senior reliability analyst. Analyze system snapshot + triage reasons. Provide JSON {summary, actions, findings}.\nTriageReasons:${triage.reasons.join(',')}\nSnapshot:${JSON.stringify({ latency: snapshot.stats.latency, errorBudgetHot: snapshot.errorBudgetBurnHot, ops: snapshot.operations.totalOperations, components: Object.keys(snapshot.operations.components).length, errEvents: snapshot.recentErrorEvents })}`;
      const raw = await this.generateText(model, prompt);
      let summary = 'Deep analysis unavailable';
      let actions: string[] = [];
      let findings: string[] = [];
      try {
        const parsed = JSON.parse(raw);
        summary = String(parsed.summary || summary).slice(0, 400);
        if (Array.isArray(parsed.actions)) actions = parsed.actions.slice(0, 5).map(String);
        if (Array.isArray(parsed.findings)) findings = parsed.findings.slice(0, 5).map(String);
      } catch {
        summary = raw.slice(0, 400);
      }
      const result: DeepAnalysisResult = {
        id: createUnifiedId('analysis', 'deep'),
        timestamp: ts.iso,
        summary,
        recommendedActions: actions,
        supportingFindings: findings,
        snapshotHash: triage.snapshotHash,
      };
      unifiedMonitoringService.trackOperation('ProactiveObserver', 'deep_analysis', 'success', {
        actions: result.recommendedActions.length,
      });
      if (this.config.memoryPersistence) {
        try {
          await this.memory.addMemory({
            content: `ProactiveAnalysis: ${result.summary}`,
            metadata: {
              type: 'proactive_analysis',
              triageReasons: triage.reasons,
              anomaly: triage.anomalySuspected,
              summary: result.summary,
              actions: result.recommendedActions,
              findings: result.supportingFindings,
            },
          });
        } catch {
          /* ignore */
        }
      }
      this.lastDeep = result;
      return result;
    } catch (err) {
      unifiedMonitoringService.trackOperation('ProactiveObserver', 'deep_analysis', 'error', {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  private async generateText(model: unknown, prompt: string): Promise<string> {
    const m = model as Record<string, unknown>;
    const tryCall = async (name: string) => {
      const fn = m[name];
      if (typeof fn === 'function') {
        const result = await (fn as (p: string) => unknown)(prompt);
        if (result && typeof result === 'object') {
          const r = result as { response?: string };
          if (typeof r.response === 'string') return r.response;
        }
        if (typeof result === 'string') return result;
      }
      return null;
    };
    for (const name of ['chat', 'generateContent', 'generate']) {
      try {
        const out = await tryCall(name);
        if (out) return out;
      } catch {
        /* ignore */
      }
    }
    throw new Error('No compatible text generation method found on model');
  }

  // Accessor APIs for other agents (e.g., TriageAgent) to consume proactive data
  getLastSnapshot(): ProactiveSnapshot | null {
    return this.lastSnapshot;
  }
  getLastTriage(): TriageResult | null {
    return this.lastTriage;
  }
  getLastDeepAnalysis(): DeepAnalysisResult | null {
    return this.lastDeep;
  }
}

export const proactiveObserverService = ProactiveTriageOrchestrator.getInstance();
