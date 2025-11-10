-- Add custom domain configuration fields to sites table
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

-- Add comment for documentation
COMMENT ON COLUMN sites.custom_domain_status IS 'Status of custom domain configuration: not_started, pending_verification, verified, failed, disconnected';
COMMENT ON COLUMN sites.dns_provider IS 'Detected DNS provider for the custom domain';
COMMENT ON COLUMN sites.dns_verification_token IS 'Unique token for DNS TXT record verification';
COMMENT ON COLUMN sites.dns_records IS 'JSON object containing required DNS records for configuration';
COMMENT ON COLUMN sites.last_dns_check_at IS 'Timestamp of last DNS verification check to enforce rate limiting';
COMMENT ON COLUMN sites.custom_domain_verified_at IS 'Timestamp when custom domain was successfully verified';
COMMENT ON COLUMN sites.custom_domain_error IS 'Last error message from DNS verification attempt';