
# OneAgent MCP Server Restart Script
# Applies memory performance fixes immediately

Write-Host "🔄 Restarting OneAgent MCP Server with Memory Performance Fixes..."

# Stop existing server
$existingProcess = Get-Process -Name "node" | Where-Object { $_.CommandLine -like "*8083*" } -ErrorAction SilentlyContinue
if ($existingProcess) {
    Stop-Process -Id $existingProcess.Id -Force
    Write-Host "⏹️ Stopped existing server (PID: $($existingProcess.Id))"
    Start-Sleep -Seconds 2
}

# Start server with optimizations
Write-Host "🚀 Starting optimized OneAgent MCP server..."
Start-Process -FilePath "node" -ArgumentList "coreagent/server/oneagent-mcp-copilot.ts" -WorkingDirectory "$PWD" -WindowStyle Hidden

Start-Sleep -Seconds 3

# Check if server started successfully
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8083/health" -TimeoutSec 5
    Write-Host "✅ Server started successfully: $($health.status)"
    Write-Host "🧠 Memory system performance: Optimized with relaxed thresholds"
} catch {
    Write-Host "⚠️ Server may still be starting... Check manually with: curl http://localhost:8083/health"
}
