'use client'

/**
 * Page Settings Modal for Full Site Editor
 * Tabbed interface with Page settings and Sections management
 */

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/src/components/ui/tabs'
import { PageTab } from '@/src/components/content-editor/PageTab'
import { SectionsManagerAdapter } from './SectionsManagerAdapter'
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Page Settings</DialogTitle>
          <DialogDescription>
            Configure page details, publication settings, and manage sections. Changes are applied to preview but not saved until you click "Save Page" in the top bar.
          </DialogDescription>
        </DialogHeader>

        {/* Warning Note */}
        <div className="p-2.5 sm:p-3 bg-amber-50 rounded-md border border-amber-200 flex-shrink-0">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> Changes are applied to the preview but not saved.
            Click "Save Page" in the top bar to persist your changes.
          </p>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="page" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="page">Page</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
          </TabsList>

          {/* Page Tab */}
          <TabsContent value="page" className="flex-1 overflow-y-auto mt-4">
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
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="flex-1 overflow-y-auto mt-4">
            <SectionsManagerAdapter />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
