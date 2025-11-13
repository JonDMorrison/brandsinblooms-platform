import { useRouter } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/src/components/ui/tooltip'
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
  Smartphone,
  Tablet,
  Monitor,
  Layers,
  PanelLeftOpen,
  PanelLeftClose,
  Lock
} from 'lucide-react'
import { PageContent, LAYOUT_SECTIONS } from '@/src/lib/content'

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
  landing: { name: 'Landing Page' },
  blog: { name: 'Blog Article' },
  portfolio: { name: 'Portfolio Grid' },
  about: { name: 'About/Company' },
  product: { name: 'Product Page' },
  contact: { name: 'Contact/Services' },
  other: { name: 'Custom/Other' }
}

const viewportSizes = {
  mobile: { icon: Smartphone, label: 'Mobile', width: '390px' },
  tablet: { icon: Tablet, label: 'Tablet', width: '768px' },
  desktop: { icon: Monitor, label: 'Desktop', width: '100%' }
}

interface EditorHeaderProps {
  pageData: PageData
  unifiedContent: UnifiedPageContent | null
  hasUnsavedChanges: boolean
  isSaving: boolean
  activeViewport: ViewportSize
  isSidebarOpen: boolean
  pageContent: PageContent | null
  onSave: () => void
  onViewportChange: (viewport: ViewportSize) => void
  onSidebarToggle: () => void
  onSectionVisibilityToggle: (sectionKey: string) => void
}

export function EditorHeader({
  pageData,
  unifiedContent,
  hasUnsavedChanges,
  isSaving,
  activeViewport,
  isSidebarOpen,
  pageContent,
  onSave,
  onViewportChange,
  onSidebarToggle,
  onSectionVisibilityToggle
}: EditorHeaderProps) {
  const router = useRouter()
  const validLayout = pageData.layout in layoutInfo ? pageData.layout : 'landing'

  return (
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
            <div className="p-1.5 rounded-md bg-blue-100">
              <Layers className="h-4 w-4 text-blue-600" />
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
          <TooltipProvider>
            <div className="hidden md:flex items-center bg-muted rounded-md p-1">
              {Object.entries(viewportSizes).map(([size, config]) => {
                const Icon = config.icon
                return (
                  <Tooltip key={size}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeViewport === size ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 px-3 cursor-pointer transition-all hover:bg-gradient-primary-50"
                        onClick={() => onViewportChange(size as ViewportSize)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{config.label} ({config.width})</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </TooltipProvider>

          {/* Actions */}
          <Button 
            size="sm"
            className="cursor-pointer transition-all disabled:cursor-not-allowed hover:bg-gradient-primary-50"
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Visual Editor Controls */}
      {pageContent && (
        <div className="border-t bg-gray-50/50 px-6 flex items-center justify-between text-sm h-[2.5rem]">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle */}
            <Button
              variant={isSidebarOpen ? "secondary" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onSidebarToggle}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-3.5 h-3.5 mr-1" />
              ) : (
                <PanelLeftOpen className="w-3.5 h-3.5 mr-1" />
              )}
              CONTENT BLOCKS
            </Button>
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

                {Object.entries(pageContent.sections)
                  .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
                  .map(([key, section]) => {
                    const layoutConfig = LAYOUT_SECTIONS[validLayout as keyof typeof LAYOUT_SECTIONS]
                    const isRequired = layoutConfig?.required.includes(key)

                    return (
                      <DropdownMenuItem
                        key={key}
                        className={`flex items-center justify-between ${
                          isRequired ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                        }`}
                        onClick={() => !isRequired && onSectionVisibilityToggle(key)}
                      >
                        <div className="flex items-center gap-2">
                          {section.visible !== false ? (
                            <Eye className={`w-3 h-3 ${
                              isRequired ? 'text-gray-400' : 'text-green-600'
                            }`} />
                          ) : (
                            <EyeOff className="w-3 h-3 text-gray-400" />
                          )}
                          <span className="capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        {isRequired && (
                          <Lock className="w-3 h-3 text-amber-600" />
                        )}
                      </DropdownMenuItem>
                    )
                  })}
                
                {Object.keys(pageContent.sections).length === 0 && (
                  <DropdownMenuItem disabled>
                    No sections available
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Separator orientation="vertical" className="h-4" />
          </div>
        </div>
      )}
    </div>
  )
}