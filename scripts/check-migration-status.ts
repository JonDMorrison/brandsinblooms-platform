#!/usr/bin/env tsx

/**
 * Check Event Storage Migration Status
 *
 * Provides a quick overview of the migration progress
 *
 * Usage:
 *   pnpm check:migration-status
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/lib/database/types';
import * as fs from 'fs/promises';
import * as path from 'path';

interface MigrationStatus {
  table_name: string;
  total_records: number;
  supabase_urls: number;
  migrated_count: number;
  pending_migration: number;
  last_migration_at: string | null;
}

async function checkMigrationStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );

  console.log('\n' + '='.repeat(80));
  console.log('EVENT STORAGE MIGRATION STATUS');
  console.log('='.repeat(80));

  try {
    // Query migration status view
    const { data: status, error } = await supabase
      .from('event_storage_migration_status')
      .select('*');

    if (error) {
      // Fallback to manual queries if view doesn't exist
      console.log('Migration status view not found, querying directly...\n');

      // Check event_media
      const { data: mediaData } = await supabase
        .from('event_media')
        .select('id, media_url, thumbnail_url, migrated_at')
        .is('deleted_at', null);

      const mediaStats = {
        total: mediaData?.length || 0,
        supabase: mediaData?.filter(r =>
          r.media_url?.includes('supabase') ||
          r.thumbnail_url?.includes('supabase')
        ).length || 0,
        migrated: mediaData?.filter(r => r.migrated_at).length || 0,
      };

      console.log('Event Media:');
      console.log(`  Total Records: ${mediaStats.total}`);
      console.log(`  Supabase URLs: ${mediaStats.supabase}`);
      console.log(`  Migrated: ${mediaStats.migrated}`);
      console.log(`  Pending: ${mediaStats.supabase - mediaStats.migrated}`);
      console.log(`  Progress: ${mediaStats.supabase > 0 ? Math.round((mediaStats.migrated / mediaStats.supabase) * 100) : 100}%\n`);

      // Check event_attachments
      const { data: attachData } = await supabase
        .from('event_attachments')
        .select('id, file_url, migrated_at')
        .is('deleted_at', null);

      const attachStats = {
        total: attachData?.length || 0,
        supabase: attachData?.filter(r => r.file_url?.includes('supabase')).length || 0,
        migrated: attachData?.filter(r => r.migrated_at).length || 0,
      };

      console.log('Event Attachments:');
      console.log(`  Total Records: ${attachStats.total}`);
      console.log(`  Supabase URLs: ${attachStats.supabase}`);
      console.log(`  Migrated: ${attachStats.migrated}`);
      console.log(`  Pending: ${attachStats.supabase - attachStats.migrated}`);
      console.log(`  Progress: ${attachStats.supabase > 0 ? Math.round((attachStats.migrated / attachStats.supabase) * 100) : 100}%`);

    } else if (status) {
      // Display status from view
      status.forEach((row: MigrationStatus) => {
        const progress = row.supabase_urls > 0
          ? Math.round((row.migrated_count / row.supabase_urls) * 100)
          : 100;

        console.log(`\n${row.table_name.toUpperCase()}:`);
        console.log(`  Total Records: ${row.total_records}`);
        console.log(`  Supabase URLs: ${row.supabase_urls}`);
        console.log(`  Migrated: ${row.migrated_count}`);
        console.log(`  Pending: ${row.pending_migration}`);
        console.log(`  Progress: ${progress}%`);
        if (row.last_migration_at) {
          console.log(`  Last Migration: ${new Date(row.last_migration_at).toLocaleString()}`);
        }
      });
    }

    // Check for migration log file
    const logPath = path.join(process.cwd(), 'migration-log.json');
    try {
      const logData = await fs.readFile(logPath, 'utf-8');
      const records = JSON.parse(logData);
      const failed = records.filter((r: any) => r.status === 'failed');

      console.log('\n' + '-'.repeat(80));
      console.log('MIGRATION LOG FILE:');
      console.log(`  Total Entries: ${records.length}`);
      console.log(`  Failed Items: ${failed.length}`);

      if (failed.length > 0) {
        console.log('\nFailed Items (first 5):');
        failed.slice(0, 5).forEach((item: any) => {
          console.log(`  - ${item.table} [${item.record_id}]: ${item.error_message}`);
        });
        if (failed.length > 5) {
          console.log(`  ... and ${failed.length - 5} more`);
        }
      }
    } catch {
      console.log('\nNo migration log file found (migration-log.json)');
    }

    // Check R2 configuration
    console.log('\n' + '-'.repeat(80));
    console.log('R2 CONFIGURATION:');
    console.log(`  R2 Enabled: ${process.env.NEXT_PUBLIC_EVENT_STORAGE_R2 === 'true' ? 'Yes' : 'No'}`);
    console.log(`  R2 Account: ${process.env.R2_ACCOUNT_ID ? 'Configured' : 'Not configured'}`);
    console.log(`  CDN URL: ${process.env.NEXT_PUBLIC_CDN_URL || 'Not configured'}`);

    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEPS:');

    const { data: pendingData } = await supabase
      .from('event_media')
      .select('id')
      .or('media_url.ilike.%supabase%,thumbnail_url.ilike.%supabase%')
      .is('migrated_at', null)
      .is('deleted_at', null)
      .limit(1);

    const { data: pendingAttach } = await supabase
      .from('event_attachments')
      .select('id')
      .ilike('file_url', '%supabase%')
      .is('migrated_at', null)
      .is('deleted_at', null)
      .limit(1);

    const hasPending = (pendingData && pendingData.length > 0) || (pendingAttach && pendingAttach.length > 0);

    if (hasPending) {
      console.log('- Files pending migration detected');
      console.log('- Run: pnpm migrate:event-storage:dry (to preview)');
      console.log('- Run: pnpm migrate:event-storage (to migrate)');
    } else {
      console.log('- All files have been migrated or no Supabase URLs found');
      console.log('- Verify files are accessible via CDN');
      console.log('- Consider removing Supabase Storage files after verification');
    }

    console.log('='.repeat(80) + '\n');

  } catch (error: any) {
    console.error('Error checking migration status:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  checkMigrationStatus();
}