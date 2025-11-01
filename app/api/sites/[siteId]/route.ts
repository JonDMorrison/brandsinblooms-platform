/**
 * Site management API routes
 * Handles soft-delete operations for sites
 */

import { NextRequest } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { apiSuccess, apiError } from '@/lib/types/api';
import { deleteSite, getSiteById } from '@/lib/queries/domains/sites';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/types/error-handling';

interface RouteContext {
  params: {
    siteId: string;
  };
}

/**
 * DELETE /api/sites/[siteId]
 * Soft-delete a site (recoverable for 30 days)
 */
export async function DELETE(
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

    // Verify user has permission to delete this site
    const site = await getSiteById(supabase, siteId);

    // Check if user is an owner in site_memberships
    const { data: membership, error: membershipError } = await supabase
      .from('site_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .single();

    if (membershipError || !membership || membership.role !== 'owner') {
      return apiError('You do not have permission to delete this site', 'FORBIDDEN', 403);
    }

    // Soft-delete the site
    await deleteSite(supabase, siteId);

    return apiSuccess({
      message: 'Site deleted successfully',
      siteId,
      recoveryPeriod: '30 days',
    });
  } catch (error) {
    const handled = handleError(error);
    console.error('Site deletion error:', handled);
    return apiError(
      'Failed to delete site',
      'DELETE_ERROR',
      500
    );
  }
}
