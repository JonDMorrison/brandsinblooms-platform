'use client'

/**
 * Client-side wrapper for Full Site Editor
 * Handles content loading and saving for customer site pages
 */

import React, { ReactNode, useState, useEffect } from 'react'
import { FullSiteEditorWrapper } from './FullSiteEditorWrapper'
import { EditPermissions } from '@/src/contexts/FullSiteEditorContext'
import { PageContent } from '@/src/lib/content/schema'
import { createClient } from '@/src/lib/supabase/client'
import { getContentBySlug, updateContent } from '@/src/lib/queries/domains/content'
import { deserializePageContent, serializePageContent } from '@/src/lib/content/serialization'
import { toast } from 'sonner'

interface ClientSiteEditorWrapperProps {
  children: ReactNode
  isEditMode: boolean
  permissions?: EditPermissions
  slug: string
  siteId: string
}

/**
 * Client-side wrapper that loads and saves page content
 * Only active when in edit mode
 */
export function ClientSiteEditorWrapper({
  children,
  isEditMode,
  permissions,
  slug,
  siteId
}: ClientSiteEditorWrapperProps) {
  const [pageContent, setPageContent] = useState<PageContent | null>(null)
  const [pageId, setPageId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load page content when in edit mode
  useEffect(() => {
    if (!isEditMode || !siteId) {
      return
    }

    const loadContent = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()

        // Normalize slug - treat empty string and 'home' as the same
        const normalizedSlug = slug === '' ? 'home' : slug

        const contentResult = await getContentBySlug(supabase, siteId, normalizedSlug)

        if (contentResult && contentResult.content) {
          const deserializedContent = deserializePageContent(contentResult.content)
          setPageContent(deserializedContent)
          setPageId(contentResult.id)
        } else {
          // No content found - this is okay, we'll create it on first save
          setPageContent(null)
          setPageId(null)
        }
      } catch (error) {
        console.error('Error loading page content:', error)
        // Don't show error toast - content might not exist yet
        setPageContent(null)
        setPageId(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [isEditMode, slug, siteId])

  // Handle save
  const handleSave = async (content: PageContent) => {
    if (!siteId || !pageId) {
      toast.error('Cannot save: missing page information')
      return
    }

    try {
      const supabase = createClient()

      // Serialize the content
      const serializedContent = serializePageContent(content)

      // Update the content in the database
      await updateContent(supabase, siteId, pageId, {
        content: serializedContent
      })

      // Success!
      toast.success('Changes saved successfully!')
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Failed to save changes')
      throw error // Re-throw so the context knows save failed
    }
  }

  // If not in edit mode, just render children
  if (!isEditMode) {
    return <>{children}</>
  }

  // In edit mode but still loading content
  if (isLoading) {
    return (
      <div className="pt-14">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-sm text-gray-600">Loading editor...</p>
          </div>
        </div>
      </div>
    )
  }

  // Wrap with FullSiteEditorWrapper
  return (
    <FullSiteEditorWrapper
      isEditMode={isEditMode}
      permissions={permissions}
      pageContent={pageContent}
      pageId={pageId}
      onSave={handleSave}
    >
      {children}
    </FullSiteEditorWrapper>
  )
}
