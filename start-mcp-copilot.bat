@echo off
echo 🚀 Starting OneAgent MCP Copilot Server...
echo 📍 Port: 8083
echo 🔗 Endpoint: http://localhost:8083/mcp
echo 💊 Health: http://localhost:8083/health
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

echo 🔧 Starting MCP server...
echo Press Ctrl+C to stop the server
echo.

npx ts-node coreagent/server/oneagent-mcp-copilot.ts

pause
