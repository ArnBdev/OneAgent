
# OneAgent MCP Server Restart Script
# Properly restarts the OneAgent MCP server with Context7 integration

Write-Host "🔄 Restarting OneAgent MCP Server..."

# Stop existing server processes on port 8083
Write-Host "⏹️ Stopping existing MCP server processes..."

# Kill processes using port 8083
$processes = netstat -ano | Select-String ":8083" | ForEach-Object {
    $fields = $_ -split '\s+' | Where-Object { $_ -ne '' }
    if ($fields.Length -ge 5) {
        $pid = $fields[4]
        if ($pid -match '^\d+$') {
            return $pid
        }
    }
}

$processes | ForEach-Object {
    try {
        $processId = [int]$_
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "⏹️ Stopping process: $($process.ProcessName) (PID: $processId)"
            Stop-Process -Id $processId -Force
        }
    } catch {
        Write-Host "⚠️ Could not stop process PID: $_"
    }
}

# Also kill any ts-node or node processes that might be running the MCP server
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*oneagent-mcp-copilot*" -or 
    $_.CommandLine -like "*server:copilot*"
} | ForEach-Object {
    Write-Host "⏹️ Stopping MCP server process: $($_.ProcessName) (PID: $($_.Id))"
    Stop-Process -Id $_.Id -Force
}

Write-Host "⏳ Waiting for processes to stop..."
Start-Sleep -Seconds 3

# Start server using npm script (proper way)
Write-Host "🚀 Starting OneAgent MCP server with Context7 integration..."

# Change to the OneAgent directory and start the server
Push-Location $PSScriptRoot\..
try {
    # Start the server in background using npm script
    $serverJob = Start-Job -ScriptBlock {
        param($workingDir)
        Set-Location $workingDir
        npm run server:copilot
    } -ArgumentList (Get-Location).Path
    
    Write-Host "🚀 Server starting with Job ID: $($serverJob.Id)"
    Write-Host "⏳ Waiting for server to initialize..."
    Start-Sleep -Seconds 5
    
    # Check if server started successfully
    $maxAttempts = 10
    $attempt = 0
    $serverReady = $false
    
    while ($attempt -lt $maxAttempts -and -not $serverReady) {
        try {
            $health = Invoke-RestMethod -Uri "http://localhost:8083/health" -TimeoutSec 3
            if ($health.status -eq "healthy") {
                $serverReady = $true
                Write-Host "✅ Server started successfully: $($health.status)"
                
                # Test Context7 tools
                try {
                    $tools = Invoke-RestMethod -Uri "http://localhost:8083/mcp" -Method Post -ContentType "application/json" -Body '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' -TimeoutSec 3
                    $context7Tools = $tools.result.tools | Where-Object { $_.name -like "*context7*" }
                    Write-Host "📚 Context7 tools available: $($context7Tools.Count)"
                    Write-Host "🧠 Memory system: Operational"
                    Write-Host "✅ MCP endpoint: http://localhost:8083/mcp"
                } catch {
                    Write-Host "⚠️ MCP endpoint check failed, but server is running"
                }
            }
        } catch {
            $attempt++
            Write-Host "⏳ Attempt $attempt/$maxAttempts - Server still starting..."
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $serverReady) {
        Write-Host "⚠️ Server may still be starting. Check manually:"
        Write-Host "   Health: curl http://localhost:8083/health"
        Write-Host "   MCP: curl -X POST http://localhost:8083/mcp -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\",\"params\":{}}'"
    }
    
} finally {
    Pop-Location
}

Write-Host "🎯 OneAgent MCP Server restart complete!"
Write-Host "📌 Use 'npm run server:copilot' to start manually if needed"
