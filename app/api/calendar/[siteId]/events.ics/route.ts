/**
 * iCalendar (.ics) feed endpoint for events
 * Generates RFC 5545 compliant calendar feeds for published events
 *
 * @route GET /api/calendar/[siteId]/events.ics
 * @returns .ics file with all published events and their future occurrences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSiteById } from '@/lib/queries/domains/sites';
import { getPublishedEventsForCalendar } from '@/lib/queries/domains/events';
import { generateICalendar, getICalendarFilename } from '@/lib/calendar/icalendar';
import { handleError } from '@/lib/types/error-handling';

interface RouteContext {
  params: {
    siteId: string;
  };
}

/**
 * GET /api/calendar/[siteId]/events.ics
 * Generate iCalendar feed for a site's published events
 *
 * This endpoint is public and does not require authentication.
 * It only returns published events with future occurrences.
 *
 * @example
 * GET /api/calendar/abc123/events.ics
 * Returns: events.ics file with all published events
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { siteId } = await context.params;

    // Validate siteId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(siteId)) {
      return new NextResponse('Invalid site ID format', { status: 400 });
    }

    // Verify site exists (throws if not found)
    let site;
    try {
      site = await getSiteById(supabase, siteId);
    } catch (error) {
      const handled = handleError(error);
      console.error('Site not found:', handled);
      return new NextResponse('Site not found', { status: 404 });
    }

    // Check if site is deleted
    if (site.deleted_at) {
      return new NextResponse('Site not found', { status: 404 });
    }

    // Fetch published events with future occurrences
    const events = await getPublishedEventsForCalendar(supabase, siteId);

    // Generate calendar name from site
    const calendarName = site.name || 'Events';

    // Use subdomain as domain for UID generation
    // This ensures UIDs are unique across the platform
    const domain = site.subdomain ? `${site.subdomain}.blooms.local` : 'blooms.local';

    // Generate iCalendar content
    const icsContent = generateICalendar(events, calendarName, domain);

    // Generate filename
    const filename = getICalendarFilename(calendarName);

    // Return .ics file with proper headers
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const handled = handleError(error);
    console.error('Calendar generation error:', handled);

    return new NextResponse('Failed to generate calendar feed', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
