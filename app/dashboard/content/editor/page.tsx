'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/src/components/ui/dropdown-menu'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff,
  Settings, 
  Layout,
  Smartphone,
  Tablet,
  Monitor,
  FileText,
  Grid3X3,
  User,
  Package,
  Phone,
  Edit2,
  Layers,
  MousePointer,
  PanelLeftOpen,
  PanelLeftClose
} from 'lucide-react'
import { toast } from 'sonner'

// Import layout preview components
import { LandingPagePreview } from '@/src/components/layout-previews/LandingPagePreview'
import { EditableLandingPagePreview } from '@/src/components/layout-previews/EditableLandingPagePreview'
import { BlogArticlePreview } from '@/src/components/layout-previews/BlogArticlePreview'
import { PortfolioGridPreview } from '@/src/components/layout-previews/PortfolioGridPreview'
import { AboutCompanyPreview } from '@/src/components/layout-previews/AboutCompanyPreview'
import { ProductPagePreview } from '@/src/components/layout-previews/ProductPagePreview'
import { ContactServicesPreview } from '@/src/components/layout-previews/ContactServicesPreview'
import { OtherLayoutPreview } from '@/src/components/layout-previews/OtherLayoutPreview'

// Import enhanced content editor components
import { ContentEditor, SectionManager } from '@/src/components/content-editor'
import { VisualEditor } from '@/src/components/content-editor/visual/VisualEditor'
import { PageContent, LayoutType as ContentLayoutType, ContentSection, serializePageContent, deserializePageContent, isPageContent } from '@/src/lib/content'
import { useContentEditor } from '@/src/hooks/useContentEditor'
import { handleError } from '@/src/lib/types/error-handling'
import { EditModeProvider, useEditMode, EditMode } from '@/src/contexts/EditModeContext'
import { VisualEditorProvider } from '@/src/contexts/VisualEditorContext'
import { useSiteTheme } from '@/src/hooks/useSiteTheme'

type LayoutType = 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact' | 'other'
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
  contact: { name: 'Contact/Services', icon: Phone, component: ContactServicesPreview },
  other: { name: 'Custom/Other', icon: Layers, component: OtherLayoutPreview }
}

const viewportSizes = {
  mobile: { width: '390px', icon: Smartphone, label: 'Mobile' },
  tablet: { width: '768px', icon: Tablet, label: 'Tablet' },
  desktop: { width: '100%', icon: Monitor, label: 'Desktop' }
}

function PageEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentId = searchParams?.get('id') || null
  const { currentSite } = useSiteContext()
  const { editMode, setEditMode, isDirty, setIsDirty } = useEditMode()
  const { theme } = useSiteTheme()
  
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeViewport, setActiveViewport] = useState<ViewportSize>('desktop')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pageContent, setPageContent] = useState<PageContent | null>(null)
  const [unifiedContent, setUnifiedContent] = useState<UnifiedPageContent | null>(null)
  const [activeSectionKey, setActiveSectionKey] = useState<string | undefined>()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const contentEditorRef = useRef<{ resetDirtyState: () => void } | null>(null)

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
    // Update pageData with new title
    setPageData(prev => {
      if (!prev) return prev
      return { ...prev, title: value }
    })
    
    // Also update unified content title for header display
    setUnifiedContent(prev => {
      if (!prev) return prev
      return { ...prev, title: value }
    })
    
    setHasUnsavedChanges(true)
  }, [])

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
        title: pageData?.title || '',
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
    
    // Clear the unsaved changes flag in the parent component
    setHasUnsavedChanges(false)
  }, [contentId, currentSite?.id, unifiedContent, pageData?.title])

  // Handle section visibility toggle
  const toggleSectionVisibility = useCallback((sectionKey: string) => {
    if (!pageContent) return
    
    const currentSection = pageContent.sections[sectionKey]
    if (!currentSection) return
    
    const updatedContent: PageContent = {
      ...pageContent,
      sections: {
        ...pageContent.sections,
        [sectionKey]: {
          ...currentSection,
          visible: !currentSection.visible
        }
      }
    }
    
    handleContentChange(updatedContent, true)
  }, [pageContent, handleContentChange])

  // Content editor hook for section management - defined after handlers
  const contentEditorHook = useContentEditor({
    contentId: contentId || '',
    siteId: currentSite?.id || '',
    layout: (pageData?.layout as ContentLayoutType) || 'landing',
    initialContent: pageContent || undefined,
    onSave: handleContentSave,
    onContentChange: handleContentChange
  })

  if (isLoading || !pageData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">
            {isLoading ? 'Loading content...' : 'Preparing editor...'}
          </p>
        </div>
      </div>
    )
  }

  // Validate layout exists in layoutInfo
  const validLayout = pageData.layout in layoutInfo ? pageData.layout : 'landing'
  const CurrentLayoutComponent = layoutInfo[validLayout].component
  const LayoutIcon = layoutInfo[validLayout].icon

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
      // Reset ContentEditor's dirty state
      contentEditorRef.current?.resetDirtyState?.()
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-10">
        {/* Main Navigation */}
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="cursor-pointer transition-all hover:bg-gradient-primary-50"
              onClick={() => router.push('/dashboard/content')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-blue-100 ">
                <LayoutIcon className="h-4 w-4 text-blue-600 " />
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
                <p className="text-xs text-gray-500">
                  {layoutInfo[validLayout].name}
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
                    className="h-8 px-3 cursor-pointer transition-all hover:bg-gradient-primary-50"
                    onClick={() => setActiveViewport(size as ViewportSize)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                )
              })}
            </div>


            {/* Actions */}
            <Button 
              variant="outline" 
              size="sm"
              className="cursor-pointer transition-all hover:bg-gradient-primary-50"
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

        {/* Visual Editor Controls - Always shown */}
        {pageContent && (
          <div className="border-t bg-gray-50/50 px-6 flex items-center justify-between text-sm h-[2.5rem]" >
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle */}
              <Button 
                variant={isSidebarOpen ? "secondary" : "ghost"} 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <PanelLeftOpen className="w-3.5 h-3.5 mr-1" />
                )}
                {isSidebarOpen ? 'Close Panel' : 'Open Panel'}
              </Button>
              
              <Separator orientation="vertical" className="h-4" />
              
              {/* Element count */}
              <div className="flex items-center gap-2 text-gray-600">
                <MousePointer className="w-3.5 h-3.5" />
                <span>0 elements</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sections dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <Layers className="w-3.5 h-3.5 mr-1" />
                    Sections ({Object.keys(pageContent.sections).filter(key => pageContent.sections[key].visible !== false).length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Page Sections
                    <Badge variant="secondary" className="text-xs">
                      {Object.keys(pageContent.sections).length} total
                    </Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {Object.entries(pageContent.sections).map(([key, section]) => (
                    <DropdownMenuItem
                      key={key}
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleSectionVisibility(key)}
                    >
                      <div className="flex items-center gap-2">
                        {section.visible !== false ? (
                          <Eye className="w-3 h-3 text-green-600" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-gray-400" />
                        )}
                        <span className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  
                  {Object.keys(pageContent.sections).length === 0 && (
                    <DropdownMenuItem disabled>
                      No sections available
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Separator orientation="vertical" className="h-4" />
              
              {/* Settings */}
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <Settings className="w-3.5 h-3.5 mr-1" />
                Settings
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar - Controlled by toggle */}
        {isSidebarOpen && (
          <div className="w-96 border-r bg-muted/30 flex flex-col h-full overflow-hidden">
            <Tabs defaultValue="content" className="w-full h-full flex flex-col">
              <div className="p-4 border-b flex-shrink-0">
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
                        const isActive = validLayout === layoutKey
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
                                <p className="text-xs text-gray-500">
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
              
              <TabsContent value="content" className="mt-0 flex-1 overflow-hidden flex flex-col">
                {contentId && currentSite?.id && (
                  <div className="flex-1 overflow-y-auto">
                    {/* Content Editor with integrated title/subtitle */}
                    <ContentEditor
                      ref={contentEditorRef}
                      contentId={contentId}
                      siteId={currentSite.id}
                      layout={validLayout as ContentLayoutType}
                      initialContent={pageContent || undefined}
                      onSave={handleContentSave}
                      onContentChange={handleContentChange}
                      title={pageData.title}
                      onTitleChange={handleTitleChange}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sections" className="mt-0 flex-1 overflow-hidden flex flex-col">
                {(pageContent || contentEditorHook.content) && (
                  <div className="flex-1 overflow-y-auto">
                    <SectionManager
                      content={pageContent || contentEditorHook.content}
                      layout={validLayout as ContentLayoutType}
                      onToggleVisibility={contentEditorHook.toggleSectionVisibility}
                      onMoveUp={contentEditorHook.moveSectionUp}
                      onMoveDown={contentEditorHook.moveSectionDown}
                      onReorderSections={contentEditorHook.reorderSections}
                      onSectionClick={setActiveSectionKey}
                      activeSectionKey={activeSectionKey}
                      isDraggingEnabled={true}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Preview Area - Always shows Visual Editor */}
        <div className="flex-1 bg-muted/20 overflow-hidden">
          <VisualEditor
            content={pageContent || { version: '1.0', layout: validLayout as ContentLayoutType, sections: {} }}
            layout={validLayout as ContentLayoutType}
            title={pageData.title}
            subtitle={
              typeof pageContent?.sections?.hero?.data?.subtitle === 'string' 
                ? pageContent.sections.hero.data.subtitle
                : typeof pageContent?.sections?.header?.data?.subtitle === 'string'
                ? pageContent.sections.header.data.subtitle  
                : pageData.subtitle
            }
            onContentChange={(content) => {
              handleContentChange(content, true)
            }}
            onTitleChange={handleTitleChange}
            onSubtitleChange={(subtitle) => {
              setPageData(prev => prev ? { ...prev, subtitle } : null)
              setHasUnsavedChanges(true)
            }}
            viewport={activeViewport}
            className="h-full w-full"
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t bg-muted/30 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="font-medium">{layoutInfo[validLayout].name}</span>
            <span className="text-gray-500/50">•</span>
            <span>{viewportSizes[activeViewport].label} View</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Last saved: Never</span>
            {hasUnsavedChanges && (
              <>
                <span className="text-gray-500/50">•</span>
                <span className="text-orange-600">Unsaved changes</span>
              </>
            )}
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default function PageEditorPage() {
  return (
    <EditModeProvider defaultMode="inline">
      <VisualEditorProvider>
        <PageEditorContent />
      </VisualEditorProvider>
    </EditModeProvider>
  )
}