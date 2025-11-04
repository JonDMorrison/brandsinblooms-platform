'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { createContentColumns, type ContentItem } from '@/src/components/content/content-columns'
import {
  FileText,
  Plus,
  Activity,
  Files,
  Edit,
  Eye,
  X,
} from 'lucide-react'
import { useContent, useContentStats } from '@/src/hooks/useContent'
import type { ContentType } from '@/src/lib/queries/domains/content'
import { Skeleton } from '@/src/components/ui/skeleton'
import { DataTable } from '@/src/components/ui/data-table'
import { useSiteId, useSiteContext } from '@/src/contexts/SiteContext'
import { DashboardStats, type DashboardStat } from '@/src/components/DashboardStats'
import { CreateContentModal } from '@/src/components/content/CreateContentModal'
import { debug } from '@/src/lib/utils/debug'
import type { PaginationState } from '@tanstack/react-table'
import { useContentChangeListener } from '@/src/lib/events/content-events'
import { supabase } from '@/src/lib/supabase/client'
import { useDesignSettings } from '@/src/hooks/useDesignSettings'

// Dynamic import for DesignPreview component
const DesignPreview = dynamic(
  () => import('@/src/components/design/DesignPreview').then(mod => mod.DesignPreview),
  {
    loading: () => <Skeleton className="h-[600px] w-full" />,
    ssr: false
  }
)



export default function ContentPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [homepageId, setHomepageId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const siteId = useSiteId()
  const { loading: siteLoading, currentSite } = useSiteContext()
  const { data: designSettings } = useDesignSettings()

  debug.content('Content page render:', {
    siteId,
    siteLoading,
    currentSite: !!currentSite,
    siteName: currentSite?.name
  })

  // Fetch real content data with pagination and type filters
  // Pages tab should include all page layout types: landing, about, contact, other
  const contentTypeFilter: ContentType | ContentType[] | undefined = activeTab === 'pages'
    ? ['landing', 'about', 'contact', 'other']
    : activeTab === 'blog'
    ? 'blog_post'
    : undefined
  const { data: contentResponse, loading: isLoading, error, refresh: refetch } = useContent({
    page,
    limit: pageSize,
    type: contentTypeFilter,
  })
  const { data: contentStats, loading: statsLoading, refresh: refetchStats } = useContentStats()

  // Fetch homepage ID for Site Editor button
  useEffect(() => {
    async function fetchHomepageId() {
      if (!siteId) return

      const { data, error } = await supabase
        .from('content')
        .select('id')
        .eq('site_id', siteId)
        .eq('slug', 'home')
        .eq('content_type', 'landing')
        .single()

      if (!error && data) {
        setHomepageId(data.id)
      }
    }

    fetchHomepageId()
  }, [siteId])

  // Listen for content changes and automatically refetch data
  useContentChangeListener(() => {
    debug.content('Content change event received, refreshing data')
    refetch()
    refetchStats()
  }, siteId || '')

  debug.content('Hook states:', {
    siteId,
    siteName: currentSite?.name,
    isLoading,
    statsLoading,
    siteLoading,
    hasContentResponse: !!contentResponse,
    hasContentStats: !!contentStats,
    contentError: !!error
  })

  // Extract content array and pagination metadata from response
  const content = Array.isArray(contentResponse) ? contentResponse : contentResponse?.data || []
  const paginationMeta = !Array.isArray(contentResponse) && contentResponse ? {
    count: contentResponse.count,
    page: contentResponse.page,
    pageSize: contentResponse.pageSize,
    totalPages: contentResponse.totalPages,
  } : null
  
  // Transform content data to match ContentItem interface
  const contentItems: ContentItem[] = useMemo(() => {
    if (!content || !Array.isArray(content)) return []
    
    return content.map(item => {
      // Extract layout from meta_data if available
      const metaData = item.meta_data as Record<string, unknown> | null
      const layout = metaData?.layout as ContentItem['layout'] | undefined
      
      return {
        id: item.id,
        title: item.title,
        type: item.content_type === 'blog_post' ? 'blog' : 'page',
        layout: layout,
        status: item.is_published ? 'published' : 'draft',
        lastModified: new Date(item.updated_at)
      }
    })
  }, [content])

  // Handle pagination changes - TanStack Table passes an updater function
  const handlePaginationChange = (updaterOrValue: PaginationState | ((old: PaginationState) => PaginationState)) => {
    // Handle both direct value and updater function patterns
    const newPagination = typeof updaterOrValue === 'function'
      ? updaterOrValue({ pageIndex: page - 1, pageSize })
      : updaterOrValue

    debug.content('Pagination change:', {
      isFunction: typeof updaterOrValue === 'function',
      newPageIndex: newPagination.pageIndex,
      newPageSize: newPagination.pageSize,
      convertedPage: newPagination.pageIndex + 1
    })

    setPage(newPagination.pageIndex + 1) // Convert 0-based to 1-based
    setPageSize(newPagination.pageSize)
  }

  // Handle tab changes - reset to page 1 when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPage(1)
  }

  // Use stats from the hook and paginationMeta, with proper fallbacks
  const stats = useMemo(() => {
    // Use server-side stats when available, otherwise fall back to pagination count or current page data
    const all = contentStats?.pages !== undefined && contentStats?.blogPosts !== undefined
      ? contentStats.pages + contentStats.blogPosts
      : paginationMeta?.count ?? contentItems.length

    const pages = contentStats?.pages ?? contentItems.filter(item => item.type === 'page').length
    const blog = contentStats?.blogPosts ?? contentItems.filter(item => item.type === 'blog').length

    debug.content('Stats calculated:', {
      all,
      pages,
      blog,
      hasContentStats: !!contentStats,
      hasPaginationMeta: !!paginationMeta,
      paginationCount: paginationMeta?.count
    })

    return { all, pages, blog }
  }, [contentStats, contentItems, paginationMeta])

  // Dashboard stats for the DashboardStats component
  const dashboardStats: DashboardStat[] = useMemo(() => [
    {
      id: '1',
      title: 'Pages',
      count: contentStats?.pages || stats.pages,
      trend: 'Website pages only',
      icon: <FileText className="h-6 w-6" />,
      color: 'text-blue-600',
      showTrendIcon: false
    },
    {
      id: '2',
      title: 'Blog Posts',
      count: contentStats?.blogPosts || stats.blog,
      trend: 'Articles and guides',
      icon: <FileText className="h-6 w-6" />,
      color: 'text-green-600',
      showTrendIcon: false
    },
    {
      id: '3',
      title: 'Total Pages',
      count: (contentStats?.pages || stats.pages) + (contentStats?.blogPosts || stats.blog),
      trend: 'All content combined',
      icon: <Files className="h-6 w-6" />,
      color: 'text-orange-600',
      showTrendIcon: false
    },
    {
      id: '4',
      title: 'Published',
      count: contentStats?.published || contentItems.filter(item => item.status === 'published').length,
      trend: 'Live content',
      icon: <Activity className="h-6 w-6" />,
      color: 'text-purple-600',
      showTrendIcon: false
    }
  ], [contentStats, stats, contentItems])

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between fade-in-up" style={{ animationDelay: '0s' }}>
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-gray-500 mt-2">
            Create, edit, and manage your website pages and blog posts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (homepageId) {
                router.push(`/dashboard/content/editor?id=${homepageId}`)
              }
            }}
            disabled={!homepageId}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Homepage
          </Button>
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(152 45% 40%) 0%, hsl(145 35% 60%) 100%)'
            }}
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Exit Preview' : 'Live Preview'}
          </Button>
          <Button
            className="btn-gradient-primary"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Page
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <DashboardStats 
        stats={dashboardStats}
        isLoading={statsLoading || siteLoading || !siteId}
        className="fade-in-up"
        animationDelay={0.2}
      />

      {/* Content Library with Enhanced Data Table */}
      <Card className="fade-in-up" style={{ animationDelay: '0.7s' }}>
        <CardHeader>
          <CardTitle>Content Library</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">All ({stats.all})</TabsTrigger>
              <TabsTrigger value="pages">Pages ({stats.pages})</TabsTrigger>
              <TabsTrigger value="blog">Blog ({stats.blog})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {(() => {
                const shouldShowLoading = isLoading || siteLoading || !siteId || !currentSite;
                debug.content('Loading decision:', {
                  shouldShowLoading,
                  isLoading,
                  siteLoading,
                  hasSiteId: !!siteId,
                  hasCurrentSite: !!currentSite,
                  hasContentResponse: !!contentResponse,
                  hasContent: !!content && content.length > 0,
                  reason: isLoading ? 'content-loading' :
                         siteLoading ? 'site-loading' :
                         !siteId ? 'no-site-id' :
                         !currentSite ? 'no-current-site' : 'none'
                });

                if (shouldShowLoading) {
                  return (
                    <div className="w-full space-y-3">
                      <Skeleton className="h-10 w-full" />
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  );
                }

                if (error) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-red-500">Error loading content: {error.message}</p>
                      <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                        Try Again
                      </Button>
                    </div>
                  );
                }

                return (
                  <DataTable
                    columns={createContentColumns(refetch, refetchStats)}
                    data={contentItems}
                    searchKey="title"
                    searchPlaceholder="Search content..."
                    manualPagination={true}
                    pageCount={paginationMeta?.totalPages || 0}
                    pageIndex={page - 1}
                    pageSize={pageSize}
                    totalCount={paginationMeta?.count || 0}
                    onPaginationChange={handlePaginationChange}
                    pageSizeOptions={[10, 25, 50, 100]}
                  />
                );
              })()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Content Modal */}
      <CreateContentModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onContentCreated={() => {
          refetch()
          refetchStats()
        }}
      />

      {/* Live Preview Modal */}
      {previewMode && designSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
            <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col my-2 sm:my-4">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
                <h2 className="text-base sm:text-lg font-semibold">Site Preview</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewMode(false)}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden relative bg-white flex items-center justify-center">
                <Suspense fallback={
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Eye className="h-8 w-8 animate-pulse text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Loading preview...</p>
                    </div>
                  </div>
                }>
                  <DesignPreview settings={designSettings} className="h-full w-full border-0 shadow-none" />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}