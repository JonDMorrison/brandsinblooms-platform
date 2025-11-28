import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getSiteByDomain } from '@/src/lib/queries/domains/sites'
import { getEventSummariesBetween } from '@/src/lib/events/queries'
import { CalendarEventDTO } from '@/src/lib/events/types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ domain: string }> }
) {
    const { domain } = await params
    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const programId = searchParams.get('programId')

    if (!start || !end) {
        return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 })
    }

    const supabase = await createClient()
    const site = await getSiteByDomain(supabase, domain)

    if (!site) {
        return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    try {
        const summaries = await getEventSummariesBetween(
            site.id,
            new Date(start),
            new Date(end),
            {
                programId: programId || undefined,
                inCalendar: true,
                publishedOnly: true
            }
        )

        const events: CalendarEventDTO[] = summaries.map(summary => {
            // Adjust end date for all-day events if needed
            // FullCalendar expects exclusive end date for all-day events
            let endDate = new Date(summary.end_at)
            if (summary.all_day) {
                // Ensure end date is at least 1 day after start
                const startDate = new Date(summary.start_at)
                if (endDate <= startDate) {
                    endDate = new Date(startDate)
                    endDate.setDate(endDate.getDate() + 1)
                }
            }

            const classes = ['event-item']
            if (summary.all_day) classes.push('event-all-day')

            return {
                id: summary.id,
                title: summary.event?.title || 'Untitled Event',
                start: summary.start_at,
                end: endDate.toISOString(),
                url: `/events/${summary.event?.slug || '#'}`,
                allDay: summary.all_day,
                className: classes,
                extendedProps: {
                    location: summary.event?.location || undefined,
                    description: summary.event?.description || undefined
                }
            }
        })

        return NextResponse.json(events)
    } catch (error) {
        console.error('Error fetching calendar events:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
