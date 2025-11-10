#!/usr/bin/env tsx
/**
 * Event Storage Bucket Cleanup Script
 * Phase 4: Safe Bucket Removal
 *
 * ⚠️  WARNING: THIS SCRIPT PERFORMS DESTRUCTIVE OPERATIONS ⚠️
 * Only run after verification script passes all checks
 *
 * Usage:
 *   pnpm tsx scripts/cleanup-supabase-event-storage.ts --dry-run
 *   pnpm tsx scripts/cleanup-supabase-event-storage.ts --confirm-delete
 *
 * Safety Requirements:
 *   1. Verification script must pass all checks
 *   2. Migration must be 30+ days old
 *   3. Explicit --confirm-delete flag required
 *   4. Backup recommended before deletion
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import readline from 'readline';
import { execSync } from 'child_process';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Parse command line arguments
const DRY_RUN = process.argv.includes('--dry-run');
const CONFIRM_DELETE = process.argv.includes('--confirm-delete');
const SKIP_VERIFICATION = process.argv.includes('--skip-verification');
const BACKUP_METADATA = !process.argv.includes('--no-backup');

// Safety constants
const REQUIRED_DAYS_SINCE_MIGRATION = 30;
const BUCKETS_TO_CLEAN = ['event_media', 'event_attachments'];

// Types
interface BucketInfo {
  name: string;
  objectCount: number;
  totalSize: number;
  created_at: string;
  updated_at: string;
}

interface CleanupResult {
  bucket: string;
  status: 'skipped' | 'backed_up' | 'deleted' | 'failed';
  message: string;
  metadata?: any;
}

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(chalk.red('❌ Missing required environment variables'));
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Create readline interface for user input
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Ask user for confirmation
 */
function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Run verification script
 */
async function runVerification(): Promise<boolean> {
  if (SKIP_VERIFICATION) {
    console.log(chalk.yellow('⚠️  Skipping verification (--skip-verification flag used)'));
    return true;
  }

  console.log(chalk.blue('\n🔍 Running verification script...'));

  try {
    execSync('pnpm tsx scripts/verify-event-migration-complete.ts', {
      stdio: 'inherit',
    });
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Verification failed'));
    return false;
  }
}

/**
 * Get bucket information
 */
async function getBucketInfo(bucketName: string): Promise<BucketInfo | null> {
  try {
    // Get bucket metadata
    const { data: bucket, error: bucketError } = await supabase
      .storage
      .getBucket(bucketName);

    if (bucketError || !bucket) {
      return null;
    }

    // List objects to get count and size
    const { data: objects, error: objectsError } = await supabase
      .storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        offset: 0,
      });

    const objectCount = objects?.length || 0;
    let totalSize = 0;

    if (objects) {
      for (const obj of objects) {
        // Note: Size might not be available in list response
        // This is an approximation
        totalSize += (obj as any).metadata?.size || 0;
      }
    }

    return {
      name: bucketName,
      objectCount,
      totalSize,
      created_at: bucket.created_at,
      updated_at: bucket.updated_at,
    };
  } catch (error) {
    console.error(chalk.red(`Failed to get info for bucket ${bucketName}:`, error));
    return null;
  }
}

/**
 * Backup bucket metadata
 */
async function backupBucketMetadata(bucketInfo: BucketInfo): Promise<boolean> {
  if (!BACKUP_METADATA) {
    return true;
  }

  const backupDir = join(process.cwd(), 'backups', 'event-storage');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = join(backupDir, `${bucketInfo.name}-metadata-${timestamp}.json`);

  try {
    // Create backup directory if it doesn't exist
    mkdirSync(backupDir, { recursive: true });

    // Get list of all objects in bucket
    const { data: objects } = await supabase
      .storage
      .from(bucketInfo.name)
      .list('', {
        limit: 10000,
        offset: 0,
      });

    // Create backup data
    const backupData = {
      bucket: bucketInfo,
      objects: objects || [],
      backup_timestamp: new Date().toISOString(),
      backup_reason: 'Pre-deletion backup for event storage migration',
    };

    // Write backup file
    writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    console.log(chalk.green(`  ✅ Metadata backed up to: ${backupFile}`));
    return true;
  } catch (error) {
    console.error(chalk.red(`  ❌ Failed to backup metadata:`, error));
    return false;
  }
}

/**
 * Delete all objects in a bucket
 */
async function deleteAllObjects(bucketName: string): Promise<boolean> {
  try {
    // List all objects
    const { data: objects, error: listError } = await supabase
      .storage
      .from(bucketName)
      .list('', {
        limit: 10000,
        offset: 0,
      });

    if (listError) {
      console.error(chalk.red(`  ❌ Failed to list objects:`, listError.message));
      return false;
    }

    if (!objects || objects.length === 0) {
      console.log(chalk.gray(`  ℹ️  No objects to delete in ${bucketName}`));
      return true;
    }

    // Delete objects in batches
    const batchSize = 100;
    const paths = objects.map(obj => obj.name);

    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, Math.min(i + batchSize, paths.length));

      if (DRY_RUN) {
        console.log(chalk.gray(`  [DRY RUN] Would delete ${batch.length} objects`));
      } else {
        const { error: deleteError } = await supabase
          .storage
          .from(bucketName)
          .remove(batch);

        if (deleteError) {
          console.error(chalk.red(`  ❌ Failed to delete objects:`, deleteError.message));
          return false;
        }

        console.log(chalk.gray(`  Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} objects`));
      }
    }

    return true;
  } catch (error) {
    console.error(chalk.red(`  ❌ Error deleting objects:`, error));
    return false;
  }
}

/**
 * Delete a storage bucket
 */
async function deleteBucket(bucketName: string): Promise<CleanupResult> {
  console.log(chalk.blue(`\n🗑️  Processing bucket: ${bucketName}`));

  // Get bucket info
  const bucketInfo = await getBucketInfo(bucketName);

  if (!bucketInfo) {
    return {
      bucket: bucketName,
      status: 'skipped',
      message: 'Bucket not found',
    };
  }

  console.log(chalk.gray(`  Objects: ${bucketInfo.objectCount}`));
  console.log(chalk.gray(`  Size: ${(bucketInfo.totalSize / 1024 / 1024).toFixed(2)} MB`));
  console.log(chalk.gray(`  Created: ${bucketInfo.created_at}`));

  // Backup metadata
  if (BACKUP_METADATA) {
    const backupSuccess = await backupBucketMetadata(bucketInfo);
    if (!backupSuccess && !DRY_RUN) {
      return {
        bucket: bucketName,
        status: 'failed',
        message: 'Failed to backup metadata',
        metadata: bucketInfo,
      };
    }
  }

  // Delete all objects first
  console.log(chalk.yellow(`  🗑️  Deleting all objects in ${bucketName}...`));
  const objectsDeleted = await deleteAllObjects(bucketName);

  if (!objectsDeleted && !DRY_RUN) {
    return {
      bucket: bucketName,
      status: 'failed',
      message: 'Failed to delete objects',
      metadata: bucketInfo,
    };
  }

  // Delete the bucket itself
  if (DRY_RUN) {
    console.log(chalk.gray(`  [DRY RUN] Would delete bucket: ${bucketName}`));
    return {
      bucket: bucketName,
      status: 'skipped',
      message: 'Dry run - no changes made',
      metadata: bucketInfo,
    };
  }

  // Note: Supabase doesn't provide a direct API to delete buckets
  // This would typically be done through the dashboard or database
  console.log(chalk.yellow(`  ⚠️  Bucket deletion must be done manually through Supabase dashboard`));
  console.log(chalk.gray(`     Go to: Storage > ${bucketName} > Settings > Delete bucket`));

  return {
    bucket: bucketName,
    status: 'backed_up',
    message: 'Objects deleted, bucket removal pending (manual action required)',
    metadata: bucketInfo,
  };
}

/**
 * Check migration age
 */
async function checkMigrationAge(): Promise<number> {
  const { data, error } = await supabase.rpc('get_event_storage_migration_stats');

  if (error || !data) {
    return 0;
  }

  const stats = data as any;
  return stats?.migration_log?.days_since_first || 0;
}

/**
 * Main cleanup function
 */
async function main() {
  console.log(chalk.bold('\n🧹 Event Storage Cleanup Script'));
  console.log(chalk.red.bold('⚠️  WARNING: This script performs DESTRUCTIVE operations'));
  console.log(chalk.gray('=' .repeat(50)));

  // Show mode
  if (DRY_RUN) {
    console.log(chalk.yellow('🔸 Running in DRY RUN mode (no changes will be made)'));
  } else if (CONFIRM_DELETE) {
    console.log(chalk.red('🔴 Running in DELETE mode (destructive operations enabled)'));
  } else {
    console.log(chalk.red('❌ Neither --dry-run nor --confirm-delete flag provided'));
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.gray('  pnpm tsx scripts/cleanup-supabase-event-storage.ts --dry-run'));
    console.log(chalk.gray('  pnpm tsx scripts/cleanup-supabase-event-storage.ts --confirm-delete'));
    process.exit(1);
  }

  // Run verification
  const verificationPassed = await runVerification();
  if (!verificationPassed && !SKIP_VERIFICATION) {
    console.log(chalk.red('\n❌ Verification failed. Cannot proceed with cleanup.'));
    console.log(chalk.gray('Fix all issues or use --skip-verification to bypass (NOT RECOMMENDED)'));
    rl.close();
    process.exit(1);
  }

  // Check migration age
  const daysSinceMigration = await checkMigrationAge();
  console.log(chalk.blue(`\n📅 Days since migration: ${daysSinceMigration}`));

  if (daysSinceMigration < REQUIRED_DAYS_SINCE_MIGRATION) {
    console.log(chalk.yellow(`⚠️  Migration is only ${daysSinceMigration} days old`));
    console.log(chalk.yellow(`   Recommended to wait ${REQUIRED_DAYS_SINCE_MIGRATION - daysSinceMigration} more days`));

    if (!DRY_RUN) {
      const proceed = await askConfirmation(
        chalk.yellow('Do you want to proceed anyway? (not recommended) [y/N]: ')
      );

      if (!proceed) {
        console.log(chalk.gray('Cleanup cancelled'));
        rl.close();
        process.exit(0);
      }
    }
  }

  // Final confirmation for delete mode
  if (CONFIRM_DELETE && !DRY_RUN) {
    console.log(chalk.red.bold('\n⚠️  FINAL WARNING'));
    console.log(chalk.red('You are about to DELETE Supabase Storage buckets.'));
    console.log(chalk.red('This action is IRREVERSIBLE.'));
    console.log(chalk.red(`Buckets to be cleaned: ${BUCKETS_TO_CLEAN.join(', ')}`));

    const finalConfirm = await askConfirmation(
      chalk.red.bold('Type "yes" to confirm deletion: ')
    );

    if (!finalConfirm) {
      console.log(chalk.gray('Cleanup cancelled'));
      rl.close();
      process.exit(0);
    }
  }

  // Process each bucket
  console.log(chalk.bold('\n🗑️  Cleaning Storage Buckets'));
  console.log(chalk.gray('=' .repeat(50)));

  const results: CleanupResult[] = [];

  for (const bucketName of BUCKETS_TO_CLEAN) {
    const result = await deleteBucket(bucketName);
    results.push(result);
  }

  // Summary
  console.log(chalk.bold('\n📊 Cleanup Summary'));
  console.log(chalk.gray('=' .repeat(50)));

  results.forEach(result => {
    const icon = result.status === 'deleted' || result.status === 'backed_up' ? '✅' :
                 result.status === 'failed' ? '❌' : 'ℹ️';
    const color = result.status === 'failed' ? chalk.red :
                  result.status === 'skipped' ? chalk.gray : chalk.green;

    console.log(color(`${icon} ${result.bucket}: ${result.message}`));
  });

  // Next steps
  console.log(chalk.bold('\n📋 Next Steps'));
  console.log(chalk.gray('=' .repeat(50)));

  if (DRY_RUN) {
    console.log(chalk.gray('1. Review the dry run output'));
    console.log(chalk.gray('2. Ensure all files are migrated to CDN'));
    console.log(chalk.gray('3. Run with --confirm-delete to perform actual cleanup'));
  } else {
    console.log(chalk.gray('1. Manually delete buckets in Supabase dashboard'));
    console.log(chalk.gray('2. Update code to remove Supabase Storage references'));
    console.log(chalk.gray('3. Remove feature flag after confirming stability'));
    console.log(chalk.gray('4. Document the completion date'));
  }

  // Log completion to migration log
  if (!DRY_RUN && CONFIRM_DELETE) {
    const { error } = await supabase
      .from('event_storage_migration_log')
      .insert({
        source_type: 'system',
        source_id: '00000000-0000-0000-0000-000000000000',
        old_url: 'supabase_storage_buckets',
        new_url: 'cleanup_completed',
        status: 'completed',
        metadata: {
          action: 'cleanup_script_executed',
          buckets_processed: BUCKETS_TO_CLEAN,
          results: results,
          cleanup_date: new Date().toISOString(),
        },
      });

    if (error) {
      console.error(chalk.yellow('⚠️  Failed to log cleanup to migration log:', error.message));
    }
  }

  rl.close();
  process.exit(0);
}

// Run cleanup
main().catch(error => {
  console.error(chalk.red('❌ Cleanup failed with error:'));
  console.error(error);
  rl.close();
  process.exit(1);
});