'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  StarOff,
  MoreHorizontal,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import { Checkbox } from '@/src/components/ui/checkbox'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/src/components/ui/alert-dialog'
import { Separator } from '@/src/components/ui/separator'
import { toast } from 'sonner'
import { 
  getSiteContent,
  updateContent,
  bulkUpdateContent,
  deleteContent,
  getContentTypes,
  getContentAnalytics,
  type ContentWithAuthor,
  type ContentSearchFilters,
  type ContentBulkUpdate,
  type ContentAnalytics,
  AdminContentError
} from '@/src/lib/admin/content'

interface SiteContentManagerProps {
  siteId: string
  siteName: string
}

export function SiteContentManager({ siteId, siteName }: SiteContentManagerProps) {
  const [content, setContent] = useState<ContentWithAuthor[]>([])
  const [selectedContent, setSelectedContent] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ContentSearchFilters>({})
  const [contentTypes, setContentTypes] = useState<string[]>([])
  const [analytics, setAnalytics] = useState<ContentAnalytics | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  // Dialog states
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingContent, setEditingContent] = useState<ContentWithAuthor | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  // Form states
  const [bulkUpdates, setBulkUpdates] = useState<ContentBulkUpdate>({})
  const [editForm, setEditForm] = useState({
    title: '',
    content_type: '',
    is_published: false,
    is_featured: false,
    sort_order: 0
  })
  const [adminNotes, setAdminNotes] = useState('')

  const router = useRouter()

  const limit = 25

  // Load content data
  const loadContent = useCallback(async (page: number = 1, resetData: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      const response = await getSiteContent(siteId, page, limit, {
        search: searchQuery || undefined,
        ...filters
      })

      if (resetData || page === 1) {
        setContent(response.content)
        setSelectedContent([])
      } else {
        setContent(prev => [...prev, ...response.content])
      }

      setTotalCount(response.total_count)
      setHasMore(response.has_more)
      setCurrentPage(page)
    } catch (err) {
      const errorMessage = err instanceof AdminContentError 
        ? err.message 
        : 'Failed to load content'
      setError(errorMessage)
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [siteId, searchQuery, filters, toast])

  // Load content types and analytics
  const loadMetadata = useCallback(async () => {
    try {
      const [typesResponse, analyticsResponse] = await Promise.all([
        getContentTypes(siteId),
        getContentAnalytics(siteId)
      ])
      
      setContentTypes(typesResponse)
      setAnalytics(analyticsResponse)
    } catch (err) {
      console.error('Failed to load metadata:', err)
    }
  }, [siteId])

  // Initial load
  useEffect(() => {
    loadContent(1, true)
    loadMetadata()
  }, [loadContent, loadMetadata])

  // Handle search
  const handleSearch = useCallback(() => {
    setCurrentPage(1)
    loadContent(1, true)
  }, [loadContent])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ContentSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }, [])

  // Apply filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadContent(1, true)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters, loadContent])

  // Handle content selection
  const handleSelectContent = (contentId: string, selected: boolean) => {
    if (selected) {
      setSelectedContent(prev => [...prev, contentId])
    } else {
      setSelectedContent(prev => prev.filter(id => id !== contentId))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedContent(content.map(item => item.id))
    } else {
      setSelectedContent([])
    }
  }

  // Handle individual content actions
  const handleTogglePublished = async (contentItem: ContentWithAuthor) => {
    try {
      await updateContent(
        contentItem.id,
        { is_published: !contentItem.is_published },
        `${contentItem.is_published ? 'Unpublished' : 'Published'} content: ${contentItem.title}`
      )
      
      loadContent(currentPage, false)
      toast.success(`Success: Content ${contentItem.is_published ? 'unpublished' : 'published'} successfully`)
    } catch (err) {
      const errorMessage = err instanceof AdminContentError 
        ? err.message 
        : 'Failed to update content'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  const handleToggleFeatured = async (contentItem: ContentWithAuthor) => {
    try {
      await updateContent(
        contentItem.id,
        { is_featured: !contentItem.is_featured },
        `${contentItem.is_featured ? 'Removed from featured' : 'Added to featured'} content: ${contentItem.title}`
      )
      
      loadContent(currentPage, false)
      toast.success(`Success: Content ${contentItem.is_featured ? 'removed from featured' : 'featured'} successfully`)
    } catch (err) {
      const errorMessage = err instanceof AdminContentError 
        ? err.message 
        : 'Failed to update content'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  // Handle edit content
  const handleEditContent = (contentItem: ContentWithAuthor) => {
    setEditingContent(contentItem)
    setEditForm({
      title: contentItem.title,
      content_type: contentItem.content_type,
      is_published: contentItem.is_published || false,
      is_featured: contentItem.is_featured || false,
      sort_order: contentItem.sort_order || 0
    })
    setAdminNotes('')
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editingContent) return

    try {
      await updateContent(
        editingContent.id,
        editForm,
        adminNotes || `Updated content: ${editForm.title}`
      )
      
      setShowEditDialog(false)
      setEditingContent(null)
      loadContent(currentPage, false)
      toast.success('Success: Content updated successfully')
    } catch (err) {
      const errorMessage = err instanceof AdminContentError 
        ? err.message 
        : 'Failed to update content'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  // Handle bulk operations
  const handleBulkUpdate = async () => {
    if (selectedContent.length === 0) return

    try {
      const result = await bulkUpdateContent(
        selectedContent,
        bulkUpdates,
        adminNotes || `Bulk update of ${selectedContent.length} content items`
      )
      
      setShowBulkUpdateDialog(false)
      setBulkUpdates({})
      setAdminNotes('')
      loadContent(currentPage, false)
      toast.success(`Success: Updated ${result.updated_count} of ${result.total_requested} content items`)
    } catch (err) {
      const errorMessage = err instanceof AdminContentError 
        ? err.message 
        : 'Failed to bulk update content'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedContent.length === 0) return

    try {
      const result = await deleteContent(
        selectedContent,
        adminNotes || `Bulk deletion of ${selectedContent.length} content items`
      )
      
      setShowDeleteDialog(false)
      setAdminNotes('')
      setSelectedContent([])
      loadContent(currentPage, false)
      toast.success(`Success: Deleted ${result.updated_count} of ${result.total_requested} content items`)
    } catch (err) {
      const errorMessage = err instanceof AdminContentError 
        ? err.message 
        : 'Failed to delete content'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadContent(currentPage + 1, false)
    }
  }

  const getStatusBadge = (contentItem: ContentWithAuthor) => {
    if (contentItem.is_featured) {
      return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Featured</Badge>
    }
    if (contentItem.is_published) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Published</Badge>
    }
    return <Badge variant="secondary">Draft</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Content Management</h2>
          <p className="text-muted-foreground">
            Manage content for {siteName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadContent(1, true)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push(`/admin/sites/${siteId}/content/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_content}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.published_content}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.draft_content}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.featured_content}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Content</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search by title or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Content Type</Label>
              <Select
                value={filters.content_type || ''}
                onValueChange={(value) => handleFilterChange({ 
                  content_type: value || undefined 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {contentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange({ 
                  status: (value || undefined) as 'published' | 'draft' | 'featured' | undefined
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({})
                  setSearchQuery('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedContent.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedContent.length} content item{selectedContent.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkUpdateDialog(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Update
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content Items ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => loadContent(1, true)}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No content found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedContent.length === content.length && content.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContent.includes(item.id)}
                          onCheckedChange={(checked) => 
                            handleSelectContent(item.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.slug}
                        </div>
                      </TableCell>
                      <TableCell>{item.content_type}</TableCell>
                      <TableCell>{getStatusBadge(item)}</TableCell>
                      <TableCell className="text-sm">
                        {item.author_name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(item.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditContent(item)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePublished(item)}>
                              {item.is_published ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(item)}>
                              {item.is_featured ? (
                                <>
                                  <StarOff className="h-4 w-4 mr-2" />
                                  Remove Featured
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Add Featured
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedContent([item.id])
                                setShowDeleteDialog(true)
                              }}
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

              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Content Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>
              Update content details and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-type">Content Type</Label>
              <Select
                value={editForm.content_type}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, content_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-published"
                  checked={editForm.is_published}
                  onCheckedChange={(checked) => 
                    setEditForm(prev => ({ ...prev, is_published: checked as boolean }))
                  }
                />
                <Label htmlFor="edit-published">Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-featured"
                  checked={editForm.is_featured}
                  onCheckedChange={(checked) => 
                    setEditForm(prev => ({ ...prev, is_featured: checked as boolean }))
                  }
                />
                <Label htmlFor="edit-featured">Featured</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-sort-order">Sort Order</Label>
              <Input
                id="edit-sort-order"
                type="number"
                value={editForm.sort_order}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  sort_order: parseInt(e.target.value) || 0 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Admin Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Optional notes about this change..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkUpdateDialog} onOpenChange={setShowBulkUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Content</DialogTitle>
            <DialogDescription>
              Update {selectedContent.length} selected content items
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-type">Content Type</Label>
              <Select
                value={bulkUpdates.content_type || ''}
                onValueChange={(value) => setBulkUpdates(prev => ({ 
                  ...prev, 
                  content_type: value || undefined 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  {contentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-published"
                  checked={bulkUpdates.is_published || false}
                  onCheckedChange={(checked) => 
                    setBulkUpdates(prev => ({ ...prev, is_published: checked as boolean }))
                  }
                />
                <Label htmlFor="bulk-published">Set as Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulk-featured"
                  checked={bulkUpdates.is_featured || false}
                  onCheckedChange={(checked) => 
                    setBulkUpdates(prev => ({ ...prev, is_featured: checked as boolean }))
                  }
                />
                <Label htmlFor="bulk-featured">Set as Featured</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="bulk-notes">Admin Notes</Label>
              <Textarea
                id="bulk-notes"
                placeholder="Reason for bulk update..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate}>
              Update {selectedContent.length} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedContent.length} content item{selectedContent.length === 1 ? '' : 's'}?
              This will unpublish the content and mark it as deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <Label htmlFor="delete-notes">Reason for deletion</Label>
            <Textarea
              id="delete-notes"
              placeholder="Optional reason for deletion..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminNotes('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">
              Delete {selectedContent.length} Item{selectedContent.length === 1 ? '' : 's'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}