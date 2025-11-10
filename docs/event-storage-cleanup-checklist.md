# Event Storage Cleanup Checklist

## Overview
This checklist guides the removal of legacy Supabase Storage code after successful migration to R2/CloudFlare CDN.

**⚠️ WARNING**: Only proceed with cleanup after:
- ✅ All files migrated to CDN (0 files on Supabase Storage)
- ✅ Migration has been stable for 30+ days
- ✅ Verification script passes all checks
- ✅ Backup of Supabase Storage buckets completed

## Timeline Recommendations

| Day | Action | Status |
|-----|--------|--------|
| Day 0 | Deploy infrastructure & enable R2 uploads | ⬜ |
| Day 1-7 | Monitor new uploads to R2 | ⬜ |
| Day 7 | Run migration script for existing files | ⬜ |
| Day 8-30 | Monitor stability, fix any issues | ⬜ |
| Day 30 | Run verification script | ⬜ |
| Day 31+ | Begin cleanup (this checklist) | ⬜ |
| Day 60+ | Consider bucket deletion | ⬜ |

## Pre-Cleanup Verification

Run these commands before any cleanup:

```bash
# 1. Verify migration is complete
pnpm tsx scripts/verify-event-migration-complete.ts --check-urls

# 2. Check migration statistics
pnpm supabase db execute --sql "SELECT * FROM get_event_storage_migration_stats();"

# 3. Verify no Supabase URLs remain
pnpm supabase db execute --sql "SELECT COUNT(*) FROM event_storage_unmigrated;"
```

## Phase 1: Feature Flag Stabilization (Day 31-45)

### ⬜ 1.1 Ensure R2 is enabled in all environments

**Files to check:**
- `.env.production` - Verify `R2_STORAGE_ENABLED=true`
- `.env.staging` - Verify `R2_STORAGE_ENABLED=true`
- Railway environment variables - Update via dashboard

### ⬜ 1.2 Monitor for any storage errors

Check application logs for:
- Upload failures
- CDN access errors
- Missing file errors

## Phase 2: Remove Dual-Storage Logic (Day 45-60)

### ⬜ 2.1 Update Event Edit Page

**File**: `app/dashboard/events/edit/[id]/page.tsx`

**Current code (dual upload):**
```typescript
// Uploads to both Supabase and R2 based on feature flag
if (useR2) {
  // R2 upload logic
} else {
  // Supabase upload logic
}
```

**Replace with:**
```typescript
// Only R2 upload logic
// Remove all Supabase Storage references
```

**Specific changes:**
- Remove `supabase.storage.from('event_media').upload()` calls
- Remove `supabase.storage.from('event_attachments').upload()` calls
- Remove feature flag checks for `R2_STORAGE_ENABLED`
- Keep only R2/presigned URL upload logic

### ⬜ 2.2 Update Event Queries

**File**: `src/lib/queries/domains/events.ts`

**Current code (dual delete):**
```typescript
// Delete from both storages
await Promise.all([
  deleteFromSupabase(),
  deleteFromR2()
]);
```

**Replace with:**
```typescript
// Only delete from R2
await deleteFromR2();
```

**Specific changes:**
- Remove `deleteEventMediaFromSupabase()` function
- Remove `deleteEventAttachmentsFromSupabase()` function
- Remove dual-delete logic in `deleteEvent()` function
- Keep only R2 deletion logic

### ⬜ 2.3 Remove Supabase Storage Utilities

**Files to update:**
- Remove storage bucket references from `supabase/migrations/20251108192000_create_event_storage_buckets.sql`
  - Note: Don't delete migration file, just document it as deprecated

### ⬜ 2.4 Update Storage Adapter

**File**: `src/lib/storage/EventStorageAdapter.ts`

**Changes:**
- Remove `uploadToSupabase()` method
- Remove `deleteFromSupabase()` method
- Remove feature flag checks
- Simplify to only use R2 methods

## Phase 3: Remove Feature Flag (Day 60+)

### ⬜ 3.1 Remove feature flag from code

**Files to update:**
- `src/lib/storage/EventStorageAdapter.ts` - Remove `R2_STORAGE_ENABLED` checks
- `app/dashboard/events/edit/[id]/page.tsx` - Remove flag conditionals
- Any other files using `process.env.R2_STORAGE_ENABLED`

### ⬜ 3.2 Remove feature flag from environments

**Environments to update:**
- `.env.local`
- `.env.production`
- `.env.staging`
- Railway environment variables

### ⬜ 3.3 Update documentation

**Files to update:**
- `README.md` - Remove R2_STORAGE_ENABLED from environment variables section
- `.env.example` - Remove R2_STORAGE_ENABLED

## Phase 4: Database Cleanup (Day 90+)

### ⬜ 4.1 Drop deprecated views and functions (optional)

```sql
-- Only after confirming no dependencies
DROP VIEW IF EXISTS event_storage_unmigrated;
DROP FUNCTION IF EXISTS check_event_storage_migration_complete();
DROP FUNCTION IF EXISTS get_event_storage_migration_stats();
```

### ⬜ 4.2 Archive migration log (optional)

```sql
-- Archive completed migration logs
CREATE TABLE event_storage_migration_log_archive AS
SELECT * FROM event_storage_migration_log;

-- Truncate active log
TRUNCATE event_storage_migration_log;
```

## Phase 5: Storage Bucket Deletion (Day 90+)

### ⬜ 5.1 Final backup of Supabase Storage

```bash
# Create final backup
pnpm tsx scripts/cleanup-supabase-event-storage.ts --dry-run

# Document backup location
echo "Backup location: backups/event-storage/"
```

### ⬜ 5.2 Delete storage buckets

**Via Supabase Dashboard:**
1. Navigate to Storage section
2. Select `event_media` bucket
3. Go to Settings → Delete bucket
4. Repeat for `event_attachments` bucket

**Via Script (objects only):**
```bash
pnpm tsx scripts/cleanup-supabase-event-storage.ts --confirm-delete
```

### ⬜ 5.3 Remove bucket policies

```sql
-- Remove RLS policies for deleted buckets
DROP POLICY IF EXISTS "Event media upload" ON storage.objects;
DROP POLICY IF EXISTS "Event media view" ON storage.objects;
DROP POLICY IF EXISTS "Event media delete" ON storage.objects;
DROP POLICY IF EXISTS "Event attachments upload" ON storage.objects;
DROP POLICY IF EXISTS "Event attachments view" ON storage.objects;
DROP POLICY IF EXISTS "Event attachments delete" ON storage.objects;
```

## Testing After Cleanup

### ⬜ Test Event Creation
1. Create new event
2. Upload media files
3. Upload attachments
4. Verify files accessible via CDN

### ⬜ Test Event Updates
1. Edit existing event
2. Replace media files
3. Add new attachments
4. Verify old files deleted from R2

### ⬜ Test Event Deletion
1. Delete event with media
2. Verify files removed from R2
3. Verify no orphaned files

### ⬜ Test File Access
1. View events with migrated media
2. Download attachments
3. Verify CDN URLs work correctly

## Rollback Plan (If Issues Arise)

If issues are discovered after cleanup:

1. **Immediate Response**:
   - Revert code changes via Git
   - Re-enable feature flag
   - Deploy reverted code

2. **Data Recovery** (if needed):
   - Restore from Supabase Storage backup
   - Re-upload files from backup to buckets
   - Update database URLs if necessary

3. **Investigation**:
   - Review migration logs
   - Check for missed edge cases
   - Fix issues before re-attempting

## Success Criteria

Cleanup is complete when:
- ✅ All event media/attachments use CDN URLs
- ✅ No Supabase Storage code remains
- ✅ No feature flags for storage
- ✅ All tests pass
- ✅ No storage-related errors in production for 7+ days
- ✅ Storage buckets deleted from Supabase
- ✅ Documentation updated

## Final Documentation Updates

### ⬜ Update these documents:
- `CLAUDE.md` - Remove R2 migration notes
- `docs/event-storage-migration-summary.md` - Mark as complete
- `README.md` - Update architecture section

## Completion Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | ⬜ |
| Tech Lead | | | ⬜ |
| DevOps | | | ⬜ |

## Notes

- Keep backups for at least 90 days after deletion
- Monitor application logs closely after each phase
- Document any issues or learnings
- Consider automating similar migrations in future