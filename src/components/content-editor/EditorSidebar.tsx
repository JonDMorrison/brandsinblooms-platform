import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { 
  Layout,
  FileText,
  Grid3X3,
  User,
  Package,
  Phone,
  Layers
} from 'lucide-react'
import { ContentEditor, SectionManager } from '@/src/components/content-editor'
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
                      onClick={() => onLayoutChange(layoutKey as LayoutType)}
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
          <div className="flex-1 overflow-y-auto">
            <ContentEditor
              ref={contentEditorRef}
              contentId={contentId}
              siteId={siteId}
              layout={validLayout as ContentLayoutType}
              initialContent={pageContent || undefined}
              onSave={onContentSave}
              onContentChange={onContentChange}
              title={pageData.title}
              onTitleChange={onTitleChange}
            />
          </div>
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
                onSectionClick={onSectionClick}
                activeSectionKey={activeSectionKey}
                isDraggingEnabled={true}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}