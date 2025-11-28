'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Switch } from '@/src/components/ui/switch'
import { upsertEvent, deleteEvent } from '@/src/lib/events/actions'
import { Event, EventInstance } from '@/src/lib/events/types'
import { Loader2, Trash } from 'lucide-react'

interface EventFormProps {
    siteId: string
    event?: Event
    instances?: EventInstance[]
}

export default function EventForm({ siteId, event, instances }: EventFormProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Initial values
    const initialStart = instances?.[0]?.start_at
        ? new Date(instances[0].start_at).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16)

    const initialEnd = instances?.[0]?.end_at
        ? new Date(instances[0].end_at).toISOString().slice(0, 16)
        : new Date(Date.now() + 3600000).toISOString().slice(0, 16)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await upsertEvent(siteId, event?.id, formData)
        } catch (error) {
            console.error(error)
            alert('Failed to save event')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!event?.id || !confirm('Are you sure you want to delete this event?')) return

        setLoading(true)
        try {
            await deleteEvent(siteId, event.id)
            router.push(`/dashboard/sites/${siteId}/events`)
        } catch (error) {
            console.error(error)
            alert('Failed to delete event')
            setLoading(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-8 max-w-2xl">
            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                        id="title"
                        name="title"
                        defaultValue={event?.title}
                        required
                        placeholder="e.g. Annual Garden Party"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                        id="slug"
                        name="slug"
                        defaultValue={event?.slug}
                        required
                        placeholder="annual-garden-party"
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Description (HTML supported)</Label>
                    <Textarea
                        id="description"
                        name="description"
                        defaultValue={event?.description || ''}
                        rows={5}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        name="location"
                        defaultValue={event?.location || ''}
                        placeholder="e.g. Main Hall or 123 Garden St"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="start_at">Start Time</Label>
                        <Input
                            id="start_at"
                            name="start_at"
                            type="datetime-local"
                            defaultValue={initialStart}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="end_at">End Time</Label>
                        <Input
                            id="end_at"
                            name="end_at"
                            type="datetime-local"
                            defaultValue={initialEnd}
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between border p-4 rounded-lg">
                    <div className="space-y-0.5">
                        <Label htmlFor="all_day">All Day Event</Label>
                        <p className="text-sm text-muted-foreground">Event lasts all day</p>
                    </div>
                    <Switch
                        id="all_day"
                        name="all_day"
                        defaultChecked={event?.all_day}
                    />
                </div>

                <div className="flex items-center justify-between border p-4 rounded-lg">
                    <div className="space-y-0.5">
                        <Label htmlFor="in_calendar">Show in Calendar</Label>
                        <p className="text-sm text-muted-foreground">Visible in public calendar</p>
                    </div>
                    <Switch
                        id="in_calendar"
                        name="in_calendar"
                        defaultChecked={event?.in_calendar ?? true}
                    />
                </div>

                <div className="flex items-center justify-between border p-4 rounded-lg">
                    <div className="space-y-0.5">
                        <Label htmlFor="published">Published</Label>
                        <p className="text-sm text-muted-foreground">Visible to the public</p>
                    </div>
                    <Switch
                        id="published"
                        name="published"
                        defaultChecked={!!event?.published_at}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {event ? 'Update Event' : 'Create Event'}
                </Button>

                {event && (
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Event
                    </Button>
                )}
            </div>
        </form>
    )
}
