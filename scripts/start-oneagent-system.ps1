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
    $mainEntry = $null
    $tsEntry = Resolve-Path ../coreagent/unified-main.ts -ErrorAction SilentlyContinue
    $jsEntry = Resolve-Path ../coreagent/unified-main.js -ErrorAction SilentlyContinue
    if ($tsEntry) { $mainEntry = $tsEntry }
    elseif ($jsEntry) { $mainEntry = $jsEntry }
    else {
        $tsEntry = Resolve-Path ../coreagent/main.ts -ErrorAction SilentlyContinue
        $jsEntry = Resolve-Path ../coreagent/main.js -ErrorAction SilentlyContinue
        if ($tsEntry) { $mainEntry = $tsEntry }
        elseif ($jsEntry) { $mainEntry = $jsEntry }
    }
    if ($mainEntry) {
        # Use ts-node if available for .ts, else node for .js
        if ($mainEntry -like '*.ts' -and (Get-Command ts-node -ErrorAction SilentlyContinue)) {
            Start-Process ts-node -ArgumentList $mainEntry -WindowStyle Hidden
        } elseif ($mainEntry -like '*.js' -and (Get-Command node -ErrorAction SilentlyContinue)) {
            Start-Process node -ArgumentList $mainEntry -WindowStyle Hidden
        } else {
            Write-Host "[ERROR] Neither ts-node nor node found in PATH, or entry point extension not supported." -ForegroundColor Red
        }
    } else {
        Write-Host "[ERROR] No main server entry point found (unified-main.ts/.js or main.ts/.js)." -ForegroundColor Red
    }
}

Write-Host "[OneAgent] System startup complete." -ForegroundColor Green
