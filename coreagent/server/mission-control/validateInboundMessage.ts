import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from './schemas/mission-control-messages.schema.json';
import type { InboundClientMessage } from './types';

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);
const validate = ajv.compile(schema as unknown as object);

export function parseAndValidateInbound(
  raw: string,
): { ok: true; msg: InboundClientMessage } | { ok: false; errors: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, errors: ['invalid_json'] };
  }
  if (validate(parsed)) {
    return { ok: true, msg: parsed as InboundClientMessage };
  }
  const errors = (validate.errors || []).map((e) => `${e.instancePath || '/'} ${e.message}`);
  return { ok: false, errors };
}
