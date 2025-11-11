/**
 * PageSelector component for selecting internal pages
 * Displays a dropdown of all pages in the current site with published status indicators
 */

import React from 'react'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { usePages } from '@/src/hooks/usePages'
import { Loader2 } from 'lucide-react'

interface PageSelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
}

export function PageSelector({
  value,
  onChange,
  label,
  placeholder = 'Select a page',
  className = ''
}: PageSelectorProps) {
  const { data: pages, loading, error } = usePages({ includeUnpublished: true })

  // Group pages by type for better organization
  const groupedPages = React.useMemo(() => {
    if (!pages) return { content: [], static: [], categories: [] }

    const content = pages.filter(p => ['landing', 'about', 'contact', 'other'].includes(p.contentType))
    const staticPages = pages.filter(p => p.contentType === 'static')
    const categories = pages.filter(p => p.contentType === 'category')

    return { content, static: staticPages, categories }
  }, [pages])

  // Format display value - normalize to slug format (no leading slash)
  const displayValue = React.useMemo(() => {
    if (!value || value === '/') return 'home'
    return value.startsWith('/') ? value.substring(1) : value
  }, [value])

  // Get the display label for the selected value
  // IMPORTANT: Must be called before early returns to maintain hook order
  const selectedPageLabel = React.useMemo(() => {
    const selectedPage = pages?.find(p => p.slug === displayValue)
    if (selectedPage) {
      // Special handling for home page display
      if (selectedPage.slug === 'home') {
        return 'Home /'
      }
      // Category pages already have 'category/' in slug
      if (selectedPage.contentType === 'category') {
        return `${selectedPage.title} /${selectedPage.slug}`
      }
      // Regular pages
      return `${selectedPage.title} /${selectedPage.slug}`
    }

    // Fallback
    return displayValue ? `/${displayValue}` : ''
  }, [displayValue, pages])

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && <Label className="text-xs font-medium">{label}</Label>}
        <div className="flex items-center gap-2 h-8 px-3 border border-input rounded-md bg-muted/30">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs text-muted-foreground">Loading pages...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && <Label className="text-xs font-medium">{label}</Label>}
        <div className="h-8 px-3 border border-destructive rounded-md bg-destructive/10 flex items-center">
          <span className="text-xs text-destructive">Error loading pages</span>
        </div>
      </div>
    )
  }

  const handleValueChange = (val: string) => {
    // Convert slug to path format with leading slash
    // Home is stored as 'home' but converts to '/'
    if (val === 'home') {
      onChange('/')
    } else {
      onChange(`/${val}`)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label className="text-xs font-medium">{label}</Label>}
      <Select value={displayValue} onValueChange={handleValueChange}>
        <SelectTrigger className="h-8 w-full overflow-hidden">
          <SelectValue placeholder={placeholder} className="flex-1 min-w-0">
            <span className="truncate block w-60">{selectedPageLabel}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-full">
          {/* Content pages (landing, about, contact, other - includes home) */}
          {groupedPages.content.length > 0 && (
            <>
              {groupedPages.content.map((page) => (
                <SelectItem key={page.id} value={page.slug} className="focus:text-foreground hover:text-foreground">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{page.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {page.slug === 'home' ? '/' : `/${page.slug}`}
                    </span>
                    {!page.isPublished && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded shrink-0">
                        Draft
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {/* Static pages (products, cart) */}
          {groupedPages.static.length > 0 && (
            <>
              {groupedPages.static.map((page) => (
                <SelectItem key={page.id} value={page.slug} className="focus:text-foreground hover:text-foreground">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{page.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">/{page.slug}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {/* Category pages */}
          {groupedPages.categories.length > 0 && (
            <>
              {groupedPages.categories.map((page) => (
                <SelectItem key={page.id} value={page.slug} className="focus:text-foreground hover:text-foreground">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{page.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">/{page.slug}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {/* Empty state */}
          {!pages || pages.length === 0 && (
            <div className="px-2 py-6 text-center text-xs text-muted-foreground">
              No pages found. Create a page first.
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
