'use client'

/**
 * Page Settings Modal for Full Site Editor
 * Wraps PageTab component from Content Editor in a modal dialog
 */

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import { PageTab } from '@/src/components/content-editor/PageTab'
import { useFullSiteEditor } from '@/src/contexts/FullSiteEditorContext'

interface PageSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PageSettingsModal({
  isOpen,
  onClose
}: PageSettingsModalProps) {
  const {
    pageTitle,
    pageSlug,
    layout,
    siteUrl,
    siteId,
    currentPageId,
    isPublished,
    updatePageTitle,
    updatePageSlug,
    updatePagePublished
  } = useFullSiteEditor()

  const handleSlugChange = (slug: string) => {
    updatePageSlug(slug)
  }

  const handlePublishedChange = (published: boolean) => {
    updatePagePublished(published)
  }

  const handlePageTitleChange = (title: string) => {
    updatePageTitle(title)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Page Settings</DialogTitle>
          <DialogDescription>
            Configure page details and publication settings. Changes are applied to preview but not saved until you click "Save Page" in the top bar.
          </DialogDescription>
        </DialogHeader>

        {/* Warning Note */}
        <div className="p-2.5 sm:p-3 bg-amber-50 rounded-md border border-amber-200">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> Changes are applied to the preview but not saved.
            Click "Save Page" in the top bar to persist your changes.
          </p>
        </div>

        {/* PageTab Component */}
        <div className="py-2">
          <PageTab
            slug={pageSlug}
            isPublished={isPublished}
            onSlugChange={handleSlugChange}
            onPublishedChange={handlePublishedChange}
            pageTitle={pageTitle}
            onPageTitleChange={handlePageTitleChange}
            layout={layout}
            siteUrl={siteUrl}
            siteId={siteId}
            contentId={currentPageId || undefined}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
