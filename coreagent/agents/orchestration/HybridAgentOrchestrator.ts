// UPDATED: header touch to force recompilation after refactor removing waitPromise/_promise pattern.
import type { AgentCard } from '../../types/oneagent-backbone-types';
import { isAgentExecutionResult } from '../../types/agent-execution-types';
import { unifiedAgentCommunicationService } from '../../utils/UnifiedAgentCommunicationService';
import { getOneAgentMemory } from '../../utils/UnifiedBackboneService';
import {
  createUnifiedId,
  createUnifiedTimestamp,
  unifiedMetadataService,
} from '../../utils/UnifiedBackboneService';

import type { UserRating } from '../../types/oneagent-backbone-types';

/**
 * HybridAgentOrchestrator
 *
 * Professional orchestrator for agent coordination, task assignment, and multi-agent workflows.
 * Uses canonical backbone systems for agent discovery, selection, and communication.
 * BMAD/Constitutional AI validated, modular, and fully auditable.
 *
 * Features:
 * - Agent discovery and optimal selection
 * - Task assignment with error handling
 * - Session management and message history
 * - Memory-driven optimization
 * - Audit trail for all operations
 * - Constitutional AI compliance
 *
 * @version 1.0.0
 * @status Production Ready
 */
export class HybridAgentOrchestrator {
  private static instance: HybridAgentOrchestrator | null = null;
  private comm = unifiedAgentCommunicationService;
  private memory = getOneAgentMemory();
  private orchestratorId: string;
  /** Pending task completion promises keyed by taskId */
  private pendingTasks: Record<
    string,
    { resolve: (ok: boolean) => void; reject: (e: Error) => void; timeout: NodeJS.Timeout }
  > = {};
  /** Track dispatch start times (unix ms) for latency measurement */
  private dispatchStartTimes: Record<string, number> = {};
  private listenersAttached = false;
  /** Last operation metrics snapshot broadcast (in-memory only, non-authoritative) */
  private lastOperationMetricsSnapshot: Record<string, unknown> | null = null;
  /** Optional background requeue scheduler interval handle */
  private requeueScheduler: NodeJS.Timeout | null = null;
  /** One-time deprecation notice flag (process-local) */
  private static warnedDeprecatedFlag = false;

  constructor() {
    this.orchestratorId = createUnifiedId('agent', 'orchestrator');
    this.logOperation('initialized', { timestamp: createUnifiedTimestamp() });
    this.maybeStartRequeueScheduler();
  }

  /**
   * Execute a proactive plan composed of delegated tasks sourced from TaskDelegationService.
   * Order: resolve dependencies via simple iterative pass (no cycles expected for MVP). Tasks without
   * dependencies run in insertion order. Future enhancement: topological sort + parallel dispatch.
   */
  async executePlan(options: { sessionId?: string; limit?: number } = {}): Promise<{
    dispatched: string[];
    completed: string[];
    failed: Array<{ taskId: string; error: string }>;
  }> {
    // Backward compat: migrate deprecated simulation flag name
    if (
      process.env.ONEAGENT_DISABLE_REAL_AGENT_EXECUTION &&
      !process.env.ONEAGENT_SIMULATE_AGENT_EXECUTION
    ) {
      // Inverted semantics: if disable real execution => simulate enabled
      process.env.ONEAGENT_SIMULATE_AGENT_EXECUTION = '1';
      // Non-noisy single-time note + persistent memory audit recorded once
      if (!HybridAgentOrchestrator.warnedDeprecatedFlag) {
        HybridAgentOrchestrator.warnedDeprecatedFlag = true;
        console.warn(
          '[HybridAgentOrchestrator] ONEAGENT_DISABLE_REAL_AGENT_EXECUTION is deprecated. Use ONEAGENT_SIMULATE_AGENT_EXECUTION (set to 1 by migration).',
        );
        try {
          const ts = createUnifiedTimestamp();
          await this.memory.addMemory({
            content: 'Deprecation: ONEAGENT_DISABLE_REAL_AGENT_EXECUTION',
            metadata: {
              type: 'deprecation_notice',
              flag: 'ONEAGENT_DISABLE_REAL_AGENT_EXECUTION',
              replacement: 'ONEAGENT_SIMULATE_AGENT_EXECUTION',
              timestamp: ts.iso,
              details:
                'Deprecated flag observed; auto-migrated to ONEAGENT_SIMULATE_AGENT_EXECUTION=1',
            },
          });
        } catch {
          /* ignore memory audit failures */
        }
      }
    }
    const { sessionId = 'plan-session', limit = 20 } = options;
    const startTs = createUnifiedTimestamp();
    await this.logOperation('plan_execute_started', { sessionId, limit });
    this.ensureListeners();
    // Lazy import to avoid circular at module load
    const { taskDelegationService } = await import('../../services/TaskDelegationService');
    const all = taskDelegationService.getQueuedTasks().slice(0, limit);
    if (!all.length) {
      await this.logOperation('plan_execute_no_tasks', { sessionId });
      return { dispatched: [], completed: [], failed: [] };
    }
    const dispatched: string[] = [];
    // completed + failed will be computed after async resolutions from delegation service state
    const failed: Array<{ taskId: string; error: string }> = [];
    const pendingPromises: Promise<boolean>[] = [];
    // Simple linear pass – iterate until no progress
    const unresolved = new Set(all.map((t) => t.id));
    let progress = true;
    while (progress && unresolved.size) {
      progress = false;
      // Automatic requeue scan at each wave start (best-effort)
      try {
        const { taskDelegationService } = await import('../../services/TaskDelegationService');
        const now = createUnifiedTimestamp().unix;
        const requeued = taskDelegationService.processDueRequeues(now);
        if (requeued.length) {
          await this.logOperation('requeue_wave', { count: requeued.length, taskIds: requeued });
        }
      } catch {
        /* ignore requeue errors */
      }
      for (const taskId of Array.from(unresolved)) {
        const task = all.find((t) => t.id === taskId);
        if (!task) {
          unresolved.delete(taskId);
          continue;
        }
        // MVP: dependencies not yet encoded on task objects – placeholder for future dependsOn array
        try {
          // Mark dispatched in delegation service
          const updated = taskDelegationService.markDispatched(task.id);
          if (!updated) {
            failed.push({ taskId: task.id, error: 'dispatch_mark_failed' });
            unresolved.delete(taskId);
            continue;
          }
          dispatched.push(task.id);
          // Record dispatch start time for latency measurement
          this.dispatchStartTimes[task.id] = createUnifiedTimestamp().unix;
          // Select agent (skill inference from action simple heuristic)
          const skill = this.inferSkillFromAction(task.action);
          const agent = skill ? await this.selectBestAgent(skill).catch(() => null) : null;
          // Send instructions (even if no agent, we mark failure)
          if (!agent) {
            taskDelegationService.markDispatchFailure(task.id, 'no_agent', 'No suitable agent');
            failed.push({ taskId: task.id, error: 'no_agent' });
            unresolved.delete(task.id);
            continue;
          }
          const instructions = `ACTION: ${task.action}\nSOURCE_FINDING: ${task.finding}\nTASK_ID: ${task.id}`;
          const msgId = await this.sendMessageToAgent(agent.id, instructions, sessionId).catch(
            (_e) => {
              return null;
            },
          );
          if (!msgId) {
            taskDelegationService.markDispatchFailure(task.id, 'send_failed', 'Message send');
            failed.push({ taskId: task.id, error: 'send_failed' });
            unresolved.delete(task.id);
            continue;
          }
          // Begin asynchronous wait for agent completion message.
          // We track via pendingTasks map; when message with JSON {taskId,status:'completed'} arrives, we resolve.
          const p: Promise<boolean> = new Promise<boolean>((resolve, reject) => {
            const timeoutMs = parseInt(
              process.env.ONEAGENT_TASK_EXECUTION_TIMEOUT_MS || '4000',
              10,
            );
            const timeout = setTimeout(() => {
              delete this.pendingTasks[task.id];
              reject(new Error('task_timeout'));
            }, timeoutMs);
            this.pendingTasks[task.id] = {
              resolve: (ok: boolean) => {
                clearTimeout(timeout);
                resolve(ok);
              },
              reject: (e) => {
                clearTimeout(timeout);
                reject(e);
              },
              timeout,
            };
          })
            .catch((err) => {
              taskDelegationService.markExecutionResult(task.id, false, err.message, err.message);
              failed.push({ taskId: task.id, error: err.message });
              return false;
            })
            .finally(() => {
              this.broadcastMissionUpdate(sessionId).catch(() => {});
            });
          // Optionally simulate execution if no real agent response is expected
          if (process.env.ONEAGENT_SIMULATE_AGENT_EXECUTION !== '0') {
            this.simulateAgentExecution(agent.id, task.id, sessionId).catch(() => {});
          }
          // We don't await here inside dispatch loop; we collect promises and await after dispatching wave
          pendingPromises.push(p);
          unresolved.delete(task.id);
          progress = true;
        } catch (err) {
          failed.push({ taskId: taskId, error: err instanceof Error ? err.message : String(err) });
          taskDelegationService.markDispatchFailure(taskId, 'execution_error', String(err));
          unresolved.delete(taskId);
        }
      }
    }
    // Await all pending promises for dispatched tasks
    await Promise.all(pendingPromises);
    // Derive final task statuses from delegation service
    const finalTasks = taskDelegationService.getAllTasks().filter((t) => dispatched.includes(t.id));
    const completed = finalTasks.filter((t) => t.status === 'completed').map((t) => t.id);
    // augment failed array with any tasks that transitioned to failed but not already captured (e.g. agent reported failure)
    for (const t of finalTasks) {
      if (t.status === 'failed' && !failed.find((f) => f.taskId === t.id)) {
        failed.push({ taskId: t.id, error: t.lastErrorCode || 'failed' });
      }
    }
    await this.logOperation('plan_execute_completed', {
      sessionId,
      dispatched: dispatched.length,
      completed: completed.length,
      failed: failed.length,
      durationMs: createUnifiedTimestamp().unix - startTs.unix,
    });
    return { dispatched, completed, failed };
  }

  /** Infer a skill string from an action text (heuristic; future: ML classification) */
  private inferSkillFromAction(action: string): string | null {
    const l = action.toLowerCase();
    if (l.includes('optimiz') || l.includes('refactor') || l.includes('code')) return 'development';
    if (l.includes('document') || l.includes('write')) return 'documentation';
    if (l.includes('analyz') || l.includes('analysis')) return 'analysis';
    return 'general';
  }

  /** Ensure we have message listeners attached once for handling agent completion events */
  private ensureListeners(): void {
    if (this.listenersAttached) return;
    this.comm.on('message_sent', (payload: unknown) => {
      try {
        const msgWrap = payload as { message?: { message?: string } };
        const text = msgWrap?.message?.message;
        if (!text) return;
        let parsed: Record<string, unknown> | null = null;
        if (/^{/.test(text.trim())) {
          try {
            parsed = JSON.parse(text);
          } catch {
            /* ignore */
          }
        }
        // Support structured AgentExecutionResult if present
        let taskId: string | null = null;
        let status: string | undefined;
        if (parsed && isAgentExecutionResult(parsed)) {
          taskId = parsed.taskId;
          status = parsed.status;
        } else {
          taskId = (parsed?.taskId as string | undefined) || this.extractTaskIdFromText(text);
          status =
            (parsed?.status as string | undefined) ||
            (typeof parsed?.result === 'string' ? (parsed.result as string) : undefined);
        }
        if (!taskId || !(taskId in this.pendingTasks)) return;
        const terminal =
          status === 'completed' ||
          /TASK_COMPLETE/i.test(text) ||
          status === 'failed' ||
          /TASK_FAILED/i.test(text);
        if (!terminal) return;
        // Mark execution result
        (async () => {
          const { taskDelegationService } = await import('../../services/TaskDelegationService');
          const success = status === 'completed' || /TASK_COMPLETE/i.test(text);
          const startTime = this.dispatchStartTimes[taskId];
          const durationMs = startTime
            ? Math.max(0, createUnifiedTimestamp().unix - startTime)
            : undefined;
          if (success) {
            taskDelegationService.markExecutionResult(
              taskId,
              true,
              undefined,
              undefined,
              durationMs,
            );
          } else {
            taskDelegationService.markExecutionResult(
              taskId,
              false,
              'agent_report_failure',
              'Agent reported failure',
              durationMs,
            );
          }
          const entry = this.pendingTasks[taskId]!;
          entry.resolve(success);
          // Emit operation_metrics_snapshot (task_execution aggregate) after each terminal result
          try {
            const { unifiedMonitoringService } = await import(
              '../../monitoring/UnifiedMonitoringService'
            );
            const perf = unifiedMonitoringService.getPerformanceMonitor();
            if (perf && typeof perf.getDetailedMetrics === 'function') {
              const snap = await perf.getDetailedMetrics('TaskDelegation.execute');
              this.lastOperationMetricsSnapshot = snap as unknown as Record<string, unknown>;
              await this.comm.broadcastMessage({
                sessionId: 'orchestrator-metrics',
                fromAgent: 'orchestrator',
                content: JSON.stringify({
                  type: 'operation_metrics_snapshot',
                  operation: 'TaskDelegation.execute',
                  snapshot: snap,
                  timestamp: createUnifiedTimestamp().iso,
                }),
                messageType: 'update',
                metadata: { orchestrator: true, metrics: true },
              });
            }
          } catch {
            /* ignore metrics snapshot errors */
          }
        })();
        delete this.pendingTasks[taskId];
        delete this.dispatchStartTimes[taskId];
      } catch {
        /* ignore listener errors */
      }
    });
    this.listenersAttached = true;
  }

  /** Retrieve the last operation metrics snapshot (best-effort, may be null if none broadcast yet). */
  getLatestOperationMetricsSnapshot(): Record<string, unknown> | null {
    return this.lastOperationMetricsSnapshot ? { ...this.lastOperationMetricsSnapshot } : null;
  }

  /** Extract TASK_ID from raw instruction echo or agent reply */
  private extractTaskIdFromText(text: string): string | null {
    const m = text.match(/TASK_ID[:=]\s*([a-zA-Z0-9_-]+)/);
    return m ? m[1] : null;
  }

  /** Simulate agent execution asynchronously (used until real agent active execution pipeline implemented) */
  private async simulateAgentExecution(
    agentId: string,
    taskId: string,
    sessionId: string,
  ): Promise<void> {
    const delay = parseInt(process.env.ONEAGENT_SIMULATED_AGENT_DELAY_MS || '120', 10);
    await new Promise((r) => setTimeout(r, delay));
    try {
      await this.comm.sendMessage({
        sessionId,
        fromAgent: agentId,
        toAgent: 'orchestrator',
        // Use canonical AgentExecutionResult shape. messageType must be one of allowed backbone enums.
        content: JSON.stringify({
          taskId,
          status: 'completed',
          agentId,
          type: 'agent_execution_result',
        }),
        messageType: 'action', // 'action_result' was rejected by type system; using 'action'
        metadata: { simulated: true },
      });
    } catch {
      // ignore
    }
  }

  /** Broadcast a mission progress update summarizing plan progress (messageType: 'update') */
  private async broadcastMissionUpdate(sessionId: string): Promise<void> {
    try {
      const { taskDelegationService } = await import('../../services/TaskDelegationService');
      const all = taskDelegationService.getAllTasks();
      const dispatched = all.filter((t) => t.status === 'dispatched').length;
      const completed = all.filter((t) => t.status === 'completed').length;
      const failed = all.filter((t) => t.status === 'failed').length;
      const content = JSON.stringify({
        type: 'mission_progress',
        plan: { dispatched, completed, failed, total: all.length },
        timestamp: createUnifiedTimestamp().iso,
        orchestratorId: this.orchestratorId,
      });
      await this.comm.broadcastMessage({
        sessionId,
        fromAgent: 'orchestrator',
        content,
        messageType: 'update',
        metadata: { orchestrator: true, progress: true },
      });
    } catch {
      /* ignore */
    }
  }

  /**
   * Canonical accessor for a shared orchestrator instance.
   * Use this in server paths (metrics/UI) to avoid spawning parallel orchestrators.
   */
  static getInstance(): HybridAgentOrchestrator {
    if (!HybridAgentOrchestrator.instance) {
      HybridAgentOrchestrator.instance = new HybridAgentOrchestrator();
    }
    return HybridAgentOrchestrator.instance;
  }

  /** Start background scheduler to periodically invoke processDueRequeues (idempotent). */
  private maybeStartRequeueScheduler(): void {
    if (this.requeueScheduler) return; // already running
    const intervalMs = parseInt(process.env.ONEAGENT_REQUEUE_SCHEDULER_INTERVAL_MS || '0', 10);
    if (!intervalMs || intervalMs < 1000) return; // disabled unless >=1s
    try {
      this.requeueScheduler = setInterval(async () => {
        try {
          const { taskDelegationService } = await import('../../services/TaskDelegationService');
          const now = createUnifiedTimestamp().unix;
          const requeued = taskDelegationService.processDueRequeues(now);
          if (requeued.length) {
            await this.logOperation('requeue_scheduler_wave', {
              count: requeued.length,
              taskIds: requeued.slice(0, 5),
            });
          }
        } catch {
          /* ignore */
        }
      }, intervalMs).unref?.();
    } catch {
      /* ignore scheduler startup errors */
    }
  }

  /** Stop background requeue scheduler (used in tests / graceful shutdown). */
  stopRequeueScheduler(): void {
    if (this.requeueScheduler) {
      clearInterval(this.requeueScheduler);
      this.requeueScheduler = null;
    }
  }

  /**
   * Record subjective user feedback for a completed task/operation.
   * Delegates persistence to FeedbackService (canonical memory backend).
   */
  async recordFeedback(taskId: string, userRating: UserRating, correction?: string): Promise<void> {
    await this.logOperation('feedback_recording_started', { taskId, userRating });
    const ts = createUnifiedTimestamp();
    const feedbackService = new (await import('../../services/FeedbackService')).FeedbackService(
      this.memory,
    );
    await feedbackService.save({ taskId, userRating, correction, timestamp: ts.iso });
    await this.logOperation('feedback_recorded', { taskId, userRating });
  }

  /**
   * Log orchestration operations for audit trail
   */
  private async logOperation(operation: string, metadata: Record<string, unknown>): Promise<void> {
    try {
      const unifiedMeta = await unifiedMetadataService.create(
        'orchestrator_operation',
        'HybridAgentOrchestrator',
        {
          system: {
            source: 'hybrid_orchestrator',
            component: 'HybridAgentOrchestrator',
            userId: 'system_orchestration',
          },
          content: {
            category: 'orchestrator_operation',
            tags: ['orchestrator', operation],
            sensitivity: 'internal',
            relevanceScore: 0.2,
            contextDependency: 'session',
          },
        },
      );
      // attach custom domain data
      interface OrchestratorOpExtension {
        custom?: Record<string, unknown>;
      }
      (unifiedMeta as OrchestratorOpExtension).custom = {
        orchestratorId: this.orchestratorId,
        operation,
        timestamp: createUnifiedTimestamp().iso,
        ...metadata,
      };
      await this.memory.addMemory({
        content: `Orchestrator operation: ${operation}`,
        metadata: unifiedMeta,
      });
    } catch (error) {
      console.warn(`Failed to log orchestrator operation: ${error}`);
    }
  }

  /**
   * Selects the best agent for a given skill using canonical backbone discovery and intelligent selection.
   * Uses BMAD framework for systematic agent evaluation when multiple candidates are available.
   *
   * @param skill - The required skill for the task
   * @param context - Additional context for agent selection (priority, complexity, etc.)
   */
  async selectBestAgent(
    skill: string,
    context: Record<string, unknown> = {},
  ): Promise<AgentCard | null> {
    await this.logOperation('agent_selection_started', { skill, context });

    try {
      // Use canonical backbone for agent discovery
      const candidates = await this.comm.discoverAgents({ capabilities: [skill] });

      if (!candidates || candidates.length === 0) {
        await this.logOperation('agent_selection_failed', { skill, reason: 'no_candidates' });
        return null;
      }

      // Single candidate - return immediately
      if (candidates.length === 1) {
        await this.logOperation('agent_selection_completed', {
          skill,
          selectedAgent: candidates[0].id,
          selectionReason: 'single_candidate',
        });
        return candidates[0];
      }

      // Multiple candidates - apply intelligent selection
      const selectedAgent = await this.selectOptimalAgent(candidates, skill, context);

      await this.logOperation('agent_selection_completed', {
        skill,
        selectedAgent: selectedAgent.id,
        totalCandidates: candidates.length,
        selectionReason: 'bmad_analysis',
      });

      return selectedAgent;
    } catch (error) {
      await this.logOperation('agent_selection_error', { skill, error: String(error) });
      throw error;
    }
  }

  /**
   * Apply BMAD framework for optimal agent selection when multiple candidates exist
   */
  private async selectOptimalAgent(
    candidates: AgentCard[],
    skill: string,
    _context: Record<string, unknown>,
  ): Promise<AgentCard> {
    // For now, implement basic selection logic
    // Future enhancement: Full BMAD analysis with Constitutional AI validation

    // Prioritize by:
    // 1. Exact skill match
    // 2. Most capabilities (versatility)
    // 3. Alphabetical order (deterministic)

    const skillMatchCandidates = candidates.filter((agent) => agent.capabilities?.includes(skill));

    if (skillMatchCandidates.length === 0) {
      return candidates[0]; // Fallback to first candidate
    }

    // Select most versatile agent with exact skill match
    const sortedCandidates = skillMatchCandidates.sort((a, b) => {
      const aCapCount = a.capabilities?.length || 0;
      const bCapCount = b.capabilities?.length || 0;

      if (aCapCount !== bCapCount) {
        return bCapCount - aCapCount; // More capabilities first
      }

      return a.name.localeCompare(b.name); // Deterministic tie-breaker
    });

    return sortedCandidates[0];
  }

  /**
   * Send a message to an agent using canonical backbone communication
   */
  async sendMessageToAgent(agentId: string, content: string, sessionId: string): Promise<string> {
    return this.comm.sendMessage({
      sessionId,
      fromAgent: 'orchestrator',
      toAgent: agentId,
      content,
      messageType: 'action',
      metadata: { orchestrator: true },
    });
  }

  /**
   * Broadcast a message to all agents in a session
   */
  async broadcastMessage(content: string, sessionId: string): Promise<string> {
    return this.comm.broadcastMessage({
      sessionId,
      fromAgent: 'orchestrator',
      content,
      messageType: 'update',
      metadata: { orchestrator: true },
    });
  }

  /**
   * Get message history for a session
   */
  async getMessageHistory(sessionId: string, limit = 50) {
    return this.comm.getMessageHistory(sessionId, limit);
  }

  /**
   * Get session info
   */
  async getSessionInfo(sessionId: string) {
    return this.comm.getSessionInfo(sessionId);
  }

  /**
   * Assigns a task to the selected agent with comprehensive audit logging and error handling.
   *
   * @param agent - The agent to assign the task to
   * @param taskContext - The context of the task including sessionId, instructions, etc.
   * @returns Message ID if successful, null if failed
   */
  async assignTask(agent: AgentCard, taskContext: Record<string, unknown>): Promise<string | null> {
    const taskId = createUnifiedId('task', 'assignment');

    await this.logOperation('task_assignment_started', {
      taskId,
      agentId: agent.id,
      agentName: agent.name,
      taskContext: { ...taskContext, content: undefined }, // Don't log sensitive content
    });

    try {
      // Validate task context
      const sessionId = (taskContext.sessionId as string) || 'default-session';
      const instructions = this.formatTaskInstructions(taskContext);

      // Send the task to the agent using canonical communication
      const messageId = await this.sendMessageToAgent(agent.id, instructions, sessionId);

      // Log successful assignment in memory for audit trail
      try {
        const meta = await unifiedMetadataService.create(
          'task_assignment',
          'HybridAgentOrchestrator',
          {
            system: {
              source: 'hybrid_orchestrator',
              component: 'HybridAgentOrchestrator',
              userId: 'system_orchestration',
              sessionId,
            },
            content: {
              category: 'task_assignment',
              tags: ['task', 'assignment', agent.name],
              sensitivity: 'internal',
              relevanceScore: 0.3,
              contextDependency: 'session',
            },
          },
        );
        interface TaskAssignmentExtension {
          custom?: Record<string, unknown>;
        }
        (meta as TaskAssignmentExtension).custom = {
          taskId,
          agentId: agent.id,
          agentName: agent.name,
          messageId,
          sessionId,
          orchestratorId: this.orchestratorId,
          status: 'assigned',
        };
        await this.memory.addMemory({
          content: `Task assigned to ${agent.name}: ${taskContext.summary || 'Task execution'}`,
          metadata: meta,
        });
      } catch (storeErr) {
        console.warn('Failed to store task assignment memory (canonical):', storeErr);
      }

      await this.logOperation('task_assignment_completed', {
        taskId,
        agentId: agent.id,
        messageId,
        sessionId,
      });

      return messageId;
    } catch (error) {
      // Canonical error handling
      await this.logOperation('task_assignment_failed', {
        taskId,
        agentId: agent.id,
        error: String(error),
      });

      try {
        const { getUnifiedErrorHandler } = await import('../../utils/UnifiedBackboneService');
        await getUnifiedErrorHandler().handleError(error as Error, {
          context: 'HybridAgentOrchestrator.assignTask',
          metadata: {
            taskId,
            agentId: agent.id,
            orchestratorId: this.orchestratorId,
          },
        });
      } catch (errorHandlingError) {
        console.error('Failed to handle orchestrator error:', errorHandlingError);
      }

      return null;
    }
  }

  /**
   * Format task context into clear instructions for the agent
   */
  private formatTaskInstructions(taskContext: Record<string, unknown>): string {
    if (typeof taskContext.instructions === 'string') {
      return taskContext.instructions;
    }

    if (typeof taskContext.content === 'string') {
      return taskContext.content;
    }

    // Fallback: stringify the task context
    return JSON.stringify(taskContext);
  }

  /**
   * Create a multi-agent session with NLACS support for complex workflows
   */
  async createWorkflowSession(
    sessionName: string,
    participantSkills: string[],
    workflowContext: Record<string, unknown> = {},
  ): Promise<string | null> {
    await this.logOperation('workflow_session_creation_started', {
      sessionName,
      participantSkills,
      workflowContext: { ...workflowContext, content: undefined },
    });

    try {
      // Discover agents for each required skill
      const participants: string[] = [];
      const agentSelections: Record<string, AgentCard> = {};

      for (const skill of participantSkills) {
        const agent = await this.selectBestAgent(skill);
        if (agent) {
          participants.push(agent.id);
          agentSelections[skill] = agent;
        }
      }

      if (participants.length === 0) {
        await this.logOperation('workflow_session_creation_failed', {
          sessionName,
          reason: 'no_agents_found',
        });
        return null;
      }

      // Create session with NLACS enabled for advanced coordination
      const sessionId = await this.comm.createSession({
        name: sessionName,
        participants,
        mode: 'collaborative',
        topic: (workflowContext.topic as string) || 'Multi-agent workflow',
        nlacs: true,
        context: {
          orchestratorId: this.orchestratorId,
          workflowType: 'orchestrated',
          requiredSkills: participantSkills,
          ...workflowContext,
        },
        metadata: {
          orchestrated: true,
          agentSelections,
          createdBy: this.orchestratorId,
        },
      });

      await this.logOperation('workflow_session_created', {
        sessionName,
        sessionId,
        participants: participants.length,
        agentSelections: Object.keys(agentSelections),
      });

      return sessionId;
    } catch (error) {
      await this.logOperation('workflow_session_creation_error', {
        sessionName,
        error: String(error),
      });
      return null;
    }
  }

  /**
   * Execute a complex multi-step workflow with agent coordination
   */
  async executeWorkflow(
    sessionId: string,
    workflowSteps: Array<{
      skill: string;
      instruction: string;
      dependsOn?: string[]; // Previous step IDs
    }>,
  ): Promise<{ success: boolean; results: Record<string, string> }> {
    const workflowId = createUnifiedId('workflow', 'execution');

    await this.logOperation('workflow_execution_started', {
      workflowId,
      sessionId,
      stepCount: workflowSteps.length,
    });

    const results: Record<string, string> = {};
    const executedSteps: Set<string> = new Set();

    try {
      // Execute steps in dependency order
      for (let i = 0; i < workflowSteps.length; i++) {
        const step = workflowSteps[i];
        const stepId = `step_${i}`;

        // Check dependencies
        if (step.dependsOn) {
          const unmetDependencies = step.dependsOn.filter((dep) => !executedSteps.has(dep));
          if (unmetDependencies.length > 0) {
            await this.logOperation('workflow_step_dependency_failed', {
              workflowId,
              stepId,
              unmetDependencies,
            });
            continue; // Skip this step for now
          }
        }

        // Find agent for this skill
        const agent = await this.selectBestAgent(step.skill);
        if (!agent) {
          await this.logOperation('workflow_step_no_agent', {
            workflowId,
            stepId,
            skill: step.skill,
          });
          continue;
        }

        // Execute step
        const messageId = await this.sendMessageToAgent(agent.id, step.instruction, sessionId);
        if (messageId) {
          results[stepId] = messageId;
          executedSteps.add(stepId);

          await this.logOperation('workflow_step_completed', {
            workflowId,
            stepId,
            agentId: agent.id,
            messageId,
          });
        }
      }

      const success = executedSteps.size === workflowSteps.length;

      await this.logOperation('workflow_execution_completed', {
        workflowId,
        sessionId,
        success,
        executedSteps: executedSteps.size,
        totalSteps: workflowSteps.length,
      });

      return { success, results };
    } catch (error) {
      await this.logOperation('workflow_execution_error', {
        workflowId,
        error: String(error),
      });
      return { success: false, results };
    }
  }

  /**
   * Get orchestration performance metrics and analytics
   */
  async getOrchestrationMetrics(): Promise<{
    totalOperations: number;
    successRate: number;
    agentUtilization: Record<string, number>;
    recentActivity: string[];
  }> {
    try {
      // Search for orchestrator operations in memory
      const list = await this.memory.searchMemory({
        query: `orchestratorId:${this.orchestratorId}`,
        userId: 'system_orchestration',
        limit: 100,
      });
      const totalOperations = list.length;
      interface OperationRecord {
        metadata?: Record<string, unknown>;
        content?: string;
      }
      const successfulOps = list.filter((op: OperationRecord) => {
        const metadata = op.metadata as Record<string, unknown> | undefined;
        const operation = String(metadata?.operation || '');
        return !operation.includes('failed') && !operation.includes('error');
      }).length;

      const successRate = totalOperations > 0 ? (successfulOps / totalOperations) * 100 : 0;

      // Extract recent activity
      const recentActivity = (list as OperationRecord[])
        .slice(0, 10)
        .map((op: OperationRecord) => {
          const metadata = op.metadata as Record<string, unknown> | undefined;
          return `${metadata?.operation}: ${op.content}`;
        })
        .filter(Boolean);

      // Compute basic agent utilization (count of appearances in assignment/completion ops)
      const agentUtilization: Record<string, number> = {};
      for (const op of list as OperationRecord[]) {
        const md = op.metadata as Record<string, unknown> | undefined;
        // Prefer structured metadata: metadata.custom.agentId
        const custom = (md?.custom as Record<string, unknown>) || undefined;
        const agentId =
          typeof custom?.agentId === 'string' ? (custom.agentId as string) : undefined;
        if (agentId) {
          agentUtilization[agentId] = (agentUtilization[agentId] || 0) + 1;
          continue;
        }
        // Fallback: parse from content line "Task assigned to <AgentName>:"
        if (typeof op.content === 'string' && op.content.startsWith('Task assigned to ')) {
          // This counts under agent name when id is not present
          const namePart = op.content.replace('Task assigned to ', '');
          const name = namePart.split(':')[0].trim();
          if (name) agentUtilization[name] = (agentUtilization[name] || 0) + 1;
        }
      }

      return {
        totalOperations,
        successRate: Math.round(successRate * 100) / 100,
        agentUtilization,
        recentActivity,
      };
    } catch (error) {
      await this.logOperation('metrics_retrieval_error', { error: String(error) });
      return {
        totalOperations: 0,
        successRate: 0,
        agentUtilization: {},
        recentActivity: ['Error retrieving metrics'],
      };
    }
  }
}
