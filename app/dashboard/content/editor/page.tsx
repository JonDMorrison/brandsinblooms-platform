'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import { getContentById } from '@/src/lib/queries/domains/content'
import { useSiteContext } from '@/src/contexts/SiteContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Separator } from '@/src/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
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

type LayoutType = 'landing' | 'blog' | 'portfolio' | 'about' | 'product' | 'contact'
type ViewportSize = 'mobile' | 'tablet' | 'desktop'

interface PageData {
  title: string
  subtitle?: string
  layout: LayoutType
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
          const metaData = content.meta_data as any
          const contentData = content.content as any
          const layout = metaData?.layout || contentData?.layout || 'landing'
          
          const pageData: PageData = {
            title: content.title,
            subtitle: metaData?.subtitle || '',
            layout: layout as LayoutType
          }
          
          setPageData(pageData)
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

  const handleSave = () => {
    // Simulate save operation
    setHasUnsavedChanges(false)
    toast.success('Page saved successfully!')
  }

  const handlePreview = () => {
    // Open preview in new tab (simulated)
    toast.info('Preview would open in a new tab')
  }

  const handleLayoutChange = (newLayout: LayoutType) => {
    setPageData({ ...pageData, layout: newLayout })
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
                  <h1 className="text-lg font-semibold">{pageData.title}</h1>
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
                    className="h-8 px-3"
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
                className="h-8 px-3"
                onClick={() => setIsPreviewMode(true)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Preview
              </Button>
              <Button
                variant={!isPreviewMode ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3"
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
              onClick={handlePreview}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Preview
            </Button>
            <Button 
              size="sm"
              onClick={handleSave}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar (Edit Mode) */}
        {!isPreviewMode && (
          <div className="w-80 border-r bg-muted/30 overflow-y-auto">
            <div className="p-4">
              <Tabs defaultValue="layout" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="layout">Layout</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="layout" className="mt-4 space-y-4">
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
                </TabsContent>
                
                <TabsContent value="content" className="mt-4 space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Page Settings</h3>
                      <div className="space-y-3 p-3 bg-card rounded-lg border">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Title</label>
                          <p className="text-sm mt-0.5">{pageData.title}</p>
                        </div>
                        {pageData.subtitle && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Subtitle</label>
                            <p className="text-sm mt-0.5">{pageData.subtitle}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        Full content editing features coming soon
                      </p>
                    </div>
                  </div>
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
                subtitle={pageData.subtitle}
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