/**
 * Site restoration API route
 * Restores a soft-deleted site
 */

import { NextRequest } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { apiSuccess, apiError } from '@/lib/types/api';
import { restoreSite, getSiteById } from '@/lib/queries/domains/sites';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/types/error-handling';

interface RouteContext {
  params: {
    siteId: string;
  };
}

/**
 * POST /api/sites/[siteId]/restore
 * Restore a soft-deleted site
 */
export async function POST(
  request: NextRequest,
  { params }: RouteContext
): Promise<Response> {
  try {
    const user = await getUser();
    if (!user) {
      return apiError('Authentication required', 'UNAUTHORIZED', 401);
    }

    const supabase = await createClient();
    const { siteId } = await params;

    // Verify user has permission to restore this site
    const site = await getSiteById(supabase, siteId);

    // Check if user is an owner in site_memberships
    const { data: membership, error: membershipError } = await supabase
      .from('site_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .single();

    if (membershipError || !membership || membership.role !== 'owner') {
      return apiError('You do not have permission to restore this site', 'FORBIDDEN', 403);
    }

    // Check if site is actually deleted
    if (!site.deleted_at) {
      return apiError('Site is not deleted', 'BAD_REQUEST', 400);
    }

    // Restore the site
    const restoredSite = await restoreSite(supabase, siteId);

    return apiSuccess({
      message: 'Site restored successfully',
      site: restoredSite,
    });
  } catch (error) {
    const handled = handleError(error);
    console.error('Site restoration error:', handled);
    return apiError(
      'Failed to restore site',
      'RESTORE_ERROR',
      500
    );
  }
}
