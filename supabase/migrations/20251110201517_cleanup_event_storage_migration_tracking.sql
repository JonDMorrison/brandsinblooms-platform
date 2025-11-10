-- Phase 4: Cleanup migration tracking after successful R2 storage migration
-- Removes temporary columns, indexes, and views used during the migration process

-- Drop the migration status view
DROP VIEW IF EXISTS public.event_storage_migration_status;

-- Drop indexes on migration tracking columns
DROP INDEX IF EXISTS public.idx_event_media_migrated_at;
DROP INDEX IF EXISTS public.idx_event_attachments_migrated_at;

-- Remove migration tracking columns
ALTER TABLE public.event_media
DROP COLUMN IF EXISTS migrated_at;

ALTER TABLE public.event_attachments
DROP COLUMN IF EXISTS migrated_at;

-- Update storage policies to use the new R2-based structure
-- These policies now reflect that we're using R2 instead of Supabase Storage

-- Drop old policies if they exist (to ensure clean slate)
DROP POLICY IF EXISTS "public_read_event_media" ON storage.objects;
DROP POLICY IF EXISTS "public_read_event_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_upload_event_media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_upload_event_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_event_media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_event_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_event_media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_event_attachments" ON storage.objects;

-- Create updated storage policies for event-media bucket
CREATE POLICY "public_read_event_media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'event-media');

CREATE POLICY "authenticated_upload_event_media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-media'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM public.events e
      WHERE e.site_id IN (
        SELECT site_id
        FROM public.site_memberships
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'editor')
      )
    )
  );

CREATE POLICY "authenticated_update_event_media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-media'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM public.events e
      WHERE e.site_id IN (
        SELECT site_id
        FROM public.site_memberships
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'editor')
      )
    )
  );

CREATE POLICY "authenticated_delete_event_media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-media'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM public.events e
      WHERE e.site_id IN (
        SELECT site_id
        FROM public.site_memberships
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'editor')
      )
    )
  );

-- Create updated storage policies for event-attachments bucket
CREATE POLICY "public_read_event_attachments"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'event-attachments');

CREATE POLICY "authenticated_upload_event_attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'event-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM public.events e
      WHERE e.site_id IN (
        SELECT site_id
        FROM public.site_memberships
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'editor')
      )
    )
  );

CREATE POLICY "authenticated_update_event_attachments"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'event-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM public.events e
      WHERE e.site_id IN (
        SELECT site_id
        FROM public.site_memberships
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'editor')
      )
    )
  );

CREATE POLICY "authenticated_delete_event_attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT e.id::text
      FROM public.events e
      WHERE e.site_id IN (
        SELECT site_id
        FROM public.site_memberships
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'editor')
      )
    )
  );

-- Update can_manage_event_media function to ensure it's current
CREATE OR REPLACE FUNCTION public.can_manage_event_media(event_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to the event's site
  RETURN EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id_param
      AND e.site_id IN (
        SELECT site_id
        FROM public.site_memberships
        WHERE user_id = user_id_param
          AND role IN ('owner', 'editor')
      )
  );
END;
$$;

COMMENT ON FUNCTION public.can_manage_event_media IS 'Checks if a user can manage media for a specific event';
