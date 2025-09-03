/**
 * Canonical Error Taxonomy (v4.1 Draft)
 *
 * PURPOSE: Provide a stable, low-cardinality enumeration of error codes for metrics, logging, and UI.
 * DESIGN: Codes reflect SEMANTIC class (not transport/library specifics). Avoid leaking implementation details.
 * EXTENSION POLICY: Add new codes ONLY via RFC once taxonomy stabilizes. Temporary codes use the 'exp_' prefix.
 */

export enum ErrorCode {
  // Input / Client
  VALIDATION = 'validation', // Invalid user or agent input
  AUTHENTICATION = 'authentication', // Auth credentials missing/invalid
  AUTHORIZATION = 'authorization', // Permission denied
  RATE_LIMITED = 'rate_limited', // Rate or quota exceeded

  // Dependency / Upstream
  UPSTREAM_TIMEOUT = 'upstream_timeout', // External call exceeded timeout
  UPSTREAM_UNAVAILABLE = 'upstream_unavailable', // External dependency down
  UPSTREAM_ERROR = 'upstream_error', // Non-classified upstream failure

  // System / Internal
  INTERNAL = 'internal', // Generic unexpected internal error
  STATE_INCONSISTENCY = 'state_inconsistency', // Detected divergent or impossible state
  RESOURCE_EXHAUSTED = 'resource_exhausted', // Memory / handle / queue saturation
  CIRCUIT_OPEN = 'circuit_open', // Circuit breaker open (fail fast)

  // Data / Memory
  MEMORY_NOT_FOUND = 'memory_not_found',
  MEMORY_CONFLICT = 'memory_conflict', // Version / optimistic concurrency conflict
  MEMORY_SERIALIZATION = 'memory_serialization',

  // AI / Model
  MODEL_FAILURE = 'model_failure',
  MODEL_TIMEOUT = 'model_timeout',
  MODEL_SAFETY_REJECTION = 'model_safety_rejection',

  // Planning / Orchestration
  PLAN_GENERATION_FAILED = 'plan_generation_failed',
  PLAN_STEP_FAILED = 'plan_step_failed',
  REPLAN_LIMIT_REACHED = 'replan_limit_reached',

  // Delegation / Task Pipeline (Epic 7)
  DELEGATION_NO_TARGET = 'delegation_no_target', // No suitable target agent inferred
  DELEGATION_EXECUTION_ERROR = 'delegation_execution_error', // Adapter / execution layer failure
  DELEGATION_ADAPTER_ERROR = 'delegation_adapter_error', // Explicit adapter wrapper error

  // Remediation / Execution Layer (Epic 8 groundwork)
  REMEDIATION_FAILED = 'remediation_failed', // Remediation logic executed but reported failure (business logic)
  REMEDIATION_TASK_NOT_FOUND = 'remediation_task_not_found', // Task id disappeared before execution
  REMEDIATION_TIMEOUT = 'remediation_timeout', // Future: execution exceeded allowed time

  // Experimental (subject to rename/remove)
  EXP_EMERGENT_INFERENCE = 'exp_emergent_inference',
}

/** Canonical mapping from arbitrary Error / message text to stable ErrorCode. */
export function mapErrorToCode(err: unknown): ErrorCode {
  const message = deriveMessage(err);
  // Order matters: most specific patterns first.
  if (/rate limit|too many requests/i.test(message)) return ErrorCode.RATE_LIMITED;
  if (/auth(or)?(ization|ised|ization)|permission|forbidden/i.test(message))
    return ErrorCode.AUTHORIZATION;
  if (/token|credential|unauth/i.test(message)) return ErrorCode.AUTHENTICATION;
  if (/timeout/i.test(message)) return ErrorCode.UPSTREAM_TIMEOUT;
  if (/unavailable|econnrefused|enotfound|dns/i.test(message))
    return ErrorCode.UPSTREAM_UNAVAILABLE;
  if (/validation|invalid|malformed|schema/i.test(message)) return ErrorCode.VALIDATION;
  if (/memory.*not.*found/i.test(message)) return ErrorCode.MEMORY_NOT_FOUND;
  if (/conflict|version mismatch/i.test(message)) return ErrorCode.MEMORY_CONFLICT;
  if (/serialize|serialization|json parse/i.test(message)) return ErrorCode.MEMORY_SERIALIZATION;
  if (/model|inference/i.test(message)) return ErrorCode.MODEL_FAILURE;
  if (/circuit.*open/i.test(message)) return ErrorCode.CIRCUIT_OPEN;
  if (/resource.*exhausted|out of memory|ENOMEM/i.test(message))
    return ErrorCode.RESOURCE_EXHAUSTED;
  if (/plan generation/i.test(message)) return ErrorCode.PLAN_GENERATION_FAILED;
  if (/plan step/i.test(message)) return ErrorCode.PLAN_STEP_FAILED;
  if (/replan limit/i.test(message)) return ErrorCode.REPLAN_LIMIT_REACHED;
  if (/no target agent/i.test(message)) return ErrorCode.DELEGATION_NO_TARGET;
  if (/adapter_error|adapter error/i.test(message)) return ErrorCode.DELEGATION_ADAPTER_ERROR;
  if (/execution_failure|execution error/i.test(message))
    return ErrorCode.DELEGATION_EXECUTION_ERROR;
  if (/remediation_failed/i.test(message)) return ErrorCode.REMEDIATION_FAILED;
  if (/task_not_found|task missing/i.test(message)) return ErrorCode.REMEDIATION_TASK_NOT_FOUND;
  if (/remediation timeout/i.test(message)) return ErrorCode.REMEDIATION_TIMEOUT;
  return ErrorCode.INTERNAL;
}

function deriveMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  interface ErrorLike {
    message?: unknown;
  }
  const maybe = err as ErrorLike;
  if (typeof maybe.message === 'string' && maybe.message.length) return maybe.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Export a minimal interface for metrics layer to avoid importing enum upstream everywhere.
 */
export function getErrorCodeLabel(err: unknown): string {
  return mapErrorToCode(err);
}
