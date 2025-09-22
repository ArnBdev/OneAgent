import { getOptionalNeo4j, resetOptionalNeo4jCache } from '../../services/optionalNeo4jShim';

/**
 * Shim behavior test (no neo4j-driver installed scenario).
 * Ensures first call returns null quickly and caching works without throwing.
 */

describe('optionalNeo4jShim (no dependency present)', () => {
  beforeEach(() => {
    resetOptionalNeo4jCache();
  });

  it('returns null when neo4j-driver is absent', () => {
    const mod = getOptionalNeo4j();
    expect(mod).toBeNull();
  });

  it('caches null result on repeat calls', () => {
    const first = getOptionalNeo4j();
    const second = getOptionalNeo4j();
    expect(first).toBeNull();
    expect(second).toBeNull();
  });
});
