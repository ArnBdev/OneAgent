# Project Structure Enforcement

The OneAgent project now has advanced automated structure enforcement to ensure all files are created in their correct locations.

## 🚀 Enhanced Commands

### **Structure Scanning**
```bash
npm run check-structure    # Scan for misplaced files and auto-fix where possible
```

### **Interactive File Creation**
```bash
npm run create-file        # Interactive wizard for creating files in correct locations
npm run structure-guide    # Show comprehensive file placement guide
```

### **Automated Creation** (Existing)
```bash
npm run new:doc <name>     # Create documentation in docs/
npm run new:test <name>    # Create test file in tests/
npm run new:script <name>  # Create script in scripts/
```

## 🤖 Automated Features

### **Auto-Detection**
The system automatically detects:
- Test files (test-*.ts, *.test.ts, *Test.ts)
- Documentation (*.md files, *GUIDE*.md, *REFERENCE*.md)
- Scripts (build*.js, deploy*.js, *-util*.js)
- Temporary files (*.log, debug*.txt, *.tmp)

### **Auto-Movement**
Temporary and log files are automatically moved to `temp/` directory:
- `*.log` → `temp/`
- `debug*.txt` → `temp/`
- `*.tmp` → `temp/`

### **Smart Suggestions**
For other files, the system provides:
- Exact move commands
- Template creation commands
- Location explanations
- Examples of correct placement

## 🔧 Integration with Development Workflow

### **Pre-commit Check**
Add to your development workflow:
```bash
npm run check-structure    # Returns exit code 1 if issues found
```

### **Daily Cleanup**
```bash
npm run clean              # Cleans build artifacts
npm run check-structure    # Ensures proper file placement
```

## 📋 File Placement Rules (Automated)

The system enforces these rules automatically:

| Pattern | Location | Auto-Move | Template |
|---------|----------|-----------|----------|
| `test-*.ts` | `tests/` | No | Yes |
| `*.test.ts` | `tests/` | No | Yes |
| `*GUIDE*.md` | `docs/` | No | Yes |
| `*REFERENCE*.md` | `docs/` | No | Yes |
| `build*.js` | `scripts/` | No | Yes |
| `deploy*.js` | `scripts/` | No | Yes |
| `*.log` | `temp/` | **Yes** | No |
| `debug*.txt` | `temp/` | **Yes** | No |
| `*.tmp` | `temp/` | **Yes** | No |

## 🎯 Benefits

1. **🤖 Automated Enforcement** - No more manual file organization
2. **🔍 Smart Detection** - Automatically finds misplaced files
3. **✨ Template Integration** - Creates files with proper templates
4. **🚨 CI Integration** - Can be used in CI/CD pipelines
5. **👥 Team Consistency** - Ensures all team members follow same structure
6. **📚 Interactive Guidance** - Helps developers learn proper placement

## 🚀 Getting Started

1. **Scan current project:**
   ```bash
   npm run check-structure
   ```

2. **Create new files properly:**
   ```bash
   npm run create-file
   ```

3. **View placement guide:**
   ```bash
   npm run structure-guide
   ```

The OneAgent project structure is now fully automated and self-enforcing! 🎉
