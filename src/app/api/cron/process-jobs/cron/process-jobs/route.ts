/**
 * Cron Job: Process Pending Site Generation Jobs
 * 
 * This endpoint is called by Vercel Cron to process pending site generation jobs.
 * It runs every minute to pick up and process any jobs in 'pending' status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import { processGenerationJob } from '@/src/lib/jobs/background-processor';

// Maximum number of jobs to process per cron run
const MAX_JOBS_PER_RUN = 5;

// Maximum age of jobs to process (24 hours)
const MAX_JOB_AGE_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Verify this is a cron request (Vercel sets this header)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // In production, verify the cron secret
        if (process.env.NODE_ENV === 'production') {
            if (!cronSecret) {
                console.error('[Cron] CRON_SECRET not configured');
                return NextResponse.json(
                    { error: 'Cron secret not configured' },
                    { status: 500 }
                );
            }

            if (authHeader !== `Bearer ${cronSecret}`) {
                console.error('[Cron] Unauthorized cron request');
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
        }

        console.log('[Cron] Starting job processing...');

        const supabase = await createClient();

        // Fetch pending jobs (oldest first, limit to MAX_JOBS_PER_RUN)
        const { data: pendingJobs, error: fetchError } = await supabase
            .from('site_generation_jobs')
            .select('id, created_at, user_id, business_info')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(MAX_JOBS_PER_RUN);

        if (fetchError) {
            console.error('[Cron] Error fetching pending jobs:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch jobs', details: fetchError.message },
                { status: 500 }
            );
        }

        if (!pendingJobs || pendingJobs.length === 0) {
            console.log('[Cron] No pending jobs to process');
            return NextResponse.json({
                success: true,
                message: 'No pending jobs',
                processed: 0,
                duration: Date.now() - startTime
            });
        }

        console.log(`[Cron] Found ${pendingJobs.length} pending job(s)`);

        // Filter out jobs that are too old
        const now = Date.now();
        const validJobs = pendingJobs.filter(job => {
            const jobAge = now - new Date(job.created_at).getTime();
            if (jobAge > MAX_JOB_AGE_MS) {
                console.warn(`[Cron] Skipping old job ${job.id} (age: ${Math.round(jobAge / 1000 / 60)} minutes)`);
                return false;
            }
            return true;
        });

        if (validJobs.length === 0) {
            console.log('[Cron] All pending jobs are too old, skipping');
            return NextResponse.json({
                success: true,
                message: 'All jobs too old',
                processed: 0,
                skipped: pendingJobs.length,
                duration: Date.now() - startTime
            });
        }

        // Process each job
        const results = await Promise.allSettled(
            validJobs.map(async (job) => {
                console.log(`[Cron] Processing job ${job.id}...`);
                try {
                    const result = await processGenerationJob(job.id);
                    console.log(`[Cron] Job ${job.id} completed:`, result.success ? 'SUCCESS' : 'FAILED');
                    return result;
                } catch (error) {
                    console.error(`[Cron] Job ${job.id} threw error:`, error);
                    return { success: false, error: String(error) };
                }
            })
        );

        // Count successes and failures
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

        const duration = Date.now() - startTime;
        console.log(`[Cron] Completed: ${successful} successful, ${failed} failed in ${duration}ms`);

        return NextResponse.json({
            success: true,
            processed: validJobs.length,
            successful,
            failed,
            skipped: pendingJobs.length - validJobs.length,
            duration
        });

    } catch (error) {
        console.error('[Cron] Unexpected error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime
            },
            { status: 500 }
        );
    }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
    return GET(request);
}
