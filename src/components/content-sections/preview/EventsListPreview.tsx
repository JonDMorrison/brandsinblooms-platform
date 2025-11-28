import React from 'react'
import { ContentSection } from '@/src/lib/content/schema'
import { CalendarDays, MapPin, Clock } from 'lucide-react'

interface EventsListPreviewProps {
    section: ContentSection
}

export function EventsListPreview({ section }: EventsListPreviewProps) {
    const { title, subtitle, limit = 3, layout = 'list' } = section.data
    const bgColor = section.settings?.backgroundColor || 'default'

    // Mock events for preview
    const mockEvents = Array.from({ length: Number(limit) || 3 }).map((_, i) => ({
        id: i,
        title: `Upcoming Event ${i + 1}`,
        date: new Date(Date.now() + i * 86400000 * 3), // Every 3 days
        location: 'Event Location',
        description: 'This is a preview of the event description. It gives a brief overview of what to expect.'
    }))

    return (
        <div className={`py-12 ${bgColor === 'alternate' ? 'bg-muted/30' : ''}`}>
            <div className="container mx-auto px-4">
                {(title || subtitle) && (
                    <div className="text-center mb-10 max-w-2xl mx-auto">
                        {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
                        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
                    </div>
                )}

                <div className={layout === 'grid' ? 'grid md:grid-cols-3 gap-6' : 'space-y-6 max-w-4xl mx-auto'}>
                    {mockEvents.map((event) => (
                        <div
                            key={event.id}
                            className={`block bg-card border rounded-lg overflow-hidden ${layout === 'list' ? 'p-6' : 'flex flex-col h-full'
                                }`}
                        >
                            <div className={layout === 'list' ? 'flex flex-col md:flex-row gap-6' : 'p-6 flex-grow'}>
                                {/* Date Box */}
                                <div className={`flex-shrink-0 text-center bg-muted/50 rounded-md border flex flex-col justify-center items-center ${layout === 'list' ? 'w-full md:w-24 p-4' : 'w-16 h-16 mb-4'
                                    }`}>
                                    <span className="text-xs uppercase font-bold text-muted-foreground">
                                        {event.date.toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                    <span className="text-xl font-bold">
                                        {event.date.getDate()}
                                    </span>
                                </div>

                                <div className="flex-grow">
                                    <h3 className="text-xl font-bold mb-2">
                                        {event.title}
                                    </h3>

                                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {event.date.toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            <span>{event.location}</span>
                                        </div>
                                    </div>

                                    {layout === 'list' && (
                                        <p className="text-muted-foreground line-clamp-2 text-sm">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
