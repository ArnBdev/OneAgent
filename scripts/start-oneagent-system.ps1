# ===============================
# OneAgent System Startup Script (v4.3.0)
#
# Starts BOTH the memory server (mem0/FastAPI) and the MCP server (Node.js/TypeScript) in parallel.
#
# USAGE:
#   PowerShell: ./scripts/start-oneagent-system.ps1
#
# For details, see: ../README.md, scripts/README.md, START_HERE.txt, QUICKSTART.txt
#
# WARNING: All legacy scripts have been deleted. Use ONLY this script or start-unified.ps1
# ===============================

# Modern OneAgent System Startup Script (PowerShell)
# Launches both the memory server (FastAPI/Uvicorn) and the MCP server (Node/TypeScript) in parallel
# Provides developer-friendly output, error handling, and shutdown instructions

param(
    [switch]$NoBanner
)

# FUNCTION DEFINITIONS (Must be declared BEFORE use)
function Wait-HttpReady {
    param(
        [string]$Url,
        [int]$TimeoutSec = 45,
        [int]$DelayMs = 500
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            # Accept any HTTP response (including 404) as a sign the server socket is open
            $resp = Invoke-WebRequest -Uri $Url -Method Get -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($null -ne $resp -and $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { 
                return $true 
            }
        } catch {
            # Ignore errors, server may not be ready yet
        }
        Start-Sleep -Milliseconds $DelayMs
    }
    return $false
}

function Start-ProcessWithBanner {
    param(
        [string]$Name,
        [string]$Command,
        [string]$WorkingDirectory = $PWD
    )
    Write-Host "[OneAgent] Starting $Name..." -ForegroundColor Cyan
    Start-Process -FilePath "pwsh" -ArgumentList "-NoExit", "-Command", $Command -WorkingDirectory $WorkingDirectory
}

if (-not $NoBanner) {
    Write-Host "===============================" -ForegroundColor Green
    Write-Host " OneAgent System Startup " -ForegroundColor Green
    Write-Host "===============================" -ForegroundColor Green
    Write-Host "This script will launch BOTH the memory server and the MCP server in parallel." -ForegroundColor Yellow
    Write-Host "Environment is read from .env at repo root by each server; ensure MEM0_API_KEY is set for authenticated memory ops." -ForegroundColor Yellow
    Write-Host "To stop all servers, close their terminal windows or use Task Manager." -ForegroundColor Yellow
    Write-Host "" 
}

# Resolve ports from environment (canonical), with safe defaults
$memPort = if ($env:ONEAGENT_MEMORY_PORT) { [int]$env:ONEAGENT_MEMORY_PORT } else { 8010 }
$mcpPort = if ($env:ONEAGENT_MCP_PORT) { [int]$env:ONEAGENT_MCP_PORT } else { 8083 }


# Start MCP Server (Node/TypeScript via ts-node/register; no npx/tsx dependency)
$tsNodeRegister = node -e "try{console.log(require.resolve('ts-node/register'))}catch{process.exit(1)}"
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($tsNodeRegister)) {
    Write-Host "[OneAgent] ERROR: ts-node/register not found. Run 'npm install' first." -ForegroundColor Red
    exit 1
}
$mcpServerCmd = "node -r `"$tsNodeRegister`" coreagent/server/unified-mcp-server.ts"
Start-ProcessWithBanner -Name "MCP Server (Node/TypeScript)" -Command $mcpServerCmd -WorkingDirectory "$PSScriptRoot/.."

# Wait for MCP health endpoint before starting memory server
$mcpProbeUrl = "http://127.0.0.1:$mcpPort/health"
Write-Host "[OneAgent] Waiting for MCP server to become healthy (up to 60 seconds)..." -ForegroundColor Yellow
$mcpReady = Wait-HttpReady -Url $mcpProbeUrl -TimeoutSec 60
if ($mcpReady) {
    Write-Host "[Probe] MCP server READY ($mcpProbeUrl)" -ForegroundColor Green
} else {
    Write-Host "[Probe] MCP server TIMEOUT ($mcpProbeUrl)" -ForegroundColor Yellow
    Write-Host "[OneAgent] MCP server did not become healthy in time." -ForegroundColor Yellow
    Write-Host "[OneAgent] Check the MCP server window for errors. Memory server will start anyway." -ForegroundColor Yellow
}

# Start Memory Server (Python/FastAPI/Uvicorn)
# Note: Uses old server name for backward compatibility - will be updated to mem0_fastmcp_server.py
$pythonPath = if ($env:VIRTUAL_ENV) { 
    Join-Path $env:VIRTUAL_ENV "Scripts\python.exe" 
} else { 
    "python" 
}
$memoryServerCmd = "`"$pythonPath`" servers/mem0_fastmcp_server.py"
Start-ProcessWithBanner -Name "Memory Server (mem0+FastMCP)" -Command $memoryServerCmd -WorkingDirectory "$PSScriptRoot/.."

# Optional readiness check for memory server
$memProbeUrl = "http://127.0.0.1:$memPort/health"
Write-Host "[OneAgent] Waiting for Memory server to become healthy (up to 45 seconds)..." -ForegroundColor Yellow
$memReady = Wait-HttpReady -Url $memProbeUrl -TimeoutSec 45
if ($memReady) { 
    Write-Host "[Probe] Memory server READY ($memProbeUrl)" -ForegroundColor Green 
} else { 
    Write-Host "[Probe] Memory server TIMEOUT ($memProbeUrl)" -ForegroundColor Yellow 
    Write-Host "[OneAgent] Memory server may still be starting. Check its window for progress." -ForegroundColor Yellow
}

# Final status report
Write-Host ""
if ($mcpReady -and $memReady) {
    Write-Host "===============================" -ForegroundColor Green
    Write-Host " ✅ SYSTEM READY" -ForegroundColor Green
    Write-Host "===============================" -ForegroundColor Green
    Write-Host "MCP Server:    http://127.0.0.1:$mcpPort" -ForegroundColor Cyan
    Write-Host "Memory Server: http://127.0.0.1:$memPort" -ForegroundColor Cyan
} elseif ($mcpReady) {
    Write-Host "[OneAgent] ⚠️  MCP server is UP, but memory server needs more time." -ForegroundColor Yellow
    Write-Host "[OneAgent] MCP will work, but memory operations may fail until memory server is ready." -ForegroundColor Yellow
} else {
    Write-Host "[OneAgent] ⚠️  Servers launched but health checks timed out." -ForegroundColor Yellow
    Write-Host "[OneAgent] Check the terminal windows for detailed startup logs." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "[OneAgent] To stop servers: Close their terminal windows or use Task Manager." -ForegroundColor DarkGray

# Quick env visibility
$mem0KeySet = [bool]$env:MEM0_API_KEY
$googleKeySet = [bool]$env:GOOGLE_API_KEY
Write-Host "[OneAgent] MEM0_API_KEY set: $mem0KeySet | GOOGLE_API_KEY set: $googleKeySet" -ForegroundColor DarkGray
