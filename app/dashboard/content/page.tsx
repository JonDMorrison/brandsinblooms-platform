'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { contentColumns, type ContentItem } from '@/components/content/content-columns'
import { 
  FileText, 
  Plus, 
  Eye, 
  Activity,
  Sparkles
} from 'lucide-react'

// Import DataTable directly to preserve generic types
import { DataTable } from '@/components/ui/data-table'

const mockContentItems: ContentItem[] = [
  {
    id: '1',
    title: 'Welcome to Brands & Blooms',
    type: 'page',
    status: 'published',
    lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    views: 847,
    author: 'You'
  },
  {
    id: '2',
    title: 'Our Beautiful Flower Collection',
    type: 'page',
    status: 'published',
    lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    views: 523,
    author: 'You'
  },
  {
    id: '3',
    title: 'Spring Wedding Trends 2024',
    type: 'blog',
    status: 'published',
    lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    views: 1249,
    author: 'You'
  },
  {
    id: '4',
    title: 'About Our Florist Team',
    type: 'page',
    status: 'draft',
    lastModified: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    views: 0,
    author: 'You'
  },
  {
    id: '5',
    title: 'Care Tips for Your Bouquet',
    type: 'blog',
    status: 'published',
    lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    views: 892,
    author: 'You'
  },
  {
    id: '6',
    title: 'Contact Us',
    type: 'page',
    status: 'archived',
    lastModified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    views: 156,
    author: 'You'
  }
]


export default function ContentPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')

  const filteredContent = mockContentItems.filter(item => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'pages' && item.type === 'page') ||
                      (activeTab === 'blog' && item.type === 'blog')
    return matchesTab
  })

  const getTabStats = () => {
    const all = mockContentItems.length
    const pages = mockContentItems.filter(item => item.type === 'page').length
    const blog = mockContentItems.filter(item => item.type === 'blog').length
    return { all, pages, blog }
  }

  const stats = getTabStats()

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pages}</div>
            <p className="text-xs text-muted-foreground">Published and drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blog}</div>
            <p className="text-xs text-muted-foreground">Articles and guides</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockContentItems.reduce((total, item) => total + item.views, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockContentItems.filter(item => item.status === 'published').length}
            </div>
            <p className="text-xs text-muted-foreground">Live content</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Library with Enhanced Data Table */}
      <Card>
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
              <DataTable
                columns={contentColumns} 
                data={filteredContent} 
                searchKey="title"
                searchPlaceholder="Search content..."
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}