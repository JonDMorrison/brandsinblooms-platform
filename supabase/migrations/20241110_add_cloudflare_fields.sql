-- Legacy migration: Add Cloudflare custom hostname fields to sites table
-- This migration is kept for production compatibility (already run in prod)
-- Uses defensive checks to be idempotent and safe to run multiple times

DO $$
BEGIN
  -- Only proceed if sites table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sites') THEN

    -- Add Cloudflare custom hostname fields
    ALTER TABLE sites
    ADD COLUMN IF NOT EXISTS cloudflare_hostname_id TEXT,
    ADD COLUMN IF NOT EXISTS cloudflare_route_id TEXT,
    ADD COLUMN IF NOT EXISTS cloudflare_ssl_status TEXT CHECK (
      cloudflare_ssl_status IN (
        'initializing',
        'pending_validation',
        'deleted',
        'pending_issuance',
        'pending_deployment',
        'pending_deletion',
        'pending_expiration',
        'expired',
        'active',
        'initializing_timed_out',
        'validation_timed_out',
        'issuance_timed_out',
        'deployment_timed_out',
        'deletion_timed_out',
        'pending_cleanup',
        'staging_deployment',
        'staging_active',
        'deactivating',
        'inactive',
        'backup_issued',
        'holding_deployment'
      )
    ),
    ADD COLUMN IF NOT EXISTS cloudflare_txt_name TEXT,
    ADD COLUMN IF NOT EXISTS cloudflare_txt_value TEXT,
    ADD COLUMN IF NOT EXISTS cloudflare_cname_target TEXT,
    ADD COLUMN IF NOT EXISTS cloudflare_created_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cloudflare_activated_at TIMESTAMPTZ;

    -- Add indexes for Cloudflare lookups
    CREATE INDEX IF NOT EXISTS idx_sites_cloudflare_hostname_id ON sites(cloudflare_hostname_id);
    CREATE INDEX IF NOT EXISTS idx_sites_cloudflare_route_id ON sites(cloudflare_route_id);
    CREATE INDEX IF NOT EXISTS idx_sites_cloudflare_ssl_status ON sites(cloudflare_ssl_status);

    -- Add comments for documentation
    IF NOT EXISTS (
      SELECT 1 FROM pg_description
      WHERE objoid = 'sites'::regclass
      AND objsubid = (SELECT attnum FROM pg_attribute WHERE attrelid = 'sites'::regclass AND attname = 'cloudflare_hostname_id')
    ) THEN
      COMMENT ON COLUMN sites.cloudflare_hostname_id IS 'Cloudflare Custom Hostname ID for custom domain SSL';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_description
      WHERE objoid = 'sites'::regclass
      AND objsubid = (SELECT attnum FROM pg_attribute WHERE attrelid = 'sites'::regclass AND attname = 'cloudflare_route_id')
    ) THEN
      COMMENT ON COLUMN sites.cloudflare_route_id IS 'Cloudflare Worker Route ID for custom domain routing';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_description
      WHERE objoid = 'sites'::regclass
      AND objsubid = (SELECT attnum FROM pg_attribute WHERE attrelid = 'sites'::regclass AND attname = 'cloudflare_ssl_status')
    ) THEN
      COMMENT ON COLUMN sites.cloudflare_ssl_status IS 'Current SSL certificate status from Cloudflare';
    END IF;

    RAISE NOTICE 'Cloudflare fields migration completed';
  ELSE
    RAISE NOTICE 'Sites table does not exist yet, skipping Cloudflare fields migration';
  END IF;
END $$;
