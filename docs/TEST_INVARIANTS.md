# Canonical Test Invariants

Documenting core invariants preserved while archiving legacy test suite.

## Unified Systems
- ID generation always returns string containing type token.
- Timestamp objects contain unix (number) and iso (string) fields.
- Cache singleton accessible via OneAgentUnifiedBackbone.getInstance().cache.

## Memory
- Memory records must include canonical metadata with created + updated timestamps.

## Constitutional AI
- Validation pipeline enforces principles: Accuracy, Transparency, Helpfulness, Safety.

## Future Additions
Add more invariants as canonical test coverage expands.
