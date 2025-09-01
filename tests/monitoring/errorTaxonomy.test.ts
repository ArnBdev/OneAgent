import {
  mapErrorToCode,
  getErrorCodeLabel,
  ErrorCode,
} from '../../coreagent/monitoring/errorTaxonomy';

describe('errorTaxonomy', () => {
  it('maps rate limit style messages to RATE_LIMITED', () => {
    expect(mapErrorToCode(new Error('Rate limit exceeded'))).toBe(ErrorCode.RATE_LIMITED);
    expect(getErrorCodeLabel('Too many requests')).toBe(ErrorCode.RATE_LIMITED);
  });

  it('falls back to INTERNAL for unknown patterns', () => {
    expect(mapErrorToCode(new Error('Some totally novel message'))).toBe(ErrorCode.INTERNAL);
  });

  it('distinguishes AUTHENTICATION vs AUTHORIZATION', () => {
    expect(mapErrorToCode(new Error('Invalid credentials provided'))).toBe(
      ErrorCode.AUTHENTICATION,
    );
    expect(mapErrorToCode(new Error('Permission denied for this resource'))).toBe(
      ErrorCode.AUTHORIZATION,
    );
  });

  it('handles serialization related messages', () => {
    expect(mapErrorToCode('JSON parse failure while decoding payload')).toBe(
      ErrorCode.MEMORY_SERIALIZATION,
    );
  });
});
