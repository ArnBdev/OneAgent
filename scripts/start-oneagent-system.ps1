# ===============================
# OneAgent System Startup Script (2025-07-07)
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
# Launches both the memory server (FastAPI/Uvicorn) and the MCP server (Node/TSX) in parallel
# Provides developer-friendly output, error handling, and shutdown instructions

param(
    [switch]$NoBanner
)

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
    Write-Host "To stop all servers, close their terminal windows or use Task Manager." -ForegroundColor Yellow
    Write-Host "" 
}

# Start Memory Server (Python/FastAPI/Uvicorn)
$memoryServerCmd = "uvicorn servers.oneagent_memory_server:app --host 127.0.0.1 --port 8010 --reload"
Start-ProcessWithBanner -Name "Memory Server (mem0)" -Command $memoryServerCmd -WorkingDirectory "$PSScriptRoot/.."

# Start MCP Server (Node/TSX)
$mcpServerCmd = "npx tsx coreagent/server/unified-mcp-server.ts"
Start-ProcessWithBanner -Name "MCP Server (Node/TSX)" -Command $mcpServerCmd -WorkingDirectory "$PSScriptRoot/.."

Write-Host "[OneAgent] Both servers launched. Check their windows for output." -ForegroundColor Green
Write-Host "[OneAgent] To stop, close the corresponding terminal windows." -ForegroundColor Yellow
