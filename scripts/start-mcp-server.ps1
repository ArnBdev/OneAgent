# OneAgent MCP Copilot Server Startup Script
# Launches the OneAgent Professional MCP Server for GitHub Copilot integration

Write-Host "🚀 Starting OneAgent MCP Copilot Server..." -ForegroundColor Green
Write-Host "📍 Port: 8083" -ForegroundColor Yellow  
Write-Host "🔗 Endpoint: http://localhost:8083/mcp" -ForegroundColor Yellow
Write-Host "💊 Health: http://localhost:8083/health" -ForegroundColor Yellow
Write-Host ""

# Change to OneAgent directory
Set-Location $PSScriptRoot\..

# Check if dependencies are installed
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the server
Write-Host "🔧 Starting MCP server..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

try {
    npx ts-node coreagent/server/oneagent-mcp-copilot.ts
} catch {
    Write-Host "❌ Failed to start server. Check the error above." -ForegroundColor Red
    Write-Host "💡 Make sure you have Node.js and TypeScript installed." -ForegroundColor Yellow
    exit 1
}
