-- Add Cloudflare custom hostname fields to sites table
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

-- Add indexes for Cloudflare fields
CREATE INDEX IF NOT EXISTS idx_sites_cloudflare_hostname_id ON sites(cloudflare_hostname_id) WHERE cloudflare_hostname_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sites_cloudflare_ssl_status ON sites(cloudflare_ssl_status) WHERE cloudflare_ssl_status IS NOT NULL;

-- Add comment to document the fields
COMMENT ON COLUMN sites.cloudflare_hostname_id IS 'Cloudflare custom hostname ID for this site';
COMMENT ON COLUMN sites.cloudflare_route_id IS 'Cloudflare worker route ID for this site';
COMMENT ON COLUMN sites.cloudflare_ssl_status IS 'Current SSL certificate provisioning status from Cloudflare';
COMMENT ON COLUMN sites.cloudflare_txt_name IS 'DNS TXT record name for domain ownership verification';
COMMENT ON COLUMN sites.cloudflare_txt_value IS 'DNS TXT record value for domain ownership verification';
COMMENT ON COLUMN sites.cloudflare_cname_target IS 'CNAME target for custom domain (typically proxy subdomain)';
COMMENT ON COLUMN sites.cloudflare_created_at IS 'When the custom hostname was created in Cloudflare';
COMMENT ON COLUMN sites.cloudflare_activated_at IS 'When the SSL certificate became active';