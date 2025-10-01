/**
 * AlitaAgent v1.0 (User Story 3.3 - Skeleton)
 *
 * Purpose: Periodically analyze Metrics + Feedback (correlated via taskId)
 * and propose a single, concrete Constitution (.spec.md) improvement via PR.
 *
 * Phase 1 (this commit):
 * - Class skeleton aligned with OneAgent conventions
 * - Core reflection entrypoint and meta-prompt design
 * - No GitOps/PR actions yet (planned in follow-ups)
 */

import {
  BaseAgent,
  type AgentConfig,
  type AgentAction,
  type AgentResponse,
  type AgentContext,
} from '../base/BaseAgent';
import type { ISpecializedAgent } from '../base/ISpecializedAgent';
import type { PromptConfig } from '../base/PromptEngine';
import { createUnifiedTimestamp, generateUnifiedId } from '../../utils/UnifiedBackboneService';
import type { FeedbackRecord } from '../../types/oneagent-backbone-types';
import type { MetricLog } from '../../services/MetricsService';
import { OneAgentMemory } from '../../memory/OneAgentMemory';
import { getOneAgentMemory } from '../../utils/UnifiedBackboneService';
import { getModelFor } from '../../config/UnifiedModelPicker';
import { simpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';

// Lightweight consolidated log view used by the prompt builder
export type ExperienceEntry = {
  taskId: string;
  rating?: FeedbackRecord['userRating'];
  correction?: string;
  metric?: Pick<
    MetricLog,
    'query' | 'latencyMs' | 'vectorResultsCount' | 'graphResultsCount' | 'finalContextSize'
  >;
  note?: string; // optional human-readable summary
};

export class AlitaAgent extends BaseAgent implements ISpecializedAgent {
  private memory: OneAgentMemory;
  constructor(
    config?: Partial<AgentConfig>,
    promptConfig?: PromptConfig,
    opts: { memory?: OneAgentMemory } = {},
  ) {
    super(
      {
        id: config?.id || 'AlitaAgent',
        name: config?.name || 'ALITA – Adaptive Learning & Iterative Tuning Agent',
        description:
          config?.description ||
          'Analyzes experience logs (metrics + feedback) to propose targeted Constitution improvements.',
        capabilities: config?.capabilities || ['analysis', 'governance', 'self_improvement'],
        memoryEnabled: config?.memoryEnabled ?? true,
        aiEnabled: config?.aiEnabled ?? true,
        aiModelName: config?.aiModelName, // premium tier selection handled at call-site later
      },
      promptConfig,
    );
    this.memory = opts.memory || getOneAgentMemory();
  }

  get id(): string {
    return this.config.id;
  }

  async initialize(): Promise<void> {
    await super.initialize();
  }

  getAvailableActions(): AgentAction[] {
    return [
      {
        type: 'trigger_reflection',
        description: 'Run a reflection cycle over recent experience logs',
        parameters: { limit: 'number' },
      },
    ];
  }

  async executeAction(
    action: string | AgentAction,
    params: Record<string, unknown>,
    context?: AgentContext,
  ): Promise<AgentResponse> {
    const type = typeof action === 'string' ? action : action.type;
    if (type === 'trigger_reflection') {
      const limit = Number((params?.limit as number) ?? 50);
      const { taskId, prompt } = await this.execute(limit);
      // Store that a reflection was prepared (canonical signature)
      await this.memory.addMemory({
        content: `ALITA reflection initiated. taskId=${taskId} promptChars=${prompt.length}`,
        metadata: {
          type: 'alita_reflection_prepared',
          userId: (context?.user as { id?: string } | undefined)?.id || 'system',
        },
      });
      return this.createResponse(
        'Reflection cycle prepared (prompt ready for LLM analysis).',
        [],
        [],
      );
    }
    return super.executeAction(action, params, context);
  }

  /**
   * Entry point for the reflection cycle. Phase 1 returns prompt; later phases will
   * call premium LLM, stage a change, and open a PR via GitOps.
   */
  public async execute(limit: number = 50): Promise<{
    taskId: string;
    prompt: string;
    analysis?: string;
    targetFile?: string;
    suggestedChange?: string;
    reason?: string;
    prUrl?: string;
  }> {
    const taskId = generateUnifiedId('analysis', this.config.id);
    const entries = await this.getRecentExperienceEntries(limit);
    const prompt = this.buildMetaPrompt(entries);
    // Select premium reasoning model (capability-driven)
    const ai = getModelFor('advanced_text');

    // Call LLM for analysis → strict JSON
    let proposal: { analysis: string; targetFile: string; suggestedChange: string; reason: string };
    try {
      const resp = await ai.generateContent(prompt);
      const text = typeof resp === 'string' ? resp : resp.response || '';
      proposal = this.parseStrictJson(text);
    } catch (err) {
      // Store failure breadcrumb and return prompt only (canonical signature)
      await this.memory.addMemory({
        content: `ALITA LLM analysis failed: ${String(err)}`,
        metadata: { type: 'alita_llm_error', userId: this.config.id },
      });
      return { taskId, prompt };
    }

    // Create PR with suggested change
    let prUrl: string | undefined;
    try {
      await this.applyChangeToFile(proposal.targetFile, proposal.suggestedChange, taskId);
      prUrl = await this.createPullRequest({ taskId, ...proposal });
      await this.memory.addMemory({
        content: `ALITA opened PR: ${prUrl} for ${proposal.targetFile}`,
        metadata: {
          type: 'alita_pr_created',
          taskId,
          targetFile: proposal.targetFile,
          userId: this.config.id,
        },
      });
    } catch (err) {
      await this.memory.addMemory({
        content: `ALITA PR creation failed: ${String(err)}`,
        metadata: {
          type: 'alita_pr_error',
          taskId,
          targetFile: proposal.targetFile,
          userId: this.config.id,
        },
      });
    }

    return { taskId, prompt, ...proposal, prUrl };
  }

  /**
   * Gather recent combined experience entries from MetricsService + FeedbackService.
   * Phase 1 placeholder returns an empty set; follow-up patch will wire real services.
   */
  private async getRecentExperienceEntries(limit: number): Promise<ExperienceEntry[]> {
    // Query canonical memory for feedback + metrics persisted by services
    const memory = this.memory;
    const [feedbacksRaw, metricsRaw] = await Promise.all([
      memory.searchMemory({ query: 'feedback_record', userId: 'feedback', limit }),
      memory.searchMemory({ query: 'metrics_log', userId: 'default-user', limit: limit * 2 }),
    ]);

    type AnyRec = {
      content?: string;
      metadata?: { custom?: Record<string, unknown> } & Record<string, unknown>;
    };

    const feedbacks = (feedbacksRaw as AnyRec[])
      .map((r) => (r?.metadata?.custom?.feedback as FeedbackRecord) || null)
      .filter(Boolean) as FeedbackRecord[];
    const metrics = (metricsRaw as AnyRec[])
      .map((r) => (r?.metadata?.custom?.metricLog as MetricLog) || null)
      .filter(Boolean) as MetricLog[];

    const metricsByTask = new Map<string, MetricLog>();
    for (const m of metrics) metricsByTask.set(m.taskId, m);

    const entries: ExperienceEntry[] = feedbacks.map((f) => {
      const m = metricsByTask.get(f.taskId);
      const note = m
        ? `lat=${m.latencyMs}ms, vec=${m.vectorResultsCount}, graph=${m.graphResultsCount}, ctx=${m.finalContextSize}`
        : 'no_metrics_found';
      return {
        taskId: f.taskId,
        rating: f.userRating,
        correction: f.correction,
        metric: m
          ? {
              query: m.query,
              latencyMs: m.latencyMs,
              vectorResultsCount: m.vectorResultsCount,
              graphResultsCount: m.graphResultsCount,
              finalContextSize: m.finalContextSize,
            }
          : undefined,
        note,
      } as ExperienceEntry;
    });

    // Include metrics-only tasks without feedback (lower priority)
    for (const m of metrics) {
      if (!entries.some((e) => e.taskId === m.taskId)) {
        entries.push({
          taskId: m.taskId,
          metric: {
            query: m.query,
            latencyMs: m.latencyMs,
            vectorResultsCount: m.vectorResultsCount,
            graphResultsCount: m.graphResultsCount,
            finalContextSize: m.finalContextSize,
          },
          note: `lat=${m.latencyMs}ms, vec=${m.vectorResultsCount}, graph=${m.graphResultsCount}, ctx=${m.finalContextSize}`,
        });
      }
    }

    // Prioritize bad ratings, then recent by heuristic (feedbackRes already recent)
    const prioritized = entries.sort((a, b) => {
      const ar = a.rating === 'bad' ? 0 : a.rating === 'good' ? 1 : 2;
      const br = b.rating === 'bad' ? 0 : b.rating === 'good' ? 1 : 2;
      if (ar !== br) return ar - br;
      return 0;
    });

    return prioritized.slice(0, Math.max(1, limit));
  }

  /**
   * Meta-prompt for premium LLM (‘AI System Analyst’ role)
   * - Instructs model to identify one underlying pattern/root cause
   * - Propose a single, concrete Constitution rule change in a .spec.md file
   * - Enforce strict JSON output with required fields
   */
  private buildMetaPrompt(entries: ExperienceEntry[]): string {
    const ts = createUnifiedTimestamp();
    const header = `
SYSTEM ROLE: You are ALITA (Adaptive Learning & Iterative Tuning Analyst), an AI System Analyst.
MISSION: Analyze recent OneAgent experience logs (objective metrics + subjective feedback) and propose ONE precise
Constitution (.spec.md) rule improvement that would prevent similar failures in the future.
CONSTRAINTS:
- Return STRICT JSON only (no prose, no markdown) with exactly these keys:
  analysis, targetFile, suggestedChange, reason
- Focus on ONE underlying pattern or root cause and ONE concrete rule change.
- If insufficient evidence, infer the most impactful small change that reduces repeated failure risk.
CONTEXT:
- Timestamp: ${ts.iso}
- Entries: ${entries.length}
`;

    const examples = `
EXAMPLE OUTPUT FORMAT (strict JSON):
{
  "analysis": "Jeg observerer at flere søk relatert til 'finans' gir dårlige resultater fordi konteksten er for generell.",
  "targetFile": "specs/finance.spec.md",
  "suggestedChange": "Den eksisterende regelen 'Gi alltid et helhetlig bilde' bør endres til 'Prioriter alltid transaksjonsdata fra de siste 90 dager når spørsmålet gjelder nylig aktivitet.'",
  "reason": "Denne endringen vil tvinge agenten til å fokusere på mer relevant, tidsavgrenset data, noe som adresserer feedbacken i taskId X, Y og Z."
}
`;

    const material = entries
      .slice(0, 100)
      .map((e) => ({
        taskId: e.taskId,
        rating: e.rating,
        correction: e.correction,
        metrics: e.metric,
        note: e.note,
      }))
      .map((e) => JSON.stringify(e))
      .join('\n');

    const question = `
TASK:
1) Review the following EXPERIENCE LOGS (objective metrics + user feedback)\n${material}
2) Identify a single repeating pattern or root cause behind failures/low-quality outcomes.
3) Propose one concrete improvement to a rule in a single .spec.md file (targetFile) that prevents similar failures.
4) Explain briefly why this rule change addresses the observed pattern, referencing taskIds when helpful.

OUTPUT: Return ONLY strict JSON with keys: analysis, targetFile, suggestedChange, reason.
`;

    return [header.trim(), examples.trim(), question.trim()].join('\n\n');
  }

  // ==== Helpers: JSON parsing, file apply, PR creation ====
  private parseStrictJson(text: string): {
    analysis: string;
    targetFile: string;
    suggestedChange: string;
    reason: string;
  } {
    // Extract first {...} JSON block defensively
    const match = text.match(/\{[\s\S]*\}/);
    const raw = match ? match[0] : text;
    const parsed = JSON.parse(raw);
    const required = ['analysis', 'targetFile', 'suggestedChange', 'reason'] as const;
    for (const k of required) {
      if (typeof parsed[k] !== 'string' || !parsed[k].trim()) {
        throw new Error(`Invalid or missing key: ${k}`);
      }
    }
    return parsed as {
      analysis: string;
      targetFile: string;
      suggestedChange: string;
      reason: string;
    };
  }

  private async applyChangeToFile(targetFile: string, suggestedChange: string, taskId: string) {
    const abs = path.isAbsolute(targetFile)
      ? targetFile
      : path.join(process.cwd(), targetFile.replace(/^\/+/, ''));
    const dir = path.dirname(abs);
    await fs.mkdir(dir, { recursive: true });
    let prior = '';
    try {
      prior = await fs.readFile(abs, 'utf8');
    } catch {
      prior = '';
    }
    const ts = createUnifiedTimestamp().iso;
    const banner = `\n\n<!-- ALITA Proposed Update (${taskId}) @ ${ts} -->\n`;
    const updated = `${prior}${banner}${suggestedChange}\n`;
    await fs.writeFile(abs, updated, 'utf8');
  }

  private async createPullRequest(proposal: {
    taskId: string;
    analysis: string;
    targetFile: string;
    suggestedChange: string;
    reason: string;
  }): Promise<string | undefined> {
    const git = simpleGit();
    const isRepo = await git.checkIsRepo();
    if (!isRepo) throw new Error('Not a git repository');

    // Ensure branch
    const branchName = `alita/${proposal.taskId}`.replace(/[^a-zA-Z0-9_\-/]/g, '-');
    await git.checkoutLocalBranch(branchName);
    await git.add([proposal.targetFile]);
    await git.commit(`ALITA: Proposed rule update for ${proposal.targetFile}`);

    // Determine remote
    const remotes = await git.getRemotes(true);
    const origin = remotes.find((r) => r.name === 'origin') || remotes[0];
    if (!origin) throw new Error('No git remote found');
    await git.push(['-u', origin.name, branchName]);

    // Parse owner/repo from remote URL
    const repoUrl = (origin.refs.push || origin.refs.fetch) as string;
    const { owner, repo } = this.parseGithubRemote(repoUrl);
    const token = process.env.GITHUB_TOKEN || process.env.githubToken || '';
    if (!owner || !repo || !token) {
      throw new Error('Missing GitHub repo details or token');
    }

    // Pick base branch heuristic
    let base = 'main';
    try {
      const head = await git.revparse(['--abbrev-ref', 'origin/HEAD']);
      const m = head.match(/origin\/(.+)$/);
      if (m && m[1]) base = m[1];
    } catch {
      // fallback to main
    }

    // Create PR via GitHub REST
    const prTitle = `ALITA: ${proposal.analysis.substring(0, 64)}`;
    const prBody = `Reason: ${proposal.reason}\n\nTarget: ${proposal.targetFile}\nTask: ${proposal.taskId}`;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${token}`,
        'User-Agent': 'oneagent-alita',
      },
      body: JSON.stringify({ title: prTitle, head: branchName, base, body: prBody, draft: true }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PR creation failed: ${res.status} ${text}`);
    }
    const json = (await res.json()) as { html_url?: string } & Record<string, unknown>;
    return json.html_url as string | undefined;
  }

  private parseGithubRemote(url: string): { owner?: string; repo?: string } {
    // Supports git@github.com:owner/repo.git and https://github.com/owner/repo.git
    try {
      if (url.startsWith('git@')) {
        const m = url.match(/git@[^:]+:([^/]+)\/([^.]+)\.git/);
        if (m) return { owner: m[1], repo: m[2] };
      } else if (url.startsWith('https://') || url.startsWith('http://')) {
        const u = new URL(url);
        const parts = u.pathname
          .replace(/^\//, '')
          .replace(/\.git$/, '')
          .split('/');
        if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
      }
    } catch {
      /* ignore */
    }
    return {};
  }

  /**
   * Optional message-based entry. Allows kicking off a reflection via chat flow (e.g., "run alita").
   */
  async processMessage(context: AgentContext, message: string): Promise<AgentResponse> {
    this.validateContext(context);
    if (message.toLowerCase().includes('reflect') || message.toLowerCase().includes('alita')) {
      const { prompt } = await this.execute(50);
      // Store prompt snapshot to memory for traceability
      await this.memory.addMemory({
        content: `ALITA reflection prepared at ${createUnifiedTimestamp().iso}. Prompt length=${prompt.length}`,
        metadata: { type: 'alita_reflection_prep', userId: context.user.id },
      });
      const base = this.createResponse('ALITA reflection prompt is ready.', [], []);
      return await this.finalizeResponseWithTaskDetection(message, base);
    }
    // Default to BaseAgent behavior
    const resp = await super.processMessage(context, message);
    return await this.finalizeResponseWithTaskDetection(message, resp);
  }
}
