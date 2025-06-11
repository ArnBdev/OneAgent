# OneAgent Documentation Cleanup Script
# Safely removes deprecated documentation files after consolidation

Write-Host "🧹 OneAgent Documentation Cleanup Script" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the correct directory
if (!(Test-Path "docs\ONEAGENT_MASTER_GUIDE.md")) {
    Write-Host "❌ Error: Not in OneAgent root directory" -ForegroundColor Red
    Write-Host "Please run this script from the OneAgent project root" -ForegroundColor Yellow
    exit 1
}

# Verify core consolidated documents exist
$coreDocuments = @(
    "docs\ONEAGENT_MASTER_GUIDE.md",
    "docs\REVOLUTIONARY_AI_TECHNICAL_REFERENCE.md", 
    "docs\MCP_SYSTEM_GUIDE.md",
    "docs\DEVELOPMENT_GUIDELINES.md",
    "docs\GITHUB_SETUP_GUIDE.md"
)

Write-Host "✅ Verifying core documents exist..." -ForegroundColor Cyan
foreach ($doc in $coreDocuments) {
    if (Test-Path $doc) {
        Write-Host "  ✓ $doc" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Missing: $doc" -ForegroundColor Red
        Write-Host "Aborting cleanup - core documents not found" -ForegroundColor Yellow
        exit 1
    }
}

# List of deprecated files to remove (based on audit report)
$deprecatedFiles = @(
    # Multiple Roadmaps
    "docs\ONEAGENT_ROADMAP_2025.md",
    "docs\STRATEGIC_IMPLEMENTATION_ROADMAP_2025.md",
    "docs\BMAD_INTEGRATION_ROADMAP.md",
    
    # Status Reports  
    "docs\IMPLEMENTATION_CYCLE_SUMMARY_JUNE_10.md",
    "docs\MILESTONE_1_4_COMPLETION_REPORT.md",
    "docs\STATUS_COMPLETE.md",
    "docs\REORGANIZATION_COMPLETE.md",
    "docs\DEVAGENT_PRODUCTION_DEPLOYMENT_COMPLETE.md",
    "docs\PROJECT_STATUS_UPDATE_JUNE_2025.md",
    "docs\LEVEL_2_INTEGRATION_STATUS.md",
    "docs\LEVEL_2_DEVELOPMENT_PLAN.md",
    "docs\LEVEL_2_MILESTONE_PLAN.md",
    "docs\DEVELOPMENT_REPORT.md",
    "docs\CONTEXT7_MCP_ENHANCEMENT_WEEK_1_2_COMPLETE.md",
    "docs\IMPLEMENTATION_COMPLETE_REPORT.md",
    
    # Executive Summaries
    "docs\EXECUTIVE_SUMMARY_JUNE_2025.md",
    "docs\EXECUTIVE_STATUS_SUMMARY.md",
    "docs\QUICK_REFERENCE_CURRENT.md",
    "docs\QUICK_REFERENCE.md",
    
    # Implementation Plans
    "docs\DEVAGENT_IMPLEMENTATION_PROPOSAL.md",
    "docs\DEVAGENT_IMPLEMENTATION_STARTER.md", 
    "docs\DEVAGENT_IMPLEMENTATION_PLAN.md",
    "docs\DEVAGENT_IMPLEMENTATION_DECISION.md",
    "docs\CONTEXT7_MCP_ENHANCEMENT_PROPOSAL.md",
    "docs\MCP_TOOL_EXPANSION_PLAN.md",
    "docs\COPILOT_STARTER.md",
    "docs\COPILOT_GUIDANCE_LEVEL_2.md",
    
    # Technical Documentation  
    "docs\EMBEDDINGS_IMPLEMENTATION.md",
    "docs\AI_AGENT_MEMORY_RESEARCH_ANALYSIS.md",
    "docs\MEM0_INTEGRATION_REPORT.md",
    "docs\MEM0_BUG_TRACKER.md",
    "docs\MVS_ARCHITECTURE_DESIGN.md",
    "docs\AUTOMATED_STRUCTURE.md",
    "docs\COMPLETE_FILE_STRUCTURE_REPORT.md",
    "docs\MCP_TOOL_EXPANSION_COMPLETION_REPORT.md",
    "docs\ONEAGENT_MCP_COPILOT_COMPLETION_REPORT.md",
    
    # Duplicate/Outdated
    "docs\DOCUMENTATION_INDEX_JUNE_2025.md",
    "docs\README_GITHUB.md",
    "docs\ONEAGENT_UI_SHADCN_STRATEGY.md",
    "docs\ONEAGENT_PORT_ARCHITECTURE.md"
)

Write-Host ""
Write-Host "🗂️ Checking deprecated files..." -ForegroundColor Cyan

$filesToDelete = @()
$missingFiles = @()

foreach ($file in $deprecatedFiles) {
    if (Test-Path $file) {
        $filesToDelete += $file
        Write-Host "  📄 Found: $file" -ForegroundColor Yellow
    } else {
        $missingFiles += $file
        Write-Host "  ⚪ Not found: $file" -ForegroundColor Gray
    }
}

if ($filesToDelete.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ No deprecated files found to clean up!" -ForegroundColor Green
    Write-Host "Documentation consolidation appears to be complete." -ForegroundColor Cyan
    exit 0
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  Files to delete: $($filesToDelete.Count)" -ForegroundColor Yellow
Write-Host "  Already removed: $($missingFiles.Count)" -ForegroundColor Gray
Write-Host ""

# Confirm deletion
$confirmation = Read-Host "Delete $($filesToDelete.Count) deprecated files? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Cleanup cancelled by user" -ForegroundColor Yellow
    exit 0
}

# Create backup directory
$backupDir = "temp\documentation-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
if (!(Test-Path "temp")) {
    New-Item -ItemType Directory -Path "temp" | Out-Null
}
New-Item -ItemType Directory -Path $backupDir | Out-Null

Write-Host ""
Write-Host "📦 Creating backup in $backupDir..." -ForegroundColor Cyan

# Backup and delete files
$deletedCount = 0
foreach ($file in $filesToDelete) {
    try {
        # Create backup
        $fileName = Split-Path $file -Leaf
        Copy-Item $file "$backupDir\$fileName" -ErrorAction Stop
        
        # Delete original
        Remove-Item $file -ErrorAction Stop
        
        Write-Host "  ✅ Deleted: $file" -ForegroundColor Green
        $deletedCount++
    }
    catch {
        Write-Host "  ❌ Error deleting $file`: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Cleanup Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Deleted files: $deletedCount" -ForegroundColor Cyan
Write-Host "  Backup location: $backupDir" -ForegroundColor Cyan
Write-Host "  Core documents: ✅ Preserved" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Consolidated Documentation Structure:" -ForegroundColor Cyan
Write-Host "  1. ONEAGENT_MASTER_GUIDE.md - Complete system overview" -ForegroundColor White
Write-Host "  2. REVOLUTIONARY_AI_TECHNICAL_REFERENCE.md - Technical implementation" -ForegroundColor White  
Write-Host "  3. MCP_SYSTEM_GUIDE.md - MCP integration reference" -ForegroundColor White
Write-Host "  4. DEVELOPMENT_GUIDELINES.md - Development standards" -ForegroundColor White
Write-Host "  5. GITHUB_SETUP_GUIDE.md - Setup and deployment guide" -ForegroundColor White
Write-Host ""
Write-Host "🚀 OneAgent v4.0.0 Documentation Consolidation Complete!" -ForegroundColor Green
