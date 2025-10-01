/**
 * Site Generation Jobs Library
 * Manages job lifecycle for LLM-powered site generation
 */

import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/types/error-handling';
import type {
  SiteGenerationJob,
  JobStatus,
  CreateJobParams,
  UpdateJobStatusParams,
  UpdateJobResultParams,
  UpdateJobErrorParams,
  GetUserJobsOptions,
  JobStatistics,
} from '@/lib/types/site-generation-jobs';

/**
 * Creates a new site generation job
 *
 * @param params - Job creation parameters
 * @returns The created job or null on error
 *
 * @example
 * ```ts
 * const job = await createJob({
 *   userId: 'user-id',
 *   businessInfo: {
 *     prompt: 'Create a website for my bakery...',
 *     name: 'Sweet Treats Bakery',
 *     industry: 'food-service'
 *   }
 * });
 * ```
 */
export async function createJob(
  params: CreateJobParams
): Promise<SiteGenerationJob | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('site_generation_jobs')
      .insert({
        user_id: params.userId,
        business_info: params.businessInfo,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', handleError(error));
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createJob:', handleError(error));
    return null;
  }
}

/**
 * Retrieves a site generation job by ID
 *
 * @param jobId - The job ID to retrieve
 * @param userId - Optional user ID for permission check (if not admin)
 * @returns The job or null if not found/unauthorized
 *
 * @example
 * ```ts
 * const job = await getJob('job-id', 'user-id');
 * if (job) {
 *   console.log('Job status:', job.status);
 * }
 * ```
 */
export async function getJob(
  jobId: string,
  userId?: string
): Promise<SiteGenerationJob | null> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('site_generation_jobs')
      .select('*')
      .eq('id', jobId);

    // If userId provided, filter by it (RLS will handle admin access)
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - not found or unauthorized
        return null;
      }
      console.error('Error getting job:', handleError(error));
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getJob:', handleError(error));
    return null;
  }
}

/**
 * Updates the status and progress of a job
 *
 * @param params - Status update parameters
 * @returns True if successful, false otherwise
 *
 * @example
 * ```ts
 * await updateJobStatus({
 *   jobId: 'job-id',
 *   status: 'processing',
 *   progress: 50
 * });
 * ```
 */
export async function updateJobStatus(
  params: UpdateJobStatusParams
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      status: params.status,
    };

    if (params.progress !== undefined) {
      updateData.progress = params.progress;
    }

    // Set completed_at when status is completed or failed
    if (params.status === 'completed' || params.status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('site_generation_jobs')
      .update(updateData)
      .eq('id', params.jobId);

    if (error) {
      console.error('Error updating job status:', handleError(error));
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateJobStatus:', handleError(error));
    return false;
  }
}

/**
 * Updates a job with successful generation results
 *
 * @param params - Job result parameters
 * @returns True if successful, false otherwise
 *
 * @example
 * ```ts
 * await updateJobResult({
 *   jobId: 'job-id',
 *   siteId: 'new-site-id',
 *   generatedData: { site_name: '...', hero: {...}, ... },
 *   costCents: 150,
 *   tokenUsage: { prompt_tokens: 500, completion_tokens: 1500, total_tokens: 2000 }
 * });
 * ```
 */
export async function updateJobResult(
  params: UpdateJobResultParams
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('site_generation_jobs')
      .update({
        status: 'completed',
        progress: 100,
        site_id: params.siteId,
        generated_data: params.generatedData,
        cost_cents: params.costCents || 0,
        token_usage: params.tokenUsage || {},
        completed_at: new Date().toISOString(),
      })
      .eq('id', params.jobId);

    if (error) {
      console.error('Error updating job result:', handleError(error));
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateJobResult:', handleError(error));
    return false;
  }
}

/**
 * Updates a job with error information
 *
 * @param params - Job error parameters
 * @returns True if successful, false otherwise
 *
 * @example
 * ```ts
 * await updateJobError({
 *   jobId: 'job-id',
 *   errorMessage: 'LLM API timeout',
 *   errorCode: 'LLM_TIMEOUT',
 *   costCents: 50
 * });
 * ```
 */
export async function updateJobError(
  params: UpdateJobErrorParams
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('site_generation_jobs')
      .update({
        status: 'failed',
        error_message: params.errorMessage,
        error_code: params.errorCode || 'UNKNOWN_ERROR',
        cost_cents: params.costCents || 0,
        token_usage: params.tokenUsage || {},
        completed_at: new Date().toISOString(),
      })
      .eq('id', params.jobId);

    if (error) {
      console.error('Error updating job error:', handleError(error));
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateJobError:', handleError(error));
    return false;
  }
}

/**
 * Retrieves jobs for a specific user
 *
 * @param options - Query options
 * @returns Array of jobs or empty array on error
 *
 * @example
 * ```ts
 * const jobs = await getUserJobs({
 *   userId: 'user-id',
 *   limit: 10,
 *   status: 'completed'
 * });
 * ```
 */
export async function getUserJobs(
  options: GetUserJobsOptions
): Promise<SiteGenerationJob[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('site_generation_jobs')
      .select('*')
      .eq('user_id', options.userId)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (options.status) {
      query = query.eq('status', options.status);
    }

    // Apply date filter if provided
    if (options.recentDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.recentDays);
      query = query.gte('created_at', cutoffDate.toISOString());
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting user jobs:', handleError(error));
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserJobs:', handleError(error));
    return [];
  }
}

/**
 * Retrieves the most recent job for a user
 *
 * @param userId - User ID
 * @returns The most recent job or null
 *
 * @example
 * ```ts
 * const latestJob = await getLatestJob('user-id');
 * if (latestJob?.status === 'processing') {
 *   console.log('Job in progress:', latestJob.progress);
 * }
 * ```
 */
export async function getLatestJob(
  userId: string
): Promise<SiteGenerationJob | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('site_generation_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error getting latest job:', handleError(error));
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getLatestJob:', handleError(error));
    return null;
  }
}

/**
 * Retrieves jobs by status
 *
 * @param status - Job status to filter by
 * @param limit - Maximum number of jobs to return
 * @returns Array of jobs or empty array on error
 *
 * @example
 * ```ts
 * // Get all pending jobs
 * const pendingJobs = await getJobsByStatus('pending', 50);
 * ```
 */
export async function getJobsByStatus(
  status: JobStatus,
  limit?: number
): Promise<SiteGenerationJob[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('site_generation_jobs')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting jobs by status:', handleError(error));
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getJobsByStatus:', handleError(error));
    return [];
  }
}

/**
 * Gets statistics about jobs, optionally filtered by user
 *
 * @param userId - Optional user ID to filter statistics
 * @returns Job statistics or null on error
 *
 * @example
 * ```ts
 * const stats = await getJobStatistics('user-id');
 * console.log(`Total jobs: ${stats.total_jobs}`);
 * console.log(`Success rate: ${(stats.completed_jobs / stats.total_jobs * 100).toFixed(1)}%`);
 * ```
 */
export async function getJobStatistics(
  userId?: string
): Promise<JobStatistics | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_job_statistics', {
      p_user_id: userId || null,
    });

    if (error) {
      console.error('Error getting job statistics:', handleError(error));
      return null;
    }

    if (!data || data.length === 0) {
      return {
        total_jobs: 0,
        pending_jobs: 0,
        processing_jobs: 0,
        completed_jobs: 0,
        failed_jobs: 0,
        total_cost_cents: 0,
        avg_completion_time_seconds: null,
      };
    }

    return data[0];
  } catch (error) {
    console.error('Error in getJobStatistics:', handleError(error));
    return null;
  }
}

/**
 * Checks if a user has any active (pending or processing) jobs
 *
 * @param userId - User ID to check
 * @returns True if user has active jobs, false otherwise
 *
 * @example
 * ```ts
 * if (await hasActiveJob('user-id')) {
 *   console.log('User already has a job in progress');
 * }
 * ```
 */
export async function hasActiveJob(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('site_generation_jobs')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['pending', 'processing'])
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - no active jobs
        return false;
      }
      console.error('Error checking active jobs:', handleError(error));
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasActiveJob:', handleError(error));
    return false;
  }
}