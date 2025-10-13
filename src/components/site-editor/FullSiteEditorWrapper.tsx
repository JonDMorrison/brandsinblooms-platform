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
import { PageContent } from '@/src/lib/content/schema'
import { EditModeProvider } from '@/src/contexts/EditModeContext'
import { VisualEditorProvider } from '@/src/contexts/VisualEditorContext'

interface FullSiteEditorWrapperProps {
  children: ReactNode
  isEditMode: boolean
  permissions?: EditPermissions
  pageContent?: PageContent | null
  pageId?: string | null
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
  onSave
}: FullSiteEditorWrapperProps) {
  // If not in edit mode, just render children
  if (!isEditMode) {
    return <>{children}</>
  }

  // In edit mode - wrap with all necessary contexts
  return (
    <EditModeProvider defaultMode='inline'>
      <VisualEditorProvider>
        <FullSiteEditorProvider
          isEditMode={isEditMode}
          initialPermissions={permissions}
          initialPageContent={pageContent ?? null}
          initialPageId={pageId ?? null}
          onSave={onSave}
        >
          {children}
        </FullSiteEditorProvider>
      </VisualEditorProvider>
    </EditModeProvider>
  )
}
