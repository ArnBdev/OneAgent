:: ===============================
:: OneAgent System Startup Script (2025-07-07)
::
:: Starts BOTH the memory server (mem0/FastAPI) and the MCP server (Node.js/TypeScript) in parallel.
::
:: USAGE:
::   Batch: ./scripts/start-oneagent-system.bat
::
:: For details, see: ../README.md, scripts/README.md, START_HERE.txt, QUICKSTART.txt
::
:: WARNING: All legacy scripts have been deleted. Use ONLY this script or start-unified.ps1
:: ===============================

# Modern OneAgent System Startup Script (Batch)
# Launches both the memory server (FastAPI/Uvicorn) and the MCP server (Node/TypeScript) in parallel
# Provides developer-friendly output and shutdown instructions

@echo off
setlocal

REM Start Memory Server (Python/FastAPI/Uvicorn)
echo [OneAgent] Starting Memory Server (mem0)...
start "Memory Server (mem0)" cmd /k "cd /d %~dp0.. && uvicorn servers.oneagent_memory_server:app --host 127.0.0.1 --port 8010 --reload"

REM Start MCP Server (Node/TypeScript via ts-node/register; no npx/tsx)
echo [OneAgent] Starting MCP Server (Node/TypeScript)...
for /f "usebackq delims=" %%A in (`node -e "try{console.log(require.resolve('ts-node/register'))}catch{process.exit(1)}"`) do set TSNR=%%A
if "%TSNR%"=="" (
	echo [OneAgent] ERROR: ts-node/register not found. Run npm install first.
	goto :end
)
start "MCP Server (Node/TypeScript)" cmd /k "cd /d %~dp0.. && node -r %TSNR% coreagent/server/unified-mcp-server.ts"

echo [OneAgent] Both servers launched. Check their windows for output.
echo [OneAgent] To stop, close the corresponding terminal windows.
:end
endlocal
