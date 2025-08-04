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
  Sparkles,
} from 'lucide-react'
import { useContent, useContentStats } from '@/src/hooks/useContent'
import { Skeleton } from '@/src/components/ui/skeleton'
import { DataTable } from '@/src/components/ui/data-table'



export default function ContentPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  
  // Fetch real content data
  const { data: contentResponse, isLoading, error } = useContent()
  const { data: contentStats, isLoading: statsLoading } = useContentStats()
  
  // Extract content array from response
  const content = Array.isArray(contentResponse) ? contentResponse : contentResponse?.data || []
  
  // Transform content data to match ContentItem interface
  const contentItems: ContentItem[] = useMemo(() => {
    if (!content || !Array.isArray(content)) return []
    
    return content.map(item => ({
      id: item.id,
      title: item.title,
      type: item.content_type === 'blog_post' ? 'blog' : 'page',
      status: item.is_published ? 'published' : 'draft',
      lastModified: new Date(item.updated_at),
      views: item.view_count || 0,
      author: item.author?.full_name || 'Unknown'
    }))
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

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between fade-in-up" style={{ animationDelay: '0s' }}>
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and manage your website pages and blog posts
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/ai-content')}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            AI Content Generator
          </Button>
          <Button onClick={() => router.push('/dashboard/content/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {statsLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[80px]" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contentStats?.pages || stats.pages}</div>
                <p className="text-xs text-muted-foreground">Published and drafts</p>
              </CardContent>
            </Card>
            <Card className="fade-in-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contentStats?.blogPosts || stats.blog}</div>
                <p className="text-xs text-muted-foreground">Articles and guides</p>
              </CardContent>
            </Card>
            <Card className="fade-in-up" style={{ animationDelay: '0.4s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(contentItems.reduce((total, item) => total + item.views, 0)).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card className="fade-in-up" style={{ animationDelay: '0.5s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {contentStats?.published || contentItems.filter(item => item.status === 'published').length}
                </div>
                <p className="text-xs text-muted-foreground">Live content</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

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
              {isLoading ? (
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