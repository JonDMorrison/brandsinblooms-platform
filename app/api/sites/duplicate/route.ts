import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { duplicateSite, type DuplicateSiteOptions } from '@/src/lib/sites/site-duplicator';
import { apiError, apiSuccess } from '@/lib/types/api';
import { handleError } from '@/lib/types/error-handling';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Parse request body
    const body = await request.json();
    const {
      sourceSiteId,
      newName,
      newSubdomain,
      copyContent = true,
      copyProducts = true,
      copyTheme = true,
      copyNavigation = true
    } = body;

    // Validate required fields
    if (!sourceSiteId || !newName || !newSubdomain) {
      return apiError('Missing required fields: sourceSiteId, newName, newSubdomain', 'VALIDATION_ERROR', 400);
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
    if (!subdomainRegex.test(newSubdomain)) {
      return apiError('Invalid subdomain format. Use only lowercase letters, numbers, and hyphens.', 'VALIDATION_ERROR', 400);
    }

    // Create options object
    const options: DuplicateSiteOptions = {
      sourceSiteId,
      newName,
      newSubdomain,
      copyContent,
      copyProducts,
      copyTheme,
      copyNavigation
    };

    // Perform duplication
    const result = await duplicateSite(options, user.id);

    if (!result.success) {
      return apiError(result.error || 'Failed to duplicate site', 'DUPLICATION_ERROR', 400);
    }

    // Return success response
    return apiSuccess({
      siteId: result.siteId,
      siteName: result.siteName,
      subdomain: result.subdomain,
      copiedItems: result.copiedItems,
      message: `Site duplicated successfully! ${result.copiedItems?.contentPages || 0} pages and ${result.copiedItems?.products || 0} products copied.`
    });

  } catch (error) {
    console.error('Duplicate site API error:', error);
    const { message } = handleError(error);
    return apiError(message, 'INTERNAL_ERROR', 500);
  }
}
