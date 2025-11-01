-- Add soft delete support to sites and related tables
-- This enables recoverable site deletion with 30-day grace period

BEGIN;

-- Add deleted_at column to sites table
ALTER TABLE public.sites
  ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for efficient querying of deleted sites
CREATE INDEX idx_sites_deleted_at
  ON public.sites(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Add deleted_at to related tables for cascading soft delete
ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_content_deleted_at
  ON public.content(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Add site_domains table soft delete if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'site_domains'
  ) THEN
    ALTER TABLE public.site_domains
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

    CREATE INDEX IF NOT EXISTS idx_site_domains_deleted_at
      ON public.site_domains(deleted_at)
      WHERE deleted_at IS NOT NULL;
  END IF;
END $$;

COMMIT;
