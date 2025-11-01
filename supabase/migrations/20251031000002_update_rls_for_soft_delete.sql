-- Update RLS policies to handle soft-deleted sites
-- Users can view their deleted sites for recovery, but they're hidden from public access

BEGIN;

-- Drop existing site SELECT policies to rebuild with soft-delete support
DROP POLICY IF EXISTS "public_read_active_sites" ON public.sites;
DROP POLICY IF EXISTS "authenticated_manage_sites" ON public.sites;
DROP POLICY IF EXISTS "Users can view their active and deleted sites" ON public.sites;

-- Public can only see active AND published sites (excludes deleted)
CREATE POLICY "public_read_published_sites"
  ON public.sites
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND is_published = true
    AND deleted_at IS NULL
  );

-- Authenticated users can view their OWN sites (including deleted ones for recovery)
CREATE POLICY "users_view_own_sites"
  ON public.sites
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by
    OR auth.uid() IN (
      SELECT user_id
      FROM site_memberships
      WHERE site_id = sites.id
        AND is_active = true
    )
  );

-- Users can manage (UPDATE, DELETE) their active sites
CREATE POLICY "users_manage_own_active_sites"
  ON public.sites
  FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = created_by
     OR auth.uid() IN (
       SELECT user_id
       FROM site_memberships
       WHERE site_id = sites.id
         AND role IN ('owner', 'admin')
         AND is_active = true
     ))
    AND deleted_at IS NULL
  )
  WITH CHECK (
    (auth.uid() = created_by
     OR auth.uid() IN (
       SELECT user_id
       FROM site_memberships
       WHERE site_id = sites.id
         AND role IN ('owner', 'admin')
         AND is_active = true
     ))
  );

-- Content policies: exclude deleted content by default
DROP POLICY IF EXISTS "Users access active site content" ON public.content;

CREATE POLICY "authenticated_read_content"
  ON public.content
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM sites
      WHERE sites.id = content.site_id
        AND sites.deleted_at IS NULL
        AND (
          sites.created_by = auth.uid()
          OR auth.uid() IN (
            SELECT user_id
            FROM site_memberships
            WHERE site_id = sites.id
              AND is_active = true
          )
        )
    )
  );

CREATE POLICY "public_read_published_content"
  ON public.content
  FOR SELECT
  TO anon
  USING (
    deleted_at IS NULL
    AND is_published = true
    AND EXISTS (
      SELECT 1
      FROM sites
      WHERE sites.id = content.site_id
        AND sites.is_published = true
        AND sites.is_active = true
        AND sites.deleted_at IS NULL
    )
  );

-- Service role can see ALL sites (for admin purposes and cleanup)
CREATE POLICY "service_role_full_access"
  ON public.sites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
