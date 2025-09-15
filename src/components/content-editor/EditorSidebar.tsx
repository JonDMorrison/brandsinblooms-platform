import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { 
  Settings,
  Layout,
  FileText,
  Grid3X3,
  User,
  Package,
  Phone,
  Layers,
  Globe,
  Search
} from 'lucide-react'
import { ContentEditor, SectionManager } from '@/src/components/content-editor'
import { CombinedSectionManager } from './CombinedSectionManager'
import { PageTab } from './PageTab'
import { SEOTab } from './SEOTab'
import { PageContent, LayoutType as ContentLayoutType, SEOSettings } from '@/src/lib/content'
import { useContentEditor } from '@/src/hooks/useContentEditor'
import { usePageSettings } from '@/src/hooks/usePageSettings'

type LayoutType = 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact' | 'other'

interface PageData {
  title: string
  subtitle?: string
  layout: LayoutType
}

const layoutInfo = {
  landing: { name: 'Landing Page', icon: Layout },
  blog: { name: 'Blog Article', icon: FileText },
  portfolio: { name: 'Portfolio Grid', icon: Grid3X3 },
  about: { name: 'About/Company', icon: User },
  product: { name: 'Product Page', icon: Package },
  contact: { name: 'Contact/Services', icon: Phone },
  other: { name: 'Custom/Other', icon: Layers }
}

interface EditorSidebarProps {
  contentId: string
  siteId: string
  pageData: PageData
  pageContent: PageContent | null
  activeSectionKey: string | undefined
  contentEditorRef: React.RefObject<{ resetDirtyState: () => void } | null>
  onLayoutChange: (layout: LayoutType) => void
  onContentSave: (content: PageContent) => Promise<void>
  onContentChange: (content: PageContent, hasChanges: boolean) => void
  onTitleChange: (title: string) => void
  onPageTitleChange: (title: string) => void
  onSectionClick: (sectionKey: string | undefined) => void
  siteUrl?: string
  // Database column props
  initialSlug?: string
  initialIsPublished?: boolean
  onSlugChange?: (slug: string) => void
  onPublishedChange?: (published: boolean) => void
  seoSettings?: SEOSettings
  onSEOChange?: (settings: SEOSettings) => void
}

export function EditorSidebar({
  contentId,
  siteId,
  pageData,
  pageContent,
  activeSectionKey,
  contentEditorRef,
  onLayoutChange,
  onContentSave,
  onContentChange,
  onTitleChange,
  onPageTitleChange,
  onSectionClick,
  siteUrl = 'example.com',
  initialSlug = '',
  initialIsPublished = false,
  onSlugChange,
  onPublishedChange,
  seoSettings,
  onSEOChange
}: EditorSidebarProps) {
  const validLayout = pageData.layout in layoutInfo ? pageData.layout : 'landing'
  
  const contentEditorHook = useContentEditor({
    contentId: contentId || '',
    siteId: siteId || '',
    layout: (pageData?.layout as ContentLayoutType) || 'landing',
    initialContent: pageContent || undefined,
    onSave: onContentSave,
    onContentChange: onContentChange
  })

  // Page settings management using custom hook
  const pageSettingsHook = usePageSettings({
    initialContent: pageContent || contentEditorHook.content,
    initialSlug,
    initialIsPublished,
    pageTitle: pageData.title || '',
    onContentChange: onContentChange,
    onSlugChange,
    onPublishedChange
  })

  return (
    <div className="w-96 border-r bg-muted/30 flex flex-col overflow-hidden">
      <Tabs defaultValue="page" className="w-full h-full flex flex-col">
        <div className="p-4 border-b flex-shrink-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="page">Page</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="page" className="mt-0 flex-1 overflow-y-auto">
          <PageTab
            slug={pageSettingsHook.slug}
            isPublished={pageSettingsHook.isPublished}
            onSlugChange={pageSettingsHook.handleSlugChange}
            onPublishedChange={pageSettingsHook.handlePublishedChange}
            pageTitle={pageData.title || ''}
            onPageTitleChange={onPageTitleChange}
            layout={validLayout as ContentLayoutType}
            siteUrl={siteUrl}
            siteId={siteId}
            contentId={contentId}
          />
        </TabsContent>

        <TabsContent value="seo" className="mt-0 flex-1 overflow-y-auto">
          <SEOTab
            seoSettings={seoSettings || { title: '', description: '', keywords: [] }}
            onSEOChange={onSEOChange || (() => {})}
            pageTitle={pageData.title}
            slug={pageSettingsHook.slug}
          />
        </TabsContent>
        
        <TabsContent value="sections" className="mt-0 flex-1 overflow-hidden flex flex-col">
          {(pageContent || contentEditorHook.content) && (
            <div className="flex-1 overflow-y-auto">
              <CombinedSectionManager
                content={pageContent || contentEditorHook.content}
                layout={validLayout as ContentLayoutType}
                onToggleVisibility={contentEditorHook.toggleSectionVisibility}
                onMoveUp={contentEditorHook.moveSectionUp}
                onMoveDown={contentEditorHook.moveSectionDown}
                onReorderSections={contentEditorHook.reorderSections}
                onSectionClick={onSectionClick}
                activeSectionKey={activeSectionKey}
                isDraggingEnabled={true}
                onSectionUpdate={contentEditorHook.updateSection}
                onAddSection={contentEditorHook.addSection}
                onRemoveSection={contentEditorHook.removeSection}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}