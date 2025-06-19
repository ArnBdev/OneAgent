# OneAgent pre-commit hook - validates project structure (PowerShell)

Write-Host "🔍 Validating project structure..." -ForegroundColor Cyan

# Run structure validation
$result = npm run validate-structure
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "❌ Project structure validation failed!" -ForegroundColor Red
    Write-Host "💡 Run 'npm run fix-structure' to auto-fix violations" -ForegroundColor Yellow
    Write-Host "🔧 Or run 'npm run fix-structure:dry' to preview changes" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To bypass this check (emergency only):" -ForegroundColor Magenta
    Write-Host "git commit --no-verify -m 'your message'" -ForegroundColor Magenta
    exit 1
}

Write-Host "✅ Project structure validation passed!" -ForegroundColor Green
