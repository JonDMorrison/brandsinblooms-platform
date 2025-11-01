-- Database triggers for cascading soft-delete and restoration
-- Automatically handles related resources when sites are deleted or restored

BEGIN;

-- Trigger function for cascading soft-delete and restore
CREATE OR REPLACE FUNCTION cascade_site_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- When site is soft-deleted (deleted_at goes from NULL to a timestamp)
  IF NEW.deleted_at IS NOT NULL AND (OLD.deleted_at IS NULL OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at) THEN
    RAISE NOTICE 'Cascading soft-delete for site %', NEW.id;

    -- Soft-delete all content associated with this site
    UPDATE content
    SET deleted_at = NEW.deleted_at,
        updated_at = NOW()
    WHERE site_id = NEW.id
      AND deleted_at IS NULL;

    -- Soft-delete site_domains if the table exists
    IF EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'site_domains'
    ) THEN
      UPDATE site_domains
      SET deleted_at = NEW.deleted_at
      WHERE site_id = NEW.id
        AND deleted_at IS NULL;
    END IF;

  -- When site is restored (deleted_at goes from timestamp to NULL)
  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    RAISE NOTICE 'Cascading restore for site %', NEW.id;

    -- Restore all content associated with this site
    UPDATE content
    SET deleted_at = NULL,
        updated_at = NOW()
    WHERE site_id = NEW.id
      AND deleted_at IS NOT NULL;

    -- Restore site_domains if the table exists
    IF EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'site_domains'
    ) THEN
      UPDATE site_domains
      SET deleted_at = NULL
      WHERE site_id = NEW.id
        AND deleted_at IS NOT NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on sites table
DROP TRIGGER IF EXISTS trigger_cascade_site_soft_delete ON public.sites;
CREATE TRIGGER trigger_cascade_site_soft_delete
  AFTER UPDATE OF deleted_at ON public.sites
  FOR EACH ROW
  EXECUTE FUNCTION cascade_site_soft_delete();

-- Create function for scheduled cleanup of old deleted sites
CREATE OR REPLACE FUNCTION permanently_delete_expired_sites(retention_days INTEGER DEFAULT 30)
RETURNS TABLE(deleted_count INTEGER, site_names TEXT[]) AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_site_names TEXT[] := ARRAY[]::TEXT[];
  v_cutoff_date TIMESTAMPTZ;
BEGIN
  -- Calculate cutoff date
  v_cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;

  RAISE NOTICE 'Permanently deleting sites older than %', v_cutoff_date;

  -- Collect site names for logging
  SELECT ARRAY_AGG(name)
  INTO v_site_names
  FROM sites
  WHERE deleted_at < v_cutoff_date
    AND deleted_at IS NOT NULL;

  -- Permanently delete sites (FK cascades will handle related data)
  DELETE FROM sites
  WHERE deleted_at < v_cutoff_date
    AND deleted_at IS NOT NULL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE 'Permanently deleted % sites: %', v_deleted_count, v_site_names;

  RETURN QUERY SELECT v_deleted_count, COALESCE(v_site_names, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role only
GRANT EXECUTE ON FUNCTION permanently_delete_expired_sites(INTEGER) TO service_role;
REVOKE EXECUTE ON FUNCTION permanently_delete_expired_sites(INTEGER) FROM PUBLIC;

COMMIT;
