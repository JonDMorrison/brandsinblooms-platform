import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { supabase } from '@/src/lib/supabase/client'
import { getContentById, updateContent } from '@/src/lib/queries/domains/content'
import { 
  PageContent, 
  LayoutType as ContentLayoutType, 
  serializePageContent, 
  deserializePageContent,
  SEOSettings 
} from '@/src/lib/content'
import { handleError } from '@/src/lib/types/error-handling'

type LayoutType = 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact' | 'other'

interface PageData {
  title: string
  subtitle?: string
  layout: LayoutType
}

interface UnifiedPageContent extends PageContent {
  title?: string
  subtitle?: string
}

interface UseContentEditorDataProps {
  contentId: string | null
  siteId: string | undefined
  siteLoading: boolean
}

export function useContentEditorData({ 
  contentId, 
  siteId, 
  siteLoading 
}: UseContentEditorDataProps) {
  const router = useRouter()
  
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pageContent, setPageContent] = useState<PageContent | null>(null)
  const [unifiedContent, setUnifiedContent] = useState<UnifiedPageContent | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Database column states
  const [slug, setSlug] = useState<string>('')
  const [isPublished, setIsPublished] = useState<boolean>(false)
  const [seoSettings, setSeoSettings] = useState<SEOSettings>({
    title: '',
    description: '',
    keywords: []
  })

  // Load content from database
  useEffect(() => {
    async function loadContent() {
      if (contentId && siteId) {
        setIsLoading(true)
        
        try {
          const content = await getContentById(supabase, siteId, contentId)
          
          // Extract page data from the content
          const metaData = content.meta_data as Record<string, unknown>
          const contentData = content.content as Record<string, unknown>
          const rawLayout = metaData?.layout || contentData?.layout || 'landing'
          
          // Validate layout is one of the supported types
          const validLayouts: LayoutType[] = ['landing', 'blog', 'portfolio', 'about', 'product', 'contact', 'other']
          const layout = validLayouts.includes(rawLayout as LayoutType) 
            ? rawLayout as LayoutType 
            : 'landing'
          
          const pageData: PageData = {
            title: content.title,
            subtitle: typeof metaData?.subtitle === 'string' ? metaData.subtitle : '',
            layout: layout
          }
          
          setPageData(pageData)
          
          // Extract database column values
          setSlug(content.slug || '')
          setIsPublished(content.is_published || false)
          
          // Extract SEO settings from meta_data
          const extractedSeoSettings: SEOSettings = {
            title: (metaData?.seo as any)?.title || '',
            description: (metaData?.seo as any)?.description || '',
            keywords: (metaData?.seo as any)?.keywords || []
          }
          setSeoSettings(extractedSeoSettings)
          
          // Deserialize the page content if available
          if (content.content) {
            const deserialized = deserializePageContent(content.content)
            
            if (deserialized) {
              // Migrate subtitle from meta_data to hero section if needed
              const heroSection = deserialized.sections.hero || deserialized.sections.header
              if (heroSection && typeof metaData?.subtitle === 'string' && !heroSection.data.subtitle) {
                heroSection.data = {
                  ...heroSection.data,
                  subtitle: metaData.subtitle as string
                }
              }
              
              setPageContent(deserialized)
              setUnifiedContent({
                ...deserialized,
                title: content.title,
                subtitle: ''
              })
            }
          } else {
            // Initialize with default content
            const defaultContent: PageContent = {
              version: '1.0' as const,
              layout: layout as ContentLayoutType,
              sections: {}
            }
            setPageContent(defaultContent)
            setUnifiedContent({
              ...defaultContent,
              title: content.title,
              subtitle: ''
            })
          }
        } catch (error) {
          console.error('Error loading content:', error)
          toast.error('Failed to load content')
          router.push('/dashboard/content')
        } finally {
          setIsLoading(false)
        }
      } else if (contentId && (siteLoading || !siteId)) {
        // Wait for site context to finish loading
        return
      } else if (!contentId) {
        // No content ID - redirect to content creation
        router.push('/dashboard/content/new')
      }
    }
    
    loadContent()
  }, [contentId, siteId, siteLoading, router])

  // Handler for title changes
  const handleTitleChange = useCallback((value: string) => {
    setPageData(prev => {
      if (!prev) return prev
      return { ...prev, title: value }
    })
    
    setUnifiedContent(prev => {
      if (!prev) return prev
      return { ...prev, title: value }
    })
    
    setHasUnsavedChanges(true)
  }, [])

  // Handler for content changes
  const handleContentChange = useCallback((content: PageContent, hasChanges: boolean) => {
    if (Object.keys(content.sections).length === 0 && !hasChanges) {
      return
    }
    
    setPageContent(prev => {
      if (!prev || JSON.stringify(prev.sections) !== JSON.stringify(content.sections)) {
        return content
      }
      return prev
    })
    
    setUnifiedContent(prev => {
      if (!prev && pageData) {
        return { 
          ...content, 
          title: pageData.title || '', 
          subtitle: ''
        }
      }
      if (!prev) return null
      return {
        ...content,
        title: pageData?.title || prev.title,
        subtitle: ''
      }
    })
    
    if (hasChanges) {
      setHasUnsavedChanges(true)
    }
  }, [pageData])

  // Handler for slug changes
  const handleSlugChange = useCallback(async (newSlug: string) => {
    if (!contentId || !siteId) {
      throw new Error('Missing required information to update slug')
    }

    try {
      await updateContent(supabase, siteId, contentId, {
        slug: newSlug
      })
      setSlug(newSlug)
      setHasUnsavedChanges(false)
      toast.success('Page URL updated successfully!')
    } catch (error) {
      handleError(error)
      toast.error('Failed to update page URL')
      throw error
    }
  }, [contentId, siteId])

  // Handler for published status changes
  const handlePublishedChange = useCallback(async (published: boolean) => {
    if (!contentId || !siteId) {
      throw new Error('Missing required information to update published status')
    }

    try {
      await updateContent(supabase, siteId, contentId, {
        is_published: published,
        published_at: published ? new Date().toISOString() : null
      })
      setIsPublished(published)
      setHasUnsavedChanges(false)
      toast.success(`Page ${published ? 'published' : 'unpublished'} successfully!`)
    } catch (error) {
      handleError(error)
      toast.error(`Failed to ${published ? 'publish' : 'unpublish'} page`)
      throw error
    }
  }, [contentId, siteId])

  // Handler for SEO changes
  const handleSEOChange = useCallback(async (newSeoSettings: SEOSettings) => {
    if (!contentId || !siteId) {
      throw new Error('Missing required information to update SEO settings')
    }

    try {
      // Get current meta_data and update SEO section
      const currentMetaData = pageData ? { layout: pageData.layout } : {}
      const updatedMetaData = {
        ...currentMetaData,
        seo: newSeoSettings
      }

      await updateContent(supabase, siteId, contentId, {
        meta_data: updatedMetaData as any
      })
      setSeoSettings(newSeoSettings)
      setHasUnsavedChanges(false)
      toast.success('SEO settings updated successfully!')
    } catch (error) {
      handleError(error)
      toast.error('Failed to update SEO settings')
      throw error
    }
  }, [contentId, siteId, pageData])

  // Save content to database
  const handleContentSave = useCallback(async (content: PageContent) => {
    if (!contentId || !siteId || !unifiedContent) {
      throw new Error('Missing required information to save')
    }

    const metaData = {
      layout: content.layout,
      ...content.settings
    }

    await updateContent(
      supabase,
      siteId,
      contentId,
      {
        title: pageData?.title || '',
        meta_data: metaData as any,
        content: serializePageContent(content),
        content_type: content.layout === 'blog' ? 'blog_post' : 'page'
      }
    )
    
    setUnifiedContent({
      ...content,
      title: unifiedContent.title,
      subtitle: unifiedContent.subtitle
    })
    
    setHasUnsavedChanges(false)
  }, [contentId, siteId, unifiedContent, pageData?.title])

  return {
    pageData,
    setPageData,
    isLoading,
    pageContent,
    setPageContent,
    unifiedContent,
    setUnifiedContent,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    // Database column values
    slug,
    isPublished,
    seoSettings,
    // Handlers
    handleTitleChange,
    handleContentChange,
    handleContentSave,
    handleSlugChange,
    handlePublishedChange,
    handleSEOChange
  }
}