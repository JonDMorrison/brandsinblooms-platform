-- Create domains table for multi-domain support per site
-- Migration: 20251129000000_create_domains_table

-- Create domains table
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT domains_hostname_unique UNIQUE (hostname),
  CONSTRAINT domains_status_check CHECK (status IN ('pending', 'verified', 'active', 'failed'))
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_domains_hostname ON public.domains(hostname);
CREATE INDEX IF NOT EXISTS idx_domains_site_id ON public.domains(site_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);

-- Ensure only one primary domain per site
CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_primary_per_site 
  ON public.domains(site_id) 
  WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read for active domains (needed for routing)
CREATE POLICY "Public can read active domains"
  ON public.domains FOR SELECT
  USING (status = 'active');

-- Policy: Site owners can manage their domains
CREATE POLICY "Site owners can manage domains"
  ON public.domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.site_memberships
      WHERE site_memberships.site_id = domains.site_id
        AND site_memberships.user_id = auth.uid()
        AND site_memberships.role = 'owner'
        AND site_memberships.is_active = true
    )
  );

-- Comments
COMMENT ON TABLE public.domains IS 'Custom domains for sites - supports multiple domains per site';
COMMENT ON COLUMN public.domains.hostname IS 'Full hostname (e.g., example.com, www.example.com)';
COMMENT ON COLUMN public.domains.is_primary IS 'Primary domain for the site (only one per site allowed)';
COMMENT ON COLUMN public.domains.status IS 'Domain verification status: pending, verified, active, failed';
COMMENT ON COLUMN public.domains.verified_at IS 'Timestamp when domain was verified';
