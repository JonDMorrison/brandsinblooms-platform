/**
 * QuickPageSwitcher Component
 * Allows quick navigation between published pages in Full Site Editor
 * Shows confirmation dialog when switching with unsaved changes
 */

import React, { useState, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { usePages } from '@/src/hooks/usePages'
import { FileText, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/src/lib/utils'

interface QuickPageSwitcherProps {
  currentSlug: string
  hasUnsavedChanges: boolean
  onSavePage: () => Promise<void>
  className?: string
}

export function QuickPageSwitcher({
  currentSlug,
  hasUnsavedChanges,
  onSavePage,
  className = ''
}: QuickPageSwitcherProps) {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingPageSlug, setPendingPageSlug] = useState<string | null>(null)
  const [isSwitching, setIsSwitching] = useState(false)

  // Fetch only published pages
  const { data: pages, loading, error } = usePages({ includeUnpublished: false })

  // Special value for home page (Radix UI Select doesn't allow empty string values)
  const HOME_VALUE = '__home__'

  // Convert slug to select value
  const slugToValue = (slug: string) => slug === '' ? HOME_VALUE : slug

  // Convert select value to slug
  const valueToSlug = (value: string) => value === HOME_VALUE ? '' : value

  // Get current page name from slug
  const currentPageName = useMemo(() => {
    if (currentSlug === '' || currentSlug === '/') return 'Home'

    const currentPage = pages?.find(p => p.slug === currentSlug)
    if (currentPage) return currentPage.title

    return currentSlug
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/^\w/, c => c.toUpperCase()) || 'Home'
  }, [currentSlug, pages])

  // Navigate to a page
  const navigateToPage = (slug: string) => {
    setIsSwitching(true)
    const url = slug === '' ? '/' : `/${slug}`
    window.location.href = url
  }

  // Handle page selection
  const handlePageSelect = (value: string) => {
    const newSlug = valueToSlug(value)

    // Same page, do nothing
    if (newSlug === currentSlug) return

    if (hasUnsavedChanges) {
      // Show confirmation dialog
      setPendingPageSlug(newSlug)
      setShowUnsavedDialog(true)
    } else {
      // Navigate immediately
      navigateToPage(newSlug)
    }
  }

  // Save and then switch
  const handleSaveAndSwitch = async () => {
    if (pendingPageSlug === null) return

    try {
      await onSavePage()
      setShowUnsavedDialog(false)
      navigateToPage(pendingPageSlug)
    } catch (error) {
      console.error('Failed to save before switching:', error)
      toast.error('Failed to save changes. Please try again.')
    }
  }

  // Discard changes and switch
  const handleDiscardAndSwitch = () => {
    if (pendingPageSlug === null) return
    setShowUnsavedDialog(false)
    navigateToPage(pendingPageSlug)
  }

  // Cancel switching
  const handleCancel = () => {
    setShowUnsavedDialog(false)
    setPendingPageSlug(null)
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 px-2 py-1", className)}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn("flex items-center gap-2 px-2 py-1 text-destructive", className)}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Error loading pages</span>
      </div>
    )
  }

  return (
    <>
      <Select
        value={slugToValue(currentSlug)}
        onValueChange={handlePageSelect}
        disabled={isSwitching}
      >
        <SelectTrigger
          className={cn(
            "border-0 bg-transparent hover:bg-gray-100 h-auto p-0 focus:ring-0 focus:ring-offset-0",
            isSwitching && "opacity-50 cursor-wait",
            className
          )}
        >
          <div className="flex items-center gap-2 px-2 py-1 rounded">
            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm font-medium truncate max-w-[150px]">
              {currentPageName}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
          </div>
        </SelectTrigger>
        <SelectContent align="start" className="min-w-[300px] max-w-[400px]">
          {/* Home page option */}
          <SelectItem value={HOME_VALUE} className="focus:text-foreground hover:text-foreground">
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium">Home</span>
                <span className="text-xs text-muted-foreground shrink-0">/</span>
              </div>
              {currentSlug === '' && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </div>
          </SelectItem>

          {/* All other published pages */}
          {pages && pages.length > 0 && pages.map((page) => (
            <SelectItem
              key={page.id}
              value={page.slug}
              className="focus:text-foreground hover:text-foreground"
            >
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium truncate">{page.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    /{page.slug}
                  </span>
                </div>
                {page.slug === currentSlug && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </div>
            </SelectItem>
          ))}

          {/* Empty state - no published pages */}
          {(!pages || pages.length === 0) && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No published pages found
            </div>
          )}
        </SelectContent>
      </Select>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>You have unsaved changes</DialogTitle>
            <DialogDescription>
              Would you like to save your changes before switching pages?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscardAndSwitch}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              Switch Without Saving
            </Button>
            <Button
              type="button"
              onClick={handleSaveAndSwitch}
              className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90"
            >
              Save & Switch Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
