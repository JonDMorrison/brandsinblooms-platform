# Event Storage Migration Guide

## Overview

This guide covers the migration of event files from Supabase Storage to Cloudflare R2 + CDN. The migration script handles both `event_media` and `event_attachments` tables, safely transferring files while maintaining data integrity.

## Prerequisites

### 1. Environment Configuration

Ensure all required environment variables are set in your `.env` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for unrestricted access

# R2 Configuration (Required for event uploads)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
NEXT_PUBLIC_CDN_URL=https://your-cdn-url.com
```

### 2. R2 Bucket Setup

Ensure your R2 bucket is properly configured:

1. **Create the bucket** in Cloudflare dashboard
2. **Configure public access** for the CDN
3. **Set up custom domain** (optional but recommended)
4. **Configure CORS** if needed for direct uploads

### 3. Database Backup

**CRITICAL**: Always backup your database before running migrations:

```bash
# Via Supabase Dashboard
# 1. Go to Settings > Backups
# 2. Create a manual backup
# 3. Download the backup file

# Or via CLI (if configured)
supabase db dump -f backup-before-migration.sql
```

## Migration Process

### Step 1: Test with Dry Run

Always start with a dry run to preview changes without making any modifications:

```bash
# Preview all changes
pnpm migrate:event-storage:dry

# Preview with detailed logging
pnpm migrate:event-storage:dry --verbose

# Preview for specific site only
pnpm migrate:event-storage:dry --site-id=aaaaaaaa-bbbb-cccc-dddd-111111111111
```

### Step 2: Run Small Test Batch

Test with a small batch first:

```bash
# Migrate with small batch size
pnpm migrate:event-storage --batch-size=5 --verbose
```

### Step 3: Full Migration

Run the complete migration:

```bash
# Standard migration
pnpm migrate:event-storage

# With progress monitoring
pnpm migrate:event-storage --verbose

# For specific site
pnpm migrate:event-storage --site-id=your-site-id
```

### Step 4: Handle Failures

If any files fail to migrate:

```bash
# Resume from previous run (retries failed items)
pnpm migrate:event-storage --resume

# Check the migration log
cat migration-log.json | jq '.[] | select(.status == "failed")'
```

## Command Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Preview changes without executing | `pnpm migrate:event-storage --dry-run` |
| `--site-id` | Migrate specific site only | `--site-id=abc-123` |
| `--batch-size` | Number of files per batch (default: 50) | `--batch-size=10` |
| `--resume` | Resume from previous run | `--resume` |
| `--verbose` | Detailed logging output | `--verbose` |

## Migration Flow

The script follows this process:

1. **Discovery Phase**
   - Queries `event_media` table for Supabase URLs
   - Queries `event_attachments` table for Supabase URLs
   - Filters by site_id if specified

2. **Download Phase**
   - Downloads files from Supabase Storage
   - Implements retry logic with exponential backoff
   - Handles network failures gracefully

3. **Upload Phase**
   - Uploads to R2 with proper path structure
   - Adds migration metadata
   - Skips files that already exist in R2

4. **Update Phase**
   - Updates database URLs to CDN endpoints
   - Adds `migrated_at` timestamp
   - Only updates if upload was successful

5. **Logging Phase**
   - Saves migration status to `migration-log.json`
   - Tracks successes, failures, and skipped items
   - Enables resume capability

## File Organization

Files are organized in R2 as follows:

```
event-media/
├── {event-id}/
│   └── {timestamp}-{filename}
event-media-thumbnails/
├── {event-id}/
│   └── {timestamp}-{filename}
event-attachments/
├── {event-id}/
│   └── {timestamp}-{filename}
```

## Verification

### 1. Check Migration Stats

After migration, review the summary output:

```
======================================================
MIGRATION SUMMARY
======================================================
Total processed: 150
Successful: 148
Failed: 2
Skipped: 0
Duration: 245s
======================================================
```

### 2. Verify Database URLs

Check that URLs have been updated:

```sql
-- Check event_media
SELECT id, media_url, thumbnail_url, migrated_at
FROM event_media
WHERE migrated_at IS NOT NULL
LIMIT 10;

-- Check event_attachments
SELECT id, file_url, migrated_at
FROM event_attachments
WHERE migrated_at IS NOT NULL
LIMIT 10;
```

### 3. Test CDN Access

Verify files are accessible via CDN:

```bash
# Test a migrated URL
curl -I https://your-cdn-url.com/event-media/event-id/timestamp-filename.jpg
```

### 4. Check Frontend Display

1. Visit event pages with migrated media
2. Verify images/videos load correctly
3. Test attachment downloads
4. Check thumbnail display

## Rollback Procedure

If issues arise after migration:

### Option 1: Keep Both URLs (Recommended Initially)

The dual-read pattern supports both Supabase and CDN URLs, so no immediate action needed.

### Option 2: Revert Database URLs

```sql
-- Revert event_media (if you tracked original URLs)
UPDATE event_media
SET
  media_url = original_media_url,
  thumbnail_url = original_thumbnail_url,
  migrated_at = NULL
WHERE migrated_at IS NOT NULL;

-- Revert event_attachments
UPDATE event_attachments
SET
  file_url = original_file_url,
  migrated_at = NULL
WHERE migrated_at IS NOT NULL;
```

### Option 3: Restore from Backup

```bash
# Restore database from backup
supabase db reset
supabase db push < backup-before-migration.sql
```

## Common Issues

### Issue: Missing Environment Variables

**Error**: `Missing required environment variables: R2_ACCOUNT_ID, R2_SECRET_ACCESS_KEY`

**Solution**: Ensure all R2 and Supabase variables are set in `.env`

### Issue: Authentication Errors

**Error**: `Failed to query event_media: JWT expired`

**Solution**: Use service role key, not anon key:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Issue: Network Timeouts

**Error**: `Failed to download file: timeout`

**Solution**: The script has built-in retry logic. For persistent issues:
- Reduce batch size: `--batch-size=5`
- Check Supabase Storage service status
- Verify network connectivity

### Issue: R2 Upload Failures

**Error**: `Failed to upload file to R2: Access Denied`

**Solution**: Verify R2 credentials and bucket permissions:
```bash
# Test R2 access
aws s3 ls s3://your-bucket-name/ \
  --endpoint-url https://your-account-id.r2.cloudflarestorage.com \
  --profile r2
```

### Issue: Files Not Loading After Migration

**Symptoms**: 404 errors on CDN URLs

**Solutions**:
1. Check CDN configuration and custom domain setup
2. Verify R2 bucket public access settings
3. Ensure CORS headers are configured
4. Check for URL encoding issues in file names

## Performance Considerations

### Migration Speed

- **Typical rates**: 50-100 files/minute
- **Factors affecting speed**:
  - File sizes
  - Network latency
  - Batch size setting
  - R2 region proximity

### Optimization Tips

1. **Run during off-peak hours** to minimize impact
2. **Use appropriate batch size**:
   - Small files: Higher batch size (100)
   - Large files: Lower batch size (10-25)
3. **Consider parallel runs** for different sites (separate terminals)

## Monitoring

### During Migration

Watch the migration progress:

```bash
# In another terminal, monitor the log file
watch -n 1 'tail -20 migration-log.json | jq .'

# Monitor R2 bucket size
aws s3 ls s3://your-bucket-name/ \
  --endpoint-url https://your-account-id.r2.cloudflarestorage.com \
  --recursive --summarize | grep "Total Size"
```

### After Migration

Set up monitoring for:

1. **CDN 404 errors** - Indicates missing files
2. **Database query performance** - URL updates may affect indexes
3. **R2 bandwidth usage** - Monitor costs
4. **Frontend performance** - Ensure no degradation

## Best Practices

1. **Always backup first** - Database and critical files
2. **Test in staging** - Run full migration on staging environment
3. **Monitor closely** - Watch for errors during and after migration
4. **Keep Supabase files** - Don't delete immediately, keep as backup
5. **Document everything** - Track migration dates, issues, and resolutions
6. **Gradual rollout** - Migrate site by site if possible
7. **Communicate** - Notify team about migration schedule

## Post-Migration Cleanup

After successful migration and verification (recommended: wait 1-2 weeks):

1. **Remove Supabase Storage files** (optional, save costs):
   ```bash
   # Via Supabase dashboard or CLI
   # Be absolutely certain before deleting!
   ```

2. **Remove migration timestamps** (optional):
   ```sql
   -- Optional: Remove migration tracking column
   ALTER TABLE event_media DROP COLUMN IF EXISTS migrated_at;
   ALTER TABLE event_attachments DROP COLUMN IF EXISTS migrated_at;
   ```

## Support

For issues or questions:

1. Check the migration log: `migration-log.json`
2. Review error messages in verbose mode
3. Consult Cloudflare R2 documentation
4. Check Supabase Storage documentation
5. Review the dual-read implementation in `EventStorageAdapter`