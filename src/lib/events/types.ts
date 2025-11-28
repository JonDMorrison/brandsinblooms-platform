export interface Event {
    id: string
    site_id: string
    program_id?: string | null
    title: string
    subtitle?: string | null
    slug: string
    description?: string | null
    location?: string | null
    all_day: boolean
    weekly: boolean
    auto_repeat: boolean
    in_calendar: boolean
    in_sidebar: boolean
    in_home_feed: boolean
    in_events_feed: boolean
    registrable: boolean
    available_spots?: number | null
    published_at?: string | null
    created_at: string
    updated_at: string
    // Virtual fields
    instances?: EventInstance[]
}

export interface EventInstance {
    id: string
    event_id: string
    start_at: string
    end_at?: string | null
    created_at: string
    updated_at: string
}

export interface EventSummary {
    id: string
    event_id: string
    site_id: string
    program_id?: string | null
    start_at: string
    end_at?: string | null
    all_day: boolean
    weekly: boolean
    auto_repeat: boolean
    in_calendar: boolean
    in_sidebar: boolean
    in_home_feed: boolean
    in_events_feed: boolean
    published_at?: string | null
    created_at: string
    updated_at: string
    // Joined fields
    title?: string
    slug?: string
    location?: string
}

export interface EventWithInstances extends Event {
    instances: EventInstance[]
}
