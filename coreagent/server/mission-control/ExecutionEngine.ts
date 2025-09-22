import { createUnifiedId, createUnifiedTimestamp } from '../../utils/UnifiedBackboneService';
import type { ChannelContext } from './types';

export interface ExecutionTaskProgress {
  taskId: string;
  index: number;
  total: number;
  status: 'pending' | 'in_progress' | 'done';
}

export interface ExecutionEngineOptions {
  missionId: string;
  tasks: unknown[];
  ws: import('ws').WebSocket;
  ctx: ChannelContext;
}

export class ExecutionEngine {
  private cancelled = false;
  private readonly missionId: string;
  private readonly tasks: unknown[];
  private readonly ws: import('ws').WebSocket;
  private readonly ctx: ChannelContext;

  constructor(opts: ExecutionEngineOptions) {
    this.missionId = opts.missionId;
    this.tasks = opts.tasks;
    this.ws = opts.ws;
    this.ctx = opts.ctx;
  }

  cancel(): void {
    this.cancelled = true;
  }

  async run(): Promise<void> {
    this.emitUpdate('execution_started');
    if (!Array.isArray(this.tasks) || this.tasks.length === 0) {
      // Nothing to execute, immediately complete
      this.emitUpdate('completed');
      return;
    }
    const total = this.tasks.length;
    for (let i = 0; i < total; i++) {
      if (this.cancelled) {
        this.emitUpdate('cancelled');
        return;
      }
      const taskId = `task-${i + 1}`;
      // Simulate work
      await new Promise((r) => setTimeout(r, 5));
      this.emitUpdate('execution_progress', {
        progress: {
          taskId,
          index: i + 1,
          total,
          status: i + 1 === total ? 'done' : 'in_progress',
        },
      });
    }
    if (!this.cancelled) {
      this.emitUpdate('completed');
    }
  }

  private emitUpdate(status: string, extra?: Record<string, unknown>): void {
    const ts = createUnifiedTimestamp();
    this.ctx.send(this.ws, {
      type: 'mission_update',
      id: createUnifiedId('system', 'mission_update'),
      timestamp: ts.iso,
      unix: ts.unix,
      server: extra?.server || { name: 'mission-control', version: 'internal' },
      payload: { missionId: this.missionId, status, ...extra },
    });
  }
}
