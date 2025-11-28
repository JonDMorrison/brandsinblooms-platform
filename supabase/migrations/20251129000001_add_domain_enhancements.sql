-- Add DNS verification and SSL management fields to domains table
-- Migration: 20251129000001_add_domain_enhancements

-- DNS Verification fields
ALTER TABLE public.domains
  ADD COLUMN dns_checked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN dns_records JSONB,
  ADD COLUMN verification_errors TEXT[];

-- SSL Certificate fields
ALTER TABLE public.domains
  ADD COLUMN ssl_enabled BOOLEAN DEFAULT false,
  ADD COLUMN ssl_provider TEXT,
  ADD COLUMN ssl_issued_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN ssl_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN ssl_auto_renew BOOLEAN DEFAULT true;

-- Subdomain support fields
ALTER TABLE public.domains
  ADD COLUMN is_subdomain BOOLEAN DEFAULT false,
  ADD COLUMN parent_domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
  ADD COLUMN subdomain_prefix TEXT,
  ADD COLUMN is_wildcard BOOLEAN DEFAULT false;

-- Create domain_verification_log table
CREATE TABLE IF NOT EXISTS public.domain_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT verification_log_check_type CHECK (check_type IN ('dns', 'ssl', 'http')),
  CONSTRAINT verification_log_status CHECK (status IN ('success', 'failed', 'pending'))
);

CREATE INDEX IF NOT EXISTS idx_domain_verification_log_domain_id ON public.domain_verification_log(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_verification_log_checked_at ON public.domain_verification_log(checked_at DESC);

-- Create domain_analytics table
CREATE TABLE IF NOT EXISTS public.domain_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pageviews INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2),
  avg_session_duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT domain_analytics_unique_domain_date UNIQUE(domain_id, date)
);

CREATE INDEX IF NOT EXISTS idx_domain_analytics_domain_date ON public.domain_analytics(domain_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_domain_analytics_site_date ON public.domain_analytics(site_id, date DESC);

-- Create domain_events table for real-time tracking
CREATE TABLE IF NOT EXISTS public.domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  session_id TEXT,
  user_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT domain_events_type CHECK (event_type IN ('pageview', 'session_start', 'conversion', 'click'))
);

CREATE INDEX IF NOT EXISTS idx_domain_events_domain_created ON public.domain_events(domain_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_events_site_created ON public.domain_events(site_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_events_session ON public.domain_events(session_id);
CREATE INDEX IF NOT EXISTS idx_domain_events_date ON public.domain_events(CAST(created_at AS DATE));

-- Create subdomain_templates table
CREATE TABLE IF NOT EXISTS public.subdomain_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prefix_pattern TEXT NOT NULL,
  auto_create BOOLEAN DEFAULT false,
  default_content_id UUID REFERENCES public.content(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subdomain_templates_site ON public.subdomain_templates(site_id);

-- RLS Policies for new tables

-- domain_verification_log
ALTER TABLE public.domain_verification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can view verification logs"
  ON public.domain_verification_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.domains d
      JOIN public.site_memberships sm ON sm.site_id = d.site_id
      WHERE d.id = domain_verification_log.domain_id
        AND sm.user_id = auth.uid()
        AND sm.is_active = true
    )
  );

-- domain_analytics
ALTER TABLE public.domain_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site members can view analytics"
  ON public.domain_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.site_memberships
      WHERE site_memberships.site_id = domain_analytics.site_id
        AND site_memberships.user_id = auth.uid()
        AND site_memberships.is_active = true
    )
  );

-- domain_events
ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert events"
  ON public.domain_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Site members can view events"
  ON public.domain_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.site_memberships
      WHERE site_memberships.site_id = domain_events.site_id
        AND site_memberships.user_id = auth.uid()
        AND site_memberships.is_active = true
    )
  );

-- subdomain_templates
ALTER TABLE public.subdomain_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owners can manage subdomain templates"
  ON public.subdomain_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.site_memberships
      WHERE site_memberships.site_id = subdomain_templates.site_id
        AND site_memberships.user_id = auth.uid()
        AND site_memberships.role = 'owner'
        AND site_memberships.is_active = true
    )
  );

-- Comments
COMMENT ON TABLE public.domain_verification_log IS 'Log of domain verification attempts';
COMMENT ON TABLE public.domain_analytics IS 'Aggregated daily analytics per domain';
COMMENT ON TABLE public.domain_events IS 'Real-time tracking events per domain';
COMMENT ON TABLE public.subdomain_templates IS 'Templates for auto-creating subdomains';
