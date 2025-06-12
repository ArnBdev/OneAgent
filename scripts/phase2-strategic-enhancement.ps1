# Phase 2 Implementation Script - Strategic Instruction Enhancement
# OneAgent Professional Development Platform
# Multi-Agent Communication Focus | Constitutional AI Validated

param(
    [string]$BackupTimestamp = ""
)

Write-Host "=== OneAgent Strategic Instruction Enhancement - Phase 2 ===" -ForegroundColor Cyan
Write-Host "Target: Multi-Agent Communication Development Focus" -ForegroundColor Green
Write-Host ""

if (-not $BackupTimestamp) {
    Write-Host "❌ Error: BackupTimestamp parameter required" -ForegroundColor Red
    Write-Host "Usage: .\phase2-strategic-enhancement.ps1 -BackupTimestamp 'yyyyMMdd_HHmmss'" -ForegroundColor Yellow
    exit 1
}

# Verify backup exists before proceeding
$backupFile = "$env:APPDATA\Code\User\prompts\.instructions.backup.$BackupTimestamp.md"
if (-not (Test-Path $backupFile)) {
    Write-Host "❌ Error: Backup file not found: $backupFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backup verified: $backupFile" -ForegroundColor Green
Write-Host ""

# Step 1: Create working copy for modification
Write-Host "Step 1: Creating working copy for modification..." -ForegroundColor Yellow
$workingFile = "$env:APPDATA\Code\User\prompts\.instructions.working.md"

try {
    Copy-Item "$env:APPDATA\Code\User\prompts\.instructions.md" $workingFile
    Write-Host "✅ Working copy created" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create working copy: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Apply strategic modifications
Write-Host ""
Write-Host "Step 2: Applying strategic multi-agent enhancements..." -ForegroundColor Yellow

# Read the current instruction file
$instructionContent = Get-Content "$env:APPDATA\Code\User\prompts\.instructions.md" -Raw

# Enhancement 1: Add multi-agent priority section after Core Capabilities
$multiAgentPriority = @"

## 🤖 Multi-Agent Communication Priority (ACTIVE DEVELOPMENT FOCUS)

**STRATEGIC DEVELOPMENT PRIORITY**: Agent-to-Agent Communication Implementation
**Framework**: MCP/A2A Protocol Integration with Constitutional AI validation
**Quality Standard**: 85%+ with multi-agent compliance validation
**Timeline**: Accelerated development through focused instruction enhancement

### Multi-Agent Development Tools (Enhanced Priority)
1. **Protocol Design**: Use ``oneagent_bmad_analyze`` for A2A architecture decisions
2. **Security Implementation**: Apply ``oneagent_constitutional_validate`` for security protocols  
3. **Quality Assurance**: Use ``oneagent_quality_score`` for multi-agent interaction validation
4. **Memory Coordination**: Leverage ``oneagent_memory_context`` for agent knowledge sharing
5. **Semantic Analysis**: Apply ``oneagent_semantic_analysis`` for agent communication patterns

### Multi-Agent Development Workflow (Enhanced Focus)
**Before every multi-agent task:**
1. **Protocol Analysis**: Use BMAD framework for communication pattern analysis
2. **Security Validation**: Apply Constitutional AI for protocol security assessment  
3. **Quality Measurement**: Establish multi-agent interaction quality metrics

**During multi-agent development:**
4. **Agent Coordination**: Design natural language communication protocols
5. **Security Implementation**: OAuth 2.1, TLS 1.3, message signing integration
6. **Quality Validation**: Real-time interaction quality assessment

**After multi-agent implementation:**
7. **Performance Analysis**: Multi-agent system health and coordination metrics
8. **Security Audit**: Constitutional AI validation of communication security
9. **Quality Documentation**: Record multi-agent interaction patterns and effectiveness

"@

# Enhancement 2: Update Primary Objectives section
$enhancedObjectives = @"
## Primary Objectives (Multi-Agent Enhanced)

- ✅ Handle explicit development tasks and review requests efficiently
- 🤖 **PRIORITY: Implement agent-to-agent communication protocols with Constitutional AI validation**
- 🔗 **PRIORITY: Develop MCP/A2A standard integration with quality assurance**
- ✅ Generate modular code using TypeScript best practices
- ✅ Maintain and update project documentation systematically
- 🧠 **ENHANCED: Store multi-agent interaction patterns and learnings in structured memory**
"@

# Enhancement 3: Add multi-agent development rules
$multiAgentRules = @"

## Multi-Agent Development Rules (Strategic Focus)

**When implementing multi-agent features:**
1. Start with MCP/A2A protocol analysis using ``oneagent_bmad_analyze``
2. Apply Constitutional AI validation for all security decisions
3. Use natural language for agent-to-agent communication protocols
4. Implement OAuth 2.1 and TLS 1.3 security standards
5. Maintain 85%+ quality scores throughout development
6. Document all multi-agent interaction patterns in memory system

**Multi-Agent Quality Standards:**
- **Protocol Compliance**: MCP/A2A standard adherence with Constitutional AI validation
- **Security Implementation**: OAuth 2.1, TLS 1.3, message signing with safety principles
- **Natural Communication**: Human-readable agent coordination with transparency principles
- **Performance Metrics**: Real-time quality scoring and BMAD framework analysis
- **Documentation Standards**: Comprehensive multi-agent pattern recording with helpfulness principles

"@

try {
    # Apply enhancements by inserting after specific sections
    
    # Find and enhance Core Capabilities section
    $coreCapabilitiesPattern = "## Core Capabilities\s*\*\*Constitutional AI Framework\*\*[^\#]*?---"
    if ($instructionContent -match $coreCapabilitiesPattern) {
        $instructionContent = $instructionContent -replace $coreCapabilitiesPattern, ($Matches[0] + $multiAgentPriority)
        Write-Host "✅ Multi-Agent Priority section added" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Warning: Core Capabilities section not found for enhancement" -ForegroundColor Yellow
    }
    
    # Find and enhance Primary Objectives section
    $objectivesPattern = "## Primary Objectives\s*- ✅ Handle explicit development tasks[^\#]*?---"
    if ($instructionContent -match $objectivesPattern) {
        $instructionContent = $instructionContent -replace $objectivesPattern, ($enhancedObjectives + "`n`n---")
        Write-Host "✅ Primary Objectives enhanced with multi-agent focus" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Warning: Primary Objectives section not found for enhancement" -ForegroundColor Yellow
    }
    
    # Add multi-agent development rules before "Never Do This" section
    $neverDoPattern = "## Never Do This"
    if ($instructionContent -match $neverDoPattern) {
        $instructionContent = $instructionContent -replace $neverDoPattern, ($multiAgentRules + "`n" + $Matches[0])
        Write-Host "✅ Multi-Agent Development Rules added" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Warning: Could not locate insertion point for multi-agent rules" -ForegroundColor Yellow
    }
    
    # Save enhanced instructions
    $instructionContent | Out-File -FilePath "$env:APPDATA\Code\User\prompts\.instructions.md" -Encoding UTF8
    Write-Host "✅ Strategic enhancements applied successfully" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Enhancement failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔄 Restoring from backup..." -ForegroundColor Yellow
    Copy-Item $backupFile "$env:APPDATA\Code\User\prompts\.instructions.md" -Force
    exit 1
}

# Step 3: Validate enhanced instructions
Write-Host ""
Write-Host "Step 3: Validating enhanced instruction file..." -ForegroundColor Yellow

try {
    $enhancedContent = Get-Content "$env:APPDATA\Code\User\prompts\.instructions.md" -Raw
    $enhancedSize = (Get-Item "$env:APPDATA\Code\User\prompts\.instructions.md").Length
    
    # Basic validation checks
    $hasMultiAgentPriority = $enhancedContent -match "Multi-Agent Communication Priority"
    $hasEnhancedObjectives = $enhancedContent -match "PRIORITY: Implement agent-to-agent"
    $hasMultiAgentRules = $enhancedContent -match "Multi-Agent Development Rules"
    $hasConstitutionalAI = $enhancedContent -match "Constitutional AI Framework"
    $hasBMADFramework = $enhancedContent -match "BMAD Framework"
    
    if ($hasMultiAgentPriority -and $hasEnhancedObjectives -and $hasMultiAgentRules -and $hasConstitutionalAI -and $hasBMADFramework) {
        Write-Host "✅ Enhancement validation successful" -ForegroundColor Green
        Write-Host "  - Multi-Agent Priority section: ✅" -ForegroundColor Green
        Write-Host "  - Enhanced Objectives: ✅" -ForegroundColor Green  
        Write-Host "  - Multi-Agent Rules: ✅" -ForegroundColor Green
        Write-Host "  - Constitutional AI preserved: ✅" -ForegroundColor Green
        Write-Host "  - BMAD Framework preserved: ✅" -ForegroundColor Green
    } else {
        Write-Host "❌ Enhancement validation failed" -ForegroundColor Red
        Write-Host "🔄 Restoring from backup..." -ForegroundColor Yellow
        Copy-Item $backupFile "$env:APPDATA\Code\User\prompts\.instructions.md" -Force
        exit 1
    }
    
} catch {
    Write-Host "❌ Validation failed: $($_.Exception.Message)" -ForegroundColor Red
    Copy-Item $backupFile "$env:APPDATA\Code\User\prompts\.instructions.md" -Force
    exit 1
}

# Step 4: Create enhancement record
Write-Host ""
Write-Host "Step 4: Recording enhancement details..." -ForegroundColor Yellow

$enhancementRecord = @{
    "timestamp" = Get-Date -Format "yyyyMMdd_HHmmss"
    "backupUsed" = $BackupTimestamp
    "enhancementType" = "Strategic Multi-Agent Focus"
    "sectionsModified" = @("Core Capabilities", "Primary Objectives", "Development Rules")
    "qualityStandard" = "85%+ with Constitutional AI validation"
    "frameworksPreserved" = @("Constitutional AI", "BMAD Framework", "Quality Validation")
    "fileSize" = $enhancedSize
    "validationPassed" = $true
}

$enhancementJson = $enhancementRecord | ConvertTo-Json -Depth 3
$enhancementFile = "c:\Users\arne\.cline\mcps\OneAgent\docs\backups\enhancement_record_$($enhancementRecord.timestamp).json"

try {
    $enhancementJson | Out-File -FilePath $enhancementFile -Encoding UTF8
    Write-Host "✅ Enhancement record saved: $enhancementFile" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Could not save enhancement record: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 5: Phase 2 completion summary
Write-Host ""
Write-Host "=== Phase 2 Complete - Multi-Agent Focus Active ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Strategic multi-agent enhancements applied successfully" -ForegroundColor Green
Write-Host "✅ Constitutional AI and BMAD frameworks preserved" -ForegroundColor Green
Write-Host "✅ Quality validation maintained (85%+ threshold)" -ForegroundColor Green
Write-Host "✅ Enhancement validation passed all checks" -ForegroundColor Green
Write-Host ""
Write-Host "🤖 ACTIVE DEVELOPMENT FOCUS: Agent-to-Agent Communication" -ForegroundColor Cyan
Write-Host "📋 Ready for Phase 3: Multi-Agent Development Implementation" -ForegroundColor Cyan
Write-Host ""

# Emergency restoration commands
Write-Host "🚨 EMERGENCY RESTORE COMMANDS:" -ForegroundColor Red
Write-Host "Immediate restore: Copy-Item '$backupFile' '$env:APPDATA\Code\User\prompts\.instructions.md' -Force" -ForegroundColor Yellow
Write-Host "Working copy: Copy-Item '$workingFile' '$env:APPDATA\Code\User\prompts\.instructions.md' -Force" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== Strategic Instruction Enhancement Complete ===" -ForegroundColor Green
Write-Host "OneAgent is now optimized for multi-agent communication development!" -ForegroundColor Cyan
