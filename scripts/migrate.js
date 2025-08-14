#!/usr/bin/env node

/**
 * Production-grade migration runner for Supabase
 * Handles database migrations with distributed locking, error recovery, and monitoring
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile, stat } from 'fs/promises';
import { resolve, basename } from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';

class MigrationRunner {
  constructor() {
    this.instanceId = `${process.env.HOSTNAME || 'unknown'}-${process.pid}`;
    this.startTime = Date.now();
    this.migrationTimeout = parseInt(process.env.MIGRATION_TIMEOUT || '300', 10) * 1000; // 5 minutes
    this.retryCount = parseInt(process.env.MIGRATION_RETRY_COUNT || '3', 10);
    this.retryDelay = parseInt(process.env.MIGRATION_RETRY_DELAY || '5', 10) * 1000; // 5 seconds
    
    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });
    
    this.log('info', 'Migration runner initialized', { instanceId: this.instanceId });
  }

  /**
   * Structured logging with correlation tracking
   */
  log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      instanceId: this.instanceId,
      duration: Date.now() - this.startTime,
      component: 'migration-runner',
      ...metadata
    };
    
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Initialize migration infrastructure tables
   */
  async initializeMigrationTables() {
    try {
      // Create migration locks table for distributed coordination
      await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS migration_locks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            instance_id TEXT NOT NULL,
            locked_at TIMESTAMPTZ DEFAULT NOW(),
            migration_batch TEXT NOT NULL,
            UNIQUE(migration_batch)
          );
          
          CREATE TABLE IF NOT EXISTS migration_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            filename TEXT NOT NULL UNIQUE,
            checksum TEXT NOT NULL,
            executed_at TIMESTAMPTZ DEFAULT NOW(),
            executed_by TEXT NOT NULL,
            execution_time_ms INTEGER
          );
          
          -- Function to acquire migration lock with cleanup
          CREATE OR REPLACE FUNCTION acquire_migration_lock(
            p_instance_id TEXT,
            p_migration_batch TEXT
          ) RETURNS BOOLEAN AS $$
          BEGIN
            -- Clean up stale locks (older than 5 minutes)
            DELETE FROM migration_locks 
            WHERE locked_at < NOW() - INTERVAL '5 minutes';
            
            -- Try to acquire lock
            INSERT INTO migration_locks (instance_id, migration_batch)
            VALUES (p_instance_id, p_migration_batch)
            ON CONFLICT (migration_batch) DO NOTHING;
            
            RETURN FOUND;
          END;
          $$ LANGUAGE plpgsql;
          
          -- Function to release migration lock
          CREATE OR REPLACE FUNCTION release_migration_lock(
            p_instance_id TEXT,
            p_migration_batch TEXT
          ) RETURNS BOOLEAN AS $$
          BEGIN
            DELETE FROM migration_locks 
            WHERE instance_id = p_instance_id AND migration_batch = p_migration_batch;
            
            RETURN FOUND;
          END;
          $$ LANGUAGE plpgsql;
        `
      });
      
      this.log('info', 'Migration infrastructure tables initialized');
      return true;
    } catch (error) {
      this.log('error', 'Failed to initialize migration tables', { error: error.message });
      return false;
    }
  }

  /**
   * Acquire distributed lock for migration execution
   */
  async acquireLock(migrationBatch) {
    try {
      const { data, error } = await this.supabase.rpc('acquire_migration_lock', {
        p_instance_id: this.instanceId,
        p_migration_batch: migrationBatch
      });
      
      if (error) {
        this.log('error', 'Failed to acquire migration lock', { error: error.message });
        return false;
      }
      
      const acquired = data === true;
      this.log(acquired ? 'info' : 'warn', 
        acquired ? 'Migration lock acquired' : 'Migration lock already held by another instance',
        { migrationBatch, acquired }
      );
      
      return acquired;
    } catch (error) {
      this.log('error', 'Error acquiring migration lock', { error: error.message });
      return false;
    }
  }

  /**
   * Release distributed lock
   */
  async releaseLock(migrationBatch) {
    try {
      await this.supabase.rpc('release_migration_lock', {
        p_instance_id: this.instanceId,
        p_migration_batch: migrationBatch
      });
      
      this.log('info', 'Migration lock released', { migrationBatch });
    } catch (error) {
      this.log('error', 'Failed to release migration lock', { error: error.message });
    }
  }

  /**
   * Calculate file checksum for change detection
   */
  calculateChecksum(content) {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get list of migration files from filesystem
   */
  async getMigrationFiles() {
    try {
      const migrationsDir = resolve(process.cwd(), 'supabase', 'migrations');
      const files = await readdir(migrationsDir);
      
      const sqlFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Chronological order
      
      const migrationFiles = [];
      
      for (const file of sqlFiles) {
        const filePath = resolve(migrationsDir, file);
        const content = await readFile(filePath, 'utf-8');
        const checksum = this.calculateChecksum(content);
        
        migrationFiles.push({
          filename: file,
          path: filePath,
          content,
          checksum
        });
      }
      
      this.log('info', 'Migration files loaded', { count: migrationFiles.length });
      return migrationFiles;
    } catch (error) {
      this.log('error', 'Failed to load migration files', { error: error.message });
      return [];
    }
  }

  /**
   * Check which migrations have already been executed
   */
  async getExecutedMigrations() {
    try {
      const { data, error } = await this.supabase
        .from('migration_history')
        .select('filename, checksum');
      
      if (error) {
        this.log('warn', 'Could not fetch migration history, assuming clean state', { error: error.message });
        return new Map();
      }
      
      const executed = new Map();
      data.forEach(row => {
        executed.set(row.filename, row.checksum);
      });
      
      this.log('info', 'Migration history loaded', { executedCount: executed.size });
      return executed;
    } catch (error) {
      this.log('warn', 'Error fetching migration history', { error: error.message });
      return new Map();
    }
  }

  /**
   * Execute a single migration file
   */
  async executeMigration(migration) {
    const startTime = Date.now();
    
    try {
      this.log('info', 'Executing migration', { filename: migration.filename });
      
      // Execute SQL via Supabase
      const { error } = await this.supabase.rpc('exec_sql', {
        sql: migration.content
      });
      
      if (error) {
        throw new Error(`Migration execution failed: ${error.message}`);
      }
      
      const executionTime = Date.now() - startTime;
      
      // Record successful execution
      await this.supabase
        .from('migration_history')
        .insert({
          filename: migration.filename,
          checksum: migration.checksum,
          executed_by: this.instanceId,
          execution_time_ms: executionTime
        });
      
      this.log('info', 'Migration executed successfully', {
        filename: migration.filename,
        executionTime
      });
      
      return true;
    } catch (error) {
      this.log('error', 'Migration execution failed', {
        filename: migration.filename,
        error: error.message,
        executionTime: Date.now() - startTime
      });
      return false;
    }
  }

  /**
   * Run pending migrations with retry logic
   */
  async runMigrations() {
    let attempt = 1;
    
    while (attempt <= this.retryCount) {
      try {
        this.log('info', 'Starting migration attempt', { attempt, maxAttempts: this.retryCount });
        
        // Initialize infrastructure if needed
        if (!(await this.initializeMigrationTables())) {
          throw new Error('Failed to initialize migration infrastructure');
        }
        
        // Get all migration files
        const migrationFiles = await this.getMigrationFiles();
        if (migrationFiles.length === 0) {
          this.log('info', 'No migration files found');
          return true;
        }
        
        // Get migration batch identifier (latest migration filename)
        const migrationBatch = migrationFiles[migrationFiles.length - 1].filename;
        
        // Acquire distributed lock
        if (!(await this.acquireLock(migrationBatch))) {
          this.log('info', 'Another instance is handling migrations, skipping');
          return true; // Not an error, just skip
        }
        
        try {
          // Get already executed migrations
          const executedMigrations = await this.getExecutedMigrations();
          
          // Find pending migrations
          const pendingMigrations = migrationFiles.filter(migration => {
            const executedChecksum = executedMigrations.get(migration.filename);
            
            if (!executedChecksum) {
              return true; // New migration
            }
            
            if (executedChecksum !== migration.checksum) {
              this.log('warn', 'Migration checksum mismatch - file may have been modified', {
                filename: migration.filename,
                expected: executedChecksum,
                actual: migration.checksum
              });
              return true; // Re-execute if checksum changed
            }
            
            return false; // Already executed
          });
          
          if (pendingMigrations.length === 0) {
            this.log('info', 'All migrations are up to date');
            return true;
          }
          
          this.log('info', 'Executing pending migrations', { count: pendingMigrations.length });
          
          // Execute pending migrations sequentially
          for (const migration of pendingMigrations) {
            if (!(await this.executeMigration(migration))) {
              throw new Error(`Migration failed: ${migration.filename}`);
            }
          }
          
          this.log('info', 'All migrations completed successfully', {
            executed: pendingMigrations.length,
            total: migrationFiles.length
          });
          
          return true;
          
        } finally {
          // Always release the lock
          await this.releaseLock(migrationBatch);
        }
        
      } catch (error) {
        this.log('error', 'Migration attempt failed', {
          attempt,
          error: error.message,
          stack: error.stack
        });
        
        if (attempt < this.retryCount) {
          this.log('info', 'Retrying migration', { 
            nextAttempt: attempt + 1,
            delay: this.retryDelay / 1000
          });
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
      
      attempt++;
    }
    
    this.log('error', 'All migration attempts failed', { attempts: this.retryCount });
    return false;
  }

  /**
   * Main execution method with timeout protection
   */
  async run() {
    try {
      this.log('info', 'Migration runner starting', {
        timeout: this.migrationTimeout / 1000,
        retryCount: this.retryCount
      });
      
      // Set up timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Migration timeout after ${this.migrationTimeout / 1000} seconds`));
        }, this.migrationTimeout);
      });
      
      // Race between migration execution and timeout
      const success = await Promise.race([
        this.runMigrations(),
        timeoutPromise
      ]);
      
      const totalTime = Date.now() - this.startTime;
      
      if (success) {
        this.log('info', 'Migration runner completed successfully', { totalTime });
        process.exit(0);
      } else {
        this.log('error', 'Migration runner failed', { totalTime });
        process.exit(1);
      }
      
    } catch (error) {
      this.log('error', 'Migration runner crashed', {
        error: error.message,
        stack: error.stack,
        totalTime: Date.now() - this.startTime
      });
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Migration runner received SIGTERM, shutting down...',
    component: 'migration-runner'
  }));
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Migration runner received SIGINT, shutting down...',
    component: 'migration-runner'
  }));
  process.exit(0);
});

// Auto-run in production/staging environments
const shouldAutoRun = process.env.NODE_ENV === 'production' || 
                     process.env.NODE_ENV === 'staging' ||
                     process.argv.includes('--run');

if (shouldAutoRun && !process.env.SKIP_MIGRATIONS) {
  const runner = new MigrationRunner();
  runner.run().catch(error => {
    console.error('Fatal migration error:', error);
    process.exit(1);
  });
} else {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Migration runner loaded but not executed (set NODE_ENV=production or use --run flag)',
    component: 'migration-runner'
  }));
}

export default MigrationRunner;