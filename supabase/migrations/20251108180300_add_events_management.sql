-- =============================================
-- EVENTS MANAGEMENT TABLES
-- =============================================

-- ---------------------------------------------
-- 1. Main Events Table
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Basic Info
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    slug VARCHAR(255) NOT NULL,
    description TEXT, -- Rich text/HTML body

    -- Date/Time
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'America/New_York' NOT NULL,
    is_all_day BOOLEAN DEFAULT false,

    -- Location
    location VARCHAR(500),

    -- Publishing
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished')),

    -- Metadata (JSONB for flexibility)
    meta_data JSONB DEFAULT '{}',
    -- Example meta_data structure:
    -- {
    --   "seo": { "title": "", "description": "", "keywords": [] },
    --   "rrule": "FREQ=WEEKLY;BYDAY=TU;COUNT=10", (optional - for recurring events)
    --   "custom_fields": {}
    -- }

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    published_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ, -- Soft delete

    -- Constraints
    UNIQUE(site_id, slug),
    CHECK (end_datetime IS NULL OR end_datetime > start_datetime)
);

-- Indexes for Events
CREATE INDEX idx_events_site_status ON public.events(site_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_site_dates ON public.events(site_id, start_datetime DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_upcoming ON public.events(site_id, start_datetime)
    WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_events_slug ON public.events(site_id, slug) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_events_search ON public.events
    USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(location, '')))
    WHERE deleted_at IS NULL;

COMMENT ON TABLE public.events IS 'Event management for multi-tenant sites';
COMMENT ON COLUMN public.events.meta_data IS 'JSONB field for SEO, RRule, and custom event metadata';

-- ---------------------------------------------
-- 2. Event Media Table
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text VARCHAR(255),
    caption VARCHAR(500),
    sort_order INTEGER DEFAULT 0 NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_event_media_event ON public.event_media(event_id, sort_order) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.event_media IS 'Images and videos for events';

-- ---------------------------------------------
-- 3. Event Attachments Table
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_event_attachments_event ON public.event_attachments(event_id, created_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.event_attachments IS 'File attachments for events (PDFs, docs, etc.)';

-- ---------------------------------------------
-- 4. Event Associations Table
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

    -- Polymorphic association to content table
    related_type VARCHAR(20) NOT NULL CHECK (related_type IN ('page', 'blog_post')),
    related_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(event_id, related_type, related_id)
);

CREATE INDEX idx_event_associations_event ON public.event_associations(event_id);
CREATE INDEX idx_event_associations_related ON public.event_associations(related_type, related_id);

COMMENT ON TABLE public.event_associations IS 'Link events to pages and blog posts';

-- =============================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_associations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- Events Policies
-- ---------------------------------------------

-- Public: Read published events
CREATE POLICY "public_read_published_events" ON public.events
    FOR SELECT USING (
        status = 'published' AND deleted_at IS NULL
    );

-- Site members: Manage events
CREATE POLICY "site_members_manage_events" ON public.events
    FOR ALL USING (
        site_id IN (
            SELECT site_id
            FROM site_memberships
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- ---------------------------------------------
-- Event Media Policies
-- ---------------------------------------------

-- Public: Read media for published events
CREATE POLICY "public_read_event_media" ON public.event_media
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events
            WHERE status = 'published' AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- Site members: Manage event media
CREATE POLICY "site_members_manage_event_media" ON public.event_media
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events
            WHERE site_id IN (
                SELECT site_id
                FROM site_memberships
                WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
            )
        )
    );

-- ---------------------------------------------
-- Event Attachments Policies
-- ---------------------------------------------

-- Public: Read attachments for published events
CREATE POLICY "public_read_event_attachments" ON public.event_attachments
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events
            WHERE status = 'published' AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- Site members: Manage attachments
CREATE POLICY "site_members_manage_event_attachments" ON public.event_attachments
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events
            WHERE site_id IN (
                SELECT site_id
                FROM site_memberships
                WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
            )
        )
    );

-- ---------------------------------------------
-- Event Associations Policies
-- ---------------------------------------------

-- Public: Read associations for published events
CREATE POLICY "public_read_event_associations" ON public.event_associations
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events
            WHERE status = 'published' AND deleted_at IS NULL
        )
    );

-- Site members: Manage associations
CREATE POLICY "site_members_manage_event_associations" ON public.event_associations
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events
            WHERE site_id IN (
                SELECT site_id
                FROM site_memberships
                WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
            )
        )
    );

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER handle_updated_at_events
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Cascade soft deletes to related tables
CREATE OR REPLACE FUNCTION cascade_event_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Soft-delete related data
    UPDATE event_media SET deleted_at = NEW.deleted_at WHERE event_id = NEW.id AND deleted_at IS NULL;
    UPDATE event_attachments SET deleted_at = NEW.deleted_at WHERE event_id = NEW.id AND deleted_at IS NULL;
  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    -- Restore related data
    UPDATE event_media SET deleted_at = NULL WHERE event_id = NEW.id;
    UPDATE event_attachments SET deleted_at = NULL WHERE event_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cascade_event_soft_delete
    AFTER UPDATE OF deleted_at ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION cascade_event_soft_delete();

-- Auto-set created_by/updated_by
CREATE OR REPLACE FUNCTION set_event_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
    NEW.created_by = OLD.created_by; -- Preserve original creator
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_set_event_user_fields
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION set_event_user_fields();
