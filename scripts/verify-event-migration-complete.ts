#!/usr/bin/env tsx
/**
 * Event Storage Migration Verification Script
 * Phase 4: Pre-Cleanup Verification
 *
 * Purpose: Verify 100% of files are migrated before allowing cleanup
 * Run this script before any destructive operations on Supabase Storage
 *
 * Usage:
 *   pnpm tsx scripts/verify-event-migration-complete.ts
 *   pnpm tsx scripts/verify-event-migration-complete.ts --check-urls
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { Tables } from '../src/lib/database/types';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CHECK_URLS = process.argv.includes('--check-urls');
const REQUIRED_DAYS_SINCE_MIGRATION = 30;

// Types
type EventMedia = Tables<'event_media'>;
type EventAttachment = Tables<'event_attachments'>;
type MigrationLogEntry = Tables<'event_storage_migration_log'>;

interface VerificationResult {
  check: string;
  passed: boolean;
  message: string;
  details?: any;
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
 * Check if a CDN URL is accessible
 */
async function checkUrlAccessibility(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Verify all event media files are migrated
 */
async function verifyEventMedia(): Promise<VerificationResult> {
  console.log(chalk.blue('\n📸 Checking event_media table...'));

  const { data: mediaFiles, error } = await supabase
    .from('event_media')
    .select('id, file_url, file_name, event_id');

  if (error) {
    return {
      check: 'event_media',
      passed: false,
      message: `Failed to query event_media: ${error.message}`,
    };
  }

  const total = mediaFiles?.length || 0;
  const onSupabase = mediaFiles?.filter(m => m.file_url?.includes('supabase')) || [];
  const onCDN = mediaFiles?.filter(m => !m.file_url?.includes('supabase')) || [];

  const result: VerificationResult = {
    check: 'event_media',
    passed: onSupabase.length === 0,
    message: `${onCDN.length}/${total} files on CDN`,
    details: {
      total,
      migrated: onCDN.length,
      unmigrated: onSupabase.length,
      unmigrated_files: onSupabase.slice(0, 5).map(f => ({
        id: f.id,
        file_name: f.file_name,
        event_id: f.event_id,
      })),
    },
  };

  if (onSupabase.length > 0) {
    console.log(chalk.yellow(`  ⚠️  ${onSupabase.length} files still on Supabase Storage`));
    if (onSupabase.length <= 5) {
      onSupabase.forEach(f => {
        console.log(chalk.gray(`     - ${f.file_name} (Event: ${f.event_id})`));
      });
    } else {
      console.log(chalk.gray(`     (showing first 5 of ${onSupabase.length})`));
    }
  } else {
    console.log(chalk.green(`  ✅ All ${total} files migrated to CDN`));
  }

  return result;
}

/**
 * Verify all event attachment files are migrated
 */
async function verifyEventAttachments(): Promise<VerificationResult> {
  console.log(chalk.blue('\n📎 Checking event_attachments table...'));

  const { data: attachments, error } = await supabase
    .from('event_attachments')
    .select('id, file_url, file_name, event_id');

  if (error) {
    return {
      check: 'event_attachments',
      passed: false,
      message: `Failed to query event_attachments: ${error.message}`,
    };
  }

  const total = attachments?.length || 0;
  const onSupabase = attachments?.filter(a => a.file_url?.includes('supabase')) || [];
  const onCDN = attachments?.filter(a => !a.file_url?.includes('supabase')) || [];

  const result: VerificationResult = {
    check: 'event_attachments',
    passed: onSupabase.length === 0,
    message: `${onCDN.length}/${total} files on CDN`,
    details: {
      total,
      migrated: onCDN.length,
      unmigrated: onSupabase.length,
      unmigrated_files: onSupabase.slice(0, 5).map(f => ({
        id: f.id,
        file_name: f.file_name,
        event_id: f.event_id,
      })),
    },
  };

  if (onSupabase.length > 0) {
    console.log(chalk.yellow(`  ⚠️  ${onSupabase.length} files still on Supabase Storage`));
    if (onSupabase.length <= 5) {
      onSupabase.forEach(f => {
        console.log(chalk.gray(`     - ${f.file_name} (Event: ${f.event_id})`));
      });
    }
  } else {
    console.log(chalk.green(`  ✅ All ${total} files migrated to CDN`));
  }

  return result;
}

/**
 * Verify CDN URLs are accessible (optional check)
 */
async function verifyCDNAccessibility(): Promise<VerificationResult> {
  if (!CHECK_URLS) {
    return {
      check: 'cdn_accessibility',
      passed: true,
      message: 'Skipped (use --check-urls to enable)',
    };
  }

  console.log(chalk.blue('\n🔗 Checking CDN URL accessibility...'));
  console.log(chalk.gray('  (This may take a while...)'));

  // Get all CDN URLs
  const { data: mediaFiles } = await supabase
    .from('event_media')
    .select('file_url')
    .not('file_url', 'like', '%supabase%')
    .limit(10); // Check sample for performance

  const { data: attachments } = await supabase
    .from('event_attachments')
    .select('file_url')
    .not('file_url', 'like', '%supabase%')
    .limit(10); // Check sample for performance

  const urls = [
    ...(mediaFiles?.map(m => m.file_url).filter(Boolean) || []),
    ...(attachments?.map(a => a.file_url).filter(Boolean) || []),
  ];

  if (urls.length === 0) {
    return {
      check: 'cdn_accessibility',
      passed: true,
      message: 'No CDN URLs to check',
    };
  }

  let accessible = 0;
  let inaccessible = 0;
  const failedUrls: string[] = [];

  for (const url of urls) {
    const isAccessible = await checkUrlAccessibility(url);
    if (isAccessible) {
      accessible++;
      process.stdout.write(chalk.green('.'));
    } else {
      inaccessible++;
      failedUrls.push(url);
      process.stdout.write(chalk.red('x'));
    }
  }
  console.log(); // New line after progress dots

  const result: VerificationResult = {
    check: 'cdn_accessibility',
    passed: inaccessible === 0,
    message: `${accessible}/${urls.length} URLs accessible`,
    details: {
      total_checked: urls.length,
      accessible,
      inaccessible,
      failed_urls: failedUrls.slice(0, 3),
    },
  };

  if (inaccessible > 0) {
    console.log(chalk.yellow(`  ⚠️  ${inaccessible} URLs not accessible`));
    failedUrls.slice(0, 3).forEach(url => {
      console.log(chalk.gray(`     - ${url}`));
    });
  } else {
    console.log(chalk.green(`  ✅ All sampled CDN URLs are accessible`));
  }

  return result;
}

/**
 * Check migration log for pending items
 */
async function checkMigrationLog(): Promise<VerificationResult> {
  console.log(chalk.blue('\n📋 Checking migration log...'));

  const { data: logEntries, error } = await supabase
    .from('event_storage_migration_log')
    .select('status, created_at');

  if (error) {
    return {
      check: 'migration_log',
      passed: false,
      message: `Failed to query migration log: ${error.message}`,
    };
  }

  const statusCounts = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    failed: 0,
  };

  let earliestMigration: Date | null = null;

  logEntries?.forEach(entry => {
    statusCounts[entry.status as keyof typeof statusCounts]++;
    if (entry.status === 'completed' && entry.created_at) {
      const date = new Date(entry.created_at);
      if (!earliestMigration || date < earliestMigration) {
        earliestMigration = date;
      }
    }
  });

  const daysSinceMigration = earliestMigration
    ? Math.floor((Date.now() - earliestMigration.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const result: VerificationResult = {
    check: 'migration_log',
    passed: statusCounts.pending === 0 && statusCounts.failed === 0,
    message: `${statusCounts.completed} completed, ${statusCounts.pending} pending, ${statusCounts.failed} failed`,
    details: {
      ...statusCounts,
      earliest_migration: earliestMigration?.toISOString(),
      days_since_migration: daysSinceMigration,
    },
  };

  console.log(chalk.gray(`  📊 Status: ${statusCounts.completed} completed, ${statusCounts.pending} pending, ${statusCounts.failed} failed`));

  if (statusCounts.pending > 0 || statusCounts.failed > 0) {
    console.log(chalk.yellow(`  ⚠️  Unresolved migration items exist`));
  } else {
    console.log(chalk.green(`  ✅ All migrations completed successfully`));
  }

  if (earliestMigration) {
    console.log(chalk.gray(`  📅 First migration: ${daysSinceMigration} days ago`));
    if (daysSinceMigration < REQUIRED_DAYS_SINCE_MIGRATION) {
      console.log(chalk.yellow(`  ⚠️  Wait ${REQUIRED_DAYS_SINCE_MIGRATION - daysSinceMigration} more days before cleanup`));
    }
  }

  return result;
}

/**
 * Check feature flag status
 */
async function checkFeatureFlag(): Promise<VerificationResult> {
  console.log(chalk.blue('\n🚩 Checking feature flag...'));

  // Check if R2_STORAGE_ENABLED is set in environment
  const flagEnabled = process.env.R2_STORAGE_ENABLED === 'true';

  const result: VerificationResult = {
    check: 'feature_flag',
    passed: flagEnabled,
    message: flagEnabled ? 'R2 storage enabled' : 'R2 storage disabled',
    details: {
      R2_STORAGE_ENABLED: process.env.R2_STORAGE_ENABLED || 'not set',
    },
  };

  if (flagEnabled) {
    console.log(chalk.green(`  ✅ R2_STORAGE_ENABLED is true`));
  } else {
    console.log(chalk.yellow(`  ⚠️  R2_STORAGE_ENABLED is not true`));
    console.log(chalk.gray('     Set R2_STORAGE_ENABLED=true in production'));
  }

  return result;
}

/**
 * Run migration statistics query
 */
async function getMigrationStats(): Promise<VerificationResult> {
  console.log(chalk.blue('\n📊 Getting migration statistics...'));

  const { data, error } = await supabase.rpc('get_event_storage_migration_stats');

  if (error) {
    return {
      check: 'migration_stats',
      passed: false,
      message: `Failed to get stats: ${error.message}`,
    };
  }

  const stats = data as any;
  const readyForCleanup = stats?.summary?.ready_for_cleanup || false;

  console.log(chalk.gray('\n  Event Media:'));
  console.log(chalk.gray(`    - Total: ${stats?.event_media?.total || 0}`));
  console.log(chalk.gray(`    - On CDN: ${stats?.event_media?.on_cdn || 0} (${stats?.event_media?.migration_percentage || 0}%)`));
  console.log(chalk.gray(`    - On Supabase: ${stats?.event_media?.on_supabase || 0}`));

  console.log(chalk.gray('\n  Event Attachments:'));
  console.log(chalk.gray(`    - Total: ${stats?.event_attachments?.total || 0}`));
  console.log(chalk.gray(`    - On CDN: ${stats?.event_attachments?.on_cdn || 0} (${stats?.event_attachments?.migration_percentage || 0}%)`));
  console.log(chalk.gray(`    - On Supabase: ${stats?.event_attachments?.on_supabase || 0}`));

  console.log(chalk.gray('\n  Overall:'));
  console.log(chalk.gray(`    - Total files: ${stats?.summary?.total_files || 0}`));
  console.log(chalk.gray(`    - Migrated: ${stats?.summary?.migrated_files || 0} (${stats?.summary?.overall_percentage || 0}%)`));
  console.log(chalk.gray(`    - Remaining: ${stats?.summary?.remaining_files || 0}`));

  return {
    check: 'migration_stats',
    passed: readyForCleanup,
    message: readyForCleanup ? 'Ready for cleanup' : 'Not ready for cleanup',
    details: stats,
  };
}

/**
 * Main verification function
 */
async function main() {
  console.log(chalk.bold('\n🔍 Event Storage Migration Verification'));
  console.log(chalk.gray('=' .repeat(50)));

  const results: VerificationResult[] = [];

  // Run all verification checks
  results.push(await verifyEventMedia());
  results.push(await verifyEventAttachments());
  results.push(await verifyCDNAccessibility());
  results.push(await checkMigrationLog());
  results.push(await checkFeatureFlag());
  results.push(await getMigrationStats());

  // Summary
  console.log(chalk.bold('\n📊 Verification Summary'));
  console.log(chalk.gray('=' .repeat(50)));

  const allPassed = results.every(r => r.passed);
  const failedChecks = results.filter(r => !r.passed);

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? chalk.green : chalk.red;
    console.log(color(`${icon} ${result.check}: ${result.message}`));
  });

  // Final verdict
  console.log(chalk.gray('\n' + '=' .repeat(50)));
  if (allPassed) {
    console.log(chalk.bold.green('✅ All checks passed! Safe to proceed with cleanup.'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('1. Backup Supabase Storage buckets (optional)'));
    console.log(chalk.gray('2. Run cleanup script with --confirm-delete flag'));
    console.log(chalk.gray('3. Remove legacy code after successful cleanup'));
  } else {
    console.log(chalk.bold.red(`❌ ${failedChecks.length} check(s) failed. DO NOT proceed with cleanup.`));
    console.log(chalk.gray('\nFailed checks:'));
    failedChecks.forEach(check => {
      console.log(chalk.red(`  - ${check.check}: ${check.message}`));
    });
    console.log(chalk.gray('\nResolve all issues before attempting cleanup.'));
  }

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run verification
main().catch(error => {
  console.error(chalk.red('❌ Verification failed with error:'));
  console.error(error);
  process.exit(1);
});