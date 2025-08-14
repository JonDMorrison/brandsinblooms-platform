#!/bin/bash

# Production-grade Docker entrypoint for parallel migration execution
# Runs database migrations in background while starting Next.js application

set -e

# Configuration with environment variable defaults
export LOG_PREFIX="[ENTRYPOINT]"
export MIGRATION_ENABLED="${MIGRATION_ENABLED:-true}"
export USE_NODE_MIGRATIONS="${USE_NODE_MIGRATIONS:-false}"
export MIGRATION_TIMEOUT="${MIGRATION_TIMEOUT:-300}"
export MIGRATION_MAX_MEMORY_MB="${MIGRATION_MAX_MEMORY_MB:-512}"
export INSTANCE_ID="${HOSTNAME:-$(hostname)}-$$"

# Go runtime optimizations for Supabase CLI
export GOGC="${GOGC:-100}"
export GOMEMLIMIT="${GOMEMLIMIT:-${MIGRATION_MAX_MEMORY_MB}MiB}"
export GOMAXPROCS="${GOMAXPROCS:-2}"

# Create necessary directories for state tracking
mkdir -p /tmp/migrations

# Function to check and log system memory status
check_memory_status() {
    if [ -f /proc/meminfo ]; then
        local total_mb=$(grep MemTotal /proc/meminfo | awk '{print int($2/1024)}')
        local available_mb=$(grep MemAvailable /proc/meminfo | awk '{print int($2/1024)}' 2>/dev/null || echo "N/A")
        local free_mb=$(grep MemFree /proc/meminfo | awk '{print int($2/1024)}')
        local cached_mb=$(grep "^Cached:" /proc/meminfo | awk '{print int($2/1024)}')
        local buffers_mb=$(grep Buffers /proc/meminfo | awk '{print int($2/1024)}')
        
        log "info" "System memory status" '{"totalMB":'$total_mb',"availableMB":"'$available_mb'","freeMB":'$free_mb',"cachedMB":'$cached_mb',"buffersMB":'$buffers_mb'}'
    fi
    
    # Log Node.js memory configuration
    local node_max_old_space=$(echo $NODE_OPTIONS | grep -o 'max-old-space-size=[0-9]*' | cut -d= -f2 || echo "default")
    log "info" "Node.js memory configuration" '{"maxOldSpaceSizeMB":"'$node_max_old_space'","nodeOptions":"'$NODE_OPTIONS'"}'
}

# Structured logging function
log() {
    local level="$1"
    local message="$2"
    local metadata="${3:-{}}"
    
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") $LOG_PREFIX [$level] $message $metadata"
}

# Function to check if migrations should run
should_run_migrations() {
    # Skip if explicitly disabled
    if [ "$MIGRATION_ENABLED" != "true" ]; then
        log "info" "Migrations disabled via MIGRATION_ENABLED=false"
        return 1
    fi
    
    # Skip if environment variables suggest it's not needed
    if [ "$SKIP_MIGRATIONS" = "true" ]; then
        log "info" "Migrations disabled via SKIP_MIGRATIONS=true"
        return 1
    fi
    
    # Only run in production/staging environments
    if [ "$NODE_ENV" != "production" ] && [ "$NODE_ENV" != "staging" ]; then
        log "info" "Migrations skipped for NODE_ENV=$NODE_ENV (only runs in production/staging)"
        return 1
    fi
    
    # Check if migrations recently failed (prevent restart loops)
    if [ -f /tmp/migrations/recent_failure ]; then
        local failure_time=$(cat /tmp/migrations/recent_failure 2>/dev/null || echo "0")
        local current_time=$(date +%s)
        local time_diff=$((current_time - failure_time))
        
        # Skip migrations if they failed within the last 5 minutes
        if [ $time_diff -lt 300 ]; then
            log "warn" "Migrations failed recently, skipping to prevent restart loop (will retry in $((300 - time_diff))s)"
            return 1
        fi
    fi
    
    # Check if required environment variables are available
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        log "warn" "Missing Supabase environment variables, skipping migrations"
        return 1
    fi
    
    # Check if database URL is available for shell migrations
    if [ "$USE_NODE_MIGRATIONS" != "true" ] && [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
        log "warn" "Missing DATABASE_URL or SUPABASE_DB_URL for shell migrations, skipping migrations"
        return 1
    fi
    
    log "info" "Migration prerequisites met"
    return 0
}

# Function to run Node.js-based migrations
run_node_migrations() {
    log "info" "Starting Node.js migration runner" '{"runner":"node","instance":"'$INSTANCE_ID'"}'
    
    (
        # Set resource limits for migration process
        # ulimit -v removed: Allow unlimited virtual address space for Go runtime
        ulimit -t $MIGRATION_TIMEOUT                            # Keep CPU time limit
        
        # Set nice priority and reduced Node.js memory for migration
        nice -n 10 node --max-old-space-size=$MIGRATION_MAX_MEMORY_MB /app/scripts/migrate.js 2>&1 | while IFS= read -r line; do
            echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") [MIGRATION] $line"
        done
        
        RESULT=${PIPESTATUS[0]}  # Get exit code of node command, not tee
        
        if [ $RESULT -eq 0 ]; then
            touch /tmp/migrations/completed
            rm -f /tmp/migrations/recent_failure  # Clear failure marker on success
            log "info" "Node.js migrations completed successfully" '{"result":"success","exitCode":0}'
        else
            touch /tmp/migrations/failed
            echo "Node.js migration exit code: $RESULT" > /tmp/migrations/failed.log
            echo "$(date +%s)" > /tmp/migrations/recent_failure  # Mark recent failure
            log "error" "Node.js migrations failed" '{"result":"failure","exitCode":'$RESULT'}'
        fi
        
        exit $RESULT
    ) &
    
    # Store migration process PID for monitoring
    MIGRATION_PID=$!
    echo $MIGRATION_PID > /tmp/migrations/pid
    
    log "info" "Migration process started in background" '{"pid":'$MIGRATION_PID',"timeout":'$MIGRATION_TIMEOUT'}'
}

# Function to run shell-based migrations (fallback)
run_shell_migrations() {
    log "info" "Starting shell migration runner" '{"runner":"shell","instance":"'$INSTANCE_ID'"}'
    
    # Check if Supabase CLI is available
    if ! command -v supabase >/dev/null 2>&1; then
        log "error" "Supabase CLI not found, cannot run shell migrations"
        touch /tmp/migrations/failed
        echo "Supabase CLI not found" > /tmp/migrations/failed.log
        return 1
    fi
    
    (
        # Set Go runtime environment for optimal memory usage
        export GOGC=100                           # Default GC target (100% heap growth)
        export GOMEMLIMIT="${MIGRATION_MAX_MEMORY_MB}MiB"  # Use MiB suffix for clarity
        export GODEBUG=gctrace=0                  # Disable GC tracing for production
        
        # Set resource limits - removed virtual memory limit to allow Go runtime address space reservation
        # ulimit -v removed: Go needs unrestricted virtual address space for page allocator
        ulimit -t $MIGRATION_TIMEOUT  # Keep CPU time limit
        
        # Run with timeout and retry logic
        local attempt=1
        local max_attempts=3
        local retry_delay=5
        local success=false
        
        while [ $attempt -le $max_attempts ] && [ "$success" = "false" ]; do
            log "info" "Shell migration attempt $attempt of $max_attempts"
            
            # Set up database URL for Supabase CLI if needed
            if [ -n "$SUPABASE_DB_URL" ]; then
                export DATABASE_URL="$SUPABASE_DB_URL"
            fi
            
            # Run migration with timeout and memory monitoring
            timeout $MIGRATION_TIMEOUT nice -n 10 \
                supabase db push \
                    --db-url "${DATABASE_URL:-$SUPABASE_DB_URL}" \
                    --include-seed false \
                    --include-roles false \
                    --include-all \
                    --debug false \
                    2>&1 | while IFS= read -r line; do
                        echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") [MIGRATION] $line"
                    done
            
            local exit_code=${PIPESTATUS[0]}
            
            if [ $exit_code -eq 0 ]; then
                success=true
                log "info" "Shell migration attempt $attempt succeeded"
            else
                log "warn" "Shell migration attempt $attempt failed" '{"exitCode":'$exit_code',"attempt":'$attempt'}'
                
                if [ $attempt -lt $max_attempts ]; then
                    log "info" "Retrying in ${retry_delay}s..."
                    sleep $retry_delay
                fi
            fi
            
            attempt=$((attempt + 1))
        done
        
        if [ "$success" = "true" ]; then
            touch /tmp/migrations/completed
            rm -f /tmp/migrations/recent_failure  # Clear failure marker on success
            log "info" "Shell migrations completed successfully"
            exit 0
        else
            touch /tmp/migrations/failed
            echo "All shell migration attempts failed" > /tmp/migrations/failed.log
            echo "$(date +%s)" > /tmp/migrations/recent_failure  # Mark recent failure
            log "error" "All shell migration attempts failed"
            exit 1
        fi
    ) &
    
    # Store migration process PID
    MIGRATION_PID=$!
    echo $MIGRATION_PID > /tmp/migrations/pid
    
    log "info" "Shell migration process started in background" '{"pid":'$MIGRATION_PID',"timeout":'$MIGRATION_TIMEOUT'}'
}

# Function to start migrations in background
start_migrations() {
    if ! should_run_migrations; then
        log "info" "Migrations skipped"
        return 0
    fi
    
    # Check system memory before starting migrations
    check_memory_status
    
    # Mark migrations as running
    touch /tmp/migrations/running
    
    # Choose migration runner (default to shell for memory efficiency)
    if [ "$USE_NODE_MIGRATIONS" = "true" ]; then
        run_node_migrations
    else
        run_shell_migrations
    fi
}

# Function to check migration status (non-blocking)
check_migration_status() {
    if [ -f /tmp/migrations/completed ]; then
        log "info" "Migrations completed successfully"
        return 0
    elif [ -f /tmp/migrations/failed ]; then
        local failure_details=""
        if [ -f /tmp/migrations/failed.log ]; then
            failure_details=" ($(cat /tmp/migrations/failed.log | head -1))"
        fi
        log "warn" "Migrations failed, but application continuing$failure_details"
        return 1
    elif [ -f /tmp/migrations/running ]; then
        log "info" "Migrations still running in background"
        return 2
    else
        log "info" "Migration status unknown"
        return 3
    fi
}

# Signal handler for graceful shutdown
cleanup() {
    local signal="$1"
    log "info" "Received $signal signal, initiating graceful shutdown"
    
    # Kill migration process if still running
    if [ -f /tmp/migrations/pid ]; then
        local migration_pid=$(cat /tmp/migrations/pid)
        if kill -0 $migration_pid 2>/dev/null; then
            log "info" "Terminating migration process (PID: $migration_pid)"
            kill -TERM $migration_pid 2>/dev/null || true
            
            # Wait briefly for graceful shutdown
            local wait_count=0
            while kill -0 $migration_pid 2>/dev/null && [ $wait_count -lt 10 ]; do
                sleep 1
                wait_count=$((wait_count + 1))
            done
            
            # Force kill if still running
            if kill -0 $migration_pid 2>/dev/null; then
                log "warn" "Force killing migration process"
                kill -KILL $migration_pid 2>/dev/null || true
            fi
        fi
    fi
    
    # Forward signal to Node.js process if running
    if [ -n "$NODE_PID" ] && kill -0 $NODE_PID 2>/dev/null; then
        log "info" "Forwarding $signal to Node.js process (PID: $NODE_PID)"
        kill -TERM $NODE_PID 2>/dev/null || true
        wait $NODE_PID 2>/dev/null || true
    fi
    
    log "info" "Graceful shutdown completed"
    exit 0
}

# Set up signal handlers
trap 'cleanup SIGTERM' SIGTERM
trap 'cleanup SIGINT' SIGINT

# Health check helper (for debugging)
create_health_markers() {
    # Create marker files that health checks can use
    echo "entrypoint_started" > /tmp/entrypoint_status
    
    # Export function for health checks to use
    cat > /tmp/check_migration_status.sh << 'EOF'
#!/bin/bash
if [ -f /tmp/migrations/completed ]; then
    echo "completed"
elif [ -f /tmp/migrations/failed ]; then
    echo "failed"
elif [ -f /tmp/migrations/running ]; then
    echo "running"
else
    echo "unknown"
fi
EOF
    chmod +x /tmp/check_migration_status.sh
}

# Main execution flow
main() {
    log "info" "Docker entrypoint starting" '{"nodeEnv":"'$NODE_ENV'","instanceId":"'$INSTANCE_ID'","migrationEnabled":'$MIGRATION_ENABLED'}'
    
    # Create health check markers
    create_health_markers
    
    # Start migrations in background (non-blocking)
    start_migrations
    
    # Brief pause to let migrations initialize
    sleep 1
    
    # Check initial migration status
    check_migration_status
    local migration_status=$?
    
    # Start Next.js application (main process)
    log "info" "Starting Next.js application" '{"migrationStatus":'$migration_status'}'
    
    # Execute Node.js server and capture PID
    node server.js &
    NODE_PID=$!
    
    log "info" "Next.js application started" '{"pid":'$NODE_PID'}'
    
    # Wait for Node.js process (blocking)
    wait $NODE_PID
    local node_exit_code=$?
    
    log "info" "Next.js application exited" '{"exitCode":'$node_exit_code'}'
    
    # Final migration status check for logging
    if [ -f /tmp/migrations/pid ]; then
        local migration_pid=$(cat /tmp/migrations/pid)
        if kill -0 $migration_pid 2>/dev/null; then
            log "info" "Migration process still running, leaving it to complete"
        else
            check_migration_status
        fi
    fi
    
    exit $node_exit_code
}

# Validate environment before starting
if [ ! -f "server.js" ]; then
    log "error" "server.js not found in current directory" '{"pwd":"'$(pwd)'"}'
    exit 1
fi

if [ ! -d "supabase/migrations" ]; then
    log "warn" "supabase/migrations directory not found, migrations will be skipped" '{"pwd":"'$(pwd)'"}'
fi

# Execute main function
main "$@"