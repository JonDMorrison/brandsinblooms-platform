/**
 * Dynamic SVG placeholder generation API route
 * Supports cache-friendly immutable placeholders with proper headers
 */

import { NextRequest } from 'next/server';
import { 
  generatePlaceholderSVG, 
  parseUrlParams, 
  getPlaceholderHeaders,
  createCacheKey
} from '@/lib/utils/placeholder-generator';
import { validateDimensions, PLACEHOLDER_CONSTRAINTS } from '@/lib/types/placeholder';
import { handleError } from '@/lib/types/error-handling';

/**
 * Handles GET requests for placeholder generation
 * URL format: /api/placeholder/[width]/[height]/[type]/[config]
 * 
 * @param request - The incoming request
 * @param context - Route context containing params
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  let urlParams: string[] = [];

  try {
    // Parse URL parameters
    const awaitedParams = await params;
    urlParams = awaitedParams.params;
    const placeholderParams = parseUrlParams(urlParams);
    
    // Validate dimensions
    const validation = validateDimensions(
      placeholderParams.width, 
      placeholderParams.height
    );
    
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          error: 'Invalid dimensions',
          message: validation.error,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate cache key for logging/debugging
    const cacheKey = createCacheKey(placeholderParams);
    
    // Generate the SVG
    const svg = generatePlaceholderSVG(placeholderParams);
    
    // Get proper cache headers
    const headers = getPlaceholderHeaders();
    
    // Add additional headers
    headers['X-Cache-Key'] = cacheKey;
    headers['X-Generated-At'] = new Date().toISOString();
    
    return new Response(svg, {
      status: 200,
      headers,
    });
    
  } catch (error: unknown) {
    const errorDetails = handleError(error);

    // Log error for debugging (in production, consider using a proper logging service)
    console.error('Placeholder generation error:', {
      params: urlParams,
      error: errorDetails,
      timestamp: new Date().toISOString(),
    });
    
    // Return appropriate error response
    if (errorDetails.message.includes('Invalid parameters') || 
        errorDetails.message.includes('Invalid type') ||
        errorDetails.message.includes('Width and height must be valid numbers')) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: errorDetails.message,
          details: 'Check the URL format: /api/placeholder/width/height/type[/config]',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to generate placeholder',
        details: errorDetails.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

/**
 * Disable other HTTP methods
 */
export async function POST() {
  return new Response(
    JSON.stringify({
      error: 'Method Not Allowed',
      message: 'Only GET requests are supported',
    }),
    {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Allow': 'GET, OPTIONS',
      },
    }
  );
}

export const PUT = POST;
export const DELETE = POST;
export const PATCH = POST;