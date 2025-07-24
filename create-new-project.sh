#!/bin/bash

# 🚀 Quick Project Creation Script
# This script helps create new projects from the Supabase Starter Template

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_color() {
    echo -e "${2}${1}${NC}"
}

# Show banner
clear
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           🚀 Create New Supabase Project                  ║"
echo "║                                                           ║"
echo "║   Fast • Type-safe • Production-ready                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in the template directory
if [ ! -f "package.json" ] || [ ! -f "scripts/create-project.js" ]; then
    print_color "❌ This script must be run from the Supabase Starter Template directory" "$RED"
    exit 1
fi

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    print_color "📦 pnpm is not installed. Installing..." "$YELLOW"
    npm install -g pnpm
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_color "📦 Installing template dependencies..." "$YELLOW"
    pnpm install
fi

# Run the create-project command
print_color "🚀 Starting project creation wizard..." "$GREEN"
echo ""

# Pass all arguments to the create-project script
pnpm create-project "$@"