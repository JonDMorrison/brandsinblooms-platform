#!/usr/bin/env tsx

/**
 * Event Storage Migration Script
 *
 * Migrates event files from Supabase Storage to Cloudflare R2 + CDN
 *
 * Usage:
 *   pnpm migrate:event-storage                    # Run migration
 *   pnpm migrate:event-storage --dry-run          # Preview changes without executing
 *   pnpm migrate:event-storage --site-id=xxx      # Migrate specific site only
 *   pnpm migrate:event-storage --batch-size=10    # Custom batch size
 *   pnpm migrate:event-storage --resume           # Resume from previous run
 *   pnpm migrate:event-storage --verbose          # Detailed logging
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Database } from '../src/lib/database/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseArgs } from 'util';
import { handleError } from '../src/lib/types/error-handling';

// Types
interface MigrationRecord {
  id: string;
  table: 'event_media' | 'event_attachments';
  record_id: string;
  old_url: string;
  new_url: string | null;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  error_message: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
}

interface MigrationStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  startTime: Date;
  endTime?: Date;
}

interface EventMediaRecord {
  id: string;
  event_id: string;
  media_url: string;
  thumbnail_url: string | null;
  site_id?: string;
}

interface EventAttachmentRecord {
  id: string;
  event_id: string;
  file_url: string;
  file_name: string;
  site_id?: string;
}

// Configuration
class MigrationConfig {
  readonly dryRun: boolean;
  readonly siteId?: string;
  readonly batchSize: number;
  readonly resume: boolean;
  readonly verbose: boolean;
  readonly maxRetries: number = 3;
  readonly retryDelay: number = 1000; // ms
  readonly logFile: string = 'migration-log.json';

  // Supabase
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly supabaseServiceKey: string;

  // R2
  readonly r2AccountId: string;
  readonly r2AccessKeyId: string;
  readonly r2SecretAccessKey: string;
  readonly r2BucketName: string;
  readonly cdnUrl: string;

  constructor(args: any) {
    // Parse CLI arguments
    this.dryRun = args.values['dry-run'] === true;
    this.siteId = args.values['site-id'] as string | undefined;
    this.batchSize = parseInt(args.values['batch-size'] as string) || 50;
    this.resume = args.values['resume'] === true;
    this.verbose = args.values['verbose'] === true;

    // Load environment variables
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    this.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    this.r2AccountId = process.env.R2_ACCOUNT_ID || '';
    this.r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    this.r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
    this.r2BucketName = process.env.R2_BUCKET_NAME || '';
    this.cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';

    this.validate();
  }

  private validate(): void {
    const required = {
      supabaseUrl: this.supabaseUrl,
      supabaseAnonKey: this.supabaseAnonKey,
      supabaseServiceKey: this.supabaseServiceKey,
      r2AccountId: this.r2AccountId,
      r2AccessKeyId: this.r2AccessKeyId,
      r2SecretAccessKey: this.r2SecretAccessKey,
      r2BucketName: this.r2BucketName,
      cdnUrl: this.cdnUrl,
    };

    const missing = Object.entries(required)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}

// Logger
class Logger {
  constructor(private verbose: boolean = false) {}

  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  success(message: string): void {
    console.log(`[SUCCESS] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }

  debug(message: string): void {
    if (this.verbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  progress(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const bar = '='.repeat(Math.floor(percentage / 2)).padEnd(50, '-');
    process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total}) ${message || ''}`);
    if (current === total) {
      console.log(''); // New line when complete
    }
  }
}

// Migration Log Manager
class MigrationLogManager {
  private records: Map<string, MigrationRecord> = new Map();
  private logPath: string;

  constructor(logFile: string) {
    this.logPath = path.join(process.cwd(), logFile);
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.logPath, 'utf-8');
      const records = JSON.parse(data) as MigrationRecord[];
      records.forEach(record => {
        this.records.set(this.getKey(record.table, record.record_id), record);
      });
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      this.records.clear();
    }
  }

  async save(): Promise<void> {
    const data = JSON.stringify(Array.from(this.records.values()), null, 2);
    await fs.writeFile(this.logPath, data);
  }

  getKey(table: string, recordId: string): string {
    return `${table}:${recordId}`;
  }

  getRecord(table: string, recordId: string): MigrationRecord | undefined {
    return this.records.get(this.getKey(table, recordId));
  }

  setRecord(record: MigrationRecord): void {
    this.records.set(this.getKey(record.table, record.record_id), record);
  }

  getStats(): MigrationStats {
    const records = Array.from(this.records.values());
    return {
      total: records.length,
      success: records.filter(r => r.status === 'success').length,
      failed: records.filter(r => r.status === 'failed').length,
      skipped: records.filter(r => r.status === 'skipped').length,
      startTime: new Date(),
    };
  }
}

// Storage Migrator
class StorageMigrator {
  private supabase: ReturnType<typeof createClient<Database>>;
  private s3Client: S3Client;
  private logger: Logger;
  private logManager: MigrationLogManager;
  private stats: MigrationStats;

  constructor(
    private config: MigrationConfig
  ) {
    // Initialize Supabase client with service role for unrestricted access
    this.supabase = createClient<Database>(
      config.supabaseUrl,
      config.supabaseServiceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    // Initialize S3 client for R2
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2AccessKeyId,
        secretAccessKey: config.r2SecretAccessKey,
      },
    });

    this.logger = new Logger(config.verbose);
    this.logManager = new MigrationLogManager(config.logFile);
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      startTime: new Date(),
    };
  }

  async run(): Promise<void> {
    try {
      this.logger.info('Starting event storage migration...');
      this.logger.info(`Configuration: ${this.config.dryRun ? 'DRY RUN' : 'LIVE'}, Batch size: ${this.config.batchSize}`);

      // Load previous migration log if resuming
      if (this.config.resume) {
        await this.logManager.load();
        this.logger.info('Loaded previous migration log');
      }

      // Process event_media table
      await this.migrateEventMedia();

      // Process event_attachments table
      await this.migrateEventAttachments();

      // Save migration log
      await this.logManager.save();

      // Print final stats
      this.stats.endTime = new Date();
      this.printStats();

    } catch (error) {
      const handled = handleError(error);
      this.logger.error(`Migration failed: ${handled.message}`);
      throw error;
    }
  }

  private async migrateEventMedia(): Promise<void> {
    this.logger.info('Processing event_media table...');

    // Query all records with Supabase URLs
    let query = this.supabase
      .from('event_media')
      .select('id, event_id, media_url, thumbnail_url')
      .or('media_url.ilike.%supabase%,thumbnail_url.ilike.%supabase%')
      .is('deleted_at', null);

    if (this.config.siteId) {
      // Join with events table to filter by site_id
      query = query.in('event_id',
        (await this.supabase
          .from('events')
          .select('id')
          .eq('site_id', this.config.siteId)
        ).data?.map(e => e.id) || []
      );
    }

    const { data: records, error } = await query;

    if (error) {
      throw new Error(`Failed to query event_media: ${error.message}`);
    }

    if (!records || records.length === 0) {
      this.logger.info('No event_media records to migrate');
      return;
    }

    this.logger.info(`Found ${records.length} event_media records to process`);

    // Process in batches
    for (let i = 0; i < records.length; i += this.config.batchSize) {
      const batch = records.slice(i, i + this.config.batchSize);
      await this.processBatch(batch, 'event_media');
    }
  }

  private async migrateEventAttachments(): Promise<void> {
    this.logger.info('Processing event_attachments table...');

    // Query all records with Supabase URLs
    let query = this.supabase
      .from('event_attachments')
      .select('id, event_id, file_url, file_name')
      .ilike('file_url', '%supabase%')
      .is('deleted_at', null);

    if (this.config.siteId) {
      // Join with events table to filter by site_id
      query = query.in('event_id',
        (await this.supabase
          .from('events')
          .select('id')
          .eq('site_id', this.config.siteId)
        ).data?.map(e => e.id) || []
      );
    }

    const { data: records, error } = await query;

    if (error) {
      throw new Error(`Failed to query event_attachments: ${error.message}`);
    }

    if (!records || records.length === 0) {
      this.logger.info('No event_attachments records to migrate');
      return;
    }

    this.logger.info(`Found ${records.length} event_attachments records to process`);

    // Process in batches
    for (let i = 0; i < records.length; i += this.config.batchSize) {
      const batch = records.slice(i, i + this.config.batchSize);
      await this.processBatch(batch, 'event_attachments');
    }
  }

  private async processBatch(
    records: any[],
    table: 'event_media' | 'event_attachments'
  ): Promise<void> {
    this.logger.debug(`Processing batch of ${records.length} ${table} records`);

    for (const record of records) {
      try {
        // Check if already processed
        const existingLog = this.logManager.getRecord(table, record.id);
        if (existingLog && existingLog.status === 'success') {
          this.logger.debug(`Skipping already migrated record: ${record.id}`);
          this.stats.skipped++;
          continue;
        }

        // Process based on table type
        if (table === 'event_media') {
          await this.processMediaRecord(record as EventMediaRecord);
        } else {
          await this.processAttachmentRecord(record as EventAttachmentRecord);
        }

        this.stats.success++;

      } catch (error) {
        const handled = handleError(error);
        this.logger.error(`Failed to process ${table} record ${record.id}: ${handled.message}`);

        // Log failure
        this.logManager.setRecord({
          id: `${table}-${record.id}-${Date.now()}`,
          table,
          record_id: record.id,
          old_url: record.media_url || record.file_url,
          new_url: null,
          status: 'failed',
          error_message: handled.message,
          attempts: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        this.stats.failed++;
      }

      // Update progress
      this.stats.total++;
      this.logger.progress(
        this.stats.success + this.stats.failed + this.stats.skipped,
        this.stats.total,
        `Processing...`
      );
    }
  }

  private async processMediaRecord(record: EventMediaRecord): Promise<void> {
    const updates: any = {};

    // Process media_url if it's from Supabase
    if (this.isSupabaseUrl(record.media_url)) {
      const newUrl = await this.migrateFile(
        record.media_url,
        record.event_id,
        'event-media'
      );

      if (newUrl) {
        updates.media_url = newUrl;
      }
    }

    // Process thumbnail_url if it exists and is from Supabase
    if (record.thumbnail_url && this.isSupabaseUrl(record.thumbnail_url)) {
      const newUrl = await this.migrateFile(
        record.thumbnail_url,
        record.event_id,
        'event-media-thumbnails'
      );

      if (newUrl) {
        updates.thumbnail_url = newUrl;
      }
    }

    // Update database if not dry run
    if (Object.keys(updates).length > 0 && !this.config.dryRun) {
      const { error } = await this.supabase
        .from('event_media')
        .update({
          ...updates,
          migrated_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (error) {
        throw new Error(`Failed to update database: ${error.message}`);
      }

      this.logger.debug(`Updated event_media record ${record.id}`);
    }

    // Log success
    this.logManager.setRecord({
      id: `event_media-${record.id}-${Date.now()}`,
      table: 'event_media',
      record_id: record.id,
      old_url: record.media_url,
      new_url: updates.media_url || record.media_url,
      status: 'success',
      error_message: null,
      attempts: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  private async processAttachmentRecord(record: EventAttachmentRecord): Promise<void> {
    // Process file_url if it's from Supabase
    if (!this.isSupabaseUrl(record.file_url)) {
      this.logger.debug(`Skipping non-Supabase URL: ${record.file_url}`);
      return;
    }

    const newUrl = await this.migrateFile(
      record.file_url,
      record.event_id,
      'event-attachments'
    );

    if (!newUrl) {
      throw new Error('Failed to migrate file');
    }

    // Update database if not dry run
    if (!this.config.dryRun) {
      const { error } = await this.supabase
        .from('event_attachments')
        .update({
          file_url: newUrl,
          migrated_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (error) {
        throw new Error(`Failed to update database: ${error.message}`);
      }

      this.logger.debug(`Updated event_attachments record ${record.id}`);
    }

    // Log success
    this.logManager.setRecord({
      id: `event_attachments-${record.id}-${Date.now()}`,
      table: 'event_attachments',
      record_id: record.id,
      old_url: record.file_url,
      new_url: newUrl,
      status: 'success',
      error_message: null,
      attempts: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  private async migrateFile(
    supabaseUrl: string,
    eventId: string,
    prefix: string
  ): Promise<string | null> {
    try {
      // Parse Supabase URL
      const urlObj = new URL(supabaseUrl);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);

      if (!pathMatch) {
        this.logger.warn(`Could not parse Supabase URL: ${supabaseUrl}`);
        return null;
      }

      const [, bucketName, filePath] = pathMatch;

      // Generate new key for R2
      const fileName = path.basename(filePath);
      const timestamp = Date.now();
      const newKey = `${prefix}/${eventId}/${timestamp}-${fileName}`;

      this.logger.debug(`Migrating ${bucketName}/${filePath} -> ${newKey}`);

      // Check if file already exists in R2
      if (await this.fileExistsInR2(newKey)) {
        this.logger.debug(`File already exists in R2: ${newKey}`);
        return `${this.config.cdnUrl}/${newKey}`;
      }

      // Download from Supabase
      const fileData = await this.downloadFromSupabase(bucketName, filePath);

      if (!fileData) {
        this.logger.warn(`Could not download file from Supabase: ${filePath}`);
        return null;
      }

      // Upload to R2 (if not dry run)
      if (!this.config.dryRun) {
        await this.uploadToR2(newKey, fileData);
        this.logger.debug(`Uploaded to R2: ${newKey}`);
      } else {
        this.logger.debug(`[DRY RUN] Would upload to R2: ${newKey}`);
      }

      // Return new CDN URL
      return `${this.config.cdnUrl}/${newKey}`;

    } catch (error) {
      const handled = handleError(error);
      this.logger.error(`Failed to migrate file: ${handled.message}`);
      throw error;
    }
  }

  private async downloadFromSupabase(
    bucketName: string,
    filePath: string
  ): Promise<Buffer | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) {
        throw new Error(`Supabase download error: ${error.message}`);
      }

      // Convert Blob to Buffer
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (error) {
      const handled = handleError(error);
      this.logger.error(`Download failed: ${handled.message}`);

      // Retry with exponential backoff
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        await this.sleep(this.config.retryDelay * Math.pow(2, attempt - 1));

        try {
          const { data, error } = await this.supabase.storage
            .from(bucketName)
            .download(filePath);

          if (!error && data) {
            const arrayBuffer = await data.arrayBuffer();
            return Buffer.from(arrayBuffer);
          }
        } catch (retryError) {
          this.logger.debug(`Retry ${attempt} failed`);
        }
      }

      return null;
    }
  }

  private async uploadToR2(key: string, data: Buffer): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.r2BucketName,
        Key: key,
        Body: data,
        ContentType: this.getMimeType(key),
        Metadata: {
          'migrated-from': 'supabase',
          'migrated-at': new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

    } catch (error) {
      const handled = handleError(error);

      // Retry with exponential backoff
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        await this.sleep(this.config.retryDelay * Math.pow(2, attempt - 1));

        try {
          const command = new PutObjectCommand({
            Bucket: this.config.r2BucketName,
            Key: key,
            Body: data,
            ContentType: this.getMimeType(key),
            Metadata: {
              'migrated-from': 'supabase',
              'migrated-at': new Date().toISOString(),
              'retry-attempt': attempt.toString(),
            },
          });

          await this.s3Client.send(command);
          return; // Success
        } catch (retryError) {
          this.logger.debug(`Upload retry ${attempt} failed`);
        }
      }

      throw new Error(`Failed to upload after ${this.config.maxRetries} attempts: ${handled.message}`);
    }
  }

  private async fileExistsInR2(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.r2BucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  private isSupabaseUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname.includes('supabase.co') ||
        urlObj.hostname.includes('supabase.in') ||
        urlObj.pathname.includes('/storage/v1/object/')
      );
    } catch {
      return false;
    }
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printStats(): void {
    const duration = this.stats.endTime
      ? (this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000
      : 0;

    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total processed: ${this.stats.total}`);
    console.log(`Successful: ${this.stats.success}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Duration: ${Math.round(duration)}s`);

    if (this.config.dryRun) {
      console.log('\nThis was a DRY RUN - no changes were made');
    }

    if (this.stats.failed > 0) {
      console.log(`\nFailed items logged to: ${this.config.logFile}`);
      console.log('Re-run with --resume to retry failed items');
    }

    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  try {
    // Parse command line arguments
    const { values } = parseArgs({
      args: process.argv.slice(2),
      options: {
        'dry-run': { type: 'boolean', default: false },
        'site-id': { type: 'string' },
        'batch-size': { type: 'string', default: '50' },
        'resume': { type: 'boolean', default: false },
        'verbose': { type: 'boolean', default: false },
      },
    });

    // Create configuration
    const config = new MigrationConfig({ values });

    // Create and run migrator
    const migrator = new StorageMigrator(config);
    await migrator.run();

    process.exit(0);
  } catch (error) {
    const handled = handleError(error);
    console.error('Migration failed:', handled.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { StorageMigrator, MigrationConfig };