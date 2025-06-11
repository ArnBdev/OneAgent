# OneAgent Comprehensive Project Structure Cleanup
# Organizes files according to professional standards and best practices

Write-Host "🧹 OneAgent Comprehensive Project Structure Cleanup" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Define target structure
$moves = @{
    # Test files to tests/ directory
    "debug_test.js" = "tests\"
    "simple_test.js" = "tests\"
    "test_all_oneagent_features.js" = "tests\"
    "test_mcp_connection.js" = "tests\"
    "test_new_mcp_tools.js" = "tests\"
    "test_webfetch_compiled.js" = "tests\"
    "test_webfetch_tool.js" = "tests\"
    "test-chat-api.js" = "tests\"
    "webfetch_verification.js" = "tests\"
    
    # Configuration files to config/ directory (if exists)
    "tsconfig.json" = "."  # Keep in root (standard)
    "vite.config.ts" = "."  # Keep in root (standard)
    "package.json" = "."   # Keep in root (standard)
    
    # Reports to docs/reports/
    "IMPLEMENTATION_COMPLETE_REPORT.md" = "docs\reports\"
    "oneagent_mcp_verification_report.md" = "docs\reports\"
    "troubleshoot_cline_mcp.md" = "docs\reports\"
    
    # TypeScript server files to appropriate directories
    "test-mcp-copilot-server.ts" = "tests\"
}

# Additional cleanup files (delete or move to temp)
$cleanupFiles = @(
    "ersarne.clinemcpsOneAgent; git push origin main",
    "test_tools_list.json",
    "test_health_request.json",
    "test-mcp-request.json"
)

Write-Host "📊 Project Structure Analysis:" -ForegroundColor Cyan
Write-Host "  Root files to organize: $($moves.Count)" -ForegroundColor White
Write-Host "  Cleanup files: $($cleanupFiles.Count)" -ForegroundColor White

# Create necessary directories
$directories = @("tests", "docs\production", "docs\technical", "docs\research", "docs\reports")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  📁 Created: $dir" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔄 Moving files to appropriate directories..." -ForegroundColor Cyan

# Move files according to plan
$movedCount = 0
foreach ($file in $moves.Keys) {
    if (Test-Path $file) {
        $destination = $moves[$file]
        try {
            Move-Item $file $destination -ErrorAction Stop
            Write-Host "  ✅ $file → $destination" -ForegroundColor Green
            $movedCount++
        }
        catch {
            Write-Host "  ❌ Failed to move $file : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "  ⚠️ Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🗑️ Cleaning up temporary/invalid files..." -ForegroundColor Cyan

# Clean up problematic files
$cleanedCount = 0
foreach ($file in $cleanupFiles) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -ErrorAction Stop
            Write-Host "  🗑️ Removed: $file" -ForegroundColor Gray
            $cleanedCount++
        }
        catch {
            Write-Host "  ❌ Failed to remove $file : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "📋 Creating documentation index files..." -ForegroundColor Cyan

# Create README files for documentation structure
$productionReadme = @"
# Production Documentation

This directory contains production-ready documentation for OneAgent v4.0.0.

## Files

- **ONEAGENT_MASTER_GUIDE.md** - Complete system overview and user guide
- **DEVELOPMENT_GUIDELINES.md** - Development standards and best practices  
- **GITHUB_SETUP_GUIDE.md** - Setup and deployment instructions
- **# Code Citations.md** - License compliance and attribution

## Usage

These documents are the primary reference for:
- System administrators
- Developers integrating OneAgent
- Production deployment teams
- End users

## Maintenance

Keep these files updated with each major release.
"@

$technicalReadme = @"
# Technical Documentation

This directory contains technical implementation details and system architecture documentation.

## Files

- **REVOLUTIONARY_AI_TECHNICAL_REFERENCE.md** - Technical implementation details
- **MCP_SYSTEM_GUIDE.md** - MCP tools and integration guide
- **MCP_ADAPTERS_EXPLAINED.md** - Technical reference for MCP adapters

## Audience

- Software architects
- System integrators  
- Advanced developers
- Technical leads

## Maintenance

Update when system architecture changes or new technical features are added.
"@

$researchReadme = @"
# Research Documentation

This directory contains research notes, analysis, and learnings from OneAgent development.

## Files

- **MCP_IMPLEMENTATION_LEARNINGS.md** - Technical learnings and insights

## Purpose

- Document research findings
- Store analysis and investigations
- Preserve knowledge for future reference
- Support continuous improvement

## Guidelines

- Add new research with dates and context
- Link to relevant production documentation
- Include actionable insights
"@

$reportsReadme = @"
# Reports and Analysis

This directory contains project reports, audit results, and verification documentation.

## Files

- **ONEAGENT_DOCUMENTATION_AUDIT_REPORT.md** - Documentation audit results
- **IMPLEMENTATION_COMPLETE_REPORT.md** - Project completion report
- **oneagent_mcp_verification_report.md** - MCP system verification
- **troubleshoot_cline_mcp.md** - Troubleshooting documentation

## Purpose

- Track project progress
- Document verification results
- Store audit findings
- Maintain historical records

## Retention

Reports should be retained for project lifecycle documentation.
"@

# Write README files
@{
    "docs\production\README.md" = $productionReadme
    "docs\technical\README.md" = $technicalReadme
    "docs\research\README.md" = $researchReadme
    "docs\reports\README.md" = $reportsReadme
} | ForEach-Object {
    $_.GetEnumerator() | ForEach-Object {
        Set-Content -Path $_.Key -Value $_.Value -Encoding UTF8
        Write-Host "  📄 Created: $($_.Key)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📁 Creating tests directory structure..." -ForegroundColor Cyan

# Create test directory README
$testsReadme = @"
# OneAgent Test Suite

This directory contains all test files and verification scripts for OneAgent.

## Structure

- **Unit Tests**: Component-level testing
- **Integration Tests**: System integration validation  
- **MCP Tests**: MCP server and tool testing
- **Performance Tests**: Performance benchmarking
- **Verification Scripts**: System verification and health checks

## Running Tests

See individual test files for execution instructions.

## Guidelines

- Keep tests focused and isolated
- Document test purpose and expected outcomes
- Update tests when functionality changes
- Maintain test documentation
"@

Set-Content -Path "tests\README.md" -Value $testsReadme -Encoding UTF8
Write-Host "  📄 Created: tests\README.md" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Project Structure Cleanup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  Files moved: $movedCount" -ForegroundColor Cyan
Write-Host "  Files cleaned: $cleanedCount" -ForegroundColor Cyan
Write-Host "  Documentation structured: ✅" -ForegroundColor Green
Write-Host "  Test organization: ✅" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Final Project Structure:" -ForegroundColor Green
Write-Host "  📁 docs/" -ForegroundColor White
Write-Host "    📁 production/ - Production documentation" -ForegroundColor Gray
Write-Host "    📁 technical/ - Technical implementation docs" -ForegroundColor Gray  
Write-Host "    📁 research/ - Research notes and learnings" -ForegroundColor Gray
Write-Host "    📁 reports/ - Project reports and audits" -ForegroundColor Gray
Write-Host "  📁 tests/ - All test files and verification scripts" -ForegroundColor White
Write-Host "  📁 coreagent/ - Core system implementation" -ForegroundColor White
Write-Host "  📁 scripts/ - Utility and development scripts" -ForegroundColor White
Write-Host "  📄 Root config files (package.json, tsconfig.json, etc.)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 OneAgent v4.0.0: Professional Project Structure Complete!" -ForegroundColor Green
