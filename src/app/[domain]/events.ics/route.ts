import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getSiteByDomain } from '@/src/lib/queries/domains/sites'
import { getEventSummariesBetween } from '@/src/lib/events/queries'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params
    const supabase = await createClient()
    const site = await getSiteByDomain(supabase, domain)

    if (!site) {
        return new NextResponse('Site not found', { status: 404 })
    }

    // Fetch upcoming events for the next 12 months
    const start = new Date()
    const end = new Date()
    end.setMonth(end.getMonth() + 12)

    const summaries = await getEventSummariesBetween(site.id, start, end, {
        inCalendar: true,
        publishedOnly: true
    })

    // Generate ICS content
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Brands in Blooms//Events//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${site.name || domain} Events`,
        `X-WR-TIMEZONE:UTC`,
    ]

    for (const summary of summaries) {
        if (!summary.event) continue

        const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const dtStart = new Date(summary.start_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const dtEnd = new Date(summary.end_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
        const uid = `${summary.id}@${domain}`

        icsContent.push('BEGIN:VEVENT')
        icsContent.push(`UID:${uid}`)
        icsContent.push(`DTSTAMP:${now}`)
        icsContent.push(`DTSTART:${dtStart}`)
        icsContent.push(`DTEND:${dtEnd}`)
        icsContent.push(`SUMMARY:${summary.event.title}`)

        if (summary.event.description) {
            // Basic cleaning of HTML for description (very rough)
            const cleanDesc = summary.event.description
                .replace(/<[^>]*>/g, '')
                .replace(/\n/g, '\\n')
                .substring(0, 75) // Fold lines if needed, but simple for now
            icsContent.push(`DESCRIPTION:${cleanDesc}`)
        }

        if (summary.event.location) {
            icsContent.push(`LOCATION:${summary.event.location}`)
        }

        icsContent.push(`URL:https://${domain}/events/${summary.event.slug}`)
        icsContent.push('END:VEVENT')
    }

    icsContent.push('END:VCALENDAR')

    return new NextResponse(icsContent.join('\r\n'), {
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="events.ics"`,
        },
    })
}
