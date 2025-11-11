#!/bin/bash
# =====================================================
# SEED RUNNER SCRIPT
# =====================================================
# Safely runs database seed files against a Supabase database
#
# USAGE:
#   From Railway container:
#     RUN_SEEDS=true ./scripts/run-seeds.sh
#
#   Locally against remote:
#     SUPABASE_DB_URL="postgresql://..." ./scripts/run-seeds.sh
#
# SAFETY FEATURES:
#   - Requires explicit RUN_SEEDS=true environment variable
#   - Shows warning before execution
#   - Checks database connection before running
# =====================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "=========================================="
echo "DATABASE SEED RUNNER"
echo "=========================================="

# Safety check: Must explicitly enable seeding
if [ "$RUN_SEEDS" != "true" ]; then
    echo -e "${RED}ERROR: Seeding is disabled by default for safety.${NC}"
    echo ""
    echo "To run seeds, set the environment variable:"
    echo "  RUN_SEEDS=true"
    echo ""
    echo "⚠️  WARNING: Seeds will TRUNCATE existing data!"
    echo ""
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will TRUNCATE and replace data!${NC}"
echo ""

# Determine database URL
if [ -n "$SUPABASE_DB_URL" ]; then
    DB_URL="$SUPABASE_DB_URL"
elif [ -n "$DATABASE_URL" ]; then
    DB_URL="$DATABASE_URL"
else
    echo -e "${RED}ERROR: No database URL found.${NC}"
    echo "Set SUPABASE_DB_URL or DATABASE_URL environment variable."
    exit 1
fi

echo "Database: ${DB_URL%%@*}@***" # Hide password in logs

# Check if seed file exists
SEED_FILE="./supabase/seeds/local-dev-seed.sql"
if [ ! -f "$SEED_FILE" ]; then
    echo -e "${RED}ERROR: Seed file not found: $SEED_FILE${NC}"
    exit 1
fi

echo "Seed file: $SEED_FILE"
echo ""

# Test database connection
echo "Testing database connection..."
if ! psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Cannot connect to database${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Run the seed file
echo "Running seed file..."
echo "=========================================="
if psql "$DB_URL" -f "$SEED_FILE"; then
    echo "=========================================="
    echo -e "${GREEN}✓ Seeds applied successfully!${NC}"
    echo ""
    echo "Seeded data includes:"
    echo "  - 3 test users (admin@test.com, owner@test.com, user@test.com)"
    echo "  - Soul Bloom Sanctuary site"
    echo "  - 5 product categories"
    echo "  - 18 products"
    echo "  - 5 content pages"
    echo ""
else
    echo "=========================================="
    echo -e "${RED}ERROR: Seed execution failed${NC}"
    exit 1
fi
