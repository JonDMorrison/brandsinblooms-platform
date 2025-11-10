-- =============================================
-- ADD FEATURED IMAGE SUPPORT TO EVENTS
-- =============================================
-- This migration adds the ability to mark one image as the featured/primary
-- image for an event. Uses FK approach for better data integrity and performance.

-- Add featured_image_id column to events table
ALTER TABLE public.events
ADD COLUMN featured_image_id UUID REFERENCES public.event_media(id) ON DELETE SET NULL;

-- Create index for featured image lookups
CREATE INDEX idx_events_featured_image ON public.events(featured_image_id) WHERE featured_image_id IS NOT NULL AND deleted_at IS NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.events.featured_image_id IS 'Primary/featured image for event cards and listings. References event_media table.';

-- =============================================
-- HELPER FUNCTION: Auto-set featured image to first image if null
-- =============================================
-- This function is called when querying events to provide a featured image fallback.
-- If featured_image_id is null, it returns the first image by sort_order.
-- This keeps the database normalized while providing a good default behavior.

CREATE OR REPLACE FUNCTION get_event_featured_image(p_event_id UUID, p_featured_image_id UUID)
RETURNS TABLE (
    id UUID,
    media_type VARCHAR(20),
    media_url TEXT,
    thumbnail_url TEXT,
    alt_text VARCHAR(255),
    caption VARCHAR(500),
    sort_order INTEGER
) AS $$
BEGIN
    -- If featured_image_id is set and exists, return it
    IF p_featured_image_id IS NOT NULL THEN
        RETURN QUERY
        SELECT
            em.id,
            em.media_type,
            em.media_url,
            em.thumbnail_url,
            em.alt_text,
            em.caption,
            em.sort_order
        FROM public.event_media em
        WHERE em.id = p_featured_image_id
          AND em.deleted_at IS NULL
        LIMIT 1;
    END IF;

    -- If no result yet (featured_image_id was null or deleted), fallback to first image by sort_order
    IF NOT FOUND OR p_featured_image_id IS NULL THEN
        RETURN QUERY
        SELECT
            em.id,
            em.media_type,
            em.media_url,
            em.thumbnail_url,
            em.alt_text,
            em.caption,
            em.sort_order
        FROM public.event_media em
        WHERE em.event_id = p_event_id
          AND em.deleted_at IS NULL
        ORDER BY em.sort_order ASC, em.created_at ASC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_event_featured_image IS 'Returns featured image for an event, falling back to first image by sort_order if no featured image is set';

-- =============================================
-- DATA MIGRATION: Set featured image for existing events
-- =============================================
-- For all existing events with media, set the featured_image_id to the first image by sort_order.
-- This ensures backward compatibility and provides a sensible default.

DO $$
DECLARE
    event_record RECORD;
    first_media_id UUID;
BEGIN
    -- Loop through all events that have media but no featured image set
    FOR event_record IN
        SELECT DISTINCT e.id
        FROM public.events e
        INNER JOIN public.event_media em ON em.event_id = e.id
        WHERE e.featured_image_id IS NULL
          AND e.deleted_at IS NULL
          AND em.deleted_at IS NULL
    LOOP
        -- Get the first media item by sort_order for this event
        SELECT em.id INTO first_media_id
        FROM public.event_media em
        WHERE em.event_id = event_record.id
          AND em.deleted_at IS NULL
        ORDER BY em.sort_order ASC, em.created_at ASC
        LIMIT 1;

        -- Set it as the featured image
        IF first_media_id IS NOT NULL THEN
            UPDATE public.events
            SET featured_image_id = first_media_id
            WHERE id = event_record.id;
        END IF;
    END LOOP;
END $$;
