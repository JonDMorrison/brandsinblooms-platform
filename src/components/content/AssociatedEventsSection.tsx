import Image from 'next/image'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { format } from 'date-fns'
import { EventCardLink } from '@/src/components/events/EventCardLink'
import { getContentEvents } from '@/app/actions/event-content-associations'
import { getEventOccurrences } from '@/src/lib/queries/domains/events'
import { createClient } from '@/src/lib/supabase/server'

interface AssociatedEventsSectionProps {
  contentId: string
}

/**
 * Displays event cards for events associated with a specific content item.
 * Only renders if there are published upcoming events.
 * Positioned between header and main content on blog posts.
 */
export async function AssociatedEventsSection({ contentId }: AssociatedEventsSectionProps) {
  // Fetch associated events
  const events = await getContentEvents(contentId)

  // Don't render section if no events
  if (!events || events.length === 0) {
    return null
  }

  const supabase = await createClient()

  // Fetch occurrences for all events to determine which have multiple dates
  const eventsWithOccurrenceCounts = await Promise.all(
    events.map(async (event) => {
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

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2
          className="text-2xl font-bold"
          style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }}
        >
          Related Events
        </h2>
        <p
          className="text-gray-600 mt-2"
          style={{ fontFamily: 'var(--theme-font-body)' }}
        >
          Check out these upcoming events related to this post
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  {/* Date Badge */}
                  <div className="flex items-center gap-2 mb-3">
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

                  {/* Time */}
                  {!event.is_all_day && event.occurrences?.[0]?.start_datetime && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
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
              </article>
            </EventCardLink>
          )
        })}
      </div>
    </section>
  )
}
