#!/usr/bin/env bash
# ============================================================
#  Saral Sahayta - One-Click Dev Environment Launcher (bash)
#  Usage: ./start-dev.sh     (or: bash start-dev.sh)
# ============================================================
set -e

cd "$(dirname "$0")"

BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
NC="\033[0m"

echo -e "${BOLD}============================================================${NC}"
echo -e "${BOLD}  Saral Sahayta - One-Click Dev Environment Launcher${NC}"
echo -e "${BOLD}============================================================${NC}"
echo

# ------------------------------------------------------------
# 1. Check Node.js is installed
# ------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}[ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Node.js found: $(node --version)"

# ------------------------------------------------------------
# 2. Install dependencies if node_modules is missing
# ------------------------------------------------------------
if [ ! -d "node_modules" ]; then
    echo
    echo -e "${YELLOW}[SETUP]${NC} node_modules not found. Installing dependencies..."
    npm install
else
    echo -e "${GREEN}[OK]${NC} Dependencies already installed (node_modules found)"
fi

# ------------------------------------------------------------
# 3. Check .env file exists
# ------------------------------------------------------------
if [ ! -f ".env" ]; then
    echo
    echo -e "${YELLOW}[WARNING]${NC} No .env file found!"
    if [ -f ".env.local.example" ]; then
        echo "          Copying .env.local.example to .env ..."
        cp ".env.local.example" ".env"
        echo -e "          ${RED}PLEASE EDIT .env and fill in your real Supabase/API keys.${NC}"
    else
        echo "          No .env.local.example template found either."
        echo "          The app will not work without Supabase credentials."
    fi
else
    echo -e "${GREEN}[OK]${NC} .env file found"
fi

# ------------------------------------------------------------
# 4. Generate Prisma client (keep in sync with schema)
# ------------------------------------------------------------
echo
echo -e "${YELLOW}[SETUP]${NC} Generating Prisma client..."
npx prisma generate || echo -e "${YELLOW}[WARNING]${NC} Prisma generate failed."

# ------------------------------------------------------------
# 5. Start the Next.js dev server (this blocks the terminal)
# ------------------------------------------------------------
echo
echo -e "${GREEN}[START]${NC} Launching Next.js dev server on http://localhost:3000"
echo -e "         Press Ctrl+C to stop."
echo "------------------------------------------------------------"
echo

# Warn if port 3000 is already in use (stale server check)
if curl -s -o /dev/null --max-time 2 http://localhost:3000 2>/dev/null; then
    echo -e "${YELLOW}[WARNING]${NC} Port 3000 appears to be already in use - a previous dev server may still be running."
    echo -e "          Stop it first, then rerun this script."
fi

# Open browser once the dev server responds (poll the port, macOS + Linux)
open_browser() {
    local attempts=0
    while [ $attempts -lt 45 ]; do
        if curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
            open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || true
            return 0
        fi
        sleep 2
        attempts=$((attempts + 1))
    done
    return 0
}
open_browser &
OPEN_PID=$!
trap 'kill $OPEN_PID 2>/dev/null || true' EXIT

npm run dev || true

echo
echo -e "${YELLOW}[INFO]${NC} Dev server stopped."
