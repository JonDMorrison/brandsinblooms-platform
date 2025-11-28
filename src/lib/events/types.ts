export interface Event {
    id: string
    site_id: string
    program_id?: string | null
    title: string
    subtitle?: string | null
    slug: string
    description?: string | null
    location?: string | null

    // Flags
    all_day: boolean
    weekly: boolean
    auto_repeat: boolean

    // Visibility
    in_calendar: boolean
    in_sidebar: boolean
    in_home_feed: boolean
    in_events_feed: boolean

    // Registration
    registrable: boolean
    available_spots?: number | null

    // Timestamps
    published_at?: string | null
    created_at: string
    updated_at: string
}

export interface EventInstance {
    id: string
    event_id: string
    start_at: string
    end_at: string
    created_at: string
    updated_at: string
}

export interface EventSummary {
    id: string
    event_id: string
    site_id: string
    program_id?: string | null

    start_at: string
    end_at: string

    // Denormalized flags
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

    // Optional joined data
    event?: Pick<Event, 'title' | 'slug' | 'location' | 'description'>
}

export interface EventWithInstances extends Event {
    instances: EventInstance[]
}

export interface CalendarEventDTO {
    id: string
    title: string
    start: string
    end: string
    url: string
    allDay: boolean
    className: string[]
    extendedProps?: {
        location?: string
        description?: string
    }
}
