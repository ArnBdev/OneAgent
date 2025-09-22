import { getModelFor, type ModelCapability } from '../../config/UnifiedModelPicker';

describe('UnifiedModelPicker', () => {
  const caps: ModelCapability[] = [
    'fast_text',
    'advanced_text',
    'fast_multimodal',
    'advanced_multimodal',
  ];
  it('creates model clients for all primary capabilities', () => {
    for (const c of caps) {
      const client = getModelFor(c);
      expect(client).toBeTruthy();
    }
  });
});
