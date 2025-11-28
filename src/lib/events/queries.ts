import { createClient } from '@/src/lib/supabase/server'
import { Event, EventInstance, EventSummary, EventWithInstances } from './types'

export async function getEventsForSite(siteId: string, options: {
    publishedOnly?: boolean
    inCalendar?: boolean
    inSidebar?: boolean
    inHomeFeed?: boolean
    inEventsFeed?: boolean
    programId?: string
    limit?: number
    order?: 'asc' | 'desc'
} = {}) {
    const supabase = await createClient()

    let query = supabase
        .from('event_summaries')
        .select(`
            *,
            event:events (
                title,
                slug,
                location,
                description
            )
        `)
        .eq('site_id', siteId)

    if (options.publishedOnly !== false) { // Default true
        query = query.not('published_at', 'is', null)
    }

    if (options.inCalendar) query = query.eq('in_calendar', true)
    if (options.inSidebar) query = query.eq('in_sidebar', true)
    if (options.inHomeFeed) query = query.eq('in_home_feed', true)
    if (options.inEventsFeed) query = query.eq('in_events_feed', true)
    if (options.programId) query = query.eq('program_id', options.programId)

    // Default to upcoming events if no order specified, or respect order
    const now = new Date().toISOString()
    if (options.order === 'desc') {
        query = query.order('start_at', { ascending: false })
    } else {
        // Default asc (upcoming)
        query = query.gte('end_at', now).order('start_at', { ascending: true })
    }

    if (options.limit) query = query.limit(options.limit)

    const { data, error } = await query

    if (error) {
        console.error('Error fetching events:', error)
        throw new Error('Failed to fetch events')
    }

    return data as EventSummary[]
}

export async function getEventBySlug(siteId: string, slug: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            instances:event_instances(*)
        `)
        .eq('site_id', siteId)
        .eq('slug', slug)
        .single()

    if (error) {
        console.error('Error fetching event by slug:', error)
        return null
    }

    return data as EventWithInstances
}

export async function getEventSummariesBetween(
    siteId: string,
    start: Date,
    end: Date,
    options: {
        inCalendar?: boolean
        programId?: string
        publishedOnly?: boolean
    } = {}
) {
    const supabase = await createClient()

    let query = supabase
        .from('event_summaries')
        .select(`
            *,
            event:events (
                title,
                slug,
                location,
                description
            )
        `)
        .eq('site_id', siteId)
        .gte('end_at', start.toISOString()) // Ends after range start
        .lte('start_at', end.toISOString()) // Starts before range end

    if (options.publishedOnly !== false) {
        query = query.not('published_at', 'is', null)
    }

    if (options.inCalendar !== false) { // Default true
        query = query.eq('in_calendar', true)
    }

    if (options.programId) {
        query = query.eq('program_id', options.programId)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching event summaries:', error)
        throw new Error('Failed to fetch event summaries')
    }

    return data as EventSummary[]
}

export async function createOrUpdateEvent(
    siteId: string,
    eventData: Partial<Event>,
    instances: { start_at: string; end_at: string }[],
    eventId?: string
) {
    const supabase = await createClient()

    // 1. Upsert Event
    const { data: event, error: eventError } = await supabase
        .from('events')
        .upsert({
            ...(eventId ? { id: eventId } : {}),
            site_id: siteId,
            ...eventData,
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (eventError) throw eventError
    if (!event) throw new Error('Failed to create/update event')

    // 2. Replace Instances (Simple strategy: delete all for event, insert new)
    // In a real app with registration data attached to instances, we'd need a smarter diff.
    // But for this requirement, full replacement is safer/easier.

    const { error: deleteError } = await supabase
        .from('event_instances')
        .delete()
        .eq('event_id', event.id)

    if (deleteError) throw deleteError

    if (instances.length > 0) {
        const { error: insertError } = await supabase
            .from('event_instances')
            .insert(
                instances.map(inst => ({
                    event_id: event.id,
                    start_at: inst.start_at,
                    end_at: inst.end_at
                }))
            )

        if (insertError) throw insertError
    }

    // 3. Regenerate Summaries
    await regenerateSummariesForEvent(event.id)

    return event
}

export async function regenerateSummariesForEvent(eventId: string) {
    const supabase = await createClient()

    // 1. Fetch event and instances
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

    if (eventError || !event) {
        console.error('Error fetching event for summary regen:', eventError)
        return
    }

    const { data: instances, error: instError } = await supabase
        .from('event_instances')
        .select('*')
        .eq('event_id', eventId)

    if (instError) {
        console.error('Error fetching instances for summary regen:', instError)
        return
    }

    // 2. Delete existing summaries
    await supabase.from('event_summaries').delete().eq('event_id', eventId)

    // 3. Create new summaries
    if (instances && instances.length > 0) {
        const summaries = instances.map(inst => ({
            event_id: event.id,
            site_id: event.site_id,
            program_id: event.program_id,
            start_at: inst.start_at,
            end_at: inst.end_at,

            // Denormalized flags
            all_day: event.all_day,
            weekly: event.weekly,
            auto_repeat: event.auto_repeat,
            in_calendar: event.in_calendar,
            in_sidebar: event.in_sidebar,
            in_home_feed: event.in_home_feed,
            in_events_feed: event.in_events_feed,

            published_at: event.published_at
        }))

        const { error: insertError } = await supabase
            .from('event_summaries')
            .insert(summaries)

        if (insertError) {
            console.error('Error inserting summaries:', insertError)
        }
    }
}
