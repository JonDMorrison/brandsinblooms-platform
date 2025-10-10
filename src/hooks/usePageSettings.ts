'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { PageContent, SEOSettings, LayoutType } from '@/src/lib/content'

interface UsePageSettingsOptions {
  initialContent?: PageContent | null
  initialSlug?: string
  initialIsPublished?: boolean
  pageTitle?: string
  onContentChange?: (content: PageContent, hasChanges: boolean) => void
  onSlugChange?: (slug: string) => void
  onPublishedChange?: (published: boolean) => void
}

interface UsePageSettingsReturn {
  slug: string
  isPublished: boolean
  seoSettings: SEOSettings
  handleSlugChange: (slug: string) => void
  handlePublishedChange: (published: boolean) => void
  handleSEOChange: (seoSettings: SEOSettings) => void
  isDirty: boolean
  resetDirty: () => void
}

export function usePageSettings({
  initialContent,
  initialSlug = '',
  initialIsPublished = false,
  pageTitle = '',
  onContentChange,
  onSlugChange,
  onPublishedChange
}: UsePageSettingsOptions): UsePageSettingsReturn {
  const [isDirty, setIsDirty] = useState(false)

  // State for database columns
  const [slug, setSlug] = useState(initialSlug)
  const [isPublished, setIsPublished] = useState(initialIsPublished)

  // Sync internal state with parent state changes
  useEffect(() => {
    setSlug(initialSlug)
  }, [initialSlug])

  useEffect(() => {
    setIsPublished(initialIsPublished)
  }, [initialIsPublished])

  // Memoized SEO settings from content
  const defaultSeoSettings: SEOSettings = useMemo(() => ({
    title: initialContent?.settings?.seo?.title ?? pageTitle,
    description: initialContent?.settings?.seo?.description ?? '',
    keywords: initialContent?.settings?.seo?.keywords ?? []
  }), [initialContent, pageTitle])

  const [seoSettings, setSeoSettings] = useState<SEOSettings>(defaultSeoSettings)

  // Handler for slug changes
  const handleSlugChange = useCallback((newSlug: string) => {
    setSlug(newSlug)
    setIsDirty(true)
    if (onSlugChange) {
      onSlugChange(newSlug)
    }
  }, [onSlugChange])

  // Handler for published changes
  const handlePublishedChange = useCallback((published: boolean) => {
    setIsPublished(published)
    setIsDirty(true)
    if (onPublishedChange) {
      onPublishedChange(published)
    }
  }, [onPublishedChange])

  // Handler for SEO settings changes
  const handleSEOChange = useCallback((newSeoSettings: SEOSettings) => {
    setSeoSettings(newSeoSettings)
    
    // Update content with new SEO settings
    if (initialContent && onContentChange) {
      const updatedContent: PageContent = {
        ...initialContent,
        settings: {
          ...initialContent.settings,
          seo: newSeoSettings
        }
      }
      onContentChange(updatedContent, true)
    }
    
    setIsDirty(true)
  }, [initialContent, onContentChange])

  // Reset dirty state
  const resetDirty = useCallback(() => {
    setIsDirty(false)
  }, [])

  // Auto-populate SEO title from page title if empty
  const finalSeoSettings = useMemo(() => ({
    ...seoSettings,
    title: seoSettings.title || pageTitle
  }), [seoSettings, pageTitle])

  return {
    slug,
    isPublished,
    seoSettings: finalSeoSettings,
    handleSlugChange,
    handlePublishedChange,
    handleSEOChange,
    isDirty,
    resetDirty
  }
}