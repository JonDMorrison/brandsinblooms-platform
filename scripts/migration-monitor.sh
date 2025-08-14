#!/bin/bash

# Migration Monitor Script
# Provides real-time monitoring, recovery, and observability for database migrations

set -e

# Configuration
export LOG_PREFIX="[MIGRATION-MONITOR]"
export MONITOR_INTERVAL="${MONITOR_INTERVAL:-10}"  # Check every 10 seconds
export MEMORY_WARNING_THRESHOLD="${MEMORY_WARNING_THRESHOLD:-80}"  # Warn at 80% memory usage
export RECOVERY_ATTEMPTS="${RECOVERY_ATTEMPTS:-3}"
export PROGRESSIVE_MEMORY_INCREASE="${PROGRESSIVE_MEMORY_INCREASE:-256}"  # Increase by 256MB per retry

# Structured logging function
log() {
    local level="$1"
    local message="$2"
    local metadata="${3:-{}}"
    
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") $LOG_PREFIX [$level] $message $metadata"
}

# Function to get process memory usage in MB
get_process_memory() {
    local pid="$1"
    if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
        echo "0"
        return
    fi
    
    # Get memory usage from /proc/PID/status
    if [ -f "/proc/$pid/status" ]; then
        local vm_rss=$(grep "VmRSS:" "/proc/$pid/status" | awk '{print int($2/1024)}' 2>/dev/null || echo "0")
        echo "$vm_rss"
    else
        echo "0"
    fi
}

# Function to get system memory stats
get_system_memory_stats() {
    if [ -f /proc/meminfo ]; then
        local total_mb=$(grep MemTotal /proc/meminfo | awk '{print int($2/1024)}')
        local available_mb=$(grep MemAvailable /proc/meminfo | awk '{print int($2/1024)}' 2>/dev/null || echo "N/A")
        local free_mb=$(grep MemFree /proc/meminfo | awk '{print int($2/1024)}')
        local used_mb=$((total_mb - free_mb))
        local usage_percent=$((used_mb * 100 / total_mb))
        
        echo "$total_mb,$available_mb,$free_mb,$used_mb,$usage_percent"
    else
        echo "N/A,N/A,N/A,N/A,N/A"
    fi
}

# Function to check migration process health
check_migration_health() {
    local pid_file="/tmp/migrations/pid"
    
    if [ ! -f "$pid_file" ]; then
        log "warn" "Migration PID file not found"
        return 1
    fi
    
    local migration_pid=$(cat "$pid_file" 2>/dev/null || echo "")
    if [ -z "$migration_pid" ]; then
        log "warn" "Migration PID file is empty"
        return 1
    fi
    
    if ! kill -0 "$migration_pid" 2>/dev/null; then
        log "warn" "Migration process not running" '{"pid":'$migration_pid'}'
        return 1
    fi
    
    # Get process memory usage
    local process_memory=$(get_process_memory "$migration_pid")
    local system_stats=$(get_system_memory_stats)
    local total_mb=$(echo "$system_stats" | cut -d, -f1)
    local available_mb=$(echo "$system_stats" | cut -d, -f2)
    local usage_percent=$(echo "$system_stats" | cut -d, -f5)
    
    log "info" "Migration process health check" '{"pid":'$migration_pid',"processMemoryMB":'$process_memory',"systemMemoryUsagePercent":'$usage_percent',"availableMemoryMB":"'$available_mb'"}'
    
    # Check for memory warnings
    if [ "$usage_percent" != "N/A" ] && [ "$usage_percent" -ge "$MEMORY_WARNING_THRESHOLD" ]; then
        log "warn" "High system memory usage detected" '{"usagePercent":'$usage_percent',"threshold":'$MEMORY_WARNING_THRESHOLD'}'
    fi
    
    return 0
}

# Function to check migration status
get_migration_status() {
    if [ -f /tmp/migrations/completed ]; then
        echo "completed"
    elif [ -f /tmp/migrations/failed ]; then
        echo "failed"
    elif [ -f /tmp/migrations/running ]; then
        echo "running"
    else
        echo "unknown"
    fi
}

# Function to perform recovery attempt
attempt_recovery() {
    local attempt="$1"
    local max_attempts="$2"
    
    log "info" "Starting recovery attempt $attempt of $max_attempts"
    
    # Calculate new memory limit (progressive increase)
    local base_memory="${MIGRATION_MAX_MEMORY_MB:-512}"
    local new_memory=$((base_memory + (attempt * PROGRESSIVE_MEMORY_INCREASE)))
    
    log "info" "Recovery with increased memory allocation" '{"originalMB":'$base_memory',"newMB":'$new_memory',"attempt":'$attempt'}'
    
    # Clean up previous failed state
    rm -f /tmp/migrations/failed /tmp/migrations/failed.log /tmp/migrations/running
    
    # Set new memory limit and restart migrations
    export MIGRATION_MAX_MEMORY_MB="$new_memory"
    export GOMEMLIMIT="${GOMEMLIMIT:-$((new_memory * 90 / 100))m}"
    
    # Call the migration start function (assuming it exists in the environment)
    if command -v start_migrations >/dev/null 2>&1; then
        start_migrations
        return $?
    else
        log "error" "start_migrations function not available for recovery"
        return 1
    fi
}

# Function to monitor migrations continuously
monitor_migrations() {
    local monitoring_start=$(date +%s)
    local last_status="unknown"
    local consecutive_failures=0
    local recovery_attempts=0
    
    log "info" "Starting migration monitoring" '{"interval":'$MONITOR_INTERVAL',"memoryThreshold":'$MEMORY_WARNING_THRESHOLD'}'
    
    while true; do
        local current_status=$(get_migration_status)
        local monitoring_duration=$(($(date +%s) - monitoring_start))
        
        # Status change logging
        if [ "$current_status" != "$last_status" ]; then
            log "info" "Migration status changed" '{"from":"'$last_status'","to":"'$current_status'","monitoringDurationSeconds":'$monitoring_duration'}'
            last_status="$current_status"
        fi
        
        case "$current_status" in
            "completed")
                log "info" "Migration monitoring completed successfully" '{"totalDurationSeconds":'$monitoring_duration'}'
                break
                ;;
            "failed")
                consecutive_failures=$((consecutive_failures + 1))
                log "warn" "Migration failure detected" '{"consecutiveFailures":'$consecutive_failures',"recoveryAttempts":'$recovery_attempts'}'
                
                # Attempt recovery if within limits
                if [ $recovery_attempts -lt $RECOVERY_ATTEMPTS ]; then
                    recovery_attempts=$((recovery_attempts + 1))
                    
                    # Wait a bit before recovery
                    sleep 30
                    
                    if attempt_recovery "$recovery_attempts" "$RECOVERY_ATTEMPTS"; then
                        log "info" "Recovery attempt initiated" '{"attempt":'$recovery_attempts'}'
                        consecutive_failures=0
                    else
                        log "error" "Recovery attempt failed" '{"attempt":'$recovery_attempts'}'
                    fi
                else
                    log "error" "Maximum recovery attempts exceeded, monitoring stopped" '{"maxAttempts":'$RECOVERY_ATTEMPTS'}'
                    break
                fi
                ;;
            "running")
                # Perform health check
                check_migration_health
                ;;
            "unknown")
                log "warn" "Migration status unknown, checking for process"
                check_migration_health
                ;;
        esac
        
        sleep "$MONITOR_INTERVAL"
    done
}

# Function to generate migration health report
generate_health_report() {
    local status=$(get_migration_status)
    local system_stats=$(get_system_memory_stats)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    cat << EOF
{
  "timestamp": "$timestamp",
  "migrationStatus": "$status",
  "systemMemory": {
    "totalMB": $(echo "$system_stats" | cut -d, -f1),
    "availableMB": "$(echo "$system_stats" | cut -d, -f2)",
    "freeMB": $(echo "$system_stats" | cut -d, -f3),
    "usedMB": $(echo "$system_stats" | cut -d, -f4),
    "usagePercent": $(echo "$system_stats" | cut -d, -f5)
  },
  "configuration": {
    "migrationMaxMemoryMB": "${MIGRATION_MAX_MEMORY_MB:-512}",
    "memoryWarningThreshold": "$MEMORY_WARNING_THRESHOLD",
    "recoveryAttempts": "$RECOVERY_ATTEMPTS",
    "monitorInterval": "$MONITOR_INTERVAL"
  }
}
EOF
}

# Main execution
main() {
    local command="${1:-monitor}"
    
    case "$command" in
        "monitor")
            monitor_migrations
            ;;
        "health")
            generate_health_report
            ;;
        "status")
            echo $(get_migration_status)
            ;;
        "check")
            check_migration_health
            ;;
        *)
            echo "Usage: $0 {monitor|health|status|check}"
            echo "  monitor - Start continuous monitoring"
            echo "  health  - Generate health report"
            echo "  status  - Get current migration status"
            echo "  check   - Check migration process health"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"