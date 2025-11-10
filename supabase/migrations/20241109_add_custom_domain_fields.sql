-- Legacy migration: Add custom domain configuration fields to sites table
-- This migration is kept for production compatibility (already run in prod)
-- Uses defensive checks to be idempotent and safe to run multiple times

DO $$
BEGIN
  -- Only proceed if sites table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sites') THEN

    -- Add columns if they don't exist
    ALTER TABLE sites
    ADD COLUMN IF NOT EXISTS custom_domain_status TEXT DEFAULT 'not_started'
      CHECK (custom_domain_status IN ('not_started', 'pending_verification', 'verified', 'failed', 'disconnected')),
    ADD COLUMN IF NOT EXISTS dns_provider TEXT,
    ADD COLUMN IF NOT EXISTS dns_verification_token TEXT,
    ADD COLUMN IF NOT EXISTS dns_records JSONB,
    ADD COLUMN IF NOT EXISTS last_dns_check_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS custom_domain_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS custom_domain_error TEXT;

    -- Add indexes for performance
    CREATE INDEX IF NOT EXISTS idx_sites_custom_domain_status ON sites(custom_domain_status);
    CREATE INDEX IF NOT EXISTS idx_sites_dns_verification_token ON sites(dns_verification_token);
    CREATE INDEX IF NOT EXISTS idx_sites_last_dns_check_at ON sites(last_dns_check_at);

    -- Add comments for documentation
    IF NOT EXISTS (
      SELECT 1 FROM pg_description
      WHERE objoid = 'sites'::regclass
      AND objsubid = (SELECT attnum FROM pg_attribute WHERE attrelid = 'sites'::regclass AND attname = 'custom_domain_status')
    ) THEN
      COMMENT ON COLUMN sites.custom_domain_status IS 'Status of custom domain configuration: not_started, pending_verification, verified, failed, disconnected';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_description
      WHERE objoid = 'sites'::regclass
      AND objsubid = (SELECT attnum FROM pg_attribute WHERE attrelid = 'sites'::regclass AND attname = 'dns_provider')
    ) THEN
      COMMENT ON COLUMN sites.dns_provider IS 'Detected DNS provider for the custom domain';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_description
      WHERE objoid = 'sites'::regclass
      AND objsubid = (SELECT attnum FROM pg_attribute WHERE attrelid = 'sites'::regclass AND attname = 'dns_verification_token')
    ) THEN
      COMMENT ON COLUMN sites.dns_verification_token IS 'Unique token for DNS TXT record verification';
    END IF;

    RAISE NOTICE 'Custom domain fields migration completed';
  ELSE
    RAISE NOTICE 'Sites table does not exist yet, skipping custom domain fields migration';
  END IF;
END $$;
