-- Add INSERT policy for authenticated users to create sites
-- Fixes RLS violation when creating new sites through "Start from Scratch" workflow
--
-- Issue: After soft-delete RLS update (20251031000002), the authenticated_sites policy
-- was replaced with specific policies for SELECT and UPDATE, but INSERT was missing.
-- This caused "new row violates row-level security policy" errors during site creation.

BEGIN;

-- Add INSERT policy for authenticated users to create sites
CREATE POLICY "users_create_sites"
  ON public.sites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Ensure user can only create sites with themselves as the creator
    auth.uid() = created_by
    -- Prevent creating already-deleted sites
    AND deleted_at IS NULL
  );

-- Add comment for documentation
COMMENT ON POLICY "users_create_sites" ON public.sites IS
'Allows authenticated users to create new sites. Ensures created_by matches the authenticated user and prevents creating soft-deleted sites.';

COMMIT;

-- Migration notes:
-- - Restores INSERT capability that was lost in soft-delete RLS update
-- - Maintains security by validating created_by matches auth.uid()
-- - Aligns with existing policy naming convention (users_*)
-- - Works alongside existing SELECT and UPDATE policies
