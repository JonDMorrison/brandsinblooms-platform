import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import { getSiteByDomain } from '@/src/lib/queries/domains/sites'
import { getEventBySlug } from '@/src/lib/events/queries'
import { CalendarDays, MapPin, Clock, ChevronLeft } from 'lucide-react'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ domain: string; slug: string }>
}) {
    const { domain, slug } = await params
    const supabase = await createClient()
    const site = await getSiteByDomain(supabase, domain)

    if (!site) return {}

    const event = await getEventBySlug(site.id, slug)

    if (!event) return {}

    return {
        title: event.title,
        description: event.description?.substring(0, 160),
    }
}

export default async function EventDetailPage({
    params,
}: {
    params: Promise<{ domain: string; slug: string }>
}) {
    const { domain, slug } = await params
    const supabase = await createClient()
    const site = await getSiteByDomain(supabase, domain)

    if (!site) {
        notFound()
    }

    const event = await getEventBySlug(site.id, slug)

    if (!event) {
        notFound()
    }

    // Sort instances by start date
    const sortedInstances = [...event.instances].sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    )

    // Filter future instances
    const now = new Date()
    const futureInstances = sortedInstances.filter(
        (inst) => new Date(inst.end_at) > now
    )

    const displayInstance = futureInstances[0] || sortedInstances[sortedInstances.length - 1] || null

    if (!displayInstance) {
        // Should not happen if event exists, but handle gracefully
        return notFound()
    }

    const startDate = new Date(displayInstance.start_at)
    const endDate = new Date(displayInstance.end_at)

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-8">
                <Link
                    href="/events"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Events
                </Link>

                {event.subtitle && (
                    <h2 className="text-xl text-primary font-medium mb-2">{event.subtitle}</h2>
                )}
                <h1 className="text-4xl md:text-5xl font-bold mb-6">{event.title}</h1>

                <div className="flex flex-wrap gap-6 text-muted-foreground border-y py-6">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        <span className="font-medium">
                            {startDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
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

                    {event.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span>{event.location}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-8">
                    {event.description && (
                        <div
                            className="prose prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: event.description }}
                        />
                    )}
                </div>

                <div className="space-y-6">
                    {event.registrable && (
                        <div className="bg-muted/30 border rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Registration</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {event.available_spots
                                    ? `${event.available_spots} spots available`
                                    : 'Registration is open'}
                            </p>
                            <button className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium">
                                Register Now
                            </button>
                        </div>
                    )}

                    {futureInstances.length > 1 && (
                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="font-semibold mb-4">Upcoming Dates</h3>
                            <ul className="space-y-3">
                                {futureInstances.slice(0, 5).map((inst) => (
                                    <li key={inst.id} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                                        <div className="font-medium">
                                            {new Date(inst.start_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {new Date(inst.start_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
