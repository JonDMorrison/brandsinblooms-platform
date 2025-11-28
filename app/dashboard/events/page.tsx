'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Plus, Calendar, Clock, MapPin } from 'lucide-react'
import { DataTable } from '@/src/components/ui/data-table'
import { createEventColumns, type EventItem } from '@/src/components/events/event-columns'
import { EventsCalendarView } from '@/src/components/events/EventsCalendarView'
import { Badge } from '@/src/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { useEvents, useEventStats } from '@/src/hooks/useEvents'
import { useSiteId, useSiteContext } from '@/src/contexts/SiteContext'
import { DashboardStats, type DashboardStat } from '@/src/components/DashboardStats'
import { CreateEventModal } from '@/src/components/events/CreateEventModal'
import { Skeleton } from '@/src/components/ui/skeleton'
import type { PaginationState } from '@tanstack/react-table'

export default function EventsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const siteId = useSiteId()
  const { loading: siteLoading, currentSite } = useSiteContext()

  // Determine filter based on active tab
  const eventFilter = useMemo(() => {
    const filter: Record<string, unknown> = { page, limit: pageSize }
    if (activeTab === 'upcoming') filter.upcoming = true
    if (activeTab === 'past') filter.upcoming = false
    return filter
  }, [activeTab, page, pageSize])

  // Fetch events and stats
  const { data: eventResponse, loading: isLoading, error, refresh } = useEvents(eventFilter)
  const { data: eventStats, loading: statsLoading, refresh: refetchStats } = useEventStats()

  // Extract events and pagination
  const events = Array.isArray(eventResponse) ? eventResponse : eventResponse?.data || []
  const paginationMeta = !Array.isArray(eventResponse) && eventResponse ? {
    count: eventResponse.count,
    page: eventResponse.page,
    pageSize: eventResponse.pageSize,
    totalPages: eventResponse.totalPages,
  } : null

  // Transform to EventItem
  const eventItems: EventItem[] = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      event_date: new Date(event.start_datetime),
      location: event.location || undefined,
      status: event.status as 'draft' | 'published' | 'unpublished',
      is_all_day: event.is_all_day || false,
    }))
  }, [events])

  // Dashboard stats
  const dashboardStats: DashboardStat[] = useMemo(() => [
    {
      id: '1',
      title: 'Total Events',
      count: eventStats?.total || 0,
      trend: 'All events',
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-blue-600',
      showTrendIcon: false
    },
    {
      id: '2',
      title: 'Upcoming',
      count: eventStats?.upcoming || 0,
      trend: 'Future events',
      icon: <Clock className="h-6 w-6" />,
      color: 'text-green-600',
      showTrendIcon: false
    },
    {
      id: '3',
      title: 'Past Events',
      count: eventStats?.past || 0,
      trend: 'Completed',
      icon: <MapPin className="h-6 w-6" />,
      color: 'text-gray-600',
      showTrendIcon: false
    },
    {
      id: '4',
      title: 'Published',
      count: eventStats?.published || 0,
      trend: 'Live events',
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-purple-600',
      showTrendIcon: false
    }
  ], [eventStats])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPage(1)
  }

  // Handle pagination changes - TanStack Table passes an updater function
  const handlePaginationChange = (updaterOrValue: PaginationState | ((old: PaginationState) => PaginationState)) => {
    // Handle both direct value and updater function patterns
    const newPagination = typeof updaterOrValue === 'function'
      ? updaterOrValue({ pageIndex: page - 1, pageSize })
      : updaterOrValue

    setPage(newPagination.pageIndex + 1) // Convert 0-based to 1-based
    setPageSize(newPagination.pageSize)
  }



  // Calendar View Content
  const renderCalendarView = () => {
    if (isLoading || siteLoading || !siteId) {
      return (
        <div className="w-full space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      )
    }

    // Transform events for calendar
    const calendarEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      subtitle: event.subtitle,
      slug: event.slug,
      start_datetime: event.start_datetime,
      is_all_day: event.is_all_day,
      location: event.location,
      featured_image: event.featured_image ? {
        media_url: event.featured_image.media_url
      } : null,
      occurrences: event.occurrences?.map(occ => ({
        id: occ.id,
        start_datetime: occ.start_datetime,
        end_datetime: occ.end_datetime,
        location: occ.location
      }))
    }))

    return (
      <Card className="fade-in-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Events Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
              <Button
                variant={view === 'list' ? 'white' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
                className={view === 'list' ? 'shadow-sm' : ''}
              >
                <span className="sr-only">List View</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-list"
                >
                  <line x1="8" x2="21" y1="6" y2="6" />
                  <line x1="8" x2="21" y1="12" y2="12" />
                  <line x1="8" x2="21" y1="18" y2="18" />
                  <line x1="3" x2="3.01" y1="6" y2="6" />
                  <line x1="3" x2="3.01" y1="12" y2="12" />
                  <line x1="3" x2="3.01" y1="18" y2="18" />
                </svg>
              </Button>
              <Button
                variant={view === 'calendar' ? 'white' : 'ghost'}
                size="sm"
                onClick={() => setView('calendar')}
                className={view === 'calendar' ? 'shadow-sm' : ''}
              >
                <span className="sr-only">Calendar View</span>
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EventsCalendarView
            events={calendarEvents}
            renderEventCard={(event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/edit/${event.id}`}
                className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4 p-4">
                  {/* Featured Image */}
                  {event.featured_image?.media_url && (
                    <div className="w-24 h-24 flex-shrink-0 relative rounded overflow-hidden">
                      <Image
                        src={event.featured_image.media_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className="font-bold text-lg mb-1 hover:text-blue-600 transition-colors">
                      {event.title}
                    </h3>

                    {/* Subtitle */}
                    {event.subtitle && (
                      <p className="text-sm text-gray-600 mb-2">
                        {event.subtitle}
                      </p>
                    )}

                    {/* Time */}
                    {!event.is_all_day && event.occurrences?.[0]?.start_datetime && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Clock className="h-4 w-4" />
                        <span>
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
                        <span>
                          {event.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between fade-in-up" style={{ animationDelay: '0s' }}>
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-gray-500 mt-2">
            Create and manage your events calendar
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="btn-gradient-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Quick Stats */}
      <DashboardStats
        stats={dashboardStats}
        isLoading={statsLoading || siteLoading || !siteId}
        className="fade-in-up"
        animationDelay={0.2}
      />

      {/* Events Library or Calendar */}
      {view === 'list' ? (
        <Card className="fade-in-up" style={{ animationDelay: '0.7s' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Events Library</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
                <Button
                  variant={view === 'list' ? 'white' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                  className={view === 'list' ? 'shadow-sm' : ''}
                >
                  <span className="sr-only">List View</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-list"
                  >
                    <line x1="8" x2="21" y1="6" y2="6" />
                    <line x1="8" x2="21" y1="12" y2="12" />
                    <line x1="8" x2="21" y1="18" y2="18" />
                    <line x1="3" x2="3.01" y1="6" y2="6" />
                    <line x1="3" x2="3.01" y1="12" y2="12" />
                    <line x1="3" x2="3.01" y1="18" y2="18" />
                  </svg>
                </Button>
                <Button
                  variant={view === 'calendar' ? 'white' : 'ghost'}
                  size="sm"
                  onClick={() => setView('calendar')}
                  className={view === 'calendar' ? 'shadow-sm' : ''}
                >
                  <span className="sr-only">Calendar View</span>
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="all">
                  All Events ({eventStats?.total || 0})
                </TabsTrigger>
                <TabsTrigger value="upcoming">
                  Upcoming ({eventStats?.upcoming || 0})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past ({eventStats?.past || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {(() => {
                  const shouldShowLoading = isLoading || siteLoading || !siteId || !currentSite

                  if (shouldShowLoading) {
                    return (
                      <div className="w-full space-y-3">
                        <Skeleton className="h-10 w-full" />
                        {[1, 2, 3, 4, 5].map(i => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    )
                  }

                  if (error) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-red-500">Error loading events: {error.message}</p>
                        <Button variant="outline" onClick={() => refresh()} className="mt-4">
                          Try Again
                        </Button>
                      </div>
                    )
                  }

                  return (
                    <DataTable
                      columns={createEventColumns(refresh, refetchStats)}
                      data={eventItems}
                      searchKey="title"
                      searchPlaceholder="Search events..."
                      manualPagination={true}
                      pageCount={paginationMeta?.totalPages || 0}
                      pageIndex={page - 1}
                      pageSize={pageSize}
                      totalCount={paginationMeta?.count || 0}
                      onPaginationChange={handlePaginationChange}
                      pageSizeOptions={[10, 25, 50, 100]}
                    />
                  )
                })()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        renderCalendarView()
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onEventCreated={() => {
          refresh()
          refetchStats()
        }}
      />
    </div>
  )
}
