import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { getSiteByDomain } from '@/src/lib/queries/domains/sites'
import { ChevronLeft } from 'lucide-react'
import EventsCalendar from '@/src/components/events/EventsCalendar'

export const metadata = {
    title: 'Calendar',
}

export default async function EventsCalendarPage({
    params,
}: {
    params: Promise<{ domain: string }>
}) {
    const { domain } = await params
    const supabase = await createClient()
    const site = await getSiteByDomain(supabase, domain)

    if (!site) {
        notFound()
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="mb-8">
                <Link
                    href="/events"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Events List
                </Link>
                <h1 className="text-4xl font-bold">Calendar</h1>
            </div>

            <div className="bg-card border rounded-lg p-6 shadow-sm">
                <EventsCalendar domain={domain} />
            </div>
        </div>
    )
}
