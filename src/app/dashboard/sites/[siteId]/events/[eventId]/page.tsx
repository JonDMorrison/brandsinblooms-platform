import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import EventForm from '@/src/components/events/EventForm'

export default async function EditEventPage({
    params,
}: {
    params: Promise<{ siteId: string; eventId: string }>
}) {
    const { siteId, eventId } = await params
    const supabase = await createClient()

    // Fetch event details
    const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('site_id', siteId)
        .single()

    if (!event) {
        notFound()
    }

    // Fetch instances
    const { data: instances } = await supabase
        .from('event_instances')
        .select('*')
        .eq('event_id', eventId)
        .order('start_at', { ascending: true })

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link
                    href={`/dashboard/sites/${siteId}/events`}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Events
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
                <p className="text-muted-foreground mt-2">
                    Update event details and schedule.
                </p>
            </div>

            <div className="border rounded-lg bg-card p-6">
                <EventForm
                    siteId={siteId}
                    event={event}
                    instances={instances || []}
                />
            </div>
        </div>
    )
}
