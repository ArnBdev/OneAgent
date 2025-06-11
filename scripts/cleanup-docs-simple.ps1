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

# List of deprecated files to remove
$deprecatedFiles = @(
    "docs\ONEAGENT_ROADMAP_2025.md",
    "docs\STRATEGIC_IMPLEMENTATION_ROADMAP_2025.md", 
    "docs\EXECUTIVE_SUMMARY_JUNE_2025.md",
    "docs\EXECUTIVE_STATUS_SUMMARY.md",
    "docs\IMPLEMENTATION_CYCLE_SUMMARY_JUNE_10.md",
    "docs\STATUS_COMPLETE.md",
    "docs\DEVELOPMENT_REPORT.md",
    "docs\DOCUMENTATION_INDEX_JUNE_2025.md"
)

Write-Host "🗂️ Checking deprecated files..." -ForegroundColor Cyan

$filesToDelete = @()
foreach ($file in $deprecatedFiles) {
    if (Test-Path $file) {
        $filesToDelete += $file
        Write-Host "  📄 Found: $file" -ForegroundColor Yellow
    } else {
        Write-Host "  ⚪ Not found: $file" -ForegroundColor Gray
    }
}

if ($filesToDelete.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ No deprecated files found to clean up!" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "📊 Files to delete: $($filesToDelete.Count)" -ForegroundColor Yellow

# Confirm deletion
$confirmation = Read-Host "Delete these files? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Cleanup cancelled" -ForegroundColor Yellow
    exit 0
}

# Delete files
$deletedCount = 0
foreach ($file in $filesToDelete) {
    try {
        Remove-Item $file -ErrorAction Stop
        Write-Host "  ✅ Deleted: $file" -ForegroundColor Green
        $deletedCount++
    }
    catch {
        Write-Host "  ❌ Error deleting $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Cleanup Complete! Deleted $deletedCount files" -ForegroundColor Green
