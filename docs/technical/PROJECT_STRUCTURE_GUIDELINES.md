# OneAgent Project Structure Guidelines

## 📁 Enforced Directory Structure

This document defines the **mandatory** folder structure for OneAgent. All files must be placed in their correct locations to maintain consistency and avoid confusion.

## 🎯 Automated Validation

**Every commit is automatically validated** for proper file placement using:
```bash
npm run validate-structure    # Check structure compliance
npm run fix-structure         # Auto-fix violations  
npm run fix-structure:dry     # Preview what would be moved
npm run precommit            # Runs automatically before commits
```

## 📋 Directory Rules

### Root Directory (/) - MINIMAL FILES ONLY
**✅ ALLOWED:**
- `README.md` - Main project overview
- `CHANGELOG.md` - Version history  
- `LICENSE` - Legal documentation
- `package.json`, `package-lock.json` - Node.js configuration
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `.env`, `.env.example` - Environment variables
- `.gitignore` - Git ignore rules
- `start.bat`, `start.ps1` - Launch scripts
- `enable-oura-v3.ps1` - System activation script

**❌ FORBIDDEN:**
- Test files (`*.test.js`, `*.spec.ts`)
- Analysis/report documentation (`*_ANALYSIS.md`, `*_REPORT.md`)
- Random scripts or utilities
- Implementation status files

### Documentation (/docs/) - ALL DOCUMENTATION
```
docs/
├── technical/          # Setup guides, configurations, technical docs
├── reports/           # Analysis reports, cleanup summaries, audits  
├── status/            # Implementation status, completion reports
├── agents/            # Agent-specific documentation
├── research/          # Research findings, strategic plans
├── implementation/    # Implementation plans and guides
├── validation/        # Validation reports and test results  
├── guides/            # User guides and tutorials
├── meetings/          # Meeting notes and decisions
├── production/        # Production deployment documentation
└── backups/           # Documentation backups
```

**Auto-categorization rules:**
- Files containing "status", "complete", "deployment" → `status/`
- Files containing "report", "summary", "analysis", "cleanup" → `reports/`  
- Files containing "setup", "config", "technical", "guide" → `technical/`
- Files containing "plan", "implementation", "architecture" → `implementation/`
- Files containing "research", "strategic" → `research/`

### Tests (/tests/) - ALL TEST FILES
```
tests/
├── *.test.js          # Unit tests
├── *.spec.ts          # Specification tests  
├── test-*.js          # Integration tests
├── README.md          # Test documentation
└── fixtures/          # Test data and fixtures
```

**Auto-detection patterns:**
- `*.test.(js|ts|mjs)`
- `*.spec.(js|ts|mjs)`  
- `test*.{js|ts|mjs}`

### Scripts (/scripts/) - UTILITY SCRIPTS
```
scripts/
├── *.js              # Node.js scripts
├── *.ts              # TypeScript scripts
├── *.ps1              # PowerShell scripts  
├── *.bat              # Batch scripts
├── *.sh               # Shell scripts
└── README.md          # Scripts documentation
```

### Core Application (/coreagent/) - APPLICATION CODE
```
coreagent/
├── main.ts            # Application entry point
├── agents/            # Agent implementations
├── api/               # API layer
├── server/            # Server implementations  
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── interfaces/        # Interface definitions
├── memory/            # Memory management
├── mcp/               # MCP protocol implementations
└── vscode-extension/  # VS Code extension (with own docs)
```

### UI (/ui/) - FRONTEND APPLICATION  
```
ui/
├── src/               # React source code
├── public/            # Static assets
├── dist/              # Built frontend
└── package.json       # Frontend dependencies
```

### Configuration (/config/) - CONFIGURATION FILES
```
config/
├── *.ts               # TypeScript config modules
├── *.json             # JSON configuration
└── *.txt              # Text-based config
```

## 🚀 File Creation Guidelines

### When Creating New Files

**1. Documentation Files:**
```bash
# ✅ CORRECT
docs/technical/NEW_FEATURE_SETUP.md
docs/reports/PERFORMANCE_ANALYSIS.md  
docs/status/FEATURE_X_COMPLETE.md

# ❌ WRONG  
NEW_FEATURE_SETUP.md          # Root clutter
PERFORMANCE_ANALYSIS.md       # Root clutter
```

**2. Test Files:**
```bash
# ✅ CORRECT
tests/user-service.test.ts
tests/integration/api.test.ts

# ❌ WRONG
user-service.test.ts          # Root clutter
coreagent/user-service.test.ts # Mixed with app code
```

**3. Script Files:**
```bash
# ✅ CORRECT  
scripts/deploy-helper.js
scripts/data-migration.ps1

# ❌ WRONG
deploy-helper.js              # Root clutter
```

## 🔧 Enforcement Mechanisms

### 1. **Pre-commit Validation**
- Automatically runs `npm run validate-structure` before every commit
- Blocks commits if violations are found
- Shows exactly what needs to be fixed

### 2. **Auto-fix Commands**  
```bash
npm run fix-structure         # Auto-move all violating files
npm run fix-structure:dry     # Preview moves without executing
npm run fix-structure:interactive # Ask before each move
```

### 3. **CI/CD Integration**
- Structure validation runs in GitHub Actions
- Pull requests blocked if structure violations exist
- Automated suggestions for file placement

### 4. **IDE Integration**
- VS Code workspace settings enforce folder conventions  
- File templates automatically create in correct locations
- Snippets include proper folder paths

## 📊 Violation Examples

### Common Violations and Fixes:

```bash
# VIOLATION: Test in root
❌ user-service.test.ts
✅ tests/user-service.test.ts

# VIOLATION: Documentation in root  
❌ FEATURE_ANALYSIS.md
✅ docs/reports/FEATURE_ANALYSIS.md

# VIOLATION: Script in root
❌ cleanup-data.js  
✅ scripts/cleanup-data.js

# VIOLATION: Status report in root
❌ IMPLEMENTATION_COMPLETE.md
✅ docs/status/IMPLEMENTATION_COMPLETE.md
```

## 🎯 Quality Standards

### Constitutional AI Compliance
All structure validation follows Constitutional AI principles:
- **Accuracy**: Precise file categorization rules
- **Transparency**: Clear reasoning for all folder decisions  
- **Helpfulness**: Auto-fix suggestions and guidance
- **Safety**: Non-destructive validation with dry-run options

### BMAD Framework Integration
Structure decisions use BMAD systematic analysis:
- **Belief Assessment**: Why this structure serves the project
- **Motivation Mapping**: Goals of clean organization
- **Dependency Analysis**: How structure affects development
- **Risk Assessment**: Impact of violations on maintainability

## 🚨 Emergency Override

In exceptional cases, structure rules can be temporarily bypassed:

```bash
# Skip validation for urgent commits
git commit --no-verify -m "Emergency fix"

# Or set environment variable
SKIP_STRUCTURE_VALIDATION=true npm run precommit
```

**⚠️ Warning**: Emergency overrides should be fixed immediately after the emergency is resolved.

## 🔄 Continuous Improvement

This structure guide evolves based on:
- Development team feedback
- Project growth and complexity
- Industry best practices
- OneAgent-specific requirements

All changes undergo Constitutional AI validation and BMAD analysis before implementation.

---

**Remember**: A well-organized codebase is the foundation of maintainable, scalable software. These rules exist to help, not hinder development.
