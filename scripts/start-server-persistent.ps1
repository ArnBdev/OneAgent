# OneAgent MCP Server - Persistent Startup Script
# This script runs the server and keeps it alive

Write-Host "🚀 Starting OneAgent MCP Server (Persistent Mode)`n" -ForegroundColor Green

# Set required environment variables
$env:ONEAGENT_DISABLE_AUTO_MONITORING = '1'
$env:ONEAGENT_SKIP_MEMORY_PROBE = '1'

# Navigate to project root
Set-Location $PSScriptRoot\..

Write-Host "📍 Working Directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "📦 Running: npm run server:unified`n" -ForegroundColor Cyan

# Run the server
# Note: This will block until the server exits
npm run server:unified

Write-Host "`n⚠️ Server exited with code: $LASTEXITCODE" -ForegroundColor Yellow

# If you want the server to auto-restart on exit, uncomment below:
# while ($true) {
#     Write-Host "`n🔄 Restarting server..." -ForegroundColor Yellow
#     npm run server:unified
#     Start-Sleep -Seconds 2
# }
