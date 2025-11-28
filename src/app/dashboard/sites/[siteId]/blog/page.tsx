'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { getBlogPosts, deleteBlogPost, getBlogPostCount } from '@/src/lib/blog/queries'
import { BlogPost, BlogPostFilters } from '@/src/lib/blog/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Plus, MoreVertical, Edit, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function BlogPage() {
    const params = useParams()
    const router = useRouter()
    const siteId = params.siteId as string

    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
    const [search, setSearch] = useState('')
    const [totalCount, setTotalCount] = useState(0)

    // Load blog posts
    useEffect(() => {
        loadPosts()
    }, [siteId, filter])

    async function loadPosts() {
        try {
            setLoading(true)
            const supabase = createClient()

            const filters: BlogPostFilters = {}
            if (filter !== 'all') {
                filters.status = filter === 'published' ? 'published' : 'draft'
            }
            if (search) {
                filters.search = search
            }

            const [postsData, count] = await Promise.all([
                getBlogPosts(supabase, siteId, filters, { limit: 50 }),
                getBlogPostCount(supabase, siteId, filters)
            ])

            setPosts(postsData)
            setTotalCount(count)
        } catch (error) {
            console.error('Error loading posts:', error)
            toast.error('Failed to load blog posts')
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(postId: string) {
        if (!confirm('Are you sure you want to delete this post?')) {
            return
        }

        try {
            const supabase = createClient()
            await deleteBlogPost(supabase, postId)
            toast.success('Post deleted successfully')
            loadPosts()
        } catch (error) {
            console.error('Error deleting post:', error)
            toast.error('Failed to delete post')
        }
    }

    function handleSearch(value: string) {
        setSearch(value)
        // Debounce search
        const timer = setTimeout(() => {
            loadPosts()
        }, 300)
        return () => clearTimeout(timer)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container max-w-6xl py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your blog content ({totalCount} total)
                    </p>
                </div>
                <Button onClick={() => router.push(`/dashboard/sites/${siteId}/blog/new`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="published">Published</TabsTrigger>
                        <TabsTrigger value="draft">Drafts</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Input
                    placeholder="Search posts..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {/* Posts Table */}
            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Get started by creating your first blog post
                    </p>
                    <Button onClick={() => router.push(`/dashboard/sites/${siteId}/blog/new`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Post
                    </Button>
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Published</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="w-[70px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.map((post) => (
                                <TableRow key={post.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{post.title}</span>
                                            <span className="text-sm text-muted-foreground">
                                                /{post.slug}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                            {post.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {post.published_at
                                            ? format(new Date(post.published_at), 'MMM d, yyyy')
                                            : '—'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(post.updated_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => router.push(`/dashboard/sites/${siteId}/blog/${post.id}`)}
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(post.id)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
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
            )}
        </div>
    )
}
