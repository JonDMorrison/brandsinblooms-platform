'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

// UI Components
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/src/components/ui/dropdown-menu'

// Icons
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff,
  Layout,
  Smartphone,
  Tablet,
  Monitor,
  FileText,
  Grid3X3,
  User,
  Package,
  Phone,
  Layers,
  MousePointer,
  PanelLeftOpen,
  PanelLeftClose
} from 'lucide-react'

// Database & State
import { supabase } from '@/src/lib/supabase/client'
import { getContentById, updateContent } from '@/src/lib/queries/domains/content'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { EditModeProvider, useEditMode } from '@/src/contexts/EditModeContext'
import { VisualEditorProvider } from '@/src/contexts/VisualEditorContext'

// Content Management
import { ContentEditor, SectionManager } from '@/src/components/content-editor'
import { VisualEditor } from '@/src/components/content-editor/visual/VisualEditor'
import { InlineLoader } from '@/src/components/content-editor/visual/LoadingStates'
import { 
  PageContent, 
  LayoutType as ContentLayoutType, 
  serializePageContent, 
  deserializePageContent 
} from '@/src/lib/content'
import { useContentEditor } from '@/src/hooks/useContentEditor'
import { handleError } from '@/src/lib/types/error-handling'
import { useSiteTheme } from '@/src/hooks/useSiteTheme'

// Types
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

// Configuration
const layoutInfo = {
  landing: { name: 'Landing Page', icon: Layout },
  blog: { name: 'Blog Article', icon: FileText },
  portfolio: { name: 'Portfolio Grid', icon: Grid3X3 },
  about: { name: 'About/Company', icon: User },
  product: { name: 'Product Page', icon: Package },
  contact: { name: 'Contact/Services', icon: Phone },
  other: { name: 'Custom/Other', icon: Layers }
}

const viewportSizes = {
  mobile: { width: '390px', icon: Smartphone, label: 'Mobile' },
  tablet: { width: '768px', icon: Tablet, label: 'Tablet' },
  desktop: { width: '100%', icon: Monitor, label: 'Desktop' }
}

// Import the extracted components
import { EditorHeader } from '@/src/components/content-editor/EditorHeader'
import { EditorSidebar } from '@/src/components/content-editor/EditorSidebar'
import { EditorStatusBar } from '@/src/components/content-editor/EditorStatusBar'
import { useContentEditorData } from '@/src/hooks/useContentEditorData'

function PageEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentId = searchParams?.get('id') || null
  const { currentSite, loading: siteLoading } = useSiteContext()
  const { editMode, setEditMode, isDirty, setIsDirty } = useEditMode()
  const { theme } = useSiteTheme()
  
  // UI state
  const [activeViewport, setActiveViewport] = useState<ViewportSize>('desktop')
  const [isSaving, setIsSaving] = useState(false)
  const [activeSectionKey, setActiveSectionKey] = useState<string | undefined>()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const contentEditorRef = useRef<{ resetDirtyState: () => void } | null>(null)
  
  // Content data management
  const {
    pageData,
    setPageData,
    isLoading,
    pageContent,
    setPageContent,
    unifiedContent,
    setUnifiedContent,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleTitleChange,
    handleContentChange,
    handleContentSave
  } = useContentEditorData({
    contentId,
    siteId: currentSite?.id,
    siteLoading
  })


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

  const handleLayoutChange = (newLayout: LayoutType) => {
    if (!pageData) return
    setPageData({ ...pageData, layout: newLayout })
    if (unifiedContent) {
      setUnifiedContent({ ...unifiedContent, layout: newLayout as ContentLayoutType })
    }
    setHasUnsavedChanges(true)
  }

  if (isLoading || !pageData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <InlineLoader 
            size="md" 
            message={isLoading ? 'Loading content...' : 'Preparing editor...'} 
          />
        </div>
      </div>
    )
  }

  const validLayout = pageData.layout in layoutInfo ? pageData.layout : 'landing'

  return (
    <div className="h-full flex flex-col bg-white">
      <EditorHeader
        pageData={pageData}
        unifiedContent={unifiedContent}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        activeViewport={activeViewport}
        isSidebarOpen={isSidebarOpen}
        pageContent={pageContent}
        onSave={handleSave}
        onViewportChange={setActiveViewport}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSectionVisibilityToggle={toggleSectionVisibility}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {isSidebarOpen && contentId && currentSite?.id && (
          <EditorSidebar
            contentId={contentId}
            siteId={currentSite.id}
            pageData={pageData}
            pageContent={pageContent}
            activeSectionKey={activeSectionKey}
            contentEditorRef={contentEditorRef}
            onLayoutChange={handleLayoutChange}
            onContentSave={handleContentSave}
            onContentChange={handleContentChange}
            onTitleChange={handleTitleChange}
            onSectionClick={setActiveSectionKey}
          />
        )}

        {/* Visual Editor */}
        <div className="flex-1 bg-muted/20 overflow-hidden">
          <VisualEditor
            content={(() => {
              const content = pageContent || { version: '1.0', layout: validLayout as ContentLayoutType, sections: {} }
              return content
            })()}
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

      <EditorStatusBar
        layout={validLayout}
        activeViewport={activeViewport}
        hasUnsavedChanges={hasUnsavedChanges}
      />
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