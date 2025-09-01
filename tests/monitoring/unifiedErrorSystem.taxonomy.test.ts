import { OneAgentUnifiedBackbone } from '../../coreagent/utils/UnifiedBackboneService';
import { ErrorCode } from '../../coreagent/monitoring/errorTaxonomy';

describe('OneAgentUnifiedErrorSystem + Taxonomy Integration', () => {
  const backbone = OneAgentUnifiedBackbone.getInstance();
  const errorHandler = backbone.errorHandler;

  it('attaches INTERNAL taxonomyCode for unknown error', async () => {
    const entry = await errorHandler.handleError(new Error('Some totally novel message'), {
      component: 'TestComponent',
      operation: 'test_op',
    });
    expect(entry.taxonomyCode).toBe(ErrorCode.INTERNAL);
  });

  it('maps permission denied to AUTHORIZATION taxonomy (authorization)', async () => {
    const entry = await errorHandler.handleError(new Error('Permission denied for this resource'), {
      component: 'TestComponent',
      operation: 'auth_op',
    });
    expect(entry.taxonomyCode).toBe(ErrorCode.AUTHORIZATION);
  });
});
