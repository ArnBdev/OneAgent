# OneAgent Scripts Directory Cleanup Log

## Cleanup Date: 2025-06-23

### Rationale
This cleanup removes all outdated, deprecated, or redundant scripts from the `scripts/` directory, keeping only those required for current system startup, memory server, and essential operational/utility tasks. The goal is to:
- Prevent confusion and accidental use of legacy scripts
- Ensure maintainability and clarity for all users
- Reduce risk of running obsolete or conflicting code

### Scripts to Keep (Current & Essential)
- `start-oneagent-system.ps1` (main system startup, background)
- `start-memory-server.ps1` (memory server only)
- `start.ps1` (quick start wrapper)
- `README.md` (documentation)

### Scripts to Remove (Outdated/Redundant)
- All cleanup, phase, legacy, and test scripts not required for current operation, including:
  - `cleanup-*.ps1`, `cleanup-*.js`
  - `phase*.ps1`
  - `test-*.ps1`, `validate-*.js`, `verify*.js`
  - `start-background-server.js` (replaced by PowerShell background start)
  - `devagent-production-integration.js`, `memory-intelligence-benchmark.ts`, etc.
  - Any script not referenced in README.md or not required for startup/utility

### Risk Assessment
- **Low risk**: All removals are non-essential for current system operation. If needed, scripts can be restored from version control.
- **Mitigation**: Documented here for traceability.

---

## Action Log
- [ ] Remove all listed outdated scripts
- [ ] Confirm system startup and memory server work as expected
- [ ] Update README.md to reflect current scripts

---

This log documents the rationale and actions for future maintainers.
