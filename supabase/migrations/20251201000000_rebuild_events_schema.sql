-- =============================================
-- REBUILD EVENTS SCHEMA
-- =============================================
-- This migration replaces the previous events implementation with a new
-- multi-tenant, instance-based model optimized for calendars and recurring events.

-- ---------------------------------------------
-- 1. Drop Old Tables (Cleanup)
-- ---------------------------------------------

DROP TABLE IF EXISTS public.event_occurrences CASCADE;
DROP TABLE IF EXISTS public.event_associations CASCADE;
DROP TABLE IF EXISTS public.event_attachments CASCADE;
DROP TABLE IF EXISTS public.event_media CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- ---------------------------------------------
-- 2. Create Events Table (Core Definition)
-- ---------------------------------------------

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    program_id UUID, -- Optional grouping
    
    -- Content
    title TEXT NOT NULL,
    subtitle TEXT,
    slug TEXT NOT NULL,
    description TEXT, -- Can be HTML or JSON string
    location TEXT,
    
    -- Configuration / Flags
    all_day BOOLEAN NOT NULL DEFAULT false,
    weekly BOOLEAN NOT NULL DEFAULT false,
    auto_repeat BOOLEAN NOT NULL DEFAULT false,
    
    -- Visibility Flags
    in_calendar BOOLEAN NOT NULL DEFAULT true,
    in_sidebar BOOLEAN NOT NULL DEFAULT false,
    in_home_feed BOOLEAN NOT NULL DEFAULT false,
    in_events_feed BOOLEAN NOT NULL DEFAULT true,
    
    -- Registration
    registrable BOOLEAN NOT NULL DEFAULT false,
    available_spots INTEGER,
    
    -- Timestamps
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE (site_id, slug)
);

-- Indexes
CREATE INDEX idx_events_site_id ON public.events(site_id);
CREATE INDEX idx_events_site_slug ON public.events(site_id, slug);

-- ---------------------------------------------
-- 3. Create Event Instances Table (Occurrences)
-- ---------------------------------------------

CREATE TABLE public.event_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT check_end_after_start CHECK (end_at >= start_at)
);

-- Indexes
CREATE INDEX idx_event_instances_event_id ON public.event_instances(event_id);
CREATE INDEX idx_event_instances_dates ON public.event_instances(start_at, end_at);

-- ---------------------------------------------
-- 4. Create Event Summaries Table (Denormalized)
-- ---------------------------------------------
-- This table is used for fast calendar/list queries without complex joins.
-- It should be maintained by application code (or triggers in future).

CREATE TABLE public.event_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    program_id UUID,
    
    -- Denormalized Data
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    
    -- Copied Flags for Filtering
    all_day BOOLEAN NOT NULL DEFAULT false,
    weekly BOOLEAN NOT NULL DEFAULT false,
    auto_repeat BOOLEAN NOT NULL DEFAULT false,
    in_calendar BOOLEAN NOT NULL DEFAULT true,
    in_sidebar BOOLEAN NOT NULL DEFAULT false,
    in_home_feed BOOLEAN NOT NULL DEFAULT false,
    in_events_feed BOOLEAN NOT NULL DEFAULT true,
    
    published_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_event_summaries_site_start ON public.event_summaries(site_id, start_at);
CREATE INDEX idx_event_summaries_site_program_start ON public.event_summaries(site_id, program_id, start_at);
CREATE INDEX idx_event_summaries_range ON public.event_summaries(site_id, start_at, end_at);

-- ---------------------------------------------
-- 5. Row Level Security (RLS)
-- ---------------------------------------------

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read (Published Only)
-- Note: We assume 'published' means published_at IS NOT NULL and in the past (or just not null).
-- For simplicity here, we check published_at IS NOT NULL.

CREATE POLICY "Public read published events" ON public.events
    FOR SELECT USING (published_at IS NOT NULL);

CREATE POLICY "Public read published instances" ON public.event_instances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e 
            WHERE e.id = event_instances.event_id 
            AND e.published_at IS NOT NULL
        )
    );

CREATE POLICY "Public read published summaries" ON public.event_summaries
    FOR SELECT USING (published_at IS NOT NULL);

-- Policy: Site Members Write (Owner/Editor)
-- We reuse the pattern: site_id IN (SELECT site_id FROM site_memberships WHERE user_id = auth.uid() ...)

CREATE POLICY "Site members manage events" ON public.events
    FOR ALL USING (
        site_id IN (
            SELECT site_id FROM public.site_memberships 
            WHERE user_id = auth.uid() AND (role = 'owner' OR role = 'editor')
        )
    );

CREATE POLICY "Site members manage instances" ON public.event_instances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_instances.event_id
            AND e.site_id IN (
                SELECT site_id FROM public.site_memberships 
                WHERE user_id = auth.uid() AND (role = 'owner' OR role = 'editor')
            )
        )
    );

CREATE POLICY "Site members manage summaries" ON public.event_summaries
    FOR ALL USING (
        site_id IN (
            SELECT site_id FROM public.site_memberships 
            WHERE user_id = auth.uid() AND (role = 'owner' OR role = 'editor')
        )
    );

-- ---------------------------------------------
-- 6. Triggers (Timestamps)
-- ---------------------------------------------

-- Re-use existing handle_updated_at function if available, else create simple one
-- Assuming handle_updated_at exists from previous migrations.

CREATE TRIGGER handle_updated_at_events
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_instances
    BEFORE UPDATE ON public.event_instances
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_summaries
    BEFORE UPDATE ON public.event_summaries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
