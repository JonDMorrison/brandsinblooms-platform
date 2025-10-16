'use client'

/**
 * Wrapper component that enables full site editor on customer pages
 * Conditionally wraps content with FullSiteEditorProvider when edit mode is active
 */

import React, { ReactNode } from 'react'
import {
  FullSiteEditorProvider,
  EditPermissions
} from '@/src/contexts/FullSiteEditorContext'
import { PageContent, LayoutType } from '@/src/lib/content/schema'
import { EditModeProvider } from '@/src/contexts/EditModeContext'
import { VisualEditorProvider } from '@/src/contexts/VisualEditorContext'
import { ViewportManager } from './ViewportManager'
import { getVisualFeedbackStyles } from '@/src/components/content-editor/visual/styles/visual-feedback'

interface FullSiteEditorWrapperProps {
  children: ReactNode
  isEditMode: boolean
  permissions?: EditPermissions
  pageContent?: PageContent | null
  pageId?: string | null
  isPublished?: boolean
  pageTitle?: string
  pageSlug?: string
  layout?: LayoutType
  siteUrl?: string
  siteId?: string
  onSave?: (content: PageContent) => Promise<void>
}

/**
 * Wraps customer site pages with edit mode functionality
 */
export function FullSiteEditorWrapper({
  children,
  isEditMode,
  permissions,
  pageContent,
  pageId,
  isPublished,
  pageTitle,
  pageSlug,
  layout,
  siteUrl,
  siteId,
  onSave
}: FullSiteEditorWrapperProps) {
  // If not in edit mode, just render children without padding
  if (!isEditMode) {
    return <>{children}</>
  }

  // In edit mode - wrap with all necessary contexts and add top padding for fixed bar
  return (
    <EditModeProvider defaultMode='inline'>
      <VisualEditorProvider>
        <FullSiteEditorProvider
          isEditMode={isEditMode}
          initialPermissions={permissions}
          initialPageContent={pageContent ?? null}
          initialPageId={pageId ?? null}
          initialIsPublished={isPublished}
          initialPageTitle={pageTitle}
          initialPageSlug={pageSlug}
          initialLayout={layout}
          initialSiteUrl={siteUrl}
          initialSiteId={siteId}
          onSave={onSave}
        >
          {/* Add padding-top to prevent content from being hidden under fixed bar (h-14 = 56px) */}
          <div className="pt-14 visual-editor-preview">
            <ViewportManager>
              {children}
            </ViewportManager>
            {/* Inject visual feedback styles for editable elements */}
            <style jsx global>{`${getVisualFeedbackStyles()}`}</style>
          </div>
        </FullSiteEditorProvider>
      </VisualEditorProvider>
    </EditModeProvider>
  )
}
