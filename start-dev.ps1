# ============================================================
#  Saral Sahayta - One-Click Dev Environment Launcher (PowerShell)
#
#  Run directly in the VS Code terminal:
#      .\start-dev.ps1
#
#  If blocked by the execution policy, run this once:
#      Set-ExecutionPolicy -Scope Process Bypass
#      .\start-dev.ps1
#
#  Or use the VS Code task: Terminal > Run Task > "Start Dev Server"
# ============================================================

Set-Location $PSScriptRoot

function Write-Step([string]$message) { Write-Host "[OK] $message" -ForegroundColor Green }
function Write-Warn([string]$message) { Write-Host "[WARNING] $message" -ForegroundColor Yellow }
function Write-Err([string]$message) { Write-Host "[ERROR] $message" -ForegroundColor Red }

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Saral Sahayta - One-Click Dev Environment Launcher" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------
# 1. Check Node.js is installed
# ------------------------------------------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
}
Write-Step "Node.js found: $(node --version)"

# ------------------------------------------------------------
# 2. Install dependencies if node_modules is missing
# ------------------------------------------------------------
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Warn "node_modules not found. Installing dependencies..."
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Err "npm install failed. Please check your network / npm registry."
        exit 1
    }
} else {
    Write-Step "Dependencies already installed (node_modules found)"
}

# ------------------------------------------------------------
# 3. Check .env file exists
# ------------------------------------------------------------
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Warn "No .env file found!"
    if (Test-Path ".env.local.example") {
        Copy-Item ".env.local.example" ".env"
        Write-Warn "Copied .env.local.example to .env - PLEASE EDIT .env and fill in your real Supabase/API keys."
    } else {
        Write-Warn "No .env.local.example template found. The app will not work without Supabase credentials."
    }
} else {
    Write-Step ".env file found"
}

# ------------------------------------------------------------
# 4. Generate Prisma client (keep in sync with schema)
# ------------------------------------------------------------
Write-Host ""
Write-Host "[SETUP] Generating Prisma client..." -ForegroundColor Yellow
& npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Prisma generate failed. Check DATABASE_URL / schema.prisma."
}

# ------------------------------------------------------------
# 5. Warn if port 3000 is already in use (stale server check)
# ------------------------------------------------------------
if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
    Write-Host ""
    Write-Warn "Port 3000 is already in use - a previous dev server may still be running."
    Write-Warn "Stop it first, then rerun this script. Trying anyway..."
    Write-Host ""
}

# ------------------------------------------------------------
# 6. Start the Next.js dev server (blocks this terminal)
# ------------------------------------------------------------
Write-Host "[START] Launching Next.js dev server on http://localhost:3000" -ForegroundColor Green
Write-Host "        Press Ctrl+C to stop."
Write-Host "------------------------------------------------------------"
Write-Host ""

# Background poller: opens the browser once the server responds
$poller = {
    for ($i = 0; $i -lt 45; $i++) {
        try {
            Invoke-WebRequest "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 | Out-Null
            Start-Process "http://localhost:3000"
            break
        } catch {
            Start-Sleep -Seconds 2
        }
    }
}
$null = Start-Job -ScriptBlock $poller

try {
    & npm run dev
} finally {
    Write-Host ""
    Write-Warn "Dev server stopped."
    Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
}
