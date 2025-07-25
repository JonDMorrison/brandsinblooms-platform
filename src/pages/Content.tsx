import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  FileText, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  User,
  Activity,
  Sparkles
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ContentItem {
  id: string
  title: string
  type: 'page' | 'blog'
  status: 'published' | 'draft' | 'archived'
  lastModified: Date
  views: number
  author: string
}

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

const getStatusColor = (status: ContentItem['status']) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const getTypeIcon = (type: ContentItem['type']) => {
  return type === 'blog' ? (
    <FileText className="h-4 w-4 text-blue-600" />
  ) : (
    <FileText className="h-4 w-4 text-purple-600" />
  )
}

export default function Content() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const filteredContent = mockContentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'pages' && item.type === 'page') ||
                      (activeTab === 'blog' && item.type === 'blog')
    return matchesSearch && matchesTab
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
            onClick={() => navigate('/dashboard/ai-content')}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            AI Content Generator
          </Button>
          <Button onClick={() => navigate('/dashboard/content/new')}>
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

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Content Library</CardTitle>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({stats.all})</TabsTrigger>
              <TabsTrigger value="pages">Pages ({stats.pages})</TabsTrigger>
              <TabsTrigger value="blog">Blog ({stats.blog})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type)}
                            {item.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {item.author}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            {item.views.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDistanceToNow(item.lastModified, { addSuffix: true })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/dashboard/content/edit/${item.id}`)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}