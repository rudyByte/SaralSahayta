@echo off
setlocal enabledelayedexpansion
title Saral Sahayta - Dev Server Launcher
cd /d "%~dp0"

echo ============================================================
echo   Saral Sahayta - One-Click Dev Environment Launcher
echo ============================================================
echo.

REM ------------------------------------------------------------
REM 1. Check Node.js is installed
REM ------------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found
for /f "delims=" %%v in ('node --version') do echo        version: %%v

REM ------------------------------------------------------------
REM 2. Install dependencies if node_modules is missing
REM ------------------------------------------------------------
if not exist "node_modules" (
    echo.
    echo [SETUP] node_modules not found. Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed. Please check your network / npm registry.
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies already installed ^(node_modules found^)
)

REM ------------------------------------------------------------
REM 3. Check .env file exists
REM ------------------------------------------------------------
if not exist ".env" (
    echo.
    echo [WARNING] No .env file found!
    if exist ".env.local.example" (
        echo           Copying .env.local.example to .env ...
        copy /y ".env.local.example" ".env" >nul
        echo           PLEASE EDIT .env and fill in your real Supabase/API keys.
    ) else (
        echo           No .env.local.example template found either.
        echo           The app will not work without Supabase credentials.
    )
) else (
    echo [OK] .env file found
)

REM ------------------------------------------------------------
REM 4. Generate Prisma client (keep in sync with schema)
REM ------------------------------------------------------------
echo.
echo [SETUP] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo [WARNING] Prisma generate failed. Check DATABASE_URL / schema.prisma.
)

REM ------------------------------------------------------------
REM 5. Check port 3000 is free (avoid stale-server confusion)
REM ------------------------------------------------------------
netstat -ano | findstr ":3000 " >nul 2>nul
if not errorlevel 1 (
    echo.
    echo [WARNING] Port 3000 appears to be already in use!
    echo           A previous dev server may still be running.
    echo           Stop it first (or close the other window), then rerun this script.
    echo           Trying to start anyway - Next.js will fail if the port is taken.
    echo.
)

REM ------------------------------------------------------------
REM 6. Start the Next.js dev server (this blocks the window)
REM ------------------------------------------------------------
echo.
echo [START] Launching Next.js dev server on http://localhost:3000
echo         The browser will open automatically. Press Ctrl+C to stop.
echo ------------------------------------------------------------
echo.

REM Start the dev server, then poll the port and open the browser once ready
start "" powershell -NoProfile -WindowStyle Hidden -Command "for ($i = 0; $i -lt 45; $i++) { try { Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 2 | Out-Null; Start-Process http://localhost:3000; break } catch { Start-Sleep 2 } }"

call npm run dev

echo.
echo [INFO] Dev server stopped.
pause
