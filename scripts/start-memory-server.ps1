#!/usr/bin/env pwsh
<#
.SYNOPSIS
    OneAgent Memory Server Startup Script
.DESCRIPTION
    Starts only the OneAgent Memory Server (FastAPI Python server on port 8001).
    Useful for standalone memory server operations or testing.
.PARAMETER Port
    Custom port for memory server (default: 8001)
.PARAMETER SkipDependencies
    Skip dependency installation check
.EXAMPLE
    .\start-memory-server.ps1
    .\start-memory-server.ps1 -Port 8002
#>

param(
    [int]$Port = 8001,
    [switch]$SkipDependencies
)

# Script metadata
$ScriptName = "OneAgent Memory Server"
$Version = "4.0.0"

Write-Host "🧠 $ScriptName v$Version" -ForegroundColor Magenta
Write-Host "📍 Port: $Port" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Change to project root
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# Check dependencies
if (!$SkipDependencies) {
    Write-Host "🔍 Checking Python dependencies..." -ForegroundColor Cyan
    try {
        python -c "import fastapi, chromadb, google.generativeai; print('✅ Dependencies ready')"
    } catch {
        Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
        pip install fastapi uvicorn chromadb google-generativeai python-dotenv pydantic
    }
}

# Set environment variable for custom port
if ($Port -ne 8001) {
    $env:MEMORY_SERVER_PORT = $Port
}

# Start memory server
Write-Host "🚀 Starting Memory Server..." -ForegroundColor Green
Write-Host "🔗 Health check: http://localhost:$Port/health" -ForegroundColor Gray
Write-Host "📖 API docs: http://localhost:$Port/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    python servers/oneagent_memory_server.py
} catch {
    Write-Host "❌ Failed to start Memory Server: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
