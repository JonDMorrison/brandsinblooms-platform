-- =============================================
-- EVENT STORAGE BUCKETS
-- =============================================
-- Create storage buckets for event media (images/videos) and attachments

-- ---------------------------------------------
-- 1. Event Media Bucket (Images)
-- ---------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-media',
  'event-media',
  true, -- Public access for viewing images
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------
-- 2. Event Attachments Bucket (Documents)
-- ---------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-attachments',
  'event-attachments',
  true, -- Public access for downloads
  10485760, -- 10MB limit per file
  ARRAY[
    -- PDF documents
    'application/pdf',
    -- Microsoft Word documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    -- Microsoft Excel spreadsheets
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    -- Text files
    'text/plain',
    'text/csv',
    'text/rtf',
    'application/rtf',
    -- Generic binary (fallback for browsers that don't send specific MIME types)
    'application/octet-stream'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------
-- 3. Storage Policies for Event Media
-- ---------------------------------------------

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_read_event_media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_upload_event_media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_event_media" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_event_media" ON storage.objects;

-- Allow public to view event media
CREATE POLICY "public_read_event_media"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-media');

-- Allow authenticated users to upload media for events they can manage
CREATE POLICY "authenticated_upload_event_media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-media'
  AND (storage.foldername(name))[1] IN (
    SELECT e.id::text
    FROM events e
    WHERE e.site_id IN (
      SELECT site_id
      FROM site_memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  )
);

-- Allow authenticated users to update media for events they can manage
CREATE POLICY "authenticated_update_event_media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-media'
  AND (storage.foldername(name))[1] IN (
    SELECT e.id::text
    FROM events e
    WHERE e.site_id IN (
      SELECT site_id
      FROM site_memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  )
);

-- Allow authenticated users to delete media for events they can manage
CREATE POLICY "authenticated_delete_event_media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-media'
  AND (storage.foldername(name))[1] IN (
    SELECT e.id::text
    FROM events e
    WHERE e.site_id IN (
      SELECT site_id
      FROM site_memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  )
);

-- ---------------------------------------------
-- 4. Storage Policies for Event Attachments
-- ---------------------------------------------

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_read_event_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_upload_event_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_event_attachments" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_event_attachments" ON storage.objects;

-- Allow public to view event attachments
CREATE POLICY "public_read_event_attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-attachments');

-- Allow authenticated users to upload attachments for events they can manage
CREATE POLICY "authenticated_upload_event_attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT e.id::text
    FROM events e
    WHERE e.site_id IN (
      SELECT site_id
      FROM site_memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  )
);

-- Allow authenticated users to update attachments for events they can manage
CREATE POLICY "authenticated_update_event_attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT e.id::text
    FROM events e
    WHERE e.site_id IN (
      SELECT site_id
      FROM site_memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  )
);

-- Allow authenticated users to delete attachments for events they can manage
CREATE POLICY "authenticated_delete_event_attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-attachments'
  AND (storage.foldername(name))[1] IN (
    SELECT e.id::text
    FROM events e
    WHERE e.site_id IN (
      SELECT site_id
      FROM site_memberships
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'editor')
    )
  )
);

-- ---------------------------------------------
-- 5. Helper Functions
-- ---------------------------------------------

-- Validate user can upload media for an event
CREATE OR REPLACE FUNCTION can_manage_event_media(event_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to the event's site
  RETURN EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_id_param
    AND e.site_id IN (
      SELECT site_id
      FROM site_memberships
      WHERE user_id = user_id_param
        AND role IN ('owner', 'editor')
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION can_manage_event_media TO authenticated;

COMMENT ON FUNCTION can_manage_event_media(UUID, UUID) IS
  'Check if user can upload/manage media for an event';
