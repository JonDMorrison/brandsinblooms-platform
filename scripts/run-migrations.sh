#!/bin/bash

# Shell-based migration runner for Supabase
# Alternative to Node.js runner for environments where Node.js migration isn't preferred

set -e

# Configuration
INSTANCE_ID="${HOSTNAME:-$(hostname)}-$$"
MIGRATION_TIMEOUT="${MIGRATION_TIMEOUT:-300}"
RETRY_COUNT="${RETRY_COUNT:-3}"
RETRY_DELAY="${RETRY_DELAY:-5}"

# Logging function
log() {
    local level="$1"
    local message="$2"
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") [SHELL-MIGRATION] [$level] $message"
}

# Check prerequisites
check_prerequisites() {
    # Check if Supabase CLI is available
    if ! command -v supabase >/dev/null 2>&1; then
        log "error" "Supabase CLI not found in PATH"
        return 1
    fi
    
    # Check if database URL is available
    if [ -z "$SUPABASE_DB_URL" ] && [ -z "$DATABASE_URL" ]; then
        log "error" "Neither SUPABASE_DB_URL nor DATABASE_URL environment variable is set"
        return 1
    fi
    
    # Check if migrations directory exists
    if [ ! -d "supabase/migrations" ]; then
        log "warn" "supabase/migrations directory not found"
        return 1
    fi
    
    local migration_count=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l)
    if [ "$migration_count" -eq 0 ]; then
        log "info" "No migration files found"
        return 1
    fi
    
    log "info" "Prerequisites met: Supabase CLI available, database URL set, $migration_count migration files found"
    return 0
}

# Run migrations with retry logic
run_migrations() {
    local attempt=1
    local db_url="${DATABASE_URL:-$SUPABASE_DB_URL}"
    
    while [ $attempt -le $RETRY_COUNT ]; do
        log "info" "Migration attempt $attempt of $RETRY_COUNT"
        
        # Set timeout for the operation
        timeout $MIGRATION_TIMEOUT supabase db push \
            --db-url "$db_url" \
            --include-seed false \
            --include-roles false \
            2>&1 | while IFS= read -r line; do
                echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") [SUPABASE] $line"
            done
        
        local exit_code=${PIPESTATUS[0]}
        
        if [ $exit_code -eq 0 ]; then
            log "info" "Migrations completed successfully on attempt $attempt"
            return 0
        elif [ $exit_code -eq 124 ]; then
            log "error" "Migration timed out after ${MIGRATION_TIMEOUT}s on attempt $attempt"
        else
            log "error" "Migration failed with exit code $exit_code on attempt $attempt"
        fi
        
        # Retry if not the last attempt
        if [ $attempt -lt $RETRY_COUNT ]; then
            log "info" "Retrying in ${RETRY_DELAY} seconds..."
            sleep $RETRY_DELAY
        fi
        
        attempt=$((attempt + 1))
    done
    
    log "error" "All $RETRY_COUNT migration attempts failed"
    return 1
}

# Test database connectivity
test_connection() {
    local db_url="${DATABASE_URL:-$SUPABASE_DB_URL}"
    
    log "info" "Testing database connectivity..."
    
    # Extract connection details for psql test
    # This is a simple connectivity test
    timeout 10 psql "$db_url" -c "SELECT 1;" >/dev/null 2>&1
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log "info" "Database connection successful"
        return 0
    elif [ $exit_code -eq 124 ]; then
        log "warn" "Database connection timed out"
        return 1
    else
        log "warn" "Database connection failed (exit code: $exit_code)"
        return 1
    fi
}

# Main execution
main() {
    log "info" "Shell migration runner starting" 
    local start_time=$(date +%s)
    
    # Check prerequisites
    if ! check_prerequisites; then
        log "error" "Prerequisites not met, exiting"
        return 1
    fi
    
    # Test connection first (optional, don't fail if this doesn't work)
    test_connection || log "warn" "Database connection test failed, proceeding anyway"
    
    # Run migrations
    if run_migrations; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log "info" "Migration runner completed successfully in ${duration}s"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log "error" "Migration runner failed after ${duration}s"
        return 1
    fi
}

# Handle signals
cleanup() {
    log "info" "Migration runner received signal, cleaning up..."
    exit 0
}

trap cleanup SIGTERM SIGINT

# Execute main function if script is run directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi