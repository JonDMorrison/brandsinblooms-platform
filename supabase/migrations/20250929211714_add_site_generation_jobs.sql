-- Site Generation Jobs Migration
-- Implements job queue system for tracking LLM-powered site generation
-- Provides comprehensive tracking, error handling, and cost monitoring

-- =====================================================
-- 1. SITE GENERATION JOBS TABLE
-- =====================================================

-- Create site generation jobs table
CREATE TABLE public.site_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User who initiated the job
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Job status tracking
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 NOT NULL CHECK (progress >= 0 AND progress <= 100),

    -- Business information input
    business_info JSONB NOT NULL,

    -- Generated data from LLM
    generated_data JSONB,

    -- Reference to created site (populated after successful creation)
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,

    -- Error tracking
    error_message TEXT,
    error_code TEXT,

    -- Cost and usage tracking
    cost_cents INTEGER DEFAULT 0 NOT NULL,
    token_usage JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_completed_at CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status = 'failed' AND completed_at IS NOT NULL) OR
        (status IN ('pending', 'processing') AND completed_at IS NULL)
    ),
    CONSTRAINT valid_generated_data CHECK (
        (status = 'completed' AND generated_data IS NOT NULL) OR
        (status != 'completed')
    ),
    CONSTRAINT valid_error_info CHECK (
        (status = 'failed' AND error_message IS NOT NULL) OR
        (status != 'failed')
    )
);

-- Add helpful comment
COMMENT ON TABLE public.site_generation_jobs IS 'Tracks LLM-powered site generation jobs with status, progress, and cost monitoring';
COMMENT ON COLUMN public.site_generation_jobs.business_info IS 'JSONB containing user prompt, business name, industry, and other input parameters';
COMMENT ON COLUMN public.site_generation_jobs.generated_data IS 'JSONB containing complete LLM output before site creation';
COMMENT ON COLUMN public.site_generation_jobs.token_usage IS 'JSONB containing prompt_tokens, completion_tokens, and total_tokens';
COMMENT ON COLUMN public.site_generation_jobs.cost_cents IS 'Cost in cents for API usage';

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for user job queries (most common)
CREATE INDEX idx_site_generation_jobs_user ON public.site_generation_jobs(user_id, created_at DESC);

-- Index for status filtering
CREATE INDEX idx_site_generation_jobs_status ON public.site_generation_jobs(status, created_at DESC);

-- Index for timestamp queries
CREATE INDEX idx_site_generation_jobs_created_at ON public.site_generation_jobs(created_at DESC);

-- Index for site lookup
CREATE INDEX idx_site_generation_jobs_site_id ON public.site_generation_jobs(site_id) WHERE site_id IS NOT NULL;

-- Composite index for active job monitoring
CREATE INDEX idx_site_generation_jobs_active ON public.site_generation_jobs(status, updated_at DESC)
WHERE status IN ('pending', 'processing');

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.site_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own jobs
CREATE POLICY "Users can view their own jobs"
ON public.site_generation_jobs FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own jobs
CREATE POLICY "Users can create their own jobs"
ON public.site_generation_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all jobs
CREATE POLICY "Admins can view all jobs"
ON public.site_generation_jobs FOR SELECT
USING (public.is_admin());

-- Policy: Admins can manage all jobs
CREATE POLICY "Admins can manage all jobs"
ON public.site_generation_jobs FOR ALL
USING (public.is_admin());

-- =====================================================
-- 4. TRIGGER FOR UPDATED_AT
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_site_generation_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger to call the function
CREATE TRIGGER update_site_generation_jobs_updated_at
    BEFORE UPDATE ON public.site_generation_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_site_generation_jobs_updated_at();

COMMENT ON FUNCTION public.update_site_generation_jobs_updated_at() IS 'Automatically updates the updated_at timestamp for site generation jobs';

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to get job statistics
CREATE OR REPLACE FUNCTION public.get_job_statistics(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_jobs BIGINT,
    pending_jobs BIGINT,
    processing_jobs BIGINT,
    completed_jobs BIGINT,
    failed_jobs BIGINT,
    total_cost_cents BIGINT,
    avg_completion_time_seconds NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_jobs,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_jobs,
        COUNT(*) FILTER (WHERE status = 'processing')::BIGINT as processing_jobs,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_jobs,
        COALESCE(SUM(cost_cents), 0)::BIGINT as total_cost_cents,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) FILTER (WHERE completed_at IS NOT NULL)::NUMERIC as avg_completion_time_seconds
    FROM public.site_generation_jobs
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND (p_user_id IS NULL OR auth.uid() = p_user_id OR public.is_admin());
END;
$$;

COMMENT ON FUNCTION public.get_job_statistics(UUID) IS 'Returns statistics about site generation jobs, optionally filtered by user';

-- =====================================================
-- 6. CLEANUP FUNCTION FOR OLD JOBS
-- =====================================================

-- Function to clean up old completed/failed jobs (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_generation_jobs(days_to_keep INTEGER DEFAULT 90)
RETURNS TABLE (
    deleted_count BIGINT,
    oldest_deletion_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count BIGINT;
    v_oldest_date TIMESTAMPTZ;
BEGIN
    -- Only admins can run cleanup
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can cleanup old jobs';
    END IF;

    -- Get oldest date before deletion
    SELECT MIN(created_at) INTO v_oldest_date
    FROM public.site_generation_jobs
    WHERE status IN ('completed', 'failed')
    AND created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

    -- Delete old completed/failed jobs
    WITH deleted AS (
        DELETE FROM public.site_generation_jobs
        WHERE status IN ('completed', 'failed')
        AND created_at < NOW() - (days_to_keep || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO v_deleted_count FROM deleted;

    RETURN QUERY SELECT v_deleted_count, v_oldest_date;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_generation_jobs(INTEGER) IS 'Removes completed/failed jobs older than specified days (default 90). Admin only.';