import Link from 'next/link'
import { CalendarDays, MapPin, Clock } from 'lucide-react'
import { getEventsForSite } from '@/src/lib/events/queries'
import { ContentSection } from '@/src/lib/content/sections'

interface EventsListSectionProps {
    section: ContentSection
    siteId: string
}

export default async function EventsListSection({ section, siteId }: EventsListSectionProps) {
    const { title, subtitle, limit = 3, layout = 'list', programId } = section.data

    const events = await getEventsForSite(siteId, {
        publishedOnly: true,
        limit: Number(limit),
        programId: programId || undefined,
        inEventsFeed: true
    })

    return (
        <div className={`py-12 ${section.settings?.backgroundColor === 'alternate' ? 'bg-muted/30' : ''}`}>
            <div className="container mx-auto px-4">
                {(title || subtitle) && (
                    <div className="text-center mb-10 max-w-2xl mx-auto">
                        {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
                        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
                    </div>
                )}

                {events.length === 0 ? (
                    <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">No upcoming events at this time.</p>
                    </div>
                ) : (
                    <div className={layout === 'grid' ? 'grid md:grid-cols-3 gap-6' : 'space-y-6 max-w-4xl mx-auto'}>
                        {events.map((event) => {
                            const startDate = new Date(event.start_at)
                            const endDate = new Date(event.end_at)

                            return (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.event?.slug || '#'}`}
                                    className={`block group bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${layout === 'list' ? 'p-6' : 'flex flex-col h-full'
                                        }`}
                                >
                                    <div className={layout === 'list' ? 'flex flex-col md:flex-row gap-6' : 'p-6 flex-grow'}>
                                        {/* Date Box */}
                                        <div className={`flex-shrink-0 text-center bg-muted/50 rounded-md border flex flex-col justify-center items-center ${layout === 'list' ? 'w-full md:w-24 p-4' : 'w-16 h-16 mb-4'
                                            }`}>
                                            <span className="text-xs uppercase font-bold text-muted-foreground">
                                                {startDate.toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-xl font-bold">
                                                {startDate.getDate()}
                                            </span>
                                        </div>

                                        <div className="flex-grow">
                                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                                {event.event?.title}
                                            </h3>

                                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        {event.all_day
                                                            ? 'All Day'
                                                            : startDate.toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                            })}
                                                    </span>
                                                </div>
                                                {event.event?.location && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{event.event.location}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {layout === 'list' && event.event?.description && (
                                                <div
                                                    className="text-muted-foreground line-clamp-2 text-sm"
                                                    dangerouslySetInnerHTML={{ __html: event.event.description }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
