'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import { createOrUpdateEvent } from '@/src/lib/events/queries'
import { z } from 'zod'

const eventSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    location: z.string().optional(),
    all_day: z.boolean().default(false),
    in_calendar: z.boolean().default(true),
    published: z.boolean().default(false),
    start_at: z.string().min(1, 'Start date is required'),
    end_at: z.string().min(1, 'End date is required'),
    // We'll handle multiple instances later if needed, for now simple single instance creation
    // or recurring logic could be added here
})

export async function upsertEvent(siteId: string, eventId: string | undefined, formData: FormData) {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    // Basic validation
    const rawData = {
        title: formData.get('title'),
        slug: formData.get('slug'),
        description: formData.get('description'),
        location: formData.get('location'),
        all_day: formData.get('all_day') === 'on',
        in_calendar: formData.get('in_calendar') === 'on',
        published: formData.get('published') === 'on',
        start_at: formData.get('start_at'),
        end_at: formData.get('end_at'),
    }

    const validated = eventSchema.parse(rawData)

    const eventData = {
        title: validated.title,
        slug: validated.slug,
        description: validated.description,
        location: validated.location,
        all_day: validated.all_day,
        in_calendar: validated.in_calendar,
        published_at: validated.published ? new Date().toISOString() : null,
    }

    const instances = [{
        start_at: new Date(validated.start_at).toISOString(),
        end_at: new Date(validated.end_at).toISOString(),
    }]

    await createOrUpdateEvent(siteId, eventData, instances, eventId)

    revalidatePath(`/dashboard/sites/${siteId}/events`)
    revalidatePath(`/[domain]/events`, 'page') // Revalidate public pages if possible, though domain is dynamic

    redirect(`/dashboard/sites/${siteId}/events`)
}

export async function deleteEvent(siteId: string, eventId: string) {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('site_id', siteId)

    if (error) throw error

    revalidatePath(`/dashboard/sites/${siteId}/events`)
}
