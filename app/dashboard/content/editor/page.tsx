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
  mobile: { width: '375px', icon: Smartphone, label: 'Mobile' },
  tablet: { width: '768px', icon: Tablet, label: 'Tablet' },
  desktop: { width: '100%', icon: Monitor, label: 'Desktop' }
}

export default function PageEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentId = searchParams.get('id')
  const { currentSite } = useSiteContext()
  
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeViewport, setActiveViewport] = useState<ViewportSize>('desktop')
  const [isPreviewMode, setIsPreviewMode] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    async function loadContent() {
      // If we have a content ID, load it from the database
      if (contentId && currentSite?.id) {
        console.log('Editor: Loading content with ID:', contentId)
        setIsLoading(true)
        
        try {
          const content = await getContentById(supabase, currentSite.id, contentId)
          console.log('Editor: Loaded content:', content)
          
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
      } else {
        // Fallback: Check sessionStorage for legacy support
        if (typeof window !== 'undefined') {
          const storedData = sessionStorage.getItem('newPageData')
          
          if (storedData) {
            try {
              const { pageData: data } = JSON.parse(storedData)
              console.log('Editor: Using sessionStorage data:', data)
              setPageData(data)
              setIsLoading(false)
            } catch (error) {
              console.error('Editor: Error parsing stored data:', error)
              router.push('/dashboard/content/new')
            }
          } else {
            console.log('Editor: No content ID or sessionStorage data')
            router.push('/dashboard/content/new')
          }
        }
      }
    }
    
    loadContent()
  }, [contentId, currentSite?.id, router])

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard/content')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Content
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <div className="flex items-center gap-2">
                <LayoutIcon className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-bold">{pageData.title}</h1>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Unsaved
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {layoutInfo[pageData.layout].name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Viewport Toggle */}
            <div className="flex items-center border rounded-md">
              {Object.entries(viewportSizes).map(([size, config]) => {
                const Icon = config.icon
                return (
                  <Button
                    key={size}
                    variant={activeViewport === size ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none first:rounded-l-md last:rounded-r-md"
                    onClick={() => setActiveViewport(size as ViewportSize)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                )
              })}
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={isPreviewMode ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setIsPreviewMode(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant={!isPreviewMode ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setIsPreviewMode(false)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Actions */}
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Edit Mode) */}
        {!isPreviewMode && (
          <div className="w-80 border-r bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <div className="p-6">
              <Tabs defaultValue="layout" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="layout">Layout</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="layout" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Page Layout</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(layoutInfo).map(([layoutKey, info]) => {
                        const Icon = info.icon
                        const isActive = pageData.layout === layoutKey
                        return (
                          <div
                            key={layoutKey}
                            className={`
                              p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm
                              ${isActive 
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' 
                                : 'border-gray-200 dark:border-gray-700'
                              }
                            `}
                            onClick={() => handleLayoutChange(layoutKey as LayoutType)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                p-2 rounded-md 
                                ${isActive 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }
                              `}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{info.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Switch to {info.name.toLowerCase()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Page Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Page Title</label>
                        <p className="text-sm text-muted-foreground mt-1">{pageData.title}</p>
                      </div>
                      {pageData.subtitle && (
                        <div>
                          <label className="text-sm font-medium">Subtitle</label>
                          <p className="text-sm text-muted-foreground mt-1">{pageData.subtitle}</p>
                        </div>
                      )}
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Content editing features will be available in the full editor implementation.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* Preview Area */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-6 overflow-auto">
          <div className="flex justify-center">
            <div 
              className="bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden transition-all duration-300"
              style={{ 
                width: viewportSizes[activeViewport].width,
                minHeight: '600px',
                maxWidth: '100%'
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
      <div className="border-t bg-gray-50 dark:bg-gray-900 px-6 py-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Layout: {layoutInfo[pageData.layout].name}</span>
            <span>•</span>
            <span>Viewport: {viewportSizes[activeViewport].label}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Last saved: Never</span>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}