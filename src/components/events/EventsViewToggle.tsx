/**
 * Events View Toggle Component
 * Client-side wrapper for switching between List and Calendar views
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { LayoutGrid, Calendar } from 'lucide-react'
import { EventsCalendarView } from './EventsCalendarView'
import { SubscribeToCalendarButton } from './SubscribeToCalendarButton'

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

interface EventsViewToggleProps {
  events: CalendarEvent[]
  siteId: string
  listViewContent: React.ReactNode
}

export function EventsViewToggle({ events, siteId, listViewContent }: EventsViewToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize view from URL search params, default to 'list'
  const [view, setView] = useState<'list' | 'calendar'>(() => {
    const viewParam = searchParams.get('view')
    return viewParam === 'calendar' ? 'calendar' : 'list'
  })

  // Initialize month from URL search params
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const monthParam = searchParams.get('month')
    return monthParam ? new Date(monthParam) : new Date()
  })

  // Update URL when view changes
  const handleViewChange = (newView: 'list' | 'calendar') => {
    setView(newView)
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', newView)
    if (newView === 'calendar') {
      params.set('month', currentMonth.toISOString())
    } else {
      params.delete('month')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Update URL when month changes in calendar view
  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth)
    if (view === 'calendar') {
      const params = new URLSearchParams(searchParams.toString())
      params.set('month', newMonth.toISOString())
      router.push(`?${params.toString()}`, { scroll: false })
    }
  }

  // Sync state with URL on navigation (back/forward)
  useEffect(() => {
    const viewParam = searchParams.get('view')
    const monthParam = searchParams.get('month')

    if (viewParam === 'calendar' || viewParam === 'list') {
      setView(viewParam)
    }

    if (monthParam) {
      setCurrentMonth(new Date(monthParam))
    }
  }, [searchParams])

  return (
    <div className="space-y-6">
      {/* View Toggle and Subscribe Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => handleViewChange('list')}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            List
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            onClick={() => handleViewChange('calendar')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
        </div>

        <SubscribeToCalendarButton siteId={siteId} variant="outline" />
      </div>

      {/* Conditional View Rendering */}
      {view === 'list' ? (
        listViewContent
      ) : (
        <EventsCalendarView
          events={events}
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
        />
      )}
    </div>
  )
}
