# OneAgent Cleanup Plan - BMAD Risk-Based Tiers

## 🎯 LOW RISK - SAFE TO REMOVE (Auto-cleanup approved)

### Root Test Files (Legacy Development)
**Risk Level**: ⭐ LOW - These are standalone test files from development iterations
**Justification**: Not referenced in package.json scripts, not part of active test suite

✅ **Files to Remove**:
- `test-agent-bootstrap.js` - Legacy agent testing
- `test-agent-count-investigation.js` - Development debugging
- `test-backbone-metadata.js` - Superseded by formal tests
- `test-direct-gemini-workout.js` - Development API testing
- `test-enhanced-nlacs.js` - Legacy NLACS testing
- `test-health-monitoring-fixes.js` - Development debugging
- `test-live-cost-monitoring.js` - Development testing
- `test-nlacs-basic.js` - Superseded by formal tests
- `test-nlacs-simple.js` - Basic testing superseded
- `test-nlacs-standalone.js` - Development testing
- `test-priority1-autoregistration.js` - Development debugging
- `test-quick-registration.js` - Development testing

### Legacy Test Files in /tests
**Risk Level**: ⭐ LOW - Superseded by formal test suite

✅ **Files to Remove**:
- `debug_test.js` - Development debugging
- `simple_test.js` - Basic testing superseded
- `test-chat-api.js` - Legacy API testing
- `test_all_oneagent_features.js` - Superseded by formal tests
- `test_health_request.json` - Test data file
- `test_integration.py` - Python test (unused)
- `test_mcp_connection.js` - Legacy MCP testing
- `test_mcp_expanded_tools.js` - Development testing
- `test_mcp_tools.json` - Test data file
- `test_new_mcp_tools.js` - Development testing
- `test_tools_list.json` - Test data file
- `test_webfetch_compiled.js` - Legacy tool testing
- `test_webfetch_tool.js` - Legacy tool testing
- `webfetch_verification.js` - Development verification

### Temporary/Log Files
**Risk Level**: ⭐ LOW - Temporary files safe to remove

✅ **Files to Remove**:
- `test-output.log` - Test logging output
- `oneagent_memory.log` - Log file
- `test_mcp_request.json` - Test request data

### Development Scripts (Obsolete)
**Risk Level**: ⭐ LOW - Development utilities no longer needed

✅ **Files to Remove**:
- `analyze-agent-architecture.js` - Development analysis
- `verify-system-status.js` - Development verification

## 🟡 MEDIUM RISK - REVIEW BEFORE REMOVAL

### Specialized Test Files
**Risk Level**: ⭐⭐ MEDIUM - May have specific value but likely superseded

🟡 **Files to Review**:
- `test-cost-monitoring-integration.ts` - Cost monitoring tests
- `test-cost-monitoring-system.ts` - Cost system tests  
- `test-cost-monitoring-v2.ts` - Version 2 cost tests
- `test-nlacs-backbone.js` - NLACS backbone testing
- `test-nlacs-budgeting.js` - NLACS budgeting tests
- `test-nlacs-real.ts` - Real NLACS testing
- `test-phase2-agentfactory-integration.ts` - Phase 2 preparation
- `test-tier-system-implementation.ts` - Tier system testing
- `test-unified-imports.ts` - Import verification

### Memory Testing Files
**Risk Level**: ⭐⭐ MEDIUM - Memory system testing

🟡 **Files to Review**:
- `test-mem0-*.py` - Multiple mem0 integration tests
- `test-memory-driven-*.ts` - Memory-driven agent tests
- `test-real-memory.ts` - Real memory testing
- `integration-test-real-memory.ts` - Memory integration tests

## 🔴 HIGH RISK - DO NOT REMOVE (Require consultation)

### Active Test Suite
**Risk Level**: ⭐⭐⭐ HIGH - Core Phase 1 test infrastructure

❌ **DO NOT REMOVE**:
- `tests/oneagent-*.ts` - All oneagent test files (ACTIVE)
- `tests/test-real-api.ts` - Real API testing (ACTIVE)
- `tests/test-api-key.ts` - API key validation (ACTIVE)
- `tests/test-import.ts` - Import testing (ACTIVE)
- `tests/test-mcp-http.ts` - MCP HTTP testing (ACTIVE)

### Core Configuration
**Risk Level**: ⭐⭐⭐ HIGH - System configuration

❌ **DO NOT REMOVE**:
- `package.json` - Core configuration
- `tsconfig.json` - TypeScript configuration
- `.vscode/settings.json` - VS Code configuration
- `.gitignore` - Git configuration

### Production Documentation
**Risk Level**: ⭐⭐⭐ HIGH - Current status documentation

❌ **DO NOT REMOVE**:
- `PHASE1_COMPLETION_STATUS.md` - Current milestone
- `README.md` - Project documentation
- `CHANGELOG.md` - Version history

## Cleanup Implementation Strategy

1. **AUTO-EXECUTE**: Low risk files (immediate removal)
2. **MANUAL REVIEW**: Medium risk files (verify before removal)
3. **PRESERVE**: High risk files (keep intact)
