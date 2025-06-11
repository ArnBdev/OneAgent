# OneAgent Documentation Mass Cleanup Script
# Removes 54 deprecated files while preserving 9 essential documents

Write-Host "🧹 OneAgent Documentation Mass Cleanup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Essential files to KEEP (9 total)
$essentialFiles = @(
    # Core consolidated documents (5)
    "docs\ONEAGENT_MASTER_GUIDE.md",
    "docs\REVOLUTIONARY_AI_TECHNICAL_REFERENCE.md",
    "docs\MCP_SYSTEM_GUIDE.md", 
    "docs\DEVELOPMENT_GUIDELINES.md",
    "docs\GITHUB_SETUP_GUIDE.md",
    
    # Essential references (4)
    "docs\# Code Citations.md",
    "docs\ONEAGENT_DOCUMENTATION_AUDIT_REPORT.md",
    "docs\MCP_ADAPTERS_EXPLAINED.md",
    "docs\MCP_IMPLEMENTATION_LEARNINGS.md"
)

Write-Host "✅ Essential files to preserve:" -ForegroundColor Cyan
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $(Split-Path $file -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Missing essential file: $(Split-Path $file -Leaf)" -ForegroundColor Red
    }
}

# Get all files in docs folder
$allFiles = Get-ChildItem -Path "docs\" -File | ForEach-Object { "docs\$($_.Name)" }

# Find files to delete (everything NOT in essential list)
$filesToDelete = @()
foreach ($file in $allFiles) {
    if ($essentialFiles -notcontains $file) {
        $filesToDelete += $file
    }
}

Write-Host ""
Write-Host "📊 Cleanup Summary:" -ForegroundColor Cyan
Write-Host "  Total files: $($allFiles.Count)" -ForegroundColor White
Write-Host "  Essential (keep): $($essentialFiles.Count)" -ForegroundColor Green
Write-Host "  Deprecated (delete): $($filesToDelete.Count)" -ForegroundColor Yellow

if ($filesToDelete.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ No files to clean up! Documentation already optimized." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "🗂️ Files to be deleted:" -ForegroundColor Yellow
foreach ($file in $filesToDelete) {
    Write-Host "  📄 $(Split-Path $file -Leaf)" -ForegroundColor Gray
}

Write-Host ""
$confirmation = Read-Host "🚨 DELETE $($filesToDelete.Count) files? This will clean up the documentation to only essential files (y/N)"

if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Cleanup cancelled" -ForegroundColor Yellow
    exit 0
}

# Create backup
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$backupDir = "temp\docs-cleanup-backup-$timestamp"
if (!(Test-Path "temp")) { New-Item -ItemType Directory -Path "temp" | Out-Null }
New-Item -ItemType Directory -Path $backupDir | Out-Null

Write-Host ""
Write-Host "📦 Creating backup..." -ForegroundColor Cyan

# Backup and delete files
$deletedCount = 0
$backupCount = 0

foreach ($file in $filesToDelete) {
    try {
        $fileName = Split-Path $file -Leaf
        
        # Create backup
        Copy-Item $file "$backupDir\$fileName" -ErrorAction Stop
        $backupCount++
        
        # Delete original
        Remove-Item $file -ErrorAction Stop
        $deletedCount++
        
        if ($deletedCount % 10 -eq 0) {
            Write-Host "  Processed $deletedCount files..." -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "  ❌ Error processing $fileName" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Documentation Cleanup Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "  Deleted: $deletedCount files" -ForegroundColor Cyan
Write-Host "  Backed up: $backupCount files" -ForegroundColor Cyan
Write-Host "  Backup location: $backupDir" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Final Documentation Structure (9 files):" -ForegroundColor Green
Write-Host "  ✅ ONEAGENT_MASTER_GUIDE.md - Complete system overview" -ForegroundColor White
Write-Host "  ✅ REVOLUTIONARY_AI_TECHNICAL_REFERENCE.md - Technical implementation" -ForegroundColor White
Write-Host "  ✅ MCP_SYSTEM_GUIDE.md - MCP tools and integration" -ForegroundColor White
Write-Host "  ✅ DEVELOPMENT_GUIDELINES.md - Development standards" -ForegroundColor White
Write-Host "  ✅ GITHUB_SETUP_GUIDE.md - Setup and deployment" -ForegroundColor White
Write-Host "  ✅ # Code Citations.md - License compliance" -ForegroundColor White
Write-Host "  ✅ ONEAGENT_DOCUMENTATION_AUDIT_REPORT.md - Audit history" -ForegroundColor White
Write-Host "  ✅ MCP_ADAPTERS_EXPLAINED.md - Technical reference" -ForegroundColor White
Write-Host "  ✅ MCP_IMPLEMENTATION_LEARNINGS.md - Technical reference" -ForegroundColor White
Write-Host ""
Write-Host "🚀 OneAgent v4.0.0 Documentation: FULLY OPTIMIZED!" -ForegroundColor Green
