@echo off
setlocal enabledelayedexpansion

REM OneAgent System Startup Script (Batch Version)
REM Simple wrapper that calls the PowerShell script

echo 🚀 OneAgent System Startup (Batch Launcher)
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Change to script directory
cd /d "%~dp0"

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PowerShell not found. Please install PowerShell 5.0 or later.
    echo 💡 Download from: https://github.com/PowerShell/PowerShell/releases
    pause
    exit /b 1
)

echo 🔄 Launching PowerShell startup script...
echo.

REM Execute the PowerShell script with parameters
powershell -ExecutionPolicy Bypass -File "start-oneagent-system.ps1" %*

REM Check result
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ OneAgent system startup completed successfully!
) else (
    echo.
    echo ❌ OneAgent system startup failed (Exit code: %ERRORLEVEL%)
    echo 💡 Check the error messages above for details
)

echo.
echo Press any key to exit...
pause >nul
