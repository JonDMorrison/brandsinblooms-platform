-- Add migration tracking columns for event storage migration from Supabase to R2
-- These columns help track which files have been migrated and when

-- Add migrated_at column to event_media table
ALTER TABLE public.event_media
ADD COLUMN IF NOT EXISTS migrated_at timestamptz;

-- Add index for faster queries on migration status
CREATE INDEX IF NOT EXISTS idx_event_media_migrated_at
ON public.event_media(migrated_at)
WHERE migrated_at IS NOT NULL;

-- Add migrated_at column to event_attachments table
ALTER TABLE public.event_attachments
ADD COLUMN IF NOT EXISTS migrated_at timestamptz;

-- Add index for faster queries on migration status
CREATE INDEX IF NOT EXISTS idx_event_attachments_migrated_at
ON public.event_attachments(migrated_at)
WHERE migrated_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.event_media.migrated_at IS 'Timestamp when the media file was migrated from Supabase Storage to R2/CDN';
COMMENT ON COLUMN public.event_attachments.migrated_at IS 'Timestamp when the attachment file was migrated from Supabase Storage to R2/CDN';

-- Create a view to track migration progress
CREATE OR REPLACE VIEW event_storage_migration_status AS
SELECT
    'event_media' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN media_url LIKE '%supabase%' OR thumbnail_url LIKE '%supabase%' THEN 1 END) as supabase_urls,
    COUNT(migrated_at) as migrated_count,
    COUNT(CASE WHEN migrated_at IS NULL AND (media_url LIKE '%supabase%' OR thumbnail_url LIKE '%supabase%') THEN 1 END) as pending_migration,
    MAX(migrated_at) as last_migration_at
FROM public.event_media
WHERE deleted_at IS NULL

UNION ALL

SELECT
    'event_attachments' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN file_url LIKE '%supabase%' THEN 1 END) as supabase_urls,
    COUNT(migrated_at) as migrated_count,
    COUNT(CASE WHEN migrated_at IS NULL AND file_url LIKE '%supabase%' THEN 1 END) as pending_migration,
    MAX(migrated_at) as last_migration_at
FROM public.event_attachments
WHERE deleted_at IS NULL;

-- Grant access to the view
GRANT SELECT ON event_storage_migration_status TO authenticated;
GRANT SELECT ON event_storage_migration_status TO service_role;

COMMENT ON VIEW event_storage_migration_status IS 'Tracks the progress of migrating event files from Supabase Storage to R2/CDN';