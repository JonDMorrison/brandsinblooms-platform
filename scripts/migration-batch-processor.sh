#!/bin/bash

# Migration Batch Processor
# Handles large migrations by processing them in optimized batches

set -e

export LOG_PREFIX="[BATCH-PROCESSOR]"
export LARGE_MIGRATION_THRESHOLD="${LARGE_MIGRATION_THRESHOLD:-100000}"  # 100KB
export BATCH_SIZE="${BATCH_SIZE:-5}"  # Process 5 small migrations at a time
export BATCH_MEMORY_MULTIPLIER="${BATCH_MEMORY_MULTIPLIER:-1.5}"  # 1.5x memory for large files

# Structured logging function
log() {
    local level="$1"
    local message="$2"
    local metadata="${3:-{}}"
    
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") $LOG_PREFIX [$level] $message $metadata"
}

# Function to get file size in bytes
get_file_size() {
    local file_path="$1"
    if [ -f "$file_path" ]; then
        stat -c%s "$file_path" 2>/dev/null || wc -c < "$file_path"
    else
        echo "0"
    fi
}

# Function to categorize migrations by size
categorize_migrations() {
    local migrations_dir="$1"
    local large_files=""
    local small_files=""
    
    if [ ! -d "$migrations_dir" ]; then
        log "error" "Migrations directory not found" '{"path":"'$migrations_dir'"}'
        return 1
    fi
    
    for migration_file in "$migrations_dir"/*.sql; do
        if [ -f "$migration_file" ]; then
            local file_size=$(get_file_size "$migration_file")
            local file_name=$(basename "$migration_file")
            
            if [ "$file_size" -gt "$LARGE_MIGRATION_THRESHOLD" ]; then
                large_files="$large_files $migration_file"
                log "info" "Large migration detected" '{"file":"'$file_name'","sizeBytes":'$file_size'}'
            else
                small_files="$small_files $migration_file"
            fi
        fi
    done
    
    echo "$large_files|$small_files"
}

# Function to process large migration individually
process_large_migration() {
    local migration_file="$1"
    local enhanced_memory="$2"
    local file_name=$(basename "$migration_file")
    local file_size=$(get_file_size "$migration_file")
    
    log "info" "Processing large migration individually" '{"file":"'$file_name'","sizeBytes":'$file_size',"memoryMB":'$enhanced_memory'}'
    
    # Set enhanced memory limits for large migrations
    export MIGRATION_MAX_MEMORY_MB="$enhanced_memory"
    export GOMEMLIMIT="${enhanced_memory}m"
    
    # Process single large file
    timeout $MIGRATION_TIMEOUT supabase db push \
        --db-url "${DATABASE_URL:-$SUPABASE_DB_URL}" \
        --include-seed false \
        --include-roles false \
        --file "$migration_file" \
        2>&1 | while IFS= read -r line; do
            echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") [LARGE-MIGRATION] $line"
        done
    
    local exit_code=${PIPESTATUS[0]}
    
    if [ $exit_code -eq 0 ]; then
        log "info" "Large migration completed successfully" '{"file":"'$file_name'"}'
        return 0
    else
        log "error" "Large migration failed" '{"file":"'$file_name'","exitCode":'$exit_code'}'
        return $exit_code
    fi
}

# Function to process batch of small migrations
process_small_batch() {
    local batch_files="$1"
    local batch_number="$2"
    local file_count=$(echo $batch_files | wc -w)
    
    log "info" "Processing batch of small migrations" '{"batchNumber":'$batch_number',"fileCount":'$file_count'}'
    
    # Process batch together
    for migration_file in $batch_files; do
        local file_name=$(basename "$migration_file")
        log "info" "Processing migration in batch" '{"file":"'$file_name'","batch":'$batch_number'}'
        
        timeout $MIGRATION_TIMEOUT supabase db push \
            --db-url "${DATABASE_URL:-$SUPABASE_DB_URL}" \
            --include-seed false \
            --include-roles false \
            --file "$migration_file" \
            2>&1 | while IFS= read -r line; do
                echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") [BATCH-$batch_number] $line"
            done
        
        local exit_code=${PIPESTATUS[0]}
        
        if [ $exit_code -ne 0 ]; then
            log "error" "Migration in batch failed" '{"file":"'$file_name'","batch":'$batch_number',"exitCode":'$exit_code'}'
            return $exit_code
        fi
    done
    
    log "info" "Batch completed successfully" '{"batchNumber":'$batch_number',"fileCount":'$file_count'}'
    return 0
}

# Main batch processing function
process_migrations_in_batches() {
    local migrations_dir="${1:-/app/supabase/migrations}"
    local base_memory="${MIGRATION_MAX_MEMORY_MB:-512}"
    
    log "info" "Starting batch migration processing" '{"directory":"'$migrations_dir'","baseMemoryMB":'$base_memory'}'
    
    # Categorize migrations
    local categorization=$(categorize_migrations "$migrations_dir")
    local large_files=$(echo "$categorization" | cut -d'|' -f1)
    local small_files=$(echo "$categorization" | cut -d'|' -f2)
    
    local large_count=$(echo $large_files | wc -w)
    local small_count=$(echo $small_files | wc -w)
    
    log "info" "Migration categorization complete" '{"largeFiles":'$large_count',"smallFiles":'$small_count'}'
    
    # Process large migrations individually with enhanced memory
    if [ "$large_count" -gt 0 ]; then
        local enhanced_memory=$(echo "$base_memory * $BATCH_MEMORY_MULTIPLIER" | bc | cut -d. -f1)
        
        for large_file in $large_files; do
            if ! process_large_migration "$large_file" "$enhanced_memory"; then
                log "error" "Large migration processing failed, aborting batch"
                return 1
            fi
            
            # Brief pause between large migrations
            sleep 2
        done
    fi
    
    # Process small migrations in batches
    if [ "$small_count" -gt 0 ]; then
        local batch_number=1
        local current_batch=""
        local batch_count=0
        
        for small_file in $small_files; do
            current_batch="$current_batch $small_file"
            batch_count=$((batch_count + 1))
            
            # Process batch when it reaches the limit or is the last batch
            if [ $batch_count -eq $BATCH_SIZE ] || [ $(echo $small_files | wc -w) -eq $(echo "$current_batch" | wc -w) ]; then
                if ! process_small_batch "$current_batch" "$batch_number"; then
                    log "error" "Small migration batch processing failed, aborting"
                    return 1
                fi
                
                # Reset for next batch
                current_batch=""
                batch_count=0
                batch_number=$((batch_number + 1))
                
                # Brief pause between batches
                sleep 1
            fi
        done
    fi
    
    log "info" "All migration batches processed successfully"
    return 0
}

# Function to analyze migration complexity
analyze_migrations() {
    local migrations_dir="${1:-/app/supabase/migrations}"
    
    if [ ! -d "$migrations_dir" ]; then
        log "error" "Migrations directory not found for analysis" '{"path":"'$migrations_dir'"}'
        return 1
    fi
    
    local total_files=0
    local total_size=0
    local large_files=0
    local max_size=0
    local max_file=""
    
    for migration_file in "$migrations_dir"/*.sql; do
        if [ -f "$migration_file" ]; then
            local file_size=$(get_file_size "$migration_file")
            local file_name=$(basename "$migration_file")
            
            total_files=$((total_files + 1))
            total_size=$((total_size + file_size))
            
            if [ "$file_size" -gt "$LARGE_MIGRATION_THRESHOLD" ]; then
                large_files=$((large_files + 1))
            fi
            
            if [ "$file_size" -gt "$max_size" ]; then
                max_size="$file_size"
                max_file="$file_name"
            fi
        fi
    done
    
    local avg_size=$((total_size / total_files))
    local total_size_mb=$((total_size / 1024 / 1024))
    
    cat << EOF
{
  "migrationAnalysis": {
    "totalFiles": $total_files,
    "totalSizeMB": $total_size_mb,
    "averageSizeBytes": $avg_size,
    "largeFiles": $large_files,
    "largeFileThresholdBytes": $LARGE_MIGRATION_THRESHOLD,
    "largestFile": {
      "name": "$max_file",
      "sizeBytes": $max_size
    }
  },
  "batchingRecommendation": {
    "useBatching": $([ $large_files -gt 0 ] && echo "true" || echo "false"),
    "recommendedBatchSize": $BATCH_SIZE,
    "estimatedBatches": $(((total_files - large_files + BATCH_SIZE - 1) / BATCH_SIZE))
  }
}
EOF
}

# Main execution
main() {
    local command="${1:-process}"
    local migrations_dir="${2:-/app/supabase/migrations}"
    
    case "$command" in
        "process")
            process_migrations_in_batches "$migrations_dir"
            ;;
        "analyze")
            analyze_migrations "$migrations_dir"
            ;;
        *)
            echo "Usage: $0 {process|analyze} [migrations_directory]"
            echo "  process - Process migrations in optimized batches"
            echo "  analyze - Analyze migration complexity and provide recommendations"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"