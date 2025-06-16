#!/usr/bin/env pwsh
<#
.SYNOPSIS
    OneAgent System Stop Script - Graceful System Shutdown
.DESCRIPTION
    Stops all OneAgent system components gracefully:
    1. MCP Server (port 8083)
    2. Memory Server (port 8001)
    
    Includes cleanup and verification.
.PARAMETER Force
    Force stop all processes without graceful shutdown
.EXAMPLE
    .\stop-oneagent-system.ps1
    .\stop-oneagent-system.ps1 -Force
#>

param(
    [switch]$Force
)

# Script metadata
$ScriptName = "OneAgent System Stop"
$Version = "4.0.0"
$StartTime = Get-Date

Write-Host "🛑 $ScriptName v$Version" -ForegroundColor Red
Write-Host "📅 Started: $($StartTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Function: Stop service gracefully
function Stop-ServiceGracefully {
    param(
        [string]$ServiceName,
        [int]$Port,
        [string]$ProcessName
    )
    
    Write-Host "🔍 Checking $ServiceName (port $Port)..." -ForegroundColor Cyan
    
    # Try graceful shutdown first
    if (!$Force) {
        try {
            Write-Host "🤝 Attempting graceful shutdown of $ServiceName..." -ForegroundColor Yellow
            $null = Invoke-RestMethod -Uri "http://localhost:$Port/shutdown" -Method POST -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ $ServiceName shutdown signal sent" -ForegroundColor Green
            Start-Sleep -Seconds 3
        } catch {
            Write-Host "⚠️ Graceful shutdown failed, proceeding with process termination" -ForegroundColor Yellow
        }
    }
    
    # Find and stop processes
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Where-Object {
        try {
            $connections = netstat -ano | Select-String ":$Port "
            $pids = $connections | ForEach-Object { ($_ -split '\s+')[-1] }
            $pids -contains $_.Id.ToString()
        } catch {
            $false
        }
    }
    
    if ($processes) {
        foreach ($process in $processes) {
            Write-Host "⏹️ Stopping $ServiceName process (PID: $($process.Id))..." -ForegroundColor Red
            try {
                Stop-Process -Id $process.Id -Force
                Write-Host "✅ $ServiceName stopped (PID: $($process.Id))" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to stop $ServiceName process: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "ℹ️ $ServiceName not running" -ForegroundColor Gray
    }
}

# Function: Stop background jobs
function Stop-BackgroundJobs {
    Write-Host "🔍 Checking for background jobs..." -ForegroundColor Cyan
    
    $jobs = Get-Job | Where-Object { $_.Name -like "*OneAgent*" -or $_.Command -like "*oneagent*" }
    
    if ($jobs) {
        Write-Host "⏹️ Stopping $($jobs.Count) background job(s)..." -ForegroundColor Yellow
        foreach ($job in $jobs) {
            Write-Host "   Stopping job: $($job.Name) (ID: $($job.Id))" -ForegroundColor Gray
            Stop-Job -Job $job -Force
            Remove-Job -Job $job -Force
        }
        Write-Host "✅ Background jobs stopped" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ No background jobs found" -ForegroundColor Gray
    }
}

# Function: Verify shutdown
function Test-Shutdown {
    Write-Host "🔍 Verifying system shutdown..." -ForegroundColor Cyan
    
    $allStopped = $true
    
    # Check Memory Server
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:8001/health" -TimeoutSec 3
        Write-Host "⚠️ Memory Server still responding" -ForegroundColor Yellow
        $allStopped = $false
    } catch {
        Write-Host "✅ Memory Server stopped" -ForegroundColor Green
    }
    
    # Check MCP Server
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:8083/health" -TimeoutSec 3
        Write-Host "⚠️ MCP Server still responding" -ForegroundColor Yellow
        $allStopped = $false
    } catch {
        Write-Host "✅ MCP Server stopped" -ForegroundColor Green
    }
    
    return $allStopped
}

# Function: Cleanup resources
function Invoke-Cleanup {
    Write-Host "🧹 Performing cleanup..." -ForegroundColor Cyan
    
    # Clear any temporary files
    if (Test-Path "*.tmp") {
        Remove-Item "*.tmp" -Force -ErrorAction SilentlyContinue
    }
    
    # Clear any lock files
    if (Test-Path "*.lock") {
        Remove-Item "*.lock" -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
}

# Main execution
try {
    Write-Host "🎯 Stopping OneAgent system..." -ForegroundColor Yellow
    
    if ($Force) {
        Write-Host "⚡ Force mode enabled - immediate termination" -ForegroundColor Red
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    # Stop services in reverse order (MCP first, then Memory)
    Stop-ServiceGracefully -ServiceName "MCP Server" -Port 8083 -ProcessName "node"
    Stop-ServiceGracefully -ServiceName "Memory Server" -Port 8001 -ProcessName "python"
    
    # Stop background jobs
    Stop-BackgroundJobs
    
    # Cleanup
    Invoke-Cleanup
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    # Verify shutdown
    if (Test-Shutdown) {
        Write-Host "✅ OneAgent system completely stopped" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Some services may still be running. Use -Force to terminate forcefully." -ForegroundColor Yellow
    }
    
    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime
    Write-Host "⏱️ Shutdown completed in $($Duration.TotalSeconds.ToString('F2')) seconds" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Shutdown failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running with -Force parameter" -ForegroundColor Yellow
    exit 1
}
