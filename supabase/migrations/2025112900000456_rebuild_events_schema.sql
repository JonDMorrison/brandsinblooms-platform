-- Migration: Rebuild Events Schema
-- Description: Updates events table, renames occurrences to instances, creates summaries

-- =============================================
-- 1. Update events table
-- =============================================
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS program_id UUID,
ADD COLUMN IF NOT EXISTS weekly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_repeat BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS in_calendar BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS in_sidebar BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS in_home_feed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS in_events_feed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS registrable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS available_spots INTEGER;

-- Rename is_all_day to all_day if it exists, or add it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'is_all_day') THEN
        ALTER TABLE public.events RENAME COLUMN is_all_day TO all_day;
    ELSE
        ALTER TABLE public.events ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =============================================
-- 2. Rename and update event_occurrences -> event_instances
-- =============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_occurrences') THEN
        ALTER TABLE public.event_occurrences RENAME TO event_instances;
    END IF;
END $$;

-- Create event_instances if it didn't exist (and wasn't renamed)
CREATE TABLE IF NOT EXISTS public.event_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Rename columns to match new spec (start_datetime -> start_at) if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_instances' AND column_name = 'start_datetime') THEN
        ALTER TABLE public.event_instances RENAME COLUMN start_datetime TO start_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_instances' AND column_name = 'end_datetime') THEN
        ALTER TABLE public.event_instances RENAME COLUMN end_datetime TO end_at;
    END IF;
END $$;

-- =============================================
-- 3. Create event_summaries table
-- =============================================
CREATE TABLE IF NOT EXISTS public.event_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
    program_id UUID,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    weekly BOOLEAN DEFAULT false,
    auto_repeat BOOLEAN DEFAULT false,
    in_calendar BOOLEAN DEFAULT true,
    in_sidebar BOOLEAN DEFAULT false,
    in_home_feed BOOLEAN DEFAULT false,
    in_events_feed BOOLEAN DEFAULT true,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for event_summaries
CREATE INDEX IF NOT EXISTS idx_event_summaries_site_start ON public.event_summaries(site_id, start_at);
CREATE INDEX IF NOT EXISTS idx_event_summaries_range ON public.event_summaries(site_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_event_summaries_event ON public.event_summaries(event_id);

-- =============================================
-- 4. RLS Policies
-- =============================================

-- Enable RLS
ALTER TABLE public.event_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_instances ENABLE ROW LEVEL SECURITY;

-- event_summaries policies
DROP POLICY IF EXISTS "public_read_event_summaries" ON public.event_summaries;
CREATE POLICY "public_read_event_summaries" ON public.event_summaries
    FOR SELECT USING (
        published_at IS NOT NULL
    );

DROP POLICY IF EXISTS "site_members_manage_event_summaries" ON public.event_summaries;
CREATE POLICY "site_members_manage_event_summaries" ON public.event_summaries
    FOR ALL USING (
        site_id IN (
            SELECT site_id FROM site_memberships
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- event_instances policies (update if needed, or ensure they exist)
DROP POLICY IF EXISTS "site_members_manage_event_instances" ON public.event_instances;
CREATE POLICY "site_members_manage_event_instances" ON public.event_instances
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events
            WHERE site_id IN (
                SELECT site_id FROM site_memberships
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

DROP POLICY IF EXISTS "public_read_event_instances" ON public.event_instances;
CREATE POLICY "public_read_event_instances" ON public.event_instances
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM events
            WHERE status = 'published' AND deleted_at IS NULL
        )
    );
