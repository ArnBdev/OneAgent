#!/usr/bin/env pwsh
# OneAgent System - Canonical Startup Script
# Starts Memory Server (background) and MCP/Node.js server (foreground)

param(
    [switch]$SkipDependencies = $false,
    [switch]$MemoryOnly = $false,
    [switch]$MCPOnly = $false
)

Write-Host "[OneAgent] Canonical System Startup" -ForegroundColor Green

$ErrorActionPreference = 'Stop'

# Start Memory Server (Python/FastAPI) in background
if (-not $MCPOnly) {
    Write-Host "[OneAgent] Starting Memory Server (Mem0/FastAPI) in background..." -ForegroundColor Cyan
    $memServerScript = Join-Path $PSScriptRoot 'start-memory-server.ps1'
    if (Test-Path $memServerScript) {
        Start-Process pwsh -ArgumentList "-NoLogo", "-NoProfile", "-Command", $memServerScript -WindowStyle Hidden
        Start-Sleep -Seconds 3 # Give memory server time to start
    } else {
        Write-Host "[WARN] Memory server script not found: $memServerScript" -ForegroundColor Yellow
    }
}

# Start MCP/Node.js Server in background
if (-not $MemoryOnly) {
    Write-Host "[OneAgent] Starting MCP/Node.js Server in background..." -ForegroundColor Cyan
    $mainEntry = Resolve-Path ../coreagent/unified-main.ts -ErrorAction SilentlyContinue
    if (-not $mainEntry) { $mainEntry = Resolve-Path ../coreagent/main.ts -ErrorAction SilentlyContinue }
    if ($mainEntry) {
        # Use ts-node if available, else fallback to node (assume precompiled)
        if (Get-Command ts-node -ErrorAction SilentlyContinue) {
            Start-Process ts-node -ArgumentList $mainEntry -WindowStyle Hidden
        } elseif (Get-Command node -ErrorAction SilentlyContinue) {
            Start-Process node -ArgumentList $mainEntry -WindowStyle Hidden
        } else {
            Write-Host "[ERROR] Neither ts-node nor node found in PATH." -ForegroundColor Red
        }
    } else {
        Write-Host "[ERROR] No main server entry point found (unified-main.ts or main.ts)." -ForegroundColor Red
    }
}

Write-Host "[OneAgent] System startup complete." -ForegroundColor Green
