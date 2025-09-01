/**
 * Canonical communication error taxonomy.
 * Use factory helpers to avoid ad-hoc Error construction.
 */

export type CommunicationErrorCode =
  | 'COMM_NOT_INITIALIZED'
  | 'COMM_INVALID_MESSAGE'
  | 'COMM_RATE_LIMIT'
  | 'COMM_NOT_FOUND'
  | 'COMM_INVALID_STATE'
  | 'COMM_REMOTE_FAILURE'
  | 'COMM_PERSISTENCE_FAILURE'
  | 'COMM_UNSUPPORTED_FEATURE';

export class CommunicationError extends Error {
  public readonly code: CommunicationErrorCode;
  public readonly causeError?: unknown;
  constructor(code: CommunicationErrorCode, message: string, cause?: unknown) {
    super(message);
    this.code = code;
    this.name = 'CommunicationError';
    this.causeError = cause;
  }
}

export const CommunicationErrorFactory = {
  notInitialized(): CommunicationError {
    return new CommunicationError(
      'COMM_NOT_INITIALIZED',
      'Communication subsystem not initialized',
    );
  },
  invalidMessage(details: unknown): CommunicationError {
    return new CommunicationError('COMM_INVALID_MESSAGE', 'Invalid agent message', details);
  },
  rateLimit(): CommunicationError {
    return new CommunicationError('COMM_RATE_LIMIT', 'Rate limit exceeded for agent communication');
  },
  notFound(entity: string, id: string): CommunicationError {
    return new CommunicationError('COMM_NOT_FOUND', `${entity} not found: ${id}`);
  },
  invalidState(msg: string): CommunicationError {
    return new CommunicationError('COMM_INVALID_STATE', msg);
  },
  remoteFailure(msg: string, cause?: unknown): CommunicationError {
    return new CommunicationError('COMM_REMOTE_FAILURE', msg, cause);
  },
  persistenceFailure(msg: string, cause?: unknown): CommunicationError {
    return new CommunicationError('COMM_PERSISTENCE_FAILURE', msg, cause);
  },
  unsupported(feature: string): CommunicationError {
    return new CommunicationError(
      'COMM_UNSUPPORTED_FEATURE',
      `Feature not yet implemented: ${feature}`,
    );
  },
};
