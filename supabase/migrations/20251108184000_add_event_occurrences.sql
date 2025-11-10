-- =============================================
-- EVENT OCCURRENCES - Multi-Date Events Support
-- =============================================
-- This migration adds support for events with multiple dates/iterations
-- while maintaining backward compatibility with existing single-date events.

-- ---------------------------------------------
-- 1. Event Occurrences Table
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

    -- Date/Time (can override parent event)
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    is_all_day BOOLEAN DEFAULT false NOT NULL,

    -- Optional overrides (inherit from parent event if NULL)
    location VARCHAR(500), -- Can override parent event location

    -- Occurrence metadata (JSONB for flexibility)
    meta_data JSONB DEFAULT '{}',
    -- Example meta_data structure:
    -- {
    --   "capacity": 50,
    --   "registration_count": 23,
    --   "waitlist_count": 5,
    --   "notes": "Special guest speaker",
    --   "custom_fields": {}
    -- }

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ, -- Soft delete

    -- Constraints
    CHECK (end_datetime IS NULL OR end_datetime > start_datetime)
);

-- ---------------------------------------------
-- 2. Indexes for Event Occurrences
-- ---------------------------------------------

-- Primary query patterns
CREATE INDEX idx_event_occurrences_event ON public.event_occurrences(event_id, start_datetime DESC)
    WHERE deleted_at IS NULL;

-- Date range queries (most common for calendar views)
CREATE INDEX idx_event_occurrences_dates ON public.event_occurrences(start_datetime, end_datetime)
    WHERE deleted_at IS NULL;

-- Upcoming occurrences (frequently used for "next event" queries)
-- Note: NOW() removed from predicate as it's not immutable - filter in queries instead
CREATE INDEX idx_event_occurrences_upcoming ON public.event_occurrences(event_id, start_datetime)
    WHERE deleted_at IS NULL;

-- Multi-tenant queries (join with events table for site_id filtering)
-- This index supports queries that filter by event properties AND occurrence dates
CREATE INDEX idx_event_occurrences_composite ON public.event_occurrences(event_id, start_datetime, deleted_at);

COMMENT ON TABLE public.event_occurrences IS 'Multiple date/time iterations for events';
COMMENT ON COLUMN public.event_occurrences.location IS 'Override location for specific occurrence (NULL = inherit from event)';
COMMENT ON COLUMN public.event_occurrences.meta_data IS 'JSONB for capacity, registrations, occurrence-specific data';

-- ---------------------------------------------
-- 3. Row-Level Security (RLS) Policies
-- ---------------------------------------------

ALTER TABLE public.event_occurrences ENABLE ROW LEVEL SECURITY;

-- Public: Read occurrences for published events
CREATE POLICY "public_read_event_occurrences" ON public.event_occurrences
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events
            WHERE status = 'published' AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

-- Site members: Manage occurrences
CREATE POLICY "site_members_manage_event_occurrences" ON public.event_occurrences
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
-- 4. Triggers
-- ---------------------------------------------

-- Auto-update updated_at timestamp
CREATE TRIGGER handle_updated_at_event_occurrences
    BEFORE UPDATE ON public.event_occurrences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Cascade soft deletes from events to occurrences
CREATE OR REPLACE FUNCTION cascade_event_occurrence_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Soft-delete all occurrences when event is deleted
    UPDATE event_occurrences
    SET deleted_at = NEW.deleted_at
    WHERE event_id = NEW.id AND deleted_at IS NULL;
  ELSIF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    -- Restore all occurrences when event is restored
    UPDATE event_occurrences
    SET deleted_at = NULL
    WHERE event_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update existing trigger to include occurrences
DROP TRIGGER IF EXISTS trigger_cascade_event_soft_delete ON public.events;
CREATE TRIGGER trigger_cascade_event_soft_delete
    AFTER UPDATE OF deleted_at ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION cascade_event_occurrence_soft_delete();

-- ---------------------------------------------
-- 5. Migration Helper Function
-- ---------------------------------------------
-- This function migrates existing single-date events to use occurrences
-- while maintaining backward compatibility

CREATE OR REPLACE FUNCTION migrate_single_date_events_to_occurrences()
RETURNS TABLE(migrated_count INTEGER) AS $$
DECLARE
    migration_count INTEGER := 0;
BEGIN
    -- Insert occurrences for events that don't have any
    -- This handles existing events and provides backward compatibility
    INSERT INTO public.event_occurrences (
        event_id,
        start_datetime,
        end_datetime,
        is_all_day,
        location,
        created_at,
        updated_at
    )
    SELECT
        e.id,
        e.start_datetime,
        e.end_datetime,
        e.is_all_day,
        NULL, -- Don't duplicate location (will inherit from parent)
        e.created_at,
        e.updated_at
    FROM public.events e
    WHERE
        e.deleted_at IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM public.event_occurrences eo
            WHERE eo.event_id = e.id
        );

    GET DIAGNOSTICS migration_count = ROW_COUNT;

    RETURN QUERY SELECT migration_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migrate_single_date_events_to_occurrences() IS
    'One-time migration to create occurrences for existing single-date events';

-- ---------------------------------------------
-- 6. Backward Compatibility View (Optional)
-- ---------------------------------------------
-- This view provides backward compatibility for queries expecting
-- start_datetime/end_datetime directly on events
-- It returns the NEXT upcoming occurrence for each event

CREATE OR REPLACE VIEW event_with_next_occurrence AS
SELECT
    e.*,
    eo.id AS next_occurrence_id,
    eo.start_datetime AS next_start_datetime,
    eo.end_datetime AS next_end_datetime,
    eo.is_all_day AS next_is_all_day,
    COALESCE(eo.location, e.location) AS next_location
FROM public.events e
LEFT JOIN LATERAL (
    SELECT *
    FROM public.event_occurrences
    WHERE event_id = e.id
        AND deleted_at IS NULL
        AND start_datetime >= NOW()
    ORDER BY start_datetime ASC
    LIMIT 1
) eo ON true
WHERE e.deleted_at IS NULL;

COMMENT ON VIEW event_with_next_occurrence IS
    'Backward-compatible view showing events with their next upcoming occurrence';

-- ---------------------------------------------
-- 7. Helper Functions for Common Queries
-- ---------------------------------------------

-- Get all occurrences for an event (ordered by date)
CREATE OR REPLACE FUNCTION get_event_occurrences(p_event_id UUID)
RETURNS TABLE(
    occurrence_id UUID,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    is_all_day BOOLEAN,
    location VARCHAR,
    meta_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        eo.id,
        eo.start_datetime,
        eo.end_datetime,
        eo.is_all_day,
        COALESCE(eo.location, e.location) AS location,
        eo.meta_data
    FROM public.event_occurrences eo
    JOIN public.events e ON e.id = eo.event_id
    WHERE
        eo.event_id = p_event_id
        AND eo.deleted_at IS NULL
    ORDER BY eo.start_datetime ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_event_occurrences(UUID) IS
    'Get all occurrences for an event with inherited location';

-- Get occurrences in a date range (for calendar views)
CREATE OR REPLACE FUNCTION get_site_occurrences_in_range(
    p_site_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE(
    event_id UUID,
    event_title VARCHAR,
    event_slug VARCHAR,
    occurrence_id UUID,
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    is_all_day BOOLEAN,
    location VARCHAR,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.title,
        e.slug,
        eo.id,
        eo.start_datetime,
        eo.end_datetime,
        eo.is_all_day,
        COALESCE(eo.location, e.location) AS location,
        e.status
    FROM public.event_occurrences eo
    JOIN public.events e ON e.id = eo.event_id
    WHERE
        e.site_id = p_site_id
        AND e.deleted_at IS NULL
        AND eo.deleted_at IS NULL
        AND (
            -- Occurrence starts in range
            (eo.start_datetime >= p_start_date AND eo.start_datetime < p_end_date)
            OR
            -- Occurrence ends in range
            (eo.end_datetime > p_start_date AND eo.end_datetime <= p_end_date)
            OR
            -- Occurrence spans entire range
            (eo.start_datetime <= p_start_date AND eo.end_datetime >= p_end_date)
        )
    ORDER BY eo.start_datetime ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_site_occurrences_in_range(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS
    'Get all event occurrences for a site within a date range (for calendar views)';

-- Add occurrence to existing event (helper for +7 days, +30 days buttons)
CREATE OR REPLACE FUNCTION add_event_occurrence(
    p_event_id UUID,
    p_days_offset INTEGER,
    p_base_occurrence_id UUID DEFAULT NULL -- If NULL, uses event's first occurrence
)
RETURNS UUID AS $$
DECLARE
    v_base_start TIMESTAMPTZ;
    v_base_end TIMESTAMPTZ;
    v_base_is_all_day BOOLEAN;
    v_base_location VARCHAR;
    v_new_occurrence_id UUID;
BEGIN
    -- Get base occurrence to copy from
    IF p_base_occurrence_id IS NOT NULL THEN
        SELECT start_datetime, end_datetime, is_all_day, location
        INTO v_base_start, v_base_end, v_base_is_all_day, v_base_location
        FROM event_occurrences
        WHERE id = p_base_occurrence_id AND deleted_at IS NULL;
    ELSE
        -- Use first occurrence or fall back to event dates
        SELECT
            COALESCE(eo.start_datetime, e.start_datetime),
            COALESCE(eo.end_datetime, e.end_datetime),
            COALESCE(eo.is_all_day, e.is_all_day),
            eo.location
        INTO v_base_start, v_base_end, v_base_is_all_day, v_base_location
        FROM events e
        LEFT JOIN event_occurrences eo ON eo.event_id = e.id AND eo.deleted_at IS NULL
        WHERE e.id = p_event_id
        ORDER BY eo.start_datetime ASC
        LIMIT 1;
    END IF;

    -- Create new occurrence offset by specified days
    INSERT INTO event_occurrences (
        event_id,
        start_datetime,
        end_datetime,
        is_all_day,
        location
    ) VALUES (
        p_event_id,
        v_base_start + (p_days_offset || ' days')::INTERVAL,
        v_base_end + (p_days_offset || ' days')::INTERVAL,
        v_base_is_all_day,
        v_base_location
    )
    RETURNING id INTO v_new_occurrence_id;

    RETURN v_new_occurrence_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_event_occurrence(UUID, INTEGER, UUID) IS
    'Add new occurrence to event offset by N days from base occurrence';

-- Bulk update is_all_day for all occurrences
CREATE OR REPLACE FUNCTION update_event_occurrences_all_day(
    p_event_id UUID,
    p_is_all_day BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE event_occurrences
    SET is_all_day = p_is_all_day,
        updated_at = NOW()
    WHERE event_id = p_event_id
        AND deleted_at IS NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_event_occurrences_all_day(UUID, BOOLEAN) IS
    'Bulk update all-day flag for all occurrences of an event';
