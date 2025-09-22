import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from './schemas/mission-control-outbound-messages.schema.json';

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);
const validate = ajv.compile(schema as unknown as object);

export function validateOutboundMessage(
  obj: unknown,
): { ok: true } | { ok: false; errors: string[] } {
  if (validate(obj)) return { ok: true };
  const errors = (validate.errors || []).map((e) => `${e.instancePath || '/'} ${e.message}`);
  return { ok: false, errors };
}
