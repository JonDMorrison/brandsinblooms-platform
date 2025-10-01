-- Fix Site Generation Jobs RLS Policies
--
-- Problem: Users could not update their own job records, causing background
-- job processing to fail silently when trying to update job status.
--
-- Solution: Add policy allowing users to update their own jobs

-- Drop existing conflicting policy if it exists
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.site_generation_jobs;

-- Allow users to update their own jobs
-- This is critical for background processing to work correctly
CREATE POLICY "Users can update their own jobs"
ON public.site_generation_jobs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can update their own jobs" ON public.site_generation_jobs IS
'Allows users to update status, progress, and results of their own generation jobs. Required for background job processing.';
