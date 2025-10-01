# ===============================
# OneAgent System Shutdown Script (v4.3.0)
#
# Stops ALL OneAgent servers gracefully
#
# USAGE:
#   PowerShell: ./scripts/stop-oneagent-system.ps1
#
# ===============================

param(
    [switch]$Force
)

Write-Host "===============================" -ForegroundColor Red
Write-Host " OneAgent System Shutdown " -ForegroundColor Red
Write-Host "===============================" -ForegroundColor Red
Write-Host ""

# Find and stop Python processes (memory server)
$pythonProcesses = Get-Process python -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "[OneAgent] Found $($pythonProcesses.Count) Python process(es):" -ForegroundColor Yellow
    $pythonProcesses | Select-Object Id, ProcessName, StartTime | Format-Table -AutoSize
    
    if ($Force) {
        Write-Host "[OneAgent] Force stopping Python processes..." -ForegroundColor Red
        $pythonProcesses | ForEach-Object { Stop-Process -Id $_.Id -Force }
        Write-Host "[OneAgent] ✅ Python processes stopped" -ForegroundColor Green
    } else {
        $confirm = Read-Host "Stop these Python processes? (y/N)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            $pythonProcesses | ForEach-Object { Stop-Process -Id $_.Id -Force }
            Write-Host "[OneAgent] ✅ Python processes stopped" -ForegroundColor Green
        } else {
            Write-Host "[OneAgent] Skipped Python processes" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[OneAgent] No Python processes found" -ForegroundColor DarkGray
}

Write-Host ""

# Find and stop Node.js processes (MCP server)
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "[OneAgent] Found $($nodeProcesses.Count) Node.js process(es):" -ForegroundColor Yellow
    $nodeProcesses | Select-Object Id, ProcessName, StartTime | Format-Table -AutoSize
    
    if ($Force) {
        Write-Host "[OneAgent] Force stopping Node.js processes..." -ForegroundColor Red
        $nodeProcesses | ForEach-Object { Stop-Process -Id $_.Id -Force }
        Write-Host "[OneAgent] ✅ Node.js processes stopped" -ForegroundColor Green
    } else {
        $confirm = Read-Host "Stop these Node.js processes? (y/N)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            $nodeProcesses | ForEach-Object { Stop-Process -Id $_.Id -Force }
            Write-Host "[OneAgent] ✅ Node.js processes stopped" -ForegroundColor Green
        } else {
            Write-Host "[OneAgent] Skipped Node.js processes" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[OneAgent] No Node.js processes found" -ForegroundColor DarkGray
}

Write-Host ""

# Clean up locked database files
Write-Host "[OneAgent] Checking for locked database files..." -ForegroundColor Cyan
if (Test-Path "/tmp/qdrant") {
    Write-Host "[OneAgent] Found Qdrant temp files: /tmp/qdrant" -ForegroundColor Yellow
    if ($Force) {
        Remove-Item "/tmp/qdrant" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "[OneAgent] ✅ Cleaned up Qdrant temp files" -ForegroundColor Green
    } else {
        $confirm = Read-Host "Clean up Qdrant temp files? (y/N)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            Remove-Item "/tmp/qdrant" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "[OneAgent] ✅ Cleaned up Qdrant temp files" -ForegroundColor Green
        } else {
            Write-Host "[OneAgent] Skipped Qdrant cleanup" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[OneAgent] No Qdrant temp files found" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "===============================" -ForegroundColor Green
Write-Host " Shutdown Complete " -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now restart the system with: .\scripts\start-oneagent-system.ps1" -ForegroundColor Cyan
