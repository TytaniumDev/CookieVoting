#!/usr/bin/env zsh

# Cookie Voting - Local Development Script
# Usage:
#   cookies          - Start dev server connected to production Firebase (use real Google account)
#   cookies -test    - Start dev server with Firebase emulators (for local testing)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for -test flag
USE_EMULATORS=false
if [ "$1" = "-test" ]; then
    USE_EMULATORS=true
    echo -e "${BLUE}🧪 Test mode: Using Firebase emulators${NC}"
else
    echo -e "${GREEN}🚀 Production mode: Connected to production Firebase${NC}"
    echo -e "${YELLOW}   You can use your real Google account to sign in${NC}"
fi

echo -e "${GREEN}🍪 Starting Cookie Voting local development environment...${NC}"

# Get the directory where this script is located
SCRIPT_DIR=${0:a:h}
PROJECT_ROOT=${SCRIPT_DIR:h}

# Change to project root
cd "$PROJECT_ROOT"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down...${NC}"
    if [ "$USE_EMULATORS" = true ]; then
        kill $EMULATOR_PID 2>/dev/null || true
    fi
    kill $DEV_PID 2>/dev/null || true
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

EMULATOR_PID=""

# Start Firebase emulators if in test mode
if [ "$USE_EMULATORS" = true ]; then
    echo -e "${GREEN}🔥 Starting Firebase emulators...${NC}"
    npm run emulators:start > /tmp/cookies-emulators.log 2>&1 &
    EMULATOR_PID=$!

    # Wait for emulators to be ready
    echo -e "${YELLOW}⏳ Waiting for emulators to be ready...${NC}"
    sleep 5

    # Check if emulators started successfully
    if ! kill -0 $EMULATOR_PID 2>/dev/null; then
        echo -e "${RED}❌ Failed to start emulators. Check /tmp/cookies-emulators.log for details.${NC}"
        exit 1
    fi

    # Wait a bit more for emulators to fully initialize
    sleep 3

    echo -e "${GREEN}✅ Emulators are running!${NC}"
    echo -e "${GREEN}   📊 Emulator UI: http://localhost:4000${NC}"
    echo -e "${GREEN}   🔐 Auth: http://localhost:9099${NC}"
    echo -e "${GREEN}   💾 Firestore: http://localhost:8080${NC}"
    echo -e "${GREEN}   📦 Storage: http://localhost:9199${NC}"

    # Import emulator data manually (more reliable than --import flag)
    if [ -d "emulator-data" ]; then
        echo -e "${GREEN}📥 Importing emulator data...${NC}"
        npm run emulators:import:manual
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Emulator data imported successfully!${NC}"
        else
            echo -e "${YELLOW}⚠️  Failed to import emulator data, but emulators are still running.${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No emulator-data directory found. Starting with fresh emulators.${NC}"
        echo -e "${YELLOW}   Run 'npm run emulators:seed' to create test data.${NC}"
    fi
fi

# Start Vite dev server with appropriate environment variable
echo -e "${GREEN}🚀 Starting Vite dev server...${NC}"
if [ "$USE_EMULATORS" = true ]; then
    # Test mode: enable emulator connection
    VITE_USE_EMULATOR=true npm run dev > /tmp/cookies-dev.log 2>&1 &
else
    # Production mode: disable emulator connection
    VITE_USE_EMULATOR=false npm run dev > /tmp/cookies-dev.log 2>&1 &
fi
DEV_PID=$!

# Wait a moment for dev server to start
sleep 2

if ! kill -0 $DEV_PID 2>/dev/null; then
    echo -e "${RED}❌ Failed to start dev server. Check /tmp/cookies-dev.log for details.${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}✅ Dev server is running!${NC}"
echo -e "${GREEN}   🌐 App: http://localhost:5173${NC}"
echo -e ""

if [ "$USE_EMULATORS" = true ]; then
    echo -e "${GREEN}🎉 Everything is ready! Press Ctrl+C to stop all services.${NC}"
    echo -e "${BLUE}   Using Firebase emulators for local testing${NC}"
    # Wait for both processes
    wait $EMULATOR_PID $DEV_PID
else
    echo -e "${GREEN}🎉 Dev server is ready! Press Ctrl+C to stop.${NC}"
    echo -e "${GREEN}   Connected to production Firebase - use your real Google account${NC}"
    # Wait for dev server only
    wait $DEV_PID
fi
