import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { getSiteByDomain } from '@/src/lib/queries/domains/sites'
import { getEventsForSite } from '@/src/lib/events/queries'
import { CalendarDays, MapPin, Clock } from 'lucide-react'

export const metadata = {
    title: 'Events',
}

export default async function EventsListPage({
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

    const events = await getEventsForSite(site.id, {
        publishedOnly: true,
        inEventsFeed: true,
        limit: 50, // Reasonable limit
    })

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Upcoming Events</h1>
                    <p className="text-muted-foreground">
                        Join us for our upcoming gatherings and activities.
                    </p>
                </div>
                <Link
                    href="/events/calendar"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    <CalendarDays className="w-4 h-4" />
                    View Calendar
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                    <p className="text-lg text-muted-foreground">No upcoming events scheduled.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {events.map((event) => {
                        const startDate = new Date(event.start_at)
                        const endDate = new Date(event.end_at)
                        const isSameDay = startDate.toDateString() === endDate.toDateString()

                        return (
                            <Link
                                key={event.id}
                                href={`/events/${event.event?.slug || '#'}`}
                                className="block group"
                            >
                                <article className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Date Box */}
                                        <div className="flex-shrink-0 w-full md:w-24 text-center bg-muted/50 rounded-md p-4 flex flex-col justify-center items-center border">
                                            <span className="text-xs uppercase font-bold text-muted-foreground">
                                                {startDate.toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-2xl font-bold">
                                                {startDate.getDate()}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-grow">
                                            <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                                                {event.event?.title}
                                            </h2>

                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        {event.all_day
                                                            ? 'All Day'
                                                            : `${startDate.toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                            })} - ${endDate.toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                            })}`}
                                                    </span>
                                                </div>
                                                {event.event?.location && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{event.event.location}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {event.event?.description && (
                                                <div
                                                    className="text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: event.event.description }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
