# Cookie Voting - Local Development Script
# Usage:
#   cookies          - Start dev server connected to production Firebase (use real Google account)
#   cookies -test    - Start dev server with Firebase emulators (for local testing)

$ErrorActionPreference = "Continue"

# Check for -test flag
$UseEmulators = $false
if ($args -contains "-test") {
    $UseEmulators = $true
    Write-Host "🧪 Test mode: Using Firebase emulators" -ForegroundColor Cyan
} else {
    Write-Host "🚀 Production mode: Connected to production Firebase" -ForegroundColor Green
    Write-Host "   You can use your real Google account to sign in" -ForegroundColor Yellow
}

Write-Host "🍪 Starting Cookie Voting local development environment..." -ForegroundColor Green

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Change to project root
Set-Location $ProjectRoot

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
}

# Store process IDs for cleanup
$EmulatorProcess = $null
$DevProcess = $null

# Function to cleanup on exit
function Cleanup {
    Write-Host "`n🛑 Shutting down..." -ForegroundColor Yellow
    if ($EmulatorProcess -and -not $EmulatorProcess.HasExited) {
        Write-Host "   Stopping emulators..." -ForegroundColor Yellow
        Stop-Process -Id $EmulatorProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($DevProcess -and -not $DevProcess.HasExited) {
        Write-Host "   Stopping dev server..." -ForegroundColor Yellow
        Stop-Process -Id $DevProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✅ All services stopped." -ForegroundColor Green
}

# Register cleanup handlers
$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }
[Console]::TreatControlCAsInput = $false

# Start Firebase emulators if in test mode
if ($UseEmulators) {
    Write-Host "🔥 Starting Firebase emulators..." -ForegroundColor Green
    $EmulatorProcess = Start-Process -FilePath "npm" -ArgumentList "run", "emulators:start" -WorkingDirectory $ProjectRoot -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\cookies-emulators.log" -RedirectStandardError "$env:TEMP\cookies-emulators-error.log"

    # Wait for emulators to be ready
    Write-Host "⏳ Waiting for emulators to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8

    # Check if emulator process is still running
    if ($EmulatorProcess.HasExited) {
        Write-Host "❌ Failed to start emulators. Check $env:TEMP\cookies-emulators-error.log for details." -ForegroundColor Red
        if (Test-Path "$env:TEMP\cookies-emulators-error.log") {
            Get-Content "$env:TEMP\cookies-emulators-error.log" | Select-Object -Last 10
        }
        exit 1
    }

    Write-Host "✅ Emulators are running!" -ForegroundColor Green
    Write-Host "   📊 Emulator UI: http://localhost:4000" -ForegroundColor Cyan
    Write-Host "   🔐 Auth: http://localhost:9099" -ForegroundColor Cyan
    Write-Host "   💾 Firestore: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "   📦 Storage: http://localhost:9199" -ForegroundColor Cyan

    # Import emulator data manually (more reliable than --import flag)
    if (Test-Path "emulator-data") {
        Write-Host "📥 Importing emulator data..." -ForegroundColor Green
        $importResult = & npm run emulators:import:manual 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Emulator data imported successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Failed to import emulator data, but emulators are still running." -ForegroundColor Yellow
            Write-Host $importResult
        }
    } else {
        Write-Host "⚠️  No emulator-data directory found. Starting with fresh emulators." -ForegroundColor Yellow
        Write-Host "   Run 'npm run emulators:seed' to create test data." -ForegroundColor Yellow
    }
}

# Start Vite dev server with appropriate environment variable
Write-Host "🚀 Starting Vite dev server..." -ForegroundColor Green
if ($UseEmulators) {
    # Test mode: enable emulator connection
    $env:VITE_USE_EMULATOR = "true"
    $DevProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $ProjectRoot -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\cookies-dev.log" -RedirectStandardError "$env:TEMP\cookies-dev-error.log"
} else {
    # Production mode: disable emulator connection
    $env:VITE_USE_EMULATOR = "false"
    $DevProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $ProjectRoot -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\cookies-dev.log" -RedirectStandardError "$env:TEMP\cookies-dev-error.log"
}

# Wait a moment for dev server to start
Start-Sleep -Seconds 3

if ($DevProcess.HasExited) {
    Write-Host "❌ Failed to start dev server. Check $env:TEMP\cookies-dev-error.log for details." -ForegroundColor Red
    if (Test-Path "$env:TEMP\cookies-dev-error.log") {
        Get-Content "$env:TEMP\cookies-dev-error.log" | Select-Object -Last 10
    }
    Cleanup
    exit 1
}

Write-Host "✅ Dev server is running!" -ForegroundColor Green
Write-Host "   🌐 App: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

if ($UseEmulators) {
    Write-Host "🎉 Everything is ready! Press Ctrl+C to stop all services." -ForegroundColor Green
    Write-Host "   Using Firebase emulators for local testing" -ForegroundColor Cyan
} else {
    Write-Host "🎉 Dev server is ready! Press Ctrl+C to stop." -ForegroundColor Green
    Write-Host "   Connected to production Firebase - use your real Google account" -ForegroundColor Green
}

# Wait for user interrupt and monitor processes
try {
    while ($true) {
        Start-Sleep -Seconds 2
        
        # Check if processes are still running
        if ($UseEmulators -and $EmulatorProcess -and $EmulatorProcess.HasExited) {
            Write-Host "⚠️  Emulator process stopped unexpectedly" -ForegroundColor Yellow
            if (Test-Path "$env:TEMP\cookies-emulators-error.log") {
                Write-Host "Last error output:" -ForegroundColor Yellow
                Get-Content "$env:TEMP\cookies-emulators-error.log" | Select-Object -Last 5
            }
            break
        }
        
        if ($DevProcess.HasExited) {
            Write-Host "⚠️  Dev server process stopped unexpectedly" -ForegroundColor Yellow
            if (Test-Path "$env:TEMP\cookies-dev-error.log") {
                Write-Host "Last error output:" -ForegroundColor Yellow
                Get-Content "$env:TEMP\cookies-dev-error.log" | Select-Object -Last 5
            }
            break
        }
    }
}
catch {
    # User pressed Ctrl+C or other interrupt
    Write-Host "`nInterrupt received..." -ForegroundColor Yellow
}
finally {
    Cleanup
}
