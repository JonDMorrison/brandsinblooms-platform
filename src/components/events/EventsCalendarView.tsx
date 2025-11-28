/**
 * Events Calendar View Component
 * Displays events in a monthly calendar grid with date navigation
 */

'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import Image from 'next/image'
import { EventCardLink } from '@/src/components/events/EventCardLink'

interface EventOccurrence {
  id: string
  start_datetime: string
  end_datetime: string | null
  location: string | null
}

interface CalendarEvent {
  id: string
  title: string
  subtitle: string | null
  slug: string
  start_datetime: string
  is_all_day: boolean | null
  location: string | null
  featured_image?: {
    media_url: string
  } | null
  occurrences?: EventOccurrence[]
}

interface EventsCalendarViewProps {
  events: CalendarEvent[]
  currentMonth?: Date
  onMonthChange?: (month: Date) => void
  renderEventCard?: (event: CalendarEvent) => React.ReactNode
}

export function EventsCalendarView({ events, currentMonth: controlledMonth, onMonthChange, renderEventCard }: EventsCalendarViewProps) {
  const [internalMonth, setInternalMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Use controlled month if provided, otherwise use internal state
  const currentMonth = controlledMonth || internalMonth

  // Navigate to previous month
  const previousMonth = () => {
    const newMonth = subMonths(currentMonth, 1)
    if (onMonthChange) {
      onMonthChange(newMonth)
    } else {
      setInternalMonth(newMonth)
    }
  }

  // Navigate to next month
  const nextMonth = () => {
    const newMonth = addMonths(currentMonth, 1)
    if (onMonthChange) {
      onMonthChange(newMonth)
    } else {
      setInternalMonth(newMonth)
    }
  }

  // Get all events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      // Check the main event start date
      const eventDate = new Date(event.start_datetime)
      if (isSameDay(eventDate, date)) {
        return true
      }

      // Check all occurrences
      if (event.occurrences) {
        return event.occurrences.some(occurrence => {
          const occurrenceDate = new Date(occurrence.start_datetime)
          return isSameDay(occurrenceDate, date)
        })
      }

      return false
    })
  }

  // Generate calendar days (including padding from previous/next month)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="space-y-6">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--theme-font-heading)', color: 'var(--theme-text)' }}
        >
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="p-2 text-center text-sm font-semibold text-gray-600 border-b"
              style={{ fontFamily: 'var(--theme-font-body)' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 bg-white">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, new Date())

            return (
              <button
                key={index}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    setSelectedDate(day)
                  }
                }}
                className={`
                  min-h-[100px] p-2 border-b border-r text-left relative
                  transition-colors
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-50'}
                  ${dayEvents.length > 0 ? 'cursor-pointer' : 'cursor-default'}
                  ${isToday ? 'bg-blue-50' : ''}
                `}
                disabled={dayEvents.length === 0}
              >
                {/* Day number */}
                <div
                  className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm
                    ${isToday ? 'bg-blue-600 text-white font-bold' : ''}
                  `}
                  style={!isToday ? { fontFamily: 'var(--theme-font-body)' } : undefined}
                >
                  {format(day, 'd')}
                </div>

                {/* Event indicators */}
                {dayEvents.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs px-1 py-0.5 rounded truncate"
                        style={{
                          backgroundColor: 'var(--theme-primary)',
                          color: 'white',
                          fontFamily: 'var(--theme-font-body)'
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div
                        className="text-xs px-1 text-gray-500"
                        style={{ fontFamily: 'var(--theme-font-body)' }}
                      >
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Events Dialog for Selected Date */}
      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--theme-font-heading)' }}>
              Events on {selectedDate && format(selectedDate, 'PPPP')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedDateEvents.map((event) => {
              if (renderEventCard) {
                return renderEventCard(event)
              }

              const featuredImage = event.featured_image?.media_url

              return (
                <EventCardLink
                  key={event.id}
                  slug={event.slug}
                  className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4 p-4">
                    {/* Featured Image */}
                    {featuredImage && (
                      <div className="w-24 h-24 flex-shrink-0 relative rounded overflow-hidden">
                        <Image
                          src={featuredImage}
                          alt={event.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h3
                        className="font-bold text-lg mb-1 hover:text-green-600 transition-colors"
                        style={{ fontFamily: 'var(--theme-font-heading)' }}
                      >
                        {event.title}
                      </h3>

                      {/* Subtitle */}
                      {event.subtitle && (
                        <p
                          className="text-sm text-gray-600 mb-2"
                          style={{ fontFamily: 'var(--theme-font-body)' }}
                        >
                          {event.subtitle}
                        </p>
                      )}

                      {/* Time */}
                      {!event.is_all_day && event.occurrences?.[0]?.start_datetime && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                          <Clock className="h-4 w-4" />
                          <span style={{ fontFamily: 'var(--theme-font-body)' }}>
                            {format(new Date(event.occurrences[0].start_datetime), 'p')}
                            {event.occurrences[0].end_datetime && ` - ${format(new Date(event.occurrences[0].end_datetime), 'p')}`}
                          </span>
                        </div>
                      )}

                      {event.is_all_day && (
                        <Badge variant="outline" className="mb-1">All Day</Badge>
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
                </EventCardLink>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
