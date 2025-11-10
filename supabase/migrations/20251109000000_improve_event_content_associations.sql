-- =============================================
-- IMPROVE EVENT-CONTENT ASSOCIATIONS
-- =============================================
--
-- This migration enhances the existing event_associations table
-- to ensure proper site isolation and adds helper functions
-- for managing event-content relationships.
--
-- Changes:
-- 1. Rename event_associations to event_content_associations for clarity
-- 2. Add site_id for proper multi-tenant isolation
-- 3. Add composite indexes for query performance
-- 4. Update RLS policies to enforce site-level security
-- 5. Add helper functions for common operations
-- =============================================

-- ---------------------------------------------
-- 1. Drop existing event_associations table
-- ---------------------------------------------
-- Since this is a new feature, we can safely drop and recreate
DROP TABLE IF EXISTS public.event_associations CASCADE;

-- ---------------------------------------------
-- 2. Create improved event_content_associations table
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_content_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,

    -- Denormalized site_id for efficient RLS and queries
    -- This is set automatically via trigger
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Ensure no duplicate associations
    UNIQUE(event_id, content_id)
);

-- ---------------------------------------------
-- 3. Create indexes for performance
-- ---------------------------------------------

-- Index for finding all content associated with an event
CREATE INDEX idx_event_content_assoc_event
    ON public.event_content_associations(event_id, created_at DESC);

-- Index for finding all events associated with content
CREATE INDEX idx_event_content_assoc_content
    ON public.event_content_associations(content_id, created_at DESC);

-- Index for site-scoped queries (used by RLS)
CREATE INDEX idx_event_content_assoc_site
    ON public.event_content_associations(site_id);

-- Composite index for efficient site + event queries
CREATE INDEX idx_event_content_assoc_site_event
    ON public.event_content_associations(site_id, event_id);

-- Composite index for efficient site + content queries
CREATE INDEX idx_event_content_assoc_site_content
    ON public.event_content_associations(site_id, content_id);

COMMENT ON TABLE public.event_content_associations IS
    'Many-to-many relationships between events and content (pages/blog posts). Enforces site-level isolation for multi-tenant security.';

COMMENT ON COLUMN public.event_content_associations.site_id IS
    'Denormalized from events table for efficient RLS policies. Automatically set via trigger on INSERT/UPDATE.';

-- ---------------------------------------------
-- 4. Create trigger to set site_id automatically
-- ---------------------------------------------

CREATE OR REPLACE FUNCTION set_event_content_association_site_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Set site_id from the event
    SELECT site_id INTO NEW.site_id
    FROM events
    WHERE id = NEW.event_id;

    -- Validate that content belongs to the same site
    IF NOT EXISTS (
        SELECT 1 FROM content
        WHERE id = NEW.content_id
        AND site_id = NEW.site_id
    ) THEN
        RAISE EXCEPTION 'Event and content must belong to the same site';
    END IF;

    -- Set created_by if not already set
    IF NEW.created_by IS NULL THEN
        NEW.created_by := auth.uid();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_set_event_content_association_site_id
    BEFORE INSERT OR UPDATE ON public.event_content_associations
    FOR EACH ROW
    EXECUTE FUNCTION set_event_content_association_site_id();

COMMENT ON FUNCTION set_event_content_association_site_id() IS
    'Automatically sets site_id from event and validates both event and content  belong to the same site. This enforces referential integrity at the site level.';

-- ---------------------------------------------
-- 5. Enable RLS
-- ---------------------------------------------

ALTER TABLE public.event_content_associations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- 6. Create RLS Policies
-- ---------------------------------------------

-- Public: Read associations for published events
CREATE POLICY "public_read_event_content_associations"
    ON public.event_content_associations
    FOR SELECT
    USING (
        event_id IN (
            SELECT id
            FROM events
            WHERE status = 'published'
            AND deleted_at IS NULL
        )
    );

-- Site members: Read all associations for their site
CREATE POLICY "site_members_read_event_content_associations"
    ON public.event_content_associations
    FOR SELECT
    USING (
        site_id IN (
            SELECT site_id
            FROM site_memberships
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Site owners/editors: Insert associations
CREATE POLICY "site_editors_insert_event_content_associations"
    ON public.event_content_associations
    FOR INSERT
    WITH CHECK (
        site_id IN (
            SELECT site_id
            FROM site_memberships
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'editor')
            AND is_active = true
        )
    );

-- Site owners/editors: Delete associations
CREATE POLICY "site_editors_delete_event_content_associations"
    ON public.event_content_associations
    FOR DELETE
    USING (
        site_id IN (
            SELECT site_id
            FROM site_memberships
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'editor')
            AND is_active = true
        )
    );

-- Platform admins: Full access
CREATE POLICY "platform_admins_all_event_content_associations"
    ON public.event_content_associations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ---------------------------------------------
-- 7. Helper Functions
-- ---------------------------------------------

-- Function: Get all content associated with an event
CREATE OR REPLACE FUNCTION get_event_content(p_event_id UUID)
RETURNS TABLE (
    content_id UUID,
    content_type VARCHAR,
    title VARCHAR,
    slug VARCHAR,
    is_published BOOLEAN,
    published_at TIMESTAMPTZ,
    association_created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.content_type,
        c.title,
        c.slug,
        c.is_published,
        c.published_at,
        eca.created_at AS association_created_at
    FROM event_content_associations eca
    JOIN content c ON c.id = eca.content_id
    WHERE eca.event_id = p_event_id
    ORDER BY eca.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_event_content(UUID) IS
    'Returns all content (pages/blog posts) associated with an event.  Results are ordered by association creation date (newest first).';

-- Function: Get all events associated with content
CREATE OR REPLACE FUNCTION get_content_events(p_content_id UUID)
RETURNS TABLE (
    event_id UUID,
    title VARCHAR,
    slug VARCHAR,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    status VARCHAR,
    location VARCHAR,
    association_created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.title,
        e.slug,
        e.start_datetime,
        e.end_datetime,
        e.status,
        e.location,
        eca.created_at AS association_created_at
    FROM event_content_associations eca
    JOIN events e ON e.id = eca.event_id
    WHERE eca.content_id = p_content_id
    AND e.deleted_at IS NULL
    ORDER BY e.start_datetime ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_content_events(UUID) IS
    'Returns all events associated with a content item (page/blog post).  Results are ordered by event start date (earliest first).';

-- Function: Create association with validation
CREATE OR REPLACE FUNCTION create_event_content_association(
    p_event_id UUID,
    p_content_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_association_id UUID;
    v_event_site_id UUID;
    v_content_site_id UUID;
BEGIN
    -- Get site IDs
    SELECT site_id INTO v_event_site_id FROM events WHERE id = p_event_id;
    SELECT site_id INTO v_content_site_id FROM content WHERE id = p_content_id;

    -- Validate event exists
    IF v_event_site_id IS NULL THEN
        RAISE EXCEPTION 'Event not found: %', p_event_id;
    END IF;

    -- Validate content exists
    IF v_content_site_id IS NULL THEN
        RAISE EXCEPTION 'Content not found: %', p_content_id;
    END IF;

    -- Validate same site
    IF v_event_site_id != v_content_site_id THEN
        RAISE EXCEPTION 'Event and content must belong to the same site';
    END IF;

    -- Create association (ON CONFLICT prevents duplicates)
    INSERT INTO event_content_associations (event_id, content_id, site_id)
    VALUES (p_event_id, p_content_id, v_event_site_id)
    ON CONFLICT (event_id, content_id) DO NOTHING
    RETURNING id INTO v_association_id;

    -- If NULL, association already existed
    IF v_association_id IS NULL THEN
        SELECT id INTO v_association_id
        FROM event_content_associations
        WHERE event_id = p_event_id AND content_id = p_content_id;
    END IF;

    RETURN v_association_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_event_content_association(UUID, UUID) IS
    'Creates an event-content association with full validation.  Idempotent - returns existing association if already exists.';

-- Function: Remove association
CREATE OR REPLACE FUNCTION remove_event_content_association(
    p_event_id UUID,
    p_content_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_deleted BOOLEAN;
BEGIN
    DELETE FROM event_content_associations
    WHERE event_id = p_event_id AND content_id = p_content_id
    RETURNING true INTO v_deleted;

    RETURN COALESCE(v_deleted, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION remove_event_content_association(UUID, UUID) IS
    'Removes an event-content association. Returns true if deleted, false if not found.';

-- Function: Bulk create associations for an event
CREATE OR REPLACE FUNCTION bulk_create_event_content_associations(
    p_event_id UUID,
    p_content_ids UUID[]
)
RETURNS TABLE (
    content_id UUID,
    association_id UUID,
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_content_id UUID;
    v_association_id UUID;
BEGIN
    FOREACH v_content_id IN ARRAY p_content_ids
    LOOP
        BEGIN
            v_association_id := create_event_content_association(p_event_id, v_content_id);

            RETURN QUERY SELECT
                v_content_id,
                v_association_id,
                true,
                NULL::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT
                v_content_id,
                NULL::UUID,
                false,
                SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION bulk_create_event_content_associations(UUID, UUID[]) IS
    'Creates multiple event-content associations in a single call.  Returns status for each association (success/failure with error message).';

-- ---------------------------------------------
-- 8. Grant permissions to authenticated users
-- ---------------------------------------------

GRANT SELECT ON public.event_content_associations TO authenticated;
GRANT INSERT ON public.event_content_associations TO authenticated;
GRANT DELETE ON public.event_content_associations TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_event_content(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_events(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_content_association(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_event_content_association(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_create_event_content_associations(UUID, UUID[]) TO authenticated;

-- Grant execute to anonymous for read-only functions (public access)
GRANT EXECUTE ON FUNCTION get_event_content(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_content_events(UUID) TO anon;
