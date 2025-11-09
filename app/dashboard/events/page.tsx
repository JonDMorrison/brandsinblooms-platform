'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Plus, Calendar, Clock, MapPin } from 'lucide-react'
import { DataTable } from '@/src/components/ui/data-table'
import { createEventColumns, type EventItem } from '@/src/components/events/event-columns'
import { useEvents, useEventStats } from '@/src/hooks/useEvents'
import { useSiteId, useSiteContext } from '@/src/contexts/SiteContext'
import { DashboardStats, type DashboardStat } from '@/src/components/DashboardStats'
import { CreateEventModal } from '@/src/components/events/CreateEventModal'
import { Skeleton } from '@/src/components/ui/skeleton'
import type { PaginationState } from '@tanstack/react-table'

export default function EventsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
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

      {/* Events Library */}
      <Card className="fade-in-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Events Library</CardTitle>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
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
