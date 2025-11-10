import Image from 'next/image'
import { SiteRenderer } from '@/src/components/site/SiteRenderer'
import { getSiteHeaders } from '../utils/routing'
import { getEvents, getEventOccurrences } from '@/src/lib/queries/domains/events'
import { createClient } from '@/src/lib/supabase/server'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { format } from 'date-fns'
import { EventsViewToggle } from '@/src/components/events/EventsViewToggle'
import { EventCardLink } from '@/src/components/events/EventCardLink'

export async function EventsListPage() {
  const { siteId } = await getSiteHeaders()
  const supabase = await createClient()

  // Fetch published upcoming events
  const upcomingEventsResponse = await getEvents(supabase, siteId, {
    status: 'published',
    upcoming: true,
    limit: 50
  })

  // Extract the actual events array from the paginated response
  const upcomingEvents = upcomingEventsResponse.data

  // Fetch occurrences for all events in parallel to determine which have multiple dates
  const eventsWithOccurrenceCounts = await Promise.all(
    upcomingEvents.map(async (event) => {
      const occurrences = await getEventOccurrences(supabase, event.id)
      const now = new Date()
      const futureOccurrences = occurrences.filter(
        (occurrence) => new Date(occurrence.start_datetime) > now
      )
      return {
        event,
        hasMultipleDates: futureOccurrences.length > 1
      }
    })
  )

  // Prepare list view content
  const listViewContent = eventsWithOccurrenceCounts.length === 0 ? (
    <div className="text-center py-12">
      <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
      <p
        className="text-lg text-gray-500"
        style={{ fontFamily: 'var(--theme-font-body)' }}
      >
        No upcoming events. Check back soon!
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {eventsWithOccurrenceCounts.map(({ event, hasMultipleDates }) => {
        // Get featured image URL from the featured_image relation
        const featuredImage = event.featured_image?.media_url

        return (
          <EventCardLink
            key={event.id}
            slug={event.slug}
            className="group block h-full"
          >
            <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow relative flex flex-col h-full">
              {/* Multiple Dates Ribbon */}
              {hasMultipleDates && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge
                    className="bg-primary text-primary-foreground shadow-md"
                    style={{
                      backgroundColor: 'var(--theme-primary)',
                      color: 'white'
                    }}
                  >
                    Multiple Dates
                  </Badge>
                </div>
              )}

              {/* Featured Image */}
              <div className="aspect-[16/9] relative overflow-hidden bg-gray-100">
                {featuredImage ? (
                  <Image
                    src={featuredImage}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-gray-300" />
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col">
                {/* Title */}
                <h2
                  className="text-xl font-bold mb-2 group-hover:text-green-600 transition-colors"
                  style={{ fontFamily: 'var(--theme-font-heading)' }}
                >
                  {event.title}
                </h2>

                {/* Subtitle */}
                {event.subtitle && (
                  <p
                    className="text-gray-600 mb-4"
                    style={{ fontFamily: 'var(--theme-font-body)' }}
                  >
                    {event.subtitle}
                  </p>
                )}

                {/* Bottom metadata - pushed to bottom with mt-auto */}
                <div className="mt-auto space-y-2">
                  {/* Date */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'var(--theme-font-body)' }}
                    >
                      {format(new Date(event.start_datetime), 'PPP')}
                    </span>
                    {event.is_all_day && (
                      <Badge variant="outline" className="ml-2">All Day</Badge>
                    )}
                  </div>

                  {/* Time */}
                  {!event.is_all_day && event.occurrences?.[0]?.start_datetime && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--theme-font-body)' }}>
                        {format(new Date(event.occurrences[0].start_datetime), 'p')}
                        {event.occurrences[0].end_datetime && ` - ${format(new Date(event.occurrences[0].end_datetime), 'p')}`}
                      </span>
                    </div>
                  )}

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--theme-font-body)' }}>
                        {event.location}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          </EventCardLink>
        )
      })}
    </div>
  )

  return (
    <SiteRenderer
      siteId={siteId}
      mode="live"
      showNavigation={true}
    >
      <div className="brand-container py-12">
        <div className="max-w-6xl mx-auto">
          {/* Events View Toggle with List and Calendar */}
          <EventsViewToggle
            events={upcomingEvents}
            siteId={siteId}
            listViewContent={listViewContent}
          />
        </div>
      </div>
    </SiteRenderer>
  )
}
