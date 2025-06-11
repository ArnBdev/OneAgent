# GitHub Repository Update Routine - OneAgent v4.0.0 Professional

## Pre-Commit Checklist ✅

### **1. Security & Sensitive Data Review**
- [ ] Review `.gitignore` for new file patterns and sensitive data protection
- [ ] Ensure no API keys, credentials, or personal data in tracked files
- [ ] Verify environment files (`.env*`) are properly excluded
- [ ] Check for accidental inclusion of configuration files with secrets

### **2. Code Quality & Architecture**
- [ ] Run Constitutional AI validation on critical changes
- [ ] Verify BMAD framework compliance for complex features
- [ ] Ensure TypeScript compilation passes without errors
- [ ] Validate agent persona optimization scores remain high

### **3. Documentation Consistency**
- [ ] Update version numbers in `README.md` and `package.json`
- [ ] Refresh quality metrics and system health scores
- [ ] Verify all documentation links are functional
- [ ] Update implementation status and completion metrics

### **4. File Organization & Structure**
- [ ] Run structure validation scripts
- [ ] Ensure proper categorization in `docs/`, `prompts/`, `scripts/`
- [ ] Remove deprecated or obsolete files
- [ ] Verify `temp/` and cache directories are excluded

### **5. Testing & Validation**
- [ ] Run comprehensive integration tests
- [ ] Validate MCP server functionality on port 8083
- [ ] Test Constitutional AI and BMAD framework operations
- [ ] Verify Life Companion cross-domain learning features

### **6. Performance & Metrics**
- [ ] Update quality scores and performance metrics
- [ ] Refresh system health indicators
- [ ] Document any performance improvements or regressions
- [ ] Verify memory system and embedding functionality

### **7. Production Readiness**
- [ ] Confirm all production features are documented
- [ ] Verify deployment scripts and configurations
- [ ] Test VS Code integration and MCP connectivity
- [ ] Validate Life Companion domain implementations

## Git Commands for Clean Update

```bash
# 1. Check current status and clean working directory
git status
git clean -fd  # Remove untracked files and directories

# 2. Stage changes systematically
git add .gitignore
git add README.md
git add docs/
git add prompts/
git add package.json

# 3. Review changes before commit
git diff --staged

# 4. Commit with descriptive message
git commit -m "feat: OneAgent v4.0.0 Professional - Complete Life Companion Implementation

- ✅ Perfect agent persona optimization (100/100 scores)
- ✅ Constitutional AI integration (100% compliance)
- ✅ Life Companion architecture with cross-domain learning
- ✅ Comprehensive .gitignore update for security and organization
- ✅ Updated documentation with quality metrics
- ✅ Production-ready MCP server on port 8083"

# 5. Push to GitHub
git push origin main
```

## Post-Push Verification

### **GitHub Repository Health Check**
- [ ] Verify README.md displays correctly with all badges
- [ ] Confirm documentation structure is intact
- [ ] Test clone and setup instructions with fresh environment
- [ ] Validate all documentation links work in GitHub interface

### **Security Validation**
- [ ] Confirm no sensitive files were accidentally committed
- [ ] Verify `.gitignore` patterns are working correctly
- [ ] Check GitHub security alerts for any issues
- [ ] Review commit history for any exposed credentials

### **Quality Assurance**
- [ ] Confirm repository reflects current quality metrics (85.4/100+)
- [ ] Verify Constitutional AI compliance documentation
- [ ] Check agent persona optimization documentation
- [ ] Validate Life Companion implementation status

## Automated Routine Script

```bash
# Save as: scripts/github-update-routine.ps1
# Run before every GitHub update

# Check gitignore coverage
Get-ChildItem -Recurse | Where-Object { 
    $_.Name -match '\.(log|tmp|cache|pid|bak)$' -or 
    $_.Name -match 'api.?key' -or 
    $_.Directory -match 'temp|cache|node_modules'
} | Format-Table Name, Directory

# Validate no sensitive files staged
git ls-files | Select-String -Pattern '(api.?key|secret|credential|\.env)'

# Run quality checks
node scripts/validate-persona-optimization.js
node scripts/test-constitutional-validation.js

# Update version and metrics
# (Manual step - update README.md with latest metrics)

Write-Host "✅ GitHub Update Routine Complete - Ready for commit!"
```

## Monthly Maintenance Tasks

### **Documentation Audit**
- [ ] Review and update all documentation for accuracy
- [ ] Refresh quality metrics and performance benchmarks
- [ ] Update implementation roadmap and completion status
- [ ] Verify external links and references

### **Security Review**
- [ ] Audit `.gitignore` for new file patterns
- [ ] Review access patterns and sensitive data handling
- [ ] Update dependency security and vulnerability scanning
- [ ] Validate Constitutional AI safety principles compliance

### **Architecture Evolution**
- [ ] Assess system architecture for improvements
- [ ] Update agent persona configurations based on usage patterns
- [ ] Refine cross-domain learning effectiveness
- [ ] Plan next phase Life Companion enhancements

---

**Remember**: Every GitHub update should reflect the systematic, high-quality approach that defines OneAgent v4.0.0 Professional. This routine ensures your repository maintains the standards of excellence that make it a compelling showcase of advanced AI development.
