#!/usr/bin/env pwsh
# OneAgent System - Quick Start
# Convenience launcher for the complete startup script

Write-Host "🚀 OneAgent Quick Start" -ForegroundColor Green
Write-Host "🔄 Launching complete system startup..." -ForegroundColor Cyan
Write-Host ""

# Execute the main startup script
& "$PSScriptRoot\scripts\start-oneagent-system.ps1" @args
