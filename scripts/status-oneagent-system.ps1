#!/usr/bin/env pwsh
<#
.SYNOPSIS
    OneAgent System Status Monitor
.DESCRIPTION
    Displays comprehensive status information for all OneAgent system components.
    Includes health checks, performance metrics, and diagnostic information.
.PARAMETER Watch
    Continuously monitor status (refresh every 5 seconds)
.PARAMETER Detailed
    Show detailed diagnostic information
.EXAMPLE
    .\status-oneagent-system.ps1
    .\status-oneagent-system.ps1 -Watch
    .\status-oneagent-system.ps1 -Detailed
#>

param(
    [switch]$Watch,
    [switch]$Detailed
)

# Function: Get service status
function Get-ServiceStatus {
    param(
        [string]$ServiceName,
        [string]$HealthUrl,
        [int]$Port
    )
    
    $status = @{
        Name = $ServiceName
        Port = $Port
        Status = "Unknown"
        Health = $null
        ResponseTime = $null
        Version = "N/A"
        Uptime = "N/A"
        Error = $null
    }
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $health = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 5 -ErrorAction Stop
        $stopwatch.Stop()
        
        $status.Status = "Running"
        $status.Health = if ($health.status -eq "healthy" -or $health.status -eq "ok") { "Healthy" } else { "Unhealthy" }
        $status.ResponseTime = "$($stopwatch.ElapsedMilliseconds)ms"
        $status.Version = $health.version ?? "Unknown"
        
        if ($health.uptime) {
            $status.Uptime = $health.uptime
        }
        
        # Store full health data for detailed view
        $status.HealthData = $health
        
    } catch {
        $status.Status = "Not Running"
        $status.Error = $_.Exception.Message
    }
    
    return $status
}

# Function: Display status table
function Show-StatusTable {
    param([array]$Services)
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📊 OneAgent System Status - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    foreach ($service in $Services) {
        $statusColor = switch ($service.Status) {
            "Running" { if ($service.Health -eq "Healthy") { "Green" } else { "Yellow" } }
            default { "Red" }
        }
        
        $statusIcon = switch ($service.Status) {
            "Running" { if ($service.Health -eq "Healthy") { "✅" } else { "⚠️" } }
            default { "❌" }
        }
        
        Write-Host "$statusIcon $($service.Name):" -ForegroundColor $statusColor -NoNewline
        Write-Host " $($service.Status)" -ForegroundColor $statusColor
        Write-Host "   📍 Port: $($service.Port) | Response: $($service.ResponseTime ?? 'N/A') | Version: $($service.Version)" -ForegroundColor Gray
        
        if ($service.Error) {
            Write-Host "   ❌ Error: $($service.Error)" -ForegroundColor Red
        }
        
        if ($service.Uptime) {
            Write-Host "   ⏱️ Uptime: $($service.Uptime)" -ForegroundColor Gray
        }
    }
}

# Function: Show detailed information
function Show-DetailedInfo {
    param([array]$Services)
    
    foreach ($service in $Services) {
        if ($service.Status -eq "Running" -and $service.HealthData) {
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
            Write-Host "🔍 $($service.Name) - Detailed Information" -ForegroundColor Cyan
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
            
            $health = $service.HealthData
              # Display all health data
            foreach ($key in $health.PSObject.Properties.Name) {
                $value = $health.$key
                if ($value -is [PSCustomObject]) {
                    Write-Host "📊 ${key}:" -ForegroundColor Yellow
                    foreach ($subKey in $value.PSObject.Properties.Name) {
                        Write-Host "   ${subKey}: $($value.$subKey)" -ForegroundColor Gray
                    }
                } elseif ($value -is [Array]) {
                    Write-Host "📋 $key`: $($value -join ', ')" -ForegroundColor Gray
                } else {
                    Write-Host "📄 $key`: $value" -ForegroundColor Gray
                }
            }
        }
    }
}

# Function: Monitor processes
function Show-ProcessInfo {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "🔄 Process Information" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    # Node.js processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "📦 Node.js Processes:" -ForegroundColor Green
        foreach ($proc in $nodeProcesses) {
            Write-Host "   PID: $($proc.Id) | CPU: $($proc.CPU.ToString('F2'))s | Memory: $([Math]::Round($proc.WorkingSet64/1MB, 2))MB" -ForegroundColor Gray
        }
    } else {
        Write-Host "📦 Node.js Processes: None running" -ForegroundColor Gray
    }
    
    # Python processes
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
    if ($pythonProcesses) {
        Write-Host "🐍 Python Processes:" -ForegroundColor Green
        foreach ($proc in $pythonProcesses) {
            Write-Host "   PID: $($proc.Id) | CPU: $($proc.CPU.ToString('F2'))s | Memory: $([Math]::Round($proc.WorkingSet64/1MB, 2))MB" -ForegroundColor Gray
        }
    } else {
        Write-Host "🐍 Python Processes: None running" -ForegroundColor Gray
    }
    
    # Background jobs
    $jobs = Get-Job -ErrorAction SilentlyContinue
    if ($jobs) {
        Write-Host "⚙️ Background Jobs:" -ForegroundColor Green
        foreach ($job in $jobs) {
            Write-Host "   $($job.Name) | State: $($job.State) | ID: $($job.Id)" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚙️ Background Jobs: None running" -ForegroundColor Gray
    }
}

# Function: Main monitoring loop
function Start-Monitoring {
    do {
        Clear-Host
        
        # Get service statuses
        $services = @(
            (Get-ServiceStatus -ServiceName "Memory Server" -HealthUrl "http://localhost:8001/health" -Port 8001),
            (Get-ServiceStatus -ServiceName "MCP Server" -HealthUrl "http://localhost:8083/health" -Port 8083)
        )
        
        # Show status table
        Show-StatusTable -Services $services
        
        # Show detailed info if requested
        if ($Detailed) {
            Show-DetailedInfo -Services $services
            Show-ProcessInfo
        }
        
        # System summary
        $runningCount = ($services | Where-Object { $_.Status -eq "Running" }).Count
        $healthyCount = ($services | Where-Object { $_.Health -eq "Healthy" }).Count
        
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "📈 Summary: $runningCount/2 services running, $healthyCount/2 healthy" -ForegroundColor $(if ($healthyCount -eq 2) { "Green" } elseif ($runningCount -gt 0) { "Yellow" } else { "Red" })
        
        if ($Watch) {
            Write-Host "🔄 Auto-refresh in 5 seconds... (Press Ctrl+C to exit)" -ForegroundColor Cyan
            Start-Sleep -Seconds 5
        }
        
    } while ($Watch)
}

# Main execution
try {
    if ($Watch) {
        Write-Host "🎯 Starting continuous monitoring mode..." -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to exit" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
    
    Start-Monitoring
    
} catch [System.Management.Automation.PipelineStoppedException] {
    Write-Host "`n👋 Monitoring stopped by user" -ForegroundColor Yellow
} catch {
    Write-Host "`n❌ Monitoring failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
