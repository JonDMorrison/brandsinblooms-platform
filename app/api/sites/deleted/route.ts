/**
 * Deleted sites API route
 * Lists all soft-deleted sites for the current user
 */

import { NextRequest } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { apiSuccess, apiError } from '@/lib/types/api';
import { getDeletedSites } from '@/lib/queries/domains/sites';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/types/error-handling';

/**
 * GET /api/sites/deleted
 * Get all deleted sites for the current user
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getUser();
    if (!user) {
      return apiError('Authentication required', 'UNAUTHORIZED', 401);
    }

    const supabase = await createClient();

    // Get deleted sites for this user
    const deletedSites = await getDeletedSites(supabase, user.id);

    return apiSuccess({
      sites: deletedSites,
      count: deletedSites.length,
    });
  } catch (error) {
    const handled = handleError(error);
    console.error('Get deleted sites error:', handled);
    return apiError(
      'Failed to fetch deleted sites',
      'FETCH_ERROR',
      500
    );
  }
}
