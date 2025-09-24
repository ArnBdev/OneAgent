/**
 * Canonical agent execution result contract for asynchronous task completion.
 * Emitted by specialized agents when finishing a delegated task.
 */
export interface AgentExecutionResult {
  taskId: string;
  status: 'completed' | 'failed';
  agentId: string;
  timestamp: string; // ISO
  result?: string; // Optional human-readable or serialized result artifact
  errorCode?: string; // Present if status === 'failed'
  errorMessage?: string; // Present if status === 'failed'
  meta?: Record<string, unknown>; // Agent-specific supplemental metadata
}

export function isAgentExecutionResult(obj: unknown): obj is AgentExecutionResult {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.taskId === 'string' &&
    (o.status === 'completed' || o.status === 'failed') &&
    typeof o.agentId === 'string' &&
    typeof o.timestamp === 'string'
  );
}

/** Lightweight schema validation returning error list (empty => valid) */
export function validateAgentExecutionResult(obj: unknown): string[] {
  const errors: string[] = [];
  if (!isAgentExecutionResult(obj)) {
    if (!obj || typeof obj !== 'object') return ['Not an object'];
    const o = obj as Record<string, unknown>;
    if (typeof o.taskId !== 'string') errors.push('taskId missing');
    if (o.status !== 'completed' && o.status !== 'failed') errors.push('status invalid');
    if (typeof o.agentId !== 'string') errors.push('agentId missing');
    if (typeof o.timestamp !== 'string') errors.push('timestamp missing');
  }
  return errors;
}
