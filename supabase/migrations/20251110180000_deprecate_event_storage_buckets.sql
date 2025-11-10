-- Migration: Deprecate Event Storage Buckets
-- Phase 4: Cleanup and Deprecation
-- Purpose: Mark Supabase Storage buckets as deprecated and provide verification tools
-- Migration Date: 2025-11-10
-- Safe Removal Date: 2025-12-10 (30 days post-migration)

-- =====================================================
-- IMPORTANT: DO NOT DROP BUCKETS IN THIS MIGRATION
-- Buckets serve as backup during transition period
-- Manual removal only after verification complete
-- =====================================================

-- NOTE: Cannot add COMMENT to storage.buckets (requires owner permissions)
-- The deprecation is tracked via migration log and documentation instead

-- Create view to track unmigrated event media files
CREATE OR REPLACE VIEW public.event_storage_unmigrated AS
SELECT
    'event_media' as storage_type,
    em.id,
    em.event_id,
    em.media_url as file_url,
    em.alt_text as file_name,
    em.created_at,
    em.updated_at,
    CASE
        WHEN em.media_url LIKE '%supabase%' THEN 'supabase_storage'
        WHEN em.media_url LIKE '%r2.cloudflarestorage%' THEN 'r2_cdn'
        WHEN em.media_url LIKE '%cloudflare%' THEN 'cloudflare_cdn'
        ELSE 'unknown'
    END as storage_location,
    CASE
        WHEN em.media_url LIKE '%supabase%' THEN false
        ELSE true
    END as is_migrated
FROM public.event_media em
WHERE em.media_url LIKE '%supabase%'

UNION ALL

SELECT
    'event_attachments' as storage_type,
    ea.id,
    ea.event_id,
    ea.file_url,
    ea.file_name,
    ea.created_at,
    ea.updated_at,
    CASE
        WHEN ea.file_url LIKE '%supabase%' THEN 'supabase_storage'
        WHEN ea.file_url LIKE '%r2.cloudflarestorage%' THEN 'r2_cdn'
        WHEN ea.file_url LIKE '%cloudflare%' THEN 'cloudflare_cdn'
        ELSE 'unknown'
    END as storage_location,
    CASE
        WHEN ea.file_url LIKE '%supabase%' THEN false
        ELSE true
    END as is_migrated
FROM public.event_attachments ea
WHERE ea.file_url LIKE '%supabase%';

-- Grant appropriate permissions
GRANT SELECT ON public.event_storage_unmigrated TO authenticated;
GRANT SELECT ON public.event_storage_unmigrated TO service_role;

-- Create function to check if event storage migration is complete
CREATE OR REPLACE FUNCTION public.check_event_storage_migration_complete()
RETURNS TABLE(
    check_name text,
    status text,
    details jsonb,
    passed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unmigrated_count integer;
    v_total_media_count integer;
    v_total_attachment_count integer;
    v_migrated_media_count integer;
    v_migrated_attachment_count integer;
    v_pending_migrations integer;
    v_failed_migrations integer;
    v_migration_start_date timestamp;
    v_days_since_migration integer;
BEGIN
    -- Count unmigrated files
    SELECT COUNT(*) INTO v_unmigrated_count
    FROM public.event_storage_unmigrated;

    -- Count total and migrated media files
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE media_url NOT LIKE '%supabase%')
    INTO v_total_media_count, v_migrated_media_count
    FROM public.event_media;

    -- Count total and migrated attachment files
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE file_url NOT LIKE '%supabase%')
    INTO v_total_attachment_count, v_migrated_attachment_count
    FROM public.event_attachments;

    -- Check migration log status
    SELECT
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'failed')
    INTO v_pending_migrations, v_failed_migrations
    FROM public.event_storage_migration_log;

    -- Get migration start date
    SELECT MIN(created_at) INTO v_migration_start_date
    FROM public.event_storage_migration_log
    WHERE status = 'completed';

    -- Calculate days since migration
    v_days_since_migration := COALESCE(
        EXTRACT(DAY FROM (NOW() - v_migration_start_date))::integer,
        0
    );

    -- Check 1: All files migrated
    RETURN QUERY
    SELECT
        'all_files_migrated'::text,
        CASE
            WHEN v_unmigrated_count = 0 THEN 'PASS'::text
            ELSE 'FAIL'::text
        END,
        jsonb_build_object(
            'unmigrated_count', v_unmigrated_count,
            'total_media', v_total_media_count,
            'migrated_media', v_migrated_media_count,
            'total_attachments', v_total_attachment_count,
            'migrated_attachments', v_migrated_attachment_count
        ),
        v_unmigrated_count = 0;

    -- Check 2: No pending migrations
    RETURN QUERY
    SELECT
        'no_pending_migrations'::text,
        CASE
            WHEN v_pending_migrations = 0 THEN 'PASS'::text
            ELSE 'FAIL'::text
        END,
        jsonb_build_object(
            'pending_count', v_pending_migrations,
            'failed_count', v_failed_migrations
        ),
        v_pending_migrations = 0;

    -- Check 3: Migration age check (30+ days)
    RETURN QUERY
    SELECT
        'migration_age_sufficient'::text,
        CASE
            WHEN v_days_since_migration >= 30 THEN 'PASS'::text
            WHEN v_days_since_migration > 0 THEN 'WARNING'::text
            ELSE 'FAIL'::text
        END,
        jsonb_build_object(
            'migration_start_date', v_migration_start_date,
            'days_since_migration', v_days_since_migration,
            'required_days', 30,
            'safe_removal_date',
                CASE
                    WHEN v_migration_start_date IS NOT NULL
                    THEN (v_migration_start_date + INTERVAL '30 days')::date
                    ELSE NULL
                END
        ),
        v_days_since_migration >= 30;

    -- Check 4: Storage bucket usage (informational)
    RETURN QUERY
    WITH bucket_stats AS (
        SELECT
            b.id as bucket_name,
            COUNT(o.id) as object_count,
            COALESCE(SUM(o.metadata->>'size')::bigint, 0) as total_size_bytes
        FROM storage.buckets b
        LEFT JOIN storage.objects o ON o.bucket_id = b.id
        WHERE b.id IN ('event_media', 'event_attachments')
        GROUP BY b.id
    )
    SELECT
        'storage_bucket_stats'::text,
        'INFO'::text,
        jsonb_agg(
            jsonb_build_object(
                'bucket', bucket_name,
                'object_count', object_count,
                'size_mb', ROUND((total_size_bytes / 1024.0 / 1024.0)::numeric, 2)
            )
        ),
        true
    FROM bucket_stats;

END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_event_storage_migration_complete() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_event_storage_migration_complete() TO service_role;

-- Create helper function to get migration statistics
CREATE OR REPLACE FUNCTION public.get_event_storage_migration_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats jsonb;
BEGIN
    WITH media_stats AS (
        SELECT
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE media_url LIKE '%supabase%') as supabase_count,
            COUNT(*) FILTER (WHERE media_url NOT LIKE '%supabase%') as cdn_count,
            0 as supabase_size,  -- event_media doesn't track file_size
            0 as cdn_size  -- event_media doesn't track file_size
        FROM public.event_media
    ),
    attachment_stats AS (
        SELECT
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE file_url LIKE '%supabase%') as supabase_count,
            COUNT(*) FILTER (WHERE file_url NOT LIKE '%supabase%') as cdn_count,
            SUM(file_size_bytes) FILTER (WHERE file_url LIKE '%supabase%') as supabase_size,
            SUM(file_size_bytes) FILTER (WHERE file_url NOT LIKE '%supabase%') as cdn_size
        FROM public.event_attachments
    ),
    migration_log_stats AS (
        SELECT
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            MIN(created_at) FILTER (WHERE status = 'completed') as first_migration,
            MAX(created_at) FILTER (WHERE status = 'completed') as last_migration
        FROM public.event_storage_migration_log
    )
    SELECT jsonb_build_object(
        'event_media', jsonb_build_object(
            'total', m.total_count,
            'on_supabase', m.supabase_count,
            'on_cdn', m.cdn_count,
            'migration_percentage',
                CASE
                    WHEN m.total_count > 0
                    THEN ROUND((m.cdn_count::numeric / m.total_count::numeric * 100), 2)
                    ELSE 100
                END,
            'supabase_size_mb', ROUND(COALESCE(m.supabase_size, 0) / 1024.0 / 1024.0, 2),
            'cdn_size_mb', ROUND(COALESCE(m.cdn_size, 0) / 1024.0 / 1024.0, 2)
        ),
        'event_attachments', jsonb_build_object(
            'total', a.total_count,
            'on_supabase', a.supabase_count,
            'on_cdn', a.cdn_count,
            'migration_percentage',
                CASE
                    WHEN a.total_count > 0
                    THEN ROUND((a.cdn_count::numeric / a.total_count::numeric * 100), 2)
                    ELSE 100
                END,
            'supabase_size_mb', ROUND(COALESCE(a.supabase_size, 0) / 1024.0 / 1024.0, 2),
            'cdn_size_mb', ROUND(COALESCE(a.cdn_size, 0) / 1024.0 / 1024.0, 2)
        ),
        'migration_log', jsonb_build_object(
            'pending', ml.pending,
            'in_progress', ml.in_progress,
            'completed', ml.completed,
            'failed', ml.failed,
            'first_migration', ml.first_migration,
            'last_migration', ml.last_migration,
            'days_since_first',
                CASE
                    WHEN ml.first_migration IS NOT NULL
                    THEN EXTRACT(DAY FROM (NOW() - ml.first_migration))::integer
                    ELSE NULL
                END
        ),
        'summary', jsonb_build_object(
            'total_files', m.total_count + a.total_count,
            'migrated_files', m.cdn_count + a.cdn_count,
            'remaining_files', m.supabase_count + a.supabase_count,
            'overall_percentage',
                CASE
                    WHEN (m.total_count + a.total_count) > 0
                    THEN ROUND(
                        ((m.cdn_count + a.cdn_count)::numeric /
                         (m.total_count + a.total_count)::numeric * 100), 2
                    )
                    ELSE 100
                END,
            'ready_for_cleanup',
                (m.supabase_count + a.supabase_count) = 0 AND
                ml.pending = 0 AND
                ml.in_progress = 0 AND
                EXTRACT(DAY FROM (NOW() - ml.first_migration)) >= 30
        )
    ) INTO v_stats
    FROM media_stats m, attachment_stats a, migration_log_stats ml;

    RETURN v_stats;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_event_storage_migration_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_storage_migration_stats() TO service_role;

-- NOTE: Deprecation notice tracked via migration log (not schema comment)
-- Cannot modify public schema comment without elevated permissions

-- Create an audit log entry for the deprecation
INSERT INTO public.event_storage_migration_log (
    source_type,
    source_id,
    old_url,
    new_url,
    status,
    metadata,
    created_at
) VALUES (
    'system',
    '00000000-0000-0000-0000-000000000000',
    'supabase_storage_buckets',
    'r2_cloudflare_cdn',
    'completed',
    jsonb_build_object(
        'action', 'deprecation_migration',
        'migration_date', NOW(),
        'safe_removal_date', (NOW() + INTERVAL '30 days')::date,
        'description', 'Marked Supabase Storage buckets as deprecated. Safe to remove after verification.'
    ),
    NOW()
);