# Archived Legacy Test Suite

All legacy/deprecated tests moved here to remove lint/type noise while preserving historical reference.
Excluded from lint and verification.

Retention Policy:
- Keep for 30 days; reassess for deletion once canonical suite reaches coverage goals.

Do not add new tests here.

Archived on 2025-08-14 (fully removed on 2025-08-16):
- deprecated-context7-and-hybrid/test-hybrid-registry-discovery.integration.ts (deleted)
- deprecated-context7-and-hybrid/test-hybrid-registry-discovery.errors.integration.ts (deleted)
- deprecated-context7-and-hybrid/test-context7-integration.ts (deleted)
- deprecated-context7-and-hybrid/test-context7-integration-duplicate.ts (deleted)
- deprecated-context7-and-hybrid/test-memory-driven-fallback.ts (deleted)
- deprecated-context7-and-hybrid/test-simple-docs.ts (deleted)

Notes:
- Hybrid registry/discovery replaced by UnifiedAgentCommunicationService; canonical tests exist under tests/canonical.
- Context7 integration pending deprecation or canonicalization; TS sources not present. Tests quarantined until decision.
