import { SecureErrorHandler } from '../../coreagent/utils/secureErrorHandler';
import { ErrorCode } from '../../coreagent/monitoring/errorTaxonomy';

/**
 * Ensures SecureErrorHandler integrates canonical taxonomy codes.
 */
describe('SecureErrorHandler + Taxonomy Integration', () => {
  const handler = new SecureErrorHandler({ includeDebugInfo: true, enableDetailedLogging: false });

  it('attaches taxonomy errorCode for generic internal error', async () => {
    const resp = await handler.handleError(new Error('Some totally novel message'));
    expect(resp.error.errorCode).toBe(ErrorCode.INTERNAL);
  });

  it('derives AUTHENTICATION taxonomy code from credential style message', async () => {
    const resp = await handler.handleError(new Error('Invalid credentials provided'));
    expect(resp.error.errorCode).toBe(ErrorCode.AUTHENTICATION);
  });

  it('maps rate limit messages to RATE_LIMITED taxonomy code', async () => {
    const resp = await handler.handleError(new Error('Rate limit exceeded'));
    expect(resp.error.errorCode).toBe(ErrorCode.RATE_LIMITED);
  });
});
