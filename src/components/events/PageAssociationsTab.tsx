'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, Search, FileText, Newspaper, Calendar, Globe, Link2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Switch } from '@/src/components/ui/switch'
import { Badge } from '@/src/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Button } from '@/src/components/ui/button'
import {
  getContentWithAssociations,
  toggleEventContentAssociation
} from '@/app/actions/event-content-associations'
import type { Tables } from '@/src/lib/database/types'

type Content = Tables<'content'> & {
  isAssociated: boolean
}

type PageType = 'all' | 'page' | 'blog_post' | 'event' | 'landing' | 'about' | 'contact' | 'other'

interface PageAssociationsTabProps {
  eventId: string
  siteId: string
}

const PAGE_TYPE_ICONS: Record<string, React.ReactNode> = {
  page: <FileText className="h-4 w-4" />,
  blog_post: <Newspaper className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
  landing: <Globe className="h-4 w-4" />,
  about: <FileText className="h-4 w-4" />,
  contact: <FileText className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  page: 'Page',
  blog_post: 'Blog Post',
  event: 'Event Page',
  landing: 'Landing Page',
  about: 'About Page',
  contact: 'Contact Page',
  other: 'Other'
}

export function PageAssociationsTab({ eventId, siteId }: PageAssociationsTabProps) {
  const [content, setContent] = useState<Content[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pageTypeFilter, setPageTypeFilter] = useState<PageType>('all')
  const [showOnlyAssociated, setShowOnlyAssociated] = useState(false)

  // Load content and associations
  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getContentWithAssociations(siteId, eventId)
      setContent(data)
    } catch (error) {
      console.error('Error loading content:', error)
      toast.error('Failed to load pages and associations')
    } finally {
      setIsLoading(false)
    }
  }, [siteId, eventId])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  // Handle toggle association
  const handleToggleAssociation = async (contentItem: Content) => {
    setIsToggling(contentItem.id)

    try {
      const result = await toggleEventContentAssociation(
        eventId,
        contentItem.id,
        siteId,
        contentItem.isAssociated
      )

      if ('error' in result && result.error !== 'Association already exists') {
        toast.error('Failed to update association')
        return
      }

      // Update local state
      setContent(prev => prev.map(item =>
        item.id === contentItem.id
          ? { ...item, isAssociated: !item.isAssociated }
          : item
      ))

      toast.success(
        contentItem.isAssociated
          ? 'Page disassociated from event'
          : 'Page associated with event'
      )
    } catch (error) {
      console.error('Error toggling association:', error)
      toast.error('Failed to update association')
    } finally {
      setIsToggling(null)
    }
  }

  // Filter content based on search and filters
  const filteredContent = useMemo(() => {
    let filtered = content

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.slug.toLowerCase().includes(searchLower)
      )
    }

    // Filter by page type
    if (pageTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.content_type === pageTypeFilter)
    }

    // Filter by association status
    if (showOnlyAssociated) {
      filtered = filtered.filter(item => item.isAssociated)
    }

    return filtered
  }, [content, search, pageTypeFilter, showOnlyAssociated])

  // Count statistics
  const stats = useMemo(() => {
    const total = content.length
    const associated = content.filter(item => item.isAssociated).length
    const byType = content.reduce((acc, item) => {
      const type = item.content_type || 'other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return { total, associated, byType }
  }, [content])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading pages and associations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Available for association
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Associated Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.associated}</div>
            <p className="text-xs text-muted-foreground">
              Linked to this event
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">By Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.byType).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {PAGE_TYPE_LABELS[type] || type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Page Associations</CardTitle>
          <CardDescription>
            Select which pages and blog posts should be associated with this event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pages by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={pageTypeFilter} onValueChange={(value: PageType) => setPageTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="page">Pages</SelectItem>
                <SelectItem value="blog_post">Blog Posts</SelectItem>
                <SelectItem value="event">Event Pages</SelectItem>
                <SelectItem value="landing">Landing Pages</SelectItem>
                <SelectItem value="about">About Pages</SelectItem>
                <SelectItem value="contact">Contact Pages</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="show-associated"
                checked={showOnlyAssociated}
                onCheckedChange={setShowOnlyAssociated}
              />
              <label
                htmlFor="show-associated"
                className="text-sm font-medium cursor-pointer"
              >
                Associated only
              </label>
            </div>
          </div>

          {/* Content Table */}
          <div className="border rounded-lg">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-center">Associated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {search || pageTypeFilter !== 'all' || showOnlyAssociated
                          ? 'No pages match your filters'
                          : 'No pages available'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {item.isAssociated && (
                              <Link2 className="h-4 w-4 text-green-600" />
                            )}
                            <span>{item.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {PAGE_TYPE_ICONS[item.content_type] || PAGE_TYPE_ICONS.other}
                            <span className="text-sm">
                              {PAGE_TYPE_LABELS[item.content_type] || item.content_type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={item.is_published ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.updated_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={item.isAssociated}
                            onCheckedChange={() => handleToggleAssociation(item)}
                            disabled={isToggling === item.id}
                            className="data-[state=checked]:bg-green-600"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Quick Actions */}
          {stats.associated > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{stats.associated} page{stats.associated !== 1 ? 's' : ''} will be linked to this event</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOnlyAssociated(!showOnlyAssociated)}
              >
                {showOnlyAssociated ? 'Show All' : 'View Associated'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}