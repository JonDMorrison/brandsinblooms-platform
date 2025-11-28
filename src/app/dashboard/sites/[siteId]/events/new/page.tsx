import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EventForm from '@/src/components/events/EventForm'

export default async function NewEventPage({
    params,
}: {
    params: Promise<{ siteId: string }>
}) {
    const { siteId } = await params

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
                <h1 className="text-3xl font-bold tracking-tight">Create New Event</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new event to your calendar.
                </p>
            </div>

            <div className="border rounded-lg bg-card p-6">
                <EventForm siteId={siteId} />
            </div>
        </div>
    )
}
