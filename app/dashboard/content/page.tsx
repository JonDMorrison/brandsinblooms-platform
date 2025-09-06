'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { contentColumns, type ContentItem } from '@/src/components/content/content-columns'
import { 
  FileText, 
  Plus, 
  Eye, 
  Activity,
  Files,
} from 'lucide-react'
import { useContent, useContentStats } from '@/src/hooks/useContent'
import { Skeleton } from '@/src/components/ui/skeleton'
import { DataTable } from '@/src/components/ui/data-table'
import { useSiteId, useSiteContext } from '@/src/contexts/SiteContext'
import { DashboardStats, type DashboardStat } from '@/src/components/DashboardStats'



export default function ContentPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const siteId = useSiteId()
  const { loading: siteLoading } = useSiteContext()
  
  // Fetch real content data
  const { data: contentResponse, loading: isLoading, error, refresh: refetch } = useContent()
  const { data: contentStats, loading: statsLoading, refresh: refetchStats } = useContentStats()
  
  // Extract content array from response
  const content = Array.isArray(contentResponse) ? contentResponse : contentResponse?.data || []
  
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
        lastModified: new Date(item.updated_at),
        views: item.view_count || 0,
        author: item.author?.full_name || 'Unknown'
      }
    })
  }, [content])

  const filteredContent = contentItems.filter(item => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'pages' && item.type === 'page') ||
                      (activeTab === 'blog' && item.type === 'blog')
    return matchesTab
  })

  const stats = useMemo(() => {
    const all = contentItems.length
    const pages = contentItems.filter(item => item.type === 'page').length
    const blog = contentItems.filter(item => item.type === 'blog').length
    return { all, pages, blog }
  }, [contentItems])

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
        <Button
          className="btn-gradient-primary"
          onClick={() => router.push('/dashboard/content/new')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({stats.all})</TabsTrigger>
              <TabsTrigger value="pages">Pages ({stats.pages})</TabsTrigger>
              <TabsTrigger value="blog">Blog ({stats.blog})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {isLoading || siteLoading || !siteId ? (
                <div className="w-full space-y-3">
                  <Skeleton className="h-10 w-full" />
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">Error loading content: {error.message}</p>
                  <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={contentColumns} 
                  data={filteredContent} 
                  searchKey="title"
                  searchPlaceholder="Search content..."
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}