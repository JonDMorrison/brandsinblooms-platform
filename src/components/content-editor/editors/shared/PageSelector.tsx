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
    if (!pages) return { special: [], other: [] }

    const special = pages.filter(p => ['landing', 'about', 'contact'].includes(p.contentType))
    const other = pages.filter(p => p.contentType === 'other')

    return { special, other }
  }, [pages])

  // Format display value - handle home page specially
  const displayValue = React.useMemo(() => {
    if (!value || value === '/') return '__home__'
    return value.startsWith('/') ? value.substring(1) : value
  }, [value])

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
    // Convert special home identifier back to /
    if (val === '__home__') {
      onChange('/')
    } else {
      onChange(`/${val}`)
    }
  }

  // Get the display label for the selected value
  const selectedPageLabel = React.useMemo(() => {
    if (displayValue === '__home__') return 'Home /'

    const selectedPage = pages?.find(p => p.slug === displayValue)
    if (selectedPage) {
      return `${selectedPage.title} /${selectedPage.slug}`
    }

    return displayValue ? `/${displayValue}` : ''
  }, [displayValue, pages])

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
          {/* Home page option */}
          <SelectItem value="__home__" className="focus:text-foreground hover:text-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">Home</span>
              <span className="text-xs text-muted-foreground shrink-0">/</span>
            </div>
          </SelectItem>

          {/* Special pages (landing, about, contact) */}
          {groupedPages.special.length > 0 && (
            <>
              {groupedPages.special.map((page) => (
                <SelectItem key={page.id} value={page.slug} className="focus:text-foreground hover:text-foreground">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{page.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">/{page.slug}</span>
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

          {/* Other pages */}
          {groupedPages.other.length > 0 && (
            <>
              {groupedPages.other.map((page) => (
                <SelectItem key={page.id} value={page.slug} className="focus:text-foreground hover:text-foreground">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{page.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">/{page.slug}</span>
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
