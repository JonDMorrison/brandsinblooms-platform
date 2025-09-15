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
  Layers
} from 'lucide-react'
import { ContentEditor, SectionManager } from '@/src/components/content-editor'
import { CombinedSectionManager } from './CombinedSectionManager'
import { PageContent, LayoutType as ContentLayoutType } from '@/src/lib/content'
import { useContentEditor } from '@/src/hooks/useContentEditor'

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
  onSectionClick
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

  return (
    <div className="w-96 border-r bg-muted/30 flex flex-col overflow-hidden">
      <Tabs defaultValue="combined" className="w-full h-full flex flex-col">
        <div className="p-4 border-b flex-shrink-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Page</TabsTrigger>
            <TabsTrigger value="combined">Sections</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="settings" className="mt-0 flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Page Settings</h3>
              
              {/* Page Title */}
              <div className="space-y-2">
                <Label htmlFor="page-title" className="text-xs font-medium">
                  Page Title
                </Label>
                <Input
                  id="page-title"
                  type="text"
                  value={pageData.title || ''}
                  onChange={(e) => onPageTitleChange(e.target.value)}
                  className="h-8"
                  placeholder="Enter page title"
                />
                <p className="text-xs text-gray-500">
                  This is the internal page name and title used for navigation
                </p>
              </div>

              {/* Layout Display (Read-only) */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Current Layout</Label>
                <div className="p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-primary text-primary-foreground">
                      <Settings className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{layoutInfo[validLayout].name}</p>
                      <p className="text-xs text-gray-500">Optimized for {validLayout} pages</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="combined" className="mt-0 flex-1 overflow-hidden flex flex-col">
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
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}