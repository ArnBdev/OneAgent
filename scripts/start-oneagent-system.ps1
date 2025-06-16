#!/usr/bin/env pwsh
<#
.SYNOPSIS
    OneAgent System Startup Script - Complete System Launch
.DESCRIPTION
    Starts the complete OneAgent system in proper sequence:
    1. Memory Server (Python FastAPI on port 8001)
    2. MCP Server (TypeScript on port 8083)
    
    Includes health checks, error handling, and status monitoring.
.PARAMETER SkipDependencies
    Skip dependency installation check
.PARAMETER MemoryOnly
    Start only the memory server
.PARAMETER MCPOnly
    Start only the MCP server (requires memory server running)
.EXAMPLE
    .\start-oneagent-system.ps1
    .\start-oneagent-system.ps1 -SkipDependencies
    .\start-oneagent-system.ps1 -MemoryOnly
#>

param(
    [switch]$SkipDependencies,
    [switch]$MemoryOnly,
    [switch]$MCPOnly
)

# Set error handling
$ErrorActionPreference = "Stop"

# Script metadata
$ScriptName = "OneAgent System Startup"
$Version = "4.0.0"
$StartTime = Get-Date

Write-Host "🚀 $ScriptName v$Version" -ForegroundColor Green
Write-Host "📅 Started: $($StartTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Change to project root
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
Write-Host "📁 Project Root: $ProjectRoot" -ForegroundColor Blue

# Function: Check dependencies
function Test-Dependencies {
    Write-Host "🔍 Checking dependencies..." -ForegroundColor Cyan
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
        exit 1
    }
    
    # Check Python
    try {
        $pythonVersion = python --version
        Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
        exit 1
    }
    
    # Check Node modules
    if (!(Test-Path "node_modules")) {
        Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
        npm install
        Write-Host "✅ Node.js dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✅ Node.js dependencies: Ready" -ForegroundColor Green
    }
    
    # Check Python dependencies
    Write-Host "📦 Checking Python dependencies..." -ForegroundColor Yellow
    try {
        python -c "import fastapi, chromadb, google.generativeai; print('✅ Python dependencies: Ready')"
        Write-Host "✅ Python dependencies: Ready" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Installing Python dependencies..." -ForegroundColor Yellow
        pip install fastapi uvicorn chromadb google-generativeai python-dotenv pydantic
        Write-Host "✅ Python dependencies installed" -ForegroundColor Green
    }
}

# Function: Check if port is available
function Test-Port {
    param([int]$Port)
    
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

# Function: Wait for service to be ready
function Wait-ForService {
    param(
        [string]$ServiceName,
        [string]$HealthUrl,
        [int]$TimeoutSeconds = 30
    )
    
    Write-Host "⏳ Waiting for $ServiceName to be ready..." -ForegroundColor Yellow
    $timeout = (Get-Date).AddSeconds($TimeoutSeconds)
    
    while ((Get-Date) -lt $timeout) {
        try {
            $response = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 5 -ErrorAction Stop
            if ($response.status -eq "healthy" -or $response.status -eq "ok") {
                Write-Host "✅ $ServiceName is ready!" -ForegroundColor Green
                return $true
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host "❌ $ServiceName failed to start within $TimeoutSeconds seconds" -ForegroundColor Red
    return $false
}

# Function: Start Memory Server
function Start-MemoryServer {
    Write-Host "🧠 Starting Memory Server..." -ForegroundColor Magenta
    
    # Check if already running
    if (!(Test-Port -Port 8001)) {
        Write-Host "⚠️ Port 8001 is in use. Checking if it's our memory server..." -ForegroundColor Yellow
        try {
            $health = Invoke-RestMethod -Uri "http://localhost:8001/health" -TimeoutSec 5
            if ($health.service -eq "OneAgent Memory Server") {
                Write-Host "✅ Memory Server already running" -ForegroundColor Green
                return $true
            }
        } catch {}
        
        Write-Host "❌ Port 8001 is occupied by another service" -ForegroundColor Red
        return $false
    }
    
    # Start memory server
    Write-Host "🚀 Starting Memory Server on port 8001..." -ForegroundColor Cyan
    $memoryJob = Start-Job -ScriptBlock {
        Set-Location $using:ProjectRoot
        python servers/oneagent_memory_server.py
    }
    
    # Wait for memory server to be ready
    if (Wait-ForService -ServiceName "Memory Server" -HealthUrl "http://localhost:8001/health") {
        Write-Host "✅ Memory Server started successfully (Job ID: $($memoryJob.Id))" -ForegroundColor Green
        return $true
    } else {
        Stop-Job -Job $memoryJob -Force
        Remove-Job -Job $memoryJob -Force
        return $false
    }
}

# Function: Start MCP Server
function Start-MCPServer {
    Write-Host "🤖 Starting MCP Server..." -ForegroundColor Blue
    
    # Check if already running
    if (!(Test-Port -Port 8083)) {
        Write-Host "⚠️ Port 8083 is in use. Checking if it's our MCP server..." -ForegroundColor Yellow
        try {
            $health = Invoke-RestMethod -Uri "http://localhost:8083/health" -TimeoutSec 5
            if ($health.service -eq "OneAgent MCP Server") {
                Write-Host "✅ MCP Server already running" -ForegroundColor Green
                return $true
            }
        } catch {}
        
        Write-Host "❌ Port 8083 is occupied by another service" -ForegroundColor Red
        return $false
    }
    
    # Start MCP server
    Write-Host "🚀 Starting MCP Server on port 8083..." -ForegroundColor Cyan
    $mcpJob = Start-Job -ScriptBlock {
        Set-Location $using:ProjectRoot
        npx ts-node coreagent/server/oneagent-mcp-copilot.ts
    }
    
    # Wait for MCP server to be ready
    if (Wait-ForService -ServiceName "MCP Server" -HealthUrl "http://localhost:8083/health") {
        Write-Host "✅ MCP Server started successfully (Job ID: $($mcpJob.Id))" -ForegroundColor Green
        return $true
    } else {
        Stop-Job -Job $mcpJob -Force
        Remove-Job -Job $mcpJob -Force
        return $false
    }
}

# Function: Display status
function Show-SystemStatus {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📊 OneAgent System Status" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    # Memory Server Status
    try {
        $memHealth = Invoke-RestMethod -Uri "http://localhost:8001/health" -TimeoutSec 5
        Write-Host "🧠 Memory Server: ✅ Running (v$($memHealth.version))" -ForegroundColor Green
        Write-Host "   📍 URL: http://localhost:8001" -ForegroundColor Gray
    } catch {
        Write-Host "🧠 Memory Server: ❌ Not responding" -ForegroundColor Red
    }
    
    # MCP Server Status
    try {
        $mcpHealth = Invoke-RestMethod -Uri "http://localhost:8083/health" -TimeoutSec 5
        Write-Host "🤖 MCP Server: ✅ Running (v$($mcpHealth.version))" -ForegroundColor Green
        Write-Host "   📍 URL: http://localhost:8083/mcp" -ForegroundColor Gray
    } catch {
        Write-Host "🤖 MCP Server: ❌ Not responding" -ForegroundColor Red
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "💡 Use 'scripts\stop-oneagent-system.ps1' to stop all services" -ForegroundColor Yellow
    Write-Host "💡 Use 'scripts\status-oneagent-system.ps1' to check status" -ForegroundColor Yellow
    Write-Host "💡 Logs are in the 'logs/' directory" -ForegroundColor Yellow
}

# Main execution
try {
    # Check dependencies (unless skipped)
    if (!$SkipDependencies) {
        Test-Dependencies
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    # Start services based on parameters
    if ($MCPOnly) {
        Write-Host "🎯 Starting MCP Server only..." -ForegroundColor Yellow
        if (!(Start-MCPServer)) {
            exit 1
        }
    } elseif ($MemoryOnly) {
        Write-Host "🎯 Starting Memory Server only..." -ForegroundColor Yellow
        if (!(Start-MemoryServer)) {
            exit 1
        }
    } else {
        Write-Host "🎯 Starting complete OneAgent system..." -ForegroundColor Yellow
        
        # Start Memory Server first
        if (!(Start-MemoryServer)) {
            Write-Host "❌ Failed to start Memory Server. Aborting." -ForegroundColor Red
            exit 1
        }
        
        # Start MCP Server second
        if (!(Start-MCPServer)) {
            Write-Host "❌ Failed to start MCP Server. System partially running." -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    # Show final status
    Show-SystemStatus
    
    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime
    Write-Host "⏱️ Total startup time: $($Duration.TotalSeconds.ToString('F2')) seconds" -ForegroundColor Cyan
    Write-Host "🎉 OneAgent system is ready for use!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Startup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Check the logs for more details" -ForegroundColor Yellow
    exit 1
}
