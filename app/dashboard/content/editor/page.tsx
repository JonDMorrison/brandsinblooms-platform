'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import { getContentById, updateContent } from '@/src/lib/queries/domains/content'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Settings, 
  Layout,
  Smartphone,
  Tablet,
  Monitor,
  FileText,
  Grid3X3,
  User,
  Package,
  Phone
} from 'lucide-react'
import { toast } from 'sonner'

// Import layout preview components
import { LandingPagePreview } from '@/src/components/layout-previews/LandingPagePreview'
import { BlogArticlePreview } from '@/src/components/layout-previews/BlogArticlePreview'
import { PortfolioGridPreview } from '@/src/components/layout-previews/PortfolioGridPreview'
import { AboutCompanyPreview } from '@/src/components/layout-previews/AboutCompanyPreview'
import { ProductPagePreview } from '@/src/components/layout-previews/ProductPagePreview'
import { ContactServicesPreview } from '@/src/components/layout-previews/ContactServicesPreview'

// Import enhanced content editor components
import { ContentEditor, SectionManager } from '@/src/components/content-editor'
import { PageContent, LayoutType as ContentLayoutType, serializePageContent, deserializePageContent } from '@/src/lib/content'
import { handleError } from '@/src/lib/types/error-handling'

type LayoutType = 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact'
type ViewportSize = 'mobile' | 'tablet' | 'desktop'

interface PageData {
  title: string
  subtitle?: string
  layout: LayoutType
}

interface UnifiedPageContent extends PageContent {
  title?: string
  subtitle?: string
}

const layoutInfo = {
  landing: { name: 'Landing Page', icon: Layout, component: LandingPagePreview },
  blog: { name: 'Blog Article', icon: FileText, component: BlogArticlePreview },
  portfolio: { name: 'Portfolio Grid', icon: Grid3X3, component: PortfolioGridPreview },
  about: { name: 'About/Company', icon: User, component: AboutCompanyPreview },
  product: { name: 'Product Page', icon: Package, component: ProductPagePreview },
  contact: { name: 'Contact/Services', icon: Phone, component: ContactServicesPreview }
}

const viewportSizes = {
  mobile: { width: '390px', icon: Smartphone, label: 'Mobile' },
  tablet: { width: '768px', icon: Tablet, label: 'Tablet' },
  desktop: { width: '100%', icon: Monitor, label: 'Desktop' }
}

export default function PageEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentId = searchParams?.get('id') || null
  const { currentSite } = useSiteContext()
  
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeViewport, setActiveViewport] = useState<ViewportSize>('desktop')
  const [isPreviewMode, setIsPreviewMode] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pageContent, setPageContent] = useState<PageContent | null>(null)
  const [unifiedContent, setUnifiedContent] = useState<UnifiedPageContent | null>(null)
  const [activeSectionKey, setActiveSectionKey] = useState<string | undefined>()

  useEffect(() => {
    // Wait for searchParams to be available before proceeding
    if (!searchParams) {
      return
    }

    async function loadContent() {
      // If we have a content ID, load it from the database
      if (contentId && currentSite?.id) {
        setIsLoading(true)
        
        try {
          const content = await getContentById(supabase, currentSite.id, contentId)
          
          // Extract page data from the content
          const metaData = content.meta_data as Record<string, unknown>
          const contentData = content.content as Record<string, unknown>
          const layout = metaData?.layout || contentData?.layout || 'landing'
          
          const pageData: PageData = {
            title: content.title,
            subtitle: typeof metaData?.subtitle === 'string' ? metaData.subtitle : '',
            layout: layout as LayoutType
          }
          
          setPageData(pageData)
          
          // Deserialize the page content if available
          if (content.content) {
            const deserialized = deserializePageContent(content.content)
            if (deserialized) {
              // Migrate subtitle from meta_data to hero section if needed
              const heroSection = deserialized.sections.hero || deserialized.sections.header
              if (heroSection && metaData?.subtitle && !heroSection.data.subtitle) {
                heroSection.data = {
                  ...heroSection.data,
                  subtitle: metaData.subtitle
                }
              }
              
              setPageContent(deserialized)
              // Create unified content with title (subtitle is now in hero section)
              setUnifiedContent({
                ...deserialized,
                title: content.title,
                subtitle: '' // Subtitle is in hero section data
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
              subtitle: '' // Subtitle is in hero section data
            })
          }
        } catch (error) {
          console.error('Editor: Error loading content:', error)
          toast.error('Failed to load content')
          router.push('/dashboard/content')
        } finally {
          setIsLoading(false)
        }
      } else if (contentId && !currentSite?.id) {
        // We have a content ID but site context isn't ready yet
        return
      } else {
        // Fallback: Check sessionStorage for legacy support
        if (typeof window !== 'undefined') {
          const storedData = sessionStorage.getItem('newPageData')
          
          if (storedData) {
            try {
              const { pageData: data } = JSON.parse(storedData)
              setPageData(data)
              setIsLoading(false)
            } catch (error) {
              console.error('Editor: Error parsing stored data:', error)
              router.push('/dashboard/content/new')
            }
          } else {
            router.push('/dashboard/content/new')
          }
        }
      }
    }
    
    loadContent()
  }, [contentId, currentSite?.id, router, searchParams])

  // Handler for title changes (database column)
  const handleTitleChange = useCallback((value: string) => {
    console.log('[handleTitleChange] Called with:', value)
    console.log('[handleTitleChange] Current pageData.title:', pageData?.title)
    
    // Update pageData with new title
    setPageData(prev => {
      console.log('[handleTitleChange] Updating pageData from:', prev?.title, 'to:', value)
      if (!prev) return prev
      return { ...prev, title: value }
    })
    
    // Also update unified content title for header display
    setUnifiedContent(prev => {
      console.log('[handleTitleChange] Updating unifiedContent from:', prev?.title, 'to:', value)
      if (!prev) return prev
      return { ...prev, title: value }
    })
    
    setHasUnsavedChanges(true)
  }, [pageData?.title])

  const handleContentChange = useCallback((content: PageContent, hasChanges: boolean) => {
    setPageContent(content)
    // Update unified content with new sections
    setUnifiedContent(prev => {
      if (!prev && pageData) {
        return { 
          ...content, 
          title: pageData.title || '', 
          subtitle: '' // Subtitle is now in hero section data
        }
      }
      if (!prev) return null
      // Preserve title from pageData
      return {
        ...content,
        title: pageData?.title || prev.title,
        subtitle: '' // Subtitle is now in hero section data
      }
    })
    // Set hasUnsavedChanges based on ContentEditor's isDirty state
    if (hasChanges) {
      setHasUnsavedChanges(true)
    }
  }, [pageData])

  const handleContentSave = useCallback(async (content: PageContent) => {
    if (!contentId || !currentSite?.id || !unifiedContent) {
      throw new Error('Missing required information to save')
    }

    const metaData = {
      layout: content.layout,
      ...content.settings
    }

    await updateContent(
      supabase,
      currentSite.id,
      contentId,
      {
        title: pageData.title || '',
        meta_data: metaData,
        content: serializePageContent(content),
        content_type: content.layout === 'blog' ? 'blog_post' : 'page'
      }
    )
    
    // Update unified content with saved data
    setUnifiedContent({
      ...content,
      title: unifiedContent.title,
      subtitle: unifiedContent.subtitle
    })
  }, [contentId, currentSite?.id, unifiedContent])

  if (isLoading || !pageData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">
            {isLoading ? 'Loading content...' : 'Preparing editor...'}
          </p>
        </div>
      </div>
    )
  }

  const CurrentLayoutComponent = layoutInfo[pageData.layout].component
  const LayoutIcon = layoutInfo[pageData.layout].icon

  const handleSave = async () => {
    if (!contentId || !currentSite?.id || !unifiedContent) {
      toast.error('Missing required information to save')
      return
    }

    setIsSaving(true)
    try {
      // Prepare the update data - subtitle is now in hero section data
      const metaData = {
        layout: pageContent?.layout || unifiedContent.layout,
        ...(pageContent?.settings || unifiedContent.settings || {})
      }

      const contentData = serializePageContent(
        pageContent || {
          version: unifiedContent.version,
          layout: unifiedContent.layout,
          sections: unifiedContent.sections,
          settings: unifiedContent.settings
        }
      )

      // Update the content in the database
      await updateContent(
        supabase,
        currentSite.id,
        contentId,
        {
          title: pageData.title || '',
          meta_data: metaData,
          content: contentData,
          content_type: pageContent?.layout === 'blog' ? 'blog_post' : 'page'
        }
      )

      setHasUnsavedChanges(false)
      toast.success('Content saved successfully!')
    } catch (error) {
      handleError(error)
      console.error('Failed to save content:', error)
      toast.error('Failed to save content. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    // Open preview in new tab (simulated)
    toast.info('Preview would open in a new tab')
  }

  const handleLayoutChange = (newLayout: LayoutType) => {
    if (!pageData) return
    setPageData({ ...pageData, layout: newLayout })
    if (unifiedContent) {
      setUnifiedContent({ ...unifiedContent, layout: newLayout as ContentLayoutType })
    }
    setHasUnsavedChanges(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="cursor-pointer transition-all hover:bg-gray-100"
              onClick={() => router.push('/dashboard/content')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900">
                <LayoutIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">{unifiedContent?.title || pageData.title}</h1>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Unsaved
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {layoutInfo[pageData.layout].name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Viewport Toggle */}
            <div className="hidden md:flex items-center bg-muted rounded-md p-1">
              {Object.entries(viewportSizes).map(([size, config]) => {
                const Icon = config.icon
                return (
                  <Button
                    key={size}
                    variant={activeViewport === size ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 px-3 cursor-pointer transition-all hover:bg-gray-100"
                    onClick={() => setActiveViewport(size as ViewportSize)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                )
              })}
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center bg-muted rounded-md p-1">
              <Button
                variant={isPreviewMode ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3 cursor-pointer transition-all hover:bg-gray-100"
                onClick={() => setIsPreviewMode(true)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Preview
              </Button>
              <Button
                variant={!isPreviewMode ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3 cursor-pointer transition-all hover:bg-gray-100"
                onClick={() => setIsPreviewMode(false)}
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </div>

            {/* Actions */}
            <Button 
              variant="outline" 
              size="sm"
              className="cursor-pointer transition-all hover:bg-gray-100"
              onClick={handlePreview}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Preview
            </Button>
            <Button 
              size="sm"
              className="cursor-pointer transition-all disabled:cursor-not-allowed"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar (Edit Mode) */}
        {!isPreviewMode && (
          <div className="w-96 border-r bg-muted/30 overflow-y-auto flex">
            <div className="flex-1">
              <Tabs defaultValue="content" className="w-full h-full flex flex-col">
                <div className="p-4 border-b">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="sections">Sections</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="layout" className="mt-0 flex-1 overflow-y-auto">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Page Layout</h3>
                      <div className="space-y-2">
                        {Object.entries(layoutInfo).map(([layoutKey, info]) => {
                          const Icon = info.icon
                          const isActive = pageData.layout === layoutKey
                          return (
                            <div
                              key={layoutKey}
                              className={`
                                p-3 border rounded-lg cursor-pointer transition-all hover:border-primary/50
                                ${isActive 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border bg-card'
                                }
                              `}
                              onClick={() => handleLayoutChange(layoutKey as LayoutType)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`
                                  p-1.5 rounded-md 
                                  ${isActive 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                                  }
                                `}>
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{info.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {isActive ? 'Current layout' : 'Click to switch'}
                                  </p>
                                </div>
                                {isActive && (
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                  </div>
                </TabsContent>
                
                <TabsContent value="content" className="mt-0 flex-1 flex flex-col">
                  {contentId && currentSite?.id && (
                    <div className="flex flex-col h-full">
                      {/* Content Editor with integrated title/subtitle */}
                      {console.log('[Parent] Passing title to ContentEditor:', pageData.title)}
                      <ContentEditor
                        contentId={contentId}
                        siteId={currentSite.id}
                        layout={pageData.layout as ContentLayoutType}
                        initialContent={pageContent || undefined}
                        onSave={handleContentSave}
                        onContentChange={handleContentChange}
                        title={pageData.title}
                        onTitleChange={handleTitleChange}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="sections" className="mt-0 flex-1 flex flex-col">
                  {pageContent && (
                    <SectionManager
                      content={pageContent}
                      layout={pageData.layout as ContentLayoutType}
                      onToggleVisibility={() => {}} // Handled by ContentEditor
                      onMoveUp={() => {}} // Handled by ContentEditor
                      onMoveDown={() => {}} // Handled by ContentEditor
                      onSectionClick={setActiveSectionKey}
                      activeSectionKey={activeSectionKey}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* Preview Area */}
        <div className="flex-1 bg-muted/20 overflow-auto">
          <div className="min-h-full p-6 flex items-start justify-center">
            <div 
              className="bg-background border rounded-lg shadow-sm overflow-hidden transition-all duration-300"
              style={{ 
                width: viewportSizes[activeViewport].width,
                minHeight: '600px',
                maxWidth: '100%',
                containerType: 'inline-size'
              }}
            >
              <CurrentLayoutComponent 
                title={pageData.title}
                content={pageContent || undefined}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t bg-muted/30 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="font-medium">{layoutInfo[pageData.layout].name}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{viewportSizes[activeViewport].label} View</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Last saved: Never</span>
            {hasUnsavedChanges && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-orange-600">Unsaved changes</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}